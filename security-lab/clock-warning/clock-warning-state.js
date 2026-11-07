// Pure state machine prototype. Persist its state in Android secure storage in production.
// Never persist or mutate customer debt records from this module.

export const WARNING_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const GRACE_PERIOD_MS = 48 * 60 * 60 * 1000;

export function initialClockState() {
  return {
    warningStage: 0,
    graceStartedAt: null,
    suspended: false,
    lastWarningAt: null,
    lastIncidentId: null,
    verifiedAt: null
  };
}

function safeState(state) {
  const base = initialClockState();
  if (!state || typeof state !== "object") return base;
  return {
    ...base,
    warningStage: Number.isInteger(state.warningStage)
      ? Math.min(3, Math.max(0, state.warningStage)) : 0,
    graceStartedAt: Number.isSafeInteger(state.graceStartedAt) ? state.graceStartedAt : null,
    suspended: state.suspended === true,
    lastWarningAt: Number.isSafeInteger(state.lastWarningAt) ? state.lastWarningAt : null,
    lastIncidentId: typeof state.lastIncidentId === "string" ? state.lastIncidentId : null,
    verifiedAt: Number.isSafeInteger(state.verifiedAt) ? state.verifiedAt : null
  };
}

export function getClockStatus(state, nowMs, licenseTier = "term") {
  if (licenseTier === "LT" || licenseTier === "lifetime") {
    return { status: "lifetime", warningStage: 0, remainingGraceMs: null };
  }
  const current = safeState(state);
  if (current.graceStartedAt !== null) {
    const remaining = Math.max(0, GRACE_PERIOD_MS - (nowMs - current.graceStartedAt));
    if (remaining === 0) {
      return { status: "suspended", warningStage: 3, remainingGraceMs: 0 };
    }
    return { status: "grace", warningStage: 3, remainingGraceMs: remaining };
  }
  return {
    status: current.suspended ? "suspended" : "active",
    warningStage: current.warningStage,
    remainingGraceMs: null
  };
}

/**
 * Events:
 * - NETWORK_UNAVAILABLE: no warning; network outages alone are not tampering.
 * - SNOOZE: no counter change.
 * - VERIFIED_TIME: authenticated signed time accepted; clears unresolved warnings.
 * - SUSPICIOUS_ROLLBACK: a verified response conflicts with the previously
 *   stored secure anchor. Requires a unique incident id; duplicate retries
 *   and repeated taps cannot increment the warning counter.
 */
export function transitionClockState(state, event, nowMs, licenseTier = "term") {
  const current = safeState(state);
  if (licenseTier === "LT" || licenseTier === "lifetime") {
    return { ...initialClockState(), verifiedAt: current.verifiedAt };
  }
  if (!event || typeof event.type !== "string" || !Number.isSafeInteger(nowMs)) {
    throw new TypeError("INVALID_CLOCK_EVENT");
  }

  if (event.type === "NETWORK_UNAVAILABLE" || event.type === "SNOOZE") {
    return current;
  }

  if (event.type === "VERIFIED_TIME") {
    if (!Number.isSafeInteger(event.trustedTimeMs) || event.trustedTimeMs < 0) {
      throw new TypeError("INVALID_TRUSTED_TIME");
    }
    return {
      ...initialClockState(),
      verifiedAt: event.trustedTimeMs
    };
  }

  if (event.type !== "SUSPICIOUS_ROLLBACK" ||
      typeof event.incidentId !== "string" || event.incidentId.length < 8) {
    throw new TypeError("INVALID_CLOCK_EVENT");
  }

  if (current.lastIncidentId === event.incidentId) return current;
  if (current.lastWarningAt !== null &&
      nowMs - current.lastWarningAt < WARNING_INTERVAL_MS) {
    return current;
  }

  const nextStage = Math.min(3, current.warningStage + 1);
  const graceStartedAt = nextStage === 3
    ? (current.graceStartedAt ?? nowMs)
    : null;

  return {
    ...current,
    warningStage: nextStage,
    graceStartedAt,
    suspended: false,
    lastWarningAt: nowMs,
    lastIncidentId: event.incidentId
  };
}

export function finalizeGracePeriod(state, nowMs, licenseTier = "term") {
  const current = safeState(state);
  if (licenseTier === "LT" || licenseTier === "lifetime") return initialClockState();
  if (current.graceStartedAt === null) return current;
  if (nowMs - current.graceStartedAt < GRACE_PERIOD_MS) return current;
  return { ...current, suspended: true };
}
