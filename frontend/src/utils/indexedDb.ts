// IndexedDB Utility to manage offline checkout outbox queue

export interface QueuedOrder {
  id: string; // The generated order number (e.g. ORD-XXXXX)
  payload: {
    storeId: string;
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: 'CASH' | 'FONEPAY' | 'UDHARO';
    notes?: string;
    fonepayPrn?: string;
  };
  timestamp: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in browser environments'));
      return;
    }
    const request = window.indexedDB.open('kirana-wholesale-db', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function saveOrderToOutbox(id: string, payload: QueuedOrder['payload']): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('outbox', 'readwrite');
    const store = transaction.objectStore('outbox');
    const item: QueuedOrder = {
      id,
      payload,
      timestamp: Date.now(),
    };
    
    const request = store.put(item);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getQueuedOrders(): Promise<QueuedOrder[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('outbox', 'readonly');
    const store = transaction.objectStore('outbox');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getOutboxCount(): Promise<number> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('outbox', 'readonly');
      const store = transaction.objectStore('outbox');
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error getting outbox count:', err);
    return 0;
  }
}

export async function deleteOrderFromOutbox(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('outbox', 'readwrite');
    const store = transaction.objectStore('outbox');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Trigger Sync via Service Worker
export async function triggerBackgroundSync(): Promise<void> {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      try {
        await (registration as any).sync.register('sync-orders');
        console.log('✅ Triggered sync-orders background sync tag');
      } catch (err) {
        console.warn('⚠️ Background sync tag registration failed, falling back to message:', err);
        registration.active?.postMessage({ type: 'SYNC_ORDERS' });
      }
    } else {
      registration.active?.postMessage({ type: 'SYNC_ORDERS' });
    }
  }
}
