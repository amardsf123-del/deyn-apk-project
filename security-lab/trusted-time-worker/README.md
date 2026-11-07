# DEYN signed trusted-time Worker prototype

This is a backend template only. It is not deployed and is not connected to either DEYN app.

## What it does

- Accepts a POST request containing a fresh random client nonce.
- Uses the Worker platform clock to create a short-lived timestamp payload.
- Signs the exact UTF-8 JSON payload with an Ed25519 private key held as a Cloudflare Worker secret.
- Returns the payload and signature as base64url strings.
- Sets no-cache headers and rejects invalid requests.

The app must verify the Ed25519 signature with a separately embedded **time-service public key**, decode the payload, check `purpose`, check that the nonce exactly matches the request, and reject expired or implausibly future responses. A response must never be trusted merely because it came from HTTPS.

## Important key separation

This time-service key is separate from the DEYN license-signing key. Do not reuse either private key for the other purpose. The Worker private key must never be placed in the app, key generator, GitHub repository, or APK.

## Deployment outline (not yet performed)

1. Create an owner-controlled Cloudflare account and a Worker.
2. Generate a dedicated Ed25519 keypair locally on a trusted device.
3. Keep the private PKCS#8 key offline as a backup. Export its DER bytes as base64 and add them to the Worker as the secret named `TIME_SIGNING_PRIVATE_KEY_PKCS8_B64`.
4. Deploy this Worker source and record its HTTPS endpoint.
5. Put only the matching public key in the app's trusted-time verifier.
6. Test signature verification, nonce mismatch, expired response, modified payload, server outage, and Android WebView CORS behavior.

Do not paste the private key into chat or commit it to GitHub. Do not use a temporary or unrelated key in production.

## Request

```http
POST /
Content-Type: application/json

{"nonce":"a-fresh-random-base64url-nonce-at-least-20-chars"}
```

## Successful response

```json
{
  "payload": "<base64url-encoded exact JSON bytes>",
  "signature": "<base64url Ed25519 signature>"
}
```

The decoded payload contains `v`, `purpose`, `issuedAtMs`, `expiresAtMs`, and the echoed `nonce`.

## Security limits

- This prototype is not a complete anti-rollback system.
- Worker clock accuracy and availability are operational dependencies.
- The client must persist a verified time anchor securely and handle outages according to DEYN's agreed three-warning / 48-hour-grace policy.
- The app must not delete customer debt data or activation records when verification fails.
- Add monitoring/rate controls before public production use.
- No endpoint, keypair, account, or secret has been configured by this repository change.

## Deployment workflow prepared

A manual GitHub Actions deployment workflow is now present at
`.github/workflows/deploy-deyn-time-worker.yml`. It does not deploy automatically
and it does not contain credentials. Before running it, the repository owner must
create these GitHub Actions repository secrets:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with permission to deploy Workers.
- `CLOUDFLARE_ACCOUNT_ID` — the owner-controlled Cloudflare account ID.
- `TIME_SIGNING_PRIVATE_KEY_PKCS8_B64` — the base64-encoded PKCS#8 DER private key
  belonging to this time service.

The corresponding public key is safe to commit and is stored in
`client/public-key.js`. The time-service private key is separate from the DEYN
license-signing key and must never be committed or placed in either APK. The owner
backup files are stored outside the repository in the ChatGPT Library; keep an
offline backup as well.

After adding the three secrets, open GitHub Actions and manually run
**Deploy DEYN trusted-time Worker** from the `security-v2-lab` branch. Confirm the
deployment output and record the Worker HTTPS endpoint. This workflow has been
prepared but has **not** been run; no Worker endpoint is live yet.
