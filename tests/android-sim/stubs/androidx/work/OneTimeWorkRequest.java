package androidx.work;
import java.util.concurrent.TimeUnit;
public class OneTimeWorkRequest {
    public Class<? extends Worker> cls; public long delayMs; public Data data=new Data(); public java.util.Set<String> tags=new java.util.HashSet<>(); public long backoffMs=30000; public BackoffPolicy backoffPolicy=BackoffPolicy.EXPONENTIAL;
    public static class Builder { final OneTimeWorkRequest r=new OneTimeWorkRequest();
        public Builder(Class<? extends Worker> c){ r.cls=c; }
        public Builder setInitialDelay(long d,TimeUnit u){ r.delayMs=u.toMillis(d); return this; }
        public Builder setInputData(Data d){ r.data=d; return this; }
        public Builder addTag(String t){ r.tags.add(t); return this; }
        public Builder setBackoffCriteria(BackoffPolicy p,long d,TimeUnit u){ r.backoffPolicy=p; r.backoffMs=u.toMillis(d); return this; }
        public OneTimeWorkRequest build(){ return r; } }
}
