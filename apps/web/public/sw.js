/**
 * Service Worker for 3ON Mobile Carwash PWA
 * - App Shell caching for offline support
 * - Runtime caching for dynamic content
 * - Background sync for offline bookings
 * - Push notification handling
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `3on-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `3on-dynamic-${CACHE_VERSION}`;
const BOOKING_SYNC_TAG = 'booking-sync';

// App shell - critical assets for offline
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/favicon-32x32.png',
  '/logo-192x192.png',
  '/logo-512x512.png',
  '/offline.html',
];

// Assets to cache on install (extend app shell)
const STATIC_ASSETS = [
  ...APP_SHELL,
  '/logo.png',
];

// Domains to cache from (fonts, CDN)
const CACHEABLE_ORIGINS = [
  self.location.origin,
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

// IndexedDB for offline bookings
const DB_NAME = '3on-offline';
const DB_VERSION = 1;
const BOOKING_STORE = 'pending-bookings';

/**
 * Open IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(BOOKING_STORE)) {
        db.createObjectStore(BOOKING_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Get all pending bookings from IndexedDB
 */
async function getPendingBookings() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKING_STORE, 'readonly');
    const store = tx.objectStore(BOOKING_STORE);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Delete a pending booking from IndexedDB
 */
async function deletePendingBooking(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKING_STORE, 'readwrite');
    const store = tx.objectStore(BOOKING_STORE);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Sync pending bookings to the server
 */
async function syncPendingBookings() {
  console.log('[SW] Syncing pending bookings...');
  
  try {
    const bookings = await getPendingBookings();
    console.log(`[SW] Found ${bookings.length} pending bookings`);
    
    for (const booking of bookings) {
      try {
        // Send to the main thread to handle Firestore submission
        const clients = await self.clients.matchAll({ type: 'window' });
        
        for (const client of clients) {
          client.postMessage({
            type: 'SYNC_BOOKING',
            booking: booking.data,
            offlineId: booking.id,
          });
        }
        
        // Mark as synced (actual deletion happens after main thread confirms)
        console.log(`[SW] Sent booking ${booking.id} for sync`);
      } catch (error) {
        console.error(`[SW] Failed to sync booking ${booking.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Re-throw to trigger retry
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Cache install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('3on-') && 
                     name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - Stale-While-Revalidate for HTML, Cache-First for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip non-cacheable origins
  const isCacheable = CACHEABLE_ORIGINS.some(origin => 
    url.origin === origin || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')
  );
  
  if (!isCacheable) return;
  
  // Navigation requests (HTML pages) - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Try cache first
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          
          // Fall back to offline page
          const offlineResponse = await caches.match('/offline.html');
          if (offlineResponse) return offlineResponse;
          
          // Last resort - cached index
          return caches.match('/');
        })
    );
    return;
  }
  
  // Static assets (JS, CSS, images) - Cache first, network fallback
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached and update in background
            fetch(request).then((response) => {
              if (response.ok) {
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, response);
                });
              }
            }).catch(() => {});
            
            return cachedResponse;
          }
          
          // Not in cache - fetch and cache
          return fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, clone);
              });
            }
            return response;
          });
        })
        .catch(() => {
          // For images, return a placeholder
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ddd" width="100" height="100"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
          return new Response('', { status: 408 });
        })
    );
    return;
  }
  
  // API requests - Network only (don't cache)
  if (url.pathname.includes('/api/') || url.hostname.includes('firestore')) {
    return; // Let browser handle
  }
  
  // Everything else - Network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Background sync for offline bookings
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === BOOKING_SYNC_TAG) {
    event.waitUntil(syncPendingBookings());
  }
});

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: '3ON Carwash',
    body: 'You have a new notification',
    icon: '/logo-192x192.png',
    badge: '/favicon-32x32.png',
    tag: 'default',
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.notification?.title || payload.title || data.title,
        body: payload.notification?.body || payload.body || data.body,
        icon: payload.notification?.icon || payload.icon || data.icon,
        badge: payload.notification?.badge || payload.badge || data.badge,
        tag: payload.notification?.tag || payload.tag || data.tag,
        data: payload.data || {},
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', async (event) => {
  console.log('[SW] Message received:', event.data?.type);
  
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'BOOKING_SYNCED':
      // Main thread confirms booking was synced
      if (payload?.offlineId) {
        await deletePendingBooking(payload.offlineId);
        console.log(`[SW] Deleted synced booking: ${payload.offlineId}`);
      }
      break;
      
    case 'GET_PENDING_COUNT':
      // Return count of pending bookings
      const bookings = await getPendingBookings();
      event.source.postMessage({
        type: 'PENDING_COUNT',
        count: bookings.length,
      });
      break;
      
    case 'TRIGGER_SYNC':
      // Manually trigger sync
      if (self.registration.sync) {
        await self.registration.sync.register(BOOKING_SYNC_TAG);
      } else {
        // Fallback for browsers without background sync
        await syncPendingBookings();
      }
      break;
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-pending-bookings') {
    event.waitUntil(syncPendingBookings());
  }
});

console.log('[SW] Service worker loaded');
