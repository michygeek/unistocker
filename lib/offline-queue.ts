// IndexedDB-backed queue for operations recorded while offline

const DB_NAME = "unistocker-offline";
const STORE = "pending_ops";
const DB_VERSION = 1;

export type OpType = "SALE" | "STOCK_IN" | "STOCK_OUT";

export interface PendingOp {
  id: string;
  type: OpType;
  payload: Record<string, unknown>;
  createdAt: number;
  retries: number;
  status: "pending" | "failed";
  error?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export function addOp(
  op: Omit<PendingOp, "id" | "createdAt" | "retries" | "status">
): Promise<string> {
  const full: PendingOp = {
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    retries: 0,
    status: "pending",
  };
  return run("readwrite", (s) => s.add(full)).then(() => full.id);
}

export function getOps(): Promise<PendingOp[]> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () =>
          resolve((req.result as PendingOp[]).sort((a, b) => a.createdAt - b.createdAt));
        req.onerror = () => reject(req.error);
      })
  );
}

export function getPendingCount(): Promise<number> {
  return run("readonly", (s) => s.count()).then((n) => n);
}

export function updateOp(id: string, changes: Partial<PendingOp>): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const updated = { ...getReq.result, ...changes };
          const putReq = store.put(updated);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        };
        getReq.onerror = () => reject(getReq.error);
      })
  );
}

export function deleteOp(id: string): Promise<void> {
  return run("readwrite", (s) => s.delete(id)).then(() => {});
}
