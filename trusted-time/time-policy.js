// Clock-tamper policy state machine (pure, testable). Agreed stages: warning 1, warning 2, warning 3, then a 48h grace, then licence policy.
// It never deletes data. What "licence policy" means after grace is an OPEN DECISION (default here: READ_ONLY = view/export only).
export const TOLERANCE_MS = 5 * 60 * 1000, GRACE_MS = 48 * 3600 * 1000;
export function initialState() { return { lastSeen: 0, warnings: 0, episode: false, graceStart: null, trustedOffset: null }; }
// obs: { now: local ms, trusted: ms|null (verified signed time, or null if offline/failed) }
export function evaluate(prev, obs, opts = {}) {
  const tol = opts.tolerance ?? TOLERANCE_MS, grace = opts.grace ?? GRACE_MS, afterGrace = opts.afterGrace ?? 'READ_ONLY';
  const s = { ...prev };
  const ref = obs.trusted ?? Math.max(obs.now, s.lastSeen);                    // best available "real" time
  const rolledBack = obs.now < s.lastSeen - tol;                                // local clock went backwards
  const skewed = obs.trusted != null && Math.abs(obs.now - obs.trusted) > tol;  // disagrees with signed time
  const violation = obs.trusted != null ? skewed : rolledBack;   // when signed time is available it is authoritative
  const consistentVerified = obs.trusted != null && !skewed;
  let status = 'OK', warningNo = 0;
  if (violation) {
    if (!s.episode) {
      s.episode = true;
      if (s.warnings < 3) { s.warnings += 1; warningNo = s.warnings; if (s.warnings === 3) s.graceStart = ref; }
      else s.graceStart = ref;          // warnings already used up: every new episode goes straight to a fresh 48h grace
    }
    if (s.graceStart != null) status = ref - s.graceStart >= grace ? afterGrace : 'GRACE';
    else status = 'WARN';
  } else if (consistentVerified) {   // only a verified, consistent signed time clears an episode
    s.episode = false; s.graceStart = null; status = 'OK';
  } else if (s.episode) {            // offline: cannot prove the clock is fixed
    status = s.graceStart != null ? (ref - s.graceStart >= grace ? afterGrace : 'GRACE') : 'WARN';
  }
  // A verified signed time is authoritative: it may also repair a lastSeen that was pushed into the future by a wrong clock.
  s.lastSeen = (obs.trusted != null && !skewed) ? obs.trusted : Math.max(s.lastSeen, obs.now);
  const graceLeftMs = s.graceStart != null ? Math.max(0, grace - (ref - s.graceStart)) : null;
  return { state: s, status, warningNo, graceLeftMs };
}
