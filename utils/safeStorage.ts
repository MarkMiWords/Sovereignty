
/**
 * SOVEREIGN STORAGE UTILS (v5.6.0 - SHADOW REGISTRY)
 * Strictly enforces data types and provides dual-layer persistence.
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
 * Standard JSON read
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

/**
 * SHADOW REGISTRY: Keeps lightweight metadata of books in LocalStorage
 * as a backup for IndexedDB hibernation.
 */
export function syncShadowRegistry(books: any[]) {
  const shadow = books.map(b => ({
    id: b.id,
    title: b.title,
    author: b.author,
    slug: b.slug,
    releaseYear: b.releaseYear,
    subtitle: b.subtitle,
    description: b.description,
    hasAsset: !!b.coverUrl
  }));
  writeJson('shadow_book_registry', shadow);
}

export function clearVault() {
  try {
    localStorage.clear();
  } catch (e) {}
}
