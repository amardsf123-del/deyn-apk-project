package android.content;
public abstract class BroadcastReceiver {
    public int __resultCode = 0;
    public abstract void onReceive(Context context, Intent intent);
    public final int getResultCode(){ return __resultCode; }
}
