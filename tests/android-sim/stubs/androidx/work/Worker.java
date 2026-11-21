package androidx.work;
import android.content.Context;
public abstract class Worker {
    public static class Result { public final String kind; Result(String k){kind=k;} public static Result success(){return new Result("success");} public static Result failure(){return new Result("failure");} public static Result retry(){return new Result("retry");} public String toString(){return kind;} }
    private final Context ctx; private final WorkerParameters p;
    public Worker(Context c, WorkerParameters p){ ctx=c; this.p=p; }
    public final Context getApplicationContext(){ return ctx; }
    public final Data getInputData(){ return p.data; }
    public final int getRunAttemptCount(){ return p.attempt; }
    public abstract Result doWork();
}
