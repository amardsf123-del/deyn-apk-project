# Important distinction: intentional demo seed vs damaged existing data

**Confirmed in inspected source archive; no app code changed.**

The demo data is intentional product behavior, as clarified by the owner. It is there to let a new customer explore the app using examples of its features. After the customer understands the app, they can use the app's settings to clear/reset the demo data and then enter their own customer records.

**The demo seed itself is not a bug and must be preserved.** The reset/clear-data feature is also intentional and must not be removed or altered as part of this protection work.

## The actual edge case that needs protection

The current startup source runs:

```js
S = load() || seed();
...
persist();
```

The problem is not that a fresh install gets demo data. The problem is that `load()` currently returns `null` for more than one reason:
- the `deyn.v1` key is genuinely absent (fresh install; demo seed is expected),
- JSON parsing fails, or
- the parsed object does not have both `customers` and `pending` arrays.

In the latter two cases, existing stored data may still contain recoverable customer/debt information. Calling `seed()` and then `persist()` could overwrite that existing value.

## Correct behavior to preserve

1. **Fresh install / no saved app data:** keep the current intended demo experience and create the example data.
2. **Valid saved app data:** load it normally without replacing it with demo data.
3. **Customer intentionally chooses the existing clear/reset option in Settings:** preserve that user-requested behavior, including whatever confirmation/clear semantics the current app already provides. Do not reinterpret this as corruption.
4. **Existing key is present but unreadable/invalid:** stop normal startup, preserve the original raw value, and offer a safe export/recovery route instead of silently replacing it with demo data.
5. **Storage access itself fails:** do not assume the key is absent and do not seed; show a storage-unavailable message.

## Guardrails for future changes

- Keep demo data and the first-run walkthrough exactly as intended.
- Keep the existing Settings clear/reset feature; do not remove or silently change it.
- Only distinguish a genuinely absent key from an existing unreadable/invalid value.
- Do not auto-delete or auto-repair malformed content.
- Do not change the factory password `fcb1899`, license behavior, or owner/worker behavior in this task.
- Before integration, test fresh install, demo walkthrough, intentional Settings reset, subsequent normal use, and corrupted existing record separately.

This protection is not integrated yet. It is not a reason to remove the demo seed or the customer-facing reset feature.
