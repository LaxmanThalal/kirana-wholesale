'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.hostname === 'localhost' || window.location.protocol === 'https:') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ ServiceWorker registration successful with scope: ', registration.scope);
            
            // Register sync if online/offline toggle happens
            if ('sync' in registration) {
              console.log('✅ Background Sync is supported!');
            }
          })
          .catch((error) => {
            console.error('❌ ServiceWorker registration failed: ', error);
          });
      });

      // Handle message from service worker when orders are synced
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'ORDER_SYNCED') {
          console.log(`📦 Order ${event.data.orderId} synchronized by Service Worker!`);
          
          // Dispatch a custom event to notify components to refresh their outbox count
          window.dispatchEvent(new CustomEvent('outbox-sync-complete', { detail: event.data }));
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      // Listen for window online event to trigger manual sync fallback
      const handleOnline = async () => {
        console.log('🌐 Connection recovered! Triggering background sync manually...');
        const registration = await navigator.serviceWorker.ready;
        
        // Use sync API if available
        if ('sync' in registration) {
          try {
            await (registration as any).sync.register('sync-orders');
          } catch (err) {
            console.warn('⚠️ Sync registration failed, falling back to message sync:', err);
            registration.active?.postMessage({ type: 'SYNC_ORDERS' });
          }
        } else {
          // Fallback to sending postMessage to SW
          registration.active?.postMessage({ type: 'SYNC_ORDERS' });
        }
      };

      window.addEventListener('online', handleOnline);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        window.removeEventListener('online', handleOnline);
      };
    }
  }, []);

  return null;
}
