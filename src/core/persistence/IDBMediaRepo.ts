import type { MediaRepository } from './MediaRepository'

const DB_NAME = 'loopa.media'
const STORE_NAME = 'blobs'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export class IDBMediaRepo implements MediaRepository {
  async put(id: string, blob: Blob): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    await idbRequest(tx.objectStore(STORE_NAME).put(blob, id))
  }

  async get(id: string): Promise<Blob | null> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const result = await idbRequest<Blob | undefined>(tx.objectStore(STORE_NAME).get(id))
    return result ?? null
  }

  async delete(id: string): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    await idbRequest(tx.objectStore(STORE_NAME).delete(id))
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await Promise.all(ids.map((id) => idbRequest(store.delete(id))))
  }
}
