// Compatibility router for a future dual-version app release.
// It never falls back from one verifier to the other.
export async function verifyLicenseByVersion({ code, verifyV2, verifyV3 }) {
  if (typeof code !== "string") return null;
  const normalized = code.trim().replace(/[\s\u200e\u200f\u202a-\u202e]/g, "");
  if (normalized.startsWith("DEYN2-")) {
    return typeof verifyV2 === "function" ? await verifyV2(normalized) : null;
  }
  if (normalized.startsWith("DEYN3-")) {
    return typeof verifyV3 === "function" ? await verifyV3(normalized) : null;
  }
  return null;
}
