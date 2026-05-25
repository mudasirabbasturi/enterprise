"use strict";

const CACHE_NAME = "offline-cache-v1";
const OFFLINE_URL = '/offline.html';

const filesToCache = [
    OFFLINE_URL
];

self.addEventListener("install", (event) => {
    console.log("Service Worker installing...");
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log("Caching offline page");
                return cache.addAll(filesToCache);
            })
            .catch((error) => {
                console.error("Failed to cache files:", error);
            })
    );
    self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
    // Skip cross-origin requests and non-GET requests
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Handle favicon to prevent errors
    if (event.request.url.includes('favicon.ico')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(null, { status: 204 });
            })
        );
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache successful responses for offline use
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(OFFLINE_URL);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return new Response('You are offline', {
                        status: 200,
                        headers: new Headers({ 'Content-Type': 'text/html' })
                    });
                })
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).catch((error) => {
                        console.error("Fetch failed for:", event.request.url, error);
                        // Return a fallback response for failed requests
                        return new Response('Resource not available', {
                            status: 200,
                            headers: new Headers({ 'Content-Type': 'text/plain' })
                        });
                    });
                })
        );
    }
});

self.addEventListener('activate', (event) => {
    console.log("Service Worker activating...");
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log("Deleting old cache:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log("Claiming clients...");
            return self.clients.claim();
        })
    );
});