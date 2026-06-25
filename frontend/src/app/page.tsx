'use client';

import { useState, useEffect } from 'react';
import { useCart, ProductInfo } from '../hooks/useCart';
import { MOCK_PRODUCTS, MOCK_STORES, StoreInfo } from '../utils/mockData';
import {
  saveOrderToOutbox,
  getQueuedOrders,
  getOutboxCount,
  deleteOrderFromOutbox,
  triggerBackgroundSync,
  QueuedOrder,
} from '../utils/indexedDb';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import { 
  Wifi, 
  WifiOff, 
  ShoppingCart, 
  Trash2, 
  Database, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard, 
  User, 
  Phone,
  Search,
  Plus,
  Minus
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function Home() {
  const [isOnline, setIsOnline] = useState(true);
  const [stores, setStores] = useState<StoreInfo[]>(MOCK_STORES);
  const [products, setProducts] = useState<ProductInfo[]>(MOCK_PRODUCTS);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'FONEPAY' | 'UDHARO'>('CASH');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbLoading, setDbLoading] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  
  // Notification states
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // Outbox count
  const [outboxCount, setOutboxCount] = useState(0);
  const [queuedOrders, setQueuedOrders] = useState<QueuedOrder[]>([]);

  // Cart custom hook
  const { cartItems, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();

  // Selected store object
  const activeStore = stores.find(s => s._id === selectedStoreId);

  // Monitor network status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const goOnline = () => {
        setIsOnline(true);
        showNotification('success', 'You are back online! Syncing outbox...');
        syncOutboxNow();
      };
      const goOffline = () => {
        setIsOnline(false);
        showNotification('warning', 'Connection lost. Working in offline mode.');
      };

      window.addEventListener('online', goOnline);
      window.addEventListener('offline', goOffline);

      return () => {
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
      };
    }
  }, []);

  // Fetch count and list from IndexedDB outbox on load and when notifications or sync completes
  const refreshOutbox = async () => {
    const count = await getOutboxCount();
    setOutboxCount(count);
    const list = await getQueuedOrders();
    setQueuedOrders(list);
  };

  useEffect(() => {
    refreshOutbox();
    
    // Listen to custom outbox sync events from the Service Worker
    const handleSyncComplete = () => {
      refreshOutbox();
      showNotification('success', 'Background synchronization completed successfully!');
    };

    window.addEventListener('outbox-sync-complete', handleSyncComplete);
    return () => {
      window.removeEventListener('outbox-sync-complete', handleSyncComplete);
    };
  }, []);

  // Initial load: Fetch stores and products from backend if online
  useEffect(() => {
    async function fetchData() {
      if (!isOnline) return;
      try {
        const storeRes = await fetch(`${BACKEND_URL}/health`); // Check health first
        if (!storeRes.ok) return;

        // Try getting products/stores if seeded
        // Note: For now, if database is seeded, we can use our mock list as primary state 
        // and allow reloading. In a fully populated production app we would hit API endpoints.
      } catch (err) {
        console.warn('Backend server not reachable. Falling back to local data.');
      }
    }
    fetchData();
  }, [isOnline]);

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Seed DB handler
  const handleSeedDatabase = async () => {
    setDbLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/seed`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.message);
      } else {
        showNotification('error', data.error || 'Failed to seed database.');
      }
    } catch (err) {
      showNotification('error', 'Backend is offline. Cannot seed MongoDB.');
    } finally {
      setDbLoading(false);
    }
  };

  // Manual Sync trigger
  const syncOutboxNow = async () => {
    if (!isOnline) {
      showNotification('error', 'Cannot sync while offline.');
      return;
    }
    showNotification('warning', 'Synchronizing outbox...');
    await triggerBackgroundSync();
    // Manual fallback for browsers that don't support Background Sync
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: 'SYNC_ORDERS' });
    }
    setTimeout(refreshOutbox, 1500);
  };

  // Submit Order handler
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStoreId) {
      showNotification('error', 'Please select a Kirana Store.');
      return;
    }

    if (cartItems.length === 0) {
      showNotification('error', 'Shopping cart is empty.');
      return;
    }

    // Validate Udharo credit limits locally if store selected
    if (paymentMethod === 'UDHARO' && activeStore) {
      const available = activeStore.creditLimit - activeStore.outstandingBalance;
      if (available < cartTotal) {
        showNotification('error', `Insufficient Credit! Limit: NPR ${available}, Required: NPR ${cartTotal}`);
        return;
      }
    }

    // Generate locally unique order number for queue matching
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const orderPayload = {
      storeId: selectedStoreId,
      items: cartItems.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
      })),
      paymentMethod,
      notes: notes || undefined,
    };

    setOrderSubmitting(true);

    if (isOnline) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/orders/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderPayload),
        });

        const data = await response.json();

        if (response.ok || response.status === 202) {
          showNotification('success', `Order ${data.orderNumber || orderId} successfully placed and queued!`);
          clearCart();
          setNotes('');
        } else {
          showNotification('error', data.error || 'Server rejected checkout transaction.');
        }
      } catch (err) {
        // Fallback to outbox if POST fails on network issues even if online indicator is true
        console.warn('Network request failed, saving to outbox queue.');
        await saveOrderToOutbox(orderId, orderPayload);
        showNotification('warning', `Network issue. Order ${orderId} saved locally to Outbox.`);
        clearCart();
        setNotes('');
        refreshOutbox();
      } finally {
        setOrderSubmitting(false);
      }
    } else {
      // Save directly to IndexedDB outbox when offline
      try {
        await saveOrderToOutbox(orderId, orderPayload);
        showNotification('success', `Device is Offline. Order ${orderId} queued in IndexedDB outbox.`);
        clearCart();
        setNotes('');
        refreshOutbox();
      } catch (err) {
        showNotification('error', 'Failed to save order to local storage.');
      } finally {
        setOrderSubmitting(false);
      }
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <ServiceWorkerRegister />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-500 to-cyan-500 p-2 rounded-xl text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Kathmandu Kirana Wholesale</h1>
            <p className="text-xs text-slate-400">Offline-First Shopkeeper checkout engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* DB Seeder Button */}
          <button
            onClick={handleSeedDatabase}
            disabled={dbLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 transition disabled:opacity-50"
            title="Wipe and insert sample Kirana stores & products in MongoDB"
          >
            <Database className="w-3.5 h-3.5" />
            {dbLoading ? 'Seeding...' : 'Seed MongoDB'}
          </button>

          {/* Connection Status Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition ${
            isOnline 
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' 
              : 'bg-rose-950/40 text-rose-400 border-rose-500/30 animate-pulse'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>OFFLINE</span>
              </>
            )}
          </div>

          {/* Outbox Badge */}
          {outboxCount > 0 && (
            <button
              onClick={syncOutboxNow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-950 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-900 transition animate-bounce"
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>{outboxCount} Outbox Sync</span>
            </button>
          )}
        </div>
      </header>

      {/* Notifications Alert Banner */}
      {notification && (
        <div className={`mx-4 mt-4 p-4 rounded-xl flex items-start gap-3 border shadow-lg transition duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-200' 
            : notification.type === 'warning'
            ? 'bg-amber-950/70 border-amber-500/30 text-amber-200'
            : 'bg-rose-950/70 border-rose-500/30 text-rose-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Main Grid */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Product Catalog & Stores */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Store Selector & Info Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h2 className="text-md font-bold mb-3 flex items-center gap-2 text-white">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Kirana Pasal Store Accounts</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Select Store</label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="">-- Choose a Kirana Store --</option>
                  {stores.map(store => (
                    <option key={store._id} value={store._id}>{store.name}</option>
                  ))}
                </select>
              </div>

              {activeStore ? (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Owner: <strong>{activeStore.ownerName}</strong></span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {activeStore.phone}</span>
                  </div>
                  <hr className="border-slate-800" />
                  <div className="flex justify-between items-center">
                    <span>Credit Limit: <span className="font-semibold text-slate-300">NPR {activeStore.creditLimit}</span></span>
                    <span>Udharo Balance: <span className="font-semibold text-rose-400">NPR {activeStore.outstandingBalance}</span></span>
                  </div>
                  <div className="flex justify-between items-center pt-1 font-bold">
                    <span className="text-emerald-400">Available Udharo Credit:</span>
                    <span className="text-emerald-400">NPR {activeStore.creditLimit - activeStore.outstandingBalance}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center border border-dashed border-slate-800 rounded-xl p-4 text-xs text-slate-500">
                  Select a store to view Udharo credit limit records.
                </div>
              )}
            </div>
          </div>

          {/* Product List */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span>Product Wholesale Catalog</span>
              </h2>
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search products or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 w-full sm:w-56 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[460px] pr-1">
              {filteredProducts.map((prod) => {
                const isLow = prod.stockQuantity <= 10;
                const cartQty = cartItems.find(item => item.product._id === prod._id)?.quantity || 0;
                const isOutOfStock = prod.stockQuantity === 0;

                return (
                  <div
                    key={prod._id}
                    className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-3 flex justify-between gap-3 transition hover:shadow-lg hover:shadow-emerald-500/5"
                  >
                    <div className="flex flex-col justify-between">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] uppercase font-semibold mb-1">
                          {prod.category}
                        </span>
                        <h3 className="font-bold text-sm text-slate-200">{prod.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">SKU: {prod.sku}</p>
                      </div>
                      <div className="mt-3">
                        <span className="text-xs text-slate-400">Wholesale Price:</span>
                        <p className="text-md font-extrabold text-emerald-400">NPR {prod.wholesalePrice}</p>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end shrink-0">
                      {/* Stock Level badge */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isOutOfStock 
                          ? 'bg-rose-950 text-rose-400' 
                          : isLow 
                          ? 'bg-amber-950 text-amber-400' 
                          : 'bg-slate-850 text-slate-300'
                      }`}>
                        Stock: {prod.stockQuantity} {prod.unit}s
                      </span>

                      {/* Add/Edit quantity buttons */}
                      {cartQty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-slate-950 rounded-lg p-1 border border-slate-700">
                          <button
                            onClick={() => updateQuantity(prod._id, cartQty - 1)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center text-white">{cartQty}</span>
                          <button
                            onClick={() => updateQuantity(prod._id, cartQty + 1)}
                            disabled={cartQty >= prod.stockQuantity}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition disabled:opacity-30"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(prod)}
                          disabled={isOutOfStock}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-md disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-2 text-center py-8 text-sm text-slate-500">
                  No products match your search.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right 1 Column: Checkout Cart Summary */}
        <section className="flex flex-col gap-6">
          <form onSubmit={handleCheckout} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-xl">
            <h2 className="text-md font-bold text-white flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>Active Checkout Cart</span>
            </h2>

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto max-h-[280px] mb-4 pr-1 flex flex-col gap-2">
              {cartItems.map((item) => (
                <div key={item.product._id} className="bg-slate-900/40 border border-slate-850 p-2.5 rounded-xl flex justify-between gap-3 items-center">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{item.product.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      NPR {item.product.wholesalePrice} × {item.quantity} {item.product.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-extrabold text-emerald-400 w-16 text-right">
                      NPR {item.product.wholesalePrice * item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product._id)}
                      className="p-1 hover:bg-rose-950 hover:text-rose-400 text-slate-500 rounded transition"
                      title="Remove product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cartItems.length === 0 && (
                <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-850 rounded-xl my-2">
                  Shopping cart is empty. Add products from the catalog.
                </div>
              )}
            </div>

            {/* Total Row */}
            <div className="border-t border-slate-800 pt-3 flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-slate-400">Grand Total:</span>
              <span className="text-lg font-black text-emerald-400">NPR {cartTotal}</span>
            </div>

            {/* Payment Method Select */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Payment Terms</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'FONEPAY', 'UDHARO'] as const).map((method) => {
                  const active = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl text-[10px] font-bold text-center border uppercase tracking-wider transition ${
                        active
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      {method === 'UDHARO' ? 'Udharo (Credit)' : method}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes field */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
              <textarea
                placeholder="Optional order notes (e.g. delivery time, credit references)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Checkout Button */}
            <button
              type="submit"
              disabled={orderSubmitting || cartItems.length === 0 || !selectedStoreId}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 rounded-xl font-bold transition shadow-lg shadow-cyan-500/10 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none"
            >
              {orderSubmitting ? 'Processing Checkout...' : isOnline ? 'Submit Order (Queue via API)' : 'Queue Offline Order'}
            </button>
          </form>

          {/* Outbox Queue List Panel */}
          {queuedOrders.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-extrabold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Pending Outbox Queue ({queuedOrders.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={syncOutboxNow}
                  className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Sync Now
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                {queuedOrders.map((ord) => {
                  const storeName = stores.find(s => s._id === ord.payload.storeId)?.name || 'Unknown Store';
                  const itemTotalCount = ord.payload.items.length;
                  return (
                    <div key={ord.id} className="bg-slate-900/50 border border-slate-850 p-2 rounded-lg flex flex-col gap-1 text-[10px]">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-300">{ord.id}</span>
                        <span className="text-slate-500">{new Date(ord.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>{storeName}</span>
                        <span>{itemTotalCount} items • <strong className="text-amber-400/80 uppercase">{ord.payload.paymentMethod}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-center py-4 px-4 text-xs text-slate-500 mt-auto">
        <p>© 2026 Kathmandu Kirana Wholesale Engine. Active Service Worker & localforage enabled.</p>
      </footer>
    </div>
  );
}
