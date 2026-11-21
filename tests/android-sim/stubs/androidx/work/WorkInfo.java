package androidx.work;
public class WorkInfo { public enum State { ENQUEUED, RUNNING, SUCCEEDED, FAILED, BLOCKED, CANCELLED } final State s; public WorkInfo(State s){this.s=s;} public State getState(){ return s; } }
