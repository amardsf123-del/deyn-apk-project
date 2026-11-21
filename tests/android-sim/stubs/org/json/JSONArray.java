package org.json;
import java.util.*;
public class JSONArray {
    final ArrayList<Object> list = new ArrayList<>();
    public JSONArray() {}
    public JSONArray(String s) throws JSONException { Object o = new JSONObject.P(s).parse(); if(!(o instanceof JSONArray)) throw new JSONException("not array"); list.addAll(((JSONArray)o).list); }
    public int length(){ return list.size(); }
    public JSONArray put(Object o){ list.add(o); return this; }
    public JSONArray put(long o){ list.add(o); return this; }
    public JSONArray put(int o){ list.add((long)o); return this; }
    public JSONObject getJSONObject(int i) throws JSONException { Object v=list.get(i); if(v instanceof JSONObject) return (JSONObject)v; throw new JSONException("not obj"); }
    public String getString(int i) throws JSONException { return String.valueOf(list.get(i)); }
    public Object get(int i) throws JSONException { return list.get(i); }
    @Override public String toString(){ StringBuilder b=new StringBuilder("["); for(int i=0;i<list.size();i++){ if(i>0)b.append(','); b.append(JSONObject.v(list.get(i))); } return b.append(']').toString(); }
}
