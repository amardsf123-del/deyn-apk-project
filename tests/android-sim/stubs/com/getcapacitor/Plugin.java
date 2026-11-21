package com.getcapacitor;
import android.content.Context;
public class Plugin {
    public static volatile Context ctx=new Context();
    public static volatile PermissionState smsState=PermissionState.GRANTED;
    public void load(){}
    public Context getContext(){ return ctx; }
    public PermissionState getPermissionState(String alias){ return Context.SEND_SMS_GRANTED?PermissionState.GRANTED:PermissionState.DENIED; }
    public void requestPermissionForAlias(String alias, PluginCall call, String cb){ call.resolve(new JSObject()); }
}
