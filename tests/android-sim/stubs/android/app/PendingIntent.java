package android.app;
import android.content.*;
import java.util.*;
public class PendingIntent {
    public static final int FLAG_UPDATE_CURRENT=134217728, FLAG_MUTABLE=33554432, FLAG_IMMUTABLE=67108864, FLAG_CANCEL_CURRENT=268435456, FLAG_NO_CREATE=536870912;
    static final HashMap<String,PendingIntent> STORE=new HashMap<>();
    public final int requestCode; public final Intent intent; public final Context ctx; public int flags; public int createCount=1;
    PendingIntent(Context c,int rc,Intent i,int f){ ctx=c; requestCode=rc; intent=i; flags=f; }
    public static synchronized PendingIntent getBroadcast(Context c,int rc,Intent i,int flags){
        // Real Android identity: requestCode + Intent.filterEquals (action/component/package) -- EXTRAS DO NOT COUNT.
        String key = rc+"|"+i.action+"|"+(i.cls==null?"":i.cls.getName())+"|"+i.pkg;
        PendingIntent ex = STORE.get(key);
        if(ex!=null){ ex.createCount++; if((flags & FLAG_UPDATE_CURRENT)!=0){ ex.intent.extras.clear(); ex.intent.extras.putAll(i.extras); } return ex; }
        PendingIntent p=new PendingIntent(c,rc,i,flags); STORE.put(key,p); return p;
    }
    public static synchronized void resetStore(){ STORE.clear(); }
    public static synchronized int distinct(){ return STORE.size(); }
    /** Test hook: deliver this broadcast the way the system does (manifest-declared receiver class, new instance). */
    public void send(int resultCode, Map<String,Object> extraExtras) {
        try {
            BroadcastReceiver r=(BroadcastReceiver) intent.cls.getDeclaredConstructor().newInstance();
            r.__resultCode=resultCode;
            Intent copy=new Intent(); copy.action=intent.action; copy.pkg=intent.pkg; copy.cls=intent.cls; copy.extras.putAll(intent.extras);
            if(extraExtras!=null) copy.extras.putAll(extraExtras);
            r.onReceive(ctx, copy);
        } catch(Exception e){ throw new RuntimeException(e); }
    }
}
