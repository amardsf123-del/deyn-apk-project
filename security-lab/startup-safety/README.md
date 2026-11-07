# Startup safety prototype

**Lab-only. Not integrated into DEYN. Do not run on a customer's live storage.**

This prototype addresses the startup sequence risk found in the archived source:
`S = load() || seed(); ... persist();`

Behavior:
- Missing `deyn.v1`: treat as a new install and create intentional seed data.
- Valid existing `deyn.v1`: load the full object unchanged, including unknown future fields.
- Existing malformed JSON, invalid schema, or unexpected stored value: do not seed, do not persist, do not clear or rewrite the original value.
- The persist helper refuses writes when startup is in a blocked recovery state.

Run:
```sh
node --test test/startup-safety.test.js
```

Limits:
- Uses simulated in-memory storage.
- Does not display a user-facing recovery screen or export damaged raw data.
- Does not handle localStorage quota, browser exceptions, WebView process death, or Capacitor.
- Does not validate every nested customer/transaction field; that requires a versioned schema and compatibility policy.
- Does not change activation metadata, `fcb1899`, owner/worker behavior, or license code.
- Not integrated with `index.html`; app behavior is unchanged.
