package org.json;
import java.util.*;
public class JSONObject {
    final LinkedHashMap<String,Object> m = new LinkedHashMap<>();
    public JSONObject() {}
    public JSONObject(String s) throws JSONException { Object o = new P(s).parse(); if(!(o instanceof JSONObject)) throw new JSONException("not object"); m.putAll(((JSONObject)o).m); }
    public JSONObject put(String k, Object v) throws JSONException { m.put(k, v); return this; }
    public JSONObject put(String k, long v) throws JSONException { m.put(k, v); return this; }
    public JSONObject put(String k, int v) throws JSONException { m.put(k, (long)v); return this; }
    public JSONObject put(String k, boolean v) throws JSONException { m.put(k, v); return this; }
    public boolean has(String k){ return m.containsKey(k); }
    public Object opt(String k){ return m.get(k); }
    public String optString(String k, String d){ Object v=m.get(k); return v==null?d:String.valueOf(v); }
    public String optString(String k){ return optString(k,""); }
    public long optLong(String k, long d){ Object v=m.get(k); if(v instanceof Number) return ((Number)v).longValue(); try{ return v==null?d:Long.parseLong(String.valueOf(v)); }catch(Exception e){return d;} }
    public int optInt(String k, int d){ return (int)optLong(k,d); }
    public int optInt(String k){ return optInt(k,0); }
    public boolean optBoolean(String k){ Object v=m.get(k); return v instanceof Boolean && (Boolean)v; }
    public boolean optBoolean(String k, boolean d){ Object v=m.get(k); return v instanceof Boolean ? (Boolean)v : d; }
    public String getString(String k) throws JSONException { if(!m.containsKey(k)) throw new JSONException("missing "+k); return String.valueOf(m.get(k)); }
    public long getLong(String k) throws JSONException { if(!m.containsKey(k)) throw new JSONException("missing "+k); return optLong(k,0); }
    public int getInt(String k) throws JSONException { return (int)getLong(k); }
    public boolean getBoolean(String k) throws JSONException { return optBoolean(k); }
    public JSONObject getJSONObject(String k) throws JSONException { Object v=m.get(k); if(v instanceof JSONObject) return (JSONObject)v; throw new JSONException("not obj "+k); }
    public JSONObject optJSONObject(String k){ Object v=m.get(k); return v instanceof JSONObject?(JSONObject)v:null; }
    public JSONArray optJSONArray(String k){ Object v=m.get(k); return v instanceof JSONArray?(JSONArray)v:null; }
    public Iterator<String> keys(){ return m.keySet().iterator(); }
    public JSONObject remove0(String k){ m.remove(k); return this; }
    @Override public String toString(){ StringBuilder b=new StringBuilder("{"); boolean first=true; for(Map.Entry<String,Object> e:m.entrySet()){ if(!first)b.append(','); first=false; b.append(q(e.getKey())).append(':').append(v(e.getValue())); } return b.append('}').toString(); }
    static String q(String s){ StringBuilder b=new StringBuilder("\""); for(char c: s.toCharArray()){ switch(c){case '"':b.append("\\\"");break;case '\\':b.append("\\\\");break;case '\n':b.append("\\n");break;case '\r':b.append("\\r");break;case '\t':b.append("\\t");break;default: if(c<0x20) b.append(String.format("\\u%04x",(int)c)); else b.append(c);} } return b.append('"').toString(); }
    static String v(Object o){ if(o==null) return "null"; if(o instanceof String) return q((String)o); return String.valueOf(o); }
    static class P { final String s; int i=0; P(String s){this.s=s;}
        void ws(){ while(i<s.length() && Character.isWhitespace(s.charAt(i))) i++; }
        Object parse() throws JSONException { ws(); if(i>=s.length()) throw new JSONException("eof"); char c=s.charAt(i);
            if(c=='{'){ i++; JSONObject o=new JSONObject(); ws(); if(s.charAt(i)=='}'){i++;return o;} while(true){ ws(); String k=str(); ws(); i++; Object v=parse(); o.m.put(k,v); ws(); char d=s.charAt(i++); if(d=='}') return o; } }
            if(c=='['){ i++; JSONArray a=new JSONArray(); ws(); if(s.charAt(i)==']'){i++;return a;} while(true){ a.list.add(parse()); ws(); char d=s.charAt(i++); if(d==']') return a; } }
            if(c=='"') return str();
            if(s.startsWith("true",i)){i+=4;return true;} if(s.startsWith("false",i)){i+=5;return false;} if(s.startsWith("null",i)){i+=4;return null;}
            int j=i; while(j<s.length() && "+-0123456789.eE".indexOf(s.charAt(j))>=0) j++; String n=s.substring(i,j); i=j;
            if(n.contains(".")||n.contains("e")||n.contains("E")) return Double.parseDouble(n); return Long.parseLong(n); }
        String str() throws JSONException { if(s.charAt(i)!='"') throw new JSONException("expected string at "+i); i++; StringBuilder b=new StringBuilder(); while(true){ char c=s.charAt(i++); if(c=='"') break; if(c=='\\'){ char d=s.charAt(i++); switch(d){case 'n':b.append('\n');break;case 'r':b.append('\r');break;case 't':b.append('\t');break;case 'u':b.append((char)Integer.parseInt(s.substring(i,i+4),16));i+=4;break;default:b.append(d);} } else b.append(c);} return b.toString(); }
    }
}
