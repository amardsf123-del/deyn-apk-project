package androidx.work;
import java.util.*;
public class Data {
    final HashMap<String,Object> m=new HashMap<>();
    public String getString(String k){ Object o=m.get(k); return o instanceof String?(String)o:null; }
    public long getLong(String k,long d){ Object o=m.get(k); return o instanceof Long?(Long)o:d; }
    public int getInt(String k,int d){ Object o=m.get(k); return o instanceof Integer?(Integer)o:d; }
    public boolean getBoolean(String k,boolean d){ Object o=m.get(k); return o instanceof Boolean?(Boolean)o:d; }
    public static class Builder { final Data d=new Data();
        public Builder putString(String k,String v){ d.m.put(k,v); return this; } public Builder putLong(String k,long v){ d.m.put(k,v); return this; }
        public Builder putInt(String k,int v){ d.m.put(k,v); return this; } public Builder putBoolean(String k,boolean v){ d.m.put(k,v); return this; }
        public Data build(){ return d; } }
}
