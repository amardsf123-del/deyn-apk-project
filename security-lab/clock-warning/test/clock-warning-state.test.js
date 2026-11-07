import test from "node:test";
import assert from "node:assert/strict";
import {
  initialClockState, transitionClockState, getClockStatus,
  finalizeGracePeriod, WARNING_INTERVAL_MS, GRACE_PERIOD_MS
} from "./clock-warning-state.js";

const day = 24 * 60 * 60 * 1000;
const incident = id => ({ type: "SUSPICIOUS_ROLLBACK", incidentId: id });

test("network outage and snooze do not increase warnings", () => {
  let state = initialClockState();
  state = transitionClockState(state, { type: "NETWORK_UNAVAILABLE" }, day);
  state = transitionClockState(state, { type: "SNOOZE" }, day * 2);
  assert.equal(state.warningStage, 0);
});

test("duplicate incident cannot count twice and debounce blocks rapid repeats", () => {
  let state = transitionClockState(initialClockState(), incident("incident-0001"), day);
  state = transitionClockState(state, incident("incident-0001"), day * 3);
  assert.equal(state.warningStage, 1);
  state = transitionClockState(state, incident("incident-0002"), day + 1000);
  assert.equal(state.warningStage, 1);
  state = transitionClockState(state, incident("incident-0003"), day + WARNING_INTERVAL_MS);
  assert.equal(state.warningStage, 2);
});

test("third distinct warning starts a 48-hour grace period", () => {
  let state = initialClockState();
  state = transitionClockState(state, incident("incident-0001"), day);
  state = transitionClockState(state, incident("incident-0002"), day * 2);
  state = transitionClockState(state, incident("incident-0003"), day * 3);
  assert.equal(state.warningStage, 3);
  assert.equal(getClockStatus(state, day * 3).status, "grace");
  assert.equal(getClockStatus(state, day * 3).remainingGraceMs, GRACE_PERIOD_MS);
});

test("grace expiry suspends access state without touching debt data", () => {
  let state = initialClockState();
  state = transitionClockState(state, incident("incident-0001"), day);
  state = transitionClockState(state, incident("incident-0002"), day * 2);
  state = transitionClockState(state, incident("incident-0003"), day * 3);
  state = finalizeGracePeriod(state, day * 3 + GRACE_PERIOD_MS - 1);
  assert.equal(state.suspended, false);
  state = finalizeGracePeriod(state, day * 3 + GRACE_PERIOD_MS);
  assert.equal(state.suspended, true);
  assert.equal(getClockStatus(state, day * 3 + GRACE_PERIOD_MS).status, "suspended");
});

test("successful authenticated time clears warnings and grace", () => {
  let state = initialClockState();
  state = transitionClockState(state, incident("incident-0001"), day);
  state = transitionClockState(state, incident("incident-0002"), day * 2);
  state = transitionClockState(state, incident("incident-0003"), day * 3);
  state = transitionClockState(state, {
    type: "VERIFIED_TIME", trustedTimeMs: day * 3 + 5000
  }, day * 3 + 5000);
  assert.equal(state.warningStage, 0);
  assert.equal(state.graceStartedAt, null);
  assert.equal(state.suspended, false);
});

test("lifetime license is exempt", () => {
  let state = initialClockState();
  state = transitionClockState(state, incident("incident-0001"), day, "LT");
  assert.equal(state.warningStage, 0);
  assert.equal(getClockStatus(state, day * 10, "LT").status, "lifetime");
});
