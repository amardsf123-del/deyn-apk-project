package com.getcapacitor;
import org.json.*;
public class JSObject extends JSONObject {
    public JSObject(){ super(); }
    @Override public JSObject put(String k, Object v){ try{ super.put(k,v);}catch(JSONException e){} return this; }
    public JSObject put(String k, boolean v){ try{ super.put(k,v);}catch(JSONException e){} return this; }
    public JSObject put(String k, long v){ try{ super.put(k,v);}catch(JSONException e){} return this; }
    public JSObject put(String k, int v){ try{ super.put(k,v);}catch(JSONException e){} return this; }
    @Override public String getString(String k){ Object v=opt(k); return v==null?null:String.valueOf(v); }
}
