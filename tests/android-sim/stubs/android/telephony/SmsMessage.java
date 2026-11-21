package android.telephony;
public class SmsMessage {
    public static SmsMessage createFromPdu(byte[] p){ return new SmsMessage(); }
    public static SmsMessage createFromPdu(byte[] p,String f){ return new SmsMessage(); }
    public int getStatus(){ return 0; }
}
