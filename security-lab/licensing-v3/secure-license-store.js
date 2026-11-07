// Lab-only secure license metadata adapter. Never falls back to localStorage.
const PREFIX = "deyn_v3_";
const KEY_RE = /^[a-z][a-z0-9_]{0,63}$/;

export function createSecureLicenseStore(plugin) {
  if (!plugin || typeof plugin.getPlatform !== "function" ||
      typeof plugin.get !== "function" || typeof plugin.set !== "function") {
    throw new Error("Native secure storage plugin is unavailable");
  }

  let platformCheck;
  async function assertAndroidSecureStorage() {
    if (!platformCheck) {
      platformCheck = Promise.resolve().then(() => plugin.getPlatform()).then(result => {
        const platform = String(result?.platform || result || "").toLowerCase();
        if (platform !== "android") throw new Error("Secure license storage is supported only on verified Android");
        return true;
      });
    }
    return platformCheck;
  }

  function storageKey(key) {
    if (typeof key !== "string" || !KEY_RE.test(key)) throw new Error("Invalid secure storage key");
    return PREFIX + key;
  }

  return Object.freeze({
    async get(key) {
      await assertAndroidSecureStorage();
      const result = await plugin.get({ key: storageKey(key) });
      if (result == null || result.value == null) return null;
      if (typeof result.value !== "string") throw new Error("Secure storage returned a non-string value");
      return result.value;
    },

    async set(key, value) {
      await assertAndroidSecureStorage();
      const normalized = String(value);
      const fullKey = storageKey(key);
      const saved = await plugin.set({ key: fullKey, value: normalized });
      if (saved !== true) throw new Error("Secure storage did not confirm the write");
      const readBack = await plugin.get({ key: fullKey });
      if (!readBack || readBack.value !== normalized) throw new Error("Secure storage read-after-write verification failed");
      return true;
    }
  });
}
