
/**
 * SOVEREIGN STORAGE UTILS (Chatty Reinforced)
 * Prevents JSON.parse kills and handles corrupted browser state.
 */

const NS = "aca:v5:"; // Upgraded namespace
export const k = (name: string) => NS + name;

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw || raw === "undefined" || raw === "null") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Sovereign Vault: Block Corrupted.`, e);
    return fallback;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k(key));
    return safeJsonParse<T>(raw, fallback);
  } catch {
    return fallback; 
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(k(key), JSON.stringify(value));
  } catch (e) {
    // quota exceeded / blocked — ignore
  }
}

export function clearVault() {
  try {
    localStorage.clear();
  } catch (e) {}
}
