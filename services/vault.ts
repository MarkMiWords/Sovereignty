
import { Book } from '../types';

const DB_NAME = "aca_sovereign_registry";
const DB_VERSION = 8; 
const STORE = "books";
const SLUG_INDEX = "by_slug";

let dbPromise: Promise<IDBDatabase> | null = null;

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

export function openVault(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      let store: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE)) {
        store = db.createObjectStore(STORE, { keyPath: "id" });
      } else {
        store = request.transaction!.objectStore(STORE);
      }
      if (!store.indexNames.contains(SLUG_INDEX)) {
        store.createIndex(SLUG_INDEX, "slug", { unique: true });
      }
      if (!store.indexNames.contains("updatedAt")) {
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Request Failed"));
  });
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error("Aborted"));
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveToVault(input: Omit<Book, "slug"> & { slug?: string }): Promise<Book> {
  const db = await openVault();
  const slug = input.slug?.trim() ? input.slug : slugify(input.title);
  const now = Date.now();
  const book: Book = {
    ...input,
    slug,
    updatedAt: now,
    createdAt: input.createdAt ?? now,
  };

  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);

  try {
    store.put(book);
    await txComplete(tx);
    const verifyTx = db.transaction(STORE, "readonly");
    const verifiedBook = await reqToPromise(verifyTx.objectStore(STORE).get(book.id));
    if (!verifiedBook) throw new Error("Verification Failed");
    return verifiedBook;
  } catch (err: any) {
    throw err;
  }
}

export async function getFromVaultBySlug(slug: string): Promise<Book | null> {
  const db = await openVault();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  const idx = store.index(SLUG_INDEX);
  const result = await reqToPromise(idx.get(slug));
  return result ?? null;
}

export async function listVault(): Promise<Book[]> {
  const db = await openVault();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  const all = await reqToPromise(store.getAll());
  return (all ?? []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function deleteFromVault(id: string): Promise<void> {
  const db = await openVault();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txComplete(tx);
}

export async function purgeVault(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;
  localStorage.clear();
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getVaultStatus(): Promise<{ healthy: boolean, version: number, count: number }> {
  try {
    const db = await openVault();
    const books = await listVault();
    return { healthy: true, version: db.version, count: books.length };
  } catch (e) {
    return { healthy: false, version: 0, count: 0 };
  }
}
