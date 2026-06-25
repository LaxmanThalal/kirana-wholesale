const BACKEND_URL = 'http://localhost:5000/api/orders/checkout';

self.addEventListener('install', (event) => {
  console.log('👷 Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activated.');
  event.waitUntil(self.clients.claim());
});

// IndexedDB Helper Functions
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kirana-wholesale-db', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Get all orders from IndexedDB outbox
function getAllQueuedOrders(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('outbox', 'readonly');
    const store = transaction.objectStore('outbox');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Delete order from IndexedDB outbox
function deleteQueuedOrder(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('outbox', 'readwrite');
    const store = transaction.objectStore('outbox');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Background Sync functionality
async function syncOfflineOrders() {
  console.log('🔄 Checking for offline orders to synchronize...');
  try {
    const db = await openDatabase();
    const orders = await getAllQueuedOrders(db);
    
    if (orders.length === 0) {
      console.log('   No offline orders in outbox queue.');
      return;
    }
    
    console.log(`   Found ${orders.length} order(s) to synchronize.`);
    
    for (const item of orders) {
      console.log(`   Synchronizing order ${item.id}...`);
      try {
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.payload),
        });
        
        if (response.ok || response.status === 202) {
          console.log(`   Order ${item.id} successfully synchronized.`);
          await deleteQueuedOrder(db, item.id);
          
          // Notify clients that sync completed
          const clientsList = await self.clients.matchAll();
          for (const client of clientsList) {
            client.postMessage({ type: 'ORDER_SYNCED', orderId: item.id });
          }
        } else {
          console.warn(`   Order ${item.id} failed to sync (Status ${response.status}). Will retry later.`);
        }
      } catch (postError) {
        console.error(`   Failed to sync order ${item.id} due to network error:`, postError);
        throw postError; // Propagate error to let sync trigger retry
      }
    }
  } catch (error) {
    console.error('❌ Sync error:', error);
  }
}

// Listen for sync event (Background Sync API)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

// Message listener for manual sync request or fallback
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_ORDERS') {
    event.waitUntil(syncOfflineOrders());
  }
});
