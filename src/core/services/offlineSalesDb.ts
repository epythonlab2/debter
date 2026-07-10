// src/core/services/offlineSalesDb.ts
import { PaymentMethodType } from '../../components/RecordSaleTab';

export interface CachedSalePayload {
  id: string; // Internal local execution identifier tag
  selectedItemId: string;
  salePrice: number | string;
  saleQty: number | string;
  customItemName?: string;
  paymentMethod: PaymentMethodType;
  buyerName?: string;
  buyerPhone?: string;
  saleDate: string;
  cachedAt: number; // For ordering transactions chronologically
}

const OFFLINE_DB_NAME = 'DebterOfflineCache';
const OFFLINE_STORE_NAME = 'pending_sales';

/**
 * Initializes and references the local browser storage context frame.
 */
const getOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Persists an unsubmitted transaction ledger entry locally to the device memory cache.
 */
export const saveOfflineSale = async (saleData: CachedSalePayload): Promise<void> => {
  const db = await getOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
    transaction.objectStore(OFFLINE_STORE_NAME).put(saleData);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * Retrieves all currently cached pending sales transactions waiting for upload.
 */
export const getOfflineSales = async (): Promise<CachedSalePayload[]> => {
  const db = await getOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_STORE_NAME, 'readonly');
    const request = transaction.objectStore(OFFLINE_STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Purges a specific sale record from the local device storage cache.
 */
export const removeOfflineSale = async (id: string): Promise<void> => {
  const db = await getOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
    transaction.objectStore(OFFLINE_STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
