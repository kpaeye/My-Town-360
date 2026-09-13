javascript
/* =========================================================
   MYTOWN360 SERVICE WORKER
   PWA / OFFLINE / INSTALL SUPPORT
========================================================= */

const CACHE_NAME = "mytown360-v2";

const CORE_ASSETS = [
    "/",
    "/index.html",
    "/manifest.json",

    /* PWA icons */
    "/icons/icon-192.png",
    "/icons/icon-512.png"
];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener("install", event => {

    console.log("[MyTown360 SW] Installing:", CACHE_NAME);

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(CORE_ASSETS);

            })

    );

    /*
     * Activate the new service worker immediately.
     */
    self.skipWaiting();

});


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener("activate", event => {

    console.log("[MyTown360 SW] Activating:", CACHE_NAME);

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames
                        .filter(cacheName => {

                            return (
                                cacheName.startsWith("mytown360-") &&
                                cacheName !== CACHE_NAME
                            );

                        })
                        .map(cacheName => {

                            console.log(
                                "[MyTown360 SW] Removing old cache:",
                                cacheName
                            );

                            return caches.delete(cacheName);

                        })

                );

            })
            .then(() => {

                /*
                 * Take control of all open
                 * MyTown360 pages immediately.
                 */

                return self.clients.claim();

            })

    );

});


/* =========================================================
   FETCH
========================================================= */

self.addEventListener("fetch", event => {

    const request = event.request;


    /*
     * Only handle GET requests.
     */

    if (request.method !== "GET") {
        return;
    }


    /*
     * Ignore browser extensions
     * and unsupported schemes.
     */

    if (
        !request.url.startsWith("http://") &&
        !request.url.startsWith("https://")
    ) {
        return;
    }


    /* =====================================================
       PAGE NAVIGATION
    =====================================================

       Network first.

       This means visitors normally receive
       the newest version of MyTown360.

       If the network is unavailable,
       the cached application opens.
    */

    if (request.mode === "navigate") {

        event.respondWith(

            fetch(request)

                .then(response => {

                    /*
                     * Cache the newest index page.
                     */

                    if (
                        response &&
                        response.status === 200
                    ) {

                        const responseClone =
                            response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    "/index.html",
                                    responseClone
                                );

                            });

                    }

                    return response;

                })

                .catch(() => {

                    console.log(
                        "[MyTown360 SW] Offline navigation"
                    );

                    return caches.match(
                        "/index.html"
                    );

                })

        );

        return;
    }


    /* =====================================================
       OTHER GET REQUESTS
    =====================================================

       Cache first.

       If the file is not cached,
       retrieve it from the network and
       store a copy for future use.
    */

    event.respondWith(

        caches.match(request)

            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }


                return fetch(request)

                    .then(response => {

                        /*
                         * Only cache successful
                         * same-origin responses.
                         */

                        if (
                            response &&
                            response.status === 200 &&
                            response.type === "basic"
                        ) {

                            const responseClone =
                                response.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {

                                    cache.put(
                                        request,
                                        responseClone
                                    );

                                });

                        }

                        return response;

                    });

            })

    );

});


/* =========================================================
   MESSAGE HANDLER
========================================================= */

self.addEventListener("message", event => {

    if (!event.data) {
        return;
    }


    /*
     * Allows the page to tell the
     * service worker to activate immediately.
     */

    if (event.data.type === "SKIP_WAITING") {

        self.skipWaiting();

    }

});