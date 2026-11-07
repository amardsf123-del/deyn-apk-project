# Clock warning and grace-period state machine prototype

Pure state transition module for DEYN's agreed policy. It is deliberately separate from app code.

## Behavior encoded

- Network unavailable and user snooze do not increment warning stages.
- A suspicious rollback incident must have a unique incident ID.
- The same incident cannot be counted twice.
- Warning stages are debounced by at least 24 hours in this prototype. This interval is a provisional engineering default, not a final policy decision; it must be reviewed before integration.
- The third distinct warning starts a 48-hour grace period.
- A successful authenticated trusted-time response clears unresolved warning/grace state.
- After 48 hours, the module reports suspended access state.
- Lifetime licenses (tier `LT` / `lifetime`) are exempt.
- The module changes only clock/activation status; it has no access to debt records.

## Critical production requirements

1. Call `SUSPICIOUS_ROLLBACK` only after a validly signed server time has been checked against a previously stored secure trusted-time anchor. Do not call it for missing internet, timeout, server errors, reboot, timezone changes, SIM changes, or ordinary time synchronization.
2. Generate a new unpredictable incident ID only for a genuinely new unresolved rollback incident; persist it securely so retries do not count again.
3. Persist the complete state in Android secure storage. This prototype's in-memory state is not tamper resistant.
4. Keep debt data and the license record intact during warnings, grace, and suspension.
5. This state machine is not integrated into DEYN, and is not yet production security. Android integration, secure persistence, UI text/buttons, and device tests remain required.
