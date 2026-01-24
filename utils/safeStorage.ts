
/**
 * SOVEREIGN STORAGE UTILS (v5.5.5 - RECOVERY)
 * Strictly enforces data types to prevent white-screen crashes.
 */

const NS = "aca:v5:"; 
export const k = (name: string) => NS + name;

/**
 * Ensures the returned value is always an Array.
 */
export function readArray<T>(key: string, fallback: T[] = []): T[] {
  try {
    const raw = localStorage.getItem(k(key));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Ensures the returned value is a non-null Object.
 */
export function readObject<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k(key));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? (parsed as T) : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Standard JSON read (Legacy support)
 */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k(key));
    if (!raw || raw === "undefined" || raw === "null") return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback; 
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(k(key), JSON.stringify(value));
  } catch (e) {}
}

export function clearVault() {
  try {
    localStorage.clear();
  } catch (e) {}
}
