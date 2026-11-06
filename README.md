# DEYN APK build

This repository contains the GitHub Actions workflow for building DEYN.

## One required upload
Upload the file `DEYN-secure-v2-project.zip` to the root of this repository, then commit it to `main`.

The workflow `.github/workflows/build-deyn.yml` will automatically:
1. Extract the archive.
2. Build `deyn-app` and `deyn-keygen`.
3. Publish two debug APK artifacts for testing.

**Important:** these are debug/test APKs, not production release APKs. Do not distribute them to customers. A stable Android release keystore must be configured before commercial release.

Never upload `deyn-private-signing-key.pem` to this repository. Keep it offline and private.
