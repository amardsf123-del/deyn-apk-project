package android.content;
import java.util.*;
public class Intent {
    public static final String ACTION_BOOT_COMPLETED="android.intent.action.BOOT_COMPLETED", ACTION_MY_PACKAGE_REPLACED="android.intent.action.MY_PACKAGE_REPLACED";
    public String action, pkg; public Class<?> cls; public final HashMap<String,Object> extras = new HashMap<>();
    public Intent() {}
    public Intent(String action){ this.action=action; }
    public Intent(Context c, Class<?> cls){ this.cls=cls; }
    public Intent setAction(String a){ action=a; return this; }
    public Intent setPackage(String p){ pkg=p; return this; }
    public String getAction(){ return action; }
    public Intent putExtra(String k,String v){ extras.put(k,v); return this; }
    public Intent putExtra(String k,int v){ extras.put(k,v); return this; }
    public Intent putExtra(String k,long v){ extras.put(k,v); return this; }
    public Intent putExtra(String k,byte[] v){ extras.put(k,v); return this; }
    public String getStringExtra(String k){ Object o=extras.get(k); return o instanceof String?(String)o:null; }
    public int getIntExtra(String k,int d){ Object o=extras.get(k); return o instanceof Integer?(Integer)o:d; }
    public long getLongExtra(String k,long d){ Object o=extras.get(k); return o instanceof Long?(Long)o:d; }
    public byte[] getByteArrayExtra(String k){ Object o=extras.get(k); return o instanceof byte[]?(byte[])o:null; }
    public boolean filterEquals(Intent o){ return Objects.equals(action,o.action) && Objects.equals(pkg,o.pkg) && Objects.equals(cls,o.cls); }
}
