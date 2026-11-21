package androidx.work;
import android.content.Context;
import java.util.*;
import java.util.concurrent.*;
/** Faithful-enough fake: persisted unique-work table, REPLACE/KEEP semantics, initial delay (real time), retry w/ backoff. */
public class WorkManager {
    public static class Entry { public final String name; public final OneTimeWorkRequest req; public volatile String state="ENQUEUED"; public volatile int attempts=0; public volatile long runAt; public volatile ScheduledFuture<?> future; public final int gen;
        Entry(String n,OneTimeWorkRequest r,int g){name=n;req=r;gen=g;} }
    static final WorkManager INSTANCE=new WorkManager();
    static final ScheduledExecutorService EX=Executors.newScheduledThreadPool(4);
    public static final Map<String,Entry> TABLE=new ConcurrentHashMap<>();
    public static final List<String> LOG=Collections.synchronizedList(new ArrayList<>());
    public static volatile long retryBackoffOverrideMs=40;
    static volatile int genCounter=0;
    public static volatile Context ctx=new Context();
    public static WorkManager getInstance(Context c){ return INSTANCE; }
    public static void resetAll(){ for(Entry e:TABLE.values()){ if(e.future!=null) e.future.cancel(false);} TABLE.clear(); LOG.clear(); PERIODIC.clear(); synchronized(PERIODIC_FUTURES){ for(ScheduledFuture<?> f:PERIODIC_FUTURES) f.cancel(false); PERIODIC_FUTURES.clear(); } }
    public synchronized void enqueueUniqueWork(String name, ExistingWorkPolicy policy, OneTimeWorkRequest req){
        Entry ex=TABLE.get(name);
        boolean live = ex!=null && (ex.state.equals("ENQUEUED")||ex.state.equals("RUNNING")||ex.state.equals("RETRY"));
        if(live && policy==ExistingWorkPolicy.KEEP){ LOG.add("KEEP "+name); return; }
        if(live && policy==ExistingWorkPolicy.REPLACE){ if(ex.future!=null) ex.future.cancel(false); ex.state="CANCELLED"; LOG.add("REPLACE-cancel "+name+" (was "+(ex.state)+")"); }
        final Entry e=new Entry(name,req,++genCounter); e.runAt=System.currentTimeMillis()+req.delayMs; TABLE.put(name,e); LOG.add("ENQ "+name+" delay="+req.delayMs);
        schedule(e, req.delayMs);
    }
    public synchronized void cancelUniqueWork(String name){ Entry e=TABLE.get(name); if(e!=null){ if(e.future!=null) e.future.cancel(false); if(!e.state.equals("SUCCEEDED")&&!e.state.equals("FAILED")) e.state="CANCELLED"; LOG.add("CANCEL "+name); } }
    void schedule(Entry e,long delay){ e.future=EX.schedule(()->run(e),Math.max(0,delay),TimeUnit.MILLISECONDS); }
    void run(Entry e){
        synchronized(this){ if(!e.state.equals("ENQUEUED")&&!e.state.equals("RETRY")) return; if(TABLE.get(e.name)!=e) return; e.state="RUNNING"; }
        Worker.Result r;
        try{ WorkerParameters p=new WorkerParameters(e.req.data); p.attempt=e.attempts; Worker w=e.req.cls.getDeclaredConstructor(Context.class,WorkerParameters.class).newInstance(ctx,p); r=w.doWork(); }
        catch(Throwable t){ LOG.add("CRASH "+e.name+" "+t); t.printStackTrace(); r=Worker.Result.retry(); }
        synchronized(this){
            if(e.state.equals("CANCELLED")) { LOG.add("RESULT-IGNORED(cancelled) "+e.name+" "+r); return; }
            LOG.add("RESULT "+e.name+" "+r+" attempt="+e.attempts);
            if(r.kind.equals("retry")){ e.attempts++; e.state="RETRY"; long back=retryBackoffOverrideMs*e.attempts; schedule(e,back); }
            else e.state=r.kind.equals("success")?"SUCCEEDED":"FAILED";
        }
    }
    public static volatile long periodicScaleMs=300;   // tests: run the "15 minute" sweeper every 300 ms
    public static final Map<String,Object> PERIODIC=new ConcurrentHashMap<>(); static final List<ScheduledFuture<?>> PERIODIC_FUTURES=Collections.synchronizedList(new ArrayList<>());
    public synchronized void enqueueUniquePeriodicWork(String name, ExistingPeriodicWorkPolicy policy, PeriodicWorkRequest req){
        if(PERIODIC.containsKey(name) && policy==ExistingPeriodicWorkPolicy.KEEP) return;
        PERIODIC.put(name,req); LOG.add("PERIODIC "+name);
        PERIODIC_FUTURES.add(EX.scheduleWithFixedDelay(()->{ if(!PERIODIC.containsKey(name)) return; try{ Worker w=req.cls.getDeclaredConstructor(Context.class,WorkerParameters.class).newInstance(ctx,new WorkerParameters(new Data())); w.doWork(); }catch(Throwable t){ LOG.add("PERIODIC-CRASH "+t); } }, periodicScaleMs, periodicScaleMs, TimeUnit.MILLISECONDS));
    }
    public com.google.common.util.concurrent.ListenableFuture<List<WorkInfo>> getWorkInfosForUniqueWork(String name){
        final List<WorkInfo> l=new ArrayList<>(); Entry e=TABLE.get(name);
        if(e!=null) l.add(new WorkInfo(WorkInfo.State.valueOf(e.state.equals("RETRY")?"ENQUEUED":e.state)));
        if(name.equals("deyn_sms_sweeper") && PERIODIC.containsKey(name)) l.add(new WorkInfo(WorkInfo.State.ENQUEUED));
        return new com.google.common.util.concurrent.ListenableFuture<List<WorkInfo>>(){
            public boolean cancel(boolean b){return false;} public boolean isCancelled(){return false;} public boolean isDone(){return true;}
            public List<WorkInfo> get(){ return l; } public List<WorkInfo> get(long t,TimeUnit u){ return l; } };
    }
    public static String state(String name){ Entry e=TABLE.get(name); return e==null?"NONE":e.state; }
}
