// Files never leave this browser. This database contains only Rova demo uploads.
export interface DemoFiles {
  put(id: string, file: Blob): Promise<void>;
  get(id: string): Promise<Blob | undefined>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}
async function fileOperation<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("rova-demo-files-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("materials");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Browser file storage is unavailable."));
    request.onblocked = () => reject(new Error("Close other Rova tabs and try again."));
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction("materials", mode);
      const request = action(transaction.objectStore("materials"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () => reject(new Error("The file could not be saved in this browser. Check available storage."));
    });
  } finally { db.close(); }
}
export const demoFiles: DemoFiles = {
  put: async (id, file) => { await fileOperation("readwrite", store => store.put(file, id)); },
  get: id => fileOperation("readonly", store => store.get(id)),
  remove: async id => { await fileOperation("readwrite", store => store.delete(id)); },
  clear: async () => { await fileOperation("readwrite", store => store.clear()); },
};
