package android.content;
import java.util.*;
public class Context {
    public static final String TELEPHONY_SERVICE="phone", POWER_SERVICE="power"; public static final int MODE_PRIVATE=0, RECEIVER_NOT_EXPORTED=4, RECEIVER_EXPORTED=2;
    // "Disk": survives simulated process death.
    public static final HashMap<String,Map<String,Object>> DISK=new HashMap<>();
    public static volatile boolean SEND_SMS_GRANTED=true;
    public static volatile Object smsManagerInstance;
    public static final List<String> dynamicReceivers=new ArrayList<>();
    public Object getSystemService(String n){ if(n.equals(TELEPHONY_SERVICE)) return new android.telephony.TelephonyManager(); if(n.equals(POWER_SERVICE)) return new android.os.PowerManager(); return null; }
    public ContentResolver getContentResolver(){ return new ContentResolver(); }
    public Context getApplicationContext(){ return this; }
    public String getPackageName(){ return "com.deyn.app"; }
    public int checkSelfPermission(String p){ return SEND_SMS_GRANTED?0:-1; }
    public void registerReceiver(BroadcastReceiver r, IntentFilter f){ dynamicReceivers.add(r.getClass().getName()); }
    public void registerReceiver(BroadcastReceiver r, IntentFilter f, int flags){ dynamicReceivers.add(r.getClass().getName()); }
    @SuppressWarnings("unchecked") public <T> T getSystemService(Class<T> c){ return (T) (c.getName().equals("android.telephony.SmsManager") ? smsManagerInstance : null); }
    public SharedPreferences getSharedPreferences(String name,int mode){ return new Prefs(name); }
    static class Prefs implements SharedPreferences {
        final String name; Prefs(String n){name=n;}
        Map<String,Object> d(){ synchronized(DISK){ return DISK.computeIfAbsent(name,k->new HashMap<>()); } }
        public String getString(String k,String df){ synchronized(DISK){ Object o=d().get(k); return o instanceof String?(String)o:df; } }
        public long getLong(String k,long df){ synchronized(DISK){ Object o=d().get(k); return o instanceof Long?(Long)o:df; } }
        public int getInt(String k,int df){ synchronized(DISK){ Object o=d().get(k); return o instanceof Integer?(Integer)o:df; } }
        public boolean getBoolean(String k,boolean df){ synchronized(DISK){ Object o=d().get(k); return o instanceof Boolean?(Boolean)o:df; } }
        @SuppressWarnings("unchecked") public Set<String> getStringSet(String k,Set<String> df){ synchronized(DISK){ Object o=d().get(k); return o instanceof Set?new HashSet<>((Set<String>)o):df; } }
        public Editor edit(){ return new Ed(this); }
    }
    static class Ed implements SharedPreferences.Editor {
        final Prefs p; final Map<String,Object> puts=new HashMap<>(); final Set<String> rm=new HashSet<>();
        Ed(Prefs p){this.p=p;}
        public Ed putString(String k,String v){puts.put(k,v);return this;} public Ed putLong(String k,long v){puts.put(k,v);return this;}
        public Ed putInt(String k,int v){puts.put(k,v);return this;} public Ed putBoolean(String k,boolean v){puts.put(k,v);return this;}
        public Ed putStringSet(String k,Set<String> v){puts.put(k,new HashSet<>(v));return this;}
        public Ed remove(String k){rm.add(k);return this;}
        public boolean commit(){ synchronized(DISK){ Map<String,Object> d=p.d(); for(String k:rm) d.remove(k); d.putAll(puts); } return true; }
        public void apply(){ commit(); }
    }
}
