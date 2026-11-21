package android.telephony;
import android.app.PendingIntent;
import java.util.*;
public class SmsManager {
    public static final int RESULT_ERROR_GENERIC_FAILURE=1, RESULT_ERROR_RADIO_OFF=2, RESULT_ERROR_NULL_PDU=3, RESULT_ERROR_NO_SERVICE=4;
    /** Simulation controls. */
    public static class Sim {
        public static volatile int mode=0;                 // 0 OK, 1 all parts fail with failCode, 2 one part (failPart) fails, 3 no callbacks (process died), 4 throws SecurityException
        public static volatile int failCode=RESULT_ERROR_NO_SERVICE, failPart=1;
        public static volatile long callbackDelayMs=20;
        public static final List<String[]> sent=Collections.synchronizedList(new ArrayList<>());   // {dest, joined parts, nParts}
        public static final List<Integer> partCounts=Collections.synchronizedList(new ArrayList<>());
        public static void reset(){ mode=0; failCode=RESULT_ERROR_NO_SERVICE; failPart=1; callbackDelayMs=20; sent.clear(); partCounts.clear(); }
    }
    public static int getDefaultSmsSubscriptionId(){ return 1; }
    public static SmsManager getDefault(){ return new SmsManager(); }
    public static SmsManager getSmsManagerForSubscriptionId(int id){ return new SmsManager(); }
    public SmsManager createForSubscriptionId(int id){ return this; }
    static boolean gsm(String s){ for(char c: s.toCharArray()){ if(c>0x7e) return false; } return true; }
    public ArrayList<String> divideMessage(String text){
        ArrayList<String> out=new ArrayList<>(); boolean g=gsm(text); int single=g?160:70, multi=g?153:67;
        if(text.length()<=single){ out.add(text); return out; }
        for(int i=0;i<text.length();){ int e=Math.min(text.length(),i+multi); if(e<text.length()&&Character.isHighSurrogate(text.charAt(e-1))) e--; out.add(text.substring(i,e)); i=e; }
        return out;
    }
    public void sendTextMessage(String dest,String sc,String text,PendingIntent sent,PendingIntent delivery){
        ArrayList<PendingIntent> s=new ArrayList<>(); s.add(sent); ArrayList<PendingIntent> d=new ArrayList<>(); d.add(delivery);
        ArrayList<String> p=new ArrayList<>(); p.add(text); sendMultipartTextMessage(dest,sc,p,s,d);
    }
    public void sendMultipartTextMessage(String dest,String sc,ArrayList<String> parts,ArrayList<PendingIntent> sent,ArrayList<PendingIntent> delivery){
        if(Sim.mode==4) throw new SecurityException("Neither user nor current process has android.permission.SEND_SMS");
        if(sent!=null && sent.size()!=parts.size()) throw new IllegalArgumentException("sentIntents size mismatch");
        Sim.sent.add(new String[]{dest,String.join("",parts),String.valueOf(parts.size())}); Sim.partCounts.add(parts.size());
        if(Sim.mode==3) return;
        final int n=parts.size();
        new Thread(() -> {
            try{ Thread.sleep(Sim.callbackDelayMs); }catch(InterruptedException e){}
            for(int i=0;i<n;i++){
                int code=-1;
                if(Sim.mode==1) code=Sim.failCode; else if(Sim.mode==2 && i==Sim.failPart) code=Sim.failCode;
                if(sent!=null && sent.get(i)!=null) sent.get(i).send(code,null);
            }
            for(int i=0;i<n;i++){ if(delivery!=null && delivery.get(i)!=null && Sim.mode==0) delivery.get(i).send(-1,null); }
        }, "sms-callbacks").start();
    }
}
