# DEYN raw-data export technical review

**Status:** source review only; no dependency or app code changed.

## What the inspected app currently has

- The current backup function in `deyn-app/www/index.html` creates a Blob from `JSON.stringify(S, null, 2)`, creates an anchor, and assigns a filename like `deyn-backup-YYYYMMDD.json`.
- This is the existing full-state backup path, not a recovery export.
- The app package currently declares Capacitor 7 core, Android, Clipboard, Device, and `capacitor-secure-storage-plugin`.
- It does **not** declare `@capacitor/filesystem` or `@capacitor/share`.
- No native filesystem/share API use was found in the inspected app source.

## Safe recovery export decision

Do not reuse the ordinary backup function for corrupted data: it serializes the in-memory app state, which may be demo/seed state or incomplete. Recovery export must instead take the exact original string read from `localStorage["deyn.v1"]`.

Do not assume that an anchor-triggered Blob download reliably saves a file in the installed Android WebView. The existing function does not prove that the user received a file, and no Android-device test result is available.

Before implementing recovery export, choose and add a supported Capacitor file/share mechanism only after checking its exact Capacitor 7 compatibility and API. Then test on the target phone that:
- the save/share sheet is actually presented;
- the resulting file contains the exact original raw value;
- the filename and extension are clear (a `.txt` extension is safest for malformed JSON);
- the app does not report success until the platform operation succeeds;
- canceling the share/save operation leaves the original storage untouched;
- the export is local/user-directed and never uploaded automatically.

## Privacy requirement

The recovery export may contain customer names, debt balances, account/auth fields, and other private business information. Show the warning before the explicit export action. Never silently copy the content to clipboard or send it to a server.

## Not done

- No dependency was installed.
- No Android project was generated or modified.
- No recovery UI was integrated.
- No export/download was tested on the target Android phone.
- The current production source and `main` branch remain unchanged.
