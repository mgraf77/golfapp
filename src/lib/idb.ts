import type { GeoCourse, SwingRecord } from '../types/geo'

/**
 * Tiny IndexedDB layer. Two stores:
 *  - courses: downloaded GeoCourse JSON (Arccos-style offline course files)
 *  - swings:  swing metadata + video blobs
 */

const DB_NAME = 'truecaddie'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('courses')) db.createObjectStore('courses', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('swings')) db.createObjectStore('swings', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB unavailable'))
  })
  return dbPromise
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode)
        const req = fn(t.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

// ── Courses ─────────────────────────────────────────────────────────────

export const courseStore = {
  list: (): Promise<GeoCourse[]> => tx('courses', 'readonly', (s) => s.getAll() as IDBRequest<GeoCourse[]>),
  get: (id: string): Promise<GeoCourse | undefined> => tx('courses', 'readonly', (s) => s.get(id)),
  save: (course: GeoCourse): Promise<IDBValidKey> => tx('courses', 'readwrite', (s) => s.put(course)),
  remove: (id: string): Promise<undefined> => tx('courses', 'readwrite', (s) => s.delete(id)),
}

// ── Swings ──────────────────────────────────────────────────────────────

export const swingStore = {
  list: async (): Promise<SwingRecord[]> => {
    const all = await tx('swings', 'readonly', (s) => s.getAll() as IDBRequest<SwingRecord[]>)
    return all.sort((a, b) => b.date.localeCompare(a.date))
  },
  get: (id: string): Promise<SwingRecord | undefined> => tx('swings', 'readonly', (s) => s.get(id)),
  save: (rec: SwingRecord): Promise<IDBValidKey> => tx('swings', 'readwrite', (s) => s.put(rec)),
  remove: async (id: string): Promise<void> => {
    await tx('swings', 'readwrite', (s) => s.delete(id))
    await tx('videos', 'readwrite', (s) => s.delete(id))
  },
  saveVideo: (id: string, blob: Blob): Promise<IDBValidKey> => tx('videos', 'readwrite', (s) => s.put(blob, id)),
  getVideo: (id: string): Promise<Blob | undefined> => tx('videos', 'readonly', (s) => s.get(id)),
}
