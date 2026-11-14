# PRO_4_SOURCE_BUNDLE_1.md — حزمة الأكواد النصية الكاملة للنسخة PRO 4 (الجزء 1 من 3)

- **عدد الملفات في هذه الحزمة**: `1` ملفًا (من أصل `67` ملفًا نصيًا وبرمجيًا في `PRO 4`)
- **إجمالي الحجم الأصلي للملفات في هذه الحزمة**: `455,357` بايت
- **تنبيه**: جميع الملفات أدناه مدرجة بمحتواها الحرفي الكامل دون أي اختصار أو تعديل، ومفصولة بوضوح بمسارها الأصلي.

================================================================================
## [1/1] FILE: `deyn-app/www/index.html`

- **المسار الأصلي**: `deyn-app/www/index.html`
- **الحجم**: `455,357` بايت | **الأسطر**: `6,954` | **SHA-256**: `569df2e14a52770a49a15e8f9ed41c14dbe19e4ffce8eb7cb0e60ffbb2268f27`

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#065043">
<title>DEYN — تسيير الديون بكل سهولة</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="fonts/fonts.css">
<style>
:root{
  --em:#065043; --sea:#206258; --bg:#f4f7f6; --card:#ffffff; --line:#e2e8f0;
  --ink:#0f172a; --mute:#64748b; --tint:#e7f0ee; --tint2:#f0f5f4;
  --warn:#b45309; --warn-bg:#fdf3e4; --danger:#b91c1c; --danger-bg:#fbeaea;
  --sh:0 2px 12px rgba(0,0,0,.04);
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
[hidden]{display:none!important}
html,body{margin:0;padding:0;height:100%;overflow:hidden;background:var(--bg);color:var(--ink);font-family:'Alexandria',sans-serif;-webkit-font-smoothing:antialiased}
body.lock{overflow:hidden}
button,input,select,textarea{font-family:inherit;color:inherit}
button{cursor:pointer;border:0;background:none;padding:0}
button:disabled{cursor:not-allowed;opacity:.45}
:focus-visible{outline:2px solid var(--sea);outline-offset:2px}
.num{font-family:'Plus Jakarta Sans','Alexandria',sans-serif;font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate;display:inline-block}
.shell{max-width:36rem;margin:0 auto;height:100vh;height:100dvh;display:flex;flex-direction:column;position:relative;overflow:hidden}

/* Header - Fixed & Pinned */
.hdr{flex:none;background:var(--em);color:#fff;border-radius:0 0 32px 32px;padding:14px 16px;box-shadow:0 4px 14px rgba(6,80,67,.22);z-index:25}
.hdr-row{display:flex;align-items:center;justify-content:space-between;direction:ltr}
.sq{width:46px;height:46px;border-radius:16px;background:var(--sea);color:#fff;font-size:20px;display:grid;place-items:center;transition:transform .12s,background .15s}
.sq:active{transform:scale(.94);background:#1a554c}
.brand{text-align:center;direction:rtl}
.brand b{display:block;font:800 22px 'Plus Jakarta Sans',sans-serif;letter-spacing:.22em;padding-inline-start:.22em;line-height:1.1}
.brand span{display:block;font-size:11.5px;opacity:.82;margin-top:4px;font-weight:400}

main{flex:1;overflow-y:auto;overflow-x:hidden;padding:14px 16px 95px;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
main::-webkit-scrollbar{width:4px}
main::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
.tab{display:none}
.tab.active{display:block}

/* Cards & buttons */
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;box-shadow:var(--sh)}
.btn{height:48px;border-radius:14px;border:1px solid var(--line);background:#fff;font-weight:600;font-size:14px;padding:0 14px;transition:transform .1s,background .15s;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.btn:active{transform:scale(.97)}
.btn.pri{background:var(--em);border-color:var(--em);color:#fff;font-weight:700;font-size:16px}
.btn.pri:active{background:#04382f}
.btn.sm{height:42px;font-size:13px;border-radius:12px}
.btn.dng{color:var(--danger)}
.btn.soft{background:var(--tint);border-color:transparent;color:var(--em)}
.btn.block{width:100%}
.inp{width:100%;height:48px;border:1px solid var(--line);border-radius:14px;padding:0 14px;font-size:15px;font-weight:500;background:#fff;transition:border-color .15s,box-shadow .15s}
.inp::placeholder{color:#94a3b8;font-weight:400}
.inp:focus{outline:none;border-color:var(--sea);box-shadow:0 0 0 3px rgba(32,98,88,.12)}
.lbl{display:block;font-size:12.5px;color:var(--mute);margin:14px 0 6px;font-weight:500}

/* Mode switch */
.modesw{position:relative;display:grid;grid-template-columns:1fr 1fr;background:#e6ecea;border-radius:16px;padding:4px;margin-bottom:14px}
.modesw .thumb{position:absolute;top:4px;bottom:4px;right:4px;width:calc(50% - 4px);background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.1);transition:transform .28s cubic-bezier(.3,.8,.3,1)}
.modesw[data-mode=calc] .thumb{transform:translateX(-100%)}
.modesw button{position:relative;z-index:1;height:40px;font-size:13.5px;font-weight:600;color:var(--mute);transition:color .2s}
.modesw button.on{color:var(--em)}

/* Display card */
.dcard{background:var(--em);color:#fff;border-radius:24px;padding:20px;margin-bottom:14px;box-shadow:0 6px 18px rgba(6,80,67,.2)}
.dtop{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#b9d6cf}
.mind{background:rgba(255,255,255,.14);border-radius:8px;padding:1px 8px;font:700 11px 'Plus Jakarta Sans'}
.tape{display:block;direction:ltr;text-align:right;white-space:nowrap;overflow-x:auto;scrollbar-width:none;margin:12px 0 4px;font:500 14px 'Plus Jakarta Sans','Alexandria',sans-serif;color:#cfe5df;min-height:22px}
.tape.empty{direction:rtl;font-family:'Alexandria';font-size:12.5px;color:#8fb9af;text-align:right}
.amount{display:flex;align-items:baseline;gap:8px;min-height:56px}
.amount .num{font-size:46px;font-weight:700;line-height:1.1;letter-spacing:-.01em}
.amount .num.sm{font-size:34px}
.amount .num.xs{font-size:26px}
.amount .cur{font-size:18px;font-weight:500;color:#b9d6cf}
.dial{display:inline-block;min-height:28px;margin-top:6px;padding:4px 14px;border-radius:999px;background:rgba(255,255,255,.12);color:#d9ede8;font-size:13.5px;font-weight:500}
.dial:empty{visibility:hidden}

/* Quick cash tiles */
.sec-t{font-size:12.5px;color:var(--mute);font-weight:500;margin:4px 2px 8px}
.grid6{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
.grid5{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.tile{position:relative;background:#fbfcfb;border:1px solid var(--line);border-radius:16px;height:74px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;box-shadow:0 2px 0 #dfe6e4,0 3px 8px rgba(0,0,0,.04);transition:transform .08s,box-shadow .08s,background .15s}
.tile:active{transform:translateY(2px);box-shadow:0 0 0 #dfe6e4,0 1px 3px rgba(0,0,0,.05);background:#f1f5f4}
.tile.note{height:88px;border-top:3px solid var(--sea)}
.tile .t-n{font-size:19px;font-weight:800;color:var(--ink)}
.tile.note .t-n{font-size:20px}
.tile .t-tag{font-size:9.5px;font-weight:600;color:var(--em);background:var(--tint);border-radius:999px;padding:1px 7px;white-space:nowrap}
.tile .t-cnt{position:absolute;top:-6px;inset-inline-start:-4px;font-style:normal;font:700 10.5px 'Plus Jakarta Sans';background:var(--em);color:#fff;border-radius:999px;padding:2px 6px}
.tile.on{border-color:var(--sea);background:#f2f8f6}
body.no-dial .t-tag{display:none}

/* Calculator */
.keys{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;direction:ltr;margin-bottom:14px}
.k{height:50px;border-radius:14px;background:#fbfcfb;border:1px solid var(--line);font:700 18px 'Plus Jakarta Sans',sans-serif;color:var(--ink);box-shadow:0 2px 0 #dfe6e4;transition:transform .08s,box-shadow .08s}
.k:active{transform:translateY(2px);box-shadow:none}
.k.fn{background:#eef2f1;font-size:13px;font-weight:700;color:#334155}
.k.mem{background:#e4ece9;font-size:12px;color:var(--em)}
.k.op{background:var(--sea);border-color:var(--sea);color:#fff;font-size:20px;box-shadow:0 2px 0 #174a42}
.k.eq{background:var(--em);border-color:var(--em);color:#fff;font-size:22px;box-shadow:0 2px 0 #04382f}
.k.ac{background:var(--ink);border-color:var(--ink);color:#fff;font-size:12.5px;box-shadow:0 2px 0 #000}
.k.s2{grid-column:span 2}.k.s3{grid-column:span 3}

.actbar{display:grid;grid-template-columns:1fr 1fr 2fr;gap:8px;margin-top:12px}

/* Pending */
.bar-h{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:12px 14px;margin-bottom:14px;box-shadow:var(--sh)}
.bar-h .ic{width:38px;height:38px;border-radius:12px;background:var(--tint);display:grid;place-items:center;font-size:18px}
.bar-h h2{margin:0;font-size:16px;font-weight:700;flex:1}
.cnt{min-width:28px;height:28px;border-radius:999px;background:var(--em);color:#fff;font:700 13px 'Plus Jakarta Sans';display:grid;place-items:center;padding:0 8px}
.voucher{position:relative;background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:var(--sh);margin-bottom:14px;overflow:hidden}
.v-head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 10px;font-size:12.5px;color:var(--mute)}
.v-no{font-weight:700;color:var(--em);background:var(--tint);padding:3px 10px;border-radius:999px;font-size:12px}
.v-body{padding:2px 16px 16px}
.v-tag{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--ink);background:var(--tint2);border-radius:12px;padding:9px 12px;margin-bottom:12px}
.v-tag.none{color:#94a3b8;font-weight:400}
.v-amt{display:flex;align-items:baseline;gap:6px}
.v-amt .num{font-size:34px;font-weight:800;line-height:1.1}
.v-amt span{color:var(--mute);font-size:15px}
.pill{display:inline-block;margin-top:6px;background:var(--tint);color:var(--em);font-size:12.5px;font-weight:600;border-radius:999px;padding:3px 12px}
.v-tape{display:block;margin-top:10px;font:500 12.5px 'Plus Jakarta Sans','Alexandria';color:var(--mute);background:var(--tint2);border-radius:10px;padding:7px 10px;overflow-x:auto;white-space:nowrap;scrollbar-width:none;text-align:right}
.v-sep{position:relative;border-top:1.5px dashed #cbd5d1;margin:0 14px}
.v-sep::before,.v-sep::after{content:'';position:absolute;top:-10px;width:19px;height:19px;border-radius:50%;background:var(--bg);border:1px solid var(--line)}
.v-sep::before{right:-24px}.v-sep::after{left:-24px}
.v-act{display:flex;gap:8px;padding:14px 16px}
.v-act .btn.pri{flex:1;height:46px;font-size:14.5px}
.v-act .btn.sec{height:46px;padding:0 14px;font-size:13px}
.voucher.lite .v-head{padding:12px 16px 6px}
.voucher.lite .v-body{padding:0 16px 12px}
.voucher.lite .v-act{padding:12px 16px}
.voucher.lite .v-amt .num{font-size:30px}
.v-act .del{width:46px;height:46px;border-radius:14px;border:1px solid var(--line);font-size:17px;background:#fff}
.empty-st{text-align:center;padding:42px 20px;color:var(--mute);font-size:14px;line-height:1.9}
.empty-st b{display:block;color:var(--ink);font-size:15.5px;margin-bottom:4px}
.empty-st .btn{margin-top:14px}

/* Ledger */
.toolbar{display:flex;gap:8px;margin-bottom:10px}
.toolbar .inp{flex:1}
.toolbar .btn{height:48px;padding:0 16px;white-space:nowrap}
.chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none;margin-bottom:4px}
.chips::-webkit-scrollbar{display:none}
.chip{flex:none;height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:#fff;font-size:13px;font-weight:600;color:#334155;display:flex;align-items:center;gap:6px;transition:background .15s,color .15s}
.chip.on{background:var(--em);color:#fff;border-color:var(--em)}
.chip small{font:700 11px 'Plus Jakarta Sans';opacity:.75}
.cust{padding:14px;margin-bottom:12px;cursor:pointer;transition:box-shadow .15s}
.cust:active{box-shadow:0 1px 4px rgba(0,0,0,.06)}
.c-top{display:flex;align-items:center;gap:12px}
.av{width:44px;height:44px;border-radius:15px;background:var(--sea);color:#fff;display:grid;place-items:center;font-weight:700;font-size:17px;flex:none}
.cust.blk .av{background:var(--ink)}
.c-main{flex:1;min-width:0}
.c-main h3{margin:0;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c-meta{display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;font-size:12px;color:var(--mute)}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;padding:2px 9px;border-radius:999px;background:var(--tint);color:var(--em)}
.badge.black{background:var(--ink);color:#fff}
.c-bal{text-align:end;flex:none}
.c-bal b{display:block;font-size:19px;font-weight:800;line-height:1.1}
.c-bal small{font-size:11.5px;color:var(--mute)}
.ceil{margin-top:12px;padding-top:12px;border-top:1.5px dashed #cbd5d1}
.ceil-h{display:flex;justify-content:space-between;font-size:12px;color:var(--mute);margin-bottom:6px}
.bar{height:8px;border-radius:999px;background:#e8eeed;overflow:hidden}
.bar i{display:block;height:100%;border-radius:999px;background:var(--sea);transition:width .4s}
.bar.warn i{background:var(--warn)}
.bar.over i{background:var(--danger)}
.note{margin-top:10px;font-size:12.5px;font-weight:500;border-radius:10px;padding:7px 10px}
.note.w{background:var(--warn-bg);color:var(--warn)}
.note.d{background:var(--danger-bg);color:var(--danger)}
.note.i{background:var(--tint2);color:var(--mute)}
.c-act{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}

/* Stats */
.pg-t{margin:0 2px 14px;font-size:17px;font-weight:700}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.stat{padding:14px}
.stat .s-l{display:block;font-size:12px;color:var(--mute);font-weight:500;min-height:32px;line-height:1.4}
.stat .s-v{display:flex;align-items:baseline;gap:5px;margin-top:4px}
.stat .s-v b{font-size:24px;font-weight:800}
.stat .s-v small{font-size:12px;color:var(--mute)}
.stat .s-d{margin-top:6px;font-size:11.5px;color:var(--em);font-weight:600}
.stat.hero{background:var(--em);color:#fff;border-color:var(--em)}
.stat.hero .s-l,.stat.hero .s-v small{color:#b9d6cf}
.stat.hero .s-d{color:#d9ede8}
.stat.crit .s-v b{color:var(--danger)}
.panel{padding:16px;margin-bottom:16px}
.panel h3{margin:0 0 12px;font-size:14.5px;font-weight:700}
.dist{margin-bottom:11px}
.dist:last-child{margin-bottom:0}
.dist-h{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px}
.dist-h span:last-child{color:var(--mute)}
/* ---- Ranking row ---- */
.top-r{background:#fff;border:1px solid var(--line);border-radius:18px;padding:12px;margin-bottom:10px;box-shadow:var(--sh);cursor:pointer;transition:transform .12s}
.top-r:active{transform:scale(.99)}
.top-r:last-child{margin-bottom:0}
.top-r.t3{border-color:rgba(201,169,110,.45)}
.rk-top{display:flex;align-items:flex-start;gap:10px}
.rk-n{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;font-weight:800;font-size:12.5px;flex:none;background:#f1f5f9;color:#64748b}
.rk-n.r1{background:linear-gradient(135deg,#c9a96e,#dfc28d);color:#1c1305;box-shadow:0 2px 6px rgba(201,169,110,.35)}
.rk-n.r2{background:linear-gradient(135deg,#94a3b8,#cbd5e1);color:#0f172a}
.rk-n.r3{background:linear-gradient(135deg,#b45309,#d97706);color:#fff}
.top-r .av{width:42px;height:42px;border-radius:14px;font-size:16px;font-weight:800;background:var(--tint);color:var(--em)}
.rk-id{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:5px}
.rk-id b{max-width:100%;font-size:14.5px;font-weight:700;color:var(--ink);line-height:1.5;white-space:normal;overflow-wrap:anywhere}
.rk-seg{font-size:11.5px;color:var(--mute);background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1px 8px;white-space:nowrap}
.rk-amt{flex:none;display:flex;align-items:baseline;gap:4px;align-self:flex-start;padding-top:2px}
.rk-amt .num{font-size:16px;font-weight:800;color:var(--ink)}
.rk-amt small{font-size:11px;color:var(--mute)}
.rk-go{flex:none;color:#94a3b8;font-size:16px}
.rk-ft{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;padding-top:10px;border-top:1.5px dashed #cbd5d1}
.rk-t{font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:999px;background:var(--tint2);color:var(--mute)}
.rk-t.d{background:var(--danger-bg);color:#b91c1c;font-weight:700}
.rk-t.o{background:var(--danger-bg);color:#dc2626;font-weight:700}
.rk-t.w{background:var(--warn-bg);color:#b45309;font-weight:700}
.rk-t.g{background:#f0fdf4;color:#047857;font-weight:700}
.rk-d{font-size:11.5px;font-weight:700;color:#065043;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:999px;padding:2px 10px}

/* ---- Stats: hero ---- */
.hx{background:linear-gradient(145deg,#065043 0%,#0a5c4e 55%,#04382f 100%);color:#fff;border-radius:24px;padding:20px;margin-bottom:14px;box-shadow:0 8px 26px rgba(6,80,67,.22);border:1.5px solid rgba(201,169,110,.35)}
.hx-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;color:#b9d6cf;font-weight:600}
.hx-tag{background:rgba(201,169,110,.2);color:#e8d5a8;border:1px solid rgba(201,169,110,.4);font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;white-space:nowrap}
.hx-amt{display:flex;align-items:baseline;gap:8px;margin:12px 0 8px}
.hx-amt .num{font-size:36px;font-weight:800;line-height:1.1}
.hx-amt .cur{font-size:18px;color:#c9a96e;font-weight:700}
.hx-dial{display:inline-block;padding:4px 14px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);font-size:13.5px;font-weight:700;color:#fff}
.hx-g{display:grid;grid-template-columns:repeat(3,1fr);margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.14);text-align:center}
.hx-g>div{padding:0 6px;display:flex;flex-direction:column;align-items:center;gap:4px}
.hx-g>div+div{border-inline-start:1px solid rgba(255,255,255,.14)}
.hx-g span{font-size:11px;color:#b9d6cf}
.hx-g b{font-size:17px;font-weight:800;color:#fff}
.hx-g b.ok{color:#6ee7b7}
.hx-g small{font-size:11px;color:#b9d6cf}

/* ---- Stats: KPI cards ---- */
.kg{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.kp{border:1.5px solid;border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:9px;min-width:0}
.kp.w{grid-column:span 2}
.kp-h{display:flex;align-items:center;gap:8px}
.kp-ic{width:32px;height:32px;border-radius:10px;background:#fff;display:grid;place-items:center;font-size:16px;flex:none}
.kp-l{flex:1;min-width:0;font-size:12px;font-weight:700;line-height:1.45}
.kp-m{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.kp-v{display:flex;align-items:baseline;gap:5px}
.kp-v .num{font-size:21px;font-weight:800}
.kp-v small{font-size:11px;font-weight:700}
.kp-d{align-self:flex-start;font-size:12px;font-weight:700;line-height:1.5;padding:3px 10px;border-radius:10px;background:rgba(255,255,255,.75)}
.kp-f{font-size:11px;color:#4b5563;line-height:1.5}
.kp.g{background:#f0fdf4;border-color:#86efac}
.kp.g .kp-l,.kp.g small{color:#166534}.kp.g .num{color:#14532d}.kp.g .kp-d{color:#15803d}
.kp.r{background:#fef2f2;border-color:#fca5a5}
.kp.r .kp-l,.kp.r small{color:#991b1b}.kp.r .num{color:#b91c1c}.kp.r .kp-d{color:#dc2626}
.kp.t{background:#f0fdfa;border-color:#99f6e4}
.kp.t .kp-l,.kp.t small{color:#0f766e}.kp.t .num{color:#115e59}
.kp.t .kp-d{background:#ccfbf1;color:#0f766e;border:1px solid #99f6e4;font-size:13px;font-weight:800}
.kp.t .kp-v small{color:#0f766e}

/* ---- Stats: health ---- */
.hl{background:#fff;border:1px solid var(--line);border-radius:20px;padding:16px;margin-bottom:14px;box-shadow:var(--sh)}
.hl-h{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.hl-h .ic{width:36px;height:36px;border-radius:12px;background:var(--tint);display:grid;place-items:center;font-size:18px;flex:none}
.hl-h b{flex:1;min-width:0;font-size:14px;color:var(--ink);line-height:1.45}
.hl-h .num{font-size:18px;font-weight:800}
.hl .bar{height:10px;background:#f1f5f9;border:1px solid #e2e8f0}
.hl-t{margin-top:10px;font-size:12px;color:var(--mute);line-height:1.6}

/* ---- Stats: panels ---- */
.pn{background:#fff;border:1px solid var(--line);border-radius:20px;padding:16px;box-shadow:var(--sh);margin-bottom:16px}
.pn.r{border:1.5px solid #fca5a5}
.pn.g{border:1.5px solid #86efac}
.pn-h{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.pn-h .ic{width:36px;height:36px;border-radius:12px;background:var(--tint);display:grid;place-items:center;font-size:18px;flex:none}
.pn.r .pn-h .ic{background:var(--danger-bg)}
.pn.g .pn-h .ic{background:#f0fdf4}
.pn-h h3{flex:1;min-width:0;margin:0;font-size:15px;font-weight:700;color:var(--ink);line-height:1.4}
.pn.r .pn-h h3{color:#b91c1c}
.pn.g .pn-h h3{color:#166534}
.pn-b{flex:none;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;background:#f1f5f9;color:#475569}
.pn.r .pn-b{background:#fee2e2;color:#b91c1c}
.pn.g .pn-b{background:#d1fae5;color:#065f46}
.pn-s{font-size:12px;color:var(--mute);margin:-4px 2px 14px;line-height:1.6}
.sm{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:16px;margin-bottom:14px;border:1px solid}
.sm .l{font-size:12.5px;font-weight:600}
.sm .v{display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.sm .v .num{font-size:16px;font-weight:800}
.sm .v em{font-style:normal;font-size:11.5px;font-weight:700}
.sm .v em:empty{display:none}
.sm.r{background:#fef2f2;border-color:#fecaca}.sm.r .l,.sm.r em{color:#991b1b}.sm.r .num{color:#b91c1c}
.sm.g{background:#f0fdf4;border-color:#bbf7d0}.sm.g .l,.sm.g em,.sm.g .num{color:#166534}
.pn .empty-st{padding:28px}

/* ---- Stats: distribution ---- */
.ds{background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:14px;margin-bottom:10px}
.ds:last-child{margin-bottom:0}
.ds-h{display:flex;align-items:center;justify-content:space-between;gap:10px}
.ds-n{font-size:14px;font-weight:700;color:var(--ink)}
.ds-v{display:flex;align-items:baseline;gap:4px;flex:none}
.ds-v .num{font-size:15px;font-weight:800;color:#065043}
.ds-v small{font-size:11px;color:#065043;font-weight:700}
.ds-b{display:flex;align-items:center;gap:10px;margin:10px 0}
.ds-bar{flex:1;height:8px;background:#e2e8f0;border-radius:8px;overflow:hidden}
.ds-bar i{display:block;height:100%;background:linear-gradient(90deg,#065043,#10b981);border-radius:8px}
.ds-p{flex:none;font-size:11.5px;font-weight:700;color:var(--em);background:var(--tint);border-radius:999px;padding:2px 10px}
.ds-d{font-size:12px;color:var(--em);font-weight:700}
.ds-d:empty{display:none}

/* ---- Notifications ---- */
.nt{display:flex;align-items:center;gap:12px;width:100%;text-align:right;padding:12px;margin-bottom:10px;border-radius:16px;border:1px solid var(--line);background:#fff;box-shadow:var(--sh)}
.nt:active{background:var(--tint2)}
.nt .av{width:42px;height:42px;border-radius:12px;font-size:15px;font-weight:800;background:var(--tint);color:var(--em)}
.nt .av.d{background:#fee2e2;color:#b91c1c}
.nt .av.o{background:#fee2e2;color:#dc2626}
.nt-m{flex:1;min-width:0}
.nt-r{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.nt-r b{font-size:14.5px;color:var(--ink);line-height:1.5;white-space:normal;overflow-wrap:anywhere}
.nt-r .num{font-weight:800;color:var(--ink);font-size:15px;flex:none}
.nt-bd{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.nt-b{font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px}
.nt-b.d{background:#fee2e2;color:#b91c1c}
.nt-b.w{background:#fef3c7;color:#b45309}
.nt-b.o{background:#fef2f2;color:#dc2626}
.nt-go{flex:none;color:var(--mute);font-size:18px}
.cmp{width:100%;border-collapse:separate;border-spacing:0;font-size:12.5px;overflow:hidden;border:1px solid var(--line);border-radius:14px}
.cmp th,.cmp td{padding:10px 9px;text-align:right;vertical-align:top;line-height:1.55}
.cmp thead th{background:var(--tint2);font-weight:700;font-size:12px;color:var(--mute)}
.cmp thead th:last-child{background:var(--em);color:#fff}
.cmp td{border-top:1px solid var(--line)}
.cmp td:first-child{font-weight:600;width:27%}
.cmp td:nth-child(2){color:var(--mute)}
.cmp td:last-child{background:#f3f8f7;font-weight:500}
.cmp .x{color:var(--danger);font-weight:700;margin-inline-end:4px}
.cmp .v{color:var(--sea);font-weight:800;margin-inline-end:4px}

/* Bottom nav */
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:36rem;background:rgba(255,255,255,.95);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(4,1fr);padding:6px 6px calc(6px + env(safe-area-inset-bottom));z-index:20}
.nb{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 0 5px;border-radius:14px;color:var(--mute);font-size:11px;font-weight:600;transition:color .2s}
.nb .i{font-size:20px;line-height:1;filter:grayscale(1);opacity:.7;transition:filter .2s,opacity .2s}
.nb.on{color:var(--em)}
.nb.on .i{filter:none;opacity:1}
.nb.on::before{content:'';position:absolute;top:-7px;width:26px;height:3px;border-radius:0 0 4px 4px;background:var(--em)}
.nb .bd{position:absolute;top:1px;inset-inline-end:calc(50% - 22px);min-width:18px;height:18px;border-radius:999px;background:var(--em);color:#fff;font:700 10.5px 'Plus Jakarta Sans';display:grid;place-items:center;padding:0 5px;border:2px solid #fff}

/* Modals */
.ovl{position:fixed;inset:0;z-index:50;background:rgba(15,23,42,.45);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s}
.ovl.show{opacity:1}
.sheet{width:100%;max-width:36rem;max-height:90vh;overflow-y:auto;background:#fff;border-radius:28px 28px 0 0;padding:8px 18px calc(22px + env(safe-area-inset-bottom));transform:translateY(40px);transition:transform .25s cubic-bezier(.2,.8,.3,1)}
.ovl.show .sheet{transform:none}
.grab{display:none!important;width:0!important;height:0!important;margin:0!important;opacity:0!important}
.sh-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}
.sh-h h2{margin:0;font-size:17px;font-weight:700}
.x-b{width:36px;height:36px;border-radius:12px;background:var(--tint2);font-size:15px;color:var(--mute)}
.sub{font-size:13px;color:var(--mute);margin:2px 0 4px;line-height:1.6}
.row-set{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 0;border-top:1px solid var(--line)}
.row-set b{display:block;font-size:14px;font-weight:600}
.row-set small{display:block;font-size:12px;color:var(--mute);margin-top:2px}
.sw{position:relative;width:50px;height:30px;flex:none}
.sw input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:2}
.sw i{position:absolute;inset:0;border-radius:999px;background:#cbd5d1;transition:background .2s}
.sw i::after{content:'';position:absolute;top:3px;right:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s}
.sw input:checked+i{background:var(--em)}
.sw input:checked+i::after{transform:translateX(-20px)}
.pick{display:flex;align-items:center;gap:12px;width:100%;text-align:right;padding:11px 12px;border:1px solid var(--line);border-radius:14px;margin-bottom:8px;background:#fff;transition:background .12s}
.pick:active{background:var(--tint2)}
.pick:disabled{background:#f6f7f7}
.pick .av{width:38px;height:38px;border-radius:13px;font-size:15px}
.pick .m{flex:1;min-width:0}
.pick .m b{display:block;font-size:14px;font-weight:600}
.pick .m small{font-size:11.5px;color:var(--mute)}
.pick .a{font-size:12px;color:var(--mute);text-align:end}
.pick-g{font-size:12.5px;color:var(--mute);font-weight:600;margin:12px 2px 8px}
.hero-bal{background:var(--em);color:#fff;border-radius:20px;padding:16px;margin:12px 0}
.hero-bal .l{font-size:12px;color:#b9d6cf}
.hero-bal .v{display:flex;align-items:baseline;gap:6px;margin:2px 0 10px}
.hero-bal .v .num{font-size:32px;font-weight:800}
.hero-bal .bar{background:rgba(255,255,255,.18)}
.hero-bal .bar i{background:#fff}
.hero-bal .bar.warn i{background:#f3c27a}
.hero-bal .bar.over i{background:#ff9d9d}
.hero-bal .ceil-h{color:#b9d6cf;margin-top:10px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tx{display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--line)}
.tx-ic{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;font-weight:800;font-size:16px;flex:none}
.tx-ic.debt{background:var(--danger-bg);color:var(--danger)}
.tx-ic.pay{background:var(--tint);color:var(--em)}
.tx-m{flex:1;min-width:0}
.tx-m b{display:block;font-size:13.5px;font-weight:600}
.tx-m small{font-size:11.5px;color:var(--mute)}
.tx-a{text-align:end}
.tx-a b{display:block;font-size:14px;font-weight:700}
.tx-a b.debt{color:var(--danger)}
.tx-a b.pay{color:var(--em)}
.tx-a small{font-size:11px;color:var(--mute)}
.chips2{display:flex;flex-wrap:wrap;gap:8px}
.chips2 .chip{height:38px}
.qa{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.qa button{height:36px;padding:0 14px;border-radius:999px;background:var(--tint);color:var(--em);font:600 12.5px 'Alexandria'}
.qa button .num{font-size:12.5px}
.warn-line{margin-top:10px;font-size:12.5px;font-weight:500;border-radius:10px;padding:8px 10px;background:var(--danger-bg);color:var(--danger)}
.warn-line:empty{display:none}
.dial-l{margin-top:8px;min-height:24px;font-size:13px;color:var(--em);font-weight:600}
.link-d{display:block;margin:16px auto 0;color:var(--danger);font-size:13px;font-weight:600;padding:8px}

/* Toast */
.toast{position:fixed;left:50%;bottom:96px;transform:translate(-50%,16px);max-width:calc(100% - 32px);background:var(--ink);color:#fff;font-size:13.5px;font-weight:500;padding:12px 18px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;z-index:80;text-align:center}
.toast.show{opacity:1;transform:translate(-50%,0)}
.toast.err{background:var(--danger)}
.toast.warn{background:var(--warn)}
.toast.ok::before{content:'✓ ';font-weight:800}

@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media (max-width:370px){.grid6{gap:6px}.tile .t-n{font-size:16px}.amount .num{font-size:40px}.k{height:46px}}

/* ===================== شاشات متعددة الأحجام + Safe areas ===================== */
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{overscroll-behavior:none}
body:not(.lic-ok) .shell{visibility:hidden}
.shell{padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
.hdr{padding-top:calc(14px + env(safe-area-inset-top))}
.sheet{max-height:90vh;max-height:90dvh;-webkit-overflow-scrolling:touch}

/* ===================== شاشة التفعيل (Screen 0) ===================== */
#actGate{position:fixed;inset:0;z-index:9000;display:none;flex-direction:column;background:#eef5f3;direction:rtl;font-family:'Alexandria',sans-serif;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;color:#0f172a}
#actGate.show{display:flex}
#actGate *{box-sizing:border-box}
.ag-top{position:relative;flex:none;color:#fff;text-align:center;padding:calc(env(safe-area-inset-top) + clamp(20px,5dvh,52px)) 20px clamp(46px,9dvh,84px)}
.ag-top .bg{position:absolute;inset:0;width:100%;height:100%;z-index:0}
.ag-top>*:not(.bg){position:relative;z-index:1}
.ag-logo{width:clamp(78px,13dvh,112px);height:auto;display:block;margin:0 auto}
.ag-title{font:800 clamp(44px,8.5dvh,72px)/1 'Plus Jakarta Sans','Alexandria',sans-serif;letter-spacing:.02em;margin:clamp(6px,1.4dvh,14px) 0 0;text-shadow:0 4px 14px rgba(0,0,0,.18);direction:ltr}
.ag-sub{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:clamp(6px,1.4dvh,14px);font-size:clamp(14px,2.2dvh,18px);font-weight:600;color:#d4efe5}
.ag-sub i{display:block;width:clamp(34px,10vw,70px);height:1.5px;background:rgba(212,239,229,.55)}
.ag-body{flex:none;padding:clamp(10px,2dvh,24px) 0 0;margin-top:-6px}
.ag-card{background:rgba(255,255,255,.94);border-radius:28px;box-shadow:0 10px 28px rgba(6,80,67,.10),0 1px 0 #fff inset;border:1px solid rgba(6,80,67,.05);padding:12px clamp(10px,3vw,14px);display:flex;align-items:center;gap:clamp(8px,2.4vw,12px);margin:0 clamp(14px,4.5vw,28px) clamp(12px,2.2dvh,20px);max-width:34rem}
@media(min-width:36rem){.ag-card,.ag-go,.ag-err{margin-left:auto;margin-right:auto;width:34rem}}
.ag-ic{flex:none;width:clamp(44px,12.5vw,66px);height:clamp(44px,12.5vw,66px);border-radius:20px;background:#d8eee6;display:grid;place-items:center}
.ag-ic svg{width:56%;height:56%}
.ag-div{flex:none;width:1.5px;align-self:stretch;margin:6px 0;background:#d3e2dd}
.ag-mid{flex:1;min-width:0;text-align:center}
.ag-lab{font-size:clamp(12.5px,2dvh,15px);font-weight:600;color:#5d726c}
.ag-id{display:block;max-width:100%;white-space:normal;overflow-wrap:anywhere;word-break:break-all;font:800 clamp(12px,3.4vw,16px)/1.5 'Plus Jakarta Sans','Alexandria',sans-serif;letter-spacing:.035em;color:#0f172a;direction:ltr;user-select:all;-webkit-user-select:all;text-align:center}
.ag-pill{flex:none;display:inline-flex;align-items:center;gap:6px;height:clamp(46px,7dvh,58px);padding:0 clamp(10px,3vw,16px);border-radius:20px;background:#d6efe5;color:#065043;font-weight:700;font-size:clamp(13.5px,2.1dvh,17px);box-shadow:0 3px 8px rgba(6,80,67,.10);transition:transform .1s,background .15s}
.ag-pill:active{transform:scale(.95);background:#c3e6d8}
.ag-pill svg{width:22px;height:22px}
.ag-inp{flex:1;min-width:0;height:clamp(48px,7dvh,58px);border:0;background:transparent;outline:none;font:600 clamp(11px,3.2vw,16px)/1 'Alexandria',sans-serif;color:#0f172a;text-align:center;padding:0 2px;text-transform:uppercase;letter-spacing:.03em;unicode-bidi:plaintext;text-overflow:ellipsis}
@media(max-width:380px){.ag-pill svg{display:none}}
.ag-inp::placeholder{color:#5d726c;font-weight:600;text-transform:none;letter-spacing:0}
.ag-go{display:flex;align-items:center;justify-content:center;gap:14px;width:calc(100% - 2*clamp(14px,4.5vw,28px));margin:clamp(4px,1dvh,10px) auto 0;height:clamp(60px,9dvh,74px);border-radius:999px;background:linear-gradient(180deg,#0b6a57 0%,#065043 58%,#04382f 100%);color:#fff;font:700 clamp(20px,3.2dvh,26px)/1 'Alexandria',sans-serif;box-shadow:0 12px 24px rgba(6,80,67,.30),0 1px 0 rgba(255,255,255,.22) inset;transition:transform .1s,filter .15s}
.ag-go:active{transform:scale(.98);filter:brightness(.94)}
.ag-go:disabled{opacity:.6}
.ag-go .ck{width:clamp(34px,5dvh,42px);height:clamp(34px,5dvh,42px);border-radius:50%;background:#fff;display:grid;place-items:center;flex:none}
.ag-go .ck svg{width:60%;height:60%}
.ag-err{display:none;margin:12px clamp(14px,4.5vw,28px) 0;padding:11px 14px;border-radius:16px;background:#fbeaea;color:#b91c1c;font-size:14px;font-weight:700;text-align:center;line-height:1.6}
.ag-err.show{display:block}
.ag-foot{position:relative;flex:1 0 auto;min-height:clamp(120px,17dvh,200px);margin-top:clamp(10px,2dvh,24px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10px 20px calc(26px + env(safe-area-inset-bottom))}
.ag-foot .bg{position:absolute;inset:0;width:100%;height:100%;z-index:0}
.ag-foot>*:not(.bg){position:relative;z-index:1}
.ag-badge{display:flex;align-items:center;gap:14px;width:min(100%,30rem)}
.ag-badge i{flex:1;height:1.5px;background:#a9c3bb}
.ag-badge svg{width:clamp(40px,6dvh,54px);height:auto;flex:none}
.ag-note{margin-top:10px;font-size:clamp(14px,2.2dvh,18px);font-weight:600;color:#566b65}
#agToast{position:fixed;left:50%;bottom:calc(26px + env(safe-area-inset-bottom));transform:translate(-50%,20px);max-width:calc(100% - 32px);background:#065043;color:#fff;padding:12px 20px;border-radius:16px;font-size:14px;font-weight:600;box-shadow:0 8px 22px rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;z-index:9600;text-align:center}
#agToast.show{opacity:1;transform:translate(-50%,0)}

/* قفل رجوع الساعة */
#clockLock{position:fixed;inset:0;z-index:9500;display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:calc(24px + env(safe-area-inset-top)) 28px calc(24px + env(safe-area-inset-bottom));background:linear-gradient(160deg,#065043 0%,#04382f 100%);color:#fff;text-align:center;direction:rtl;font-family:'Alexandria',sans-serif}
#clockLock.show{display:flex}
#clockLock .cl-ic{width:92px;height:92px;border-radius:28px;background:rgba(255,255,255,.12);display:grid;place-items:center}
#clockLock p{margin:0;max-width:24rem;font-size:18px;font-weight:700;line-height:1.9}
.toast{z-index:100002}
</style>


<style id="deyn-code-card-layout">
/* Long activation codes: constrain the flex body, wrap the value, preserve the copy control. */
.code-card{cursor:pointer;background:#f0fdf4;border:1.5px dashed var(--em);border-radius:14px;padding:11px 13px;
  display:flex;align-items:center;justify-content:space-between;gap:10px;transition:background .15s;
  width:100%;max-width:100%;min-width:0;box-sizing:border-box}
.code-card__body{flex:1 1 0;min-width:0;max-width:100%}
.code-card .code-card__value{display:block;width:100%;max-width:100%;min-width:0;
  font-size:14px;font-weight:800;color:var(--em);letter-spacing:.05em;
  white-space:normal;overflow-wrap:anywhere;word-break:break-all}
.code-card .code-card__body small{display:block;max-width:100%;font-size:11px;color:var(--mute);margin-top:2px;overflow-wrap:anywhere}
.code-card__btn{flex:none;white-space:nowrap}
</style>
<style id="deyn-sms-layout-fix-v2">
.ovl{overflow:hidden;align-items:flex-end;overscroll-behavior:contain}
.sheet{box-sizing:border-box;min-height:0;height:auto;max-height:calc(100dvh - env(safe-area-inset-top) - 8px);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;-webkit-overflow-scrolling:touch;flex:0 1 auto}
.code-card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;min-width:0;max-width:100%;overflow:hidden}
.code-card__body,.code-card__value{min-width:0;max-width:100%;overflow-wrap:anywhere;word-break:break-word}
#modalRoot,.ovl,.sheet{min-width:0;max-width:100%}
</style>
</head>
<body>
<!-- ===== شاشة التفعيل + قفل الساعة (تُظهر نفسها فقط عند الحاجة) ===== -->
<div id="actGate" role="dialog" aria-modal="true" aria-label="تفعيل DEYN">
  <button type="button" id="agLang" style="position:absolute;top:calc(10px + env(safe-area-inset-top));left:12px;z-index:20;background:#fff;border:1.5px solid #065043;color:#065043;border-radius:10px;padding:6px 12px;font:700 12px sans-serif;cursor:pointer">Français</button>
  <div class="ag-top">
    <svg class="bg" viewBox="0 0 400 330" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="agG1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a5f4e"/><stop offset="1" stop-color="#043a30"/></linearGradient>
        <linearGradient id="agG2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d8365" stop-opacity=".55"/><stop offset="1" stop-color="#065043" stop-opacity="0"/></linearGradient>
      </defs>
      <path d="M0 0H400V250C330 305 220 322 130 300C70 286 25 262 0 240Z" fill="url(#agG1)"/>
      <path d="M0 0H210C170 40 160 100 90 135C50 155 15 150 0 170Z" fill="url(#agG2)"/>
      <path d="M400 20C340 40 330 110 360 170C380 210 400 220 400 220Z" fill="url(#agG2)"/>
    </svg>
    <svg class="ag-logo" viewBox="0 0 120 120" aria-hidden="true">
      <defs><linearGradient id="agL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#b8dccf" stop-opacity=".85"/></linearGradient></defs>
      <g transform="rotate(-10 60 56)">
        <rect x="30" y="20" width="46" height="58" rx="9" fill="#0b6a57" opacity=".55"/>
        <rect x="40" y="14" width="46" height="60" rx="9" fill="url(#agL)"/>
        <path d="M52 44l9 10 16-20" fill="none" stroke="#065043" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <ellipse cx="60" cy="68" rx="46" ry="16" fill="none" stroke="#e8f6f0" stroke-opacity=".85" stroke-width="3" transform="rotate(-12 60 68)"/>
    </svg>
    <h1 class="ag-title">DEYN</h1>
    <div class="ag-sub"><i></i><span>سير ديونك بطريقة سهلة وذكية</span><i></i></div>
  </div>

  <div class="ag-body">
    <!-- معرّف الجهاز -->
    <div class="ag-card">
      <button type="button" class="ag-pill" id="agCopy" aria-label="نسخ معرّف الجهاز">
        <svg viewBox="0 0 24 24" fill="none" stroke="#065043" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="13" rx="3"/><path d="M16 8V6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h1"/></svg>
        <span>نسخ</span>
      </button>
      <div class="ag-mid"><div class="ag-lab">معرّف الجهاز</div><b class="ag-id" id="agDevId">----</b></div>
      <div class="ag-div"></div>
      <div class="ag-ic"><svg viewBox="0 0 48 48" fill="none"><rect x="12" y="3" width="24" height="42" rx="5" stroke="#065043" stroke-width="3"/><path d="M17 27a7 7 0 0 1 14 0z" fill="#065043"/><rect x="18" y="28.5" width="12" height="8" rx="2" fill="#065043"/><path d="M19 20l-2-3M29 20l2-3" stroke="#065043" stroke-width="2" stroke-linecap="round"/></svg></div>
    </div>

    <!-- كود التفعيل -->
    <div class="ag-card">
      <button type="button" class="ag-pill" id="agPaste" aria-label="لصق كود التفعيل">
        <svg viewBox="0 0 24 24" fill="none" stroke="#065043" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="13" rx="3"/><path d="M16 8V6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h1"/></svg>
        <span>لصق</span>
      </button>
      <input class="ag-inp" id="agCode" type="text" dir="auto" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="512" placeholder="ادخل كود التفعيل من عند الموزع" aria-label="كود التفعيل">
      <div class="ag-div"></div>
      <div class="ag-ic" style="background:transparent;width:clamp(36px,10vw,50px)"><svg viewBox="0 0 48 48" fill="none"><path d="M24 4l16 6v12c0 11-7 18-16 22C15 40 8 33 8 22V10z" fill="#065043"/><path d="M16 24l6 6 11-12" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    </div>

    <div class="ag-err" id="agErr" role="alert"></div>

    <button type="button" class="ag-go" id="agGo">
      <span>تفعيل</span>
      <span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke="#065043" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg></span>
    </button>
  </div>

  <div class="ag-foot">
    <svg class="bg" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 70C90 20 170 20 250 55C320 85 370 80 400 60V240H0Z" fill="#d5e8e1" opacity=".75"/>
      <path d="M0 130C80 95 150 110 220 135C290 160 350 150 400 120V240H0Z" fill="#9fc9bb" opacity=".55"/>
      <path d="M0 216C70 202 150 204 230 216C300 226 355 224 400 210V240H0Z" fill="#065043" opacity=".9"/>
    </svg>
    <div class="ag-badge"><i></i><svg viewBox="0 0 48 56" aria-hidden="true"><path d="M24 2l19 7v15c0 14-8 24-19 30C13 48 5 38 5 24V9z" fill="#0b6a57"/><rect x="15" y="25" width="18" height="14" rx="3" fill="#fff"/><path d="M18.5 25v-4a5.5 5.5 0 0 1 11 0v4" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="32" r="2.2" fill="#0b6a57"/></svg><i></i></div>
    <div class="ag-note">تطبيق آمن ويشتغل بدون انترنت</div>
  </div>
</div>

<div id="clockLock" role="alertdialog" aria-modal="true">
  <div class="cl-ic"><svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M5 5l1.5 1.5"/></svg></div>
  <p>تم رصد إرجاع وقت الهاتف. يرجى ضبط الساعة الحقيقية لمتابعة العمل.</p>
</div>
<div id="agToast" role="status" aria-live="polite"></div>
<div class="shell">
  <header class="hdr">
    <div class="hdr-row">
      <button class="sq" id="notifBellBtn" data-act="notifs" aria-label="التنبيهات" style="position:relative">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#34d399" style="display:block">
          <path d="M12 2a6 6 0 0 0-6 6c0 5.25-2.25 7-2.25 7h16.5S18 13.25 18 8a6 6 0 0 0-6-6zm-2 19a2 2 0 0 0 4 0h-4z"/>
        </svg>
        <span class="bell-badge" id="bellBadge" style="display:none;position:absolute;top:3px;right:3px;background:#ef4444;color:#fff;font-size:11px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;min-width:18px;height:18px;border-radius:9px;padding:0 4px;align-items:center;justify-content:center;border:2px solid #065043;line-height:1">0</span>
      </button>
      <div class="brand"><b>DEYN</b><span>تسيير الديون بكل سهولة</span></div>
      <button class="sq" data-act="settings" aria-label="الإعدادات">☰</button>
    </div>
  </header>

  <main>
    <!-- TAB 1 -->
    <section class="tab active" id="tab-quick">
      <div class="modesw" id="modeSw" data-mode="quick">
        <i class="thumb"></i>
        <button class="on" data-act="mode" data-m="quick">حساب سريع</button>
        <button data-act="mode" data-m="calc">آلة حاسبة</button>
      </div>

      <div class="dcard">
        <div class="dtop"><span id="dMode">المبلغ المسجّل</span><span class="mind" id="mInd" hidden>M</span></div>
        <div class="tape empty" id="tape"></div>
        <div class="amount"><span class="num" id="amt">0</span><span class="cur">دج</span></div>
        <div class="dial" id="dial"></div>
      </div>

      <div id="paneQuick">
        <div class="sec-t">قطع نقدية</div>
        <div class="grid6" id="coins"></div>
        <div class="sec-t">أوراق نقدية</div>
        <div class="grid5" id="notes"></div>
      </div>

      <div id="paneCalc" hidden>
        <div class="keys">
          <button class="k mem" data-act="k" data-k="MU">MU</button>
          <button class="k mem" data-act="k" data-k="MRC">MRC</button>
          <button class="k mem" data-act="k" data-k="M-">M-</button>
          <button class="k mem" data-act="k" data-k="M+">M+</button>
          <button class="k mem" data-act="k" data-k="CHECK">CHECK</button>

          <button class="k fn" data-act="k" data-k="√">√</button>
          <button class="k fn" data-act="k" data-k="%">%</button>
          <button class="k fn" data-act="k" data-k="±">+/-</button>
          <button class="k fn" data-act="k" data-k="CE">CE</button>
          <button class="k ac" data-act="k" data-k="AC">ON/AC</button>

          <button class="k" data-act="k" data-k="7">7</button>
          <button class="k" data-act="k" data-k="8">8</button>
          <button class="k" data-act="k" data-k="9">9</button>
          <button class="k op" data-act="k" data-k="÷">÷</button>
          <button class="k op" data-act="k" data-k="×">×</button>

          <button class="k" data-act="k" data-k="4">4</button>
          <button class="k" data-act="k" data-k="5">5</button>
          <button class="k" data-act="k" data-k="6">6</button>
          <button class="k op" data-act="k" data-k="−">−</button>
          <button class="k op" data-act="k" data-k="+">+</button>

          <button class="k" data-act="k" data-k="1">1</button>
          <button class="k" data-act="k" data-k="2">2</button>
          <button class="k" data-act="k" data-k="3">3</button>
          <button class="k" data-act="k" data-k="00">00</button>
          <button class="k" data-act="k" data-k=".">.</button>

          <button class="k s2" data-act="k" data-k="0">0</button>
          <button class="k eq s3" data-act="k" data-k="=">=</button>
        </div>
      </div>

      <input class="inp" id="tagInput" type="text" maxlength="40" placeholder="مثال: جاري" autocomplete="off" aria-label="وسم">
      <div class="actbar">
        <button class="btn" data-act="undo">تراجع</button>
        <button class="btn dng" data-act="clear">حذف</button>
        <button class="btn pri" data-act="save">حفظ</button>
      </div>
    </section>

    <!-- TAB 2 -->
    <section class="tab" id="tab-pending">
      <div class="bar-h" style="padding:10px 14px"><div class="ic" style="width:36px;height:36px;border-radius:11px">⏳</div><h2 style="font-size:15.5px">دين معلق <span style="font-size:11.5px;color:var(--mute);font-weight:400">· ترحيل فوري للمبالغ إلى الزبائن</span></h2><span class="cnt" id="pendCount">0</span></div>
      <div id="pendList"></div>
    </section>

    <!-- TAB 3 -->
    <section class="tab" id="tab-ledger">
      <div class="toolbar">
        <input class="inp" id="custSearch" data-in="csearch" type="search" placeholder="ابحث بالاسم أو الهاتف" autocomplete="off">
        <button class="btn soft" data-act="newCust">+ زبون</button>
      </div>
      <div class="chips" id="segChips"></div>
      <div id="custList"></div>
    </section>

    <!-- TAB 4 -->
    <section class="tab" id="tab-stats">
      <h2 class="pg-t">الإحصائيات وخزينة الديون</h2>
      <div id="statsBody"></div>
    </section>
  </main>

  <nav class="bnav" aria-label="التنقل">
    <button class="nb on" data-act="go" data-t="quick"><span class="i">⚡</span>دين سريع</button>
    <button class="nb" data-act="go" data-t="pending"><span class="i">⏳</span>دين معلق<span class="bd" id="navBd" hidden>0</span></button>
    <button class="nb" data-act="go" data-t="ledger"><span class="i">👥</span>دفتر الزبائن</button>
    <button class="nb" data-act="go" data-t="stats"><span class="i">📊</span>الإحصائيات</button>
  </nav>
</div>


<!-- قفل التطبيق لحماية الخصوصية ومنع التطفل -->
<div id="appLockOverlay" style="display:none;position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#065043 0%,#042a23 100%);color:#fff;flex-direction:column;align-items:center;justify-content:center;padding:24px;direction:rtl">
  <div style="width:72px;height:72px;border-radius:24px;background:rgba(255,255,255,0.1);display:grid;place-items:center;font-size:36px;margin-bottom:16px;box-shadow:0 8px 24px rgba(0,0,0,0.2)">
    🔒
  </div>
  <h2 style="font-size:22px;margin:0 0 6px;font-weight:800;letter-spacing:.03em">تطبيق DEYN مقفل</h2>
  <p style="font-size:13px;color:#b9d6cf;margin:0 0 24px;text-align:center">لحماية سجلات وديون متجرك من التطفل، يرجى إدخال كلمة المرور:</p>
  
  <div style="width:100%;max-width:320px">
    <input type="password" id="appLockPassInput" placeholder="أدخل كلمة المرور..." style="width:100%;height:52px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.25);border-radius:14px;color:#fff;font-size:18px;text-align:center;padding:0 16px;outline:none;margin-bottom:12px" autocomplete="off">
    <button type="button" data-act="unlockApp" style="width:100%;height:50px;background:#22c55e;border:none;border-radius:14px;color:#fff;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(34,197,94,0.3)">فتح التطبيق 🔓</button>
    <button type="button" data-act="forgotPassPrompt" style="width:100%;background:transparent;border:none;color:#94a3b8;font-size:12px;margin-top:14px;cursor:pointer;text-decoration:underline">نسيت كلمة المرور؟</button>
  </div>
</div>

<div id="modalRoot"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
'use strict';
/* ============ Helpers ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAY = 864e5;
const pad = n => String(n).padStart(2, '0');
let uidFallbackCounter = 0;
const uid = () => {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16); window.crypto.getRandomValues(bytes);
      return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  uidFallbackCounter += 1;
  return 'legacy-' + Date.now().toString(36) + '-' + uidFallbackCounter.toString(36) + '-' + Math.random().toString(36).slice(2);
};
const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const sum = a => a.reduce((x, y) => x + y, 0);
function fmt(n) {
  n = round2(n); const neg = n < 0; n = Math.abs(n);
  let [i, f] = n.toFixed(2).split('.');
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  f = f === '00' ? '' : '.' + f.replace(/0$/, '');
  return (neg ? '-' : '') + i + f;
}
const fmtN = n => String(round2(n));
function parseAmt(s) {
  s = String(s || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[\s\u00A0]/g, '').replace(/[,،]/g, '.');
  return parseFloat(s);
}
const timeStr = ts => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const dateStr = ts => { const d = new Date(ts); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + String(d.getFullYear()).slice(2); };
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const norm = s => String(s || '').toLowerCase().replace(/[\u064B-\u065F\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

/* ============ Algerian dialect phrasing ============ */
function dialect(d) {
  d = round2(d);
  if (!(d > 0)) return '';
  if (typeof DEYN_I18N !== 'undefined' && DEYN_I18N.lang === 'fr' && typeof DEYN_I18N.dialectFr === 'function') return DEYN_I18N.dialectFr(d);

  // خريطة الفكة التراثية بالدورو (1 دج = 20 دورو)
  const doroMap = {
    1: 'عشرين دورو',
    2: 'ربعين دورو',
    3: 'ستين دورو',
    4: 'ثمانين دورو'
  };

  const intPart = Math.floor(d);
  const base5 = Math.floor(intPart / 5) * 5;
  const rem = intPart % 5;

  // تحويل مضاعفات الـ 5 دينار (الآلاف والملايين بالسنتيم)
  function base5Dialect(b) {
    if (b <= 0) return '';
    if (b < 30 && b % 10 === 5) {
      const n = Math.floor(b / 5);
      return n === 1 ? 'ميادورو' : (n === 3 ? 'تلاث ميادورو' : 'خمس ميادورو');
    }

    const millions = Math.floor(b / 10000);
    const remDA = Math.round(b % 10000);

    if (millions >= 1) {
      let mStr = (millions === 1) ? 'مليون' : (millions === 2) ? 'زوج ملاين' : (millions <= 10) ? (millions + ' ملاين') : (millions + ' مليون');
      if (remDA === 0) return mStr;
      if (remDA === 5000) return mStr + ' ونص';
      const remTh = base5Dialect(remDA);
      return remTh ? `${mStr} و${remTh}` : mStr;
    }

    const half = (b % 10 === 5);
    const t = Math.floor(b / 10);
    if (t === 0) return b === 5 ? 'ميادورو' : '';
    let w = (t === 1) ? 'ألف' : (t === 2) ? 'ألفين' : (t <= 10) ? (t + ' آلاف') : (t + ' ألف');
    return half ? (w + ' ونص') : w;
  }

  const baseStr = base5Dialect(base5);

  if (rem === 0) {
    return baseStr;
  }

  const remStr = doroMap[rem] || '';
  if (!baseStr) {
    return remStr;
  }
  return `${baseStr} و${remStr}`;
}
const dialShown = n => (S.settings.dialect ? dialect(n) : '');

/* ============ Data ============ */
const DEFAULT_SEGS = {
  salaried: { label: 'شهارة', icon: '💼', ceiling: 30000 },
  youth:    { label: 'ليجان (الشباب)', icon: '🏃', ceiling: 3000 },
  daily:    { label: 'بطالة / عمال يوميون', icon: '⏳', ceiling: 5000 },
  black:    { label: 'القائمة السوداء', icon: '🚫', ceiling: 0 }
};

const SEG = new Proxy({}, {
  get(target, prop) {
    if (S && S.customSegs && S.customSegs[prop]) return S.customSegs[prop];
    return DEFAULT_SEGS[prop] || { label: prop, icon: '🏷️', ceiling: 0 };
  }
});

function getSegOrder() {
  const deleted = (S && S.deletedSegs) || [];
  const defaults = ['salaried', 'youth', 'daily'].filter(k => !deleted.includes(k));
  const custom = (S && S.customSegs) ? Object.keys(S.customSegs).filter(k => !deleted.includes(k)) : [];
  const res = [...defaults, ...custom.filter(k => !['salaried', 'youth', 'daily', 'black'].includes(k))];
  if (!deleted.includes('black')) res.push('black');
  return res.length ? res : ['daily'];
}
const SEG_ORDER = ['salaried', 'youth', 'daily', 'black'];
/* الديون المضمونة: يحدد التاجر الفئات التي تسدد في موعدها تلقائياً (الشهارة مضمونة افتراضياً) */
function isGuaranteed(key) {
  const g = (S && S.guaranteed) || {};
  if (key in g) return !!g[key];
  return key === 'salaried';
}
const KEY = 'deyn.v1';
let S;
let storageBlocked = false;
function readStoredState() {
  let raw;
  try { raw = localStorage.getItem(KEY); }
  catch (error) { return { status: 'unavailable', raw: null, error }; }
  if (raw === null) return { status: 'missing', raw: null };
  try {
    const value = JSON.parse(raw);
    if (value && Array.isArray(value.customers) && Array.isArray(value.pending)) return { status: 'valid', value, raw };
    return { status: 'corrupt', raw, error: new Error('Invalid DEYN data structure') };
  } catch (error) { return { status: 'corrupt', raw, error }; }
}
function showStorageRecovery(state, writeFailure) {
  storageBlocked = true;
  const canExport = typeof state.raw === 'string';
  document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;padding:22px;background:#f4f7f6;font-family:system-ui,sans-serif;color:#18332e;direction:rtl">' +
    '<section style="width:min(100%,520px);background:#fff;border:1px solid #d9e5e1;border-radius:20px;padding:24px;box-shadow:0 12px 40px #163b3014">' +
    '<div style="font-size:30px;margin-bottom:10px">⚠️</div><h2 style="margin:0 0 12px;font-size:21px">توقّف مؤقت لحماية بياناتك</h2>' +
    '<p style="line-height:1.9;margin:0 0 12px">' + (writeFailure ? 'تعذّر حفظ آخر تغيير. أوقفنا الاستخدام حتى لا تواصل إدخال بيانات قد لا تُحفظ.' : 'تعذّر قراءة بيانات DEYN بشكل سليم. لم نستبدلها بالبيانات التجريبية ولم نحذفها.') + '</p>' +
    '<p style="line-height:1.9;color:#8a4b16;margin:0 0 18px">لا تحذف التطبيق، ولا تمسح بياناته أو ذاكرته المؤقتة، ولا تضغط على إعادة التصفير.</p>' +
    (canExport ? '<button id="deynExportRaw" style="width:100%;padding:14px;border:0;border-radius:12px;background:#075447;color:white;font-weight:700;font-size:15px">حفظ نسخة إنقاذ من البيانات الموجودة</button>' : '') +
    '<p style="font-size:12px;color:#667873;line-height:1.8;margin:14px 0 0">ملف الإنقاذ قد يحتوي بيانات خاصة وكلمات مرور قديمة. احتفظ به في مكان آمن ولا ترسله قبل مراجعته.</p></section></main>';
  const btn = document.getElementById('deynExportRaw');
  if (btn) btn.addEventListener('click', () => {
    try {
      const blob = new Blob([state.raw], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'deyn-emergency-recovery.txt'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (e) { alert('تعذّر إنشاء ملف الإنقاذ. لا تمسح بيانات التطبيق.'); }
  });
}
/* ============ Encrypted storage: AES-256-GCM, key lives in Android Keystore (native DeynVault plugin) ============
   JavaScript never sees the key: it only asks the plugin to encrypt/decrypt. Two alternating slots (a/b) mean the last good copy is
   never overwritten before the new one is written AND read back successfully. */
const KEY2A = 'deyn.v2.a', KEY2B = 'deyn.v2.b', KEYMETA = 'deyn.v2.meta', VAULT_AAD = 'DEYN-DATA-V2';
let vaultMode = false, vaultFlushing = false, vaultPending = null, vaultChain = Promise.resolve(), vaultN = 0, vaultSlot = 'b';
const vb64 = u8 => { let t = ''; for (let i = 0; i < u8.length; i++) t += String.fromCharCode(u8[i]); return btoa(t); };
const vunb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
const Vault = {
  plug() { try { return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynVault) || null; } catch (e) { return null; } },
  async available() { const p = this.plug(); if (!p || !p.status) return false; try { const r = await p.status(); return !!(r && r.ready); } catch (e) { return false; } },
  async enc(text) { const r = await this.plug().encrypt({ data: vb64(new TextEncoder().encode(text)), aad: VAULT_AAD }); if (!r || !r.iv || !r.data) throw new Error('vault encrypt failed'); return { iv: r.iv, ct: r.data }; },
  async dec(rec) { const r = await this.plug().decrypt({ iv: rec.iv, data: rec.ct, aad: VAULT_AAD }); return new TextDecoder().decode(vunb64(r.data)); }
};
async function readSlot(key) {
  let raw;
  try { raw = localStorage.getItem(key); } catch (e) { return { status: 'unavailable' }; }
  if (raw === null) return { status: 'missing' };
  let rec;
  try { rec = JSON.parse(raw); if (!rec || rec.v !== 2 || typeof rec.iv !== 'string' || typeof rec.ct !== 'string' || !Number.isInteger(rec.n)) throw 0; }
  catch (e) { return { status: 'corrupt', raw }; }
  try {
    const text = await Vault.dec(rec), value = JSON.parse(text);
    if (value && Array.isArray(value.customers) && Array.isArray(value.pending)) return { status: 'valid', value, text, n: rec.n, raw };
    return { status: 'corrupt', raw };
  } catch (e) { return { status: 'undecryptable', raw }; }   // wrong key, tampered or damaged ciphertext (GCM tag mismatch)
}
async function readV2() {
  const a = await readSlot(KEY2A), b = await readSlot(KEY2B);
  const ok = [['a', a], ['b', b]].filter(x => x[1].status === 'valid').sort((x, y) => y[1].n - x[1].n);
  const bad = x => x.status !== 'valid' && x.status !== 'missing';
  if (ok.length) return Object.assign({ status: 'valid', slot: ok[0][0], degraded: bad(a) || bad(b) }, ok[0][1]);
  if (a.status === 'missing' && b.status === 'missing') return { status: 'missing' };
  return { status: 'bad', raw: a.raw || b.raw || null, a: a.status, b: b.status };
}
async function writeV2(text) {
  const slot = vaultSlot === 'a' ? 'b' : 'a', key = slot === 'a' ? KEY2A : KEY2B, n = vaultN + 1;
  const e = await Vault.enc(text);
  localStorage.setItem(key, JSON.stringify({ v: 2, iv: e.iv, ct: e.ct, n }));
  const back = await readSlot(key);                                  // read back + decrypt + compare before trusting the new copy
  if (back.status !== 'valid' || back.text !== text || back.n !== n) { try { localStorage.removeItem(key); } catch (x) {} throw new Error('vault read-back mismatch'); }
  vaultSlot = slot; vaultN = n;
}
function vaultKick() {
  if (vaultFlushing) return;
  vaultFlushing = true;
  vaultChain = (async () => {
    try {
      while (vaultPending !== null) {
        const snap = vaultPending; vaultPending = null;
        try { await writeV2(snap); }
        catch (err) { vaultPending = null; showStorageRecovery({ raw: snap, error: err }, true); return; }
      }
    } finally { vaultFlushing = false; }
  })();
}
const deynFlush = () => vaultChain;
function collectIds(s) {
  const set = new Set();
  (s.customers || []).forEach(c => { set.add(c.id); (c.tx || []).forEach(t => set.add(t.id)); });
  (s.trash || []).forEach(t => { const d = t && t.data; if (d && d.id) { set.add(d.id); (d.tx || []).forEach(x => set.add(x.id)); } });
  return set;
}
const legacyCovered = (legacy, cur) => { const have = collectIds(cur); for (const id of collectIds(legacy)) if (!have.has(id)) return false; return true; };
// Returns {status:'valid'|'missing'|'corrupt'|'unavailable', value?, raw?, vault:'on'|'unavailable'|'bad'|'migration-failed'}
async function loadState() {
  const legacy = readStoredState();
  if (!(await Vault.available())) { vaultMode = false; return Object.assign({ vault: 'unavailable' }, legacy); }
  const v2 = await readV2();
  let meta = {}; try { meta = JSON.parse(localStorage.getItem(KEYMETA) || '{}') || {}; } catch (e) {}
  if (v2.status === 'valid') {
    vaultMode = true; vaultSlot = v2.slot; vaultN = v2.n;
    if (legacy.status === 'valid') {                                 // phase 2: remove the plaintext copy only after a later verified boot
      const boots = (meta.boots || 0);
      if (boots >= 1 && (legacyCovered(legacy.value, v2.value) || boots >= 3)) { try { localStorage.removeItem(KEY); localStorage.removeItem(KEYMETA); } catch (e) {} }
      else { try { localStorage.setItem(KEYMETA, JSON.stringify({ migrated: true, boots: boots + 1 })); } catch (e) {} }
    }
    return { status: 'valid', value: v2.value, raw: v2.text, vault: 'on', degraded: !!v2.degraded };
  }
  if (v2.status === 'missing') {
    if (legacy.status === 'valid') {                                 // phase 1: encrypt, verify round trip, keep legacy untouched
      try {
        vaultMode = true; vaultSlot = 'b'; vaultN = 0;
        await writeV2(legacy.raw);
        try { localStorage.setItem(KEYMETA, JSON.stringify({ migrated: true, boots: 0 })); } catch (e) {}
        return Object.assign({ vault: 'on' }, legacy);
      } catch (e) { vaultMode = false; try { localStorage.removeItem(KEY2A); localStorage.removeItem(KEY2B); } catch (x) {} return Object.assign({ vault: 'migration-failed' }, legacy); }
    }
    if (legacy.status === 'missing') { vaultMode = true; vaultSlot = 'b'; vaultN = 0; return { status: 'missing', vault: 'on' }; }
    return Object.assign({ vault: 'unavailable' }, legacy);          // legacy corrupt: rescue screen, never overwrite
  }
  // encrypted copy exists but cannot be read: NEVER silently fall back to an older plaintext copy or reseed demo data
  vaultMode = false;
  const rescueRaw = v2.raw || (legacy.status === 'valid' ? legacy.raw : null);
  return { status: 'corrupt', raw: rescueRaw, vault: 'bad', error: new Error('Encrypted DEYN data could not be decrypted') };
}
function persist() {
  if (storageBlocked) return false;
  if (typeof sySchedule === 'function') sySchedule();
  if (vaultMode) { vaultPending = JSON.stringify(S); vaultKick(); return true; }
  try {
    const serialized = JSON.stringify(S);
    localStorage.setItem(KEY, serialized);
    if (localStorage.getItem(KEY) !== serialized) throw new Error('Storage read-back mismatch');
    return true;
  } catch (error) {
    showStorageRecovery({ raw: (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })(), error }, true);
    return false;
  }
}

/*SYNC-BEGIN (generated by tools/embed_sync.py - do not edit here)*/
const DeynSyncLib = (() => {
/* ---- engine.js ---- */
// DEYN sync engine: append-only event log + deterministic merge. Pure JS (no DOM, no network, no crypto) so it is unit-testable.
// Rules: financial transactions are immutable and merged by union on their unique id; customer fields are last-writer-wins per field (hybrid
// logical clock, loser kept in S.sync.conflicts); archive/restore and ticket removal are state events; nothing ever replaces a whole database;
// a wipe / bulk delete is never propagated; settings, passwords and licences are never synchronised.
const MAX_EVENTS_PER_BATCH = 200;
const FIELD_MAX = 2000;
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const clone = v => JSON.parse(JSON.stringify(v));
const jstr = v => JSON.stringify(v === undefined ? null : v);

// ---- hybrid logical clock (string form sorts lexicographically) ----
const hlcStr = (l, c, did) => String(l).padStart(15, '0') + '.' + String(c).padStart(5, '0') + '.' + did;
function hlcTick(sy, now) {
  if (now > sy.hlc.l) { sy.hlc.l = now; sy.hlc.c = 0; } else sy.hlc.c += 1;
  return hlcStr(sy.hlc.l, sy.hlc.c, sy.did);
}
function hlcRecv(sy, remote, now) {
  const m = /^(\d{15})\.(\d{5})\./.exec(remote); if (!m) return;
  const rl = Number(m[1]), rc = Number(m[2]);
  const l = Math.max(sy.hlc.l, rl, now);
  sy.hlc.c = (l === sy.hlc.l && l === rl) ? Math.max(sy.hlc.c, rc) + 1 : (l === sy.hlc.l ? sy.hlc.c + 1 : (l === rl ? rc + 1 : 0));
  sy.hlc.l = l;
}

function ensureSync(S, did) {
  if (!isObj(S.sync) || S.sync.did !== did) {
    const keep = isObj(S.sync) ? S.sync : {};
    S.sync = { did, hlc: keep.hlc || { l: 0, c: 0 }, seq: keep.seq || 0, log: keep.log || [], snap: keep.snap || null, peers: keep.peers || {}, fh: keep.fh || {}, sh: keep.sh || {}, orphans: keep.orphans || [], conflicts: keep.conflicts || [], quarantine: keep.quarantine || [], diverged: keep.diverged || false };
  }
  return S.sync;
}
const custBase = c => { const o = {}; for (const k of Object.keys(c)) if (k !== 'tx') o[k] = c[k]; return o; };
const txExtHash = t => jstr({ dueAt: t.dueAt ?? null, originalDueAt: t.originalDueAt ?? null, extensionHistory: Array.isArray(t.extensionHistory) ? t.extensionHistory : null });
const trashCust = S => (S.trash || []).filter(t => t && t.type === 'customer' && t.data && t.data.id);
const trashTkt = S => (S.trash || []).filter(t => t && t.type === 'ticket' && t.data && t.data.id);

// ---- snapshot: what we already turned into events ----
function buildSnap(S) {
  const snap = { cs: {}, tx: {}, tk: {} };
  for (const c of S.customers) { snap.cs[c.id] = { a: 1, f: Object.fromEntries(Object.entries(custBase(c)).map(([k, v]) => [k, jstr(v)])) }; for (const t of c.tx || []) snap.tx[t.id] = txExtHash(t); }
  for (const it of trashCust(S)) { const d = it.data; snap.cs[d.id] = { a: 0, f: Object.fromEntries(Object.entries(custBase(d)).map(([k, v]) => [k, jstr(v)])) }; for (const t of d.tx || []) snap.tx[t.id] = txExtHash(t); }
  for (const t of S.pending) snap.tk[t.id] = { tag: jstr(t.tag) };
  return snap;
}
function push(sy, now, body) {
  sy.seq += 1; const h = hlcTick(sy, now);
  const ev = Object.assign({ id: sy.did + ':' + sy.seq, s: sy.seq, h }, body);
  sy.log.push(ev); return ev;
}
// Turn local changes since the last snapshot into log events. Call before every sync.
function captureLocal(S, did, now) {
  const sy = ensureSync(S, did);
  if (!sy.snap) { sy.snap = { cs: {}, tx: {}, tk: {} }; }
  const snap = sy.snap, seenTx = new Set(Object.keys(snap.tx));
  const emitTx = (cid, c) => {
    for (const t of c.tx || []) {
      const hVal = txExtHash(t);
      if (!snap.tx[t.id]) {
        push(sy, now, { k: 'tx', cid, tx: clone(t) });
        snap.tx[t.id] = hVal;
        if (t.dueAt || (Array.isArray(t.extensionHistory) && t.extensionHistory.length)) {
          sy.fh['tx:' + cid + '.' + t.id] = sy.log[sy.log.length - 1].h;
        }
      } else if (snap.tx[t.id] !== hVal && (snap.tx[t.id] !== 1 || t.dueAt || (Array.isArray(t.extensionHistory) && t.extensionHistory.length))) {
        const ev = push(sy, now, {
          k: 'txf',
          cid,
          tid: t.id,
          dueAt: t.dueAt ?? null,
          originalDueAt: t.originalDueAt ?? null,
          extensionHistory: clone(Array.isArray(t.extensionHistory) ? t.extensionHistory : [])
        });
        sy.fh['tx:' + cid + '.' + t.id] = ev.h;
        snap.tx[t.id] = hVal;
      }
    }
  };
  for (const c of S.customers) {
    const prev = snap.cs[c.id];
    if (!prev) { push(sy, now, { k: 'cust+', c: clone(custBase(c)) }); snap.cs[c.id] = { a: 1, f: Object.fromEntries(Object.entries(custBase(c)).map(([k, v]) => [k, jstr(v)])) }; const h0 = sy.log[sy.log.length - 1].h; sy.sh[c.id] = h0; for (const k of Object.keys(custBase(c))) sy.fh[c.id + '.' + k] = h0; }
    else {
      if (prev.a === 0) { const ev = push(sy, now, { k: 'cst', cid: c.id, st: 'active' }); sy.sh[c.id] = ev.h; prev.a = 1; }
      const changed = {}; const cur = custBase(c);
      for (const k of Object.keys(cur)) { const j = jstr(cur[k]); if (prev.f[k] !== j) { changed[k] = clone(cur[k]); prev.f[k] = j; } }
      if (Object.keys(changed).length) { const ev = push(sy, now, { k: 'cf', cid: c.id, f: changed }); for (const k of Object.keys(changed)) sy.fh[c.id + '.' + k] = ev.h; }
    }
    emitTx(c.id, c);
  }
  for (const it of trashCust(S)) {
    const d = it.data, prev = snap.cs[d.id];
    if (!prev) { push(sy, now, { k: 'cust+', c: clone(custBase(d)) }); snap.cs[d.id] = { a: 1, f: Object.fromEntries(Object.entries(custBase(d)).map(([k, v]) => [k, jstr(v)])) }; }
    emitTx(d.id, d);
    if (snap.cs[d.id].a !== 0) { const ev = push(sy, now, { k: 'cst', cid: d.id, st: 'archived', at: it.deletedAt || now }); sy.sh[d.id] = ev.h; snap.cs[d.id].a = 0; }
  }
  // customers that vanished with no trash record (wipe/clear): never propagated
  const present = new Set([...S.customers.map(c => c.id), ...trashCust(S).map(t => t.data.id)]);
  for (const id of Object.keys(snap.cs)) if (!present.has(id)) { sy.diverged = true; delete snap.cs[id]; }
  // tickets
  const txSig = new Set(); for (const c of S.customers) for (const t of c.tx || []) if (t.tape) txSig.add(t.tape + '|' + t.ts);
  for (const t of S.pending) {
    const prev = snap.tk[t.id];
    if (!prev) { push(sy, now, { k: 'tk+', t: clone(t) }); snap.tk[t.id] = { tag: jstr(t.tag) }; }
    else if (prev.tag !== jstr(t.tag)) { const ev = push(sy, now, { k: 'tkf', tid: t.id, f: { tag: t.tag } }); sy.fh['t:' + t.id + '.tag'] = ev.h; prev.tag = jstr(t.tag); }
  }
  const pend = new Set(S.pending.map(t => t.id)), arch = new Set(trashTkt(S).map(x => x.data.id));
  const tkSrc = {}; for (const t of trashTkt(S)) tkSrc[t.data.id] = t.data;
  for (const id of Object.keys(snap.tk)) if (!pend.has(id)) {
    if (arch.has(id)) push(sy, now, { k: 'tkx', tid: id, why: 'archived' });
    else { /* consumed only if a transaction carrying its signature exists (assignment); otherwise it is a wipe: ignore */
      const sig = sy._lastTk && sy._lastTk[id]; if (sig && txSig.has(sig)) push(sy, now, { k: 'tkx', tid: id, why: 'consumed', sig }); else sy.diverged = true; }
    delete snap.tk[id];
  }
  sy._lastTk = Object.fromEntries(S.pending.map(t => [t.id, t.tape + '|' + t.ts]));
  return sy;
}
// Rebuild the snapshot from the current state (after applying remote events, so they are not re-emitted).
function resnapshot(S, did) { const sy = ensureSync(S, did); sy.snap = buildSnap(S); sy._lastTk = Object.fromEntries(S.pending.map(t => [t.id, t.tape + '|' + t.ts])); }
const eventsAfter = (S, did, peerRecv) => ensureSync(S, did).log.filter(e => e.s > peerRecv);

// ---- validation & permissions (enforced by the RECEIVER from the pinned role of the sender) ----
const okStr = (v, n = FIELD_MAX) => typeof v === 'string' && v.length <= n;
const okNum = v => typeof v === 'number' && Number.isFinite(v);
function validTx(t) { return isObj(t) && okStr(t.id, 64) && (t.type === 'debt' || t.type === 'pay') && okNum(t.amount) && t.amount > 0 && t.amount < 1e12 && okNum(t.ts) && (t.note === undefined || okStr(t.note)); }
function validCust(c) { return isObj(c) && okStr(c.id, 64) && okStr(c.name, 200) && JSON.stringify(c).length < 20000; }
function checkEvent(ev, senderRole, S, did) {
  const bad = r => ({ ok: false, reason: r });
  if (!isObj(ev) || !okStr(ev.id, 100) || !Number.isSafeInteger(ev.s) || !okStr(ev.h, 80) || !/^\d{15}\.\d{5}\./.test(ev.h)) return bad('shape');
  const hasC = id => S.customers.some(c => c.id === id) || trashCust(S).some(t => t.data.id === id);
  const W = senderRole === 'W';
  switch (ev.k) {
    case 'tx': {
      if (!validTx(ev.tx) || !okStr(ev.cid, 64)) return bad('tx-shape');
      if (W && ev.tx.type === 'debt') {
        const cur = S.customers.find(c => c.id === ev.cid);
        const unblockedInBatch = Array.isArray(S.__batchUnblockedCids) && S.__batchUnblockedCids.includes(ev.cid);
        if (cur && cur.seg === 'black' && !unblockedInBatch) return bad('worker-debt-to-blocked');
      }
      return { ok: true };
    }
    case 'txf':
      if (!okStr(ev.cid, 64) || !okStr(ev.tid, 64)) return bad('txf-shape');
      if (ev.dueAt !== null && ev.dueAt !== undefined && !okNum(ev.dueAt)) return bad('txf-shape');
      if (ev.originalDueAt !== null && ev.originalDueAt !== undefined && !okNum(ev.originalDueAt)) return bad('txf-shape');
      if (ev.extensionHistory !== undefined && (!Array.isArray(ev.extensionHistory) || ev.extensionHistory.length > 200)) return bad('txf-shape');
      return { ok: true };
    case 'cust+': {
      if (!validCust(ev.c)) return bad('cust-shape');
      if (W) {
        const segDefaults = { salaried: 30000, youth: 3000, daily: 5000, black: 0 };
        const customSegs = (S && S.customSegs) || {};
        const validSegs = new Set([...Object.keys(segDefaults), ...Object.keys(customSegs)]);
        if (ev.c.seg !== undefined && !validSegs.has(ev.c.seg)) return bad('worker-invalid-segment');
        if (ev.c.ceiling !== undefined && (!okNum(ev.c.ceiling) || ev.c.ceiling < 0 || ev.c.ceiling > 100000)) return bad('worker-invalid-ceiling');
        if (Array.isArray(ev.c.tx) && ev.c.tx.length > 0) return bad('worker-cust-with-tx');
      }
      return { ok: true };
    }
    case 'cf': if (!isObj(ev.f) || !okStr(ev.cid, 64) || JSON.stringify(ev.f).length > 20000) return bad('cf-shape');
      if ('tx' in ev.f || 'id' in ev.f) return bad('cf-forbidden-field');
      // same power the worker UI already has: auto-block / unblock-by-assignment change only segment and ceiling; name, phone, pay day stay owner-only
      if (W) {
        const cur = S.customers.find(c => c.id === ev.cid);
        if (!cur || !Object.keys(ev.f).every(k => k === 'seg' || k === 'ceiling')) return bad('worker-cannot-edit-customer');
        const segDefaults = { salaried: 30000, youth: 3000, daily: 5000, black: 0 };
        const customSegs = (S && S.customSegs) || {};
        const validActiveSegs = new Set([...Object.keys(segDefaults).filter(k => k !== 'black'), ...Object.keys(customSegs).filter(k => k !== 'black')]);
        if ('seg' in ev.f && !(ev.f.seg === 'black' || (cur.seg === 'black' && validActiveSegs.has(ev.f.seg)))) return bad('worker-cannot-edit-customer');
        if ('ceiling' in ev.f) {
          if (!(cur.ceiling === 0 && okNum(ev.f.ceiling) && ev.f.ceiling >= 0 && ev.f.ceiling <= 100000)) return bad('worker-cannot-edit-customer');
          const targetSeg = ('seg' in ev.f) ? ev.f.seg : cur.seg;
          const segObj = customSegs[targetSeg];
          const maxAllowed = segObj && okNum(segObj.ceiling) ? Math.max(segObj.ceiling, 10000) : Math.max(segDefaults[targetSeg] || 10000, 10000);
          if (ev.f.ceiling > maxAllowed) return bad('worker-cannot-edit-customer');
        }
      }
      return { ok: true };
    case 'cst': if (W) return bad('worker-cannot-archive'); if (!okStr(ev.cid, 64) || (ev.st !== 'archived' && ev.st !== 'active')) return bad('cst-shape'); return { ok: true };
    case 'tk+': if (!isObj(ev.t) || !okStr(ev.t.id, 64) || !okNum(ev.t.amount) || ev.t.amount < 0) return bad('tk-shape'); return { ok: true };
    case 'tkf': if (!isObj(ev.f) || !okStr(ev.tid, 64) || Object.keys(ev.f).some(k => k !== 'tag') || !okStr(ev.f.tag, 500)) return bad('tkf-shape'); return { ok: true };
    case 'tkx': {
      if (!okStr(ev.tid, 64) || (ev.why !== 'archived' && ev.why !== 'consumed')) return bad('tkx-shape');
      if (W && ev.why === 'archived') return bad('worker-cannot-delete-ticket');
      if (W && ev.why === 'consumed') {
        const targetTkt = S.pending.find(t => t.id === ev.tid);
        if (targetTkt) {
          const expectedSig = targetTkt.tape + '|' + targetTkt.ts;
          const batchHasTx = Array.isArray(S.__batchTxSigs) && S.__batchTxSigs.includes(expectedSig);
          const stateHasTx = S.customers.some(c => (c.tx || []).some(t => t.tape && (t.tape + '|' + t.ts) === expectedSig));
          if (!batchHasTx && !stateHasTx) return bad('worker-tkx-unproven');
        } else if (!okStr(ev.sig, 200)) {
          return bad('worker-tkx-unproven');
        }
      }
      return { ok: true };
    }
    default: return bad('unknown-kind');
  }
}
function findCust(S, id) { const c = S.customers.find(x => x.id === id); if (c) return { c, where: 'active' }; const t = trashCust(S).find(x => x.data.id === id); return t ? { c: t.data, where: 'trash', item: t } : null; }
function recordConflict(sy, rec) { sy.conflicts.push(rec); if (sy.conflicts.length > 200) sy.conflicts.shift(); }
function applyOne(S, sy, ev, now) {
  switch (ev.k) {
    case 'tx': {
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      if (f.c.tx.some(t => t.id === ev.tx.id)) return 'dup';
      f.c.tx.push(clone(ev.tx)); return 'applied';
    }
    case 'txf': {
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      const t = (f.c.tx || []).find(x => x.id === ev.tid);
      if (!t) { sy.orphans.push(ev); return 'orphan'; }
      const key = 'tx:' + ev.cid + '.' + ev.tid, cur = sy.fh[key] || '';
      if (ev.h > cur) {
        if (ev.originalDueAt !== undefined && ev.originalDueAt !== null) t.originalDueAt = ev.originalDueAt;
        if (ev.dueAt !== undefined && ev.dueAt !== null) t.dueAt = ev.dueAt;
        if (Array.isArray(ev.extensionHistory)) {
          const existing = Array.isArray(t.extensionHistory) ? t.extensionHistory : [];
          const seen = new Set(existing.map(x => `${x.at}|${x.from}|${x.to}`));
          for (const item of ev.extensionHistory) {
            const sig = `${item.at}|${item.from}|${item.to}`;
            if (!seen.has(sig)) { existing.push(clone(item)); seen.add(sig); }
          }
          existing.sort((a, b) => (a.at || 0) - (b.at || 0));
          t.extensionHistory = existing;
        }
        sy.fh[key] = ev.h;
        return 'applied';
      }
      return 'dup';
    }
    case 'cust+': {
      const f = findCust(S, ev.c.id);
      if (!f) { const c = clone(ev.c); c.tx = []; S.customers.push(c); sy.sh[c.id] = sy.sh[c.id] || ev.h; for (const k of Object.keys(ev.c)) sy.fh[c.id + '.' + k] = ev.h; return 'applied'; }
      return applyOne(S, sy, { k: 'cf', cid: ev.c.id, f: custBase(ev.c), h: ev.h, id: ev.id, s: ev.s }, now);
    }
    case 'cf': {
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      let any = false;
      for (const [k, v] of Object.entries(ev.f)) {
        const key = ev.cid + '.' + k, cur = sy.fh[key] || '';
        if (ev.h > cur) { if (jstr(f.c[k]) !== jstr(v)) { if (cur && sy.fh[key] && f.c[k] !== undefined) recordConflict(sy, { cid: ev.cid, field: k, lost: f.c[k], by: ev.h, at: now }); f.c[k] = clone(v); any = true; } sy.fh[key] = ev.h; }
        else if (jstr(f.c[k]) !== jstr(v)) recordConflict(sy, { cid: ev.cid, field: k, lost: v, by: cur, at: now });
      }
      return any ? 'applied' : 'dup';
    }
    case 'cst': {
      const cur = sy.sh[ev.cid] || ''; if (ev.h <= cur) return 'dup';
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      sy.sh[ev.cid] = ev.h;
      if (ev.st === 'archived' && f.where === 'active') {
        S.customers = S.customers.filter(c => c.id !== ev.cid);
        S.trash = S.trash || []; S.trash.unshift({ id: 'sync-' + ev.id, type: 'customer', data: f.c, deletedAt: ev.at || now, title: f.c.name, synced: true }); return 'applied';
      }
      if (ev.st === 'active' && f.where === 'trash') { S.trash = S.trash.filter(t => t !== f.item); S.customers.push(f.c); return 'applied'; }
      return 'dup';
    }
    case 'tk+': { if (S.pending.some(t => t.id === ev.t.id) || trashTkt(S).some(t => t.data.id === ev.t.id) || (sy.gone && sy.gone[ev.t.id])) return 'dup'; S.pending.unshift(clone(ev.t)); sy.fh['t:' + ev.t.id + '.tag'] = ev.h; return 'applied'; }
    case 'tkf': {
      const t = S.pending.find(x => x.id === ev.tid); if (!t) return 'dup';
      const key = 't:' + ev.tid + '.tag', cur = sy.fh[key] || '';
      if (ev.h > cur) { if (t.tag !== ev.f.tag && cur) recordConflict(sy, { tid: ev.tid, field: 'tag', lost: t.tag, by: ev.h, at: now }); t.tag = ev.f.tag; sy.fh[key] = ev.h; return 'applied'; }
      if (t.tag !== ev.f.tag) recordConflict(sy, { tid: ev.tid, field: 'tag', lost: ev.f.tag, by: cur, at: now }); return 'dup';
    }
    case 'tkx': {
      sy.gone = sy.gone || {}; sy.gone[ev.tid] = 1;
      const t = S.pending.find(x => x.id === ev.tid); if (!t) return 'dup';
      S.pending = S.pending.filter(x => x.id !== ev.tid);
      if (ev.why === 'archived') { S.trash = S.trash || []; S.trash.unshift({ id: 'sync-' + ev.id, type: 'ticket', data: t, deletedAt: now, synced: true }); }
      return 'applied';
    }
  }
  return 'dup';
}
// Apply a contiguous batch from a peer. Caller supplies the sender's pinned role. Returns {applied, dup, rejected, newRecv}.
// Validation first: if ANY event is rejected the whole batch is refused and nothing is applied.
function applyBatch(S, did, peerId, senderRole, events, now) {
  const sy = ensureSync(S, did);
  captureLocal(S, did, now);          // flush local changes into the log first, so the snapshot rebuild below can never swallow them
  const peer = sy.peers[peerId] || (sy.peers[peerId] = { recv: 0, acked: 0 });
  const rejected = [];                     // structural problems: refuse the whole batch (tampering / corruption)
  const quarantined = [];                  // permission problems: skip these, keep the rest, advance the cursor
  let expect = peer.recv + 1;
  const fresh = [];
  S.__batchTxSigs = [];
  S.__batchUnblockedCids = [];
  for (const preEv of events) {
    if (preEv && preEv.k === 'tx' && preEv.tx && preEv.tx.tape && preEv.tx.ts) {
      S.__batchTxSigs.push(preEv.tx.tape + '|' + preEv.tx.ts);
    }
    if (preEv && preEv.k === 'cf' && preEv.f && preEv.f.seg && preEv.f.seg !== 'black') {
      S.__batchUnblockedCids.push(preEv.cid);
    }
  }
  try {
  for (const ev of events) {
    if (!Number.isSafeInteger(ev && ev.s)) { rejected.push({ id: ev && ev.id, reason: 'shape' }); continue; }
    if (ev.s <= peer.recv) continue;                                   // already applied: duplicate delivery
    if (ev.s !== expect) { return { ok: false, reason: 'gap', expected: expect, applied: 0, rejected }; }
    if (ev.id !== peerId + ':' + ev.s) { rejected.push({ id: ev.id, reason: 'id-mismatch' }); expect += 1; continue; }
    const chk = checkEvent(ev, senderRole, S, did);
    if (!chk.ok) { if (String(chk.reason).startsWith('worker-')) quarantined.push({ ev, reason: chk.reason }); else rejected.push({ id: ev.id, reason: chk.reason }); }
    else fresh.push(ev);
    expect += 1;
  }
  if (rejected.length) return { ok: false, reason: 'rejected', rejected, applied: 0 };
  const lastSeq = expect - 1;
  for (const q of quarantined) { sy.quarantine = sy.quarantine || []; sy.quarantine.push({ id: q.ev.id, k: q.ev.k, reason: q.reason, at: now }); if (sy.quarantine.length > 100) sy.quarantine.shift(); }
  let applied = 0, dup = 0; const now2 = now;
  for (const ev of fresh) { hlcRecv(sy, ev.h, now2); const r = applyOne(S, sy, ev, now2); if (r === 'applied') applied++; else if (r === 'dup') dup++; }
  // retry orphans whose customer may now exist
  const orph = sy.orphans; sy.orphans = [];
  for (const ev of orph) { const r = applyOne(S, sy, ev, now2); if (r === 'applied') applied++; }
  // A refused worker edit must not leave the two phones permanently different: the receiver answers with a corrective event carrying its own
  // (authoritative) values. The correction is stamped after the refused edit, so last-writer-wins makes the worker adopt it.
  for (const q of quarantined) {
    const ev = q.ev, f = findCust(S, ev.cid);
    if (ev.k === 'cf' && f) { const vals = {}; for (const k of Object.keys(ev.f)) if (k !== 'tx' && k !== 'id') vals[k] = clone(f.c[k] === undefined ? null : f.c[k]); const e2 = push(sy, now, { k: 'cf', cid: ev.cid, f: vals }); for (const k of Object.keys(vals)) sy.fh[ev.cid + '.' + k] = e2.h; }
    else if (ev.k === 'cst' && f) { const want = f.where === 'active' ? 'active' : 'archived'; if (want !== ev.st) { const e2 = push(sy, now, { k: 'cst', cid: ev.cid, st: want, at: now }); sy.sh[ev.cid] = e2.h; } }
  }
  if (lastSeq > peer.recv) peer.recv = lastSeq;
  resnapshot(S, did);
  return { ok: true, applied, dup, rejected: [], quarantined: quarantined.map(q => ({ id: q.ev.id, reason: q.reason })), newRecv: peer.recv };
  } finally { delete S.__batchTxSigs; delete S.__batchUnblockedCids; }
}
const markAcked = (S, did, peerId, recv) => { const p = ensureSync(S, did).peers[peerId]; if (p && recv > p.acked) p.acked = Math.min(recv, ensureSync(S, did).seq); };
const pendingCount = (S, did, peerId) => { const sy = ensureSync(S, did); const p = sy.peers[peerId] || { acked: 0 }; return sy.log.filter(e => e.s > p.acked).length; };

// A phone whose data is still the untouched demo set must adopt the owner's data instead of merging 10 demo customers into the real ledger.
const demoFingerprint = S => { const str = JSON.stringify([S.customers, S.pending]); let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return String(h) + ':' + str.length; };
const isPristineDemo = S => !!S.demoFp && S.demoFp === demoFingerprint(S) && !(S.sync && S.sync.snap);
function discardPristineDemo(S, did) { if (!isPristineDemo(S)) return false; S.customers = []; S.pending = []; S.trash = []; delete S.demoFp; ensureSync(S, did); resnapshot(S, did); return true; }

/* ---- session.js ---- */
// DEYN sync session: pairing + mutually authenticated, end-to-end encrypted channel + resumable event exchange.
// Transport-agnostic: a transport is {send(string), close()} plus the caller feeding received strings into session.feed(str).
// Crypto: X25519 (ephemeral, forward secrecy), Ed25519 device identity signatures, HKDF-SHA256, AES-256-GCM with strict frame counters.
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = u8 => { let s = ''; for (const x of u8) s += String.fromCharCode(x); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64u = u8 => b64(u8).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const unb64u = s => unb64(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4));
const cat = (...a) => { const n = a.reduce((x, y) => x + y.length, 0), o = new Uint8Array(n); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const sha256 = async u8 => new Uint8Array(await crypto.subtle.digest('SHA-256', u8));
const ctEq = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; };
const PAIR_TTL_MS = 5 * 60 * 1000, MAX_FRAME = 1 << 20;

class Identity {
  constructor(pub, priv) { this.pub = pub; this.priv = priv; }              // raw public (b64) + PKCS#8 private (b64)
  static async create() { const k = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']); return new Identity(b64(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey))), b64(new Uint8Array(await crypto.subtle.exportKey('pkcs8', k.privateKey)))); }
  static fromJson(j) { const o = JSON.parse(j); return new Identity(o.pub, o.priv); }
  toJson() { return JSON.stringify({ pub: this.pub, priv: this.priv }); }
  async sign(bytes) { const k = await crypto.subtle.importKey('pkcs8', unb64(this.priv), { name: 'Ed25519' }, false, ['sign']); return b64(new Uint8Array(await crypto.subtle.sign('Ed25519', k, bytes))); }
}
async function verifySig(pubB64, sigB64, bytes) { try { const k = await crypto.subtle.importKey('raw', unb64(pubB64), { name: 'Ed25519' }, false, ['verify']); return await crypto.subtle.verify('Ed25519', k, unb64(sigB64), bytes); } catch (e) { return false; } }
async function hmac(secret, text) { const k = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(text))); }
async function newEph() { const k = await crypto.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']); return { priv: k.privateKey, pub: b64(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey))) }; }
async function dh(priv, peerPubB64) { const pk = await crypto.subtle.importKey('raw', unb64(peerPubB64), { name: 'X25519' }, false, []); return new Uint8Array(await crypto.subtle.deriveBits({ name: 'X25519', public: pk }, priv, 256)); }
async function hkdf(ikm, salt, info) { const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']); return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode(info) }, k, 512)); }
const aesKey = raw => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
const nonceOf = c => { const n = new Uint8Array(12); new DataView(n.buffer).setBigUint64(4, BigInt(c)); return n; };

// ---------- pairing offer (shown as QR by the OWNER phone) ----------
function makeOffer({ did, idpub, ip, port, now }) {
  const secret = crypto.getRandomValues(new Uint8Array(16));
  const offer = { v: 1, did, idpub, ip, port, s: b64u(secret) };
  return { offer, text: 'DEYNPAIR1:' + b64u(enc.encode(JSON.stringify(offer))), state: { secret, expiresAt: now + PAIR_TTL_MS, attemptsLeft: 3, used: false } };
}
function parseOffer(text) {
  const m = /^DEYNPAIR1:([A-Za-z0-9_-]+)$/.exec(String(text || '').trim()); if (!m) return null;
  try { const o = JSON.parse(dec.decode(unb64u(m[1]))); if (o.v !== 1 || !/^[0-9a-f]{32}$/.test(o.did) || typeof o.idpub !== 'string' || typeof o.ip !== 'string' || !Number.isInteger(o.port) || typeof o.s !== 'string') return null; return Object.assign(o, { secret: unb64u(o.s) }); } catch (e) { return null; }
}
const transcript = (h1, h2) => enc.encode(['DEYN-HS-V1', h1.mode, h1.did, h1.epub, h1.n1, h2.did, h2.epub, h2.n2].join('|'));

// A secure session over any transport. role: 'initiator' | 'responder'
class Session {
  constructor(transport, ctx, role) { this.t = transport; this.ctx = ctx; this.role = role; this.q = []; this.waiters = []; this.closed = false; this.sendC = 0; this.recvC = 0; this.keys = null; this.stage = 'hs'; this.fail = null; }
  _wake() { while (this.waiters.length && this.q.length) this.waiters.shift().resolve(this.q.shift()); }
  _die(reason) { if (this.closed) return; this.closed = true; this.fail = reason; for (const w of this.waiters) w.reject(new Error(reason)); this.waiters = []; try { this.t.close(); } catch (e) {} }
  onClose() { this._die(this.fail || 'closed'); }
  next() { if (this.q.length) return Promise.resolve(this.q.shift()); if (this.closed) return Promise.reject(new Error(this.fail || 'closed')); return new Promise((resolve, reject) => this.waiters.push({ resolve, reject })); }
  async feed(str) {                                                    // call for every frame received from the transport
    if (this.closed) return;
    try {
      if (str.length > MAX_FRAME) throw new Error('frame too large');
      const m = JSON.parse(str);
      if (this.stage === 'hs') { this.q.push(m); this._wake(); return; }
      if (m.t !== 'e' || m.c !== this.recvC || typeof m.d !== 'string') throw new Error('bad frame counter');          // replay / reorder / drop => abort
      const dir = this.role === 'initiator' ? 'r2i' : 'i2r';
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonceOf(m.c), additionalData: enc.encode('DEYN-FRAME-V1|' + dir) }, this.keys.rx, unb64(m.d));   // GCM tag => tamper => throws
      this.recvC += 1; this.q.push(JSON.parse(dec.decode(pt))); this._wake();
    } catch (e) { this._die('decrypt/frame error'); }
  }
  async send(obj) {
    if (this.closed) throw new Error('closed');
    if (this.stage === 'hs') return this.t.send(JSON.stringify(obj));
    const dir = this.role === 'initiator' ? 'i2r' : 'r2i', c = this.sendC++;
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceOf(c), additionalData: enc.encode('DEYN-FRAME-V1|' + dir) }, this.keys.tx, enc.encode(JSON.stringify(obj))));
    this.t.send(JSON.stringify({ t: 'e', c, d: b64(ct) }));
  }
  async _keys(shared, h1, h2, secret) {
    const th = await sha256(transcript(h1, h2));
    const okm = await hkdf(cat(shared, secret || new Uint8Array(0)), th, 'DEYN-SYNC-KEYS-V1');
    const a = await aesKey(okm.slice(0, 32)), b = await aesKey(okm.slice(32, 64));
    this.keys = this.role === 'initiator' ? { tx: a, rx: b } : { tx: b, rx: a };
  }
  // ----- handshake: initiator (the phone that scanned the QR, or reconnecting) -----
  async handshakeInitiator(o) { try { return await this._hsI(o); } catch (e) { this._die(e.message); throw e; } }
  async handshakeResponder() { try { return await this._hsR(); } catch (e) { this._die(e.message); throw e; } }
  async _hsI({ offer }) {
    const ctx = this.ctx, mode = offer ? 'pair' : 'known', eph = await newEph();
    const h1 = { t: 'h1', v: 1, mode, did: ctx.did, epub: eph.pub, n1: b64u(crypto.getRandomValues(new Uint8Array(16))), idpub: ctx.identity.pub, lic: ctx.licence };
    if (offer) h1.proof = b64(await hmac(offer.secret, ['DEYN-PAIR-V1', h1.did, h1.epub, h1.n1, h1.idpub, h1.lic].join('|')));
    await this.send(h1);
    const h2 = await this.next(); if (h2.t !== 'h2' || h2.v !== 1) throw new Error('bad h2');
    let peerRec;
    if (offer) {
      if (h2.did !== offer.did || h2.idpub !== offer.idpub) throw new Error('responder identity differs from QR');
      const lic = await ctx.verifyLicence(h2.lic, h2.did); if (!lic || lic.role !== 'M') throw new Error('responder is not a licensed owner device');
      peerRec = { idpub: h2.idpub, role: 'M' };
    } else {
      peerRec = ctx.getPeer(h2.did); if (!peerRec || peerRec.idpub !== h2.idpub) throw new Error('unknown or changed peer identity');
    }
    const tr = transcript(h1, h2);
    if (!await verifySig(peerRec.idpub, h2.sig, cat(tr, enc.encode('|R')))) throw new Error('responder signature invalid');
    await this.send({ t: 'h3', sig: await ctx.identity.sign(cat(tr, enc.encode('|I'))) });
    this.peerDid = h2.did; this.peerRec = peerRec; this.pairing = !!offer;
    await this._keys(await dh(eph.priv, h2.epub), h1, h2, offer ? offer.secret : null);
    this.stage = 'enc';
    if (offer) ctx.savePeer(h2.did, Object.assign({ pairedAt: ctx.now() }, peerRec));
    return this.peerDid;
  }
  async _hsR() {
    const ctx = this.ctx, h1 = await this.next(); if (h1.t !== 'h1' || h1.v !== 1 || !/^[0-9a-f]{32}$/.test(h1.did) || typeof h1.epub !== 'string' || typeof h1.n1 !== 'string') throw new Error('bad h1');
    let peerRec, secret = null;
    if (h1.mode === 'pair') {
      const p = ctx.pairing; if (!p || p.used || ctx.now() > p.expiresAt || p.attemptsLeft <= 0) throw new Error('no valid pairing offer');
      const want = await hmac(p.secret, ['DEYN-PAIR-V1', h1.did, h1.epub, h1.n1, h1.idpub, h1.lic].join('|'));
      if (!h1.proof || !ctEq(want, unb64(h1.proof))) { p.attemptsLeft -= 1; throw new Error('pairing proof invalid'); }
      p.used = true;                                                    // single use: consumed by the first valid attempt
      const lic = await ctx.verifyLicence(h1.lic, h1.did); if (!lic) throw new Error('initiator licence invalid');
      peerRec = { idpub: h1.idpub, role: 'W' };                          // the OWNER decides the role of a newly paired phone; nothing the peer claims changes it
      secret = p.secret;
    } else if (h1.mode === 'known') {
      peerRec = ctx.getPeer(h1.did); if (!peerRec || peerRec.idpub !== h1.idpub) throw new Error('unknown peer');
    } else throw new Error('bad mode');
    const eph = await newEph();
    const h2 = { t: 'h2', v: 1, did: ctx.did, epub: eph.pub, n2: b64u(crypto.getRandomValues(new Uint8Array(16))), idpub: ctx.identity.pub, lic: ctx.licence };
    const tr = transcript(h1, h2); h2.sig = await ctx.identity.sign(cat(tr, enc.encode('|R')));
    await this.send(h2);
    const h3 = await this.next(); if (h3.t !== 'h3' || !await verifySig(peerRec.idpub, h3.sig, cat(tr, enc.encode('|I')))) throw new Error('initiator signature invalid');
    this.peerDid = h1.did; this.peerRec = peerRec; this.pairing = h1.mode === 'pair';
    await this._keys(await dh(eph.priv, h1.epub), h1, h2, secret);
    this.stage = 'enc';
    if (h1.mode === 'pair') ctx.savePeer(h1.did, Object.assign({ pairedAt: ctx.now() }, peerRec));
    return this.peerDid;
  }
  // ----- resumable exchange. initiator sends first, then receives; responder the opposite (deadlock-free) -----
  async _sendEvents(sy) {
    const peerRecv = (await this.next()); if (peerRecv.m !== 'state') throw new Error('expected state');
    const evs = sy.eventsAfter(this.peerDid, peerRecv.recv);
    if (!evs.length) { await this.send({ m: 'events', events: [], more: false }); const a = await this.next(); if (a.m !== 'ack') throw new Error('expected ack'); return 0; }
    let sent = 0;
    for (let i = 0; i < evs.length; i += MAX_EVENTS_PER_BATCH) {
      const chunk = evs.slice(i, i + MAX_EVENTS_PER_BATCH), more = i + MAX_EVENTS_PER_BATCH < evs.length;
      await this.send({ m: 'events', events: chunk, more });
      const a = await this.next(); if (a.m === 'err') throw new Error('peer refused: ' + a.reason); if (a.m !== 'ack') throw new Error('expected ack');
      sy.acked(this.peerDid, a.recv); sent += chunk.length;
    }
    return sent;
  }
  async _recvEvents(sy) {
    await this.send({ m: 'state', recv: sy.recvFrom(this.peerDid) });
    let got = 0;
    for (;;) {
      const m = await this.next(); if (m.m !== 'events' || !Array.isArray(m.events)) throw new Error('expected events');
      const r = await sy.apply(this.peerDid, this.peerRec.role, m.events);        // durable before we acknowledge
      if (!r.ok) { await this.send({ m: 'err', reason: r.reason || 'refused' }); throw new Error('batch refused: ' + (r.reason || '')); }
      got += r.applied; await this.send({ m: 'ack', recv: r.newRecv });
      if (!m.more) return got;
    }
  }
  async exchange() { try { return await this._exchange(); } catch (e) { this._die(e.message); throw e; } }
  async _exchange() {
    const sy = this.ctx.sync; await sy.prepare();
    const res = { sent: 0, received: 0 };
    if (this.role === 'initiator') { res.sent = await this._sendEvents2(sy); res.received = await this._recvEvents2(sy); }
    else { res.received = await this._recvEvents2(sy); res.sent = await this._sendEvents2(sy); }
    await this.send({ m: 'done' }); const d = await this.next(); if (d.m !== 'done') throw new Error('expected done');
    return res;
  }
  // wrappers keeping the (state -> events -> ack) pairing symmetric: the SENDER first announces nothing; the RECEIVER announces its cursor.
  async _recvEvents2(sy) { return this._recvEvents(sy); }
  async _sendEvents2(sy) { return this._sendEvents(sy); }
}

/* ---- qr.js ---- */
// Minimal QR Code generator (byte mode, error correction M, versions 1-14, auto mask). Output: array of rows of 0/1.
const EC = { // [ecCodewordsPerBlock, [[count, dataCodewords], ...]] for level M
  1: [10, [[1, 16]]], 2: [16, [[1, 28]]], 3: [26, [[1, 44]]], 4: [18, [[2, 32]]], 5: [24, [[2, 43]]], 6: [16, [[4, 27]]], 7: [18, [[4, 31]]], 8: [22, [[2, 38], [2, 39]]],
  9: [22, [[3, 36], [2, 37]]], 10: [26, [[4, 43], [1, 44]]], 11: [30, [[1, 50], [4, 51]]], 12: [22, [[6, 36], [2, 37]]], 13: [22, [[8, 37], [1, 38]]], 14: [24, [[4, 40], [5, 41]]] };
const ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50], 11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62], 14: [6, 26, 46, 66] };
const EXP = new Array(512), LOG = new Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
function rsGen(n) { let g = [1]; for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
function rsEnc(data, n) { const g = rsGen(n), res = new Array(n).fill(0); for (const d of data) { const f = d ^ res[0]; res.shift(); res.push(0); if (f) for (let i = 0; i < n; i++) res[i] ^= mul(g[i + 1], f); } return res; }
const capacity = v => EC[v][1].reduce((a, [c, d]) => a + c * d, 0);
function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  let v = 1; for (; v <= 14; v++) { const bits = 4 + (v < 10 ? 8 : 16) + bytes.length * 8; if (Math.ceil(bits / 8) <= capacity(v)) break; }
  if (v > 14) throw new Error('QR payload too long');
  const bits = []; const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
  const cap = capacity(v) * 8; for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0); while (bits.length % 8) bits.push(0);
  for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) put(p, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  const [ecn, groups] = EC[v], blocks = []; let pos = 0;
  for (const [cnt, dc] of groups) for (let i = 0; i < cnt; i++) { const d = data.slice(pos, pos + dc); pos += dc; blocks.push({ d, e: rsEnc(d, ecn) }); }
  const out = []; const maxd = Math.max(...blocks.map(b => b.d.length));
  for (let i = 0; i < maxd; i++) for (const b of blocks) if (i < b.d.length) out.push(b.d[i]);
  for (let i = 0; i < ecn; i++) for (const b of blocks) out.push(b.e[i]);
  const size = 17 + 4 * v, M = Array.from({ length: size }, () => new Array(size).fill(null));
  const setF = (r, c, val) => { if (r >= 0 && c >= 0 && r < size && c < size) M[r][c] = val; };
  const finder = (r, c) => { for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) { const on = (i >= 0 && i <= 6 && (j === 0 || j === 6)) || (j >= 0 && j <= 6 && (i === 0 || i === 6)) || (i >= 2 && i <= 4 && j >= 2 && j <= 4); setF(r + i, c + j, on ? 1 : 0); } };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) { setF(6, i, i % 2 === 0 ? 1 : 0); setF(i, 6, i % 2 === 0 ? 1 : 0); }
  const al = ALIGN[v]; for (const r of al) for (const c of al) { if ((r === 6 && c === 6) || (r === 6 && c === al[al.length - 1]) || (c === 6 && r === al[al.length - 1])) continue; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) setF(r + i, c + j, Math.max(Math.abs(i), Math.abs(j)) !== 1 ? 1 : 0); }
  setF(size - 8, 8, 1);
  const reserved = M.map(row => row.map(x => x !== null));
  for (let i = 0; i < 9; i++) { reserved[8][i] = true; reserved[i][8] = true; } for (let i = 0; i < 8; i++) { reserved[8][size - 1 - i] = true; reserved[size - 1 - i][8] = true; }
  if (v >= 7) { for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { reserved[i][size - 11 + j] = true; reserved[size - 11 + j][i] = true; } }
  const fill = (mask) => {
    const B = M.map(r => r.slice()); let bi = 0, up = true;
    const bitsOut = []; out.forEach(b => { for (let i = 7; i >= 0; i--) bitsOut.push((b >> i) & 1); });
    for (let c = size - 1; c > 0; c -= 2) { if (c === 6) c = 5; for (let k = 0; k < size; k++) { const r = up ? size - 1 - k : k; for (let cc = c; cc >= c - 1; cc--) { if (reserved[r][cc]) continue; let bit = bi < bitsOut.length ? bitsOut[bi++] : 0; const m = [(r + cc) % 2 === 0, r % 2 === 0, cc % 3 === 0, (r + cc) % 3 === 0, (Math.floor(r / 2) + Math.floor(cc / 3)) % 2 === 0, (r * cc) % 2 + (r * cc) % 3 === 0, ((r * cc) % 2 + (r * cc) % 3) % 2 === 0, ((r + cc) % 2 + (r * cc) % 3) % 2 === 0][mask]; B[r][cc] = bit ^ (m ? 1 : 0); } } up = !up; }
    // format info (EC level M = 00)
    let fmt = (0 << 3) | mask, rem = fmt; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537); const bitsF = ((fmt << 10) | rem) ^ 0x5412;
    for (let i = 0; i < 15; i++) { const bit = (bitsF >> i) & 1; if (i < 6) B[i][8] = bit; else if (i < 8) B[i + 1][8] = bit; else B[size - 15 + i][8] = bit; if (i < 8) B[8][size - 1 - i] = bit; else if (i < 9) B[8][15 - i] = bit; else B[8][15 - i - 1] = bit; }
    B[size - 8][8] = 1;
    if (v >= 7) { let r2 = v; for (let i = 0; i < 12; i++) r2 = (r2 << 1) ^ ((r2 >> 11) * 0x1f25); const vi = (v << 12) | r2; for (let i = 0; i < 18; i++) { const bit = (vi >> i) & 1, a = Math.floor(i / 3), b = i % 3 + size - 11; B[a][b] = bit; B[b][a] = bit; } }
    return B;
  };
  const penalty = B => { let p = 0; for (let r = 0; r < size; r++) { let run = 1; for (let c = 1; c < size; c++) { if (B[r][c] === B[r][c - 1]) { run++; if (c === size - 1 && run >= 5) p += run - 2; } else { if (run >= 5) p += run - 2; run = 1; } } } for (let c = 0; c < size; c++) { let run = 1; for (let r = 1; r < size; r++) { if (B[r][c] === B[r - 1][c]) { run++; if (r === size - 1 && run >= 5) p += run - 2; } else { if (run >= 5) p += run - 2; run = 1; } } } for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) if (B[r][c] === B[r][c + 1] && B[r][c] === B[r + 1][c] && B[r][c] === B[r + 1][c + 1]) p += 3; let dark = 0; B.forEach(r => r.forEach(x => dark += x)); p += Math.floor(Math.abs(dark * 100 / (size * size) - 50) / 5) * 10; return p; };
  let best = null, bp = Infinity; for (let m = 0; m < 8; m++) { const B = fill(m); const p = penalty(B); if (p < bp) { bp = p; best = B; } }
  return best;
}
function qrSvg(text, px = 4) {
  const B = qrMatrix(text), n = B.length, q = 4, S = (n + 2 * q) * px; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (B[r][c]) d += `M${(c + q) * px} ${(r + q) * px}h${px}v${px}h${-px}z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="100%" shape-rendering="crispEdges"><rect width="${S}" height="${S}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

return { Identity, MAX_EVENTS_PER_BATCH, PAIR_TTL_MS, Session, applyBatch, b64, buildSnap, captureLocal, checkEvent, demoFingerprint, discardPristineDemo, ensureSync, eventsAfter, hlcRecv, hlcStr, hlcTick, isPristineDemo, makeOffer, markAcked, parseOffer, pendingCount, qrMatrix, qrSvg, resnapshot, unb64 };
})();

/* ============ Local sync glue: owner phone listens, worker phone connects (Wi-Fi LAN, no cloud) ============ */
const SYNC = { identity: null, pairing: null, listening: false, ip: null, port: null, running: false, timer: null, backoff: 45000, conns: {}, hooked: false, msg: '' };
const syNative = () => { try { return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynSync) || null; } catch (e) { return null; } };
const syState = () => DeynSyncLib.ensureSync(S, DEYN_DEV_ID);
async function syIdentity() {
  if (SYNC.identity) return SYNC.identity;
  let raw = null; try { raw = await DeynStore.get('syncid'); } catch (e) { raw = null; }
  if (raw) SYNC.identity = DeynSyncLib.Identity.fromJson(raw);
  else { SYNC.identity = await DeynSyncLib.Identity.create(); await DeynStore.set('syncid', SYNC.identity.toJson()); }
  return SYNC.identity;
}
function syCtx() {
  return {
    did: DEYN_DEV_ID, identity: SYNC.identity, licence: DEYN_LIC && DEYN_LIC.code, now: () => Date.now(),
    verifyLicence: async (code, did) => { const p = await deynVerifyCode(code, did); return p ? { role: p.role } : null; },
    getPeer: id => { const p = syState().peers[id]; return p && p.idpub ? p : null; },
    savePeer: (id, rec) => { const sy = syState(); sy.peers[id] = Object.assign(sy.peers[id] || { recv: 0, acked: 0 }, rec); persist(); },
    get pairing() { return SYNC.pairing; },
    sync: {
      prepare: async () => { DeynSyncLib.captureLocal(S, DEYN_DEV_ID, Date.now()); persist(); },
      recvFrom: p => ((syState().peers[p] || {}).recv || 0),
      eventsAfter: (p, r) => DeynSyncLib.eventsAfter(S, DEYN_DEV_ID, r),
      acked: (p, r) => { DeynSyncLib.markAcked(S, DEYN_DEV_ID, p, r); persist(); },
      apply: async (p, role, evs) => {
        if (deynReadOnly()) return { ok: false, reason: 'read-only' };
        const r = DeynSyncLib.applyBatch(S, DEYN_DEV_ID, p, role, evs, Date.now());
        if (r.ok) { if (!persist()) return { ok: false, reason: 'storage' }; await deynFlush(); renderAll(); }   // durable BEFORE the acknowledgement is sent
        return r;
      }
    }
  };
}
const syTransport = connId => ({ send: s => syNative().send({ connId, data: s }), close: () => { try { syNative().close({ connId }); } catch (e) {} } });
function syNote(did, ok, msg) {
  const p = syState().peers[did]; if (!p) return;
  p.lastTry = Date.now(); if (ok) { p.lastSuccess = Date.now(); delete p.lastError; } else p.lastError = String(msg || 'error').slice(0, 120);
  persist();
}
async function syHook() {
  const pl = syNative(); if (!pl || SYNC.hooked) return; SYNC.hooked = true;
  pl.addListener('frame', e => { const s = SYNC.conns[e.connId]; if (s) s.feed(e.data); });
  pl.addListener('closed', e => { const s = SYNC.conns[e.connId]; if (s) s.onClose(); delete SYNC.conns[e.connId]; });
  pl.addListener('accepted', e => {                                    // owner side: a phone connected to us
    const sess = new DeynSyncLib.Session(syTransport(e.connId), syCtx(), 'responder'); SYNC.conns[e.connId] = sess;
    (async () => {
      try { await sess.handshakeResponder(); await sess.exchange(); syNote(sess.peerDid, true); SYNC.msg = 'تمت المزامنة بنجاح ✅'; }
      catch (err) { if (sess.peerDid) syNote(sess.peerDid, false, err.message); SYNC.msg = 'تعذّرت المزامنة: ' + err.message; }
      finally { try { pl.close({ connId: e.connId }); } catch (x) {} delete SYNC.conns[e.connId]; syRefreshUi(); }
    })();
  });
}
async function syStartServer() {
  const pl = syNative(); if (!pl) throw new Error('المزامنة غير متاحة على هذا الجهاز');
  await syIdentity(); await syHook();
  if (SYNC.listening) return;
  const r = await pl.listen({ port: 47821 }); SYNC.port = r.port; SYNC.ip = r.ip; SYNC.listening = true;
}
async function syConnect(peerDid, offer) {
  const pl = syNative(); if (!pl) throw new Error('المزامنة غير متاحة على هذا الجهاز');
  if (SYNC.running) return false; SYNC.running = true;
  let connId = null, sess = null;
  try {
    await syIdentity(); await syHook();
    const target = offer ? { ip: offer.ip, port: offer.port } : syState().peers[peerDid];
    if (!target || !target.ip) throw new Error('عنوان المالك غير معروف: أعد الاقتران بمسح رمز QR');
    const c = await pl.connect({ ip: target.ip, port: target.port }); connId = c.connId;
    sess = new DeynSyncLib.Session(syTransport(connId), syCtx(), 'initiator'); SYNC.conns[connId] = sess;
    await sess.handshakeInitiator({ offer: offer || null });
    if (offer) { const p = syState().peers[sess.peerDid]; p.ip = offer.ip; p.port = offer.port; }
    const res = await sess.exchange(); syNote(sess.peerDid, true);
    SYNC.msg = 'تمت المزامنة ✅ (أُرسل ' + res.sent + ' • استُلم ' + res.received + ')'; SYNC.backoff = 45000; return true;
  } catch (err) {
    const did = (sess && sess.peerDid) || peerDid; if (did && syState().peers[did]) syNote(did, false, err.message);
    SYNC.msg = 'تعذّرت المزامنة: ' + err.message + ' — ستُعاد المحاولة تلقائيًا'; SYNC.backoff = Math.min(SYNC.backoff * 2, 300000); return false;
  } finally { if (connId) { try { pl.close({ connId }); } catch (x) {} delete SYNC.conns[connId]; } SYNC.running = false; syRefreshUi(); }
}
function syPeers() { const sy = syState(); return Object.keys(sy.peers).filter(id => sy.peers[id].idpub).map(id => Object.assign({ did: id }, sy.peers[id])); }
function syLoop() {
  clearTimeout(SYNC.timer);
  SYNC.timer = setTimeout(async () => {
    try { if (S && !deynReadOnly() && isWorkerDevice() && !document.hidden) { const m = syPeers().find(p => p.role === 'M'); if (m) await syConnect(m.did, null); } } catch (e) { console.warn('sync loop', e); }
    syLoop();
  }, SYNC.backoff);
}
let SYDEB = null;
function sySchedule() { if (!S || !syPeers().length || !isWorkerDevice()) return; clearTimeout(SYDEB); SYDEB = setTimeout(() => { const m = syPeers().find(p => p.role === 'M'); if (m) syConnect(m.did, null); }, 4000); }
async function syInit() {                                              // called once after the app has started
  try { DeynSyncLib.ensureSync(S, DEYN_DEV_ID); if (!syNative()) return; await syIdentity(); await syHook(); if (!isWorkerDevice() && syPeers().length) await syStartServer(); syLoop(); } catch (e) { console.warn('sync init failed', e); }
}
// ---- UI ----
const syAgo = t => { if (!t) return 'لم تنجح بعد'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'قبل لحظات' : m < 60 ? 'قبل ' + m + ' دقيقة' : m < 1440 ? 'قبل ' + Math.round(m / 60) + ' ساعة' : 'قبل ' + Math.round(m / 1440) + ' يوم'; };
function syRefreshUi() { if (document.getElementById('syncBody')) { const b = document.getElementById('syncBody'); b.innerHTML = syBodyHtml(); } }
function syBodyHtml() {
  const owner = !isWorkerDevice(), peers = syPeers(), sy = syState();
  const rows = peers.map(p => { const pend = DeynSyncLib.pendingCount(S, DEYN_DEV_ID, p.did); return `<div class="row-set"><div><b>${p.role === 'W' ? 'هاتف العامل' : 'هاتف المالك'} ••${esc(p.did.slice(-4))}</b><small>آخر نجاح: ${syAgo(p.lastSuccess)} • بانتظار الإرسال: ${pend}${p.lastError ? '<br>آخر خطأ: ' + esc(p.lastError) : ''}</small></div>${owner ? `<button type="button" class="btn sm" data-act="syncUnpair" data-id="${esc(p.did)}" style="height:34px;font-size:12px;padding:0 12px">إلغاء</button>` : ''}</div>`; }).join('');
  const quarantined = (sy.quarantine || []).length;
  let h = rows || '<div class="sub">لا يوجد هاتف مقترن بعد.</div>';
  if (quarantined) h += `<div class="sub" style="color:#b45309">⚠️ تم تجاهل ${quarantined} تعديلًا من هاتف العامل لتجاوزه الصلاحيات.</div>`;
  if (SYNC.msg) h += `<div class="sub" id="syncMsg">${esc(SYNC.msg)}</div>`;
  if (owner) {
    h += `<button type="button" class="btn pri block" data-act="syncPairShow" style="margin-top:12px">إظهار رمز QR لاقتران هاتف العامل</button><div id="syncQr"></div>`;
  } else {
    h += `<label class="lbl" for="syncOffer" style="margin-top:12px">رمز الاقتران (امسح QR من هاتف المالك أو الصقه هنا)</label>
      <textarea class="inp" id="syncOffer" rows="3" style="direction:ltr;text-align:left;height:auto" placeholder="DEYNPAIR1:..." spellcheck="false" autocomplete="off"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button type="button" class="btn pri" data-act="syncPairStart" style="flex:1">اقتران</button>${(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner) ? '<button type="button" class="btn" data-act="syncScan" style="flex:1">📷 مسح QR</button>' : ''}</div>`;
    if (peers.length) h += `<button type="button" class="btn block" data-act="syncNow" style="margin-top:10px">مزامنة الآن</button>`;
  }
  if (owner && peers.length) h += `<button type="button" class="btn block" data-act="syncNow" style="margin-top:8px" disabled title="العامل هو من يبدأ الاتصال">المزامنة تتم تلقائيًا عند اتصال هاتف العامل</button>`;
  return h;
}
function openSyncModal() {
  openModal(() => `${sheetHead('المزامنة بين الهاتفين')}<div class="sub">تتم عبر شبكة Wi-Fi المحلية فقط ومشفّرة من طرف إلى طرف، دون خادم سحابي. يعمل التطبيق دون إنترنت دائمًا، وتُرسل التغييرات عند توفر الاتصال.</div><div id="syncBody">${syBodyHtml()}</div>`);
  if (!syNative()) { const b = document.getElementById('syncBody'); if (b) b.insertAdjacentHTML('afterbegin', '<div class="sub" style="color:#b91c1c">المزامنة غير متاحة في هذا الإصدار/الجهاز.</div>'); }
}
let SYQR_TIMER = null;
async function syPairShow() {
  if (!requireOwner('إقران هاتف جديد')) return;
  try {
    await syStartServer();
    if (!SYNC.ip) throw new Error('لا يوجد اتصال Wi-Fi محلي. اتصل بنفس شبكة الواي فاي ثم أعد المحاولة');
    const idn = await syIdentity();
    const o = DeynSyncLib.makeOffer({ did: DEYN_DEV_ID, idpub: idn.pub, ip: SYNC.ip, port: SYNC.port, now: Date.now() }); SYNC.pairing = o.state;
    const box = lastById('syncQr'); if (!box) return;
    box.innerHTML = `<div style="background:#fff;padding:8px;border-radius:12px;margin-top:12px;max-width:320px;margin-inline:auto">${DeynSyncLib.qrSvg(o.text, 4)}</div>
      <div class="sub" id="syncQrTimer" style="text-align:center">الرمز صالح 5 دقائق ولاستخدام واحد</div>
      <textarea class="inp" id="syncOfferText" rows="3" readonly style="direction:ltr;text-align:left;height:auto;font-size:11px">${esc(o.text)}</textarea>`;
    clearInterval(SYQR_TIMER); SYQR_TIMER = setInterval(() => { const t = document.getElementById('syncQrTimer'); if (!t) { clearInterval(SYQR_TIMER); return; } const left = Math.max(0, Math.round((SYNC.pairing.expiresAt - Date.now()) / 1000)); t.textContent = SYNC.pairing.used ? 'تم استخدام الرمز ✅' : left ? 'ينتهي بعد ' + left + ' ثانية' : 'انتهت صلاحية الرمز'; if (!left || SYNC.pairing.used) { clearInterval(SYQR_TIMER); syRefreshUi(); } }, 1000);
  } catch (e) { toast(e.message, 'err'); }
}
async function syPairStart() {
  const inp = lastById('syncOffer'); if (!inp) return;
  const offer = DeynSyncLib.parseOffer(inp.value);
  if (!offer) return toast('رمز الاقتران غير صالح', 'err');
  if (!isWorkerDevice()) return toast('الاقتران يتم من هاتف العامل فقط', 'err');
  const go = async () => { toast('جارٍ الاقتران…'); const ok = await syConnect(offer.did, offer); toast(ok ? 'تم الاقتران والمزامنة بنجاح ✅' : 'تعذّر الاقتران — تأكد من الشبكة ومن أن الرمز لم ينتهِ', ok ? 'ok' : 'err'); if (ok) syLoop(); syRefreshUi(); };
  if (DeynSyncLib.isPristineDemo(S)) return confirmBox({ title: 'بيانات هذا الهاتف تجريبية', msg: 'سيتم استبدال البيانات التجريبية ببيانات هاتف المالك. هل تريد المتابعة؟', ok: 'متابعة', onOk: () => { DeynSyncLib.discardPristineDemo(S, DEYN_DEV_ID); persist(); renderAll(); go(); } });
  go();
}
async function syScan() { try { const r = await window.Capacitor.Plugins.BarcodeScanner.scan(); const v = r && r.barcodes && r.barcodes[0] && r.barcodes[0].rawValue; if (v) { const i = lastById('syncOffer'); if (i) i.value = v; syPairStart(); } } catch (e) { toast('تعذّر مسح الرمز: ' + e.message, 'err'); } }
function syNow() { const m = syPeers().find(p => p.role === 'M'); if (!m) return toast('لا يوجد هاتف مالك مقترن', 'err'); syConnect(m.did, null).then(ok => { toast(ok ? 'تمت المزامنة ✅' : 'تعذّرت المزامنة', ok ? 'ok' : 'err'); }); }
function syUnpair(id) { if (!requireOwner('إلغاء الاقتران')) return; confirmBox({ title: 'إلغاء الاقتران', msg: 'لن يتمكن هذا الهاتف من المزامنة بعد الآن. لن تُحذف أي بيانات من أي هاتف.', ok: 'إلغاء الاقتران', danger: true, onOk: () => { const sy = syState(); delete sy.peers[id]; persist(); syRefreshUi(); } }); }

/*SYNC-END*/

function seed() {
  const now = Date.now();
  const T = (type, amount, daysAgo, note, hr) => ({ id: uid(), type, amount, note: note || '', ts: now - daysAgo * DAY - (hr || 0) * 36e5 });
  const C = (name, phone, seg, ceiling, payDay, tx) => ({ id: uid(), name, phone, seg, ceiling, payDay, tx });
  return {
    seq: 4,
    settings: { dialect: true, sound: true },
    pending: [
      { id: uid(), no: 1, amount: 170, tape: '100 + 50 + 20 = 170', tag: 'جاري', ts: now - 95 * 60000 },
      { id: uid(), no: 2, amount: 2200, tape: '1000 × 2 + 200 = 2200', tag: 'عمي مراد', ts: now - 52 * 60000 },
      { id: uid(), no: 3, amount: 345, tape: '200 + 100 + 20 × 2 + 5 = 345', tag: 'حليب وخبز', ts: now - 11 * 60000 }
    ].reverse(),
    customers: [
      C('كمال بوعزيز', '0555 12 34 56', 'salaried', 40000, 28, [T('debt', 5200, 52, 'مواد غذائية', 3), T('pay', 3000, 25, '', 5), T('debt', 8650, 12, 'تموين الشهر', 2), T('debt', 3400, 4, 'زيت وسميد', 6)]),
      C('سفيان مرابط', '0661 22 45 18', 'youth', 3000, null, [T('debt', 1200, 9, 'سجائر ومشروبات', 4), T('debt', 950, 5, '', 1), T('debt', 500, 1, 'خبز وحليب', 2)]),
      C('ياسين دحماني', '0770 31 76 40', 'daily', 6000, null, [T('debt', 2500, 34, '', 2), T('pay', 1000, 27, '', 3), T('debt', 3150, 20, 'مواد غذائية', 5), T('debt', 4100, 6, '', 4), T('pay', 1500, 2, '', 1)]),
      C('نادية بن عيسى', '0550 67 90 12', 'salaried', 25000, 25, [T('debt', 7800, 18, 'تموين', 2), T('pay', 4000, 9, '', 4), T('debt', 2350, 3, 'خضر وفواكه', 3)]),
      C('رشيد قرين', '0698 45 21 07', 'daily', 5000, null, [T('debt', 1800, 45, '', 5), T('debt', 2250, 38, 'مواد غذائية', 2)]),
      C('عبد الحق شريف', '0556 98 13 77', 'salaried', 60000, 1, [T('debt', 18500, 22, 'تموين كبير', 3), T('debt', 9700, 10, '', 4), T('pay', 6000, 6, '', 2)]),
      C('مراد زروقي', '0777 05 66 31', 'black', 0, null, [T('debt', 9000, 70, '', 3), T('debt', 5500, 55, '', 4)]),
      C('أمين سعدون', '0662 14 08 53', 'youth', 3000, null, [T('debt', 1500, 14, '', 3), T('debt', 1350, 3, 'مشروبات', 5)]),
      C('خديجة لعروسي', '0553 77 21 90', 'salaried', 20000, 5, [T('debt', 3400, 8, 'مواد تنظيف وسكر', 2)]),
      C('حمزة بلقاسم', '0771 90 34 62', 'youth', 3000, null, [T('debt', 1600, 20, '', 2), T('pay', 1600, 7, 'سدّد كامل', 3)])
    ]
  };
}
const cust = id => S.customers.find(c => c.id === id);
const bal = c => round2(sum(c.tx.map(t => t.type === 'debt' ? t.amount : -t.amount)));
const debtCount = c => c.tx.filter(t => t.type === 'debt').length;
function isCritical(c) {
  const b = bal(c); if (b <= 0) return false;
  if (c.seg === 'black') return true;
  if (c.ceiling > 0 && b > c.ceiling) return true;
  const debts = c.tx.filter(t => t.type === 'debt').map(t => t.ts);
  const pays = c.tx.filter(t => t.type === 'pay').map(t => t.ts);
  const ref = pays.length ? Math.max(...pays) : Math.min(...debts);
  return Date.now() - ref > 30 * DAY;
}
function payInfo(c) {
  if (!c.payDay || bal(c) <= 0) return null;
  const now = new Date(), dom = now.getDate();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pd = Math.min(c.payDay, dim);
  
  if (dom === pd) {
    return { status: 'today', diff: 0, day: c.payDay, label: `اليوم موعد السداد المحدد (${c.payDay} في الشهر)` };
  } else if (dom < pd) {
    const diff = pd - dom;
    return {
      status: diff <= 5 ? 'soon' : 'future',
      diff,
      day: c.payDay,
      label: diff <= 5 ? `يقترب موعد السداد (بعد ${diff} ${diff <= 2 ? (diff === 1 ? 'يوم' : 'يومين') : 'أيام'})` : `موعد السداد يوم ${c.payDay} من الشهر`
    };
  } else {
    const overdue = dom - pd;
    return {
      status: 'overdue',
      diff: overdue,
      day: c.payDay,
      label: `متأخر عن موعد السداد بـ ${overdue} ${overdue <= 2 ? (overdue === 1 ? 'يوم' : 'يومين') : 'أيام'} (كان يوم ${c.payDay})`
    };
  }
}

/* ============ Sound (Web Audio) ============ */
let AUDIO;
function ctx() {
  try {
    AUDIO = AUDIO || new (window.AudioContext || window.webkitAudioContext)();
    if (AUDIO && AUDIO.state === 'suspended') {
      try { AUDIO.resume().catch(() => {}); } catch(e){}
    }
    return AUDIO;
  } catch (e) {
    return null;
  }
}
function tone(c, freq, t0, dur, vol, type, endFreq) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'triangle';
  o.frequency.setValueAtTime(freq, t0);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur * .6);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
function click() {
  if (!S || !S.settings.sound) return;
  const c = ctx(); if (!c) return; const t = c.currentTime;
  tone(c, 2600, t, 0.05, 0.05, 'triangle', 1100);
  tone(c, 4100, t, 0.07, 0.018, 'sine');
}
function chime() {
  if (!S || !S.settings.sound) return;
  const c = ctx(); if (!c) return; const t = c.currentTime;
  tone(c, 1568, t, 0.16, 0.05, 'sine'); tone(c, 2093, t + 0.09, 0.22, 0.05, 'sine'); tone(c, 3136, t + 0.09, 0.2, 0.012, 'sine');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const lockInp = document.getElementById('appLockPassInput');
    if (lockInp && document.activeElement === lockInp) {
      verifyUnlock();
    }
  }
});

document.addEventListener('pointerdown', e => { if (e.target.closest('button, .sw, .cust, .top-r')) click(); });

/* ============ Toast & Modals ============ */
let toastT;
function toast(m, k) {
  const el = $('#toast'); el.textContent = m; el.className = 'toast show ' + (k || 'ok');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2800);
}
const stack = [];
function openModal(render, opts) {
  opts = opts || {};
  const wrap = document.createElement('div'); wrap.className = 'ovl';
  const m = { wrap, render, refresh: opts.refresh };
  m.paint = () => { wrap.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + render() + '</div>'; if (opts.mount) opts.mount(wrap, m); };
  m.paint();
  wrap.addEventListener('mousedown', e => { if (e.target === wrap) closeModal(m); });
  $('#modalRoot').appendChild(wrap);
  stack.push(m); document.body.classList.add('lock');
  requestAnimationFrame(() => wrap.classList.add('show'));
  return m;
}
function closeModal(m) {
  m = m || stack[stack.length - 1]; if (!m) return;
  const i = stack.indexOf(m); if (i >= 0) stack.splice(i, 1);
  m.wrap.classList.remove('show'); setTimeout(() => m.wrap.remove(), 220);
  if (!stack.length) document.body.classList.remove('lock');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && stack.length) closeModal();
  if (e.key === 'Enter' && e.target.matches && e.target.matches('.sheet input')) {
    const b = e.target.closest('.sheet').querySelector('[data-primary]'); if (b) { e.preventDefault(); b.click(); }
  }
});
const sheetHead = (t, sub) => `<div class="sh-h"><h2>${t}</h2><button class="x-b" data-act="closeTop" aria-label="إغلاق">✕</button></div>${sub ? `<div class="sub">${sub}</div>` : ''}`;
function confirmBox(o) {
  CONFIRM = o.onOk;
  openModal(() => `${sheetHead(esc(o.title))}<div class="sub" style="margin-bottom:16px">${esc(o.msg)}</div>
    <div class="two"><button class="btn" data-act="closeTop">إلغاء</button><button class="btn ${o.danger ? 'dng' : 'pri'}" data-act="confirmOk" data-primary>${esc(o.ok || 'تأكيد')}</button></div>`);
}
let CONFIRM = null;

/* ============ Quick cash state ============ */
const COINS = [5, 10, 20, 30, 40, 50, 100, 200], NOTES = [500, 1000, 2000];
let mode = 'quick', Q = [];
const qTotal = () => sum(Q);
function qTape() { const m = new Map(); Q.forEach(v => m.set(v, (m.get(v) || 0) + 1)); return [...m].map(([v, n]) => n > 1 ? `${v} × ${n}` : `${v}`).join(' + '); }

/* ============ Calculator engine ============ */
const C0 = () => ({ cur: '0', label: null, acc: null, op: null, fresh: true, justOp: false, expr: [], done: false });
let C = C0(), MEM = 0, CLOG = [], CSNAP = [], lastKey = '';
const fix = n => Number(Number(n).toPrecision(12));
const csnap = () => { CSNAP.push(JSON.stringify(C)); if (CSNAP.length > 300) CSNAP.shift(); };
function applyOp(a, op, b) { switch (op) { case '+': return a + b; case '−': return a - b; case '×': return a * b; case '÷': return b === 0 ? NaN : a / b; } return b; }
function calcErr(msg) { C = C0(); CSNAP = []; toast(msg, 'err'); }
function calcValue() {
  let v;
  if (C.done) v = parseFloat(C.cur);
  else if (C.op !== null && C.acc !== null) v = C.justOp ? C.acc : fix(applyOp(C.acc, C.op, parseFloat(C.cur)));
  else v = parseFloat(C.cur);
  return isFinite(v) ? v : 0;
}
function calcTape() {
  const parts = [...C.expr];
  if (!C.done && !C.justOp && !(C.expr.length === 0 && C.cur === '0' && C.fresh)) parts.push(C.label || C.cur);
  if (!parts.length) return '';
  const txt = parts.join(' ');
  return C.expr.length && !C.justOp ? `${txt} = ${fmtN(calcValue())}` : txt;
}
function startFromResult() { if (C.done) { const v = C.cur; C = C0(); C.cur = v; C.fresh = true; } }



function calcKey(k) {
  const isDigit = /^(\d|00|\.)$/.test(k);
  const opSym = ['+', '−', '×', '÷'];
  if (isDigit) {
    if (C.done) C = C0();
    csnap();
    if (C.fresh) { C.cur = k === '.' ? '0.' : (k === '00' ? '0' : k); C.fresh = false; C.label = null; C.justOp = false; }
    else {
      if (k === '.' && C.cur.includes('.')) { CSNAP.pop(); return; }
      if (C.cur.replace(/[-.]/g, '').length >= 12) { CSNAP.pop(); return; }
      C.cur = (C.cur === '0' && k !== '.') ? (k === '00' ? '0' : k) : C.cur + k;
    }
  } else if (opSym.includes(k)) {
    csnap();
    const v = parseFloat(C.cur);
    if (C.done) { C.done = false; C.expr = [fmtN(v), k]; C.acc = v; C.op = k; C.fresh = true; C.justOp = true; C.label = null; }
    else if (C.justOp) { C.op = k; C.expr[C.expr.length - 1] = k; }
    else {
      const lab = C.label || fmtN(v);
      if (C.acc === null) C.acc = v;
      else { const r = fix(applyOp(C.acc, C.op, v)); if (!isFinite(r)) return calcErr('لا يمكن القسمة على صفر'); C.acc = r; }
      C.expr.push(lab, k); C.op = k; C.fresh = true; C.justOp = true; C.label = null;
    }
  } else switch (k) {
    case '=': {
      if (C.done || C.op === null) return;
      csnap();
      const v = C.justOp ? C.acc : parseFloat(C.cur);
      const lab = C.justOp ? fmtN(C.acc) : (C.label || fmtN(v));
      const r = fix(applyOp(C.acc, C.op, v));
      if (!isFinite(r)) return calcErr('لا يمكن القسمة على صفر');
      C.expr.push(lab);
      CLOG.unshift({ expr: C.expr.join(' '), res: r }); CLOG = CLOG.slice(0, 40);
      C.cur = String(r); C.done = true; C.fresh = true; C.acc = null; C.op = null; C.justOp = false; C.label = null;
      break;
    }
    case '%': {
      csnap(); startFromResult();
      const v = parseFloat(C.cur); let p;
      if ((C.op === '+' || C.op === '−') && C.acc !== null) p = fix(C.acc * v / 100); else p = fix(v / 100);
      C.label = fmtN(v) + '%'; C.cur = String(p); C.fresh = true; C.justOp = false;
      break;
    }
    case '√': {
      csnap(); startFromResult();
      const v = parseFloat(C.cur);
      if (v < 0) { CSNAP.pop(); return toast('لا جذر لعدد سالب', 'err'); }
      C.label = '√' + fmtN(v); C.cur = String(fix(Math.sqrt(v))); C.fresh = true; C.justOp = false;
      break;
    }
    case '±': {
      csnap(); startFromResult();
      if (C.cur !== '0') C.cur = C.cur.startsWith('-') ? C.cur.slice(1) : '-' + C.cur;
      C.label = null; C.justOp = false;
      break;
    }
    case 'CE': {
      csnap();
      if (C.done) C = C0(); else { C.cur = '0'; C.label = null; C.fresh = true; C.justOp = false; }
      break;
    }
    case 'AC': C = C0(); CSNAP = []; break;
    case 'M+': case 'M-': {
      if (C.op !== null && !C.justOp && !C.done) calcKey('=');
      csnap();
      const v = parseFloat(C.cur);
      MEM = fix(MEM + (k === 'M+' ? v : -v)); C.fresh = true;
      break;
    }
    case 'MRC': {
      if (lastKey === 'MRC') { MEM = 0; toast('تم مسح الذاكرة'); }
      else { csnap(); startFromResult(); C.cur = String(MEM); C.label = null; C.fresh = true; C.justOp = false; }
      break;
    }
    case 'MU': {
      if (C.op !== null && C.acc !== null && !C.justOp && !C.done) {
        csnap();
        const b = parseFloat(C.cur), r = fix(C.acc * (1 + b / 100));
        C.expr.push(fmtN(b) + '% MU');
        CLOG.unshift({ expr: C.expr.join(' '), res: r }); CLOG = CLOG.slice(0, 40);
        C.cur = String(r); C.done = true; C.fresh = true; C.acc = null; C.op = null; C.justOp = false; C.label = null;
      } else toast('MU: المبلغ ثم × ثم نسبة الربح ثم MU');
      break;
    }
    case 'CHECK': lastKey = k; return openCheck();
  }
  lastKey = k;
  renderDisplay();
}
function openCheck() {
  openModal(() => `${sheetHead('CHECK — آخر العمليات', 'اضغط على عملية لاستعمال نتيجتها')}
    ${CLOG.length ? CLOG.map((l, i) => `<button class="pick" data-act="useLog" data-i="${i}"><div class="m"><b class="num" style="font-size:13px;font-weight:500;color:#64748b">${esc(l.expr)}</b></div><div class="a"><b class="num" style="font-size:16px;color:#0f172a">${fmt(l.res)}</b></div></button>`).join('') : '<div class="empty-st">لا توجد عمليات بعد</div>'}`);
}

/* ============ Display rendering ============ */
function current() {
  if (mode === 'quick') {
    const total = qTotal();
    const tape = Q.length > 1 ? `${qTape()} = ${fmtN(total)}` : (Q.length ? String(Q[0]) : '');
    return { total, tape };
  }
  return { total: calcValue(), tape: calcTape() };
}
function renderDisplay() {
  const { total, tape } = current();
  const tp = $('#tape');
  tp.textContent = tape ? tape + ' دج' : 'ابدأ بإدخال المبلغ';
  tp.classList.toggle('empty', !tape);
  tp.scrollLeft = tp.scrollWidth;
  const a = $('#amt'); a.textContent = fmt(total);
  const len = a.textContent.length;
  a.className = 'num' + (len > 14 ? ' xs' : len > 9 ? ' sm' : '');
  $('#dial').textContent = total > 0 ? dialShown(total) : '';
  $('#mInd').hidden = !(mode === 'calc' && MEM !== 0);
  $('#dMode').textContent = mode === 'quick' ? 'حساب سريع' : 'آلة حاسبة';
  if (mode === 'quick') {
    const cnt = new Map(); Q.forEach(v => cnt.set(v, (cnt.get(v) || 0) + 1));
    $$('.tile').forEach(t => {
      const n = cnt.get(+t.dataset.v) || 0, b = $('.t-cnt', t);
      t.classList.toggle('on', n > 0); b.hidden = n < 2; b.textContent = '×' + n;
    });
  }
}
function buildTiles() {
  const mk = (v, cls) => `<button class="tile ${cls}" data-act="tap" data-v="${v}" aria-label="${v} دج"><span class="t-n num">${v}</span><span class="t-tag">${dialect(v)}</span><em class="t-cnt num" hidden></em></button>`;
  $('#coins').innerHTML = COINS.map(v => mk(v, '')).join('');
  $('#notes').innerHTML = NOTES.map(v => mk(v, 'note')).join('');
}

/* ============ Pending tab ============ */
function renderPending() {
  $('#pendCount').textContent = S.pending.length;
  const bd = $('#navBd'); bd.hidden = !S.pending.length; bd.textContent = S.pending.length;
  const box = $('#pendList');
  if (!S.pending.length) {
    box.innerHTML = `<div class="empty-st"><b>لا توجد ديون معلقة</b>سجّل مبلغًا من «دين سريع» ثم اضغط حفظ، وسيظهر هنا حتى ترحّله إلى زبون.<br><button class="btn pri" style="height:46px;font-size:14px" data-act="go" data-t="quick">تسجيل دين جديد</button></div>`;
    return;
  }
  box.innerHTML = S.pending.map(t => {
    const d = dialShown(t.amount);
    const when = (sameDay(t.ts, Date.now()) ? '' : dateStr(t.ts) + ' ') + timeStr(t.ts);
    const hasNote = !!(t.tag && String(t.tag).trim());
    return `<article class="voucher ${hasNote ? '' : 'lite'}">
      <div class="v-head"><span class="v-no">تذكرة #${t.no}</span><span>🕒 <span class="num">${when}</span></span></div>
      <div class="v-body">
        ${hasNote ? `<div class="v-tag" data-act="editTicketTag" data-id="${t.id}" style="cursor:pointer" title="انقر لتعديل الملاحظة">🏷️ ${esc(t.tag)} ✏️</div>` : ''}
        <div class="v-amt"><span class="num">${fmt(t.amount)}</span><span>دج</span></div>
        ${d ? `<span class="pill">${esc(d)}</span>` : ''}
        ${t.tape && t.tape.includes('=') ? `<span class="v-tape" dir="ltr">${esc(t.tape)}</span>` : ''}
      </div>
      <div class="v-sep"></div>
      <div class="v-act"><button class="btn pri" data-act="assign" data-id="${t.id}">ترحيل للزبون</button>${hasNote ? '' : `<button class="btn sec" data-act="editTicketTag" data-id="${t.id}">✏️ ملاحظة</button>`}${isWorkerDevice() ? "" : `<button class="del" data-act="delTicket" data-id="${t.id}" aria-label="حذف التذكرة">🗑️</button>`}</div>
    </article>`;
  }).join('');
}

/* ============ Ledger tab ============ */
let LF = { q: '', seg: 'all' };
function filtered() {
  const q = norm(LF.q).trim(), qd = LF.q.replace(/\D/g, '');
  return S.customers.filter(c => (LF.seg === 'all' || c.seg === LF.seg) &&
    (!q || norm(c.name).includes(q) || (qd.length > 1 && c.phone.replace(/\D/g, '').includes(qd))))
    .sort((a, b) => bal(b) - bal(a) || a.name.localeCompare(b.name, 'ar'));
}
function renderChips() {
  const all = [['all', 'الكل', S.customers.length], ...getSegOrder().map(s => [s, SEG[s].icon + ' ' + SEG[s].label, S.customers.filter(c => c.seg === s).length])];
  $('#segChips').innerHTML = all.map(([k, l, n]) => `<button class="chip ${LF.seg === k ? 'on' : ''}" data-act="seg" data-s="${k}">${l}<small>${n}</small></button>`).join('');
}
function barState(c) { const b = bal(c); if (c.ceiling <= 0) return b > 0 ? 'over' : ''; const r = b / c.ceiling; return r > 1 ? 'over' : r >= .7 ? 'warn' : ''; }
function custCard(c) {
  const b = bal(c), blk = c.seg === 'black', over = c.ceiling > 0 ? b > c.ceiling : false;
  const pct = c.ceiling > 0 ? Math.min(100, Math.max(b > 0 ? 3 : 0, b / c.ceiling * 100)) : (b > 0 ? 100 : 0);
  const pi = payInfo(c);
  let note = '';
  if (blk && b > 0) note = `<div class="note d">🚫 حساب محظور — لا دين جديد حتى تسديد ${fmt(b)} دج</div>`;
  else if (blk) note = `<div class="note i">🚫 حساب محظور — لا يقبل دينًا جديدًا</div>`;
  else if (over) note = `<div class="note d">⚠️ تجاوز السقف بـ ${fmt(b - c.ceiling)} دج</div>`;
  else if (c.ceiling > 0 && b / c.ceiling >= .85) note = `<div class="note w">⚠️ اقترب من السقف — بقي ${fmt(c.ceiling - b)} دج</div>`;
  let pay = '';
  if (pi) {
    if (pi.status === 'today') {
      pay = `<div class="note w" style="font-weight:700">📅 ${esc(pi.label)} — وقت التحصيل</div>`;
    } else if (pi.status === 'overdue') {
      pay = `<div class="note d" style="font-weight:700">⚠️ ${esc(pi.label)}</div>`;
    } else if (pi.status === 'soon') {
      pay = `<div class="note w">⏳ ${esc(pi.label)}</div>`;
    } else {
      pay = `<div class="note i">📅 ${esc(pi.label)}</div>`;
    }
  }
  return `<article class="card cust ${blk ? 'blk' : ''}" data-act="open" data-id="${c.id}">
    <div class="c-top">
      <div class="av">${esc(c.name.trim()[0] || '؟')}</div>
      <div class="c-main"><h3>${esc(c.name)}</h3><div class="c-meta"><span class="num">${esc(c.phone || '—')}</span><span class="badge ${blk ? 'black' : ''}">${SEG[c.seg].icon} ${SEG[c.seg].label}</span></div></div>
      <div class="c-bal">
        <b class="num">${fmt(b)}</b><small>دج</small>
      </div>
    </div>
    ${b > 0 && dialect(b) ? `<span class="pill">${esc(dialect(b))}</span>` : ''}
    <div class="ceil"><div class="ceil-h"><span>السقف</span><span class="num">${fmt(b)} / ${c.ceiling > 0 ? fmt(c.ceiling) : '0'}</span></div><div class="bar ${barState(c)}"><i style="width:${pct}%"></i></div></div>
    ${note}${pay}
    <div class="c-act"><button class="btn sm soft" data-act="pay" data-id="${c.id}" ${b <= 0 ? 'disabled' : ''}>💰 تسديد دين</button><button class="btn sm" data-act="debt" data-id="${c.id}" ${blk ? 'disabled' : ''}>➕ زيادة دين</button></div>
  </article>`;
}
function renderList() {
  const l = filtered();
  $('#custList').innerHTML = l.length ? l.map(custCard).join('') :
    `<div class="empty-st"><b>لا يوجد زبون مطابق</b>جرّب اسمًا آخر أو أضف زبونًا جديدًا.<br><button class="btn pri" style="height:46px;font-size:14px" data-act="newCust">+ زبون جديد</button></div>`;
}
const renderLedger = () => { renderChips(); renderList(); };

/* ============ Stats tab ============ */
let STATS_FILTER = 'all';

function renderStats() {
  const debtors = S.customers.filter(c => bal(c) > 0).sort((a, b) => bal(b) - bal(a));
  const total = sum(debtors.map(bal));
  const activeSegKeys = getSegOrder();
  const sal = debtors.filter(c => activeSegKeys.includes(c.seg) && isGuaranteed(c.seg));
  const salSum = sum(sal.map(bal));
  const hasGuarSegs = activeSegKeys.some(isGuaranteed);
  const crit = debtors.filter(isCritical);
  const critSum = sum(crit.map(bal));
  const pendSum = sum(S.pending.map(t => t.amount));
  const totalPaid = sum(S.customers.flatMap(c => c.tx.filter(t => t.type === 'pay').map(t => t.amount)));

  const overdueDebtors = debtors.filter(c => {
    const b = bal(c);
    const pi = payInfo(c);
    return (pi && pi.status === 'overdue') || (c.ceiling > 0 && b > c.ceiling);
  }).sort((a, b) => bal(b) - bal(a));
  const overdueSum = sum(overdueDebtors.map(bal));

  const onTimeDebtors = debtors.filter(c => {
    const b = bal(c);
    const pi = payInfo(c);
    const isOver = (pi && pi.status === 'overdue') || (c.ceiling > 0 && b > c.ceiling) || c.seg === 'black';
    return !isOver;
  }).sort((a, b) => bal(b) - bal(a));
  const onTimeSum = sum(onTimeDebtors.map(bal));

  const dist = getSegOrder().map(s => ({ s, v: sum(debtors.filter(c => c.seg === s).map(bal)) })).filter(d => d.v > 0);
  const healthPct = total > 0 ? Math.max(0, Math.min(100, Math.round((1 - (critSum / total)) * 100))) : 100;
  const healthColor = healthPct >= 75 ? '#10b981' : (healthPct >= 50 ? '#f59e0b' : '#ef4444');
  const healthLabel = healthPct >= 75 ? 'سيولة آمنة ومستقرة جداً' : (healthPct >= 50 ? 'سيولة مقبولة • يلزم متابعة المتأخرين' : 'تحذير: ديون حرجة تحتاج تدخلاً');

  // Ranking row (customer analytics)
  const renderCustRow = (c, i, extraBadge) => {
    const b = bal(c);
    const dStr = dialect(b);
    const foot = `${c.payDay ? `<span class="rk-t">موعده ${c.payDay}</span>` : ''}${extraBadge || ''}${dStr ? `<b class="rk-d">${esc(dStr)}</b>` : ''}`;
    return `
      <div class="top-r ${i < 3 ? 't3' : ''}" data-act="open" data-id="${c.id}">
        <div class="rk-top">
          <div class="rk-n num ${i < 3 ? 'r' + (i + 1) : ''}">#${i + 1}</div>
          <div class="av">${esc(c.name.trim()[0])}</div>
          <div class="rk-id">
            <b>${esc(c.name)}</b>
            <span class="rk-seg">${SEG[c.seg].icon} ${SEG[c.seg].label}</span>
          </div>
          <div class="rk-amt"><span class="num">${fmt(b)}</span><small>دج</small></div>
          <span class="rk-go">‹</span>
        </div>
        ${foot ? `<div class="rk-ft">${foot}</div>` : ''}
      </div>
    `;
  };

  const pnHead = (icon, title, badge) => `
    <div class="pn-h"><span class="ic">${icon}</span><h3>${title}</h3><span class="pn-b">${badge}</span></div>`;

  const f = STATS_FILTER || 'all';

  $('#statsBody').innerHTML = `
    <!-- خزينة ديون المتجر -->
    <div class="hx">
      <div class="hx-top">
        <span>خزينة الديون الكلية في السوق</span>
      </div>
      <div class="hx-amt"><b class="num">${fmt(total)}</b><span class="cur">دج</span></div>
      <span class="hx-dial">${esc(dialect(total) || '0 دج')}</span>
      <div class="hx-g">
        <div><span>الزبائن المديونون</span><div><b class="num">${debtors.length}</b> <small>زبون</small></div></div>
        <div><span>ديون معلقة</span><div><b class="num">${S.pending.length}</b> <small>تذكرة</small></div></div>
        <div><span>مؤشر الأمان</span><div><b class="num ok">${healthPct}%</b></div></div>
      </div>
    </div>

    <!-- المؤشرات المالية -->
    <div class="kg">
      ${hasGuarSegs ? `
      <div class="kp g">
        <div class="kp-h"><span class="kp-ic">💼</span><span class="kp-l">الديون المضمونة</span></div>
        <div class="kp-v"><b class="num">${fmt(salSum)}</b><small>دج</small></div>
        <div class="kp-d">${esc(dialect(salSum) || '0 دج')}</div>
        <div class="kp-f">${sal.length} زبون • تسديد في موعده</div>
      </div>` : ''}

      <div class="kp r ${hasGuarSegs ? '' : 'w'}">
        <div class="kp-h"><span class="kp-ic">⚠️</span><span class="kp-l">ديون متأخرة عن موعدها</span></div>
        ${hasGuarSegs ? `
        <div class="kp-v"><b class="num">${fmt(overdueSum)}</b><small>دج</small></div>
        <div class="kp-d">${esc(dialect(overdueSum) || '0 دج')}</div>` : `
        <div class="kp-m">
          <div class="kp-v"><b class="num">${fmt(overdueSum)}</b><small>دج</small></div>
          <div class="kp-d">${esc(dialect(overdueSum) || '0 دج')}</div>
        </div>`}
        <div class="kp-f">${overdueDebtors.length} زبائن متأخرون</div>
      </div>

      <div class="kp t w">
        <div class="kp-h"><span class="kp-ic">💰</span><span class="kp-l">إجمالي الأموال المسددة (السيولة المحصلة)</span></div>
        <div class="kp-m">
          <div class="kp-v"><b class="num">${fmt(totalPaid)}</b><small>دج</small></div>
          <div class="kp-d">${esc(dialect(totalPaid) || '0 دج')}</div>
        </div>
        <div class="kp-f">مجموع ما استرجعه المحل من الزبائن</div>
      </div>
    </div>

    <!-- مؤشر الاستقرار -->
    <div class="hl">
      <div class="hl-h">
        <span class="ic">🛡️</span>
        <b>مؤشر الاستقرار وصحة التحصيل:</b>
        <span class="num" style="color:${healthColor}">${healthPct}%</span>
      </div>
      <div class="bar"><i style="width:${healthPct}%;background:${healthColor}"></i></div>
      <div class="hl-t">${healthLabel}</div>
    </div>

    <!-- أقسام التحليل -->
    <div class="chips" id="statsFilterChips">
      <button class="chip ${f === 'all' ? 'on' : ''}" data-act="setStatsFilter" data-f="all"><span>🏆</span> كبار الديون (${debtors.length})</button>
      <button class="chip ${f === 'overdue' ? 'on' : ''}" data-act="setStatsFilter" data-f="overdue"><span>⚠️</span> المتأخرون (${overdueDebtors.length})</button>
      <button class="chip ${f === 'ontime' ? 'on' : ''}" data-act="setStatsFilter" data-f="ontime"><span>🟢</span> المنضبطون (${onTimeDebtors.length})</button>
      <button class="chip ${f === 'dist' ? 'on' : ''}" data-act="setStatsFilter" data-f="dist"><span>📊</span> توزيع الفئات (${dist.length})</button>
    </div>

    ${f === 'all' ? `
      <div class="pn">
        ${pnHead('🏆', 'ترتيب جميع المديونين تنازلياً', `${debtors.length} زبون`)}
        <div class="pn-s">كل من يحمل ديناً في المحل مرتبين من أعلى قيمة إلى الأقل:</div>
        ${!debtors.length ? `<div class="empty-st">لا توجد ديون مسجلة حالياً</div>` : `
          <div>
            ${debtors.map((c, i) => {
              const pi = payInfo(c);
              let tag = '';
              if (pi && pi.status === 'overdue') tag = `<span class="rk-t d">⚠️ متأخر ${pi.diff} يوم</span>`;
              else if (c.ceiling > 0 && bal(c) > c.ceiling) tag = `<span class="rk-t o">🚨 فوق السقف</span>`;
              else if (pi && pi.status === 'today') tag = `<span class="rk-t w">🕒 موعده اليوم</span>`;
              return renderCustRow(c, i, tag);
            }).join('')}
          </div>
        `}
      </div>
    ` : ''}

    ${f === 'overdue' ? `
      <div class="pn r">
        ${pnHead('⚠️', 'الزبائن المتأخرون عن موعد السداد', `${overdueDebtors.length} زبائن`)}
        <div class="sm r">
          <span class="l">إجمالي الديون المتأخرة:</span>
          <div class="v"><b class="num">${fmt(overdueSum)} دج</b><em>${esc(dialect(overdueSum))}</em></div>
        </div>
        ${!overdueDebtors.length ? `<div class="empty-st">الحمد لله، لا يوجد أي زبون متأخر عن موعد السداد ✅</div>` : `
          <div>
            ${overdueDebtors.map((c, i) => {
              const pi = payInfo(c);
              const tag = pi && pi.status === 'overdue' ? `<span class="rk-t d">⚠️ متأخر ${pi.diff} ${pi.diff <= 2 ? (pi.diff === 1 ? 'يوم' : 'يومين') : 'أيام'}</span>` : `<span class="rk-t o">🚨 تجاوز سقف الدين</span>`;
              return renderCustRow(c, i, tag);
            }).join('')}
          </div>
        `}
      </div>
    ` : ''}

    ${f === 'ontime' ? `
      <div class="pn g">
        ${pnHead('🟢', 'الزبائن المنضبطون في وقتهم', `${onTimeDebtors.length} زبون`)}
        <div class="sm g">
          <span class="l">إجمالي ديون المنضبطين:</span>
          <div class="v"><b class="num">${fmt(onTimeSum)} دج</b><em>${esc(dialect(onTimeSum))}</em></div>
        </div>
        ${!onTimeDebtors.length ? `<div class="empty-st">لا توجد سجلات كافية حالياً</div>` : `
          <div>
            ${onTimeDebtors.map((c, i) => {
              const pays = c.tx.filter(t => t.type === 'pay');
              const lastPay = pays.length ? pays[pays.length - 1] : null;
              const tag = lastPay ? `<span class="rk-t g">✅ سدد مؤخراً ${fmt(lastPay.amount)} دج</span>` : `<span class="rk-t g">✅ ملتزم بالموعد</span>`;
              return renderCustRow(c, i, tag);
            }).join('')}
          </div>
        `}
      </div>
    ` : ''}

    ${f === 'dist' ? `
      <div class="pn">
        <div class="pn-h"><span class="ic">📊</span><h3>توزيع الديون على فئات المتجر</h3></div>
        ${dist.map(d => {
          const pct = total > 0 ? Math.round((d.v / total) * 100) : 0;
          return `
            <div class="ds">
              <div class="ds-h">
                <span class="ds-n">${SEG[d.s].icon} ${SEG[d.s].label}</span>
                <div class="ds-v"><span class="num">${fmt(d.v)}</span><small>دج</small></div>
              </div>
              <div class="ds-b"><div class="ds-bar"><i style="width:${pct}%"></i></div><span class="ds-p num">${pct}%</span></div>
              <div class="ds-d">${esc(dialect(d.v))}</div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}
  `;
}

function renderAll() {
  document.body.classList.toggle('no-dial', !S.settings.dialect);
  renderDisplay(); renderPending(); renderLedger(); renderStats();
  updateBellBadge();
  updateTrashBadge();
  stack.forEach(m => m.refresh && m.refresh());
}


/* ============ Trash & Recovery System (سلة المهملات) ============ */
let TRASH_MODAL = null;
function openTrashModal() {
  S.trash = S.trash || [];
  if (TRASH_MODAL && TRASH_MODAL.paint && stack.includes(TRASH_MODAL)) {
    TRASH_MODAL.paint();
    updateTrashBadge();
    return;
  }
  TRASH_MODAL = openModal(() => `${sheetHead('سلة المهملات', S.trash.length ? `${S.trash.length} عنصر محذوف` : 'فارغة')}
    ${!S.trash.length ? `
      <div class="empty-st" style="padding:32px 16px">
        <span style="font-size:42px;display:block;margin-bottom:8px">🗑️</span>
        <b style="font-size:15px;color:var(--ink);display:block;margin-bottom:4px">سلة المهملات فارغة</b>
        <span style="color:var(--mute);font-size:12.5px">أي زبون أو تذكرة أو بيانات تحذفها ستجدها هنا لاسترجاعها أو حذفها نهائياً.</span>
      </div>
    ` : `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:12px;color:var(--mute)">العناصر المحفوظة مؤقتاً:</span>
        <button class="btn sm dng" data-act="purgeTrash" style="height:30px;font-size:11px;padding:0 8px;border-radius:8px">تفريغ السلة نهائياً</button>
      </div>
      <div style="max-height:58vh;overflow-y:auto;padding-bottom:10px">
        ${S.trash.map(item => {
          const dateStr = new Date(item.deletedAt).toLocaleDateString(typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.locale : 'ar-DZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
          return `
            <div style="background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <b style="font-size:14px;color:var(--ink);display:block">${esc(item.title)}</b>
                  <small style="color:var(--mute);display:block;margin-top:2px">${esc(item.desc)} • <span class="num">${dateStr}</span></small>
                </div>
                <span class="badge" style="font-size:10px;background:#fef2f2;color:#b91c1c">${item.type === 'bulk' ? 'تصفير شامل' : (item.type === 'customer' ? 'زبون' : 'تذكرة')}</span>
              </div>
              <div style="display:flex;gap:8px;margin-top:10px;border-top:1px dashed var(--line);padding-top:8px">
                <button class="btn sm pri" data-act="restoreTrash" data-id="${item.id}" style="flex:1;height:36px;font-size:12px;background:#065043;border-color:#065043">
                  <span>🔄</span> إستعادة
                </button>
                <button class="btn sm dng" data-act="deleteTrashItem" data-id="${item.id}" style="flex:1;height:36px;font-size:12px;background:#fef2f2;border:1px solid #fecaca;color:#dc2626">
                  <span>❌</span> حذف تام
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `, { refresh: () => { if (TRASH_MODAL && TRASH_MODAL.paint) TRASH_MODAL.paint(); } });
}

/* ============ Actions ============ */
function addTx(c, type, amount, note, extra) {
  c.tx.push(Object.assign({ id: uid(), type, amount: round2(amount), note: note || '', ts: Date.now() }, extra || {}));
}
function go(t) {
  $$('.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + t));
  $$('.nb').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function setMode(m) {
  mode = m;
  $('#modeSw').dataset.mode = m;
  $$('#modeSw button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  $('#paneQuick').hidden = m !== 'quick'; $('#paneCalc').hidden = m !== 'calc';
  renderDisplay();
}
function saveTicket() {
  const { total, tape } = current();
  if (!(total > 0)) return toast('أدخل مبلغًا أكبر من صفر', 'err');
  const t = { id: uid(), no: S.seq++, amount: round2(total), tape, tag: $('#tagInput').value.trim(), ts: Date.now() };
  S.pending.unshift(t); persist();
  Q = []; C = C0(); CSNAP = []; $('#tagInput').value = '';
  chime(); renderAll();
  toast(`تم الحفظ — تذكرة #${t.no} (${fmt(t.amount)} دج)`);
}
function undo() {
  if (mode === 'quick') { if (!Q.length) return toast('لا شيء للتراجع', 'err'); Q.pop(); renderDisplay(); }
  else { const s = CSNAP.pop(); if (!s) return toast('لا شيء للتراجع', 'err'); C = JSON.parse(s); renderDisplay(); }
}
function clearAll() {
  if (mode === 'quick') Q = []; else { C = C0(); CSNAP = []; }
  $('#tagInput').value = ''; renderDisplay();
}

/* Settings */
function openSettings() {
  const m = openModal(() => `${sheetHead('الإعدادات')}
    <div class="row-set"><div><b>الحساب بالسنتيم بالعامية</b></div><label class="sw"><input type="checkbox" data-ch="dialect" ${S.settings.dialect ? 'checked' : ''}><i></i></label></div>
    <div class="row-set"><div><b>أصوات النقر</b><small>نقرة خفيفة عند كل ضغطة</small></div><label class="sw"><input type="checkbox" data-ch="sound" ${S.settings.sound ? 'checked' : ''}><i></i></label></div>
    <div class="row-set"><div><b>التنبيهات والإشعارات الذكية</b><small>تنبيه تلقائي بمواعيد السداد وتجاوز السقف</small></div><label class="sw"><input type="checkbox" data-ch="notifs" ${S.settings.notifs ? 'checked' : ''}><i></i></label></div>
    <div class="row-set" style="background:#f0fdf4;border:1px solid rgba(6,80,67,.15);border-radius:14px;padding:12px;margin:10px 0">
      <div><b>تذكيرات SMS للزبائن</b><small>إعداد الجدولة والقوالب والسجل — الإرسال من هاتف المالك فقط</small></div>
      <button type="button" class="btn sm" data-act="smsSettings" style="height:36px;background:#065043;color:#fff;border:0">إعدادات SMS</button>
    </div>

    <div class="row-set" data-i18n-setting="language">
      <div><b>اللغة / Langue</b><small>العربية • Français</small></div>
      <div style="display:flex;gap:6px">
        <button type="button" class="btn sm" data-act="setLang" data-l="ar" onclick="DEYN_I18N.set('ar')" style="height:34px;font-size:12px;padding:0 12px;font-weight:700;border-radius:10px">ع</button>
        <button type="button" class="btn sm" data-act="setLang" data-l="fr" onclick="DEYN_I18N.set('fr')" style="height:34px;font-size:12px;padding:0 12px;font-weight:700;border-radius:10px">FR</button>
      </div>
    </div>

    <div class="row-set">
      <div>
        <b>قفل التطبيق بكلمة المرور</b>
        <small>طلب كلمة المرور عند فتح التطبيق لحماية الخصوصية</small>
      </div>
      <label class="sw">
        <input type="checkbox" data-ch="appLockEnabled" ${S.settings && S.settings.appLockEnabled ? 'checked' : ''}>
        <i></i>
      </label>
    </div>



    <!-- إدارة كلمة المرور -->
    <div class="row-set">
      <div>
        <b>كلمة المرور الرئيسية</b>
        <small>تعيين كلمة المرور أو تغييرها (الاسترجاع بكود موقّع من الدعم)</small>
      </div>
      <button type="button" class="btn sm" data-act="resetPassModal" style="height:34px;font-size:12px;padding:0 14px;background:#f0fdf4;color:var(--em);border:1.5px solid var(--em);font-weight:700;border-radius:10px">إدارة كلمة المرور</button>
    </div>

    <!-- المزامنة بين الهاتفين -->
    <div class="row-set">
      <div>
        <b>المزامنة بين الهاتفين</b>
        <small>ربط هاتف المالك بهاتف العامل عبر Wi-Fi المحلي دون إنترنت</small>
      </div>
      <button type="button" class="btn sm" data-act="syncOpen" style="height:34px;font-size:12px;padding:0 14px;background:#f0fdf4;color:var(--em);border:1.5px solid var(--em);font-weight:700;border-radius:10px">🔄 المزامنة</button>
    </div>

    <!-- سلة المهملات -->
    <div class="row-set">
      <div>
        <b>سلة المهملات</b>
        <small>استرجاع الحسابات أو البيانات المحذوفة خطأً</small>
      </div>
      <button type="button" class="btn sm" data-act="openTrash" style="height:34px;font-size:12px;padding:0 12px;background:#f8fafc;color:var(--ink);border:1.5px solid var(--line);font-weight:700;border-radius:10px;display:flex;align-items:center;gap:6px">
        <span>🗑️ سلة المهملات</span>
        <span class="badge" style="background:#065043;color:#fff;font-size:11px;padding:2px 6px;border-radius:6px">${(S.trash || []).length}</span>
      </button>
    </div>

    <!-- بيانات الحساب ورخصة المتجر والأجهزة -->
    <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)">
      <div style="font-size:13.5px;font-weight:700;color:var(--ink);margin-bottom:10px">الأجهزة المصرح بها ورخصة المتجر</div>
      
      <!-- بطاقة الأجهزة المصرح بها -->
      <div style="background:#f0fdf4;border:1.5px solid rgba(6,80,67,0.15);border-radius:16px;padding:12px 14px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <b style="font-size:13.5px;color:var(--ink);display:block">الأجهزة المصرح بها للمتجر:</b>
            <small style="color:var(--mute);font-size:11px">هاتف المالك الرئيسي + هاتف العامل المساعد</small>
          </div>
          <span class="badge" style="background:#065043;color:#fff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:8px">جهازان فقط 🔒</span>
        </div>
      </div>

      <!-- كود هاتف صاحب المحل الرئيسي (DEYN-M) -->
      <div style="margin-bottom:10px">
        <label class="lbl" style="margin:0 0 5px;font-weight:600">كود الهاتف الرئيسي (صاحب المحل):</label>
        <div class="code-card" data-act="copyMasterCode" title="اضغط لنسخ الكود">
          <div class="code-card__body">
            <b class="num code-card__value">${esc((S.auth && S.auth.masterCode) || 'DEYN-M-2026-8841-A9')}</b>
            <small>صلاحيات كاملة • صالح لغاية: ${esc((S.auth && S.auth.expiry) || '05/11/2027')}</small>
          </div>
          <span class="btn sm code-card__btn" style="height:32px;font-size:11.5px;padding:0 12px;background:#065043;color:#fff;border:none;border-radius:8px;font-weight:700;pointer-events:none">نسخ 📋</span>
        </div>
      </div>

      <!-- كود هاتف العامل (DEYN-S) -->
      <div style="margin-bottom:14px">
        <label class="lbl" style="margin:0 0 5px;font-weight:600">كود هاتف العامل:</label>
        <div class="code-card" data-act="copyAssistantCode" title="اضغط لنسخ الكود">
          <div class="code-card__body">
            <b class="num code-card__value">${esc((S.auth && S.auth.assistantCode) || 'DEYN-S-2026-9923-B4')}</b>
            <small>تسجيل ديون وتسديد فقط • الحذف مقفل 🔒</small>
          </div>
          <span class="btn sm code-card__btn" style="height:32px;font-size:11.5px;padding:0 12px;background:#065043;color:#fff;border:none;border-radius:8px;font-weight:700;pointer-events:none">نسخ 📋</span>
        </div>
      </div>
    </div>

    <!-- بطاقات أزرار خضراء فخمة ومتناسقة لحفظ الملفات -->
    <div style="border-top:1px solid var(--line);padding-top:14px;display:grid;gap:10px">
      <button class="btn block" data-act="exportPdf" style="background:linear-gradient(135deg, #065043 0%, #0a6655 100%);color:#fff;border:none;border-radius:14px;height:48px;font-size:14.5px;font-weight:700;box-shadow:0 3px 8px rgba(6,80,67,0.22);display:flex;align-items:center;justify-content:center;gap:8px">
        <span>📄</span>
        <span>حفظ ملف PDF</span>
      </button>

      <button class="btn block" data-act="backup" style="background:#f0fdf4;color:#065043;border:1.5px solid #065043;border-radius:14px;height:48px;font-size:14.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px">
        <span>💾</span>
        <span>حفظ ملف JSON</span>
      </button>
      
      <button class="btn sm block" data-act="clearData" style="height:38px;font-size:12px;color:#b91c1c;background:#fef2f2;border:1px dashed #fca5a5;border-radius:10px;margin-top:4px;font-weight:700">🗑️ حذف البيانات</button>
    </div>

    <!-- بطاقة للتواصل معنا الفخمة: زر واتساب حصري ومباشر -->
    <div style="margin-top:16px;background:linear-gradient(135deg, #065043 0%, #083c32 100%);border-radius:18px;padding:16px;color:#fff;box-shadow:0 4px 16px rgba(6,80,67,0.25);border:1px solid rgba(255,255,255,0.1)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px;background:rgba(255,255,255,0.12);width:32px;height:32px;border-radius:10px;display:grid;place-items:center">💬</span>
          <b style="font-size:15px;letter-spacing:.02em">للتواصل معنا</b>
        </div>
        <span style="background:rgba(52,211,153,0.2);color:#34d399;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid rgba(52,211,153,0.3)">دعم فني وتفعيل</span>
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-bottom:12px;line-height:1.5">لأي استفسار، مساعدة أو تفعيل رخصة المتجر:</div>
      
      <!-- زر واحد ووحيد فخم يأخذك مباشرة للواتساب -->
      <a href="https://wa.me/213659761616?text=${encodeURIComponent('السلام عليكم، أريد تفعيل رخصة تطبيق DEYN لمعرف جهازي.')}" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg, #25D366 0%, #1da851 100%);box-shadow:0 3px 10px rgba(37,211,102,0.3);border-radius:14px;padding:12px 16px;color:#fff;text-decoration:none;transition:transform .12s">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:22px">💬</span>
          <b style="font-size:14px;letter-spacing:.02em">مراسلة عبر واتساب (الدعم الفني)</b>
        </div>
        <span style="font-size:16px;font-weight:700">‹</span>
      </a>
    </div>

    <!-- الإصدار الاحترافي في الأسفل -->
    <div style="text-align:center;margin-top:14px;padding-bottom:2px;color:var(--mute);font-size:12px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600">
      DEYN • الإصدار 1.0.0
    </div>`, { refresh: () => { if (m && m.paint) m.paint(); } });
}


/* ============ Printable PDF Ledger (كراس الديون الورقي) ============ */
function exportPdfLedger() {
  const now = new Date();
  const dateStrFormatted = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} — ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const debtors = S.customers.filter(c => bal(c) > 0).sort((a, b) => bal(b) - bal(a));
  const totalDebt = sum(debtors.map(c => bal(c)));
  const totalDialect = dialect(totalDebt);

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>كراس ديون المتجر — DEYN — ${dateStrFormatted}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; color: #111827; margin: 0; padding: 24px; font-size: 13px; line-height: 1.5; background: #fff; }
  .header { border-bottom: 2.5px solid #065043; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
  .title { font-size: 24px; font-weight: 800; color: #065043; margin: 0; }
  .subtitle { font-size: 13px; color: #4b5563; margin-top: 4px; }
  .meta { text-align: left; font-size: 12px; color: #4b5563; }
  .kpis { display: flex; gap: 12px; margin-bottom: 18px; }
  .kpi-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; background: #f9fafb; text-align: center; }
  .kpi-title { font-size: 11.5px; color: #6b7280; font-weight: 700; }
  .kpi-val { font-size: 20px; font-weight: 800; color: #065043; margin-top: 4px; font-family: sans-serif; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { background: #065043; color: #fff; padding: 10px 12px; text-align: right; font-size: 12.5px; font-weight: 700; border: 1px solid #065043; }
  td { padding: 9px 12px; border: 1px solid #e5e7eb; font-size: 13px; }
  tr:nth-child(even) { background: #f9fafb; }
  .num { font-family: sans-serif; font-weight: 700; }
  .amt { text-align: left; direction: ltr; font-weight: 800; color: #065043; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 5px; font-size: 11px; background: #e5e7eb; color: #1f2937; font-weight: 600; }
  .footer { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11.5px; color: #6b7280; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <div class="no-print" style="background:#f0fdf4;border:1.5px solid #22c55e;padding:14px 18px;border-radius:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 6px rgba(0,0,0,0.05)">
    <span style="font-size:13.5px;color:#166534">📄 <b>معاينة كراس الديون الورقي:</b> يمكنك حفظ هذه النسخة كملف <b>PDF</b> على هاتفك أو طباعتها مباشرة على الورق.</span>
    <button onclick="window.print()" style="background:#065043;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;box-shadow:0 2px 4px rgba(6,80,67,0.3)">🖨️ طباعة / حفظ كـ PDF</button>
  </div>
  <div class="header">
    <div>
      <h1 class="title">كراس ديون المتجر — DEYN</h1>
      <div class="subtitle">نسخة ورقية منظمة لجميع الحسابات والديون</div>
    </div>
    <div class="meta">
      <div><b>تاريخ النسخة:</b> <span class="num">${dateStrFormatted}</span></div>
      <div><b>النوع:</b> كراس حسابات ورقي مقروء (PDF)</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi-card">
      <div class="kpi-title">مجموع الديون في السوق</div>
      <div class="kpi-val"><span class="num">${fmt(totalDebt)}</span> دج</div>
      <div style="font-size:12px;color:#047857;margin-top:3px;font-weight:600">${esc(totalDialect)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">عدد الزبائن المديونين</div>
      <div class="kpi-val"><span class="num">${debtors.length}</span> زبون</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">التذاكر المعلقة (دين غير مرحل)</div>
      <div class="kpi-val"><span class="num">${S.pending.length}</span> تذكرة</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:5%">#</th>
        <th style="width:25%">اسم الزبون</th>
        <th style="width:15%">التصنيف</th>
        <th style="width:15%">الهاتف</th>
        <th style="width:15%">موعد السداد</th>
        <th style="width:25%;text-align:left">مبلغ الدين الحالي</th>
      </tr>
    </thead>
    <tbody>
      ${debtors.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:28px;color:#6b7280;font-size:14px">لا توجد ديون مسجلة حالياً، الحمد لله.</td></tr>` : ''}
      ${debtors.map((c, i) => {
        const b = bal(c);
        const pi = payInfo(c);
        const segObj = SEG[c.seg] || { label: c.seg, icon: '🏷️' };
        let payStr = c.payDay ? `يوم ${c.payDay} في الشهر` : 'غير محدد';
        if (pi && pi.status === 'overdue') payStr += ` (⚠️ متأخر ${pi.diff} يوم)`;
        return `<tr>
          <td style="text-align:center" class="num">${i + 1}</td>
          <td><b>${esc(c.name)}</b></td>
          <td><span class="badge">${segObj.icon} ${esc(segObj.label)}</span></td>
          <td class="num">${esc(c.phone || '—')}</td>
          <td>${payStr}</td>
          <td class="amt"><span class="num">${fmt(b)}</span> دج <small style="display:block;color:#6b7280;font-size:11.5px;font-weight:600">${esc(dialect(b))}</small></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>تطبيق DEYN — تسيير الديون بكل سهولة وبدون إنترنت</div>
    <div>الصفحة 1 من 1</div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.html(html) : html);
    win.document.close();
  } else {
    const blob = new Blob([typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.html(html) : html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

function backup() {
  try {
    const safeBackup = JSON.parse(JSON.stringify(S));
    if (safeBackup.auth) {
      delete safeBackup.auth.masterPass;
      delete safeBackup.auth.masterCode;
      delete safeBackup.auth.assistantCode;
      delete safeBackup.sync;
      delete safeBackup.auth.pw; delete safeBackup.auth.pwFail; delete safeBackup.auth.pwMustSet; delete safeBackup.auth.pwMigrated;
    }
    const b = new Blob([JSON.stringify(safeBackup, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b);
    const d = new Date(); a.download = `deyn-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  } catch (e) { toast('تعذّر تحميل النسخة', 'err'); }
}

/* Assign */
let AS = { tid: null, q: '' };
function openAssign(tid) {
  const t = S.pending.find(x => x.id === tid); if (!t) return;
  AS = { tid, q: '', activeCat: 'all' };
  openModal(() => `${sheetHead('ترحيل للزبون', `تذكرة #${t.no} — <span class="num">${fmt(t.amount)}</span> دج`)}
    <div style="background:var(--tint);padding:10px 12px;border-radius:12px;margin-top:10px;border:1px solid rgba(6,80,67,.12)">
      <label class="lbl" for="assignTicketNote" style="margin-top:0;font-size:12px;font-weight:700;color:var(--ink)">ملاحظة أو تفاصيل السلعة للتذكرة (تُحفظ في حساب الزبون):</label>
      <input class="inp" id="assignTicketNote" type="text" value="${esc(t.tag || '')}" placeholder="مثال: زيت وسكر، أو قهوة وحليب..." autocomplete="off" style="background:#fff;margin-top:4px">
    </div>
    <input class="inp" id="aq" data-in="aq" type="search" placeholder="ابحث بالاسم أو الهاتف..." autocomplete="off" style="margin-top:10px">
    <div class="chips" id="assignCatChips" style="margin-top:8px;margin-bottom:6px">
      <button class="chip ${AS.activeCat === 'all' ? 'on' : ''}" data-act="assignCat" data-c="all">الكل</button>
      ${getSegOrder().map(s => `<button class="chip ${AS.activeCat === s ? 'on' : ''}" data-act="assignCat" data-c="${s}">${SEG[s].icon} ${SEG[s].label}</button>`).join('')}
    </div>
    <div id="aList" style="max-height:55vh;overflow-y:auto;padding-bottom:10px"></div>`, { mount: () => fillAssign() });
}
function pickRow(c) {
  const blk = c.seg === 'black', b = bal(c);
  return `<button class="pick" data-act="pick" data-cid="${c.id}" ${blk ? 'disabled' : ''}><div class="av">${esc(c.name.trim()[0])}</div><div class="m"><b>${esc(c.name)}</b><small>${SEG[c.seg].icon} ${SEG[c.seg].label}</small></div><div class="a">${blk ? 'محظور' : `<span class="num">${fmt(b)}</span> دج`}</div></button>`;
}
function fillAssign() {
  const box = $('#aList'); if (!box) return;
  const q = norm(AS.q).trim(), qd = AS.q.replace(/\D/g, '');
  const activeCat = AS.activeCat || 'all';

  if (!q) {
    let segs = getSegOrder();
    if (activeCat === 'all') {
      segs = segs.filter(s => s !== 'black');
    } else {
      segs = segs.filter(s => s === activeCat);
    }

    if (!segs.length) {
      box.innerHTML = '<div class="empty-st" style="padding:24px">لا توجد فئات مطابقة</div>';
      return;
    }

    box.innerHTML = segs.map(s => {
      const segCusts = S.customers.filter(c => c.seg === s).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      const isBlk = (s === 'black');
      if (!segCusts.length) {
        return `
          <div class="pick-g" style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding:10px 2px 4px;margin-top:10px">
            <span style="font-weight:700;color:${isBlk ? 'var(--danger)' : 'var(--ink)'}">${SEG[s].icon} ${SEG[s].label}</span>
            <small style="color:var(--mute)">0 زبائن</small>
          </div>
          <div class="empty-st" style="padding:16px;font-size:12px">لا يوجد زبائن مسجلون في هذه الفئة</div>
        `;
      }
      return `
        <div class="pick-g" style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding:10px 2px 4px;margin-top:10px">
          <span style="font-weight:700;color:${isBlk ? 'var(--danger)' : 'var(--ink)'}">${SEG[s].icon} ${SEG[s].label}</span>
          <small style="color:var(--mute)">${segCusts.length} زبائن</small>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          ${segCusts.map(c => `
            <button class="pick" data-act="pick" data-cid="${c.id}" ${isBlk ? 'disabled' : ''} style="display:flex;align-items:center;gap:8px;padding:10px;margin-bottom:0;border-radius:14px;border:1px solid var(--line);background:${isBlk ? '#f8fafc' : '#fff'};opacity:${isBlk ? '0.5' : '1'}">
              <div class="av" style="width:34px;height:34px;border-radius:11px;font-size:13px;${isBlk ? 'background:var(--ink)' : ''}">${esc(c.name.trim()[0])}</div>
              <div class="m" style="text-align:right">
                <b style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</b>
                <span class="num" style="font-size:11.5px;color:${isBlk ? 'var(--danger)' : 'var(--em)'};font-weight:700">${isBlk ? 'محظور' : fmt(bal(c)) + ' دج'}</span>
              </div>
            </button>
          `).join('')}
        </div>
      `;
    }).join('') + ((activeCat === 'all' && S.customers.some(c => c.seg === 'black')) ? `
      <div class="pick-g" style="margin-top:16px;color:var(--danger);border-bottom:1px solid var(--line);padding-bottom:4px">🚫 القائمة السوداء (محظورون من الدين)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        ${S.customers.filter(c => c.seg === 'black').map(c => `
          <button class="pick" disabled style="display:flex;align-items:center;gap:8px;padding:10px;margin-bottom:0;border-radius:14px;opacity:0.5;background:#f8fafc">
            <div class="av" style="width:34px;height:34px;border-radius:10px;font-size:12px;background:var(--ink)">${esc(c.name.trim()[0])}</div>
            <div class="m" style="text-align:right">
              <b style="font-size:13px">${esc(c.name)}</b>
              <span style="font-size:11px;color:var(--danger)">محظور</span>
            </div>
          </button>
        `).join('')}
      </div>
    ` : '');
  } else {
    const r = S.customers.filter(c => (activeCat === 'all' || c.seg === activeCat) && (norm(c.name).includes(q) || (qd.length > 1 && c.phone.replace(/\D/g, '').includes(qd))));
    box.innerHTML = r.length ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        ${r.map(c => {
          const isBlk = c.seg === 'black';
          return `
            <button class="pick" data-act="pick" data-cid="${c.id}" ${isBlk ? 'disabled' : ''} style="display:flex;align-items:center;gap:8px;padding:10px;margin-bottom:0;border-radius:14px;border:1px solid var(--line);background:${isBlk ? '#f8fafc' : '#fff'};opacity:${isBlk ? '0.5' : '1'}">
              <div class="av" style="width:34px;height:34px;border-radius:11px;font-size:13px;${isBlk ? 'background:var(--ink)' : ''}">${esc(c.name.trim()[0])}</div>
              <div class="m" style="text-align:right">
                <b style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</b>
                <span class="num" style="font-size:11.5px;color:${isBlk ? 'var(--danger)' : 'var(--em)'};font-weight:700">${isBlk ? 'محظور' : fmt(bal(c)) + ' دج'}</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>` : `<div class="empty-st" style="padding:24px">لا يوجد زبون بهذا الاسم</div>`;
  }
}

/* Money modal */
let MM = null;
function openMoney(cid, kind) {
  const c = cust(cid); if (!c) return;
  if (kind === 'debt' && c.seg === 'black') return toast('حساب محظور — لا يمكن إضافة دين جديد', 'err');
  if (kind === 'pay' && bal(c) <= 0) return toast('لا يوجد دين على هذا الزبون', 'err');
  MM = { cid, kind };
  const b = bal(c);
  const quick = kind === 'pay' ? [['كامل الدين', b], ['1000', 1000], ['2000', 2000], ['5000', 5000]].filter(x => x[1] <= b) : [['500', 500], ['1000', 1000], ['2000', 2000], ['5000', 5000]];
  openModal(() => `${sheetHead(kind === 'pay' ? 'تسديد دين' : 'زيادة دين', esc(c.name) + ` — الدين الحالي <span class="num">${fmt(b)}</span> دج`)}
    <label class="lbl" for="mAmt">${kind === 'pay' ? 'المبلغ المسدد (دج)' : 'المبلغ (دج)'}</label>
    <input class="inp num" id="mAmt" data-in="mm" type="text" inputmode="decimal" placeholder="0" autocomplete="off" style="direction:ltr;text-align:right;font-size:20px;font-weight:700">
    <div class="dial-l" id="mDial"></div>
    <div class="qa">${quick.map(([l, v]) => `<button data-act="mmq" data-v="${v}">${/^\d+$/.test(l) ? `<span class="num">${l}</span>` : l}</button>`).join('')}</div>
    ${kind === 'pay' && c.seg === 'black' ? `
    <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:14px;padding:12px;margin-top:14px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:22px">🔓</span>
        <div>
          <b style="font-size:13.5px;color:#166534;display:block">رفع الحظر عن الزبون بعد التسديد</b>
          <small style="font-size:11px;color:#15803d;display:block;margin-top:2px">السماح له بأخذ دين جديد ونقله للزبائن النشطين</small>
        </div>
      </div>
      <label class="sw"><input type="checkbox" id="mUnblockCheck" checked><i></i></label>
    </div>
    ` : ''}
    ${kind === 'pay' ? `
    <div style="background:var(--tint);padding:12px;border-radius:14px;border:1px solid rgba(6,80,67,.15);margin-top:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <label class="lbl" for="mNewDebt" style="margin:0;font-weight:700;color:var(--ink);font-size:13px">🛍️ سلعة جديدة أخذها الآن (دين جديد يُضاف)</label>
        <span style="font-size:11px;color:var(--mute)">اختياري</span>
      </div>
      <input class="inp num" id="mNewDebt" data-in="mm" type="text" inputmode="decimal" placeholder="0 دج" autocomplete="off" style="direction:ltr;text-align:right;font-size:18px;font-weight:700;background:#fff">
      <div class="dial-l" id="mNewDial" style="min-height:16px;font-size:12px;color:var(--primary);margin-top:2px"></div>
    </div>
    <div id="mCalcSummary" style="background:#f8fafc;border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:12px;font-size:13px;line-height:1.6">
      <div style="display:flex;justify-content:space-between;color:var(--mute)">
        <span>الدين القديم:</span>
        <span class="num"><b>${fmt(b)}</b> دج</span>
      </div>
      <div style="display:flex;justify-content:space-between;color:var(--danger);margin-top:3px">
        <span>- المبلغ المسدد:</span>
        <span class="num"><b id="mSumPay">0</b> دج</span>
      </div>
      <div style="display:flex;justify-content:space-between;color:var(--primary);margin-top:3px">
        <span>+ السلعة الجديدة:</span>
        <span class="num"><b id="mSumNew">0</b> دج</span>
      </div>
      <div style="border-top:1px dashed var(--line);margin:8px 0"></div>
      <div id="mSummaryRow" style="display:flex;justify-content:space-between;align-items:center;color:var(--ink);font-weight:700">
        <span>صافي الدين المتبقي الجديد:</span>
        <span class="num" id="mResBal" style="font-size:16px">${fmt(b)} دج</span>
      </div>
    </div>
    ` : ''}
    <label class="lbl" for="mNote" style="margin-top:12px">ملاحظة (اختياري)</label>
    <input class="inp" id="mNote" type="text" maxlength="60" placeholder="${kind === 'pay' ? 'مثال: دفعة من الحساب، أو تفاصيل السلعة المأخوذة...' : 'مثال: خبز وحليب'}" autocomplete="off">
    <div class="warn-line" id="mWarn"></div>
    <button class="btn pri block" id="mOk" data-act="mmok" data-primary style="margin-top:16px">${kind === 'pay' ? 'تأكيد العملية' : 'تأكيد الدين'}</button>`,
    { mount: w => { const i = $('#mAmt', w); if (i) setTimeout(() => i.focus(), 280); } });
}
function updateMM() {
  try {
    if (!MM || !$('#mAmt')) return;
    const c = cust(MM.cid); if (!c) return;
    const curBal = bal(c);
    const payInp = $('#mAmt');
    const payAmt = round2(parseAmt(payInp ? payInp.value : '0'));
    const newDebtInp = $('#mNewDebt');
    const newDebt = newDebtInp ? round2(parseAmt(newDebtInp.value)) : 0;

    if ($('#mDial')) $('#mDial').textContent = (payAmt > 0) ? dialShown(payAmt) : '';
    if ($('#mNewDial')) $('#mNewDial').textContent = (newDebt > 0) ? dialShown(newDebt) : '';

    let w = '', label = MM.kind === 'pay' ? 'تأكيد العملية' : 'تأكيد الدين';

    if (MM.kind === 'pay') {
      if ($('#mSumPay')) $('#mSumPay').textContent = fmt(payAmt);
      if ($('#mSumNew')) $('#mSumNew').textContent = fmt(newDebt);

      const netBal = round2(curBal - payAmt + newDebt);
      const resBalEl = $('#mResBal');
      const sumRow = $('#mSummaryRow');

      if (resBalEl) {
        if (netBal === 0) {
          if (sumRow) sumRow.style.color = 'var(--primary)';
          resBalEl.innerHTML = `0 دج <span style="font-size:11px;background:var(--tint);padding:2px 6px;border-radius:6px;margin-right:4px">✅ مصفّى بالكامل</span>`;
        } else if (netBal < 0) {
          if (sumRow) sumRow.style.color = 'var(--danger)';
          resBalEl.textContent = `${fmt(netBal)} دج (دفع زائد)`;
        } else {
          if (sumRow) sumRow.style.color = 'var(--ink)';
          const dStr = dialShown(netBal);
          resBalEl.innerHTML = `${fmt(netBal)} دج ${dStr ? `<small style="font-weight:400;color:var(--mute);margin-right:4px">(${dStr})</small>` : ''}`;
        }
      }

      if (payAmt <= 0 && newDebt <= 0) {
        w = 'أدخل المبلغ المسدد أو سلعة جديدة';
      } else if (payAmt > curBal + newDebt + 0.001) {
        w = 'المبلغ المسدد أكبر من مجموع الدين الحالي والسلعة الجديدة';
      } else if (c.ceiling > 0 && netBal > c.ceiling) {
        w = `⚠️ الدين الجديد (${fmt(netBal)} دج) يتجاوز السقف (${fmt(c.ceiling)} دج)`;
        label = 'تأكيد رغم تجاوز السقف';
      }
    } else {
      // kind === 'debt'
      const ok = payAmt > 0;
      if (ok && c.ceiling > 0 && curBal + payAmt > c.ceiling) {
        w = `⚠️ يتجاوز السقف (${fmt(c.ceiling)} دج) بـ ${fmt(curBal + payAmt - c.ceiling)} دج`;
        label = 'تأكيد رغم تجاوز السقف';
      }
    }

    if ($('#mWarn')) $('#mWarn').textContent = w;
    if ($('#mOk')) $('#mOk').textContent = label;
  } catch (err) {
    console.warn(err);
  }
}
function confirmMoney() {
  const c = cust(MM.cid); if (!c) return;
  const payInp = $('#mAmt');
  const payAmt = round2(parseAmt(payInp ? payInp.value : '0'));
  const newDebtInp = $('#mNewDebt');
  const newDebt = newDebtInp ? round2(parseAmt(newDebtInp.value)) : 0;
  const note = $('#mNote') ? $('#mNote').value.trim() : '';

  if (MM.kind === 'pay') {
    if (payAmt <= 0 && newDebt <= 0) return toast('أدخل المبلغ المسدد أو سلعة جديدة', 'err');
    const curBal = bal(c);
    if (payAmt > curBal + newDebt + 0.001) return toast('المبلغ المسدد أكبر من مجموع الدين والسلعة', 'err');

    let wasUnblocked = false;
    const unblockInp = $('#mUnblockCheck');
    const shouldUnblock = unblockInp ? unblockInp.checked : (c.seg === 'black' && payAmt > 0);
    if (c.seg === 'black' && shouldUnblock) {
      const activeSegs = getSegOrder().filter(s => s !== 'black');
      const targetSeg = activeSegs[0] || 'daily';
      c.seg = targetSeg;
      if (c.ceiling === 0) c.ceiling = SEG[targetSeg].ceiling || 10000;
      wasUnblocked = true;
    }

    if (payAmt > 0) {
      const pNote = (newDebt > 0 && !note) ? 'تسديد دفعة مع سلعة جديدة' : (note || 'تسديد دين');
      addTx(c, 'pay', payAmt, pNote);
    }
    if (newDebt > 0) {
      const dNote = note ? `سلعة جديدة: ${note}` : 'سلعة مأخوذة مع التسديد';
      addTx(c, 'debt', newDebt, dNote);
    }

    const finalBal = bal(c);
    if (wasUnblocked) {
      toast(`تم التسديد ورُفع الحظر عن ${c.name} وأصبح بإمكانه أخذ الدين بنجاح ✅`, 'ok');
    } else if (payAmt > 0 && newDebt > 0) {
      toast(`تم تسديد ${fmt(payAmt)} دج وإضافة سلعة بـ ${fmt(newDebt)} دج — الباقي ${fmt(finalBal)} دج`, 'ok');
    } else if (payAmt > 0) {
      toast(`تم تسديد ${fmt(payAmt)} دج — الباقي ${fmt(finalBal)} دج`, 'ok');
    } else {
      toast(`تمت إضافة سلعة بـ ${fmt(newDebt)} دج — الدين الحالي ${fmt(finalBal)} دج`, 'ok');
    }
  } else {
    // kind === 'debt'
    if (!(payAmt > 0)) return toast('أدخل مبلغًا صحيحًا', 'err');
    addTx(c, 'debt', payAmt, note);
    const over = c.ceiling > 0 && bal(c) > c.ceiling;
    toast(over ? `تمت الإضافة — الزبون تجاوز السقف` : `تمت إضافة ${fmt(payAmt)} دج على ${c.name}`, over ? 'warn' : 'ok');
  }

  persist(); chime(); closeModal(); renderAll();
}

function openNewSegModal() {
  openModal(() => `${sheetHead('إضافة فئة زبائن جديدة')}
    <label class="lbl" for="segName">اسم الفئة الجديدة</label>
    <input class="inp" id="segName" type="text" maxlength="30" placeholder="مثال: بنائين، عائلة، تجار جملة..." autocomplete="off">
    <label class="lbl" for="segIcon">الأيقونة أو الرمز</label>
    <input class="inp" id="segIcon" type="text" maxlength="4" value="🏷️" style="text-align:center;font-size:20px">
    <label class="lbl" for="segCeil">سقف الدين التلقائي لهذه الفئة (دج)</label>
    <input class="inp num" id="segCeil" type="text" inputmode="numeric" value="10000" style="direction:ltr;text-align:right">
    <div class="row-set" style="margin-top:14px"><div><b>ديون مضمونة</b><small>زبائن هذه الفئة يسددون في موعدهم تلقائياً</small></div><label class="sw"><input type="checkbox" id="segGuar"><i></i></label></div>
    <button class="btn pri block" data-act="saveNewSeg" data-primary style="margin-top:16px">حفظ الفئة</button>`);
}

function saveNewSeg() {
  const name = $('#segName').value.trim();
  const icon = $('#segIcon').value.trim() || '🏷️';
  const ceil = Math.max(0, round2(parseAmt($('#segCeil').value))) || 10000;
  if (name.length < 2) return toast('اكتب اسم الفئة', 'err');
  
  const key = 'seg_' + uid();
  if (!S.customSegs) S.customSegs = {};
  S.customSegs[key] = { label: name, icon, ceiling: ceil };
  if (!S.guaranteed) S.guaranteed = {};
  S.guaranteed[key] = !!($('#segGuar') && $('#segGuar').checked);
  persist();
  closeModal();
  if (CF) {
    CF.seg = key;
    renderAll();
    openCustForm(CF.id);
  } else {
    renderAll();
  }
  toast(`تمت إضافة فئة «${name}»`);
}


/* ============ Category Management (Delete & Add Categories) ============ */
function openManageSegsModal() {
  const m = openModal(() => {
    const segs = getSegOrder();
    return `${sheetHead('إدارة وتعديل الفئات')}
    <div class="sub">يمكنك حذف أي فئة لا تستعملها في محلك:</div>
    <div style="display:grid;gap:8px;margin-top:12px">
      ${segs.map(s => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:#fff;border:1px solid var(--line);border-radius:14px">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">
            <span style="font-size:20px">${SEG[s].icon}</span>
            <div style="min-width:0">
              <b style="font-size:14px;color:var(--ink);display:block">${esc(SEG[s].label)}</b>
              <small style="color:var(--mute)">(${S.customers.filter(c => c.seg === s).length} زبائن)</small>
            </div>
          </div>
          ${s !== 'black' ? `<label class="sw" title="ديون مضمونة" style="transform:scale(.85)"><input type="checkbox" data-gs="${s}" ${isGuaranteed(s) ? 'checked' : ''}><i></i></label>` : ''}
          ${segs.length > 1 ? `<button type="button" class="del" data-act="delSeg" data-s="${s}" style="width:36px;height:36px;border-radius:10px" title="حذف الفئة">🗑️</button>` : ''}
        </div>
      `).join('')}
    </div>
    <button type="button" class="btn soft block" data-act="newSegPrompt" style="margin-top:14px">+ إضافة فئة جديدة</button>
  `;
  }, { refresh: () => m.paint() });
  return m;
}

/* تحديث شرائح التصنيف داخل نموذج الزبون فوراً بعد أي حذف/تعديل للفئات */
function refreshFormSegs() {
  const box = $('#fSegs');
  if (!box || !CF) return;
  if (!getSegOrder().includes(CF.seg)) CF.seg = getSegOrder()[0] || 'daily';
  box.innerHTML = getSegOrder().map(s => `<button type="button" class="chip ${CF.seg === s ? 'on' : ''}" data-act="fseg" data-s="${s}">${SEG[s].icon} ${SEG[s].label}</button>`).join('');
}

function deleteCategory(segKey) {
  const count = S.customers.filter(c => c.seg === segKey).length;
  const label = SEG[segKey].label;
  
  confirmBox({
    title: `حذف فئة «${label}»`,
    msg: count > 0 ? `توجد ${count} زبائن مسجلين في فئة «${label}». سيتم نقلهم تلقائياً إلى الفئة المتبقية.` : `هل أنت متأكد من حذف فئة «${label}»؟`,
    ok: 'حذف الفئة',
    danger: true,
    onOk: () => {
      if (!S.deletedSegs) S.deletedSegs = [];
      if (!S.deletedSegs.includes(segKey)) S.deletedSegs.push(segKey);
      
      if (S.customSegs && S.customSegs[segKey]) {
        delete S.customSegs[segKey];
      }

      const remaining = getSegOrder();
      const fallback = remaining[0] || 'daily';
      S.customers.forEach(c => {
        if (c.seg === segKey) c.seg = fallback;
      });

      if (LF && LF.seg === segKey) LF.seg = 'all';
      if (CF && CF.seg === segKey) CF.seg = fallback;

      persist();
      renderAll();
      refreshFormSegs();
      toast(`تم حذف فئة «${label}» بنجاح`);
    }
  });
}

/* Customer detail */
function statement(c) {
  const rows = [...c.tx].sort((a, b) => a.ts - b.ts).slice(-10);
  const lines = rows.map(t => `• ${dateStr(t.ts)}  ${t.type === 'debt' ? 'دين' : 'تسديد'}  ${t.type === 'debt' ? '+' : '−'}${fmt(t.amount)} دج${t.note ? ' (' + t.note + ')' : ''}`);
  return [`*DEYN — كشف حساب*`, `الزبون: ${c.name}`, `التاريخ: ${dateStr(Date.now())}`, '──────────', ...(lines.length ? ['آخر العمليات:', ...lines, '──────────'] : []),
    `*الباقي عليك: ${fmt(bal(c))} دج*`, c.ceiling > 0 ? `السقف المسموح: ${fmt(c.ceiling)} دج` : '', 'شكرًا على ثقتكم 🤝'].filter(Boolean).map(l => typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.tr(l) : l).join('\n');
}
function waNumber(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '213' + d.slice(1);
  return d.length >= 11 ? d : '';
}
function openDetail(cid) {
  if (!cust(cid)) return;
  const m = openModal(() => {
    const c = cust(cid); if (!c) return '';
    const b = bal(c), pct = c.ceiling > 0 ? Math.min(100, Math.max(b > 0 ? 3 : 0, b / c.ceiling * 100)) : (b > 0 ? 100 : 0);
    let run = 0;
    const rows = [...c.tx].sort((a, b2) => a.ts - b2.ts).map(t => { run = round2(run + (t.type === 'debt' ? t.amount : -t.amount)); return { t, run }; }).reverse();
    const pi = payInfo(c), blk = c.seg === 'black';
    return `${sheetHead(esc(c.name), `<a href="tel:${esc(c.phone.replace(/\s/g, ''))}" class="num" style="color:inherit;text-decoration:none">${esc(c.phone || 'بدون رقم')}</a> · <span class="badge ${blk ? 'black' : ''}">${SEG[c.seg].icon} ${SEG[c.seg].label}</span>`)}
      <div class="hero-bal">
        <div class="l">الدين الحالي</div>
        <div class="v">
          <span class="num">${fmt(b)}</span><span style="color:#b9d6cf">دج</span>
        </div>
        ${b > 0 && dialect(b) ? `<div style="font-size:13.5px;font-weight:700;color:#ffffff;background:rgba(255,255,255,0.14);padding:4px 12px;border-radius:10px;display:inline-block;margin-bottom:12px;letter-spacing:.02em">${esc(dialect(b))}</div>` : ''}
        <div class="bar ${barState(c)}"><i style="width:${pct}%"></i></div>
        <div class="ceil-h"><span>السقف</span><span class="num">${fmt(b)} / ${fmt(c.ceiling)}</span></div>
      </div>
      ${blk ? `
      <div class="note d" style="margin:0 0 12px;display:flex;align-items:center;justify-content:space-between;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:14px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:22px">🚫</span>
          <div>
            <b style="color:#b91c1c;font-size:13.5px;display:block">حساب محظور (القائمة السوداء)</b>
            <small style="color:#991b1b;font-size:11px">لا يمكنه أخذ دين جديد حتى يُرفع الحظر</small>
          </div>
        </div>
        ${isWorkerDevice() ? "" : `<button type="button" class="btn sm" data-act="unblockCust" data-id="${c.id}" style="height:34px;font-size:12px;padding:0 12px;background:#065043;color:#fff;border:none;border-radius:10px;font-weight:700">🔓 رفع الحظر</button>`}
      </div>` : c.ceiling > 0 && b > c.ceiling ? `<div class="note d" style="margin:0 0 10px">⚠️ تجاوز السقف بـ ${fmt(b - c.ceiling)} دج</div>` : ''}
      ${pi && pi.diff <= 5 ? `<div class="note w" style="margin:0 0 10px">💼 ${pi.diff === 0 ? 'يوم الراتب اليوم' : 'الراتب بعد ' + pi.diff + ' يوم'} — وقت التحصيل</div>` : ''}
      <div class="two"><button class="btn soft" data-act="pay" data-id="${c.id}" ${b <= 0 ? 'disabled' : ''}>💰 تسديد دين</button><button class="btn" data-act="debt" data-id="${c.id}" ${blk ? 'disabled' : ''}>➕ زيادة دين</button></div>
      
      <div class="pick-g" style="margin-top:18px">سجل العمليات</div>
      ${rows.length ? rows.map(({ t, run: r }) => `<div class="tx"><div class="tx-ic ${t.type}">${t.type === 'debt' ? '+' : '−'}</div><div class="tx-m"><b>${t.type === 'debt' ? 'دين' : 'تسديد'}${t.note ? ' · ' + esc(t.note) : ''}</b><small class="num">${dateStr(t.ts)} ${timeStr(t.ts)}${t.type === 'debt' ? (() => { const dueAt = Number(t.dueAt) || (c.payDay ? window.DeynSmsCore.nextMonthlyDue(t.ts, c.payDay) : null); return dueAt ? ' • الاستحقاق ' + dateStr(dueAt) + (Array.isArray(t.extensionHistory) && t.extensionHistory.length ? ' • تمديد ' + t.extensionHistory.length : '') : ''; })() : ''}</small></div><div class="tx-a"><b class="num ${t.type}">${t.type === 'debt' ? '+' : '−'}${fmt(t.amount)}</b><small>الباقي <span class="num">${fmt(r)}</span> دج${r > 0 && dialect(r) ? ` (${esc(dialect(r))})` : ''}</small></div></div>`).join('') : '<div class="empty-st" style="padding:20px">لا توجد عمليات بعد</div>'}
      <div class="two" style="margin-top:16px">${isWorkerDevice() ? "" : `<button class="btn sm" data-act="editCust" data-id="${c.id}">تعديل البيانات</button>`}${isWorkerDevice() ? "" : `<button class="btn sm dng" data-act="delCust" data-id="${c.id}">حذف الزبون</button>`}</div>`;
  }, { refresh: () => { if (!cust(cid)) closeModal(m); else m.paint(); } });
}

/* Customer form */
let CF = null;
function openCustForm(id, initialSeg) {
  const c = id ? cust(id) : null;
  const activeFilterSeg = (LF && LF.seg && LF.seg !== 'all') ? LF.seg : null;
  const segOrders = getSegOrder();
  const defaultSeg = initialSeg || (c ? c.seg : (activeFilterSeg || (segOrders.includes('youth') ? 'youth' : segOrders[0])));
  
  CF = { id: c ? c.id : null, seg: defaultSeg, touched: !!c };

  openModal(() => `${sheetHead(c ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد')}
    <label class="lbl" for="fName">اسم الزبون *</label>
    <input class="inp" id="fName" type="text" maxlength="40" value="${esc(c ? c.name : '')}" placeholder="اكتب اسم أو لقب الزبون" autocomplete="off">
    
    <label class="lbl" for="fPhone">رقم الهاتف (اختياري)</label>
    <input class="inp num" id="fPhone" type="tel" maxlength="20" value="${esc(c ? c.phone : '')}" placeholder="اختياري" style="direction:ltr;text-align:right" autocomplete="off">
    
    <div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0 6px">
      <label class="lbl" style="margin:0">تصنيف الزبون *</label>
      <div style="display:flex;gap:6px">
        <button type="button" class="btn sm soft" data-act="manageSegsModal" style="height:30px;padding:0 8px;font-size:11px">⚙️ إدارة الفئات</button>
        <button type="button" class="btn sm soft" data-act="newSegPrompt" style="height:30px;padding:0 8px;font-size:11px">+ فئة جديدة</button>
      </div>
    </div>
    <div class="chips2" id="fSegs">
      ${getSegOrder().map(s => `<button type="button" class="chip ${CF.seg === s ? 'on' : ''}" data-act="fseg" data-s="${s}">${SEG[s].icon} ${SEG[s].label}</button>`).join('')}
    </div>

    ${!c ? `
    <label class="lbl" for="fInitialDebt" style="color:var(--em);font-weight:700">المبلغ المديون به (من الكراس القديم إن وجد)</label>
    <input class="inp num" id="fInitialDebt" type="text" inputmode="decimal" placeholder="0 دج (اختياري)" style="direction:ltr;text-align:right;font-size:18px;font-weight:700;background:#fbfdfc;border-color:#b9d6cf">
    ` : ''}

    <label class="lbl" for="fCeil">سقف الدين الأقصى (اختياري)</label>
    <input class="inp num" id="fCeil" data-in="fceil" type="text" inputmode="numeric" value="${c ? (c.ceiling || '') : (SEG[CF.seg].ceiling || '')}" placeholder="بدون سقف أقصى" style="direction:ltr;text-align:right">

    <div id="fPayBox">
      <label class="lbl" for="fPay">يوم السداد المتوقع في الشهر (اختياري)</label>
      <input class="inp num" id="fPay" type="text" inputmode="numeric" maxlength="2" value="${c && c.payDay ? c.payDay : ''}" placeholder="مثال: 27 (اختياري)" style="direction:ltr;text-align:right">
      <div class="sub" style="font-size:11px;margin-top:4px">إذا حُدد اليوم يُنبهك التطبيق عند اقتراب أو تأخر موعد السداد.</div>
    </div>

    <button class="btn pri block" data-act="saveCust" data-primary style="margin-top:18px">${c ? 'حفظ التعديلات' : 'حفظ الزبون'}</button>`);
}
function saveCust() {
  if (CF && CF.id && isWorkerDevice()) {
    return toast('عذراً، تعديل بيانات الزبائن متاح لصاحب المحل فقط 🔒', 'err');
  }
  const nameInp = $('#fName');
  const name = nameInp ? nameInp.value.trim() : '';
  const phone = $('#fPhone') ? $('#fPhone').value.trim() : '';
  
  // Ceiling is completely optional: defaults to 0 (no ceiling) if empty
  const ceilVal = $('#fCeil') ? $('#fCeil').value.trim() : '';
  const parsedCeil = parseAmt(ceilVal);
  const ceiling = (ceilVal && !isNaN(parsedCeil) && parsedCeil >= 0) ? Math.round(parsedCeil) : 0;

  // Pay day is completely optional: defaults to null
  const payVal = $('#fPay') ? $('#fPay').value.trim() : '';
  const pd = parseInt(payVal, 10);
  const payDay = (payVal && !isNaN(pd) && pd >= 1 && pd <= 31) ? pd : null;

  // Initial debt from old notebook: optional
  const initDebtInput = $('#fInitialDebt');
  const parsedInit = initDebtInput ? parseAmt(initDebtInput.value) : 0;
  const initialDebt = (!isNaN(parsedInit) && parsedInit > 0) ? round2(parsedInit) : 0;

  // Merchant can write even a single letter (e.g. "م", "أحمد", "ولد عمار")
  if (!name || name.length < 1) {
    if (nameInp) nameInp.focus();
    return toast('يرجى كتابة اسم أو لقب الزبون', 'err');
  }

  if (CF.id) {
    const c = cust(CF.id);
    Object.assign(c, { name, phone, seg: CF.seg, ceiling, payDay });
    toast('تم حفظ التعديلات');
  } else {
    const newTx = [];
    if (initialDebt > 0) {
      newTx.push({ id: uid(), type: 'debt', amount: initialDebt, note: 'دين سابق من الكراس القديم', ts: Date.now() });
    }
    S.customers.push({ id: uid(), name, phone, seg: CF.seg, ceiling, payDay, tx: newTx });
    toast(initialDebt > 0 ? `تمت إضافة ${name} مع رصيد سابق ${fmt(initialDebt)} دج` : `تمت إضافة ${name} بنجاح`);
  }
  persist(); closeModal(); renderAll();
}

/* ============ Event wiring ============ */
const A = {
  home: () => { go('quick'); },
  notifs: openNotifsModal,
  openNotifCust: d => {
    closeModal();
    go('ledger');
    setTimeout(() => openDetail(d.cid), 180);
  },
  settings: openSettings,
  closeTop: () => closeModal(),
  confirmOk: () => { const f = CONFIRM; closeModal(); if (f) f(); },
  go: d => go(d.t),
  mode: d => setMode(d.m),
  tap: d => { Q.push(+d.v); renderDisplay(); },
  k: d => calcKey(d.k),
  undo, clear: clearAll, save: saveTicket,
  useLog: d => { const l = CLOG[+d.i]; if (!l) return; C = C0(); C.cur = String(l.res); C.done = true; C.fresh = true; closeModal(); renderDisplay(); },
  assign: d => openAssign(d.id),
  unblockCust: d => {
    if (!requireOwner("رفع الحظر وتغيير الفئات")) return;
    const c = cust(d.id); if (!c) return;
    const availableSegs = getSegOrder().filter(s => s !== 'black');
    openModal(() => `${sheetHead('رفع الحظر عن الزبون', esc(c.name))}
      <div class="sub" style="margin-bottom:12px">اختر الفئة التي تريد نقل الزبون إليها لتمكينه من أخذ الدين مجددًا:</div>
      <div style="display:grid;gap:8px;margin-top:10px">
        ${availableSegs.map(s => `
          <button class="btn block" data-act="confirmUnblock" data-id="${c.id}" data-s="${s}" style="display:flex;align-items:center;justify-content:space-between;height:48px;padding:0 14px;border-radius:12px">
            <span style="font-weight:700;font-size:14px">${SEG[s].icon} ${SEG[s].label}</span>
            <small style="color:var(--mute)">سقف تلقائي: ${fmt(SEG[s].ceiling)} دج</small>
          </button>
        `).join('')}
      </div>
    `);
  },
  confirmUnblock: d => {
    const c = cust(d.id); if (!c) return;
    const s = d.s || 'daily';
    c.seg = s;
    if (c.ceiling === 0) c.ceiling = SEG[s].ceiling || 10000;
    persist();
    closeModal();
    renderAll();
    toast(`تم رفع الحظر عن ${c.name} ونقله إلى «${SEG[s].label}» بنجاح ✅`);
    openDetail(c.id);
  },
  pick: d => {
    const t = S.pending.find(x => x.id === AS.tid), c = cust(d.cid); if (!t || !c) return;
    if (c.seg === 'black') {
      confirmBox({
        title: 'رفع الحظر وترحيل التذكرة',
        msg: `الزبون «${c.name}» في القائمة السوداء حالياً. هل تريد رفع الحظر عنه وترحيل تذكرة #${t.no} (${fmt(t.amount)} دج) لحسابه؟`,
        ok: 'رفع الحظر والترحيل',
        onOk: () => {
          const activeSegs = getSegOrder().filter(s => s !== 'black');
          c.seg = activeSegs[0] || 'daily';
          if (c.ceiling === 0) c.ceiling = SEG[c.seg].ceiling || 10000;
          const noteEl = $('#assignTicketNote');
          const finalNote = (noteEl ? noteEl.value.trim() : '') || t.tag || 'دين معلق';
          t.tag = finalNote;
          addTx(c, 'debt', t.amount, finalNote, { ts: t.ts, tape: t.tape });
          S.pending = S.pending.filter(x => x.id !== t.id);
          persist(); chime(); closeModal(); renderAll();
          toast(`تم رفع الحظر عن ${c.name} وترحيل ${fmt(t.amount)} دج لحسابه بنجاح ✅`);
        }
      });
      return;
    }
    const noteEl = $('#assignTicketNote');
    const finalNote = (noteEl ? noteEl.value.trim() : '') || t.tag || 'دين معلق';
    t.tag = finalNote;
    addTx(c, 'debt', t.amount, finalNote, { ts: t.ts, tape: t.tape });
    S.pending = S.pending.filter(x => x.id !== t.id);
    persist(); chime(); closeModal(); renderAll();
    const over = c.ceiling > 0 && bal(c) > c.ceiling;
    toast(over ? `تم الترحيل إلى ${c.name} — تجاوز السقف` : `تم ترحيل ${fmt(t.amount)} دج إلى ${c.name}`, over ? 'warn' : 'ok');
  },
  editTicketTag: d => {
    const t = S.pending.find(x => x.id === d.id); if (!t) return;
    openModal(() => `${sheetHead('تعديل ملاحظة التذكرة', `تذكرة #${t.no} — <span class="num">${fmt(t.amount)}</span> دج`)}
      <label class="lbl" for="tEditTag">تفاصيل السلعة أو الملاحظة</label>
      <input class="inp" id="tEditTag" type="text" value="${esc(t.tag || '')}" placeholder="مثال: زيت وسكر، أو قهوة وحليب..." autocomplete="off">
      <button class="btn pri block" data-act="saveTicketTag" data-id="${t.id}" style="margin-top:14px">حفظ الملاحظة</button>`,
      { mount: w => { const i = $('#tEditTag', w); if (i) setTimeout(() => i.focus(), 250); } });
  },
  saveTicketTag: d => {
    const t = S.pending.find(x => x.id === d.id); if (!t) return;
    const inp = $('#tEditTag');
    t.tag = inp ? inp.value.trim() : '';
    persist(); closeModal(); renderPending();
    toast('تم حفظ ملاحظة التذكرة');
  },
  delTicket: d => {
    if (!requireOwner("حذف التذاكر")) return;
    const t = S.pending.find(x => x.id === d.id); if (!t) return;
    confirmBox({
      title: 'حذف التذكرة',
      msg: `سيتم نقل تذكرة #${t.no} (${fmt(t.amount)} دج) إلى سلة المهملات.`,
      ok: 'حذف',
      danger: true,
      onOk: () => {
        S.trash = S.trash || [];
        S.trash.unshift({
          id: uid(),
          type: 'ticket',
          data: JSON.parse(JSON.stringify(t)),
          deletedAt: Date.now(),
          title: `تذكرة معلقة #${t.no} (${fmt(t.amount)} دج)`,
          desc: t.tag ? `الوسم: ${t.tag}` : 'بدون وسم'
        });
        S.pending = S.pending.filter(x => x.id !== t.id);
        persist();
        renderAll();
        toast('تم نقل التذكرة إلى سلة المهملات');
      }
    });
  },
  seg: d => { LF.seg = d.s; renderLedger(); },
  open: d => openDetail(d.id),
  pay: d => openMoney(d.id, 'pay'),
  debt: d => openMoney(d.id, 'debt'),
  mmq: d => {
    try {
      const inp = $('#mAmt');
      if (inp) inp.value = d.v;
      updateMM();
    } catch (e) {
      console.warn(e);
    }
  },
  mmok: confirmMoney,
  wa: d => { const c = cust(d.id); if (!c) return; const n = waNumber(c.phone);
    const url = `https://wa.me/${n}?text=${encodeURIComponent(statement(c))}`; window.open(url, '_blank', 'noopener'); },
  copyStmt: d => { const c = cust(d.id); if (!c) return; const s = statement(c);
    const ok = () => toast('تم نسخ كشف الحساب');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(ok, () => toast('تعذّر النسخ', 'err'));
    else { const ta = document.createElement('textarea'); ta.value = s; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('تعذّر النسخ', 'err'); } ta.remove(); } },
  newCust: () => openCustForm(null, (LF && LF.seg !== "all") ? LF.seg : null),
  manageSegsModal: () => {
    if (!requireOwner("إدارة وحذف الفئات")) return;
    openManageSegsModal();
  },
  delSeg: d => {
    if (!requireOwner("حذف الفئات")) return;
    deleteCategory(d.s);
  },
  newSegPrompt: () => {
    if (!requireOwner("إضافة فئات جديدة")) return;
    openNewSegModal();
  },
  saveNewSeg: () => {
    if (!requireOwner("حفظ الفئات")) return;
    saveNewSeg();
  },
  assignCat: d => { AS.activeCat = d.c; $$('#assignCatChips button').forEach(b => b.classList.toggle('on', b.dataset.c === d.c)); fillAssign(); },
  copyMasterCode: () => copyCode('master'),
  copyAssistantCode: () => copyCode('assistant'),
  switchDeviceRole: () => {
    toast('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒', 'err');
    return false;
  },
  resetPassModal: () => {
    if (!requireOwner("إدارة كلمة المرور")) return;
    openResetPassModal();
  },
  verifyMasterPass: verifyMasterPassword,
  editCust: d => {
    if (!requireOwner("تعديل بيانات الزبائن")) return;
    openCustForm(d.id);
  },
  fseg: d => {
    CF.seg = d.s;
    $$('#fSegs .chip').forEach(b => b.classList.toggle('on', b.dataset.s === d.s));
    const pb = $('#fPayBox'); if (pb) pb.hidden = (d.s === 'black');
    if (!CF.touched) $('#fCeil').value = SEG[d.s].ceiling;
    if (d.s === 'black') $('#fCeil').value = 0;
  },
  saveCust,
  delCust: d => {
    if (!requireOwner("حذف الزبائن")) return;
    const c = cust(d.id); if (!c) return;
    const b = bal(c);
    confirmBox({
      title: 'حذف الزبون',
      msg: b > 0 ? `${c.name} عليه ${fmt(b)} دج. سيُنقل حسابه إلى سلة المهملات ويمكنك استرجاعه في أي وقت.` : `سيُنقل حساب ${c.name} إلى سلة المهملات.`,
      ok: 'نقل إلى المهملات',
      danger: true,
      onOk: () => {
        S.trash = S.trash || [];
        S.trash.unshift({
          id: uid(),
          type: 'customer',
          data: JSON.parse(JSON.stringify(c)),
          deletedAt: Date.now(),
          title: c.name,
          desc: b > 0 ? `دين متبقي: ${fmt(b)} دج (${dialect(b)})` : 'حساب بدون ديون'
        });
        S.customers = S.customers.filter(x => x.id !== c.id);
        persist();
        closeModal();
        renderAll();
        toast('تم نقل الزبون إلى سلة المهملات (يمكنك استرجاعه)');
      }
    });
  },
  setStatsFilter: d => { STATS_FILTER = d.f; renderStats(); },
  exportPdf: exportPdfLedger,
  backup,
  unlockApp: verifyUnlock,
  forgotPassPrompt: () => openRecoveryModal(),
  syncOpen: () => openSyncModal(),
  syncPairShow: () => syPairShow(),
  syncPairStart: () => syPairStart(),
  syncScan: () => syScan(),
  syncNow: () => syNow(),
  syncUnpair: d => syUnpair(d.id),
  openRecovery: () => openRecoveryModal(),
  recoverySubmit: () => submitRecovery(),
  copyDevId: async () => { const ok = await agCopyText(String(DEYN_DEV_ID || '')); toast(ok ? 'تم نسخ معرّف الجهاز 📋' : 'تعذّر النسخ — اضغط مطولاً على المعرّف', ok ? 'ok' : 'err'); },
  pwSetSubmit: () => submitSetPassword(),
  ownerSwitchSubmit: () => submitSwitchToOwner(),
  pwLater: () => closeModal(),
  openTrash: openTrashModal,
  restoreTrash: d => {
    S.trash = S.trash || [];
    const idx = S.trash.findIndex(x => x.id === d.id);
    if (idx === -1) return;
    const item = S.trash[idx];
    if (item.type === 'customer') {
      if (!S.customers.some(c => c.id === item.data.id)) {
        S.customers.push(item.data);
      } else {
        item.data.id = uid();
        S.customers.push(item.data);
      }
      toast(`تمت إستعادة الزبون «${item.title}» بنجاح ✅`);
    } else if (item.type === 'ticket') {
      S.pending.unshift(item.data);
      toast(`تمت إستعادة التذكرة بنجاح ✅`);
    } else if (item.type === 'bulk') {
      S.customers = item.data.customers || [];
      S.pending = item.data.pending || [];
      if (item.data.seq) S.seq = item.data.seq;
      toast(`تمت إستعادة جميع البيانات بنجاح ✅`);
    }
    S.trash.splice(idx, 1);
    persist();
    updateTrashBadge();
    renderAll();
    openTrashModal();
  },
  deleteTrashItem: d => {
    if (!requireOwner("الحذف التام")) return;
    confirmBox({
      title: 'حذف تام نهائياً',
      msg: 'سيتم مسح هذا العنصر نهائياً ولن يمكنك استرجاعه أبداً. هل تريد المتابعة؟',
      ok: 'حذف تام',
      danger: true,
      onOk: () => {
        S.trash = S.trash || [];
        S.trash = S.trash.filter(x => x.id !== d.id);
        persist();
        updateTrashBadge();
        renderAll();
        toast('تم الحذف التام نهائياً');
        openTrashModal();
      }
    });
  },
  purgeTrash: () => {
    if (!requireOwner("تفريغ سلة المهملات")) return;
    confirmBox({
      title: 'تفريغ سلة المهملات',
      msg: 'سيتم حذف جميع العناصر الموجودة في سلة المهملات نهائياً وبلا رجعة. هل أنت متأكد؟',
      ok: 'تفريغ نهائي',
      danger: true,
      onOk: () => {
        S.trash = [];
        persist();
        updateTrashBadge();
        renderAll();
        toast('تم تفريغ سلة المهملات نهائياً');
        openTrashModal();
      }
    });
  },
  clearData: () => {
    if (!requireOwner("حذف وتصفير البيانات")) return;
    confirmBox({
    title: 'حذف البيانات',
    msg: 'هل أنت متأكد من حذف جميع البيانات؟ ستُنقل كل الحسابات والتذاكر الحالية إلى سلة المهملات، ويمكنك استرجاعها بضغطة زر إن أردت.',
    ok: 'حذف البيانات',
    danger: true,
    onOk: () => {
      if (S.customers.length > 0 || S.pending.length > 0) {
        S.trash = S.trash || [];
        S.trash.unshift({
          id: uid(),
          type: 'bulk',
          data: {
            customers: JSON.parse(JSON.stringify(S.customers)),
            pending: JSON.parse(JSON.stringify(S.pending)),
            seq: S.seq
          },
          deletedAt: Date.now(),
          title: 'دفتر حسابات مفرغ بالكامل',
          desc: `${S.customers.length} زبائن و ${S.pending.length} تذاكر معلقة`
        });
      }
      S.customers = [];
      S.pending = [];
      S.seq = 1;
      persist();
      Q = []; C = C0(); CSNAP = [];
      stack.slice().forEach(m => closeModal(m));
      renderAll();
      toast('تم حذف البيانات ونقلها لسلة المهملات (يمكنك استرجاعها) ✅');
    }
  });
  },
  wipe: () => { if (!requireOwner('مسح كل البيانات')) return; confirmBox({ title: 'مسح كل البيانات', msg: 'سيتم حذف كل الزبائن والتذاكر والسجلات. لا يمكن التراجع.', ok: 'مسح الكل', danger: true, onOk: () => { S.customers = []; S.pending = []; S.seq = 1; persist(); stack.slice().forEach(m => closeModal(m)); renderAll(); toast('تم مسح البيانات'); } }); }
};
// READ_ONLY (clock policy): only viewing / exporting / password / navigation actions stay available. Default deny, so new actions are blocked automatically.
const READONLY_OK = new Set(['home','notifs','openNotifCust','settings','closeTop','go','open','seg','fseg','setStatsFilter','exportPdf','backup','copyStmt','wa','copyMasterCode','copyAssistantCode','copyDevId','mode','unlockApp','forgotPassPrompt','openRecovery','recoverySubmit','pwSetSubmit','pwLater','verifyMasterPass','openTrash','syncOpen','tap','k','undo','useLog']);
Object.keys(A).forEach(k => { if (READONLY_OK.has(k)) return; const f = A[k]; A[k] = function () { if (typeof deynReadOnly === 'function' && deynReadOnly()) { toast('وضع القراءة فقط: لا يمكن الإضافة أو التعديل أو الحذف حاليًا 🔒', 'err'); return; } return f.apply(this, arguments); }; });
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  const f = A[t.dataset.act]; if (f) f(t.dataset, t, e);
});
const INPUTS = {
  csearch: el => { LF.q = el.value; renderList(); },
  aq: el => { AS.q = el.value; fillAssign(); },
  mm: () => updateMM(),
  fceil: () => { if (CF) CF.touched = true; }
};
document.addEventListener('input', e => { const f = e.target.dataset && INPUTS[e.target.dataset.in]; if (f) f(e.target); });
document.addEventListener('change', e => {
  const gs = e.target.dataset && e.target.dataset.gs;
  if (gs && deynReadOnly()) { e.target.checked = !e.target.checked; return toast('وضع القراءة فقط 🔒', 'err'); }
  if (gs) { if (!S.guaranteed) S.guaranteed = {}; S.guaranteed[gs] = e.target.checked; persist(); renderAll(); return; }
  const k = e.target.dataset && e.target.dataset.ch; if (!k) return;
  if (k === 'appLockEnabled') {
    if (isWorkerDevice()) { e.target.checked = !!S.settings.appLockEnabled; return toast('عذراً، قفل التطبيق خاص بصاحب المحل فقط 🔒', 'err'); }
    if (e.target.checked && !(S.auth && S.auth.pw)) { e.target.checked = false; toast('عيّن كلمة مرور المالك أولاً ثم فعّل القفل', 'err'); return openSetPasswordModal(false); }
  }
  S.settings[k] = e.target.checked; persist();
  if (k === 'dialect') renderAll();
});



/* ============ Device Role & Worker Security ============ */
function isWorkerDevice() {
  if (window.DEYN_LIC && (window.DEYN_LIC.role === 'M' || window.DEYN_LIC.role === 'W')) return window.DEYN_LIC.role === 'W';
  return !!(S && S.auth && S.auth.licRole === 'W');
}
function requireOwner(actionName) {
  if (isWorkerDevice()) {
    toast(`عذراً، ${actionName || 'هذه العملية'} خاصة بصاحب المحل فقط 🔒`, 'err');
    return false;
  }
  return true;
}

/* ============ Security & Password System ============ */
function copyCode(type) {
  const code = (type === 'assistant') ? 
    ((S.auth && S.auth.assistantCode) || 'DEYN-S-2026-9923-B4') : 
    ((S.auth && S.auth.masterCode) || 'DEYN-M-2026-8841-A9');
  const label = (type === 'assistant') ? 'كود هاتف العامل' : 'كود هاتف صاحب المحل (الرئيسي)';
  
  const ok = () => toast(`تم نسخ ${label} بنجاح 📋`);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(ok, () => fallbackCopy(code, label));
  } else {
    fallbackCopy(code, label);
  }
}

function fallbackCopy(text, label) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { 
    document.execCommand('copy'); 
    toast(`تم نسخ ${label} بنجاح 📋`); 
  } catch (e) { 
    toast('تعذّر النسخ', 'err'); 
  }
  ta.remove();
}


/* ============ Owner password (PBKDF2-SHA256 + per-password salt) & App Lock ============
   - No factory / master password exists. Nothing in the app can bypass the owner password.
   - The old plaintext S.auth.masterPass is migrated to a salted PBKDF2 hash on first run, then deleted.
   - Users who never changed the old built-in default are asked to set a new password (they keep full data access meanwhile).
   - Forgotten password: signed, device-bound, one-time Ed25519 recovery code (see deynVerifyRecovery). */
const PW_ITER = 310000, PW_MIN_LEN = 8;
// SHA-256 of the retired built-in default. Used ONLY to detect "never changed" during migration; it is not an accepted credential.
const LEGACY_DEFAULT_SHA256 = '4e3d2ff3ce5293dd81b161e13868d9b27d6b7b05a3b46fffdb1523c451f4ad94';
let PW_CTX = {}, PW_BUSY = false;
// A closing dialog stays in the DOM for ~220ms; always read the newest field with a given id.
const lastById = id => { const l = document.querySelectorAll('#' + id); return l.length ? l[l.length - 1] : null; };
const pwB64 = u8 => { let t = ''; for (let i = 0; i < u8.length; i++) t += String.fromCharCode(u8[i]); return btoa(t); };
const pwUnb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
async function pwSha256Hex(text) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, '0')).join('');
}
async function pwDerive(pass, salt, iter) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(pass).normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, k, 256));
}
async function pwMake(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pwDerive(pass, salt, PW_ITER);
  return { v: 1, alg: 'PBKDF2-SHA256', iter: PW_ITER, salt: pwB64(salt), hash: pwB64(hash) };
}
function ctEq(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; }
async function pwCheck(pass, rec) {
  try {
    if (!rec || rec.v !== 1 || rec.alg !== 'PBKDF2-SHA256' || !Number.isInteger(rec.iter) || rec.iter < 100000 || rec.iter > 2000000) return false;
    return ctEq(await pwDerive(pass, pwUnb64(rec.salt), rec.iter), pwUnb64(rec.hash));
  } catch (e) { return false; }
}
function pwThrottleLeft() { const f = S.auth && S.auth.pwFail; return f && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0; }
async function authMigrate() {
  if (!S.auth) S.auth = {};
  const a = S.auth;
  if (a.pw) {
    let ch = false;
    if ('masterPass' in a) { delete a.masterPass; ch = true; }
    if (a.pwMustSet) { delete a.pwMustSet; ch = true; }
    return ch;
  }
  if ('masterPass' in a) {
    const legacy = a.masterPass;
    if (typeof legacy !== 'string' || !legacy || (await pwSha256Hex(legacy)) === LEGACY_DEFAULT_SHA256) {
      delete a.masterPass; a.pwMustSet = true; return true;
    }
    a.pw = await pwMake(legacy.trim()); // custom password chosen by the owner: keep it working, now hashed
    delete a.masterPass; delete a.pwMustSet; a.pwMigrated = Date.now();
    return true;
  }
  if (!a.pwMustSet) { a.pwMustSet = true; return true; }
  return false;
}
async function authVerify(pass) {
  if (!S.auth) S.auth = {};
  const wait = pwThrottleLeft();
  if (wait) return { ok: false, wait };
  if (!S.auth.pw && 'masterPass' in S.auth) { try { if (await authMigrate()) persist(); } catch (e) {} }
  const a = S.auth;
  const ok = !!a.pw && await pwCheck(String(pass || '').trim(), a.pw);
  if (ok) { if (a.pwFail) { delete a.pwFail; persist(); } return { ok: true }; }
  const f = a.pwFail || { n: 0, until: 0 };
  f.n += 1; if (f.n >= 5) f.until = Date.now() + Math.min(600, 30 * (f.n - 4)) * 1000;
  a.pwFail = f; persist();
  return { ok: false, wait: pwThrottleLeft() };
}
const pwFailMsg = r => r.wait ? `محاولات كثيرة خاطئة. انتظر ${r.wait} ثانية ⏳` : 'كلمة المرور غير صحيحة ❌';
function ensurePasswordSet() {
  if (S && S.auth && S.auth.pwMustSet && !S.auth.pw && !isWorkerDevice() && !stack.length) setTimeout(() => openSetPasswordModal(true, false), 450);
}
function checkAppLock() {
  const overlay = $('#appLockOverlay');
  if (!overlay) return;
  if (S && S.settings && S.settings.appLockEnabled && S.auth && S.auth.pw) {
    overlay.style.display = 'flex';
    const inp = $('#appLockPassInput');
    if (inp) { inp.value = ''; setTimeout(() => inp.focus(), 200); }
  } else {
    overlay.style.display = 'none';
  }
}
async function verifyUnlock() {
  const inp = $('#appLockPassInput');
  if (!inp || PW_BUSY) return;
  PW_BUSY = true;
  try {
    const r = await authVerify(inp.value);
    if (r.ok) {
      $('#appLockOverlay').style.display = 'none';
      chime();
      toast('مرحباً بك مجدداً في DEYN 🔓');
    } else {
      toast(pwFailMsg(r), 'err');
      inp.style.borderColor = 'var(--danger)';
      setTimeout(() => inp.style.borderColor = 'rgba(255,255,255,0.25)', 1500);
    }
  } finally { PW_BUSY = false; }
}
function openSetPasswordModal(initial, viaRecovery) {
  const hasPw = !!(S.auth && S.auth.pw) && !viaRecovery;
  PW_CTX = { hasPw, viaRecovery: !!viaRecovery };
  openModal(() => `${sheetHead(hasPw ? 'تغيير كلمة المرور' : 'تعيين كلمة مرور المالك')}
    <div class="sub">${hasPw ? 'أدخل كلمة المرور الحالية ثم الجديدة.' : 'كلمة المرور تحمي وضع المالك وقفل التطبيق. لا توجد كلمة مرور افتراضية ولا يمكن لأحد تجاوزها.'}</div>
    ${hasPw ? `<label class="lbl" for="pwCur">كلمة المرور الحالية *</label><input class="inp" id="pwCur" type="password" autocomplete="off">` : ''}
    <label class="lbl" for="pwNew">كلمة المرور الجديدة * (${PW_MIN_LEN} أحرف أو أرقام على الأقل)</label>
    <input class="inp" id="pwNew" type="password" autocomplete="off">
    <label class="lbl" for="pwNew2">تأكيد كلمة المرور *</label>
    <input class="inp" id="pwNew2" type="password" autocomplete="off">
    <button class="btn pri block" data-act="pwSetSubmit" data-primary style="margin-top:16px">حفظ كلمة المرور</button>
    ${initial ? '<button type="button" class="btn block" data-act="pwLater" style="margin-top:8px">لاحقاً</button>' : ''}
    ${hasPw ? '<button type="button" data-act="openRecovery" style="width:100%;background:transparent;border:none;color:#64748b;font-size:12px;margin-top:12px;cursor:pointer;text-decoration:underline">نسيت كلمة المرور؟ استخدم كود الاسترداد</button>' : ''}`);
}
function openResetPassModal() { openSetPasswordModal(false, false); }
async function submitSetPassword() {
  if (PW_BUSY) return;
  const cur = lastById('pwCur'), n1 = lastById('pwNew'), n2 = lastById('pwNew2');
  if (!n1 || !n2) return;
  PW_BUSY = true;
  try {
    const ctx = PW_CTX || {};
    if (!ctx.viaRecovery && isWorkerDevice()) return requireOwner('إدارة كلمة المرور');
    if (ctx.hasPw) {
      const r = await authVerify(cur ? cur.value : '');
      if (!r.ok) return toast(pwFailMsg(r), 'err');
    }
    const pass = n1.value.trim();
    if (pass.length < PW_MIN_LEN) return toast(`كلمة المرور الجديدة يجب أن تتكون من ${PW_MIN_LEN} أحرف أو أرقام على الأقل`, 'err');
    if (pass !== n2.value.trim()) return toast('تأكيد كلمة المرور غير مطابق', 'err');
    if (!S.auth) S.auth = {};
    S.auth.pw = await pwMake(pass);
    delete S.auth.pwMustSet; delete S.auth.masterPass; delete S.auth.pwFail;
    if (!persist()) return;
    closeModal(); chime();
    toast('تم تعيين كلمة المرور الجديدة بنجاح 🔒');
  } catch (e) { toast('تعذّر حفظ كلمة المرور بأمان', 'err'); }
  finally { PW_BUSY = false; }
}
function verifyMasterPassword() { return submitSetPassword(); }
function openSwitchToOwnerModal() {
  toast('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒', 'err');
  return false;
}
async function submitSwitchToOwner() {
  toast('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تحويله يدوياً 🔒', 'err');
  return false;
}

/* ---- Signed recovery code: DEYNR1-<body>.<sig>  (Ed25519 over "DEYN-RECOVERY-V1\n" + body) ----
   Bound to the full device ID, expires, single use (nonce kept in secure storage).
   Only resets the owner password: it cannot change the licence, expiry, role or any data. */
const DEYN_REC_PREFIX = 'DEYN-RECOVERY-V1\n';
async function deynVerifyRecovery(code) {
  const bad = msg => ({ ok: false, msg });
  try {
    if (!window.crypto || !crypto.subtle) return bad('هذا الجهاز لا يدعم التحقق الآمن');
    const m = /^DEYNR1-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(code || '').replace(/[\s\u200e\u200f\u202a-\u202e]+/g, ''));
    if (!m) return bad('كود الاسترداد غير صالح');
    const body = deynUnb64u(m[1]), sig = deynUnb64u(m[2]);
    if (sig.length !== 64) return bad('كود الاسترداد غير صالح');
    const raw = new TextDecoder().decode(body), p = JSON.parse(raw);
    if (!p || typeof p !== 'object' || Array.isArray(p) || Object.keys(p).sort().join(',') !== 'd,exp,iat,k,n,v') return bad('كود الاسترداد غير صالح');
    if (p.v !== 1 || p.k !== 'rec' || !/^[0-9a-f]{32}$/.test(p.d) || !Number.isSafeInteger(p.iat) || !Number.isSafeInteger(p.exp) || p.exp <= p.iat || p.exp - p.iat > 14 * 864e5 || !/^[A-Za-z0-9_-]{22}$/.test(p.n)) return bad('كود الاسترداد غير صالح');
    if (JSON.stringify({ v: p.v, k: p.k, d: p.d, iat: p.iat, exp: p.exp, n: p.n }) !== raw) return bad('كود الاسترداد غير صالح');
    const keyBytes = Uint8Array.from(atob(DEYN_PUBLIC_KEY), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'Ed25519' }, false, ['verify']);
    const msg = new Uint8Array([...new TextEncoder().encode(DEYN_REC_PREFIX), ...body]);
    if (!await crypto.subtle.verify('Ed25519', key, sig, msg)) return bad('كود الاسترداد غير صالح');
    if (p.d !== DEYN_DEV_ID) return bad('هذا الكود مخصص لجهاز آخر');
    const now = Math.max(Date.now(), DEYN_LAST || 0);
    if (now >= p.exp) return bad('انتهت صلاحية كود الاسترداد');
    if (p.iat > now + DEYN_CLOCK_TOL) return bad('كود الاسترداد غير صالح');
    return { ok: true, nonce: p.n };
  } catch (e) { return bad('كود الاسترداد غير صالح'); }
}
function openRecoveryModal() {
  const rm = openModal(() => `${sheetHead('استرجاع كلمة المرور')}
    <div class="sub">أرسل معرّف هذا الجهاز إلى الدعم الفني ليصدر لك كود استرداد موقّع. الكود صالح لهذا الجهاز فقط ولمرة واحدة، ولا يغيّر ترخيصك ولا دورك ولا بياناتك.</div>
    <label class="lbl">معرّف الجهاز</label>
    <div class="num" style="direction:ltr;word-break:break-all;overflow-wrap:anywhere;font-size:13px;background:#f1f5f9;border-radius:10px;padding:10px;user-select:all">${esc(String(DEYN_DEV_ID || ''))}</div>
    <button type="button" class="btn sm" data-act="copyDevId" style="margin-top:8px">نسخ المعرّف</button>
    <label class="lbl" for="recCode" style="margin-top:12px">كود الاسترداد *</label>
    <input class="inp" id="recCode" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" style="direction:ltr;text-align:left" placeholder="DEYNR1-...">
    <button class="btn pri block" data-act="recoverySubmit" data-primary style="margin-top:16px">تحقق وتعيين كلمة مرور جديدة</button>`);
  rm.wrap.style.zIndex = '100001'; // must sit above the lock overlay (z-index 99999) it is opened from
}
async function submitRecovery() {
  const inp = lastById('recCode');
  if (!inp || PW_BUSY) return;
  PW_BUSY = true;
  try {
    const p = await deynVerifyRecovery(inp.value);
    if (!p.ok) return toast(p.msg, 'err');
    let used;
    try { used = JSON.parse((await DeynStore.get('rused')) || '[]'); if (!Array.isArray(used)) throw 0; }
    catch (e) { return toast('تعذّرت قراءة سجل الاسترداد بأمان', 'err'); }
    if (used.indexOf(p.nonce) >= 0) return toast('هذا الكود سبق استعماله', 'err');
    used.push(p.nonce);
    try { await DeynStore.set('rused', JSON.stringify(used.slice(-200))); }
    catch (e) { return toast('تعذّر حفظ سجل الاسترداد — لم يُستعمل الكود', 'err'); }
    if (!S.auth) S.auth = {};
    delete S.auth.pw; delete S.auth.masterPass; delete S.auth.pwFail; S.auth.pwMustSet = true;
    if (!persist()) return;
    const ov = $('#appLockOverlay'); if (ov) ov.style.display = 'none';
    stack.slice().forEach(m => closeModal(m));
    setTimeout(() => openSetPasswordModal(true, true), 250);
    toast('تم التحقق من كود الاسترداد ✅ عيّن كلمة مرور جديدة');
  } finally { PW_BUSY = false; }
}


/* ============ Smart Alerts & Notification Bell ============ */
function getAlertedCustomers() {
  if (!S || !S.customers) return [];
  const list = [];
  S.customers.forEach(c => {
    const b = bal(c);
    if (b <= 0) return;
    const pi = payInfo(c);
    const isOverdue = pi && pi.status === 'overdue';
    const isToday = pi && pi.status === 'today';
    const isOverCeil = c.ceiling > 0 && b > c.ceiling;

    if (isOverdue || isToday || isOverCeil) {
      list.push({
        customer: c,
        balance: b,
        isOverdue,
        isToday,
        isOverCeil,
        pi,
        urgency: isOverdue ? 3 : (isOverCeil ? 2 : 1)
      });
    }
  });

  list.sort((a, b) => b.urgency - a.urgency || b.balance - a.balance);
  return list;
}


function updateTrashBadge() {
  const count = (S && S.trash) ? S.trash.length : 0;
  $$('#trashCountBadge').forEach(el => {
    el.textContent = count;
  });
}

function updateBellBadge() {
  const badge = $('#bellBadge');
  if (!badge) return;
  const alerts = getAlertedCustomers();
  const count = alerts.length;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function openNotifsModal() {
  const alerts = getAlertedCustomers();
  openModal(() => `${sheetHead('التنبيهات والمواعيد', alerts.length ? `<span class="num">${alerts.length}</span> تنبيه نشط` : 'لا توجد تنبيهات')}
    ${!alerts.length ? `
      <div class="empty-st" style="padding:32px 16px">
        <div style="display:flex;justify-content:center;margin-bottom:8px">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="#34d399">
            <path d="M12 2a6 6 0 0 0-6 6c0 5.25-2.25 7-2.25 7h16.5S18 13.25 18 8a6 6 0 0 0-6-6zm-2 19a2 2 0 0 0 4 0h-4z"/>
          </svg>
        </div>
        <b style="font-size:16px;color:var(--ink);display:block;margin-bottom:6px">لا توجد تنبيهات حالياً</b>
        <span style="color:var(--mute);font-size:13px">جميع الزبائن ملتزمون بمواعيد السداد وسقوف الديون المحددة.</span>
      </div>
    ` : `
      <div style="font-size:12px;color:var(--mute);margin-bottom:10px">
        اضغط على أي زبون للانتقال مباشرة إلى ملفه وكشف حسابه:
      </div>
      <div style="max-height:60vh;overflow-y:auto;padding-bottom:12px">
        ${alerts.map(item => {
          const c = item.customer;
          const b = item.balance;
          const badges = [];

          if (item.isOverdue) {
            badges.push(`<span class="nt-b d">⚠️ متأخر بـ ${item.pi.diff} ${item.pi.diff <= 2 ? (item.pi.diff === 1 ? 'يوم' : 'يومين') : 'أيام'} (موعده يوم ${item.pi.day})</span>`);
          } else if (item.isToday) {
            badges.push(`<span class="nt-b w">🕒 موعد السداد اليوم (يوم ${item.pi.day})</span>`);
          }

          if (item.isOverCeil) {
            badges.push(`<span class="nt-b o">🚨 تجاوز سقف الدين (${fmt(b)} / ${fmt(c.ceiling)} دج)</span>`);
          }

          return `
            <button class="nt" data-act="openNotifCust" data-cid="${c.id}">
              <div class="av ${item.isOverdue ? 'd' : (item.isOverCeil ? 'o' : '')}">${esc(c.name.trim()[0])}</div>
              <div class="nt-m">
                <div class="nt-r"><b>${esc(c.name)}</b><span class="num">${fmt(b)} دج</span></div>
                <div class="nt-bd">${badges.join('')}</div>
              </div>
              <span class="nt-go">‹</span>
            </button>
          `;
        }).join('')}
      </div>
    `}
  `);
}

function checkSmartNotifs() {
  updateBellBadge();
}


/* ===== DEYN v3 Ed25519 licensing ===== */
var DEYN_PUBLIC_KEY = 'uM8GgGamY++GH9e2PTTkluRlzqEVdbnj+MLh4uFYr/Y=';
var DeynStore = (function () {
  function plug(n) { try { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[n] || null; } catch (e) { return null; } }
  return {
    plug: plug,
    get: async function (key) { var p=plug('SecureStoragePlugin'); if(!p || !p.get) throw new Error('التخزين الآمن غير متاح'); try { var r=await p.get({key:'deyn_'+key}); return r && r.value != null ? String(r.value) : null; } catch(e) { return null; } },
    set: async function (key,val) { var p=plug('SecureStoragePlugin'); if(!p || !p.set) throw new Error('التخزين الآمن غير متاح'); await p.set({key:'deyn_'+key,value:String(val)}); var r=await p.get({key:'deyn_'+key}); if(!r || String(r.value)!==String(val)) throw new Error('تعذّر التحقق من حفظ بيانات الترخيص'); }
  };
})();
var DEYN_DEV_ID=null, DEYN_LIC=null, DEYN_STARTED=false, DEYN_START_FN=null;
window.DEYN_LIC=null;
function deynB64u(bytes){var s='';for(var i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return btoa(s).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');}
function deynUnb64u(s){if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s))throw Error('base64');var b=s.replace(/-/g,'+').replace(/_/g,'/');b+='='.repeat((4-b.length%4)%4);var x=atob(b),a=new Uint8Array(x.length);for(var i=0;i<x.length;i++)a[i]=x.charCodeAt(i);if(deynB64u(a)!==s)throw Error('canonical');return a;}
function deynCanonical(p){return JSON.stringify({v:p.v,d:p.d,t:p.t,r:p.r,exp:p.exp,n:p.n});}
function deynValidPayload(p){if(!p||typeof p!=='object'||Array.isArray(p))return false;var k=Object.keys(p).sort().join(',');if(k!=='d,exp,n,r,t,v'||p.v!==3||!/^[0-9a-f]{32}$/.test(p.d)||!['1Y','2Y','LT'].includes(p.t)||!['M','W'].includes(p.r))return false;if(p.t==='LT'?p.exp!==null:(!Number.isSafeInteger(p.exp)||p.exp<=0))return false;return typeof p.n==='string'&&/^[A-Za-z0-9_-]{22}$/.test(p.n);}
async function deynVerifyCode(code,deviceId){try{if(!window.crypto||!crypto.subtle||!crypto.getRandomValues)return null;var m=/^DEYN3-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(code||'').replace(/[\s\u200e\u200f\u202a-\u202e]+/g,''));if(!m)return null;var body=deynUnb64u(m[1]),sig=deynUnb64u(m[2]);if(sig.length!==64)return null;var raw=new TextDecoder().decode(body),p=JSON.parse(raw);if(!deynValidPayload(p)||deynCanonical(p)!==raw||p.d!==deviceId)return null;var keyBytes=Uint8Array.from(atob(DEYN_PUBLIC_KEY),function(c){return c.charCodeAt(0);});var key=await crypto.subtle.importKey('raw',keyBytes,{name:'Ed25519'},false,['verify']);if(!await crypto.subtle.verify('Ed25519',key,sig,body))return null;if(p.t!=='LT'&&deynNow()>=p.exp)return null;return {code:String(code).trim(),role:p.r,tier:p.t,exp:p.exp,nonce:p.n};}catch(e){return null;}}
async function deynGetDeviceId(){if(!crypto.subtle||!crypto.getRandomValues)throw Error('هذا الجهاز لا يدعم التحقق الآمن من Ed25519');var saved=await DeynStore.get('did');if(saved&&/^[0-9a-f]{32}$/.test(saved))return saved;var dev=DeynStore.plug('Device'),id='';if(dev&&dev.getId){try{var r=await dev.getId(),nativeId=r&&(r.identifier||r.uuid);if(nativeId){var hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(nativeId)));id=Array.from(new Uint8Array(hash).slice(0,16),function(b){return b.toString(16).padStart(2,'0');}).join('');}}catch(e){}}
 if(!id){var b=new Uint8Array(16);crypto.getRandomValues(b);id=Array.from(b,function(x){return x.toString(16).padStart(2,'0');}).join('');}await DeynStore.set('did',id);return id;}
async function agCopyText(text){var cp=DeynStore.plug('Clipboard');if(cp){try{await cp.write({string:text});return true;}catch(e){}}try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);return true;}}catch(e){}try{var ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,text.length);var ok=document.execCommand('copy');ta.remove();return ok;}catch(e){return false;}}
async function agReadText(){var cp=DeynStore.plug('Clipboard');if(cp){try{var r=await cp.read();if(r&&r.value)return String(r.value);}catch(e){}}try{if(navigator.clipboard&&navigator.clipboard.readText)return await navigator.clipboard.readText();}catch(e){}return null;}
var agToastT;function agToast(msg){var t=document.getElementById('agToast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(agToastT);agToastT=setTimeout(function(){t.classList.remove('show');},2200);}
var DEYN_LAST=0,DEYN_CLOCK_LOCKED=false,DEYN_CLOCK_TOL=120000;
/* ---- Clock protection. Policy agreed with the owner: 3 warnings -> 48h grace -> READ_ONLY (data is never deleted).
   Enforcement of READ_ONLY is OFF until the signed trusted-time service is deployed (enforce:false) so a wrong phone clock can never lock a shop out
   with no way to fix it. Licence expiry always uses a forward-only clock (deynNow). */
var DEYN_TIME_CFG={url:'',pub:'',enforce:false};
var DEYN_TP={state:null,status:'OK',graceLeftMs:null,warningNo:0}, DEYN_TP_SAVED=0, DEYN_TRUSTED=null;
// [EMBEDDED FROM trusted-time/time-policy.js - kept identical by tests] Clock-tamper policy state machine (pure, testable). Agreed stages: warning 1, warning 2, warning 3, then a 48h grace, then licence policy.
// It never deletes data. What "licence policy" means after grace is an OPEN DECISION (default here: READ_ONLY = view/export only).
const TOLERANCE_MS = 5 * 60 * 1000, GRACE_MS = 48 * 3600 * 1000;
function initialState() { return { lastSeen: 0, warnings: 0, episode: false, graceStart: null, trustedOffset: null }; }
// obs: { now: local ms, trusted: ms|null (verified signed time, or null if offline/failed) }
function evaluate(prev, obs, opts = {}) {
  const tol = opts.tolerance ?? TOLERANCE_MS, grace = opts.grace ?? GRACE_MS, afterGrace = opts.afterGrace ?? 'READ_ONLY';
  const s = { ...prev };
  const ref = obs.trusted ?? Math.max(obs.now, s.lastSeen);                    // best available "real" time
  const rolledBack = obs.now < s.lastSeen - tol;                                // local clock went backwards
  const skewed = obs.trusted != null && Math.abs(obs.now - obs.trusted) > tol;  // disagrees with signed time
  const violation = obs.trusted != null ? skewed : rolledBack;   // when signed time is available it is authoritative
  const consistentVerified = obs.trusted != null && !skewed;
  let status = 'OK', warningNo = 0;
  if (violation) {
    if (!s.episode) {
      s.episode = true;
      if (s.warnings < 3) { s.warnings += 1; warningNo = s.warnings; if (s.warnings === 3) s.graceStart = ref; }
      else s.graceStart = ref;          // warnings already used up: every new episode goes straight to a fresh 48h grace
    }
    if (s.graceStart != null) status = ref - s.graceStart >= grace ? afterGrace : 'GRACE';
    else status = 'WARN';
  } else if (consistentVerified) {   // only a verified, consistent signed time clears an episode
    s.episode = false; s.graceStart = null; status = 'OK';
  } else if (s.episode) {            // offline: cannot prove the clock is fixed
    status = s.graceStart != null ? (ref - s.graceStart >= grace ? afterGrace : 'GRACE') : 'WARN';
  }
  // A verified signed time is authoritative: it may also repair a lastSeen that was pushed into the future by a wrong clock.
  s.lastSeen = (obs.trusted != null && !skewed) ? obs.trusted : Math.max(s.lastSeen, obs.now);
  const graceLeftMs = s.graceStart != null ? Math.max(0, grace - (ref - s.graceStart)) : null;
  return { state: s, status, warningNo, graceLeftMs };
}

// Verification of a signed time response (to be embedded in the app). Pure functions, no network.
// The app ships ONLY the time PUBLIC key (separate from the licence key).
const TIME_PREFIX = 'DEYN-TIME-V1\n';
const timeUnb64u = s => { if (typeof s !== 'string' || !/^[A-Za-z0-9_-]+$/.test(s)) throw new Error('b64'); const b = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4); return Uint8Array.from(atob(b), c => c.charCodeAt(0)); };
const MAX_RTT_MS = 10000;
function timeNewNonce() { const b = new Uint8Array(16); crypto.getRandomValues(b); let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
// resp = {b,s}; ctx = {pubKeyB64, nonce, deviceId, rttMs}. rttMs is measured with a MONOTONIC clock (performance.now), not Date.
async function deynVerifyTimeResponse(resp, ctx) {
  const bad = reason => ({ ok: false, reason });
  try {
    if (!resp || typeof resp.b !== 'string' || typeof resp.s !== 'string') return bad('shape');
    if (!(ctx.rttMs >= 0) || ctx.rttMs > MAX_RTT_MS) return bad('rtt');
    const body = timeUnb64u(resp.b), sig = timeUnb64u(resp.s);
    if (sig.length !== 64) return bad('sig_len');
    const key = await crypto.subtle.importKey('raw', Uint8Array.from(atob(ctx.pubKeyB64), c => c.charCodeAt(0)), { name: 'Ed25519' }, false, ['verify']);
    const msg = new Uint8Array([...new TextEncoder().encode(TIME_PREFIX), ...body]);
    if (!await crypto.subtle.verify('Ed25519', key, sig, msg)) return bad('signature');
    const raw = new TextDecoder().decode(body), p = JSON.parse(raw);
    if (Object.keys(p).sort().join(',') !== 'd,k,n,t,v' || p.v !== 1 || p.k !== 'time' || !Number.isSafeInteger(p.t)) return bad('payload');
    if (JSON.stringify({ v: p.v, k: p.k, t: p.t, d: p.d, n: p.n }) !== raw) return bad('canonical');
    if (p.n !== ctx.nonce) return bad('nonce');          // replayed / swapped response
    if (p.d !== ctx.deviceId) return bad('device');
    return { ok: true, t: p.t };
  } catch (e) { return bad('error'); }
}

function deynNow(){return Math.max(Date.now(),DEYN_TP.state?DEYN_TP.state.lastSeen:0);}
function deynReadOnly(){return !!DEYN_TIME_CFG.enforce&&DEYN_TP.status==='READ_ONLY';}
function deynBanner(txt,kind){var el=document.getElementById('deynTimeBanner');if(!txt){if(el)el.remove();return;}if(!el){el=document.createElement('div');el.id='deynTimeBanner';el.setAttribute('role','status');document.body.appendChild(el);}el.style.cssText='position:fixed;top:0;left:0;right:0;z-index:100003;padding:6px 10px;font:700 12px/1.6 system-ui,sans-serif;text-align:center;direction:rtl;color:#fff;background:'+(kind==='ro'?'#b91c1c':'#b45309');el.textContent=txt;}
function deynTpUi(res){
  var n=res.warningNo||DEYN_TP.state.warnings;
  if(res.status==='WARN')deynBanner('⚠️ تحذير '+n+' من 3: تم اكتشاف تغيير غير طبيعي في ساعة الجهاز. صحّح التاريخ والوقت.','w');
  else if(res.status==='GRACE')deynBanner('⚠️ مهلة التصحيح: متبقٍ نحو '+Math.max(1,Math.ceil((res.graceLeftMs||0)/3600000))+' ساعة. صحّح ساعة الجهاز أو اتصل بالإنترنت.','w');
  else if(res.status==='READ_ONLY')deynBanner(DEYN_TIME_CFG.enforce?'🔒 وضع القراءة فقط: انتهت المهلة. يمكنك عرض البيانات وتصدير نسخة احتياطية. صحّح الساعة واتصل بالإنترنت.':'⚠️ انتهت مهلة تصحيح الساعة (لم يُفعَّل القفل بعد). صحّح تاريخ الجهاز.','ro');
  else deynBanner('');
}
function deynTrustedObs(){return DEYN_TRUSTED?DEYN_TRUSTED.t+(performance.now()-DEYN_TRUSTED.mono):null;}
async function deynFetchTrustedTime(){
  if(!DEYN_TIME_CFG.url||!DEYN_TIME_CFG.pub||!DEYN_DEV_ID)return false;
  try{var n=timeNewNonce(),t0=performance.now();
    var r=await fetch(DEYN_TIME_CFG.url.replace(/\/$/,'')+'/v1/time',{method:'POST',body:JSON.stringify({n:n,d:DEYN_DEV_ID}),headers:{'content-type':'application/json'},cache:'no-store'});
    var j=await r.json(),rtt=performance.now()-t0;
    var v=await deynVerifyTimeResponse(j,{pubKeyB64:DEYN_TIME_CFG.pub,nonce:n,deviceId:DEYN_DEV_ID,rttMs:rtt});
    if(!v.ok){console.warn('DEYN trusted time rejected:',v.reason);return false;}
    DEYN_TRUSTED={t:v.t+rtt/2,mono:performance.now()};deynClockTick(true);return true;
  }catch(e){console.warn('DEYN trusted time unavailable (offline is not a violation):',e&&e.message);return false;}
}
async function deynClockInit(){
  var st=null;try{var raw=await DeynStore.get('tp');st=raw?JSON.parse(raw):null;}catch(e){st=null;}
  if(!st||typeof st.lastSeen!=='number'||!isFinite(st.lastSeen)){st=initialState();var v=parseInt(await DeynStore.get('lts'),10);if(isFinite(v))st.lastSeen=v;}
  DEYN_TP.state=st;DEYN_LAST=st.lastSeen;
  await deynFetchTrustedTime();
  deynClockTick(true);
  setInterval(function(){deynClockTick(false);},4000);
  setInterval(function(){deynFetchTrustedTime();},6*3600*1000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden){deynFetchTrustedTime();deynClockTick(false);}});
  window.addEventListener('focus',function(){deynClockTick(false);});
}
function deynClockTick(force){
  if(!DEYN_TP.state)return true;
  var now=Date.now(),res=evaluate(DEYN_TP.state,{now:now,trusted:deynTrustedObs()});
  var changed=res.state.warnings!==DEYN_TP.state.warnings||res.state.episode!==DEYN_TP.state.episode||res.state.graceStart!==DEYN_TP.state.graceStart;
  DEYN_TP.state=res.state;DEYN_TP.status=res.status;DEYN_TP.graceLeftMs=res.graceLeftMs;DEYN_TP.warningNo=res.warningNo||DEYN_TP.warningNo;DEYN_LAST=res.state.lastSeen;
  deynTpUi(res);
  if(force||changed||DEYN_LAST-DEYN_TP_SAVED>=15000){DEYN_TP_SAVED=DEYN_LAST;DeynStore.set('tp',JSON.stringify(res.state)).catch(function(e){console.error('DEYN time state save failed',e);deynBanner('⚠️ تعذّر حفظ حالة الوقت بأمان','w');});}
  var nowF=deynNow();
  if(DEYN_LIC&&DEYN_LIC.exp&&nowF>=DEYN_LIC.exp){DEYN_LIC=null;window.DEYN_LIC=null;agShowGate('انتهت مدة الترخيص — أدخل كود تفعيل جديد');}
  return true;
}
async function deynLoadLicense(){var raw=await DeynStore.get('lic');if(!raw)return null;try{var rec=JSON.parse(raw),p=await deynVerifyCode(rec.code,DEYN_DEV_ID);if(!p)return null;return p;}catch(e){return null;}}
function agShowGate(errMsg){var g=document.getElementById('actGate');if(!g)return;g.classList.add('show');document.body.classList.remove('lic-ok');var e=document.getElementById('agErr');if(errMsg){e.textContent=errMsg;e.classList.add('show');}else e.classList.remove('show');}
function agStartApp(){document.getElementById('actGate').classList.remove('show');document.body.classList.add('lic-ok');if(!DEYN_STARTED){DEYN_STARTED=true;if(DEYN_START_FN)DEYN_START_FN();}}
async function agActivate(){var btn=document.getElementById('agGo'),inp=document.getElementById('agCode'),err=document.getElementById('agErr');err.classList.remove('show');if(DEYN_CLOCK_LOCKED){err.textContent='تم إيقاف التفعيل بسبب تغيير غير طبيعي في ساعة الجهاز';err.classList.add('show');return;}btn.disabled=true;try{var p=await deynVerifyCode(inp.value,DEYN_DEV_ID);if(!p){err.textContent='كود التفعيل غير صالح لهذا الجهاز أو انتهت صلاحيته';err.classList.add('show');return;}var cur=await deynLoadLicense(),used=[];try{used=JSON.parse((await DeynStore.get('used'))||'[]');}catch(e){throw Error('تعذّرت قراءة سجل التفعيل بأمان');}if(!Array.isArray(used))throw Error('سجل التفعيل غير صالح');var alive=cur&&(!cur.exp||deynNow()<cur.exp);if(used.indexOf(p.code)>=0&&!(alive&&cur.code===p.code)){err.textContent='هذا الكود سبق استعماله';err.classList.add('show');return;}await DeynStore.set('lic',JSON.stringify({code:p.code}));if(used.indexOf(p.code)<0){used.push(p.code);await DeynStore.set('used',JSON.stringify(used));}DEYN_LIC=p;window.DEYN_LIC=p;inp.value='';agStartApp();}catch(e){err.textContent=e&&e.message?e.message:'تعذّر إتمام التفعيل الآمن';err.classList.add('show');}finally{btn.disabled=false;}}
function applyLicenseRole(){var L=window.DEYN_LIC;if(!L||typeof S==='undefined'||!S)return;if(!S.auth)S.auth={};if(S.auth.licRole!==L.role){S.auth.deviceRole=L.role==='W'?'worker':'master';S.auth.licRole=L.role;}if(L.role==='W')S.auth.deviceRole='worker';if(L.role==='M')S.auth.masterCode=L.code;if(L.exp){var d=new Date(L.exp-3600000);S.auth.expiry=('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear();}else S.auth.expiry='مدى الحياة';}
async function licenseBoot(startFn){DEYN_START_FN=startFn;var $g=function(id){return document.getElementById(id);};try{DEYN_DEV_ID=await deynGetDeviceId();$g('agDevId').textContent=DEYN_DEV_ID;$g('agCopy').addEventListener('click',async function(){var txt=$g('agDevId').textContent.trim();if(await agCopyText(txt))agToast('تم نسخ معرّف الجهاز بنجاح');else agToast('تعذّر النسخ — اضغط مطولاً على المعرّف لنسخه');});$g('agPaste').addEventListener('click',async function(){var t=await agReadText();if(t){$g('agCode').value=String(t).trim();$g('agErr').classList.remove('show');}else{$g('agCode').focus();agToast('الصق الكود يدوياً بالضغط المطوّل داخل الخانة');}});$g('agGo').addEventListener('click',agActivate);$g('agCode').addEventListener('keydown',function(e){if(e.key==='Enter')agActivate();});$g('agCode').addEventListener('input',function(){$g('agErr').classList.remove('show');});$g('agCode').addEventListener('focus',function(e){setTimeout(function(){try{e.target.scrollIntoView({block:'center',behavior:'smooth'});}catch(x){}},250);});await deynClockInit();var lic=await deynLoadLicense();if(lic&&(!lic.exp||deynNow()<lic.exp)){DEYN_LIC=lic;window.DEYN_LIC=lic;agStartApp();}else agShowGate(lic?'انتهت مدة الترخيص — أدخل كود تفعيل جديد':'');}catch(e){agShowGate('تعذّر تشغيل الحماية الآمنة: '+(e&&e.message?e.message:'خطأ غير معروف'));}}

/* ============ Init ============ */
async function init() {
  const stored = await loadState();
  if (stored.status === 'corrupt' || stored.status === 'unavailable') {
    showStorageRecovery(stored, false);
    return;
  }
  S = stored.status === 'valid' ? stored.value : seed();
  if (stored.status !== 'valid') S.demoFp = DeynSyncLib.demoFingerprint(S);
  window.DEYN_VAULT_STATUS = stored.vault;
  if (stored.degraded) setTimeout(() => toast('تم استرجاع آخر نسخة سليمة من بياناتك بعد اكتشاف تلف في النسخة الأحدث ⚠️', 'err'), 1500);
  if (stored.vault !== 'on' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) setTimeout(() => toast('تنبيه: تشفير البيانات غير متاح على هذا الجهاز، تعمل بياناتك دون تشفير ⚠️', 'err'), 1500);
  S.settings = Object.assign({ dialect: true, sound: true, notifs: true, assistantStatsLocked: true }, S.settings);
  if (!S.auth) {
    S.auth = {
      phone: '0555 12 34 56',
      pwMustSet: true,
      masterCode: 'DEYN-M-2026-8841-A9',
      assistantCode: 'DEYN-S-2026-9923-B4',
      expiry: '05/11/2027',
      maxDevices: 2
    };
  }
  applyLicenseRole();
  S.seq = S.seq || (Math.max(0, ...S.pending.map(t => t.no)) + 1);
  buildTiles(); renderAll(); if (!persist()) return; await deynFlush(); if (storageBlocked) return; checkSmartNotifs();
  { const ov = $('#appLockOverlay'); if (ov && S.settings.appLockEnabled) ov.style.display = 'flex'; }
  syInit();
  authMigrate().then(changed => { if (changed && !persist()) return; checkAppLock(); ensurePasswordSet(); })
    .catch(() => { checkAppLock(); });
}
if (typeof document !== 'undefined' && document.getElementById('coins')) licenseBoot(init);
</script>

<script id="deyn-sms-bundle">
/* DEYN_SMS_ENGINE_V1 */
/* DEYN SMS core: deterministic debt allocation, per-debt due dates, multipart encoding analysis, reminders, queue planning and per-part status reconciliation. */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const DEFAULTS = Object.freeze({ enabled:false, days:[1,4,8,15], times:['10:00','11:00','16:00','10:00'], start:'09:00', end:'22:00', intervalMinutes:5, tplAr:'السلام عليكم {title} {name}، عليكم {amount} دج منذ {date}. شكرا.', tplFr:'Bonjour {title} {name}, solde de {amount} DA dû depuis le {date}. Merci.', storeName:'' });
  const clone = x => JSON.parse(JSON.stringify(x));
  function stableHash(value) { let a=2166136261,b=0x9e3779b9; const s=String(value); for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822519);}return (a>>>0).toString(36)+(b>>>0).toString(36); }
  const validDate = n => Number.isFinite(Number(n)) && Number(n) > 0;
  const localAt = (base, hhmm) => { const [h,m] = String(hhmm||'09:00').split(':').map(Number); const d = new Date(base); d.setHours(h||0,m||0,0,0); return d.getTime(); };
  const parseTime = s => { const m=/^(\d{2}):(\d{2})$/.exec(String(s||'')); return m && +m[1]<24 && +m[2]<60 ? [+m[1],+m[2]] : null; };

  // GSM 03.38 basic 7-bit character set and 2-septet extension characters
  const GSM7_BASIC = new Set(Array.from('@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'));
  const GSM7_EXT = new Set(Array.from('|^€{}[~]\\'));

  function normalizeSmsText(raw, lang) {
    let s = String(raw ?? '')
      .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
      .replace(/[\u00A0\u202F]/g, ' ')
      .replace(/\r\n?/g, '\n');
    if (lang === 'fr') {
      s = s.replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...');
    }
    return s.split('\n').map(line => line.replace(/[ \t]{2,}/g, ' ').trim()).filter((line, idx, arr) => line.length > 0 || (idx > 0 && idx < arr.length - 1)).join('\n').trim();
  }

  function analyzeMessage(rawText) {
    const text = String(rawText ?? '');
    if (!text) {
      return { text: '', encoding: 'GSM-7', units: 0, singleLimit: 160, multiLimit: 153, partsCount: 0, parts: [] };
    }
    let isGsm7 = true;
    let gsmSeptets = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (GSM7_BASIC.has(ch)) gsmSeptets += 1;
      else if (GSM7_EXT.has(ch)) gsmSeptets += 2;
      else { isGsm7 = false; break; }
    }
    if (isGsm7) {
      const singleLimit = 160, multiLimit = 153;
      if (gsmSeptets <= singleLimit) {
        return { text, encoding: 'GSM-7', units: gsmSeptets, singleLimit, multiLimit, partsCount: 1, parts: [text] };
      }
      const parts = [];
      let cur = '', curUnits = 0;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const w = GSM7_EXT.has(ch) ? 2 : 1;
        if (curUnits + w > multiLimit && cur.length > 0) {
          parts.push(cur);
          cur = ch;
          curUnits = w;
        } else {
          cur += ch;
          curUnits += w;
        }
      }
      if (cur.length > 0) parts.push(cur);
      return { text, encoding: 'GSM-7', units: gsmSeptets, singleLimit, multiLimit, partsCount: parts.length, parts };
    }

    // UCS-2 / UTF-16 encoding (70 code units for a single SMS, 67 code units per part for multipart SMS)
    const singleLimit = 70, multiLimit = 67;
    const units = text.length;
    if (units <= singleLimit) {
      return { text, encoding: 'UCS-2', units, singleLimit, multiLimit, partsCount: 1, parts: [text] };
    }
    const parts = [];
    let idx = 0;
    while (idx < units) {
      let end = Math.min(units, idx + multiLimit);
      if (end < units) {
        const hi = text.charCodeAt(end - 1), lo = text.charCodeAt(end);
        if (hi >= 0xD800 && hi <= 0xDBFF && lo >= 0xDC00 && lo <= 0xDFFF) {
          end -= 1;
        }
      }
      if (end <= idx) end = Math.min(units, idx + multiLimit);
      parts.push(text.slice(idx, end));
      idx = end;
    }
    return { text, encoding: 'UCS-2', units, singleLimit, multiLimit, partsCount: parts.length, parts };
  }

  function config(raw) {
    const c=Object.assign({},DEFAULTS,raw||{});
    // Migrate only the exact shipped defaults from the previous release; preserve owner-edited templates.
    const OLD_DEFAULT_AR='السلام عليكم {title} {name}، نذكّركم بأن عليكم مبلغ {amount} دج مستحق منذ {date}. نرجو التسوية عند الإمكان. شكرًا لكم 😊';
    const OLD_DEFAULT_FR='Bonjour {title} {name}, nous vous rappelons que votre solde de {amount} DA est dû depuis le {date}. Merci de régulariser dès que possible 😊';
    if(c.tplAr===OLD_DEFAULT_AR)c.tplAr=DEFAULTS.tplAr;
    if(c.tplFr===OLD_DEFAULT_FR)c.tplFr=DEFAULTS.tplFr;
    const days=Array.isArray(c.days)&&c.days.length===4?c.days.map(Number):[];
    c.days=days.length===4&&days.every((x,i)=>Number.isInteger(x)&&x>=1&&x<=90&&(i===0||x>days[i-1]))?days:DEFAULTS.days.slice();
    const times=Array.isArray(c.times)&&c.times.length===4?c.times.slice():[];
    c.times=times.length===4&&times.every(x=>!!parseTime(x))?times:DEFAULTS.times.slice();
    c.start='09:00';
    if (!parseTime(c.end)||c.end<='09:00'||c.end>'22:00') c.end=DEFAULTS.end;
    c.intervalMinutes=Math.max(1,Math.min(60,Number(c.intervalMinutes)||5));
    if(typeof c.tplAr!=='string'||!c.tplAr.trim()||c.tplAr.length>500)c.tplAr=DEFAULTS.tplAr;
    if(typeof c.tplFr!=='string'||!c.tplFr.trim()||c.tplFr.length>500)c.tplFr=DEFAULTS.tplFr;
    c.storeName=String(c.storeName||'').trim().slice(0,80);
    return c;
  }
  function nextMonthlyDue(ts, day) {
    if (!day || day<1 || day>31) return null;
    const d=new Date(ts), y=d.getFullYear(), m=d.getMonth();
    let due=new Date(y,m,Math.min(day,new Date(y,m+1,0).getDate()),23,59,59,999).getTime();
    if (due < ts) { const nm=m+1; due=new Date(y,nm,Math.min(day,new Date(y,nm+1,0).getDate()),23,59,59,999).getTime(); }
    return due;
  }
  function ledger(c) {
    const debts=(c.tx||[]).filter(t=>t.type==='debt').slice().sort((a,b)=>(a.ts-b.ts)||String(a.id).localeCompare(String(b.id)));
    const left=new Map(debts.map(d=>[d.id,Number(d.amount)||0]));
    const pays=(c.tx||[]).filter(t=>t.type==='pay').slice().sort((a,b)=>(a.ts-b.ts)||String(a.id).localeCompare(String(b.id)));
    for (const p of pays) {
      let remaining=Number(p.amount)||0;
      const alloc=Array.isArray(p.allocations)?p.allocations:null;
      if (alloc) {
        for (const a of alloc) { if (!left.has(a.debtId)) continue; const use=Math.min(left.get(a.debtId),Math.max(0,Number(a.amount)||0),remaining); left.set(a.debtId,Math.max(0,left.get(a.debtId)-use)); remaining-=use; if(remaining<=0) break; }
        // If a payment exceeds the old balance, its remainder is a credit against debts added in the same operation/later.
        for (const d of debts) { if (remaining<=0) break; if (Number(d.ts)<Number(p.ts)) continue; const have=left.get(d.id)||0; const use=Math.min(have,remaining); left.set(d.id,have-use); remaining-=use; }
      } else {
        // Legacy payments remain immutable; derive FIFO coverage only in memory.
        for (const d of debts) { if (remaining<=0) break; const have=left.get(d.id)||0; const use=Math.min(have,remaining); left.set(d.id,have-use); remaining-=use; }
      }
    }
    return debts.map(d=>{
      const original=validDate(d.originalDueAt)?Number(d.originalDueAt):(validDate(d.dueAt)?Number(d.dueAt):(c.payDay?nextMonthlyDue(Number(d.ts)||Date.now(),Number(c.payDay)):null));
      return { debt:d, remaining:Math.max(0,Math.round((left.get(d.id)||0)*100)/100), dueAt:validDate(d.dueAt)?Number(d.dueAt):original, originalDueAt:original };
    }).filter(x=>x.remaining>0);
  }
  function allocatePayment(c, amount) {
    let remaining=Math.max(0,Number(amount)||0); const allocations=[];
    for(const item of ledger(c)) { if(remaining<=0) break; const n=Math.min(item.remaining,remaining); if(n>0){allocations.push({debtId:item.debt.id,amount:Math.round(n*100)/100}); remaining-=n;} }
    return allocations;
  }
  function extendDebt(c,debtId,amount,unit,now) {
    const item=ledger(c).find(x=>x.debt.id===debtId); if(!item) throw new Error('الدين المحدد غير موجود أو تمت تسويته');
    const base=item.dueAt || Number(now||Date.now());
    const n=Math.max(1,Math.min(365,Number(amount)||0));
    const delta=unit==='months'?0:unit==='weeks'?n*7:n;
    let next;
    if(unit==='months') { const d=new Date(base); const day=d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+n); d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate())); next=d.getTime(); }
    else next=base+delta*DAY;
    const d=item.debt; d.originalDueAt=d.originalDueAt||item.originalDueAt||base; d.dueAt=next; d.extensionHistory=Array.isArray(d.extensionHistory)?d.extensionHistory:[];
    d.extensionHistory.push({at:Number(now||Date.now()),from:base,to:next,amount:n,unit});
    return {from:base,to:next,debtId};
  }
  const dateLabel = ts => { const d=new Date(ts); return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(); };
  const phone = raw => { let s=String(raw||'').replace(/[^\d+]/g,''); if(s.startsWith('00'))s='+'+s.slice(2); if(/^213[567]\d{8}$/.test(s))s='+'+s; if(/^0[567]\d{8}$/.test(s))s='+213'+s.slice(1); return /^\+\d{9,15}$/.test(s)?s:null; };
  function render(tpl, vars, lang) {
    const out = String(tpl||'').replace(/\{(title|name|amount|date|store)\}/g,(_,k)=>String(vars[k]??'')).replace(/\s{2,}/g,' ').trim();
    return normalizeSmsText(out, lang);
  }
  function testMessage(date, customText) {
    if (typeof customText === 'string' && customText.trim()) return normalizeSmsText(customText.trim());
    return `DEYN: اختبار SMS ناجح - ${String(date||'')}`.trim();
  }

  function isLogBlocking(entry) {
    if (!entry) return false;
    if (typeof entry === 'object') {
      if (entry.status === 'failed') return false;
      return true;
    }
    return true;
  }

  /**
   * Reconciles a native per-part status report with an existing smsLog record.
   * Ensures a multi-part SMS is marked sent_to_network/delivered ONLY when all parts succeed,
   * and marks partial_failure when at least one part fails after another part succeeded.
   */
  function reconcileStatus(existing, report, meta) {
    const prev = (existing && typeof existing === 'object') ? Object.assign({}, existing) : {};
    const m = meta || {};
    const partsTotal = Math.max(1, Number(report && report.partsTotal) || Number(prev.partsTotal) || 1);
    let partsSent = Number.isFinite(Number(report && report.partsSent)) ? Number(report.partsSent) : (Number(prev.partsSent) || 0);
    let partsFailed = Number.isFinite(Number(report && report.partsFailed)) ? Number(report.partsFailed) : (Number(prev.partsFailed) || 0);
    let partsDelivered = Number.isFinite(Number(report && report.partsDelivered)) ? Number(report.partsDelivered) : (Number(prev.partsDelivered) || 0);

    let rawStatus = String((report && report.status) || prev.status || 'accepted_by_android');
    if (partsFailed > 0 && partsSent > 0) {
      rawStatus = 'partial_failure';
    } else if (partsFailed > 0 && partsSent === 0) {
      rawStatus = 'failed';
    } else if (partsDelivered >= partsTotal && partsFailed === 0) {
      rawStatus = 'delivered';
      partsSent = Math.max(partsSent, partsTotal);
    } else if (partsSent >= partsTotal && partsFailed === 0 && (rawStatus === 'accepted_by_android' || rawStatus === 'attempting' || rawStatus === 'sent_to_network')) {
      rawStatus = 'sent_to_network';
    } else if ((rawStatus === 'sent_to_network' || rawStatus === 'delivered') && partsSent < partsTotal && partsFailed === 0 && report && report.partsSent === undefined) {
      partsSent = partsTotal;
    }

    // Never downgrade a confirmed terminal delivery/network state back to accepted_by_android
    if (prev.status === 'delivered' && (rawStatus === 'accepted_by_android' || rawStatus === 'sent_to_network' || rawStatus === 'attempting')) {
      rawStatus = 'delivered';
    } else if (prev.status === 'sent_to_network' && (rawStatus === 'accepted_by_android' || rawStatus === 'attempting')) {
      rawStatus = 'sent_to_network';
    }

    const now = Date.now();
    const attemptAt = Number(report && report.attemptAt) || Number(prev.attemptAt) || Number(report && report.acceptedAt) || now;
    const acceptedAt = Number(report && report.acceptedAt) || Number(prev.acceptedAt) || attemptAt;
    const sentAt = Number(report && report.sentAt) || Number(prev.sentAt) || ((rawStatus === 'sent_to_network' || rawStatus === 'delivered') ? now : 0);
    const deliveredAt = Number(report && report.deliveredAt) || Number(prev.deliveredAt) || (rawStatus === 'delivered' ? now : 0);
    const at = deliveredAt || sentAt || acceptedAt || attemptAt || now;
    const sent = (rawStatus === 'sent_to_network' || rawStatus === 'delivered') && partsSent >= partsTotal && partsFailed === 0;
    const accepted = sent || rawStatus === 'accepted_by_android' || rawStatus === 'partial_failure';
    const delivered = rawStatus === 'delivered' && sent;

    const out = Object.assign({}, prev, {
      at,
      attemptAt,
      acceptedAt,
      sentAt,
      deliveredAt,
      status: rawStatus,
      sent,
      accepted,
      delivered,
      partsTotal,
      partsSent,
      partsFailed,
      partsDelivered,
      customerName: m.customerName || prev.customerName || '',
      phone: (report && report.phone) || m.phone || prev.phone || ''
    });
    if (report && report.error) out.error = String(report.error);
    return out;
  }

  function buildQueue(S, now) {
    const cfg=config(S.settings&&S.settings.sms||S.settings&&S.settings.smsConfig);
    if(!cfg.enabled || !Array.isArray(S.customers)) return [];
    const pending=[];
    for(const c of S.customers) {
      if(c.smsEnabled===false || c.smsOptOut===true || !phone(c.phone)) continue;
      const lang=c.smsLang==='fr'?'fr':'ar';
      const title=c.honorific==='madame'?(lang==='fr'?'Madame':'السيدة'):c.honorific==='monsieur'?(lang==='fr'?'Monsieur':'السيد'):'';
      const items=ledger(c);
      const events=[];
      for(const x of items) {
        if(!x.dueAt) continue;
        const dueDate=new Date(x.dueAt), nowDate=new Date(now);
        const overdueDays=Math.max(0,Math.floor((Date.UTC(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate())-Date.UTC(dueDate.getFullYear(),dueDate.getMonth(),dueDate.getDate()))/DAY));
        let latestPast=-1;
        // Select by the actual configured local reminder timestamp, not elapsed 24-hour blocks.
        // A due date stored at 23:59 must still trigger at 14:15 the following calendar day.
        for(let i=0;i<cfg.days.length;i++) if(localAt(x.dueAt+cfg.days[i]*DAY,cfg.times[i])<=now) latestPast=i;
        for(let i=0;i<cfg.days.length;i++) {
          const reminderAt=localAt(x.dueAt+cfg.days[i]*DAY,cfg.times[i]);
          const key=`${c.id}|${x.debt.id}|${i+1}|${Math.floor(x.dueAt)}`;
          if(S.smsLog&&isLogBlocking(S.smsLog[key])) continue;
          if(reminderAt<=now && i!==latestPast) continue; // one catch-up reminder only; never flood old backlog
          events.push({key,cid:c.id,debtId:x.debt.id,step:i+1,reminderAt,remaining:x.remaining,dueAt:x.dueAt});
        }
      }
      // Group all due debts for this customer and reminder step into one SMS; no other debt is suppressed.
      const groups=new Map();
      for(const e of events){ const bucket=e.reminderAt<=now?'due-now':String(e.reminderAt); const a=groups.get(bucket)||[]; a.push(e); groups.set(bucket,a); }
      for(const [bucket,es] of groups) {
        const debtIds=[...new Set(es.map(x=>x.debtId))].sort();
        const dueSignature=es.map(x=>`${x.debtId}:${x.step}:${Math.floor(x.dueAt)}`).sort().join(',');
        const key=`${c.id}|${bucket}|${stableHash(dueSignature)}`;
        if(S.smsLog&&isLogBlocking(S.smsLog[key])) continue;
        const amount=es.reduce((a,x)=>a+x.remaining,0);
        const due=Math.min(...es.map(x=>x.dueAt));
        const tpl=lang==='fr'?cfg.tplFr:cfg.tplAr;
        const storeName=cfg.storeName||(S.profile&&S.profile.storeName)||'';
        let message=render(tpl,{title,name:c.name,amount:Math.round(amount).toLocaleString('en-US'),date:dateLabel(due),store:storeName},lang);
        if(storeName&&!tpl.includes('{store}')) message=normalizeSmsText(message+'\n'+storeName,lang);
        const analysis=analyzeMessage(message);
        pending.push({id:key,key,eventKeys:es.map(x=>x.key),events:es.map(x=>({debtId:x.debtId,step:x.step,dueAt:x.dueAt,key:x.key})),cid:c.id,debtIds,step:es[0].step,phone:phone(c.phone),message,encoding:analysis.encoding,partsCount:analysis.partsCount,parts:analysis.parts,amount,dueAt:due,reminderAt:Math.min(...es.map(x=>x.reminderAt)),overdueDays:Math.max(0,...es.map(x=>Math.max(0,Math.floor((now-x.dueAt)/DAY))))});
      }
    }
    pending.sort((a,b)=>(b.overdueDays-a.overdueDays)||(a.dueAt-b.dueAt)||a.cid.localeCompare(b.cid));
    // One ordered queue for the whole shop, with a configurable minimum gap and a strict sending window.
    const start=parseTime('09:00'), end=parseTime(cfg.end); const startMin=start[0]*60+start[1], endMin=end[0]*60+end[1];
    const effectiveGap=Math.min(cfg.intervalMinutes,Math.max(1,Math.floor((endMin-startMin)/Math.max(1,pending.length))));
    let cursor=now, out=[];
    for(const item of pending) {
      const d=new Date(cursor), mins=d.getHours()*60+d.getMinutes();
      if(mins<startMin) cursor=localAt(cursor,cfg.start);
      else if(mins>endMin) { d.setDate(d.getDate()+1); cursor=localAt(d,cfg.start); }
      if(item.reminderAt>cursor) cursor=item.reminderAt;
      const atDate=new Date(cursor), m=atDate.getHours()*60+atDate.getMinutes();
      if(m>endMin) { atDate.setDate(atDate.getDate()+1); cursor=localAt(atDate,cfg.start); }
      item.at=Math.max(cursor,item.reminderAt); item.gapMinutes=effectiveGap; if(item.at>cursor) cursor=item.at; out.push(item); cursor+=effectiveGap*60000;
    }
    return out;
  }
  function validateBeforeSend(S,item,now) {
    const cfg=config(S.settings&&S.settings.sms||S.settings&&S.settings.smsConfig);
    if(!cfg.enabled) return {ok:false,reason:'global-disabled'};
    const c=(S.customers||[]).find(x=>x.id===item.cid); if(!c) return {ok:false,reason:'customer-missing'};
    if(c.smsEnabled===false||c.smsOptOut===true) return {ok:false,reason:'customer-disabled'};
    const to=phone(c.phone); if(!to||to!==item.phone) return {ok:false,reason:'phone-changed'};
    const open=ledger(c).filter(x=>item.debtIds.includes(x.debt.id)); if(!open.length) return {ok:false,reason:'debt-settled'};
    const byId=new Map(open.map(x=>[x.debt.id,x]));
    const dueEvents=(item.events||[]).filter(ev=>{const x=byId.get(ev.debtId);return x&&x.dueAt===ev.dueAt&&now>=localAt(ev.dueAt+cfg.days[ev.step-1]*DAY,cfg.times[ev.step-1])&&!(S.smsLog&&isLogBlocking(S.smsLog[ev.key]));});
    const dueIds=new Set(dueEvents.map(x=>x.debtId));const due=open.filter(x=>dueIds.has(x.debt.id));
    if(!due.length) return {ok:false,reason:'not-due'};
    if(S.smsLog&&isLogBlocking(S.smsLog[item.key])) return {ok:false,reason:'duplicate'};
    const amount=due.reduce((a,x)=>a+x.remaining,0);
    if(Number.isFinite(Number(item.amount))&&Math.abs(amount-Number(item.amount))>0.01)return {ok:false,reason:'amount-changed'};
    return {ok:true,customer:c,items:due,amount};
  }
  root.DeynSmsCore={DEFAULTS,config,ledger,allocatePayment,extendDebt,buildQueue,validateBeforeSend,phone,nextMonthlyDue,dateLabel,testMessage,normalizeSmsText,analyzeMessage,reconcileStatus,isLogBlocking};
})(typeof window!=='undefined'?window:globalThis);

/* DEYN_SMS_RUNTIME_V1 */
/* DEYN SMS UI/runtime bridge. Loaded after the existing DEYN app script. */
(function () {
  'use strict';
  const Core=window.DeynSmsCore;
  const plug=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.DeynSms;
  const cfg=()=>{ S.settings=S.settings||{}; S.settings.sms=Core.config(S.settings.sms); return S.settings.sms; };
  const escSms=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isFr=()=>typeof DEYN_I18N!=='undefined'&&DEYN_I18N.lang==='fr';
  const tr=s=>(typeof DEYN_I18N!=='undefined'&&typeof DEYN_I18N.tr==='function')?DEYN_I18N.tr(s):s;
  const fmtDate=ts=>ts?Core.dateLabel(ts):tr('غير محدد');
  const isoDate=ts=>{if(!ts)return '';const d=new Date(ts);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const fromDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return null;const [y,m,d]=s.split('-').map(Number);const v=new Date(y,m-1,d,23,59,59,999).getTime();return Number.isFinite(v)?v:null;};
  let syncTimer=null, syncBusy=false;

  function smsSegmentSummary(text) {
    const info = Core.analyzeMessage ? Core.analyzeMessage(text) : { encoding: 'UCS-2', units: String(text||'').length, partsCount: Math.ceil(String(text||'').length / 67) || 1 };
    if (isFr()) {
      return `Encodage : ${info.encoding} • ${info.units} caractères • ${info.partsCount} partie(s) SMS`;
    }
    return `الترميز: ${info.encoding} • ${info.units} حرف • ${info.partsCount} جزء SMS`;
  }

  function updateTplCounters() {
    const arEl = lastById('smsTplAr'), frEl = lastById('smsTplFr');
    const arInfo = lastById('smsTplArInfo'), frInfo = lastById('smsTplFrInfo');
    if (arEl && arInfo) arInfo.textContent = smsSegmentSummary(arEl.value);
    if (frEl && frInfo) frInfo.textContent = smsSegmentSummary(frEl.value);
  }

  function smsStatusLabel(rec) {
    const st = rec && rec.status || 'accepted_by_android';
    const pt = Math.max(1, Number(rec && rec.partsTotal) || 1);
    const ps = Number.isFinite(Number(rec && rec.partsSent)) ? Number(rec.partsSent) : (st === 'sent_to_network' || st === 'delivered' ? pt : 0);
    const pf = Number(rec && rec.partsFailed) || 0;
    const partsBadge = pt > 1 ? (isFr() ? ` (${ps}/${pt} parties)` : ` (${ps}/${pt} أجزاء)`) : '';
    if (st === 'delivered') {
      return isFr() ? `Livré au destinataire${partsBadge}` : `تم تأكيد التسليم إلى هاتف المستلم${partsBadge}`;
    }
    if (st === 'sent_to_network') {
      return isFr() ? `Envoyé au réseau mobile${partsBadge}` : `تم الإرسال إلى الشبكة بنجاح${partsBadge}`;
    }
    if (st === 'partial_failure') {
      return isFr()
        ? `Échec partiel : ${ps} sur ${pt} partie(s) envoyée(s), ${pf} en échec`
        : `فشل جزئي — أُرسل ${ps} من ${pt} أجزاء فقط (${pf} فشل)`;
    }
    if (st === 'failed') {
      return isFr() ? `Échec d'envoi au réseau — nouvelle tentative programmée` : `فشل الإرسال إلى الشبكة — ستُعاد المحاولة`;
    }
    if (st === 'attempting') {
      return isFr() ? `Tentative d'envoi en cours...` : `جاري محاولة الإرسال...`;
    }
    if (st === 'dispatch_uncertain') {
      return isFr()
        ? `État d'envoi incertain — non renvoyé pour éviter les doublons`
        : `حالة الإرسال غير مؤكدة — لم نعد المحاولة لتجنب التكرار`;
    }
    return isFr()
      ? `Accepté par Android (en attente de confirmation réseau${partsBadge})`
      : `قَبِل أندرويد طلب الإرسال (بانتظار تأكيد الشبكة${partsBadge})`;
  }

  function smsOpenSettings(){
    if(deynReadOnly&&deynReadOnly()){toast('وضع القراءة فقط: لا يمكن تغيير إعدادات SMS','err');return;}
    if(!requireOwner('إعدادات الرسائل النصية'))return;
    const c=cfg();
    const hideArByDefault = isFr();
    openModal(()=>`${sheetHead('إعدادات رسائل SMS')}
      <div class="sub" style="line-height:1.8">ترسل الرسائل من شريحة هاتف المالك فقط. يجب توفر رصيد SMS وشبكة الهاتف. قبول أندرويد للرسالة لا يعني تأكيد وصولها إلى هاتف الزبون.</div>
      <div class="row-set" style="margin-top:10px"><div><b>تفعيل الرسائل النصية</b><small>عند التفعيل، يتم تمكين كل الزبائن الذين لديهم رقم هاتف. يمكنك تعطيل أي زبون بشكل فردي.</small></div><label class="sw"><input type="checkbox" id="smsGlobal" ${c.enabled?'checked':''}><i></i></label></div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:10px">
        <b style="font-size:13px">جدول التذكير بعد الاستحقاق</b>
        <div class="sub">الأيام الافتراضية: 1 و4 و8 و15، ويمكن تغييرها.</div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px">${c.days.map((d,i)=>`<label style="font-size:11px;color:var(--mute)">اليوم ${i+1}<input class="inp num" id="smsDay${i}" type="number" min="1" max="90" value="${d}" style="margin-top:4px;padding:8px 5px;height:40px;text-align:center"></label>`).join('')}</div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px">${c.times.map((t,i)=>`<label style="font-size:11px;color:var(--mute)">الساعة ${i+1}<input class="inp num" id="smsTime${i}" type="time" value="${t}" style="margin-top:4px;padding:6px 2px;height:40px;text-align:center"></label>`).join('')}</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">فترة الإرسال والتوزيع</b>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><label class="lbl">بداية الإرسال (ثابتة)<div class="inp num" aria-label="بداية الإرسال ثابتة 09:00" style="direction:ltr;display:flex;align-items:center;justify-content:center;cursor:default;pointer-events:none;opacity:.8">09:00</div></label><label class="lbl">نهاية الإرسال (حتى 22:00)<input class="inp num" id="smsEnd" type="time" min="09:00" max="22:00" value="${c.end}" style="direction:ltr"></label></div>
        <label class="lbl">الفاصل بين الرسائل (بالدقائق)<input class="inp num" id="smsGap" type="number" min="1" max="60" value="${c.intervalMinutes}" style="direction:ltr"></label>
        <div class="sub">الافتراضي 09:00–22:00. تُرتّب الرسائل حسب أقدم دين متأخر وتُرسل بالتتابع لتجنب الإرسال الجماعي.</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">اسم المحل في الرسالة</b>
        <label class="lbl">اسم المحل أو التاجر الذي يظهر للزبون</label>
        <input class="inp" id="smsStoreName" type="text" maxlength="80" value="${escSms(c.storeName||'')}" placeholder="مثال: محل الأمانة">
        <div class="sub">يُضاف هذا الاسم تلقائيًا مكان {store} في القالب العربي والفرنسي.</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">قوالب الرسائل القابلة للتعديل</b>
        ${hideArByDefault ? `<button type="button" class="btn sm soft" data-act="smsToggleArTpl" style="margin-top:8px;height:32px;font-size:12px">عرض / تعديل القالب العربي</button>` : ''}
        <div id="smsTplArWrap" ${hideArByDefault ? 'hidden' : ''}>
          <label class="lbl">القالب العربي</label>
          <textarea class="inp" id="smsTplAr" maxlength="500" rows="4" style="height:auto;line-height:1.8">${escSms(c.tplAr)}</textarea>
          <div class="sub num" id="smsTplArInfo" style="font-size:11px;margin-top:2px">${escSms(smsSegmentSummary(c.tplAr))}</div>
        </div>
        <label class="lbl">القالب الفرنسي</label>
        <textarea class="inp" id="smsTplFr" maxlength="500" rows="4" style="height:auto;line-height:1.8;direction:ltr;text-align:left">${escSms(c.tplFr)}</textarea>
        <div class="sub num" id="smsTplFrInfo" style="font-size:11px;margin-top:2px">${escSms(smsSegmentSummary(c.tplFr))}</div>
        <div class="sub">المتغيرات: {title} اللقب، {name} الاسم، {amount} المبلغ، {date} تاريخ الاستحقاق، {store} اسم المحل إن كان موجودًا في ملف المتجر. الإعداد الحالي لا يحتوي على اسم متجر، لذلك لن يُضاف اسم غير موجود. الرسائل الطويلة قد تُحسب عدة وحدات SMS حسب شركة الاتصالات.</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">اختبار الإرسال</b><label class="lbl">رقم الهاتف الذي تريد إرسال الاختبار إليه</label><input class="inp num" id="smsTestPhone" type="tel" placeholder="0555 12 34 56" style="direction:ltr;text-align:right">
        <button class="btn block" data-act="smsTest" style="margin-top:8px">إرسال رسالة تجريبية</button>
      </div>
      <div class="two" style="margin-top:14px"><button class="btn" data-act="smsHistory">سجل الرسائل</button><button class="btn pri" data-act="smsSaveSettings" data-primary>حفظ الإعدادات</button></div>`,
      {refresh:()=>{}, mount:()=>{ updateTplCounters(); }});
  }
  async function smsPermission(){const p=plug();if(!p)throw new Error(tr('ميزة SMS غير متاحة في هذه النسخة'));const s=await p.checkPermissions();if(s&&s.sms==='granted')return true;const r=await p.requestPermissions();return !!(r&&r.sms==='granted');}
  async function smsToggleGlobal(el){
    if(deynReadOnly&&deynReadOnly()){el.checked=!el.checked;return toast('وضع القراءة فقط','err');}
    if(!requireOwner('تفعيل الرسائل النصية')){el.checked=false;return;}
    if(el.checked){
      const ok=await smsPermission().catch(e=>{toast(e.message,'err');return false;});
      if(!ok){el.checked=false;toast('لم يتم منح إذن إرسال الرسائل، بقيت الميزة متوقفة','err');return;}
      cfg().enabled=true;
      // The agreed global re-enable behavior: enable every customer with a valid phone.
      (S.customers||[]).forEach(c=>{if(Core.phone(c.phone)){c.smsEnabled=true;c.smsOptOut=false;}});
      toast('تم تفعيل SMS للزبائن الذين لديهم أرقام هاتف');
    }else{cfg().enabled=false;toast('تم إيقاف جميع رسائل SMS مؤقتًا');}
    persist();smsScheduleSoon();
  }
  function smsSaveSettings(){
    if(deynReadOnly&&deynReadOnly())return toast('وضع القراءة فقط','err');
    if(!requireOwner('تعديل إعدادات الرسائل'))return;
    const c=cfg();
    const days=[0,1,2,3].map(i=>Number(lastById('smsDay'+i)?.value));
    const times=[0,1,2,3].map(i=>lastById('smsTime'+i)?.value||'');
    const start='09:00',end=lastById('smsEnd')?.value||'';
    const gap=Number(lastById('smsGap')?.value||5);
    if(days.some(x=>!Number.isInteger(x)||x<1||x>90)||new Set(days).size!==4||days.some((x,i)=>i>0&&x<=days[i-1])||times.some(x=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(x))||!/^09:00$/.test(start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end)||end>'22:00'||end<='09:00'||!Number.isInteger(gap)||gap<1||gap>60)return toast('تحقق من الأيام والساعات والفاصل الزمني','err');
    c.days=days;c.times=times;c.start=start;c.end=end;c.intervalMinutes=gap;
    c.storeName=(lastById('smsStoreName')?.value||'').trim().slice(0,80);c.tplAr=lastById('smsTplAr')?.value.trim()||Core.DEFAULTS.tplAr;c.tplFr=lastById('smsTplFr')?.value.trim()||Core.DEFAULTS.tplFr;if(c.tplAr.length>500||c.tplFr.length>500)return toast('القالب طويل جدًا — الحد الأقصى 500 حرف لكل لغة','err');
    persist();smsScheduleSoon();closeModal();toast('تم حفظ إعدادات SMS بنجاح');
  }
  async function smsTest(){
    if(deynReadOnly&&deynReadOnly())return toast('وضع القراءة فقط: لا يمكن إرسال SMS','err');
    const p=plug();if(!p)return toast('الإرسال متاح داخل تطبيق أندرويد فقط','err');
    const to=Core.phone(lastById('smsTestPhone')?.value);if(!to)return toast('أدخل رقم هاتف صحيحًا','err');
    try{
      if(!(await smsPermission()))return toast('إذن SMS غير ممنوح','err');
      const nowLabel=Core.dateLabel(Date.now());
      const message=isFr()?`DEYN : Test SMS réussi - ${nowLabel}`:Core.testMessage(nowLabel);
      const testId='test-'+Date.now();
      const r=await p.send({id:testId,phone:to,message});
      if(!S.smsLog)S.smsLog={};
      const rec=Core.reconcileStatus(S.smsLog[testId],r||{status:'accepted_by_android'},{customerName:isFr()?'Test SMS':'رسالة تجريبية',phone:to});
      S.smsLog[testId]=rec;
      persist();
      if(rec.status==='delivered'){
        toast('تم إرسال رسالة الاختبار وتأكيد تسليمها إلى الهاتف','ok');
      }else if(rec.status==='sent_to_network'){
        toast('تم إرسال رسالة الاختبار إلى الشبكة بنجاح','ok');
      }else if(rec.status==='partial_failure'){
        toast(`فشل جزئي في إرسال الاختبار (${rec.partsSent}/${rec.partsTotal})`,'err');
      }else if(rec.status==='failed'){
        toast('فشل إرسال رسالة الاختبار إلى الشبكة','err');
      }else if(r&&r.duplicate){
        toast('رسالة الاختبار سبق إرسالها','warn');
      }else{
        toast('قَبِل أندرويد طلب الإرسال وبانتظار تأكيد الشبكة','warn');
      }
    }catch(e){toast(tr('تعذر إرسال الاختبار:')+' '+(e.message||e),'err');}
  }
  function smsHistory(){
    const validStatuses=new Set(['attempting','accepted_by_android','sent_to_network','delivered','partial_failure','failed','dispatch_uncertain']);
    const rows=Object.entries(S.smsLog||{}).filter(([k,v])=>v&&validStatuses.has(v.status)&&!v.internal).sort((a,b)=>(Number((b[1]&&b[1].at)||b[1])||0)-(Number((a[1]&&a[1].at)||a[1])||0)).slice(0,60);
    openModal(()=>`${sheetHead('سجل رسائل SMS')}<div class="sub">يميز السجل بين قبول أندرويد، ونجاح إرسال كل الأجزاء للشبكة، وتأكيد التسليم، والفشل الجزئي أو الكلي.</div>${rows.length?rows.map(([k,v])=>{
      const isBad = v&&['dispatch_uncertain','partial_failure','failed'].includes(v.status);
      const isPending = v&&['attempting','accepted_by_android'].includes(v.status);
      const icon = v&&v.status==='delivered'?'✓✓':(v&&v.status==='sent_to_network'?'✓':(isPending?'⏳':(v&&v.status==='failed'?'✕':'!')));
      const cls = isBad ? 'debt' : 'pay';
      return `<div class="tx"><div class="tx-ic ${cls}">${icon}</div><div class="tx-m"><b>${escSms(v&&v.customerName||k)}</b><small>${escSms(smsStatusLabel(v))} • ${escSms(fmtDate(Number(v&&v.at)||Number(v)||0))}</small></div><div class="tx-a"><small class="num">${escSms(v&&v.phone||'')}</small></div></div>`;
    }).join(''):'<div class="empty-st" style="padding:22px">لا توجد رسائل في السجل بعد</div>'}`);
  }
  function smsScheduleSoon(){clearTimeout(syncTimer);syncTimer=setTimeout(()=>{if(syncBusy){smsScheduleSoon();return;}smsSchedule();},100);}
  async function smsSchedule(){
    const p=plug();if(!p||syncBusy||!S)return;
    syncBusy=true;
    try{
      if(isWorkerDevice()||!cfg().enabled){await p.schedule({items:[]});if(S.smsQueueMeta&&Object.keys(S.smsQueueMeta).length){S.smsQueueMeta={};try{originalPersist();if(typeof deynFlush==='function')await deynFlush();}catch(e){console.warn('SMS queue metadata cleanup',e);}}return;}
      const permission=await p.checkPermissions();
      if(!permission||permission.sms!=='granted'){cfg().enabled=false;await p.schedule({items:[]});persist();toast('تم إيقاف SMS لأن إذن الرسائل غير متاح','err');return;}
      if(!S.smsLog)S.smsLog={};if(!S.smsQueueMeta)S.smsQueueMeta={};
      const metaBefore=JSON.stringify(S.smsQueueMeta);let changed=false;
      try{
        const sent=await p.getSent();
        const rawItems=(sent&&sent.items)||((sent&&sent.ids)||[]).map(id=>({id,acceptedAt:Date.now(),status:'sent_to_network',sent:true,partsTotal:1,partsSent:1,partsFailed:0}));
        const uncertain=(sent&&sent.uncertain)||[];
        const failed=(sent&&sent.failed)||[];
        const byId=new Map();
        for(const item of rawItems.concat(uncertain,failed)){
          if(item&&item.id)byId.set(item.id,item);
        }
        for(const [id,item] of byId){
          if(!id)continue;
          if(id.startsWith('test-')){
            if(S.smsLog[id]){
              const nextRec=Core.reconcileStatus(S.smsLog[id],item,{customerName:S.smsLog[id].customerName,phone:S.smsLog[id].phone});
              if(JSON.stringify(nextRec)!==JSON.stringify(S.smsLog[id])){S.smsLog[id]=nextRec;changed=true;}
            }
            continue;
          }
          const prev=S.smsLog[id];
          const meta=S.smsQueueMeta[id]||(prev&&{eventKeys:prev.eventKeys,customerName:prev.customerName,phone:prev.phone})||{};
          const rec=Core.reconcileStatus(prev,item,meta);
          if(Array.isArray(meta.eventKeys))rec.eventKeys=meta.eventKeys;
          if(!prev||JSON.stringify(prev)!==JSON.stringify(rec)){
            S.smsLog[id]=rec;
            for(const k of meta.eventKeys||[]){
              if(rec.status==='failed'){
                delete S.smsLog[k];
              }else{
                S.smsLog[k]=Object.assign({},rec,{internal:true});
              }
            }
            changed=true;
          }
          if(['sent_to_network','delivered','partial_failure','dispatch_uncertain'].includes(rec.status)){
            delete S.smsQueueMeta[id];
          }
        }
      }catch(e){console.warn('SMS history sync',e);}
      const now=Date.now();const queue=Core.buildQueue(S,now);
      const active=new Set(queue.map(x=>x.id));
      for(const id of Object.keys(S.smsQueueMeta)){
        const existing=S.smsLog[id];
        if(!active.has(id)&&(!existing||!['attempting','accepted_by_android'].includes(existing.status)))delete S.smsQueueMeta[id];
      }
      for(const item of queue){S.smsQueueMeta[item.id]={eventKeys:item.eventKeys,customerName:((S.customers||[]).find(c=>c.id===item.cid)||{}).name||'',phone:item.phone};}
      const metaChanged=metaBefore!==JSON.stringify(S.smsQueueMeta);let durable=true;if(changed||queue.length||metaChanged){try{const saved=originalPersist();if(saved===false)durable=false;else if(typeof deynFlush==='function')await deynFlush();}catch(e){durable=false;console.warn('SMS state flush failed',e);}}
      if(!durable){await p.schedule({items:[]});return;}
      const items=queue.filter(x=>!Core.isLogBlocking(S.smsLog[x.id])&&(x.at>now||Core.validateBeforeSend(S,x,now).ok)).map(x=>({id:x.id,phone:x.phone,message:x.message,at:x.at,gapMinutes:x.gapMinutes}));
      await p.schedule({items});
    }catch(e){console.warn('SMS queue update failed',e);}
    finally{syncBusy=false;}
  }
  function smsExtendHtml(c){
    const rows=Core.ledger(c);
    if(!rows.length)return '';
    return `<div style="background:#f7faf9;border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:12px"><label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700"><input id="mExtendEnabled" type="checkbox" style="width:18px;height:18px"> تمديد موعد دين بعد هذه الدفعة (اختياري)</label><div class="sub">يُمدد الدين الذي تختاره فقط، مع الاحتفاظ بتاريخ الموعد السابق وسجل التمديد.</div><label class="lbl">الدين المراد تمديده</label><select class="inp" id="mExtendDebt">${rows.map(x=>`<option value="${escSms(x.debt.id)}">${escSms(x.debt.note||'دين')} • ${fmt(x.remaining)} دج • ${fmtDate(x.dueAt)}</option>`).join('')}</select><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label class="lbl">المدة<input class="inp num" id="mExtendValue" type="number" min="1" max="365" value="7" style="direction:ltr"></label><label class="lbl">الوحدة<select class="inp" id="mExtendUnit"><option value="days">أيام</option><option value="weeks">أسابيع</option><option value="months">أشهر</option></select></label></div></div>`;
  }
  // Extend the existing customer form with owner-only contact preferences.
  const originalOpenCustForm=openCustForm;
  openCustForm=function(id,seg){
    originalOpenCustForm(id,seg);
    if(isWorkerDevice())return;
    const c=id?cust(id):null;
    const sheet=document.querySelector('#modalRoot .ovl:last-child .sheet');
    if(!sheet||sheet.querySelector('#fSmsLang'))return;
    const anchor=sheet.querySelector('#fPhone');
    const block=document.createElement('div');
    block.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><label class="lbl">اللقب<select class="inp" id="fHonorific"><option value="" ${!c?.honorific?'selected':''}>بدون لقب</option><option value="monsieur" ${c?.honorific==='monsieur'?'selected':''}>السيد / Monsieur</option><option value="madame" ${c?.honorific==='madame'?'selected':''}>السيدة / Madame</option></select></label><label class="lbl">لغة الرسالة<select class="inp" id="fSmsLang"><option value="auto" ${!c?.smsLang||c?.smsLang==='auto'?'selected':''}>تلقائي (عربي)</option><option value="ar" ${c?.smsLang==='ar'?'selected':''}>العربية</option><option value="fr" ${c?.smsLang==='fr'?'selected':''}>Français</option></select></label></div><label style="display:flex;align-items:center;gap:8px;font-size:12px;margin:8px 0"><input id="fSmsEnabled" type="checkbox" style="width:18px;height:18px" ${(!c||(!c.smsOptOut&&c.smsEnabled!==false))?'checked':''} ${c?.smsOptOut?'data-user-touched="1"':''}> السماح بإرسال تذكيرات SMS لهذا الزبون</label>`;
    anchor?.after(block);
    if(typeof DEYN_I18N!=='undefined'&&typeof DEYN_I18N.translateRoot==='function')DEYN_I18N.translateRoot(block);
  };
  const originalSaveCust=saveCust;
  saveCust=function(){
    if(isWorkerDevice())return originalSaveCust();
    const editId=CF&&CF.id?CF.id:null, beforeCount=(S.customers||[]).length;
    const phoneVal=lastById('fPhone')?.value.trim()||'';
    const honorific=lastById('fHonorific')?.value||'';const smsLang=lastById('fSmsLang')?.value||'auto';const hasPhone=!!Core.phone(phoneVal);const smsChecked=!!lastById('fSmsEnabled')?.checked;const smsOptOut=hasPhone?!smsChecked:!!(cust(editId||'')||{}).smsOptOut;const smsEnabled=hasPhone&&!smsOptOut;
    const activeModal=stack[stack.length-1];originalSaveCust();
    if(activeModal&&stack.includes(activeModal))return;
    const updated=editId?cust(editId):((S.customers||[]).length>beforeCount?S.customers[S.customers.length-1]:null);
    if(updated){updated.honorific=honorific;updated.smsLang=smsLang;updated.smsEnabled=smsEnabled;updated.smsOptOut=smsOptOut;persist();smsScheduleSoon();}
  };
  const originalOpenMoney=openMoney;
  openMoney=function(cid,kind){
    originalOpenMoney(cid,kind);
    const c=cust(cid),sheet=document.querySelector('#modalRoot .ovl:last-child .sheet');if(!c||!sheet)return;
    if(kind==='debt'&&!sheet.querySelector('#mDueAt')){const label=document.createElement('div');const due=Core.nextMonthlyDue(Date.now(),c.payDay);label.innerHTML=`<label class="lbl" for="mDueAt">موعد استحقاق هذا الدين (اختياري)</label><input class="inp" id="mDueAt" type="date" value="${isoDate(due)}"><div class="sub">إذا تركته فارغًا فلن تُرسل تذكيرات تلقائية لهذا الدين حتى تحدد موعدًا. الزبائن ذوو يوم السداد الشهري يحصلون على الموعد التالي تلقائيًا.</div>`;sheet.querySelector('#mNote')?.before(label);}
    if(kind==='pay'&&!sheet.querySelector('#mNewDueAt')){const due=Core.nextMonthlyDue(Date.now(),c.payDay);const box=document.createElement('div');box.innerHTML=`<label class="lbl">موعد استحقاق السلعة الجديدة (اختياري)</label><input class="inp" id="mNewDueAt" type="date" value="${isoDate(due)}">`;sheet.querySelector('#mNewDebt')?.after(box);}
    if(kind==='pay'&&!sheet.querySelector('#mExtendEnabled'))sheet.querySelector('#mNote')?.before(Object.assign(document.createElement('div'),{innerHTML:smsExtendHtml(c)}));
    if(typeof DEYN_I18N!=='undefined'&&typeof DEYN_I18N.translateRoot==='function')DEYN_I18N.translateRoot(sheet);
  };
  const originalConfirmMoney=confirmMoney;
  confirmMoney=function(){
    const c=MM&&cust(MM.cid);if(!c)return originalConfirmMoney();
    const kind=MM.kind;const amount=round2(parseAmt(lastById('mAmt')?.value||'0'));
    let extension=null;
    if(kind==='pay'&&lastById('mExtendEnabled')?.checked){
      const extra=round2(parseAmt(lastById('mNewDebt')?.value||'0'));
      if(!(amount>0))return toast('أدخل مبلغ التسديد أولاً قبل تمديد الموعد','err');
      if(amount>bal(c)+extra+0.001)return toast('مبلغ التسديد أكبر من مجموع الدين والسلعة الجديدة','err');
      const debtId=lastById('mExtendDebt')?.value,n=Number(lastById('mExtendValue')?.value),unit=lastById('mExtendUnit')?.value;
      if(!debtId||!Number.isInteger(n)||n<1||n>365||!['days','weeks','months'].includes(unit))return toast('تحقق من مدة التمديد','err');
      const target=Core.ledger(c).find(x=>x.debt.id===debtId);const used=Core.allocatePayment(c,amount).filter(x=>x.debtId===debtId).reduce((a,x)=>a+x.amount,0);
      if(!target||target.remaining-used<=0.001)return toast('هذا الدين سيتم تسويته بالكامل بهذه الدفعة، اختر دينًا سيبقى منه رصيد','err');
      try{extension=Core.extendDebt(c,debtId,n,unit,Date.now());}catch(e){return toast(tr(e.message),'err');}
    }
    const oldAddTx=addTx;
    addTx=function(customer,type,amt,note,extra){
      if(type==='pay')return oldAddTx(customer,type,amt,note,Object.assign({},extra||{},{allocations:Core.allocatePayment(customer,amt)}));
      if(type==='debt'){const due=fromDate(lastById(kind==='pay'?'mNewDueAt':'mDueAt')?.value);return oldAddTx(customer,type,amt,note,Object.assign({},extra||{},due?{dueAt:due}:{}));}
      return oldAddTx(customer,type,amt,note,extra);
    };
    try{originalConfirmMoney();}finally{addTx=oldAddTx;}
    if(extension){const log=c.tx.find(t=>t.type==='debt'&&t.id===extension.debtId);if(log){log.dueAt=extension.to;persist();}}
    smsScheduleSoon();
  };
  // Persisted app changes always rebuild/cancel the native queue. This prevents stale scheduled work after edits/payments.
  const originalPersist=persist;
  persist=function(){const r=originalPersist.apply(this,arguments);smsScheduleSoon();return r;};
  const guard=fn=>function(){if(deynReadOnly&&deynReadOnly()){toast('وضع القراءة فقط 🔒','err');return;}return fn.apply(this,arguments);};
  A.smsSettings=guard(smsOpenSettings);A.smsSaveSettings=guard(smsSaveSettings);A.smsTest=guard(smsTest);A.smsHistory=smsHistory;A.saveCust=guard(saveCust);A.mmok=guard(confirmMoney);
  A.smsToggleArTpl=()=>{const w=lastById('smsTplArWrap');if(w)w.hidden=!w.hidden;};
  if(typeof READONLY_OK!=='undefined'&&READONLY_OK&&typeof READONLY_OK.add==='function'){READONLY_OK.add('smsHistory');}
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='smsGlobal')smsToggleGlobal(e.target);});
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='fSmsEnabled')e.target.dataset.userTouched='1';});
  document.addEventListener('input',e=>{
    if(e.target&&(e.target.id==='smsTplAr'||e.target.id==='smsTplFr'))updateTplCounters();
    if(e.target&&e.target.id==='fPhone'&&cfg().enabled){const cb=lastById('fSmsEnabled');const c=CF&&CF.id?cust(CF.id):null;if(cb&&!cb.dataset.userTouched&&!c?.smsOptOut&&Core.phone(e.target.value))cb.checked=true;}
  });

  document.addEventListener('DOMContentLoaded',smsScheduleSoon);
  window.addEventListener('pageshow',smsScheduleSoon);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)smsScheduleSoon();});
  setTimeout(smsScheduleSoon,1200);
})();

</script>

<script id="deyn-i18n-bundle">
/* DEYN_I18N_RUNTIME_V1 */
const DEYN_FR_DICT = {
  "({} زبائن)": "({} clients)",
  "(⚠️ متأخر {} يوم)": "(⚠️ en retard de {} jour(s))",
  "*DEYN — كشف حساب*": "*DEYN — Relevé de compte*",
  "*الباقي عليك: {} دج*": "*Reste à payer : {} DA*",
  "+ إضافة فئة جديدة": "+ Ajouter une catégorie",
  "+ السلعة الجديدة:": "+ Nouvel article :",
  "+ زبون": "+ Client",
  "+ زبون جديد": "+ Nouveau client",
  "+ فئة جديدة": "+ Nouvelle catégorie",
  "- المبلغ المسدد:": "- Montant payé :",
  "0 دج": "0 DA",
  "0 دج (اختياري)": "0 DA (optionnel)",
  "0 زبائن": "0 client",
  "CHECK — آخر العمليات": "CHECK — Dernières opérations",
  "DEYN — تسيير الديون بكل سهولة": "DEYN — Gérez vos dettes en toute simplicité",
  "DEYN • الإصدار 1.0.0": "DEYN • Version 1.0.0",
  "DEYN: اختبار SMS ناجح - {}": "DEYN : Test SMS réussi - {}",
  "MU: المبلغ ثم × ثم نسبة الربح ثم MU": "MU : montant, puis ×, puis marge, puis MU",
  "{} • {} دج • {}": "{} • {} DA • {}",
  "{} • الاستحقاق {} • تمديد {}": "{} • Échéance {} • Prolongation {}",
  "{} • الاستحقاق {}": "{} • Échéance {}",
  "• الاستحقاق {}": "• Échéance {}",
  "• تمديد {}": "• Prolongation {}",
  "الاستحقاق": "Échéance",
  "تمديد": "Prolongation",
  "{} دج": "{} DA",
  "{} دج (دفع زائد)": "{} DA (trop-perçu)",
  "{} دج {}": "{} DA {}",
  "{} زبائن": "{} clients",
  "{} زبائن متأخرون": "{} client(s) en retard",
  "{} زبائن و {} تذاكر معلقة": "{} client(s) et {} ticket(s) en attente",
  "{} زبون": "{} client(s)",
  "{} زبون • تسديد في موعده": "{} client(s) • paiement à l'échéance",
  "{} عليه {} دج. سيُنقل حسابه إلى سلة المهملات ويمكنك استرجاعه في أي وقت.": "{} doit {} DA. Son compte sera déplacé vers la corbeille et vous pourrez le restaurer à tout moment.",
  "{} عنصر محذوف": "{} élément(s) supprimé(s)",
  "· ترحيل فوري للمبالغ إلى الزبائن": "· Transfert immédiat des montants aux clients",
  "؟": "?",
  "آخر العمليات:": "Dernières opérations :",
  "آخر خطأ:": "Dernière erreur :",
  "آخر نجاح: {} • بانتظار الإرسال: {}{}": "Dernier succès : {} • en attente d'envoi : {}{}",
  "آلة حاسبة": "Calculatrice",
  "أدخل المبلغ المسدد أو سلعة جديدة": "Saisissez le montant payé ou un nouvel article",
  "أدخل رقم هاتف صحيحًا": "Saisissez un numéro de téléphone valide",
  "أدخل كلمة المرور الحالية ثم الجديدة.": "Saisissez le mot de passe actuel puis le nouveau.",
  "أدخل كلمة المرور...": "Saisissez le mot de passe...",
  "أدخل كلمة مرور المالك لتفعيل الصلاحيات الكاملة:": "Saisissez le mot de passe du propriétaire pour activer les droits complets :",
  "أدخل مبلغ التسديد أولاً قبل تمديد الموعد": "Saisissez d'abord le montant payé avant de prolonger l'échéance",
  "أدخل مبلغًا أكبر من صفر": "Saisissez un montant supérieur à zéro",
  "أدخل مبلغًا صحيحًا": "Saisissez un montant valide",
  "أرسل معرّف هذا الجهاز إلى الدعم الفني ليصدر لك كود استرداد موقّع. الكود صالح لهذا الجهاز فقط ولمرة واحدة، ولا يغيّر ترخيصك ولا دورك ولا بياناتك.": "Envoyez l'identifiant de cet appareil au support technique pour obtenir un code de récupération signé. Le code est valable pour cet appareil uniquement et une seule fois, et ne modifie ni votre licence, ni votre rôle, ni vos données.",
  "أسابيع": "Semaines",
  "أشهر": "Mois",
  "أصوات النقر": "Sons des touches",
  "أمين سعدون": "Amine Saadoun",
  "أوراق نقدية": "Billets de banque",
  "أي زبون أو تذكرة أو بيانات تحذفها ستجدها هنا لاسترجاعها أو حذفها نهائياً.": "Tout client, ticket ou donnée que vous supprimez se trouve ici pour être restauré ou supprimé définitivement.",
  "أيام": "jours",
  "إجمالي الأموال المسددة (السيولة المحصلة)": "Total des sommes payées (trésorerie encaissée)",
  "إجمالي الديون المتأخرة:": "Total des dettes en retard :",
  "إجمالي ديون المنضبطين:": "Total des dettes des clients ponctuels :",
  "إدارة كلمة المرور": "Gérer le mot de passe",
  "إدارة وتعديل الفئات": "Gérer et modifier les catégories",
  "إدارة وحذف الفئات": "Gérer et supprimer les catégories",
  "إذا تركته فارغًا فلن تُرسل تذكيرات تلقائية لهذا الدين حتى تحدد موعدًا. الزبائن ذوو يوم السداد الشهري يحصلون على الموعد التالي تلقائيًا.": "Si laissé vide, aucun rappel automatique ne sera envoyé pour cette dette tant qu'une échéance n'est pas définie. Les clients ayant un jour de paie mensuel reçoivent automatiquement la prochaine échéance.",
  "إذا حُدد اليوم يُنبهك التطبيق عند اقتراب أو تأخر موعد السداد.": "Si un jour est défini, l'application vous alerte à l'approche ou en cas de retard de l'échéance.",
  "إذن SMS غير ممنوح": "Permission SMS non accordée",
  "إرسال رسالة تجريبية": "Envoyer un SMS de test",
  "إستعادة": "Restaurer",
  "إضافة زبون جديد": "Ajouter un nouveau client",
  "إضافة فئات جديدة": "Ajouter des catégories",
  "إضافة فئة زبائن جديدة": "Ajouter une catégorie de clients",
  "إعداد الجدولة والقوالب والسجل — الإرسال من هاتف المالك فقط": "Planification, modèles et historique — envoi depuis le téléphone du propriétaire uniquement",
  "إعدادات SMS": "Paramètres SMS",
  "إعدادات الرسائل النصية": "Paramètres des SMS",
  "إعدادات رسائل SMS": "Paramètres des SMS",
  "إظهار رمز QR لاقتران هاتف العامل": "Afficher le QR pour associer le téléphone de l'employé",
  "إغلاق": "Fermer",
  "إقران هاتف جديد": "Associer un nouveau téléphone",
  "إلغاء": "Annuler",
  "إلغاء الاقتران": "Dissocier",
  "ابحث بالاسم أو الهاتف": "Rechercher par nom ou téléphone",
  "ابحث بالاسم أو الهاتف...": "Rechercher par nom ou téléphone...",
  "ابدأ بإدخال المبلغ": "Saisissez un montant",
  "اختبار الإرسال": "Tester l'envoi",
  "اختر الفئة التي تريد نقل الزبون إليها لتمكينه من أخذ الدين مجددًا:": "Choisissez la catégorie vers laquelle transférer le client pour qu'il puisse reprendre une dette :",
  "اختياري": "optionnel",
  "ادخل كود التفعيل من عند الموزع": "Saisissez le code d'activation fourni par le distributeur",
  "استرجاع الحسابات أو البيانات المحذوفة خطأً": "Restaurer les comptes ou données supprimés par erreur",
  "استرجاع كلمة المرور": "Récupérer le mot de passe",
  "اسم الزبون": "Nom du client",
  "اسم الزبون *": "Nom du client *",
  "اسم الفئة الجديدة": "Nom de la nouvelle catégorie",
  "اسم المحل أو التاجر الذي يظهر للزبون": "Nom du magasin ou du commerçant affiché au client",
  "اسم المحل في الرسالة": "Nom du magasin dans le SMS",
  "اضغط على أي زبون للانتقال مباشرة إلى ملفه وكشف حسابه:": "Touchez un client pour ouvrir directement sa fiche et son relevé :",
  "اضغط على عملية لاستعمال نتيجتها": "Touchez une opération pour utiliser son résultat",
  "اضغط لنسخ الكود": "Touchez pour copier le code",
  "اقتران": "Associer",
  "اكتب اسم أو لقب الزبون": "Nom ou surnom du client",
  "اكتب اسم الفئة": "Saisissez le nom de la catégorie",
  "الأجهزة المصرح بها للمتجر:": "Appareils autorisés pour le magasin :",
  "الأجهزة المصرح بها ورخصة المتجر": "Appareils autorisés et licence du magasin",
  "الأيام الافتراضية: 1 و4 و8 و15، ويمكن تغييرها.": "Jours par défaut : 1, 4, 8 et 15 (modifiables).",
  "الأيقونة أو الرمز": "Icône ou symbole",
  "الإحصائيات": "Statistiques",
  "الإحصائيات وخزينة الديون": "Statistiques et trésorerie des dettes",
  "الإرسال متاح داخل تطبيق أندرويد فقط": "L'envoi est disponible uniquement dans l'application Android",
  "الإعدادات": "Paramètres",
  "الافتراضي 09:00–22:00. تُرتّب الرسائل حسب أقدم دين متأخر وتُرسل بالتتابع لتجنب الإرسال الجماعي.": "Par défaut 09:00–22:00. Les SMS sont triés par dette en retard la plus ancienne et envoyés séquentiellement.",
  "الاقتران يتم من هاتف العامل فقط": "L'association se fait uniquement depuis le téléphone de l'employé",
  "الباقي": "Reste",
  "التاريخ: {}": "Date : {}",
  "التخزين الآمن غير متاح": "Stockage sécurisé indisponible",
  "التذاكر المعلقة (دين غير مرحل)": "Tickets en attente (dette non transférée)",
  "التصنيف": "Catégorie",
  "التنبيهات": "Alertes",
  "التنبيهات والإشعارات الذكية": "Alertes et notifications intelligentes",
  "التنبيهات والمواعيد": "Alertes et échéances",
  "التنقل": "Navigation",
  "الحذف التام": "Suppression définitive",
  "الحساب بالسنتيم بالعامية": "Affichage des montants en centimes",
  "الحمد لله، لا يوجد أي زبون متأخر عن موعد السداد ✅": "Aucun client en retard sur son échéance, Dieu merci ✅",
  "الدين الحالي": "Dette actuelle",
  "الدين القديم:": "Ancienne dette :",
  "الدين المحدد غير موجود أو تمت تسويته": "La dette sélectionnée est introuvable ou déjà soldée",
  "الدين المراد تمديده": "Dette à prolonger",
  "الديون المضمونة": "Dettes garanties",
  "الراتب بعد": "Paie dans",
  "الرمز صالح 5 دقائق ولاستخدام واحد": "Code valable 5 minutes et à usage unique",
  "الزبائن المتأخرون عن موعد السداد": "Clients en retard sur leur échéance",
  "الزبائن المديونون": "Clients débiteurs",
  "الزبائن المنضبطون في وقتهم": "Clients qui paient à temps",
  "الزبون «{}» في القائمة السوداء حالياً. هل تريد رفع الحظر عنه وترحيل تذكرة #{} ({} دج) لحسابه؟": "Le client « {} » est actuellement sur liste noire. Lever le blocage et transférer le ticket #{} ({} DA) à son compte ?",
  "الزبون: {}": "Client : {}",
  "الساعة {}": "Heure {}",
  "السقف": "Plafond",
  "السقف المسموح: {} دج": "Plafond autorisé : {} DA",
  "السلام عليكم، أريد تفعيل رخصة تطبيق DEYN لمعرف جهازي.": "Bonjour, je souhaite activer la licence de l'application DEYN pour l'identifiant de mon appareil.",
  "السماح بإرسال تذكيرات SMS لهذا الزبون": "Autoriser l'envoi de rappels SMS à ce client",
  "السماح له بأخذ دين جديد ونقله للزبائن النشطين": "L'autoriser à reprendre une dette et le transférer aux clients actifs",
  "السيد": "Monsieur",
  "السيد / Monsieur": "Monsieur",
  "السيدة": "Madame",
  "السيدة / Madame": "Madame",
  "الصفحة 1 من 1": "Page 1 sur 1",
  "الصق الكود يدوياً بالضغط المطوّل داخل الخانة": "Collez le code manuellement par appui long dans le champ",
  "العامل هو من يبدأ الاتصال": "C'est l'employé qui lance la connexion",
  "العربية": "Arabe",
  "العربية • Français": "Français • Arabe",
  "العناصر المحفوظة مؤقتاً:": "Éléments conservés temporairement :",
  "الفاصل بين الرسائل (بالدقائق)": "Intervalle entre les SMS (en minutes)",
  "القائمة السوداء": "Liste noire",
  "القالب العربي": "Modèle arabe",
  "القالب الفرنسي": "Modèle français",
  "القالب طويل جدًا — الحد الأقصى 500 حرف لكل لغة": "Le modèle est trop long — maximum 500 caractères par langue",
  "الكل": "Tous",
  "اللغة / Langue": "Langue",
  "اللقب": "Civilité",
  "المبلغ (دج)": "Montant (DA)",
  "المبلغ المديون به (من الكراس القديم إن وجد)": "Montant dû (de l'ancien carnet, le cas échéant)",
  "المبلغ المسجّل": "Montant enregistré",
  "المبلغ المسدد (دج)": "Montant payé (DA)",
  "المبلغ المسدد أكبر من مجموع الدين الحالي والسلعة الجديدة": "Le montant payé dépasse le total de la dette actuelle et du nouvel article",
  "المبلغ المسدد أكبر من مجموع الدين والسلعة": "Le montant payé dépasse le total de la dette et de l'article",
  "المتأخرون ({})": "En retard ({})",
  "المتغيرات: {title} اللقب، {name} الاسم، {amount} المبلغ، {date} تاريخ الاستحقاق، {store} اسم المحل إن كان موجودًا في ملف المتجر. الإعداد الحالي لا يحتوي على اسم متجر، لذلك لن يُضاف اسم غير موجود. الرسائل الطويلة قد تُحسب عدة وحدات SMS حسب شركة الاتصالات.": "Variables : {title} civilité, {name} nom, {amount} montant, {date} date d'échéance, {store} nom du magasin. Les messages longs peuvent compter pour plusieurs unités SMS selon l'opérateur.",
  "المدة": "Durée",
  "المزامنة بين الهاتفين": "Synchronisation entre les deux téléphones",
  "المزامنة تتم تلقائيًا عند اتصال هاتف العامل": "La synchronisation se fait automatiquement lorsque le téléphone de l'employé se connecte",
  "المزامنة غير متاحة على هذا الجهاز": "La synchronisation n'est pas disponible sur cet appareil",
  "المزامنة غير متاحة في هذا الإصدار/الجهاز.": "La synchronisation n'est pas disponible dans cette version/sur cet appareil.",
  "المنضبطون ({})": "Ponctuels ({})",
  "النوع:": "Type :",
  "الهاتف": "Téléphone",
  "الوحدة": "Unité",
  "الوسم: {}": "Étiquette : {}",
  "اليوم {}": "Jour {}",
  "اليوم موعد السداد المحدد ({} في الشهر)": "Aujourd'hui est le jour de paiement prévu (le {} du mois)",
  "انتهت صلاحية الرمز": "Le code a expiré",
  "انتهت صلاحية كود الاسترداد": "Le code de récupération a expiré",
  "انتهت مدة الترخيص — أدخل كود تفعيل جديد": "La licence a expiré — saisissez un nouveau code d'activation",
  "انقر لتعديل الملاحظة": "Touchez pour modifier la note",
  "بداية الإرسال (ثابتة)": "Début d'envoi (fixe)",
  "بداية الإرسال ثابتة 09:00": "Début d'envoi fixe à 09:00",
  "بدون رقم": "Sans numéro",
  "بدون سقف أقصى": "Sans plafond maximal",
  "بدون لقب": "Sans titre",
  "بدون وسم": "Sans étiquette",
  "بطالة / عمال يوميون": "Sans emploi / journaliers",
  "بيانات هذا الهاتف تجريبية": "Les données de ce téléphone sont des données de démonstration",
  "تأكيد": "Confirmer",
  "تأكيد الدين": "Confirmer la dette",
  "تأكيد العملية": "Confirmer l'opération",
  "تأكيد رغم تجاوز السقف": "Confirmer malgré le dépassement du plafond",
  "تأكيد كلمة المرور *": "Confirmer le mot de passe *",
  "تأكيد كلمة المرور غير مطابق": "La confirmation du mot de passe ne correspond pas",
  "تاريخ النسخة:": "Date de la copie :",
  "تتم عبر شبكة Wi-Fi المحلية فقط ومشفّرة من طرف إلى طرف، دون خادم سحابي. يعمل التطبيق دون إنترنت دائمًا، وتُرسل التغييرات عند توفر الاتصال.": "Elle se fait uniquement via le Wi-Fi local, chiffrée de bout en bout, sans serveur cloud. L'application fonctionne toujours sans internet et les modifications sont envoyées dès que la connexion est disponible.",
  "تحذير: ديون حرجة تحتاج تدخلاً": "Attention : dettes critiques nécessitant une intervention",
  "تحقق من الأيام والساعات والفاصل الزمني": "Vérifiez les jours, les heures et l'intervalle",
  "تحقق من مدة التمديد": "Vérifiez la durée de prolongation",
  "تحقق وتعيين كلمة مرور جديدة": "Vérifier et définir un nouveau mot de passe",
  "تذكرة": "Ticket",
  "تذكرة #{}": "Ticket #{}",
  "تذكرة #{} —": "Ticket #{} —",
  "تذكرة معلقة #{} ({} دج)": "Ticket en attente #{} ({} DA)",
  "تذكيرات SMS للزبائن": "Rappels SMS aux clients",
  "تراجع": "Annuler",
  "ترتيب جميع المديونين تنازلياً": "Classement de tous les débiteurs par ordre décroissant",
  "ترحيل للزبون": "Transférer au client",
  "ترسل الرسائل من شريحة هاتف المالك فقط. يجب توفر رصيد SMS وشبكة الهاتف. قبول أندرويد للرسالة لا يعني تأكيد وصولها إلى هاتف الزبون.": "Les SMS sont envoyés uniquement depuis la carte SIM du propriétaire. Un crédit SMS et le réseau mobile sont requis. L'acceptation par Android ne garantit pas la réception par le client.",
  "تسجيل دين جديد": "Enregistrer une nouvelle dette",
  "تسجيل ديون وتسديد فقط • الحذف مقفل 🔒": "Enregistrement de dettes et paiements uniquement • suppression verrouillée 🔒",
  "تسديد": "Paiement",
  "تسديد دفعة مع سلعة جديدة": "Paiement avec un nouvel article",
  "تسديد دين": "Payer une dette",
  "تسيير الديون بكل سهولة": "Gérez vos dettes en toute simplicité",
  "تصفير شامل": "Remise à zéro totale",
  "تصنيف الزبون *": "Catégorie du client *",
  "تطبيق DEYN مقفل": "Application DEYN verrouillée",
  "تطبيق DEYN — تسيير الديون بكل سهولة وبدون إنترنت": "Application DEYN — gérez vos dettes simplement et sans internet",
  "تطبيق آمن ويشتغل بدون انترنت": "Application sécurisée qui fonctionne sans internet",
  "تعديل إعدادات الرسائل": "Modifier les paramètres SMS",
  "تعديل البيانات": "Modifier les données",
  "تعديل بيانات الزبائن": "Modifier les données des clients",
  "تعديل بيانات الزبون": "Modifier les données du client",
  "تعديل ملاحظة التذكرة": "Modifier la note du ticket",
  "تعذر إرسال الاختبار:": "Échec de l'envoi du test :",
  "تعذر إرسال الاختبار: {}": "Échec de l'envoi du test : {}",
  "تعذّر إتمام التفعيل الآمن": "Impossible de terminer l'activation sécurisée",
  "تعذّر إنشاء ملف الإنقاذ. لا تمسح بيانات التطبيق.": "Impossible de créer le fichier de secours. N'effacez pas les données de l'application.",
  "تعذّر الاقتران — تأكد من الشبكة ومن أن الرمز لم ينتهِ": "Association impossible — vérifiez le réseau et que le code n'a pas expiré",
  "تعذّر التحقق من حفظ بيانات الترخيص": "Impossible de vérifier l'enregistrement de la licence",
  "تعذّر النسخ": "Copie impossible",
  "تعذّر النسخ — اضغط مطولاً على المعرّف": "Copie impossible — appuyez longuement sur l'identifiant",
  "تعذّر النسخ — اضغط مطولاً على المعرّف لنسخه": "Copie impossible — appuyez longuement sur l'identifiant pour le copier",
  "تعذّر تحميل النسخة": "Impossible de charger la copie",
  "تعذّر تشغيل الحماية الآمنة:": "Impossible de démarrer la protection sécurisée :",
  "تعذّر تشغيل الحماية الآمنة: {}": "Impossible de démarrer la protection sécurisée : {}",
  "تعذّر حفظ آخر تغيير. أوقفنا الاستخدام حتى لا تواصل إدخال بيانات قد لا تُحفظ.": "Impossible d'enregistrer la dernière modification. Nous avons arrêté l'utilisation pour éviter de saisir des données qui pourraient ne pas être sauvegardées.",
  "تعذّر حفظ سجل الاسترداد — لم يُستعمل الكود": "Impossible d'enregistrer le registre de récupération — le code n'a pas été utilisé",
  "تعذّر حفظ كلمة المرور بأمان": "Impossible d'enregistrer le mot de passe en toute sécurité",
  "تعذّر قراءة بيانات DEYN بشكل سليم. لم نستبدلها بالبيانات التجريبية ولم نحذفها.": "Impossible de lire correctement les données DEYN. Nous ne les avons ni remplacées par des données de démonstration ni supprimées.",
  "تعذّر مسح الرمز:": "Échec du scan :",
  "تعذّر مسح الرمز: {}": "Échec du scan : {}",
  "تعذّرت المزامنة": "Échec de la synchronisation",
  "تعذّرت المزامنة:": "Échec de la synchronisation :",
  "تعذّرت المزامنة: {}": "Échec de la synchronisation : {}",
  "تعذّرت المزامنة: {} — ستُعاد المحاولة تلقائيًا": "Échec de la synchronisation : {} — nouvelle tentative automatique",
  "تعذّرت قراءة سجل الاسترداد بأمان": "Impossible de lire le registre de récupération en toute sécurité",
  "تعذّرت قراءة سجل التفعيل بأمان": "Impossible de lire le registre d'activation en toute sécurité",
  "تعيين كلمة المرور أو تغييرها (الاسترجاع بكود موقّع من الدعم)": "Définir ou changer le mot de passe (récupération par code signé du support)",
  "تعيين كلمة مرور المالك": "Définir le mot de passe du propriétaire",
  "تغيير كلمة المرور": "Changer le mot de passe",
  "تفاصيل السلعة أو الملاحظة": "Détails de l'article ou note",
  "تفريغ السلة نهائياً": "Vider la corbeille définitivement",
  "تفريغ سلة المهملات": "Vider la corbeille",
  "تفريغ نهائي": "Vider définitivement",
  "تفعيل": "Activer",
  "تفعيل DEYN": "Activer DEYN",
  "تفعيل الرسائل النصية": "Activer les rappels SMS",
  "تفعيل وضع المالك": "Activer le mode propriétaire",
  "تلقائي (عربي)": "Automatique (Arabe)",
  "تم إرسال رسالة الاختبار إلى الشبكة بنجاح": "SMS de test envoyé au réseau mobile avec succès",
  "تم إرسال رسالة الاختبار وتأكيد تسليمها إلى الهاتف": "SMS de test envoyé et livraison confirmée sur le téléphone",
  "تم إيقاف SMS لأن إذن الرسائل غير متاح": "SMS désactivés car la permission d'envoi n'est pas accordée",
  "تم إيقاف التفعيل بسبب تغيير غير طبيعي في ساعة الجهاز": "Activation suspendue à cause d'un changement anormal de l'horloge de l'appareil",
  "تم إيقاف جميع رسائل SMS مؤقتًا": "Tous les rappels SMS ont été temporairement désactivés",
  "تم استخدام الرمز ✅": "Code utilisé ✅",
  "تم استرجاع آخر نسخة سليمة من بياناتك بعد اكتشاف تلف في النسخة الأحدث ⚠️": "La dernière copie saine de vos données a été restaurée après détection d'un dommage dans la plus récente ⚠️",
  "تم الاقتران والمزامنة بنجاح ✅": "Association et synchronisation réussies ✅",
  "تم التحقق من كود الاسترداد ✅ عيّن كلمة مرور جديدة": "Code de récupération vérifié ✅ Définissez un nouveau mot de passe",
  "تم الترحيل إلى {} — تجاوز السقف": "Transféré à {} — plafond dépassé",
  "تم التسديد ورُفع الحظر عن {} وأصبح بإمكانه أخذ الدين بنجاح ✅": "Paiement effectué et blocage levé pour {} : il peut de nouveau prendre une dette ✅",
  "تم الحذف التام نهائياً": "Suppression définitive effectuée",
  "تم الحفظ — تذكرة #{} ({} دج)": "Enregistré — ticket #{} ({} DA)",
  "تم ترحيل {} دج إلى {}": "{} DA transférés à {}",
  "تم تسديد {} دج وإضافة سلعة بـ {} دج — الباقي {} دج": "{} DA payés et article de {} DA ajouté — reste {} DA",
  "تم تسديد {} دج — الباقي {} دج": "{} DA payés — reste {} DA",
  "تم تعيين كلمة المرور الجديدة بنجاح 🔒": "Nouveau mot de passe défini avec succès 🔒",
  "تم تفريغ سلة المهملات نهائياً": "Corbeille vidée définitivement",
  "تم تفعيل SMS للزبائن الذين لديهم أرقام هاتف": "SMS activés pour les clients disposant d'un numéro de téléphone",
  "تم تفعيل وضع العامل (تسجيل وتسديد فقط • الحذف مقفل 🔒)": "Mode employé activé (enregistrement et paiement uniquement • suppression verrouillée 🔒)",
  "تم تفعيل وضع المالك بنجاح (صلاحيات كاملة) 👑": "Mode propriétaire activé (droits complets) 👑",
  "تم حذف البيانات ونقلها لسلة المهملات (يمكنك استرجاعها) ✅": "Données supprimées et déplacées vers la corbeille (vous pouvez les restaurer) ✅",
  "تم حذف فئة «{}» بنجاح": "Catégorie « {} » supprimée avec succès",
  "تم حفظ إعدادات SMS بنجاح": "Paramètres SMS enregistrés avec succès",
  "تم حفظ التعديلات": "Modifications enregistrées",
  "تم حفظ ملاحظة التذكرة": "Note du ticket enregistrée",
  "تم رصد إرجاع وقت الهاتف. يرجى ضبط الساعة الحقيقية لمتابعة العمل.": "Un retour en arrière de l'horloge du téléphone a été détecté. Réglez l'heure réelle pour continuer.",
  "تم رفع الحظر عن {} وترحيل {} دج لحسابه بنجاح ✅": "Blocage levé pour {} et {} DA transférés à son compte ✅",
  "تم رفع الحظر عن {} ونقله إلى «{}» بنجاح ✅": "Blocage levé pour {} et client transféré vers « {} » ✅",
  "تم مسح البيانات": "Données effacées",
  "تم مسح الذاكرة": "Mémoire effacée",
  "تم نسخ {} بنجاح 📋": "{} copié avec succès 📋",
  "تم نسخ كشف الحساب": "Relevé de compte copié",
  "تم نسخ معرّف الجهاز بنجاح": "Identifiant de l'appareil copié avec succès",
  "تم نسخ معرّف الجهاز 📋": "Identifiant de l'appareil copié 📋",
  "تم نقل التذكرة إلى سلة المهملات": "Ticket déplacé vers la corbeille",
  "تم نقل الزبون إلى سلة المهملات (يمكنك استرجاعه)": "Client déplacé vers la corbeille (vous pouvez le restaurer)",
  "تمت إستعادة التذكرة بنجاح ✅": "Ticket restauré avec succès ✅",
  "تمت إستعادة الزبون «{}» بنجاح ✅": "Client « {} » restauré avec succès ✅",
  "تمت إستعادة جميع البيانات بنجاح ✅": "Toutes les données ont été restaurées ✅",
  "تمت إضافة {} بنجاح": "{} ajouté avec succès",
  "تمت إضافة {} دج على {}": "{} DA ajoutés à {}",
  "تمت إضافة {} مع رصيد سابق {} دج": "{} ajouté avec un solde antérieur de {} DA",
  "تمت إضافة سلعة بـ {} دج — الدين الحالي {} دج": "Article de {} DA ajouté — dette actuelle {} DA",
  "تمت إضافة فئة «{}»": "Catégorie « {} » ajoutée",
  "تمت الإضافة — الزبون تجاوز السقف": "Ajouté — le client a dépassé le plafond",
  "تمت المزامنة بنجاح ✅": "Synchronisation réussie ✅",
  "تمت المزامنة ✅": "Synchronisation terminée ✅",
  "تمت المزامنة ✅ (أُرسل": "Synchronisation terminée ✅ (envoyés",
  "تمت المزامنة ✅ (أُرسل {} • استُلم {})": "Synchronisation terminée ✅ (envoyés {} • reçus {})",
  "تمديد موعد دين بعد هذه الدفعة (اختياري)": "Prolonger l'échéance d'une dette après ce paiement (optionnel)",
  "تموين": "Courses",
  "تموين الشهر": "Courses du mois",
  "تموين كبير": "Grosses courses",
  "تنبيه تلقائي بمواعيد السداد وتجاوز السقف": "Alerte automatique sur les échéances et les dépassements de plafond",
  "تنبيه نشط": "Alerte active",
  "تنبيه: تشفير البيانات غير متاح على هذا الجهاز، تعمل بياناتك دون تشفير ⚠️": "Attention : le chiffrement des données n'est pas disponible sur cet appareil, vos données ne sont pas chiffrées ⚠️",
  "توجد {} زبائن مسجلين في فئة «{}». سيتم نقلهم تلقائياً إلى الفئة المتبقية.": "{} client(s) sont enregistrés dans la catégorie « {} ». Ils seront transférés automatiquement vers la catégorie restante.",
  "توزيع الديون على فئات المتجر": "Répartition des dettes par catégorie du magasin",
  "توزيع الفئات ({})": "Répartition par catégorie ({})",
  "توقّف مؤقت لحماية بياناتك": "Arrêt temporaire pour protéger vos données",
  "ثانية": "seconde",
  "جاري": "Compte courant",
  "جارٍ الاقتران…": "Association en cours…",
  "جدول التذكير بعد الاستحقاق": "Calendrier des rappels après l'échéance",
  "جرّب اسمًا آخر أو أضف زبونًا جديدًا.": "Essayez un autre nom ou ajoutez un nouveau client.",
  "جميع الزبائن ملتزمون بمواعيد السداد وسقوف الديون المحددة.": "Tous les clients respectent les échéances et les plafonds de dette fixés.",
  "جهازان فقط 🔒": "2 appareils maximum 🔒",
  "حالة الإرسال غير مؤكدة — لم نعد المحاولة لتجنب التكرار": "État d'envoi incertain — non renvoyé pour éviter les doublons",
  "حذف": "Supprimer",
  "حذف البيانات": "Supprimer les données",
  "حذف التذاكر": "Supprimer les tickets",
  "حذف التذكرة": "Supprimer le ticket",
  "حذف الزبائن": "Supprimer les clients",
  "حذف الزبون": "Supprimer le client",
  "حذف الفئات": "Supprimer les catégories",
  "حذف الفئة": "Supprimer la catégorie",
  "حذف تام": "Suppression définitive",
  "حذف تام نهائياً": "Suppression définitive",
  "حذف فئة «{}»": "Supprimer la catégorie « {} »",
  "حذف وتصفير البيانات": "Supprimer et remettre à zéro les données",
  "حساب بدون ديون": "Compte sans dettes",
  "حساب سريع": "Calcul rapide",
  "حساب محظور (القائمة السوداء)": "Compte bloqué (liste noire)",
  "حساب محظور — لا يمكن إضافة دين جديد": "Compte bloqué — impossible d'ajouter une nouvelle dette",
  "حفظ": "Enregistrer",
  "حفظ الإعدادات": "Enregistrer les paramètres",
  "حفظ التعديلات": "Enregistrer les modifications",
  "حفظ الزبون": "Enregistrer le client",
  "حفظ الفئات": "Enregistrer les catégories",
  "حفظ الفئة": "Enregistrer la catégorie",
  "حفظ الملاحظة": "Enregistrer la note",
  "حفظ كلمة المرور": "Enregistrer le mot de passe",
  "حفظ ملف JSON": "Enregistrer en JSON",
  "حفظ ملف PDF": "Enregistrer en PDF",
  "حفظ نسخة إنقاذ من البيانات الموجودة": "Enregistrer une copie de secours des données existantes",
  "حليب وخبز": "Lait et pain",
  "حمزة بلقاسم": "Hamza Belkacem",
  "خبز وحليب": "Pain et lait",
  "خديجة لعروسي": "Khadidja Laroussi",
  "خزينة الديون الكلية في السوق": "Trésorerie totale des dettes sur le marché",
  "خضر وفواكه": "Fruits et légumes",
  "خطأ غير معروف": "Erreur inconnue",
  "دج": "DA",
  "دج{}": "DA{}",
  "دعم فني وتفعيل": "Assistance et activation",
  "دفتر الزبائن": "Carnet des clients",
  "دفتر حسابات مفرغ بالكامل": "Carnet de comptes entièrement vidé",
  "دقيقة": "minute",
  "دين": "Dette",
  "دين سابق من الكراس القديم": "Dette antérieure de l'ancien carnet",
  "دين سريع": "Dette rapide",
  "دين متبقي: {} دج ({})": "Dette restante : {} DA ({})",
  "دين معلق": "Dette en attente",
  "ديون متأخرة عن موعدها": "Dettes en retard sur leur échéance",
  "ديون مضمونة": "Dettes garanties",
  "ديون معلقة": "Dettes en attente",
  "ربط هاتف المالك بهاتف العامل عبر Wi-Fi المحلي دون إنترنت": "Reliez le téléphone du propriétaire à celui de l'employé via le Wi-Fi local, sans internet",
  "رسالة الاختبار تجاوزت حد الرسالة الواحدة": "Le SMS de test dépasse la limite d'un segment",
  "رسالة الاختبار سبق إرسالها": "Ce SMS de test a déjà été envoyé",
  "رسالة تجريبية": "SMS de test",
  "رشيد قرين": "Rachid Guerine",
  "رفع الحظر عن الزبون": "Lever le blocage du client",
  "رفع الحظر عن الزبون بعد التسديد": "Lever le blocage du client après paiement",
  "رفع الحظر والترحيل": "Lever le blocage et transférer",
  "رفع الحظر وترحيل التذكرة": "Lever le blocage et transférer le ticket",
  "رفع الحظر وتغيير الفئات": "Lever le blocage et changer de catégorie",
  "رقم الهاتف (اختياري)": "Numéro de téléphone (optionnel)",
  "رقم الهاتف الذي تريد إرسال الاختبار إليه": "Numéro de téléphone pour l'envoi du test",
  "رمز الاقتران (امسح QR من هاتف المالك أو الصقه هنا)": "Code d'association (scannez le QR du propriétaire ou collez-le ici)",
  "رمز الاقتران غير صالح": "Code d'association invalide",
  "زبائن هذه الفئة يسددون في موعدهم تلقائياً": "Les clients de cette catégorie paient automatiquement à l'échéance",
  "زبون": "client",
  "زيادة دين": "Augmenter la dette",
  "زيت وسميد": "Huile et semoule",
  "ساعة": "heures",
  "ساعة. صحّح ساعة الجهاز أو اتصل بالإنترنت.": "heure(s). Corrigez l'horloge de l'appareil ou connectez-vous à internet.",
  "سجائر ومشروبات": "Cigarettes et boissons",
  "سجل التفعيل غير صالح": "Le registre d'activation est invalide",
  "سجل الرسائل": "Historique des SMS",
  "سجل العمليات": "Historique des opérations",
  "سجل رسائل SMS": "Historique des SMS",
  "سجّل مبلغًا من «دين سريع» ثم اضغط حفظ، وسيظهر هنا حتى ترحّله إلى زبون.": "Saisissez un montant dans « Dette rapide » puis touchez Enregistrer ; il restera ici jusqu'à son transfert à un client.",
  "سدّد كامل": "Tout payer",
  "سفيان مرابط": "Sofiane Merabet",
  "سقف الدين الأقصى (اختياري)": "Plafond de dette maximal (optionnel)",
  "سقف الدين التلقائي لهذه الفئة (دج)": "Plafond de dette automatique de cette catégorie (DA)",
  "سقف تلقائي: {} دج": "Plafond automatique : {} DA",
  "سلة المهملات": "Corbeille",
  "سلة المهملات فارغة": "La corbeille est vide",
  "سلعة جديدة: {}": "Nouvel article : {}",
  "سلعة مأخوذة مع التسديد": "Article pris avec le paiement",
  "سيتم استبدال البيانات التجريبية ببيانات هاتف المالك. هل تريد المتابعة؟": "Les données de démonstration seront remplacées par celles du téléphone du propriétaire. Continuer ?",
  "سيتم حذف جميع العناصر الموجودة في سلة المهملات نهائياً وبلا رجعة. هل أنت متأكد؟": "Tous les éléments de la corbeille seront supprimés définitivement et sans retour. Êtes-vous sûr ?",
  "سيتم حذف كل الزبائن والتذاكر والسجلات. لا يمكن التراجع.": "Tous les clients, tickets et enregistrements seront supprimés. Action irréversible.",
  "سيتم مسح هذا العنصر نهائياً ولن يمكنك استرجاعه أبداً. هل تريد المتابعة؟": "Cet élément sera effacé définitivement et ne pourra jamais être restauré. Continuer ?",
  "سيتم نقل تذكرة #{} ({} دج) إلى سلة المهملات.": "Le ticket #{} ({} DA) sera déplacé vers la corbeille.",
  "سير ديونك بطريقة سهلة وذكية": "Gérez vos dettes de façon simple et intelligente",
  "سيولة آمنة ومستقرة جداً": "Trésorerie sûre et très stable",
  "سيولة مقبولة • يلزم متابعة المتأخرين": "Trésorerie correcte • suivre les retardataires",
  "سيُنقل حساب {} إلى سلة المهملات.": "Le compte de {} sera déplacé vers la corbeille.",
  "شكرًا على ثقتكم 🤝": "Merci de votre confiance 🤝",
  "شهارة": "Salariés (paie mensuelle)",
  "صافي الدين المتبقي الجديد:": "Nouvelle dette nette restante :",
  "صلاحيات كاملة • صالح لغاية: {}": "Droits complets • valable jusqu'au : {}",
  "طلب كلمة المرور عند فتح التطبيق لحماية الخصوصية": "Demander le mot de passe à l'ouverture pour protéger la confidentialité",
  "ع": "AR",
  "عبد الحق شريف": "Abdelhak Chérif",
  "عدد الزبائن المديونين": "Nombre de clients débiteurs",
  "عذراً، {} خاصة بصاحب المحل فقط 🔒": "Désolé, « {} » est réservé au propriétaire 🔒",
  "عذراً، تعديل بيانات الزبائن متاح لصاحب المحل فقط 🔒": "Désolé, la modification des clients est réservée au propriétaire 🔒",
  "عذراً، قفل التطبيق خاص بصاحب المحل فقط 🔒": "Désolé, le verrouillage de l'application est réservé au propriétaire 🔒",
  "عرض / تعديل القالب العربي": "Afficher / modifier le modèle arabe",
  "على هاتفك أو طباعتها مباشرة على الورق.": "sur votre téléphone ou l'imprimer directement sur papier.",
  "عمي مراد": "Ammi Mourad",
  "عند التفعيل، يتم تمكين كل الزبائن الذين لديهم رقم هاتف. يمكنك تعطيل أي زبون بشكل فردي.": "À l'activation, tous les clients ayant un numéro de téléphone sont activés. Vous pouvez désactiver chaque client individuellement.",
  "عنوان المالك غير معروف: أعد الاقتران بمسح رمز QR": "Adresse du propriétaire inconnue : réassociez en scannant le QR",
  "عيّن كلمة مرور المالك أولاً ثم فعّل القفل": "Définissez d'abord le mot de passe du propriétaire puis activez le verrouillage",
  "غير محدد": "Non défini",
  "فارغة": "vide",
  "فتح التطبيق 🔓": "Ouvrir l'application 🔓",
  "فترة الإرسال والتوزيع": "Plage horaire et cadence d'envoi",
  "فشل إرسال رسالة الاختبار إلى الشبكة": "Échec de l'envoi du SMS de test au réseau",
  "فشل جزئي في إرسال الاختبار ({}/{})": "Échec partiel de l'envoi du test ({}/{})",
  "قبل": "il y a",
  "قبل {} دقيقة": "il y a {} minute(s)",
  "قبل {} ساعة": "il y a {} heure(s)",
  "قبل {} يوم": "il y a {} jour(s)",
  "قبل أندرويد إرسال اختبار قصير (رسالة واحدة)": "Android a accepté l'envoi du SMS de test",
  "قبل أندرويد الإرسال": "Envoi accepté par Android",
  "قبل لحظات": "il y a un instant",
  "قَبِل أندرويد طلب الإرسال وبانتظار تأكيد الشبكة": "Demande acceptée par Android, en attente de confirmation réseau",
  "قطع نقدية": "Pièces de monnaie",
  "قفل التطبيق بكلمة المرور": "Verrouiller l'application par mot de passe",
  "قوالب الرسائل القابلة للتعديل": "Modèles de SMS personnalisables",
  "كامل الدين": "Toute la dette",
  "كبار الديون ({})": "Plus grosses dettes ({})",
  "كراس حسابات ورقي مقروء (PDF)": "Carnet de comptes papier lisible (PDF)",
  "كراس ديون المتجر — DEYN": "Carnet de dettes du magasin — DEYN",
  "كراس ديون المتجر — DEYN — {}": "Carnet de dettes du magasin — DEYN — {}",
  "كل من يحمل ديناً في المحل مرتبين من أعلى قيمة إلى الأقل:": "Tous ceux qui ont une dette au magasin, classés du montant le plus élevé au plus faible :",
  "كلمة المرور الجديدة * ({} أحرف أو أرقام على الأقل)": "Nouveau mot de passe * (au moins {} caractères)",
  "كلمة المرور الجديدة يجب أن تتكون من {} أحرف أو أرقام على الأقل": "Le nouveau mot de passe doit comporter au moins {} caractères",
  "كلمة المرور الحالية *": "Mot de passe actuel *",
  "كلمة المرور الرئيسية": "Mot de passe principal",
  "كلمة المرور تحمي وضع المالك وقفل التطبيق. لا توجد كلمة مرور افتراضية ولا يمكن لأحد تجاوزها.": "Le mot de passe protège le mode propriétaire et le verrouillage de l'application. Il n'existe aucun mot de passe par défaut et personne ne peut le contourner.",
  "كلمة المرور غير صحيحة ❌": "Mot de passe incorrect ❌",
  "كمال بوعزيز": "Kamel Bouaziz",
  "كود الاسترداد *": "Code de récupération *",
  "كود الاسترداد غير صالح": "Code de récupération invalide",
  "كود التفعيل": "Code d'activation",
  "كود التفعيل غير صالح لهذا الجهاز أو انتهت صلاحيته": "Code d'activation invalide pour cet appareil ou expiré",
  "كود الهاتف الرئيسي (صاحب المحل):": "Code du téléphone principal (propriétaire) :",
  "كود هاتف العامل": "Code du téléphone employé",
  "كود هاتف العامل:": "Code du téléphone employé :",
  "كود هاتف صاحب المحل (الرئيسي)": "Code du téléphone du propriétaire (principal)",
  "لأي استفسار، مساعدة أو تفعيل رخصة المتجر:": "Pour toute question, aide ou activation de la licence du magasin :",
  "لا تحذف التطبيق، ولا تمسح بياناته أو ذاكرته المؤقتة، ولا تضغط على إعادة التصفير.": "Ne désinstallez pas l'application, n'effacez ni ses données ni son cache, et ne touchez pas à la réinitialisation.",
  "لا توجد تنبيهات": "Aucune alerte",
  "لا توجد تنبيهات حالياً": "Aucune alerte pour le moment",
  "لا توجد ديون مسجلة حالياً": "Aucune dette enregistrée pour le moment",
  "لا توجد ديون مسجلة حالياً، الحمد لله.": "Aucune dette enregistrée pour le moment, Dieu merci.",
  "لا توجد ديون معلقة": "Aucune dette en attente",
  "لا توجد رسائل في السجل بعد": "Aucun SMS dans l'historique pour le moment",
  "لا توجد سجلات كافية حالياً": "Pas assez d'enregistrements pour le moment",
  "لا توجد عمليات بعد": "Aucune opération pour l'instant",
  "لا توجد فئات مطابقة": "Aucune catégorie correspondante",
  "لا توجد كلمة مرور للمالك بعد. استخدم كود الاسترداد لتعيين واحدة": "Aucun mot de passe propriétaire pour l'instant. Utilisez le code de récupération pour en définir un",
  "لا جذر لعدد سالب": "Pas de racine d'un nombre négatif",
  "لا شيء للتراجع": "Rien à annuler",
  "لا يمكن القسمة على صفر": "Division par zéro impossible",
  "لا يمكنه أخذ دين جديد حتى يُرفع الحظر": "Il ne peut pas prendre de nouvelle dette tant que le blocage n'est pas levé",
  "لا يوجد اتصال Wi-Fi محلي. اتصل بنفس شبكة الواي فاي ثم أعد المحاولة": "Pas de connexion Wi-Fi locale. Connectez-vous au même réseau Wi-Fi puis réessayez",
  "لا يوجد دين على هذا الزبون": "Ce client n'a aucune dette",
  "لا يوجد زبائن مسجلون في هذه الفئة": "Aucun client enregistré dans cette catégorie",
  "لا يوجد زبون بهذا الاسم": "Aucun client portant ce nom",
  "لا يوجد زبون مطابق": "Aucun client correspondant",
  "لا يوجد هاتف مالك مقترن": "Aucun téléphone propriétaire associé",
  "لا يوجد هاتف مقترن بعد.": "Aucun téléphone associé pour l'instant.",
  "لاحقاً": "Plus tard",
  "لحماية سجلات وديون متجرك من التطفل، يرجى إدخال كلمة المرور:": "Pour protéger les registres et dettes de votre magasin, saisissez le mot de passe :",
  "لصق": "Coller",
  "لصق كود التفعيل": "Coller le code d'activation",
  "لغة الرسالة": "Langue du SMS",
  "للتواصل معنا": "Nous contacter",
  "لم تنجح بعد": "Aucun succès pour l'instant",
  "لم يتم منح إذن إرسال الرسائل، بقيت الميزة متوقفة": "Permission SMS refusée, la fonctionnalité reste désactivée",
  "لن يتمكن هذا الهاتف من المزامنة بعد الآن. لن تُحذف أي بيانات من أي هاتف.": "Ce téléphone ne pourra plus se synchroniser. Aucune donnée ne sera supprimée d'aucun téléphone.",
  "ليجان (الشباب)": "Jeunes (Lidjan)",
  "مؤشر الأمان": "Indice de sécurité",
  "مؤشر الاستقرار وصحة التحصيل:": "Indice de stabilité et de santé du recouvrement :",
  "مبلغ التسديد أكبر من مجموع الدين والسلعة الجديدة": "Le montant payé dépasse le total de la dette et du nouvel article",
  "مبلغ الدين الحالي": "Montant de la dette actuelle",
  "متأخر عن موعد السداد بـ 2 يومين (كان يوم {})": "En retard sur l'échéance de 2 jours (c'était le {})",
  "متأخر عن موعد السداد بـ {} {} (كان يوم {})": "En retard sur l'échéance de {1} {2} (c'était le {3})",
  "متابعة": "Continuer",
  "مثال: 27 (اختياري)": "Exemple : 27 (optionnel)",
  "مثال: بنائين، عائلة، تجار جملة...": "Exemple : maçons, famille, grossistes...",
  "مثال: جاري": "Exemple : courant",
  "مثال: خبز وحليب": "Exemple : pain et lait",
  "مثال: دفعة من الحساب، أو تفاصيل السلعة المأخوذة...": "Exemple : acompte, ou détails de l'article pris...",
  "مثال: زيت وسكر، أو قهوة وحليب...": "Exemple : huile et sucre, ou café et lait...",
  "مثال: محل الأمانة": "Exemple : Magasin El Amana",
  "مجموع الديون في السوق": "Total des dettes sur le marché",
  "مجموع ما استرجعه المحل من الزبائن": "Total récupéré par le magasin auprès des clients",
  "محاولات كثيرة خاطئة. انتظر {} ثانية ⏳": "Trop de tentatives incorrectes. Patientez {} seconde(s) ⏳",
  "محظور": "Bloqué",
  "مدى الحياة": "À vie",
  "مراد زروقي": "Mourad Zerouki",
  "مراسلة عبر واتساب (الدعم الفني)": "Écrire sur WhatsApp (assistance technique)",
  "مرحباً بك مجدداً في DEYN 🔓": "Bon retour dans DEYN 🔓",
  "مزامنة الآن": "Synchroniser maintenant",
  "مسح الكل": "Tout effacer",
  "مسح كل البيانات": "Effacer toutes les données",
  "مشروبات": "Boissons",
  "معاينة كراس الديون الورقي:": "Aperçu du carnet de dettes papier :",
  "معرّف الجهاز": "Identifiant de l'appareil",
  "ملاحظة (اختياري)": "Note (optionnel)",
  "ملاحظة أو تفاصيل السلعة للتذكرة (تُحفظ في حساب الزبون):": "Note ou détails de l'article pour le ticket (enregistrés dans le compte du client) :",
  "ملف الإنقاذ قد يحتوي بيانات خاصة وكلمات مرور قديمة. احتفظ به في مكان آمن ولا ترسله قبل مراجعته.": "Le fichier de secours peut contenir des données privées et d'anciens mots de passe. Gardez-le en lieu sûr et ne l'envoyez pas avant de l'avoir vérifié.",
  "من 3: تم اكتشاف تغيير غير طبيعي في ساعة الجهاز. صحّح التاريخ والوقت.": "sur 3 : un changement anormal de l'horloge a été détecté. Corrigez la date et l'heure.",
  "مواد تنظيف وسكر": "Produits d'entretien et sucre",
  "مواد غذائية": "Produits alimentaires",
  "موعد استحقاق السلعة الجديدة (اختياري)": "Date d'échéance du nouvel article (optionnel)",
  "موعد استحقاق هذا الدين (اختياري)": "Date d'échéance de cette dette (optionnel)",
  "موعد السداد": "Date de paiement",
  "موعد السداد يوم {} من الشهر": "Échéance le {} de chaque mois",
  "موعده {}": "Échéance : {}",
  "ميزة SMS غير متاحة في هذه النسخة": "La fonction SMS n'est pas disponible dans cette version",
  "نادية بن عيسى": "Nadia Ben Aïssa",
  "نسخ": "Copier",
  "نسخ المعرّف": "Copier l'identifiant",
  "نسخ معرّف الجهاز": "Copier l'identifiant de l'appareil",
  "نسخ 📋": "Copier 📋",
  "نسخة ورقية منظمة لجميع الحسابات والديون": "Copie papier organisée de tous les comptes et dettes",
  "نسيت كلمة المرور؟": "Mot de passe oublié ?",
  "نسيت كلمة المرور؟ استخدم كود الاسترداد": "Mot de passe oublié ? Utilisez le code de récupération",
  "نقرة خفيفة عند كل ضغطة": "Léger clic à chaque appui",
  "نقل إلى المهملات": "Mettre à la corbeille",
  "نهاية الإرسال (حتى 22:00)": "Fin d'envoi (jusqu'à 22:00)",
  "هاتف العامل": "Téléphone de l'employé",
  "هاتف المالك": "Téléphone du propriétaire",
  "هاتف المالك الرئيسي + هاتف العامل المساعد": "Téléphone principal du propriétaire + téléphone de l'employé",
  "هذا الجهاز لا يدعم التحقق الآمن": "Cet appareil ne prend pas en charge la vérification sécurisée",
  "هذا الجهاز لا يدعم التحقق الآمن من Ed25519": "Cet appareil ne prend pas en charge la vérification sécurisée Ed25519",
  "هذا الجهاز مرخّص كجهاز عامل ولا يمكن تحويله إلى وضع المالك 🔒": "Cet appareil est licencié comme appareil employé et ne peut pas passer en mode propriétaire 🔒",
  "هذا الدين سيتم تسويته بالكامل بهذه الدفعة، اختر دينًا سيبقى منه رصيد": "Cette dette sera entièrement soldée par ce paiement ; choisissez une dette ayant un solde restant",
  "هذا الكود سبق استعماله": "Ce code a déjà été utilisé",
  "هذا الكود مخصص لجهاز آخر": "Ce code est destiné à un autre appareil",
  "هذه العملية": "Cette opération",
  "هل أنت متأكد من حذف جميع البيانات؟ ستُنقل كل الحسابات والتذاكر الحالية إلى سلة المهملات، ويمكنك استرجاعها بضغطة زر إن أردت.": "Voulez-vous vraiment supprimer toutes les données ? Tous les comptes et tickets actuels seront déplacés vers la corbeille et vous pourrez les restaurer en un clic.",
  "هل أنت متأكد من حذف فئة «{}»؟": "Voulez-vous vraiment supprimer la catégorie « {} » ?",
  "وسم": "Étiquette",
  "وضع القراءة فقط": "Mode lecture seule",
  "وضع القراءة فقط 🔒": "Mode lecture seule 🔒",
  "وضع القراءة فقط: لا يمكن إرسال SMS": "Mode lecture seule : impossible d'envoyer des SMS",
  "وضع القراءة فقط: لا يمكن الإضافة أو التعديل أو الحذف حاليًا 🔒": "Lecture seule : ajout, modification et suppression impossibles pour le moment 🔒",
  "وضع القراءة فقط: لا يمكن تغيير إعدادات SMS": "Mode lecture seule : impossible de modifier les paramètres SMS",
  "ونص": "et demi",
  "ياسين دحماني": "Yacine Dahmani",
  "يرجى كتابة اسم أو لقب الزبون": "Veuillez saisir le nom ou le surnom du client",
  "يعرض السجل قبول أندرويد أو حالة إرسال غير مؤكدة؛ ولا يثبت وصول الرسالة إلى هاتف الزبون.": "L'historique indique l'acceptation par Android ou un état incertain ; cela ne garantit pas la réception par le client.",
  "يقترب موعد السداد (بعد 2 يومين)": "L'échéance approche (dans 2 jours)",
  "يقترب موعد السداد (بعد {} {})": "L'échéance approche (dans {1} {2})",
  "يميز السجل بين قبول أندرويد، ونجاح إرسال كل الأجزاء للشبكة، وتأكيد التسليم، والفشل الجزئي أو الكلي.": "L'historique distingue l'acceptation par Android, l'envoi complet au réseau, la confirmation de livraison et l'échec partiel ou total.",
  "يمكنك حذف أي فئة لا تستعملها في محلك:": "Vous pouvez supprimer toute catégorie que vous n'utilisez pas dans votre magasin :",
  "يمكنك حفظ هذه النسخة كملف": "Vous pouvez enregistrer cette copie dans un fichier",
  "ينتهي بعد": "Expire dans",
  "ينتهي بعد {} ثانية": "Expire dans {} seconde(s)",
  "يُضاف هذا الاسم تلقائيًا مكان {store} في القالب العربي والفرنسي.": "Ce nom remplace automatiquement {store} dans les modèles arabe et français.",
  "يُمدد الدين الذي تختاره فقط، مع الاحتفاظ بتاريخ الموعد السابق وسجل التمديد.": "Seule la dette choisie est prolongée, tout en conservant l'ancienne échéance et l'historique.",
  "يوم": "jour",
  "يوم {} في الشهر": "Le {} de chaque mois",
  "يوم {} في الشهر (⚠️ متأخر {} يوم)": "Le {} de chaque mois (⚠️ en retard de {} jour(s))",
  "يوم الراتب اليوم": "Jour de paie aujourd'hui",
  "يوم السداد المتوقع في الشهر (اختياري)": "Jour de paiement prévu dans le mois (optionnel)",
  "يومين": "2 jours",
  "— الدين الحالي": "— Dette actuelle",
  "— ستُعاد المحاولة تلقائيًا": "— Nouvelle tentative automatique",
  "• {} {} {}{} دج{}": "• {} {} {}{} DA{}",
  "• استُلم": "• reçus",
  "⚙️ إدارة الفئات": "⚙️ Gérer les catégories",
  "⚠️ اقترب من السقف — بقي {} دج": "⚠️ Proche du plafond — il reste {} DA",
  "⚠️ الدين الجديد ({} دج) يتجاوز السقف ({} دج)": "⚠️ La nouvelle dette ({} DA) dépasse le plafond ({} DA)",
  "⚠️ انتهت مهلة تصحيح الساعة (لم يُفعَّل القفل بعد). صحّح تاريخ الجهاز.": "⚠️ Le délai de correction de l'horloge est écoulé (verrouillage pas encore activé). Corrigez la date de l'appareil.",
  "⚠️ تجاوز السقف بـ {} دج": "⚠️ Plafond dépassé de {} DA",
  "⚠️ تحذير": "⚠️ Avertissement",
  "⚠️ تحذير {} من 3: تم اكتشاف تغيير غير طبيعي في ساعة الجهاز. صحّح التاريخ والوقت.": "⚠️ Avertissement {} sur 3 : un changement anormal de l'horloge a été détecté. Corrigez la date et l'heure.",
  "⚠️ تعذّر حفظ حالة الوقت بأمان": "⚠️ Impossible d'enregistrer l'état de l'horloge en toute sécurité",
  "⚠️ تم تجاهل {} تعديلًا من هاتف العامل لتجاوزه الصلاحيات.": "⚠️ {} modification(s) du téléphone de l'employé ignorée(s) car dépassant ses droits.",
  "⚠️ متأخر 2 يومين": "⚠️ En retard de 2 jours",
  "⚠️ متأخر {} {}": "⚠️ En retard de {1} {2}",
  "⚠️ متأخر {} يوم": "⚠️ En retard de {} jour(s)",
  "⚠️ متأخر بـ 2 يومين (موعده يوم {})": "⚠️ En retard de 2 jours (échéance le {})",
  "⚠️ متأخر بـ {} {} (موعده يوم {})": "⚠️ En retard de {1} {2} (échéance le {3})",
  "⚠️ مهلة التصحيح: متبقٍ نحو": "⚠️ Délai de correction : il reste environ",
  "⚠️ مهلة التصحيح: متبقٍ نحو {} ساعة. صحّح ساعة الجهاز أو اتصل بالإنترنت.": "⚠️ Délai de correction : il reste environ {} heure(s). Corrigez l'horloge de l'appareil ou connectez-vous à internet.",
  "⚠️ يتجاوز السقف ({} دج) بـ {} دج": "⚠️ Dépasse le plafond ({} DA) de {} DA",
  "✅ سدد مؤخراً {} دج": "✅ A payé récemment {} DA",
  "✅ مصفّى بالكامل": "✅ Entièrement soldé",
  "✅ ملتزم بالموعد": "✅ Respecte l'échéance",
  "✏️ ملاحظة": "✏️ Note",
  "➕ زيادة دين": "➕ Augmenter la dette",
  "💰 تسديد دين": "💰 Payer une dette",
  "💼 الراتب بعد {} يوم — وقت التحصيل": "💼 Paie dans {} jour(s) — moment de l'encaissement",
  "💼 {} — وقت التحصيل": "💼 {} — moment de l'encaissement",
  "📅 {} — وقت التحصيل": "📅 {} — moment de l'encaissement",
  "📷 مسح QR": "📷 Scanner le QR",
  "🔄 المزامنة": "🔄 Synchroniser",
  "🔒 وضع القراءة فقط: انتهت المهلة. يمكنك عرض البيانات وتصدير نسخة احتياطية. صحّح الساعة واتصل بالإنترنت.": "🔒 Lecture seule : le délai est écoulé. Vous pouvez consulter les données et exporter une sauvegarde. Corrigez l'horloge et connectez-vous à internet.",
  "🔓 رفع الحظر": "🔓 Lever le blocage",
  "🕒 موعد السداد اليوم (يوم {})": "🕒 Échéance aujourd'hui (le {})",
  "🕒 موعده اليوم": "🕒 Échéance aujourd'hui",
  "🖨️ طباعة / حفظ كـ PDF": "🖨️ Imprimer / enregistrer en PDF",
  "🗑️ حذف البيانات": "🗑️ Supprimer les données",
  "🗑️ سلة المهملات": "🗑️ Corbeille",
  "🚨 تجاوز سقف الدين": "🚨 Plafond de dette dépassé",
  "🚨 تجاوز سقف الدين ({} / {} دج)": "🚨 Plafond de dette dépassé ({} / {} DA)",
  "🚨 فوق السقف": "🚨 Au-dessus du plafond",
  "🚫 القائمة السوداء (محظورون من الدين)": "🚫 Liste noire (clients bloqués)",
  "🚫 حساب محظور — لا دين جديد حتى تسديد {} دج": "🚫 Compte bloqué — pas de nouvelle dette avant paiement de {} DA",
  "🚫 حساب محظور — لا يقبل دينًا جديدًا": "🚫 Compte bloqué — n'accepte pas de nouvelle dette",
  "🛍️ سلعة جديدة أخذها الآن (دين جديد يُضاف)": "🛍️ Nouvel article pris maintenant (nouvelle dette ajoutée)",
  "نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒": "Le type de licence (M ou W) détermine le rôle de l'appareil et ne peut pas être modifié dans l'application 🔒",
  "لاحقًا": "Plus tard",
  "حسناً": "OK",
  "حسنًا": "OK",
  "انتهت مهلة الـ 48 ساعة، يرجى ضبط الساعة والضغط على حسناً للتحقق": "Le délai de 48 heures est écoulé, veuillez régler l'horloge et appuyer sur OK pour vérifier",
  "تم التحقق من صحة الساعة وإزالة التحذير بنجاح ✅": "Horloge vérifiée et avertissement supprimé avec succès ✅",
  "الساعة لا تزال غير مطابقة للوقت الحقيقي أو يلزم الاتصال بالإنترنت للتحقق": "L'horloge ne correspond toujours pas à l'heure réelle ou une connexion internet est requise pour vérifier",
  "ملف النسخة الاحتياطية فارغ أو غير صالح": "Le fichier de sauvegarde est vide ou invalide",
  "ملف JSON تالف ولا يمكن قراءته": "Le fichier JSON est corrompu et illisible",
  "بنية ملف النسخة الاحتياطية غير متوافقة": "La structure du fichier de sauvegarde est incompatible",
  "ملف النسخة الاحتياطية لا يحتوي على سجلات الزبائن والتذاكر المطلوبة": "Le fichier de sauvegarde ne contient pas les registres clients et tickets requis",
  "بيانات الزبون رقم {} في الملف تالفة أو ناقصة": "Les données du client n° {} dans le fichier sont corrompues ou incomplètes",
  "ملف النسخة الاحتياطية يحتوي على معرفات زبائن مكررة": "Le fichier de sauvegarde contient des identifiants clients en double",
  "سجل عمليات الزبون «{}» غير صالح": "L'historique des opérations du client « {} » est invalide",
  "عملية مالية تالفة في حساب «{}»": "Opération financière corrompue dans le compte « {} »",
  "ملف النسخة الاحتياطية يحتوي على معرفات عمليات مكررة": "Le fichier de sauvegarde contient des identifiants d'opérations en double",
  "بيانات التذكرة المعلقة رقم {} تالفة": "Les données du ticket en attente n° {} sont corrompues",
  "سجل سلة المهملات في النسخة الاحتياطية غير صالح": "Le registre de la corbeille dans la sauvegarde est invalide",
  "تعذّر تحديث النسخة الاحتياطية الخارجية (تحقق من مساحة الهاتف أو المجلد). آخر نسخة سليمة محفوظة ⚠️": "Impossible de mettre à jour la sauvegarde externe (vérifiez l'espace ou le dossier). La dernière sauvegarde valide est préservée ⚠️",
  "بيانات الاستعادة أو الترخيص غير صالحة": "Les données de restauration ou la licence sont invalides",
  "تعذّر حفظ البيانات المستعادة في التخزين المحلي": "Impossible d'enregistrer les données restaurées dans le stockage local",
  "تعذّرت قراءة ملف JSON المختار": "Impossible de lire le fichier JSON sélectionné",
  "استعادة نسخة JSON": "Restaurer une sauvegarde JSON",
  "تم التحقق من سلامة ملف النسخة الاحتياطية:": "Intégrité du fichier de sauvegarde vérifiée :",
  "زبائن": "clients",
  "تنبيه: هذه النسخة مأخوذة من جهاز آخر. لإتمام الاستعادة على هذا الهاتف، أدخل كود التفعيل الصالح لمعرّف هذا الجهاز الصادر من مولّد الأكواد.": "Attention : cette sauvegarde provient d'un autre appareil. Pour restaurer sur ce téléphone, saisissez un code d'activation valide pour l'identifiant de cet appareil.",
  "لإتمام الاستعادة بأمان، أدخل كود التفعيل الخاص بهذا الجهاز:": "Pour terminer la restauration en toute sécurité, saisissez le code d'activation de cet appareil :",
  "تأكيد الاستعادة": "Confirmer la restauration",
  "أدخل كود التفعيل للتحقق من أحقية الاستعادة": "Saisissez le code d'activation pour autoriser la restauration",
  "كود التفعيل غير صالح لهذا الجهاز أو انتهت صلاحيته — تم رفض الاستعادة": "Code d'activation invalide pour cet appareil ou expiré — restauration refusée",
  "تمت استعادة النسخة الاحتياطية بنجاح ✅": "Sauvegarde restaurée avec succès ✅",
  "فشلت عملية الاستعادة وبقيت بياناتك الحالية محمية:": "Échec de la restauration, vos données actuelles restent protégées :",
  "إعداد النسخ الاحتياطي التلقائي": "Configuration de la sauvegarde automatique",
  "تم تفعيل الحفظ التلقائي المحلي؛ اختيار مجلد خارجي متاح داخل تطبيق أندرويد": "Sauvegarde automatique locale activée ; le choix d'un dossier externe est disponible dans l'application Android",
  "تم ربط مجلد النسخ الاحتياطي التلقائي وحفظ النسخة بنجاح ✅": "Dossier de sauvegarde automatique lié et sauvegarde enregistrée avec succès ✅",
  "لم يتم اختيار مجلد النسخ الاحتياطي": "Aucun dossier de sauvegarde sélectionné",
  "تحديد مجلد النسخ الاحتياطي التلقائي (خارج التطبيق)": "Choisir le dossier de sauvegarde auto (hors application)",
  "⚠️ متأخر بـ {} يوم (موعده يوم {}) — {} دج": "⚠️ En retard de {} jour(s) (échéance le {}) — {} DA",
  "⚠️ متأخر بـ {} يومين (موعده يوم {}) — {} دج": "⚠️ En retard de 2 jours (échéance le {}) — {} DA",
  "⚠️ متأخر بـ {} أيام (موعده يوم {}) — {} دج": "⚠️ En retard de {} jours (échéance le {}) — {} DA",
  "🕒 موعد السداد اليوم (يوم {}) — {} دج": "🕒 Échéance aujourd'hui (le {}) — {} DA",
  "غير مقروء": "Non lu",
  "مقروء": "Lu",
  "مقروء ✓": "Lu ✓",
  "جديد": "Nouveau",
  "تحديد الكل كمقروء": "Tout marquer comme lu",
  "لا توجد تنبيهات جديدة": "Aucune nouvelle alerte",
  "لا توجد تنبيهات في هذا القسم": "Aucune alerte dans cette section",
  "فُقد إذن الوصول إلى مجلد النسخ الاحتياطي الخارجي — يرجى إعادة اختيار المجلد من الإعدادات ⚠️": "Autorisation d'accès au dossier de sauvegarde externe perdue — veuillez resélectionner le dossier dans les paramètres ⚠️",
  "إضافة النسخ الاحتياطي لأندرويد غير متاحة في هذه البيئة": "Le module de sauvegarde Android n'est pas disponible dans cet environnement",
  "لم يتم العثور على نسخة احتياطية صالحة في المجلد المختار": "Aucune sauvegarde valide trouvée dans le dossier sélectionné",
  "فشل التحقق من حفظ البيانات المشفرة": "Échec de la vérification de l'enregistrement des données chiffrées",
  "تعذّرت قراءة النسخة التلقائية من المجلد": "Impossible de lire la sauvegarde automatique depuis le dossier",
  "تم التحول تلقائياً إلى النسخة الاحتياطية السابقة السليمة (.prev.json) بسبب تعذّر قراءة النسخة الرئيسية ⚠️": "Basculement automatique vers la sauvegarde précédente valide (.prev.json) car la sauvegarde principale est illisible ⚠️",
  "اختيار مجلد النسخ الاحتياطي الخارجي يتطلب تشغيل التطبيق على نظام أندرويد ⚠️": "Le choix d'un dossier de sauvegarde externe nécessite l'application Android ⚠️",
  "تم اختيار المجلد لكن تعذّرت كتابة النسخة الاحتياطية الأولى ⚠️": "Dossier sélectionné mais impossible d'écrire la première sauvegarde ⚠️"
};

/* ============ Interface language (Arabic default, French optional) + French Centimes Engine ============ */
const DEYN_I18N = (() => {
  const AR = /[\u0600-\u06FF]/;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let lang = 'ar';
  try { lang = localStorage.getItem('deyn.lang') === 'fr' ? 'fr' : 'ar'; } catch (e) {}
  const exact = new Map(), pats = [];
  let statics = null, built = false;
  const cache = new Map();
  const norm = s => s.replace(/\s+/g, ' ').trim();

  /**
   * Formats a Dinar amount (1 DA = 100 centimes) in natural Algerian French centimes phrasing.
   * Examples:
   *   5 DA     -> "500 centimes"
   *   10 DA    -> "1 000 centimes"
   *   345 DA   -> "34 500 centimes"
   *   10000 DA -> "1 million de centimes"
   *   15000 DA -> "1 million et demi de centimes"
   *   14250 DA -> "1 million et 425 000 centimes"
   */
  function dialectFr(d) {
    const num = Math.round((Number(d) + Number.EPSILON) * 100) / 100;
    if (!(num > 0)) return '';
    const centimes = Math.round(num * 100);
    if (centimes <= 0) return '';
    const fmtC = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
    const millions = Math.floor(centimes / 1000000);
    const rem = centimes % 1000000;
    if (millions >= 1) {
      const mStr = millions === 1 ? '1 million' : `${fmtC(millions)} millions`;
      if (rem === 0) return `${mStr} de centimes`;
      if (rem === 500000) return `${mStr} et demi de centimes`;
      return `${mStr} et ${fmtC(rem)} centimes`;
    }
    return `${fmtC(centimes)} centimes`;
  }

  /**
   * Parses any Arabic dialect amount string produced by dialect(d) back into Dinars
   * and converts it into natural French centimes via dialectFr(da).
   */
  const DORO_DA = { 'عشرين دورو': 1, 'ربعين دورو': 2, 'ستين دورو': 3, 'ثمانين دورو': 4 };
  function parseArBase5(part) {
    const s = part.trim();
    if (!s) return null;
    if (s === 'ميادورو') return 5;
    if (s === 'تلاث ميادورو') return 15;
    if (s === 'خمس ميادورو') return 25;
    if (s === 'ألف') return 10;
    if (s === 'ألف ونص') return 15;
    if (s === 'ألفين') return 20;
    if (s === 'ألفين ونص') return 25;
    let m = /^(\d+)\s*(?:آلاف|ألف)(\s+ونص)?$/.exec(s);
    if (m) return Number(m[1]) * 10 + (m[2] ? 5 : 0);
    return null;
  }
  function parseArMillions(part) {
    const s = part.trim();
    if (s === 'مليون') return 10000;
    if (s === 'زوج ملاين') return 20000;
    const m = /^(\d+)\s*(?:ملاين|مليون)$/.exec(s);
    if (m) return Number(m[1]) * 10000;
    return null;
  }
  function arDialectToFr(rawStr) {
    const s = norm(rawStr);
    if (!s) return null;
    if (DORO_DA[s]) return dialectFr(DORO_DA[s]);
    let remDoro = 0;
    let main = s;
    for (const [k, v] of Object.entries(DORO_DA)) {
      if (main.endsWith(' و' + k)) {
        remDoro = v;
        main = main.slice(0, -(' و' + k).length).trim();
        break;
      }
    }
    const b5 = parseArBase5(main);
    if (b5 !== null) return dialectFr(b5 + remDoro);
    if (main.endsWith(' ونص')) {
      const mPart = main.slice(0, -' ونص'.length).trim();
      const mVal = parseArMillions(mPart);
      if (mVal !== null) return dialectFr(mVal + 5000 + remDoro);
    }
    const mDirect = parseArMillions(main);
    if (mDirect !== null) return dialectFr(mDirect + remDoro);
    const wIdx = main.indexOf(' و');
    if (wIdx > 0) {
      const mVal = parseArMillions(main.slice(0, wIdx));
      const tVal = parseArBase5(main.slice(wIdx + 2));
      if (mVal !== null && tVal !== null) return dialectFr(mVal + tVal + remDoro);
    }
    return null;
  }

  function ensureBuilt() {
    if (built) return;
    built = true;
    for (const k of Object.keys(DEYN_FR_DICT)) {
      const v = DEYN_FR_DICT[k];
      if (k.indexOf('{}') >= 0) {
        pats.push({
          re: new RegExp('^' + k.split('{}').map(esc).join('([\\s\\S]*?)') + '$'),
          v,
          n: (k.match(/[\u0600-\u06FF]/g) || []).length,
          len: k.length
        });
      } else {
        exact.set(k, v);
      }
    }
    pats.sort((a, b) => (b.n - a.n) || (b.len - a.len));
    statics = Array.from(exact.keys())
      .filter(k => k.length >= 2)
      .sort((a, b) => b.length - a.length)
      .map(k => ({ re: new RegExp('(?<![\\u0600-\\u06FF])' + esc(k) + '(?![\\u0600-\\u06FF])', 'g'), v: exact.get(k) }));
  }

  function fill(v, groups) {
    let c = 0;
    return v.replace(/\{(\d*)\}/g, (m, i) => {
      const g = groups[i ? +i - 1 : c++];
      return g === undefined ? '' : tr(g);
    });
  }

  const LET = {
    'ا': 'A', 'أ': 'A', 'إ': 'A', 'آ': 'A', 'ٱ': 'A', 'ب': 'B', 'پ': 'P', 'ت': 'T', 'ث': 'Th',
    'ج': 'J', 'چ': 'Ch', 'ح': 'H', 'خ': 'Kh', 'د': 'D', 'ذ': 'Dh', 'ر': 'R', 'ز': 'Z', 'س': 'S',
    'ش': 'Ch', 'ص': 'S', 'ض': 'D', 'ط': 'T', 'ظ': 'Z', 'ع': 'A', 'غ': 'Gh', 'ف': 'F', 'ڤ': 'V',
    'ق': 'Q', 'ك': 'K', 'گ': 'G', 'ل': 'L', 'م': 'M', 'ن': 'N', 'ه': 'H', 'و': 'W', 'ي': 'Y',
    'ى': 'Y', 'ة': 'A', 'ؤ': 'W', 'ئ': 'Y', 'ء': "'"
  };

  function core(t) {
    ensureBuilt();
    const dialFr = arDialectToFr(t);
    if (dialFr) return dialFr;
    if (exact.has(t)) return exact.get(t);
    if (t.length === 1 && LET[t]) return LET[t];
    const k = t.search(AR), rest = k > 0 ? t.slice(k) : null;
    if (rest && exact.has(rest)) return t.slice(0, k) + exact.get(rest);
    if (rest) {
      const restDial = arDialectToFr(rest);
      if (restDial) return t.slice(0, k) + restDial;
    }
    for (const p of pats) {
      let m = p.re.exec(t);
      if (m) return fill(p.v, m.slice(1));
      if (rest) {
        m = p.re.exec(rest);
        if (m) return t.slice(0, k) + fill(p.v, m.slice(1));
      }
    }
    // Check parenthesized dialect inside a string, e.g. "14 250 DA (مليون و425 ألف)"
    let out = t.replace(/\(([^()]*[\u0600-\u06FF][^()]*)\)/g, (full, inner) => {
      const conv = arDialectToFr(inner) || (exact.has(inner.trim()) ? exact.get(inner.trim()) : null);
      return conv ? '(' + conv + ')' : full;
    });
    for (const s of statics) {
      s.re.lastIndex = 0;
      if (s.re.test(out)) {
        s.re.lastIndex = 0;
        out = out.replace(s.re, s.v);
      }
    }
    return out;
  }

  function tr(text) {
    if (lang !== 'fr' || typeof text !== 'string' || !AR.test(text)) return text;
    ensureBuilt();
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
    const key = norm(m[2]);
    let r = cache.get(key);
    if (r === undefined) {
      r = core(key);
      if (cache.size > 4000) cache.clear();
      cache.set(key, r);
    }
    return m[1] + r + m[3];
  }

  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  function node(n) {
    if (!n || lang !== 'fr') return;
    if (n.nodeType === 3) {
      const p = n.parentNode;
      if (p && (p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.id === 'smsTplAr')) return;
      const v = n.nodeValue;
      if (AR.test(v)) {
        const t = tr(v);
        if (t !== v) n.nodeValue = t;
      }
      return;
    }
    if (n.nodeType !== 1 || n.nodeName === 'SCRIPT' || n.nodeName === 'STYLE') return;
    for (const a of ATTRS) {
      const v = n.getAttribute(a);
      if (v && AR.test(v)) {
        const t = tr(v);
        if (t !== v) n.setAttribute(a, t);
      }
    }
    if (n.nodeName === 'INPUT' && n.type !== 'password' && n.value && AR.test(n.value) && !n.dataset.i18nValDone) {
      ensureBuilt();
      const k = norm(n.value);
      if (exact.has(k)) {
        n.value = exact.get(k);
        n.dataset.i18nValDone = '1';
      }
    }
    for (let c = n.firstChild; c; c = c.nextSibling) node(c);
  }

  function html(s) {
    if (lang !== 'fr' || typeof s !== 'string') return s;
    ensureBuilt();
    return s
      .replace(/>([^<]*[\u0600-\u06FF][^<]*)</g, (m, t) => '>' + tr(t) + '<')
      .replace(/(placeholder|title|aria-label|alt)="([^"]*)"/g, (m, a, v) => a + '="' + tr(v) + '"')
      .replace(/<html[^>]*>/i, '<html lang="fr" dir="ltr">')
      .replace(/dir="rtl"/g, 'dir="ltr"')
      .replace(/direction:\s*rtl/g, 'direction: ltr');
  }

  function installRuntimeHooks() {
    if (typeof window === 'undefined') return;
    // 1. Hook dialect() so all centimes displays work natively in French without hiding them
    if (typeof window.dialect === 'function' && !window.dialect.__i18nWrapped) {
      const origDialect = window.dialect;
      const wrappedDialect = function (d) {
        if (lang === 'fr') return dialectFr(d);
        return origDialect.apply(this, arguments);
      };
      wrappedDialect.__i18nWrapped = true;
      window.dialect = wrappedDialect;
    }
    // 2. Hook toast(), agToast(), deynBanner() so notifications are always translated synchronously
    if (typeof window.toast === 'function' && !window.toast.__i18nWrapped) {
      const origToast = window.toast;
      const wrappedToast = function (m, k) {
        return origToast.call(this, lang === 'fr' ? tr(String(m ?? '')) : m, k);
      };
      wrappedToast.__i18nWrapped = true;
      window.toast = wrappedToast;
    }
    if (typeof window.agToast === 'function' && !window.agToast.__i18nWrapped) {
      const origAgToast = window.agToast;
      const wrappedAgToast = function (m) {
        return origAgToast.call(this, lang === 'fr' ? tr(String(m ?? '')) : m);
      };
      wrappedAgToast.__i18nWrapped = true;
      window.agToast = wrappedAgToast;
    }
    if (typeof window.deynBanner === 'function' && !window.deynBanner.__i18nWrapped) {
      const origBanner = window.deynBanner;
      const wrappedBanner = function (txt, kind) {
        return origBanner.call(this, lang === 'fr' && txt ? tr(String(txt)) : txt, kind);
      };
      wrappedBanner.__i18nWrapped = true;
      window.deynBanner = wrappedBanner;
    }
    // 3. Hook openModal() so every modal's paint() and mount() synchronously translates its DOM
    if (typeof window.openModal === 'function' && !window.openModal.__i18nWrapped) {
      const origOpenModal = window.openModal;
      const wrappedOpenModal = function (render, opts) {
        const m = origOpenModal.call(this, render, opts);
        if (m && m.wrap && lang === 'fr') {
          node(m.wrap);
          if (typeof m.paint === 'function' && !m.paint.__i18nWrapped) {
            const origPaint = m.paint;
            m.paint = function () {
              const r = origPaint.apply(this, arguments);
              if (lang === 'fr') node(m.wrap);
              return r;
            };
            m.paint.__i18nWrapped = true;
          }
        }
        return m;
      };
      wrappedOpenModal.__i18nWrapped = true;
      window.openModal = wrappedOpenModal;
    }
    // 4. Hook statement() so WhatsApp and copied statements are translated in French mode
    if (typeof window.statement === 'function' && !window.statement.__i18nWrapped) {
      const origStatement = window.statement;
      const wrappedStatement = function (c) {
        const s = origStatement.apply(this, arguments);
        if (lang !== 'fr' || typeof s !== 'string') return s;
        return s.split('\n').map(line => tr(line)).join('\n');
      };
      wrappedStatement.__i18nWrapped = true;
      window.statement = wrappedStatement;
    }
    // 5. Hook exportPdfLedger() so both window.open and Blob fallback export French HTML in French mode
    if (typeof window.exportPdfLedger === 'function' && !window.exportPdfLedger.__i18nWrapped) {
      const origExportPdf = window.exportPdfLedger;
      const wrappedExportPdf = function () {
        if (lang !== 'fr') return origExportPdf.apply(this, arguments);
        const origOpen = window.open;
        const origBlob = window.Blob;
        try {
          window.open = function () {
            const w = origOpen.apply(this, arguments);
            if (w && w.document && typeof w.document.write === 'function') {
              const origWrite = w.document.write.bind(w.document);
              w.document.write = function (content) {
                return origWrite(html(String(content ?? '')));
              };
            }
            return w;
          };
          window.Blob = function (parts, options) {
            if (Array.isArray(parts) && options && options.type === 'text/html') {
              parts = parts.map(p => typeof p === 'string' ? html(p) : p);
            }
            return new origBlob(parts, options);
          };
          return origExportPdf.apply(this, arguments);
        } finally {
          window.open = origOpen;
          window.Blob = origBlob;
        }
      };
      wrappedExportPdf.__i18nWrapped = true;
      window.exportPdfLedger = wrappedExportPdf;
      if (typeof window.A === 'object' && window.A) window.A.exportPdf = wrappedExportPdf;
    }
    // 6. Hook renderDisplay, renderPending, renderLedger, renderStats, updateMM so synchronous DOM updates are translated immediately
    for (const fnName of ['renderDisplay', 'renderPending', 'renderLedger', 'renderStats', 'updateMM', 'buildTiles']) {
      if (typeof window[fnName] === 'function' && !window[fnName].__i18nWrapped) {
        const origFn = window[fnName];
        const wrappedFn = function () {
          const r = origFn.apply(this, arguments);
          if (lang === 'fr' && document && document.body) node(document.body);
          return r;
        };
        wrappedFn.__i18nWrapped = true;
        window[fnName] = wrappedFn;
      }
    }
    if (typeof window.A === 'object' && window.A && !window.A.setLang) {
      window.A.setLang = d => set(d && d.l);
    }
    if (typeof window.READONLY_OK !== 'undefined' && window.READONLY_OK && typeof window.READONLY_OK.add === 'function') {
      window.READONLY_OK.add('setLang');
    }
  }

  function start() {
    ensureBuilt();
    installRuntimeHooks();
    if (lang !== 'fr') return;
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
    if (document.title && AR.test(document.title)) document.title = tr(document.title);
    document.body.classList.add('fr');
    if (!document.getElementById('deyn-fr-rtl-ltr-style')) {
      const st = document.createElement('style');
      st.id = 'deyn-fr-rtl-ltr-style';
      st.textContent = [
        'html,body{direction:ltr!important}',
        'body.fr *{direction:ltr!important}',
        'body.fr [style*="text-align:right"]{text-align:left!important}',
        'body.fr .nt,body.fr .pick,body.fr .cmp th,body.fr .cmp td,body.fr .tape.empty{text-align:left!important}',
        'body.fr .modesw .thumb{right:auto!important;left:4px!important}',
        'body.fr .modesw[data-mode=calc] .thumb{transform:translateX(100%)!important}',
        'body.fr .sw i::after{right:auto!important;left:3px!important}',
        'body.fr .sw input:checked+i::after{transform:translateX(20px)!important}',
        'body.fr .rk-go,body.fr .nt-go{transform:scaleX(-1);display:inline-block}',
        'body.fr .tile .t-tag{font-size:8.5px;padding:1px 5px;max-width:96%;overflow:hidden;text-overflow:ellipsis}',
        'body.no-dial .hx-dial,body.no-dial .kp-d,body.no-dial .rk-d,body.no-dial .ds-d,body.no-dial .dial,body.no-dial #dial,body.no-dial .t-tag,body.no-dial .pill:not(.bk){display:none!important}'
      ].join('');
      document.head.appendChild(st);
    }
    if (typeof window.buildTiles === 'function' && typeof window.S !== 'undefined' && window.S) {
      try { window.buildTiles(); window.renderAll(); } catch (e) {}
    }
    node(document.body);
    new MutationObserver(ms => {
      for (const m of ms) {
        if (m.type === 'childList') m.addedNodes.forEach(node);
        else if (m.type === 'characterData') node(m.target);
        else if (m.type === 'attributes') node(m.target);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function set(l, noReload) {
    lang = l === 'fr' ? 'fr' : 'ar';
    cache.clear();
    try { localStorage.setItem('deyn.lang', lang); } catch (e) {}
    if (noReload) {
      if (lang === 'fr') start();
      else {
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
        document.body.classList.remove('fr');
      }
      return;
    }
    location.reload();
  }

  return {
    tr,
    html,
    start,
    set,
    translateRoot: node,
    dialectFr,
    arDialectToFr,
    get lang() { return lang; },
    get locale() { return lang === 'fr' ? 'fr-FR' : 'ar-DZ'; }
  };
})();
(function () {
  var b = document.getElementById('agLang');
  if (b) {
    b.textContent = DEYN_I18N.lang === 'fr' ? 'AR' : 'Français';
    b.setAttribute('aria-label', DEYN_I18N.lang === 'fr' ? 'Arabe' : 'Français');
    b.onclick = function () { DEYN_I18N.set(DEYN_I18N.lang === 'fr' ? 'ar' : 'fr'); };
  }
  DEYN_I18N.start();
})();

/* DEYN_COMPLETION_RUNTIME_V2 */
/* Implements verified fixes for:
   1. Strict M/W license role separation: DEYN3 license alone determines device role; manual role switching (M->W or W->M) is completely disabled.
   2. Automatic external JSON backup (SAF via DeynBackupPlugin): full state fingerprint (customers, debts/payments, pending, trash, categories, guaranteed, settings, smsLog, notifLog, seq), strict external-write verification before updating lastAutoBackupHash, clear failure reporting, and retry support.
   3. Backup Restore: automatic fallback from corrupt/unreadable deyn-auto-backup.json to deyn-auto-backup.prev.json, atomic validation before state mutation, stripping of passwords/roles/licenses, device-bound DEYN3 license verification, and verified storage flush before announcing success.
   4. Clock protection: Android SystemClock.elapsedRealtime() monotonic anchor integration + timezone-shift immunity + interactive warning banner ("لاحقاً" / "حسناً") + clearing warnings only upon genuine time verification.
   5. Persistent notification history log (Read/Unread) + automatic cancellation/updating of scheduled WorkManager notifications when debts are paid or modified.
   6. French UI button layout fix ("Gérer le mot de passe" wrapping) & large DZD amount display protection.
*/
(function () {
  'use strict';

  const isFr = () => typeof DEYN_I18N !== 'undefined' && DEYN_I18N.lang === 'fr';
  const tr = s => (typeof DEYN_I18N !== 'undefined' && typeof DEYN_I18N.tr === 'function') ? DEYN_I18N.tr(s) : s;
  const escHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ============================================================================
  // 6. UI & CSS FIXES (French button wrapping + Large DZD amount display)
  // ============================================================================
  function injectCompletionStyles() {
    if (document.getElementById('deyn-completion-styles-v2')) return;
    const st = document.createElement('style');
    st.id = 'deyn-completion-styles-v2';
    st.textContent = [
      '.row-set{align-items:center;gap:12px}',
      '.row-set > div:first-child{flex:1 1 0;min-width:0}',
      '.row-set .btn.sm{height:auto!important;min-height:36px;padding:6px 12px!important;white-space:normal!important;text-align:center;line-height:1.3;max-width:46%;flex:0 1 auto;word-break:break-word;overflow-wrap:anywhere}',
      '.amount,.hx-amt,.v-amt,.hero-bal .v{flex-wrap:wrap;max-width:100%;overflow-wrap:anywhere;word-break:break-word}',
      '.c-bal b,.rk-amt .num,.ds-v .num,.kp-v .num{overflow-wrap:anywhere;word-break:break-all}',
      '.ag-restore-link{margin-top:8px;font-size:12.5px;font-weight:600;color:#065043;opacity:0.86;text-decoration:underline;background:transparent;border:0;padding:4px 10px;cursor:pointer;z-index:2;position:relative}',
      '.ag-restore-link:active{opacity:1;transform:scale(0.98)}',
      '.notif-tabs{display:flex;gap:6px;margin:8px 0 12px}',
      '.notif-item.unread{border-inline-start:4px solid #065043;background:#f0fdf4}',
      '.notif-item.read{opacity:0.82;background:#f8fafc}',
      '#deynTimeBanner{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}',
      '#deynTimeBanner .tb-actions{display:flex;gap:6px;margin-inline-start:auto}',
      '#deynTimeBanner .tb-btn{background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.45);border-radius:8px;padding:3px 10px;font-size:11.5px;font-weight:700;cursor:pointer}'
    ].join('\n');
    document.head.appendChild(st);
  }
  injectCompletionStyles();

  // ============================================================================
  // 1. STRICT M/W ROLE ENFORCEMENT (License role alone determines device role)
  // ============================================================================
  window.isWorkerDevice = function () {
    if (window.DEYN_LIC && (window.DEYN_LIC.role === 'M' || window.DEYN_LIC.role === 'W')) {
      return window.DEYN_LIC.role === 'W';
    }
    return !!(typeof S !== 'undefined' && S && S.auth && S.auth.licRole === 'W');
  };

  window.applyLicenseRole = function () {
    var L = window.DEYN_LIC;
    if (!L || typeof S === 'undefined' || !S) return;
    if (!S.auth) S.auth = {};
    S.auth.licRole = L.role === 'W' ? 'W' : 'M';
    S.auth.deviceRole = L.role === 'W' ? 'worker' : 'master';
    if (L.role === 'M') S.auth.masterCode = L.code;
    else if (L.role === 'W') S.auth.assistantCode = L.code;
    if (L.exp) {
      var d = new Date(L.exp - 3600000);
      S.auth.expiry = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    } else {
      S.auth.expiry = 'مدى الحياة';
    }
  };

  // Completely disable manual in-app role switching in both directions (M->W and W->M).
  // Changing a device's role requires activating a new DEYN3 license issued by deyn-keygen.
  const blockRoleSwitch = function () {
    toast(tr('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒'), 'err');
    return false;
  };
  window.openSwitchToOwnerModal = blockRoleSwitch;
  window.submitSwitchToOwner = async function () { return blockRoleSwitch(); };
  if (typeof A === 'object' && A) {
    A.switchDeviceRole = blockRoleSwitch;
    A.ownerSwitchSubmit = blockRoleSwitch;
  }
  if (typeof READONLY_OK !== 'undefined' && READONLY_OK && typeof READONLY_OK.delete === 'function') {
    READONLY_OK.delete('switchDeviceRole');
    READONLY_OK.delete('ownerSwitchSubmit');
  }

  // ============================================================================
  // 4. CLOCK PROTECTION COMPLETION (Monotonic Anchor + Timezone Immunity + Actions)
  // ============================================================================
  let LAST_TZ_OFFSET = new Date().getTimezoneOffset();
  let DISMISSED_EPISODE_WARN = 0;
  let NATIVE_MONO_OFFSET_MS = null; // wallMs - elapsedRealtimeMs anchored when clock is healthy

  function getMonotonicNowMs() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return 0;
  }

  // Refresh native Android SystemClock.elapsedRealtime() anchor when available
  async function syncNativeMonotonicClock() {
    try {
      const bp = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynBackup) || null;
      if (bp && typeof bp.getMonotonicTime === 'function') {
        const r = await bp.getMonotonicTime();
        if (r && Number.isFinite(r.elapsedRealtimeMs) && r.elapsedRealtimeMs > 0) {
          const wallNow = Date.now();
          if (NATIVE_MONO_OFFSET_MS === null && DEYN_TP && DEYN_TP.status === 'OK') {
            NATIVE_MONO_OFFSET_MS = wallNow - r.elapsedRealtimeMs;
          }
          return r.elapsedRealtimeMs;
        }
      }
    } catch (e) {}
    return null;
  }

  const origEvaluate = window.evaluate;
  window.evaluate = function (prev, obs, opts = {}) {
    const tol = opts.tolerance ?? (typeof TOLERANCE_MS !== 'undefined' ? TOLERANCE_MS : 5 * 60 * 1000);
    const grace = opts.grace ?? (typeof GRACE_MS !== 'undefined' ? GRACE_MS : 48 * 3600 * 1000);
    const afterGrace = opts.afterGrace ?? 'READ_ONLY';

    const sIn = { ...(prev || {}) };
    const now = obs.now;
    let effectiveObs = { ...obs };
    const perfNow = getMonotonicNowMs();

    // Anchor lastValidWall and lastValidPerf ONLY when status is OK (no active episode) and no abnormal forward/backward jump occurred
    if (!sIn.episode) {
      if (sIn.lastSeen === 0 || (now >= sIn.lastSeen - tol && (now - sIn.lastSeen) <= Math.max(tol, 15 * 60 * 1000))) {
        sIn.lastValidWall = now;
        sIn.lastValidPerf = perfNow;
      } else if (!sIn.lastValidWall && sIn.lastSeen > 0) {
        sIn.lastValidWall = sIn.lastSeen;
        sIn.lastValidPerf = perfNow;
      }
    }

    // When offline (obs.trusted == null):
    // 1) If the user explicitly clicked "حسناً" (allowMonotonicRecovery: true) AND restored the clock to match
    //    the pre-tamper monotonic timeline (lastValidWall + elapsed monotonic time within tolerance), supply that reference.
    if (sIn.episode && effectiveObs.trusted == null && opts.allowMonotonicRecovery && sIn.lastValidWall && Number.isFinite(sIn.lastValidPerf)) {
      const elapsedMs = Math.max(0, perfNow - sIn.lastValidPerf);
      const expectedReal = sIn.lastValidWall + elapsedMs;
      if (Math.abs(now - expectedReal) <= tol) {
        effectiveObs.trusted = expectedReal;
      }
    }

    const res = origEvaluate(sIn, effectiveObs, { tolerance: tol, grace, afterGrace });
    if (sIn.lastValidWall) {
      res.state.lastValidWall = res.status === 'OK' ? now : sIn.lastValidWall;
      res.state.lastValidPerf = res.status === 'OK' ? perfNow : sIn.lastValidPerf;
    }
    return res;
  };

  // Interactive banner with "لاحقاً" (Later) and "حسناً" (OK / Verify now) buttons
  window.deynBanner = function (txt, kind) {
    var el = document.getElementById('deynTimeBanner');
    if (!txt) {
      if (el) el.remove();
      return;
    }
    var warnKey = (DEYN_TP && DEYN_TP.status) + ':' + (DEYN_TP && DEYN_TP.state && DEYN_TP.state.warnings);
    if (kind === 'w' && DISMISSED_EPISODE_WARN === warnKey) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.id = 'deynTimeBanner';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:100003;padding:8px 12px;font:700 12px/1.6 system-ui,sans-serif;direction:' + (isFr() ? 'ltr' : 'rtl') + ';color:#fff;background:' + (kind === 'ro' ? '#b91c1c' : '#b45309') + ';display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap';
    const displayTxt = isFr() ? tr(txt) : txt;
    el.innerHTML = `<span id="deynTimeBannerText" style="flex:1;min-width:180px">${escHtml(displayTxt)}</span>` +
      `<div class="tb-actions" style="display:flex;gap:6px">` +
      `<button type="button" class="tb-btn" id="deynTbLater">${escHtml(tr('لاحقاً'))}</button>` +
      `<button type="button" class="tb-btn" id="deynTbOk" style="background:#fff;color:#0f172a;border-color:#fff">${escHtml(tr('حسناً'))}</button>` +
      `</div>`;
    const btnLater = document.getElementById('deynTbLater');
    const btnOk = document.getElementById('deynTbOk');
    if (btnLater) {
      btnLater.onclick = function () {
        if (DEYN_TP && DEYN_TP.status !== 'READ_ONLY') {
          DISMISSED_EPISODE_WARN = warnKey;
          el.remove();
        } else {
          toast(tr('انتهت مهلة الـ 48 ساعة، يرجى ضبط الساعة والضغط على حسناً للتحقق'), 'warn');
        }
      };
    }
    if (btnOk) {
      btnOk.onclick = async function () {
        DISMISSED_EPISODE_WARN = 0;
        await window.deynVerifyClockFixed();
      };
    }
  };

  window.deynVerifyClockFixed = async function () {
    const gotRemote = await deynFetchTrustedTime();
    if (!gotRemote && DEYN_TP && DEYN_TP.state) {
      const res = window.evaluate(DEYN_TP.state, { now: Date.now(), trusted: deynTrustedObs() }, { allowMonotonicRecovery: true });
      DEYN_TP.state = res.state;
      DEYN_TP.status = res.status;
      DEYN_TP.graceLeftMs = res.graceLeftMs;
      DEYN_TP.warningNo = res.warningNo || DEYN_TP.warningNo;
      DEYN_LAST = res.state.lastSeen;
      deynTpUi(res);
      await DeynStore.set('tp', JSON.stringify(res.state)).catch(() => {});
    }
    if (DEYN_TP && DEYN_TP.status === 'OK') {
      toast(tr('تم التحقق من صحة الساعة وإزالة التحذير بنجاح ✅'), 'ok');
      return true;
    }
    toast(tr('الساعة لا تزال غير مطابقة للوقت الحقيقي أو يلزم الاتصال بالإنترنت للتحقق'), 'warn');
    return false;
  };

  const origClockTick = window.deynClockTick;
  window.deynClockTick = function (force) {
    if (!DEYN_TP || !DEYN_TP.state) return true;
    const curTz = new Date().getTimezoneOffset();
    if (curTz !== LAST_TZ_OFFSET) {
      LAST_TZ_OFFSET = curTz;
    }
    const prevWarn = DEYN_TP.state.warnings;
    const r = origClockTick(force);
    if (DEYN_TP.state.warnings !== prevWarn) {
      DISMISSED_EPISODE_WARN = 0;
    }
    return r;
  };

  // ============================================================================
  // 2 & 3. AUTOMATIC EXTERNAL BACKUP & LICENSE-BOUND JSON RESTORE
  // ============================================================================
  const backupPlug = () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynBackup) || null;
  const BACKUP_FORMAT = 'DEYN-BACKUP-V2';
  let autoBackupTimer = null;
  let autoBackupRetryTimer = null;
  let lastAutoBackupHash = '';
  let lastAutoBackupStatus = { ok: false, reason: 'not_run' };

  function buildBackupEnvelope() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.customers) || !Array.isArray(S.pending)) return null;
    const cleanState = JSON.parse(JSON.stringify(S));
    // Strip sensitive credentials, license tokens, and role elevation fields so JSON can NEVER transfer privileges or secrets
    if (cleanState.auth) {
      delete cleanState.auth.masterPass;
      delete cleanState.auth.masterCode;
      delete cleanState.auth.assistantCode;
      delete cleanState.auth.pw;
      delete cleanState.auth.pwFail;
      delete cleanState.auth.pwMustSet;
      delete cleanState.auth.pwMigrated;
      delete cleanState.auth.licRole;
      delete cleanState.auth.deviceRole;
    }
    delete cleanState.sync;
    return {
      format: BACKUP_FORMAT,
      version: 2,
      appVersion: '1.0.0',
      exportedAt: Date.now(),
      deviceId: String(window.DEYN_DEV_ID || ''),
      summary: {
        customersCount: cleanState.customers.length,
        pendingCount: cleanState.pending.length,
        trashCount: Array.isArray(cleanState.trash) ? cleanState.trash.length : 0
      },
      data: cleanState
    };
  }

  /**
   * Computes a comprehensive deterministic fingerprint covering ALL merchant data fields:
   * customers (and all their transactions/extensions), pending tickets, trash/archive,
   * customSegs, deletedSegs, guaranteed flags, settings, smsLog, notifLog, and seq.
   */
  function computeBackupFingerprint(data) {
    if (!data || typeof data !== 'object') return '';
    return JSON.stringify({
      seq: data.seq || 0,
      customers: data.customers || [],
      pending: data.pending || [],
      trash: data.trash || [],
      customSegs: data.customSegs || {},
      deletedSegs: data.deletedSegs || [],
      guaranteed: data.guaranteed || {},
      settings: data.settings || {},
      smsLog: data.smsLog || {},
      notifLog: data.notifLog || {}
    });
  }

  function validateBackupPayload(rawText) {
    if (typeof rawText !== 'string' || !rawText.trim()) {
      return { ok: false, reason: 'ملف النسخة الاحتياطية فارغ أو غير صالح' };
    }
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      return { ok: false, reason: 'ملف JSON تالف ولا يمكن قراءته' };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, reason: 'بنية ملف النسخة الاحتياطية غير متوافقة' };
    }
    const isEnvelope = parsed.format === BACKUP_FORMAT || (parsed.version === 2 && parsed.data && typeof parsed.data === 'object');
    const stateObj = isEnvelope ? parsed.data : parsed;
    const metaDevId = isEnvelope && typeof parsed.deviceId === 'string'
      ? parsed.deviceId
      : (parsed.__backupMeta && typeof parsed.__backupMeta.deviceId === 'string' ? parsed.__backupMeta.deviceId : '');
    const originDeviceId = metaDevId ? metaDevId.trim().toLowerCase() : null;

    if (!stateObj || typeof stateObj !== 'object' || !Array.isArray(stateObj.customers) || !Array.isArray(stateObj.pending)) {
      return { ok: false, reason: 'ملف النسخة الاحتياطية لا يحتوي على سجلات الزبائن والتذاكر المطلوبة' };
    }

    const seenCustIds = new Set();
    const seenTxIds = new Set();
    for (let i = 0; i < stateObj.customers.length; i++) {
      const c = stateObj.customers[i];
      if (!c || typeof c !== 'object' || typeof c.id !== 'string' || !c.id.trim() || typeof c.name !== 'string' || !c.name.trim()) {
        return { ok: false, reason: `بيانات الزبون رقم ${i + 1} في الملف تالفة أو ناقصة` };
      }
      if (seenCustIds.has(c.id)) {
        return { ok: false, reason: 'ملف النسخة الاحتياطية يحتوي على معرفات زبائن مكررة' };
      }
      seenCustIds.add(c.id);
      if (c.tx !== undefined && !Array.isArray(c.tx)) {
        return { ok: false, reason: `سجل عمليات الزبون «${c.name}» غير صالح` };
      }
      for (const tx of (c.tx || [])) {
        if (!tx || typeof tx !== 'object' || typeof tx.id !== 'string' || !tx.id.trim() || !['debt', 'pay'].includes(tx.type) || !Number.isFinite(Number(tx.amount)) || Number(tx.amount) < 0) {
          return { ok: false, reason: `عملية مالية تالفة في حساب «${c.name}»` };
        }
        if (seenTxIds.has(tx.id)) {
          return { ok: false, reason: 'ملف النسخة الاحتياطية يحتوي على معرفات عمليات مكررة' };
        }
        seenTxIds.add(tx.id);
      }
    }
    for (let i = 0; i < stateObj.pending.length; i++) {
      const p = stateObj.pending[i];
      if (!p || typeof p !== 'object' || typeof p.id !== 'string' || !p.id.trim() || !Number.isFinite(Number(p.amount)) || Number(p.amount) < 0) {
        return { ok: false, reason: `بيانات التذكرة المعلقة رقم ${i + 1} تالفة` };
      }
    }
    if (stateObj.trash !== undefined && !Array.isArray(stateObj.trash)) {
      return { ok: false, reason: 'سجل سلة المهملات في النسخة الاحتياطية غير صالح' };
    }

    return {
      ok: true,
      originDeviceId,
      stateObj: JSON.parse(JSON.stringify(stateObj)),
      customersCount: stateObj.customers.length,
      pendingCount: stateObj.pending.length
    };
  }

  function scheduleAutoBackupRetry(delayMs = 15000) {
    clearTimeout(autoBackupRetryTimer);
    autoBackupRetryTimer = setTimeout(() => {
      runAutoBackupNow();
    }, delayMs);
  }

  /**
   * Executes an automatic external backup to the user-selected Android SAF folder.
   * NEVER reports success or updates lastAutoBackupHash unless DeynBackupPlugin confirms
   * the external file was atomically written, synced, and verified.
   */
  async function runAutoBackupNow(opts = {}) {
    try {
      const env = buildBackupEnvelope();
      if (!env) {
        lastAutoBackupStatus = { ok: false, reason: 'no_state', retryable: true };
        return lastAutoBackupStatus;
      }
      const fingerprint = computeBackupFingerprint(env.data);
      if (!opts.force && fingerprint === lastAutoBackupHash && lastAutoBackupStatus.ok) {
        return { ok: true, skipped: true, at: lastAutoBackupStatus.at };
      }

      const jsonStr = JSON.stringify(env, null, 2);
      window.__deynLastAutoBackupJson = jsonStr;

      const bp = backupPlug();
      if (!bp || typeof bp.writeAutoBackup !== 'function') {
        // Native Android SAF plugin is unavailable: return explicit failure, do NOT update lastAutoBackupHash
        lastAutoBackupStatus = { ok: false, reason: 'plugin_unavailable', retryable: true };
        return lastAutoBackupStatus;
      }

      const res = await bp.writeAutoBackup({ data: jsonStr });
      if (res && res.ok === true) {
        clearTimeout(autoBackupRetryTimer);
        lastAutoBackupHash = fingerprint;
        lastAutoBackupStatus = {
          ok: true,
          at: res.at || Date.now(),
          seq: res.seq || 0,
          bytes: res.bytes || jsonStr.length
        };
        if (S && S.settings) S.settings.lastAutoBackupAt = lastAutoBackupStatus.at;
        return lastAutoBackupStatus;
      }

      // External write did not succeed (no_folder, permission_lost, or write_error):
      // Do NOT update lastAutoBackupHash, preserve retry capability, and surface appropriate warning
      const reason = (res && res.reason) || 'write_error';
      lastAutoBackupStatus = {
        ok: false,
        reason,
        error: (res && res.error) || '',
        retryable: true
      };
      if (reason === 'write_error') {
        toast(tr('تعذّر تحديث النسخة الاحتياطية الخارجية (تحقق من مساحة الهاتف أو المجلد). آخر نسخة سليمة محفوظة ⚠️'), 'warn');
        scheduleAutoBackupRetry(15000);
      } else if (reason === 'permission_lost') {
        toast(tr('فُقد إذن الوصول إلى مجلد النسخ الاحتياطي الخارجي — يرجى إعادة اختيار المجلد من الإعدادات ⚠️'), 'warn');
      }
      return lastAutoBackupStatus;
    } catch (e) {
      const errMsg = String((e && e.message) || e);
      lastAutoBackupStatus = { ok: false, reason: 'exception', error: errMsg, retryable: true };
      scheduleAutoBackupRetry(15000);
      return lastAutoBackupStatus;
    }
  }

  function scheduleAutoBackup() {
    clearTimeout(autoBackupTimer);
    autoBackupTimer = setTimeout(() => { runAutoBackupNow(); }, 350);
  }

  /**
   * Reads and validates the external SAF auto-backup.
   * Tries the primary file ("deyn-auto-backup.json") first; if reading fails OR its JSON content is corrupt/invalid,
   * automatically falls back to the previous backup ("deyn-auto-backup.prev.json") and validates it.
   */
  async function readValidatedAutoBackupFromSaf() {
    const bp = backupPlug();
    if (!bp || typeof bp.readAutoBackup !== 'function') {
      return { ok: false, reason: 'إضافة النسخ الاحتياطي لأندرويد غير متاحة في هذه البيئة' };
    }
    // 1. Try primary backup first (note: DeynBackupPlugin.readAutoBackup already falls back to .prev.json if main is unreadable/corrupt at JSON level)
    let primaryErr = '';
    try {
      const r1 = await bp.readAutoBackup({ preferPrev: false });
      if (r1 && r1.data) {
        const v1 = validateBackupPayload(r1.data);
        if (v1.ok) {
          return Object.assign({}, v1, {
            rawText: r1.data,
            source: r1.source || 'deyn-auto-backup.json',
            fallbackUsed: !!r1.fallbackUsed
          });
        }
        primaryErr = v1.reason;
      }
    } catch (e) {
      primaryErr = String((e && e.message) || e);
    }

    // 2. If primary failed deep schema validation in validateBackupPayload, explicitly request .prev.json
    try {
      const r2 = await bp.readAutoBackup({ preferPrev: true });
      if (r2 && r2.data) {
        const v2 = validateBackupPayload(r2.data);
        if (v2.ok) {
          return Object.assign({}, v2, {
            rawText: r2.data,
            source: r2.source || 'deyn-auto-backup.prev.json',
            fallbackUsed: true
          });
        }
        return { ok: false, reason: v2.reason };
      }
    } catch (e2) {
      return { ok: false, reason: primaryErr || String((e2 && e2.message) || e2) };
    }
    return { ok: false, reason: primaryErr || 'لم يتم العثور على نسخة احتياطية صالحة في المجلد المختار' };
  }

  const origBackupFn = window.backup;
  window.backup = function () {
    try {
      const env = buildBackupEnvelope();
      if (!env) return origBackupFn();
      const payload = Object.assign({}, env.data, {
        __backupMeta: {
          format: BACKUP_FORMAT,
          version: 2,
          deviceId: env.deviceId,
          exportedAt: env.exportedAt
        }
      });
      const b = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      const d = new Date();
      a.download = `deyn-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    } catch (e) {
      toast(tr('تعذّر تحميل النسخة'), 'err');
    }
  };
  if (typeof A === 'object' && A) A.backup = window.backup;

  /**
   * Atomically applies a validated backup payload ONLY after cryptographic DEYN3 license verification succeeds.
   * Never imports passwords, licenses, or M/W role fields from JSON, and verifies durable storage persistence
   * (including awaiting DeynVault flush) before declaring success.
   */
  async function applyVerifiedRestore(validated, verifiedLic) {
    if (!validated || !validated.ok || !verifiedLic || !verifiedLic.role) {
      throw new Error(tr('بيانات الاستعادة أو الترخيص غير صالحة'));
    }
    const previousSnapshot = (typeof S !== 'undefined' && S) ? JSON.parse(JSON.stringify(S)) : null;
    const previousLic = window.DEYN_LIC || null;
    try {
      const incoming = JSON.parse(JSON.stringify(validated.stateObj));
      // Strip any auth/role/password/license fields that might exist inside incoming stateObj
      delete incoming.auth;
      delete incoming.sync;

      const preservedAuth = (typeof S !== 'undefined' && S && S.auth) ? JSON.parse(JSON.stringify(S.auth)) : {
        phone: '0555 12 34 56',
        pwMustSet: true,
        maxDevices: 2
      };
      const cleanIncomingSettings = (incoming.settings && typeof incoming.settings === 'object' && !Array.isArray(incoming.settings))
        ? Object.assign({}, incoming.settings)
        : {};
      // Never allow imported settings to enable appLock if the current device has no password set
      if (!preservedAuth.pw) {
        delete cleanIncomingSettings.appLockEnabled;
      }
      const preservedSettings = Object.assign(
        { dialect: true, sound: true, notifs: true, assistantStatsLocked: true },
        (typeof S !== 'undefined' && S && S.settings) || {},
        cleanIncomingSettings
      );

      const nextState = {
        seq: Number.isInteger(incoming.seq) && incoming.seq > 0
          ? incoming.seq
          : (Math.max(0, ...incoming.pending.map(t => Number(t.no) || 0)) + 1),
        settings: preservedSettings,
        auth: preservedAuth,
        customers: incoming.customers,
        pending: incoming.pending,
        trash: Array.isArray(incoming.trash) ? incoming.trash : [],
        customSegs: (incoming.customSegs && typeof incoming.customSegs === 'object' && !Array.isArray(incoming.customSegs)) ? incoming.customSegs : {},
        deletedSegs: Array.isArray(incoming.deletedSegs) ? incoming.deletedSegs : [],
        guaranteed: (incoming.guaranteed && typeof incoming.guaranteed === 'object' && !Array.isArray(incoming.guaranteed)) ? incoming.guaranteed : {},
        smsLog: (incoming.smsLog && typeof incoming.smsLog === 'object' && !Array.isArray(incoming.smsLog)) ? incoming.smsLog : {},
        notifLog: (incoming.notifLog && typeof incoming.notifLog === 'object' && !Array.isArray(incoming.notifLog)) ? incoming.notifLog : {}
      };

      // Bind the verified license role strictly from the cryptographic DEYN3 token
      window.DEYN_LIC = verifiedLic;
      DEYN_LIC = verifiedLic;
      S = nextState;
      window.applyLicenseRole();
      if (typeof DeynSyncLib !== 'undefined' && DEYN_DEV_ID) {
        DeynSyncLib.ensureSync(S, DEYN_DEV_ID);
        DeynSyncLib.resnapshot(S, DEYN_DEV_ID);
      }

      if (!window.persist()) {
        throw new Error(tr('تعذّر حفظ البيانات المستعادة في التخزين المحلي'));
      }
      if (typeof deynFlush === 'function') {
        await deynFlush();
      }
      if (typeof storageBlocked !== 'undefined' && storageBlocked) {
        throw new Error(tr('فشل التحقق من حفظ البيانات المشفرة'));
      }
      renderAll();
      return true;
    } catch (err) {
      if (previousSnapshot) {
        S = previousSnapshot;
        window.DEYN_LIC = previousLic;
        DEYN_LIC = previousLic;
        try { origPersistForBackup(); } catch (e) {}
      }
      throw err;
    }
  }

  function pickJsonFileText() {
    return new Promise((resolve) => {
      let input = document.getElementById('deynRestoreFileInput');
      if (input) input.remove();
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'deynRestoreFileInput';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.onchange = () => {
        const f = input.files && input.files[0];
        if (!f) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () => resolve({ name: f.name, text: String(reader.result || '') });
        reader.onerror = () => resolve({ name: f.name, error: 'read_error' });
        reader.readAsText(f);
      };
      input.click();
    });
  }

  let pendingRestoreValidated = null;
  let pendingRestoreFromGate = false;

  async function openRestoreJsonFlow(fromGate, preloadedText, opts = {}) {
    let v = null;
    if (opts && opts.useSafAuto) {
      const safRes = await readValidatedAutoBackupFromSaf();
      if (!safRes.ok) {
        const msg = tr(safRes.reason || 'تعذّرت قراءة النسخة التلقائية من المجلد');
        return fromGate ? agToast(msg) : toast(msg, 'err');
      }
      v = safRes;
      if (safRes.fallbackUsed) {
        toast(tr('تم التحول تلقائياً إلى النسخة الاحتياطية السابقة السليمة (.prev.json) بسبب تعذّر قراءة النسخة الرئيسية ⚠️'), 'warn');
      }
    } else {
      let rawText = preloadedText || null;
      if (!rawText) {
        const picked = await pickJsonFileText();
        if (!picked) return;
        if (picked.error) {
          const msg = tr('تعذّرت قراءة ملف JSON المختار');
          return fromGate ? agToast(msg) : toast(msg, 'err');
        }
        rawText = picked.text;
      }
      v = validateBackupPayload(rawText);
      if (!v.ok) {
        const msg = tr(v.reason);
        return fromGate ? agToast(msg) : toast(msg, 'err');
      }
    }

    pendingRestoreValidated = v;
    pendingRestoreFromGate = !!fromGate;

    const currentLic = (!fromGate && window.DEYN_LIC) ? window.DEYN_LIC : await deynLoadLicense();
    const prefilledCode = (currentLic && currentLic.code) ? currentLic.code : '';
    const isDifferentDevice = v.originDeviceId && DEYN_DEV_ID && v.originDeviceId !== DEYN_DEV_ID;

    const modal = openModal(() => `${sheetHead(tr('استعادة نسخة JSON'))}
      <div class="sub" style="line-height:1.75;margin-bottom:10px">
        ${escHtml(tr('تم التحقق من سلامة ملف النسخة الاحتياطية:'))}
        <b>${v.customersCount}</b> ${escHtml(tr('زبائن'))} • <b>${v.pendingCount}</b> ${escHtml(tr('تذكرة'))}.
      </div>
      ${isDifferentDevice ? `<div class="note w" style="margin-bottom:10px;line-height:1.6">${escHtml(tr('تنبيه: هذه النسخة مأخوذة من جهاز آخر. لإتمام الاستعادة على هذا الهاتف، أدخل كود التفعيل الصالح لمعرّف هذا الجهاز الصادر من مولّد الأكواد.'))}</div>` : `<div class="sub" style="margin-bottom:10px">${escHtml(tr('لإتمام الاستعادة بأمان، أدخل كود التفعيل الخاص بهذا الجهاز:'))}</div>`}
      <label class="lbl">${escHtml(tr('معرّف الجهاز'))}</label>
      <div class="num" style="direction:ltr;word-break:break-all;font-size:12.5px;background:#f1f5f9;border-radius:10px;padding:8px 10px">${escHtml(String(DEYN_DEV_ID || ''))}</div>
      <label class="lbl" for="restoreLicInput" style="margin-top:10px">${escHtml(tr('كود التفعيل'))} *</label>
      <input class="inp" id="restoreLicInput" type="text" dir="ltr" style="text-align:left" value="${escHtml(prefilledCode)}" placeholder="DEYN3-..." autocomplete="off" spellcheck="false">
      <div class="two" style="margin-top:16px">
        <button type="button" class="btn" data-act="closeTop">${escHtml(tr('إلغاء'))}</button>
        <button type="button" class="btn pri" data-act="confirmRestoreJson" data-primary>${escHtml(tr('تأكيد الاستعادة'))}</button>
      </div>`);
    modal.wrap.style.zIndex = '100002';
  }

  async function confirmRestoreJson() {
    if (!pendingRestoreValidated) return;
    const inp = lastById('restoreLicInput');
    const code = inp ? inp.value.trim() : '';
    if (!code) {
      toast(tr('أدخل كود التفعيل للتحقق من أحقية الاستعادة'), 'err');
      return;
    }
    if (!DEYN_DEV_ID) {
      DEYN_DEV_ID = await deynGetDeviceId();
    }
    const verified = await deynVerifyCode(code, DEYN_DEV_ID);
    if (!verified) {
      toast(tr('كود التفعيل غير صالح لهذا الجهاز أو انتهت صلاحيته — تم رفض الاستعادة'), 'err');
      return;
    }

    try {
      await DeynStore.set('lic', JSON.stringify({ code: verified.code }));
      let used = [];
      try { used = JSON.parse((await DeynStore.get('used')) || '[]'); if (!Array.isArray(used)) used = []; } catch (e) { used = []; }
      if (used.indexOf(verified.code) < 0) {
        used.push(verified.code);
        await DeynStore.set('used', JSON.stringify(used));
      }

      if (pendingRestoreFromGate && !DEYN_STARTED) {
        DEYN_LIC = verified;
        window.DEYN_LIC = verified;
        agStartApp();
        await new Promise(r => setTimeout(r, 350));
      }

      await applyVerifiedRestore(pendingRestoreValidated, verified);
      pendingRestoreValidated = null;
      closeModal();
      toast(tr('تمت استعادة النسخة الاحتياطية بنجاح ✅'), 'ok');
    } catch (e) {
      toast(tr('فشلت عملية الاستعادة وبقيت بياناتك الحالية محمية:') + ' ' + (e.message || e), 'err');
    }
  }

  function injectActivationGateRestoreLink() {
    const foot = document.querySelector('#actGate .ag-foot');
    if (!foot || document.getElementById('agRestoreJsonBtn')) return;
    const note = foot.querySelector('.ag-note');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'agRestoreJsonBtn';
    btn.className = 'ag-restore-link';
    btn.textContent = tr('استعادة نسخة JSON');
    btn.onclick = () => openRestoreJsonFlow(true, null);
    if (note && note.parentNode) note.after(btn);
    else foot.appendChild(btn);
  }
  injectActivationGateRestoreLink();

  async function selectSafBackupFolder() {
    if (!requireOwner('إعداد النسخ الاحتياطي التلقائي')) return false;
    const bp = backupPlug();
    if (!bp || typeof bp.selectBackupFolder !== 'function') {
      toast(tr('اختيار مجلد النسخ الاحتياطي الخارجي يتطلب تشغيل التطبيق على نظام أندرويد ⚠️'), 'err');
      return false;
    }
    try {
      const r = await bp.selectBackupFolder();
      if (r && r.configured) {
        const writeRes = await runAutoBackupNow({ force: true });
        if (writeRes && writeRes.ok) {
          toast(tr('تم ربط مجلد النسخ الاحتياطي التلقائي وحفظ النسخة بنجاح ✅'), 'ok');
          stack.forEach(m => m.refresh && m.refresh());
          return true;
        }
        toast(tr('تم اختيار المجلد لكن تعذّرت كتابة النسخة الاحتياطية الأولى ⚠️'), 'warn');
        return false;
      }
    } catch (e) {
      toast(tr('لم يتم اختيار مجلد النسخ الاحتياطي'), 'warn');
    }
    return false;
  }

  // ============================================================================
  // 5 & 6. PERSISTENT NOTIFICATION LOG (READ/UNREAD) & NATIVE ANDROID NOTIFICATIONS
  // ============================================================================
  const notifPlug = () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynNotif) || null;
  let notifFilter = 'all';
  let notifScheduleTimer = null;

  function ensureNotifLog() {
    if (typeof S === 'undefined' || !S) return {};
    if (!S.notifLog || typeof S.notifLog !== 'object' || Array.isArray(S.notifLog)) {
      S.notifLog = {};
    }
    return S.notifLog;
  }

  // Synchronize active alerts into S.notifLog and remove obsolete unread alerts when debts are paid or modified
  function syncAlertsToLog() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.customers)) return [];
    const log = ensureNotifLog();
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const activeAlerts = getAlertedCustomers();
    const activeKeySet = new Set();
    let changed = false;

    for (const item of activeAlerts) {
      const c = item.customer;
      const b = item.balance;
      let eventType = 'due_today';
      let eventKey = `today|${c.id}|${ym}|${item.pi ? item.pi.day : 0}`;
      let body = '';

      if (item.isOverdue) {
        eventType = 'overdue';
        eventKey = `overdue|${c.id}|${ym}|${item.pi ? item.pi.day : 0}`;
        body = `⚠️ متأخر بـ ${item.pi.diff} ${item.pi.diff <= 2 ? (item.pi.diff === 1 ? 'يوم' : 'يومين') : 'أيام'} (موعده يوم ${item.pi.day}) — ${fmt(b)} دج`;
      } else if (item.isOverCeil) {
        eventType = 'over_ceiling';
        eventKey = `ceil|${c.id}|${Math.round(b)}|${Math.round(c.ceiling)}`;
        body = `🚨 تجاوز سقف الدين (${fmt(b)} / ${fmt(c.ceiling)} دج)`;
      } else if (item.isToday) {
        eventType = 'due_today';
        eventKey = `today|${c.id}|${ym}|${item.pi ? item.pi.day : 0}`;
        body = `🕒 موعد السداد اليوم (يوم ${item.pi.day}) — ${fmt(b)} دج`;
      }

      activeKeySet.add(eventKey);
      if (!log[eventKey]) {
        log[eventKey] = {
          key: eventKey,
          cid: c.id,
          customerName: c.name,
          type: eventType,
          balance: b,
          body,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          read: false,
          notifiedNative: false
        };
        changed = true;
      } else {
        if (log[eventKey].customerName !== c.name || log[eventKey].balance !== b || log[eventKey].body !== body) {
          log[eventKey].customerName = c.name;
          log[eventKey].balance = b;
          log[eventKey].body = body;
          log[eventKey].updatedAt = Date.now();
          changed = true;
        }
      }
    }

    // If a customer paid off their debt or their payDay/ceiling changed so an unread alert is no longer active, remove the stale unread alert
    const existingCustIds = new Set((S.customers || []).map(c => c.id));
    for (const k of Object.keys(log)) {
      const entry = log[k];
      if (!entry) continue;
      if (!existingCustIds.has(entry.cid) || (!activeKeySet.has(k) && !entry.read)) {
        delete log[k];
        changed = true;
      }
    }

    if (changed) {
      try { origPersistForBackup(); } catch (e) {}
    }
    return Object.values(log).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  async function dispatchAndScheduleNativeNotifications() {
    if (typeof S === 'undefined' || !S || !S.settings) return;
    const np = notifPlug();
    if (!S.settings.notifs) {
      // If notifications are turned off, clear scheduled WorkManager notifications
      if (np && typeof np.schedule === 'function') {
        try { await np.schedule({ items: [] }); } catch (e) {}
      }
      return;
    }

    const entries = syncAlertsToLog();
    if (!np) return;

    try {
      const perm = await np.checkPermissions();
      if (!perm || perm.notifications !== 'granted') return;

      let dirty = false;
      for (const entry of entries) {
        if (!entry.notifiedNative && !entry.read) {
          const r = await np.notifyNow({
            key: entry.key,
            title: `DEYN — ${entry.customerName}`,
            body: isFr() ? tr(entry.body) : entry.body,
            force: false
          });
          if (r && (r.posted || r.duplicate)) {
            entry.notifiedNative = true;
            dirty = true;
          }
        }
      }
      if (dirty) {
        try { origPersistForBackup(); } catch (e) {}
      }

      // Schedule next-day overdue notifications (at 09:00 the day after each customer's payDay) via WorkManager.
      // Passing only customers who currently have bal(c) > 0 automatically cancels any previously scheduled notification
      // for customers who paid off or modified their debt!
      const now = new Date();
      const scheduledItems = [];
      for (const c of (S.customers || [])) {
        const b = bal(c);
        if (!c.payDay || b <= 0) continue;
        for (let mOffset = 0; mOffset < 2; mOffset++) {
          const y = now.getFullYear(), m = now.getMonth() + mOffset;
          const dim = new Date(y, m + 1, 0).getDate();
          const payDayClamped = Math.min(c.payDay, dim);
          const nextDayNineAm = new Date(y, m, payDayClamped + 1, 9, 0, 0, 0).getTime();
          if (nextDayNineAm > Date.now()) {
            const targetDate = new Date(y, m, 1);
            const ym = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
            const key = `overdue|${c.id}|${ym}|${c.payDay}`;
            const bodyAr = `⚠️ متأخر بـ 1 يوم (موعده يوم ${c.payDay}) — ${fmt(b)} دج`;
            scheduledItems.push({
              key,
              title: `DEYN — ${c.name}`,
              body: isFr() ? tr(bodyAr) : bodyAr,
              at: nextDayNineAm
            });
            break;
          }
        }
      }
      await np.schedule({ items: scheduledItems });
    } catch (e) {
      console.warn('Native notification sync warning:', e);
    }
  }

  function scheduleNotifRefresh() {
    clearTimeout(notifScheduleTimer);
    notifScheduleTimer = setTimeout(() => {
      window.updateBellBadge();
      dispatchAndScheduleNativeNotifications();
    }, 120);
  }

  // Hook persist() so every successful merchant data change updates both the external auto-backup and the notification schedule
  const origPersistForBackup = window.persist;
  window.persist = function () {
    const ok = origPersistForBackup.apply(this, arguments);
    if (ok) {
      scheduleAutoBackup();
      scheduleNotifRefresh();
    }
    return ok;
  };

  window.updateBellBadge = function () {
    const badge = document.getElementById('bellBadge');
    if (!badge || typeof S === 'undefined' || !S) return;
    const all = syncAlertsToLog();
    const unreadCount = all.filter(x => !x.read).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  };

  window.openNotifsModal = function () {
    const m = openModal(() => {
      const entries = syncAlertsToLog();
      const unreadCount = entries.filter(x => !x.read).length;
      const filteredEntries = notifFilter === 'unread'
        ? entries.filter(x => !x.read)
        : (notifFilter === 'read' ? entries.filter(x => x.read) : entries);

      return `${sheetHead(tr('التنبيهات والمواعيد'), unreadCount ? `<span class="num">${unreadCount}</span> ${tr('غير مقروء')}` : tr('لا توجد تنبيهات جديدة'))}
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;flex-wrap:wrap">
          <div class="chips" style="margin:0;padding:0">
            <button type="button" class="chip ${notifFilter === 'all' ? 'on' : ''}" data-act="setNotifFilter" data-f="all">${tr('الكل')} <small>${entries.length}</small></button>
            <button type="button" class="chip ${notifFilter === 'unread' ? 'on' : ''}" data-act="setNotifFilter" data-f="unread">${tr('غير مقروء')} <small>${unreadCount}</small></button>
            <button type="button" class="chip ${notifFilter === 'read' ? 'on' : ''}" data-act="setNotifFilter" data-f="read">${tr('مقروء')} <small>${entries.length - unreadCount}</small></button>
          </div>
          ${unreadCount > 0 ? `<button type="button" class="btn sm soft" data-act="markAllNotifsRead" style="height:32px;font-size:11.5px;padding:0 10px">${tr('تحديد الكل كمقروء')}</button>` : ''}
        </div>
        ${!filteredEntries.length ? `
          <div class="empty-st" style="padding:32px 16px">
            <b style="font-size:15px;color:var(--ink);display:block;margin-bottom:6px">${tr('لا توجد تنبيهات في هذا القسم')}</b>
            <span style="color:var(--mute);font-size:12.5px">${tr('جميع الزبائن ملتزمون بمواعيد السداد وسقوف الديون المحددة.')}</span>
          </div>
        ` : `
          <div style="max-height:60vh;overflow-y:auto;padding-bottom:12px;margin-top:10px">
            ${filteredEntries.map(item => `
              <div class="nt notif-item ${item.read ? 'read' : 'unread'}" style="display:flex;align-items:center;gap:10px">
                <button type="button" data-act="openNotifCust" data-cid="${escHtml(item.cid)}" data-nkey="${escHtml(item.key)}" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;text-align:inherit">
                  <div class="av ${item.type === 'overdue' ? 'd' : (item.type === 'over_ceiling' ? 'o' : '')}">${escHtml((item.customerName || '؟').trim()[0])}</div>
                  <div class="nt-m">
                    <div class="nt-r">
                      <b>${escHtml(item.customerName)}</b>
                      <span class=" badge" style="font-size:10px;background:${item.read ? '#e2e8f0' : '#dcfce7'};color:${item.read ? '#475569' : '#166534'}">${tr(item.read ? 'مقروء' : 'جديد')}</span>
                    </div>
                    <div style="font-size:12px;color:var(--ink);margin-top:4px">${escHtml(tr(item.body))}</div>
                    <small class="num" style="color:var(--mute);font-size:10.5px">${dateStr(item.createdAt)} ${timeStr(item.createdAt)}</small>
                  </div>
                </button>
                <button type="button" class="btn sm" data-act="toggleNotifRead" data-nkey="${escHtml(item.key)}" style="height:30px;font-size:11px;padding:0 8px">${tr(item.read ? 'غير مقروء' : 'مقروء ✓')}</button>
              </div>
            `).join('')}
          </div>
        `}`;
    }, { refresh: () => m.paint() });
    return m;
  };

  const origCheckSmartNotifs = window.checkSmartNotifs;
  window.checkSmartNotifs = function () {
    if (origCheckSmartNotifs) origCheckSmartNotifs();
    window.updateBellBadge();
    dispatchAndScheduleNativeNotifications();
  };

  // ============================================================================
  // SETTINGS INJECTION (Restore JSON + SAF Folder Selection)
  // ============================================================================
  function decorateSettingsSheet(sheet) {
    if (!sheet) return;
    const backupBtn = sheet.querySelector('[data-act="backup"]');
    if (backupBtn && !sheet.querySelector('[data-act="restoreJsonSettings"]')) {
      const restoreBtn = document.createElement('button');
      restoreBtn.type = 'button';
      restoreBtn.className = 'btn block';
      restoreBtn.dataset.act = 'restoreJsonSettings';
      restoreBtn.style.cssText = 'background:#fff;color:#065043;border:1.5px solid #065043;border-radius:14px;height:48px;font-size:14.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px';
      restoreBtn.innerHTML = `<span>📂</span><span>${escHtml(tr('استعادة نسخة JSON'))}</span>`;
      backupBtn.after(restoreBtn);

      const safBtn = document.createElement('button');
      safBtn.type = 'button';
      safBtn.className = 'btn sm block';
      safBtn.dataset.act = 'selectBackupFolder';
      safBtn.style.cssText = 'background:#f8fafc;color:#065043;border:1px dashed #065043;border-radius:12px;height:40px;font-size:12.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px';
      safBtn.innerHTML = `<span>🛡️</span><span>${escHtml(tr('تحديد مجلد النسخ الاحتياطي التلقائي (خارج التطبيق)'))}</span>`;
      restoreBtn.after(safBtn);
    }
    if (typeof DEYN_I18N !== 'undefined' && typeof DEYN_I18N.translateRoot === 'function') {
      DEYN_I18N.translateRoot(sheet);
    }
  }

  const origOpenSettings = window.openSettings;
  window.openSettings = function () {
    const ret = origOpenSettings.apply(this, arguments);
    const m = ret || (typeof stack !== 'undefined' && stack.length ? stack[stack.length - 1] : null);
    const sheet = (m && m.wrap && m.wrap.querySelector('.sheet')) || document.querySelector('#modalRoot .ovl:last-child .sheet');
    decorateSettingsSheet(sheet);
    if (m && typeof m.paint === 'function' && !m.paint.__completionWrapped) {
      const origPaint = m.paint;
      m.paint = function () {
        const r = origPaint.apply(this, arguments);
        decorateSettingsSheet((m.wrap && m.wrap.querySelector('.sheet')) || document.querySelector('#modalRoot .ovl:last-child .sheet'));
        return r;
      };
      m.paint.__completionWrapped = true;
    }
    return m;
  };
  if (typeof A === 'object' && A) {
    A.settings = window.openSettings;
    A.notifs = window.openNotifsModal;
    A.restoreJsonSettings = () => openRestoreJsonFlow(false, null);
    A.restoreSafAutoBackup = () => openRestoreJsonFlow(false, null, { useSafAuto: true });
    A.confirmRestoreJson = () => confirmRestoreJson();
    A.selectBackupFolder = () => selectSafBackupFolder();
    A.setNotifFilter = d => { notifFilter = (d && d.f) || 'all'; stack.forEach(m => m.refresh && m.refresh()); };
    A.markAllNotifsRead = () => {
      const log = ensureNotifLog();
      Object.values(log).forEach(x => { x.read = true; });
      persist();
      window.updateBellBadge();
      stack.forEach(m => m.refresh && m.refresh());
    };
    A.toggleNotifRead = d => {
      const log = ensureNotifLog();
      if (d && d.nkey && log[d.nkey]) {
        log[d.nkey].read = !log[d.nkey].read;
        persist();
        window.updateBellBadge();
        stack.forEach(m => m.refresh && m.refresh());
      }
    };
    const origOpenNotifCust = A.openNotifCust;
    A.openNotifCust = d => {
      const log = ensureNotifLog();
      if (d && d.nkey && log[d.nkey]) {
        log[d.nkey].read = true;
        persist();
        window.updateBellBadge();
      } else if (d && d.cid) {
        Object.values(log).forEach(x => { if (x.cid === d.cid) x.read = true; });
        persist();
        window.updateBellBadge();
      }
      if (origOpenNotifCust) origOpenNotifCust(d);
    };
  }
  if (typeof READONLY_OK !== 'undefined' && READONLY_OK && typeof READONLY_OK.add === 'function') {
    ['setNotifFilter', 'markAllNotifsRead', 'toggleNotifRead', 'selectBackupFolder', 'restoreJsonSettings', 'restoreSafAutoBackup', 'confirmRestoreJson'].forEach(k => READONLY_OK.add(k));
  }

  // Expose programmatic APIs for testing and verification
  window.DeynBackupRuntime = {
    buildBackupEnvelope,
    computeBackupFingerprint,
    validateBackupPayload,
    runAutoBackupNow,
    readValidatedAutoBackupFromSaf,
    applyVerifiedRestore,
    openRestoreJsonFlow,
    confirmRestoreJson,
    getLastStatus: () => Object.assign({}, lastAutoBackupStatus)
  };
  window.DeynNotifRuntime = {
    syncAlertsToLog,
    dispatchAndScheduleNativeNotifications
  };

  setTimeout(() => {
    injectActivationGateRestoreLink();
    syncNativeMonotonicClock();
    if (typeof S !== 'undefined' && S) {
      window.applyLicenseRole();
      window.updateBellBadge();
      dispatchAndScheduleNativeNotifications();
      scheduleAutoBackup();
    }
  }, 400);
})();

</script>
</body>
</html>
```

================================================================================
## قائمة الملفات المدرجة في `PRO_4_SOURCE_BUNDLE_1.md` (1 ملفًا)

| # | المسار الأصلي للملف | الحجم (بايت) | SHA-256 (أول 16 خانة) |
|---|---|---|---|
| 1 | `deyn-app/www/index.html` | 455,357 | `569df2e14a52770a` |
