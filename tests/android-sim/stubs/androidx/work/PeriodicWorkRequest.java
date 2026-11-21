package androidx.work;
import java.util.concurrent.TimeUnit;
public class PeriodicWorkRequest {
    public Class<? extends Worker> cls; public long intervalMs;
    public static class Builder { final PeriodicWorkRequest r=new PeriodicWorkRequest();
        public Builder(Class<? extends Worker> c,long i,TimeUnit u){ r.cls=c; r.intervalMs=u.toMillis(i); }
        public Builder addTag(String t){ return this; }
        public PeriodicWorkRequest build(){ return r; } }
}
