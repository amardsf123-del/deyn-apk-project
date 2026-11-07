# Capacitor 8 Firebase bridge compatibility check

This isolated package checks that the current Firebase Capacitor plugins and the secure-storage plugin resolve together with Capacitor 8. It is not copied into the production app and does not change `main`.

The recovered DEYN app currently uses Capacitor 7. The maintained Firebase plugin line is 8.x for Capacitor 8; the 7.x plugin line is deprecated. The secure-storage plugin release history maps 0.13.x to Capacitor 8 and 0.11.x to Capacitor 7.

This package is used by CI to validate npm dependency resolution only. It does not prove native Android compilation, Firebase project configuration, App Check, offline cache persistence, or runtime behavior. Those require the real app, Firebase configuration from the owner's project, and physical-device tests.
