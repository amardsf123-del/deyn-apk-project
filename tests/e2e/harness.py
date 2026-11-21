"""DEYN e2e harness: real app + real Keygen HTML in Chromium, ephemeral TEST Ed25519 key (never shipped)."""
import os, base64, http.server, json, os, re, socketserver, subprocess, tempfile, threading, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
APP_SRC = ROOT / "deyn-app/www/index.html"
KG_SRC = ROOT / "deyn-keygen/www/index.html"
PROD_PUB = re.search(r"var DEYN_PUBLIC_KEY\s*=\s*'([^']+)'", APP_SRC.read_text(encoding="utf8")).group(1)

def make_test_key():
    js = ("const c=require('crypto');const {publicKey,privateKey}=c.generateKeyPairSync('ed25519');"
          "const raw=Buffer.from(publicKey.export({format:'jwk'}).x,'base64url').toString('base64');"
          "console.log(JSON.stringify({pub:raw,pem:privateKey.export({type:'pkcs8',format:'pem'})}))")
    return json.loads(subprocess.check_output(["node", "-e", js]))

MOCK = r"""
(() => {
  const P='mock_ss:'; const skewInit=parseInt(localStorage.getItem('__skew')||'0',10)||0;
  const R=Date; let skew=skewInit;
  window.__setSkew=v=>{skew=v;localStorage.setItem('__skew',String(v));};
  class D extends R{constructor(...a){if(a.length===0)super(R.now()+skew);else super(...a);} static now(){return R.now()+skew;}}
  window.Date=D;
  window.__failSecure=false;
  window.Capacitor={Plugins:{
    SecureStoragePlugin:{
      get:async({key})=>{const v=localStorage.getItem(P+key);if(v===null)throw new Error('missing');return {value:v};},
      set:async({key,value})=>{if(window.__failSecure)throw new Error('secure storage failure');localStorage.setItem(P+key,value);return {value:true};},
      remove:async({key})=>{localStorage.removeItem(P+key);}},
    Device:{getId:async()=>({identifier:'test-device-'+(localStorage.getItem('__devseed')||'A')})},
    Clipboard:{write:async()=>{},read:async()=>({value:''})}}};
})();

// ---- opt-in AES-GCM stand-in for the native Keystore plugin (TEST ONLY: its key sits in localStorage, the real one never leaves Keystore)
(() => {
  if (!localStorage.getItem('__vault_mock')) return;
  const VK='mock_vault_key', E=new TextEncoder();
  const b64=u=>{let t='';for(const x of u)t+=String.fromCharCode(x);return btoa(t);}, un=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  async function key(){let j=localStorage.getItem(VK),k;if(j)k=await crypto.subtle.importKey('jwk',JSON.parse(j),'AES-GCM',true,['encrypt','decrypt']);else{k=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);localStorage.setItem(VK,JSON.stringify(await crypto.subtle.exportKey('jwk',k)));}return k;}
  window.Capacitor.Plugins.DeynVault={
    status:async()=>{if(localStorage.getItem('__vault_off'))throw new Error('keystore unavailable');await key();return {ready:true};},
    encrypt:async({data,aad})=>{if(localStorage.getItem('__vault_failw'))throw new Error('encrypt failed');const iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:E.encode(aad||'')},await key(),un(data)));return {iv:b64(iv),data:b64(ct)};},
    decrypt:async({iv,data,aad})=>{const pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:un(iv),additionalData:E.encode(aad||'')},await key(),un(data)));return {data:b64(pt)};}
  };
})();
"""

class Site:
    def __init__(self, key=None, prod_key=False, enforce=True, time_pub=None):
        self.dir = Path(tempfile.mkdtemp(prefix="deynsite_"))
        self.key = key or make_test_key()
        pub = PROD_PUB if prod_key else self.key["pub"]
        app = APP_SRC.read_text(encoding="utf8").replace(PROD_PUB, pub)
        if enforce: app = app.replace("enforce:false}", "enforce:true}", 1)
        if time_pub: app = app.replace("pub:'',enforce", "pub:'%s',enforce" % time_pub, 1).replace("url:'',pub", "url:'https://time.test',pub", 1)
        kg = KG_SRC.read_text(encoding="utf8").replace(PROD_PUB, pub)
        (self.dir / "app").mkdir(); (self.dir / "kg").mkdir()
        (self.dir / "app/index.html").write_text(app, encoding="utf8")
        (self.dir / "kg/index.html").write_text(kg, encoding="utf8")
        d = str(self.dir)
        class H(http.server.SimpleHTTPRequestHandler):
            def __init__(s, *a, **k): super().__init__(*a, directory=d, **k)
            def log_message(s, *a): pass
        self.srv = socketserver.TCPServer(("127.0.0.1", 0), H)
        self.port = self.srv.server_address[1]
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
    @property
    def app_url(self): return f"http://localhost:{self.port}/app/index.html"
    @property
    def kg_url(self): return f"http://localhost:{self.port}/kg/index.html"
    def close(self): self.srv.shutdown(); shutil.rmtree(self.dir, ignore_errors=True)

class Env:
    def __init__(self, site, width=360, height=740, vault=False, relay=None):
        self.site = site; self.vault = vault; self.relay = relay
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch()
        self.ctx = self.browser.new_context(viewport={"width": width, "height": height})
        if vault: self.ctx.add_init_script("localStorage.setItem('__vault_mock','1')")
        self.ctx.add_init_script(MOCK)
        if relay: self.ctx.add_init_script(relay.script('main'))
        self.errors = []
        # keygen page (separate context so it has its own origin storage)
        self.kg_ctx = self.browser.new_context(viewport={"width": 390, "height": 800})
        self.kg = self.kg_ctx.new_page()
        self.kg.on("pageerror", lambda e: self.errors.append("KEYGEN: " + str(e)))
        self.kg.goto(site.kg_url)
        self.kg.fill("#privateKey", site.key["pem"])
    def new_app(self):
        pg = self.ctx.new_page()
        pg.on("pageerror", lambda e: self.errors.append("APP: " + str(e)))
        pg.goto(self.site.app_url); pg.wait_for_selector("#agDevId"); pg.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32")
        return pg
    def new_device(self, seed):
        """A separate phone: own storage + own device seed."""
        ctx = self.browser.new_context(viewport={"width": 360, "height": 740})
        if self.vault: ctx.add_init_script("localStorage.setItem('__vault_mock','1')")
        ctx.add_init_script(MOCK)
        if self.relay: ctx.add_init_script(self.relay.script(seed))
        ctx.add_init_script("if(!localStorage.getItem('__devseed'))localStorage.setItem('__devseed','%s')" % seed)
        pg = ctx.new_page(); pg.on("pageerror", lambda e: self.errors.append("APP[%s]: %s" % (seed, e)))
        pg.goto(self.site.app_url); pg.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32")
        return pg
    def dev_id(self, pg): return pg.inner_text("#agDevId").strip()
    def _gen(self, btn):
        self.kg.click(btn); self.kg.wait_for_function("document.getElementById('code').textContent.length>20 || document.getElementById('err').classList.contains('show')")
        if self.kg.evaluate("document.getElementById('err').classList.contains('show')"):
            raise RuntimeError(self.kg.inner_text("#err"))
        return self.kg.inner_text("#code").strip()
    def license(self, dev, tier="LT", role="M", expiry="2099-01-01"):
        self.kg.fill("#devId", dev)
        self.kg.click(f"#tierSeg button[data-v=\"{tier}\"]"); self.kg.click(f"#roleSeg button[data-v=\"{role}\"]")
        if tier != "LT": self.kg.fill("#expiryDate", expiry)
        return self._gen("#gen")
    def recovery(self, dev):
        self.kg.fill("#devId", dev); return self._gen("#genRec")
    def sign_license(self, payload):
        """Custom (possibly invalid) payload signed with the test key, to craft expired/odd licences."""
        return self.kg.evaluate("""async(p)=>{const priv=await checkKey(document.getElementById('privateKey').value);
          const body=new TextEncoder().encode(canonical(p));const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,body));
          return 'DEYN3-'+b64u(body)+'.'+b64u(sig);}""", payload)
    def sign_recovery(self, p):
        return self.kg.evaluate("""async(p)=>{const priv=await checkKey(document.getElementById('privateKey').value);
          const body=new TextEncoder().encode(recCanonical(p));const msg=new Uint8Array([...new TextEncoder().encode(REC_PREFIX),...body]);
          const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,msg));return 'DEYNR1-'+b64u(body)+'.'+b64u(sig);}""", p)
    def activate(self, pg, code):
        pg.fill("#agCode", code); pg.click("#agGo"); pg.wait_for_timeout(700)
    def started(self, pg): return pg.evaluate("document.body.classList.contains('lic-ok')")
    def gate_err(self, pg): return pg.inner_text("#agErr").strip() if pg.evaluate("document.getElementById('agErr').classList.contains('show')") else ""
    def close(self):
        self.browser.close(); self.pw.stop()

class Results:
    def __init__(self): self.rows = []
    def check(self, name, cond, detail=""):
        self.rows.append((name, bool(cond), detail)); print(("PASS " if cond else "FAIL ") + name + (f" — {detail}" if detail and not cond else ""))
    def summary(self):
        ok = sum(1 for r in self.rows if r[1]); print(f"\n{ok}/{len(self.rows)} passed"); return ok == len(self.rows)


import subprocess, time, urllib.request, urllib.parse
class TimeServer:
    """The REAL trusted-time Worker module served by Node, with a controllable fake clock offset. Test key only."""
    def __init__(self, allowed_origin):
        self.key = make_test_key()
        self.tmp = Path(tempfile.mkdtemp(prefix="deyntime_"))
        shutil.copy(ROOT / "trusted-time/worker.js", self.tmp / "worker.mjs")
        priv_b64 = self.key["pem"].replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace("\n", "").strip()
        (self.tmp / "srv.mjs").write_text("""
import http from 'node:http'; import worker from './worker.mjs';
let offset = 0; const RD = Date.now; Date.now = () => RD() + offset;
const env = { TIME_SIGNING_KEY: process.env.K, ALLOWED_ORIGIN: process.env.ORIGIN };
const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__offset') { offset = Number(u.searchParams.get('ms')); res.end('ok'); return; }
  const chunks = []; for await (const c of req) chunks.push(c);
  const r = await worker.fetch(new Request('https://t' + req.url, { method: req.method, body: ['GET','HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text());
});
srv.listen(0, '127.0.0.1', () => console.log(srv.address().port));
""", encoding="utf8")
        self.origin = allowed_origin
        env = dict(os.environ, K=priv_b64, ORIGIN=allowed_origin)
        self.proc = subprocess.Popen(["node", str(self.tmp / "srv.mjs")], env=env, stdout=subprocess.PIPE, text=True)
        self.port = int(self.proc.stdout.readline().strip())
    def set_offset(self, ms): urllib.request.urlopen(f"http://127.0.0.1:{self.port}/__offset?ms={int(ms)}").read()
    def attach(self, ctx, mode="live"):
        """Route https://time.test/* to the Node worker. mode: live | offline | replay"""
        self.last = None; self.mode = mode; self.captured = []
        def handler(route, request):
            if self.mode == "offline": return route.abort("connectionrefused")
            if self.mode == "replay" and self.captured and request.method == "POST":
                return route.fulfill(status=200, headers={"access-control-allow-origin": self.origin, "content-type": "application/json"}, body=self.captured[0])
            r = route.fetch(url=f"http://127.0.0.1:{self.port}{urllib.parse.urlparse(request.url).path}")
            if request.method == "POST": self.captured.append(r.text())
            route.fulfill(response=r)
        ctx.route("https://time.test/**", handler)
    def close(self): self.proc.kill(); shutil.rmtree(self.tmp, ignore_errors=True)


RELAY_JS = r"""
import http from 'node:http';
const conns = new Map(), listeners = new Map(), queues = new Map(), waiters = new Map();
let nextId = 1, frames = 0, cutAfter = 0, tamperAt = 0, dupAt = 0;
const emit = (client, ev) => { const q = queues.get(client) || []; q.push(ev); queues.set(client, q); const w = waiters.get(client); if (w) { waiters.delete(client); w(); } };
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const killAll = () => { for (const [id, c] of conns) { emit(c.client, { ev: 'closed', connId: id }); } conns.clear(); };
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const body = await new Promise(r => { let b = ''; req.on('data', d => b += d); req.on('end', () => r(b ? JSON.parse(b) : {})); });
  const ok = o => { res.writeHead(200, { ...cors, 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (u.pathname === '/listen') { listeners.set(body.client, 47821); return ok({ port: 47821 + listeners.size, ip: '192.168.1.' + (10 + listeners.size) }); }
  if (u.pathname === '/connect') {
    const target = [...listeners.keys()].find(c => c !== body.client); if (!target) { res.writeHead(500, cors); return res.end('refused'); }
    const a = 'c' + (nextId++), b = 's' + (nextId++); conns.set(a, { client: body.client, peer: b }); conns.set(b, { client: target, peer: a });
    emit(target, { ev: 'accepted', connId: b }); return ok({ connId: a });
  }
  if (u.pathname === '/send') {
    const c = conns.get(body.connId); if (!c) { res.writeHead(500, cors); return res.end('closed'); }
    frames++; let data = body.data;
    if (cutAfter && frames > cutAfter) { cutAfter = 0; killAll(); return ok({}); }
    if (tamperAt && frames === tamperAt) { const m = JSON.parse(data); if (m.d) { m.d = m.d.slice(0, 8) + (m.d[8] === 'A' ? 'B' : 'A') + m.d.slice(9); data = JSON.stringify(m); } }
    const p = conns.get(c.peer); if (p) { emit(p.client, { ev: 'frame', connId: c.peer, data }); if (dupAt && frames === dupAt) emit(p.client, { ev: 'frame', connId: c.peer, data }); }
    return ok({});
  }
  if (u.pathname === '/close') { const c = conns.get(body.connId); if (c) { const p = conns.get(c.peer); conns.delete(body.connId); if (p) { conns.delete(c.peer); emit(p.client, { ev: 'closed', connId: c.peer }); } } return ok({}); }
  if (u.pathname === '/poll') {
    const client = u.searchParams.get('client'); const q = queues.get(client) || [];
    if (!q.length) await Promise.race([new Promise(r => waiters.set(client, r)), new Promise(r => setTimeout(r, 1500))]);
    const out = queues.get(client) || []; queues.set(client, []); return ok(out);
  }
  if (u.pathname === '/__cut') { cutAfter = Number(u.searchParams.get('after')); frames = 0; return ok({}); }
  if (u.pathname === '/__tamper') { tamperAt = Number(u.searchParams.get('at')); frames = 0; return ok({}); }
  if (u.pathname === '/__dup') { dupAt = Number(u.searchParams.get('at')); frames = 0; return ok({}); }
  if (u.pathname === '/__reset') { cutAfter = tamperAt = dupAt = 0; frames = 0; killAll(); return ok({}); }
  if (u.pathname === '/__drop') { killAll(); return ok({}); }
  res.writeHead(404, cors); res.end();
}).listen(0, '127.0.0.1', function () { console.log(this.address().port); });
"""
class Relay:
    """Stand-in for the native DeynSync TCP plugin: connects two Chromium contexts through a local relay. Test only."""
    def __init__(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="deynrelay_")); (self.tmp / "r.mjs").write_text(RELAY_JS, encoding="utf8")
        self.proc = subprocess.Popen(["node", str(self.tmp / "r.mjs")], stdout=subprocess.PIPE, text=True)
        self.port = int(self.proc.stdout.readline().strip())
    def call(self, path):
        urllib.request.urlopen(f"http://127.0.0.1:{self.port}{path}").read()
    def script(self, client):
        return """
(() => { const BASE='http://127.0.0.1:%d', ME='%s'; const L={}; let polling=false;
  const post=async(p,b)=>{const r=await fetch(BASE+p,{method:'POST',body:JSON.stringify({client:ME,...b})});if(!r.ok)throw new Error(await r.text());return r.json();};
  const poll=async()=>{ if(polling)return; polling=true; for(;;){ try{ const r=await fetch(BASE+'/poll?client='+ME); const evs=await r.json(); for(const e of evs){ (L[e.ev]||[]).forEach(cb=>cb(e)); } }catch(x){ await new Promise(r=>setTimeout(r,300)); } } };
  window.Capacitor.Plugins.DeynSync={
    listen: async()=>post('/listen',{}), connect: async({ip,port})=>post('/connect',{ip,port}),
    send: async({connId,data})=>post('/send',{connId,data}), close: async({connId})=>post('/close',{connId}),
    addListener: async(ev,cb)=>{ (L[ev]=L[ev]||[]).push(cb); poll(); return {remove(){}}; } };
})();""" % (self.port, client)
    def close(self): self.proc.kill(); shutil.rmtree(self.tmp, ignore_errors=True)
