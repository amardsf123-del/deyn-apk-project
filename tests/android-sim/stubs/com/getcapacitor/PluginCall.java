package com.getcapacitor;
public class PluginCall {
    public final JSObject data=new JSObject(); public volatile JSObject resolved; public volatile String rejected;
    public PluginCall put(String k,Object v){ data.put(k,v); return this; }
    public PluginCall put(String k,long v){ data.put(k,v); return this; }
    public String getString(String k){ Object o=data.opt(k); return o==null?null:String.valueOf(o); }
    public Long getLong(String k,Long d){ Object o=data.opt(k); return o instanceof Number?((Number)o).longValue():d; }
    public Boolean getBoolean(String k,Boolean d){ Object o=data.opt(k); return o instanceof Boolean?(Boolean)o:d; }
    public Integer getInt(String k,Integer d){ Object o=data.opt(k); return o instanceof Number?((Number)o).intValue():d; }
    public JSArray getArray(String k, JSArray d){ Object o=data.opt(k); return o instanceof JSArray?(JSArray)o:d; }
    public void resolve(JSObject o){ resolved=o; synchronized(this){ notifyAll(); } }
    public void resolve(){ resolved=new JSObject(); synchronized(this){ notifyAll(); } }
    public void reject(String m){ rejected=m; synchronized(this){ notifyAll(); } }
    public synchronized void await(long ms) throws InterruptedException { long end=System.currentTimeMillis()+ms; while(resolved==null&&rejected==null){ long r=end-System.currentTimeMillis(); if(r<=0)break; wait(r);} }
}
