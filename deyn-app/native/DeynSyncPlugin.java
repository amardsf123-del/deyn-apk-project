package com.deyn.app;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.net.Inet4Address;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Raw TCP transport for DEYN local sync. It only moves length-prefixed frames; ALL authentication and encryption (X25519 + Ed25519 + AES-GCM)
 * is done in JavaScript (sync/session.js), so a malicious peer on the Wi-Fi only ever sees ciphertext.
 * Frame format: 4-byte big-endian length, then UTF-8 JSON text. Max 1 MiB per frame.
 * STATUS: written but NOT compiled or run on a device (no Android SDK / javac in the authoring environment).
 */
@CapacitorPlugin(name = "DeynSync")
public class DeynSyncPlugin extends Plugin {
    private static final int MAX_FRAME = 1 << 20;
    private ServerSocket server;
    private final ConcurrentHashMap<String, Socket> sockets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, DataOutputStream> outs = new ConcurrentHashMap<>();
    private final AtomicInteger ids = new AtomicInteger(1);

    private String localIp() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            Network n = cm.getActiveNetwork();
            if (n == null) return null;
            LinkProperties lp = cm.getLinkProperties(n);
            if (lp == null) return null;
            for (LinkAddress a : lp.getLinkAddresses()) {
                if (a.getAddress() instanceof Inet4Address && !a.getAddress().isLoopbackAddress()) return a.getAddress().getHostAddress();
            }
        } catch (Exception ignored) { }
        return null;
    }

    private void pump(final String connId, final Socket s) {
        new Thread(() -> {
            try {
                DataInputStream in = new DataInputStream(s.getInputStream());
                while (!s.isClosed()) {
                    int len = in.readInt();
                    if (len < 0 || len > MAX_FRAME) break;
                    byte[] buf = new byte[len];
                    in.readFully(buf);
                    JSObject o = new JSObject();
                    o.put("connId", connId);
                    o.put("data", new String(buf, StandardCharsets.UTF_8));
                    notifyListeners("frame", o);
                }
            } catch (Exception ignored) {
            } finally {
                closeConn(connId, true);
            }
        }, "deyn-sync-" + connId).start();
    }

    private void closeConn(String connId, boolean notify) {
        Socket s = sockets.remove(connId);
        outs.remove(connId);
        if (s != null) { try { s.close(); } catch (Exception ignored) { } if (notify) { JSObject o = new JSObject(); o.put("connId", connId); notifyListeners("closed", o); } }
    }

    @PluginMethod
    public void listen(final PluginCall call) {
        new Thread(() -> {
            try {
                if (server == null || server.isClosed()) {
                    int want = call.getInt("port", 47821);
                    try { server = new ServerSocket(want); } catch (Exception e) { server = new ServerSocket(0); }
                    final ServerSocket ss = server;
                    new Thread(() -> {
                        while (!ss.isClosed()) {
                            try {
                                Socket s = ss.accept();
                                s.setTcpNoDelay(true);
                                String id = "s" + ids.getAndIncrement();
                                sockets.put(id, s);
                                outs.put(id, new DataOutputStream(s.getOutputStream()));
                                JSObject o = new JSObject();
                                o.put("connId", id);
                                notifyListeners("accepted", o);
                                pump(id, s);
                            } catch (Exception e) { break; }
                        }
                    }, "deyn-sync-accept").start();
                }
                JSObject r = new JSObject();
                r.put("port", server.getLocalPort());
                String ip = localIp();
                r.put("ip", ip == null ? "" : ip);
                call.resolve(r);
            } catch (Exception e) { call.reject("listen failed: " + e.getClass().getSimpleName()); }
        }).start();
    }

    @PluginMethod
    public void connect(final PluginCall call) {
        new Thread(() -> {
            try {
                String ip = call.getString("ip");
                int port = call.getInt("port", 0);
                Socket s = new Socket();
                s.connect(new InetSocketAddress(ip, port), 6000);
                s.setTcpNoDelay(true);
                String id = "c" + ids.getAndIncrement();
                sockets.put(id, s);
                outs.put(id, new DataOutputStream(s.getOutputStream()));
                pump(id, s);
                JSObject r = new JSObject();
                r.put("connId", id);
                call.resolve(r);
            } catch (Exception e) { call.reject("connect failed: " + e.getClass().getSimpleName()); }
        }).start();
    }

    @PluginMethod
    public void send(PluginCall call) {
        final String id = call.getString("connId");
        final byte[] data = call.getString("data", "").getBytes(StandardCharsets.UTF_8);
        new Thread(() -> {
            DataOutputStream o = outs.get(id);
            if (o == null || data.length > MAX_FRAME) { call.reject("no such connection or frame too large"); return; }
            try { synchronized (o) { o.writeInt(data.length); o.write(data); o.flush(); } call.resolve(); }
            catch (Exception e) { closeConn(id, true); call.reject("send failed"); }
        }).start();
    }

    @PluginMethod
    public void close(PluginCall call) { closeConn(call.getString("connId"), false); call.resolve(); }

    @Override
    protected void handleOnDestroy() {
        try { if (server != null) server.close(); } catch (Exception ignored) { }
        for (String id : sockets.keySet()) closeConn(id, false);
    }
}
