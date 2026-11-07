# DEYN Settings reset behavior audit

**Source reviewed:** `deyn-app/www/index.html` from the inspected project archive.  
**Status:** read-only review; no app code changed.

## What the customer-facing Settings button does

The Settings UI contains a button labeled **"حذف البيانات"** connected to `data-act="clearData"`.

The `clearData()` action:
1. Requires owner permission.
2. Shows a confirmation explaining that accounts and pending tickets will be moved to the trash and can be restored.
3. If customers or pending tickets exist, it stores a `bulk` entry in `S.trash` containing copies of:
   - `customers`
   - `pending`
   - `seq`
4. Sets `S.customers = []`, `S.pending = []`, and `S.seq = 1`.
5. Calls `persist()`, resets calculator/ticket UI state, closes open modals, and renders the app.
6. It does **not** delete the entire `deyn.v1` record. Other state such as settings, authentication, license-related fields, and the trash remains.

This is a valid, intentional empty business-data state. On the next launch the key still exists and the empty arrays are valid. Startup must load it normally, not show a corruption screen and not reseed demo data automatically.

## Trash behavior

The trash restore handler recognizes `type: 'bulk'` and restores the archived customers, pending tickets, and sequence number. The trash UI also supports permanent deletion of an individual trash item and emptying the trash.

Therefore, the Settings button is more accurately a **recoverable business-data reset**, not a full app-storage wipe.

## Separate legacy action

The action map also contains a `wipe` handler that empties customers and pending tickets without archiving them. A source search found no visible Settings button with `data-act="wipe"` in the inspected HTML. Treat it as an apparently unused/legacy handler; do not connect, remove, or alter it without a separate product decision.

## Required compatibility tests

Any future startup guard or security change must pass all of these:
- Fresh install with no `deyn.v1`: normal first-run demo experience still appears.
- Existing valid demo data: demo data remains visible.
- Customer uses Settings `clearData`: accounts/tickets are archived to trash; business lists become empty; the rest of the app state remains; the app continues normally.
- App restarts after Settings `clearData`: valid empty business data loads normally and is not reseeded.
- Customer restores the `bulk` trash entry: customers, pending tickets, and sequence return.
- Existing malformed record: no demo seed and no automatic write over the raw value.
- Storage read failure: do not treat it as a fresh install.

## Not changed

No reset behavior, trash behavior, `wipe` handler, demo seed, auth data, license data, or production app source was changed.
