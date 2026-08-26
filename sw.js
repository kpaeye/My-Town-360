/* =========================================================
   MYTOWN360 SERVICE WORKER
========================================================= */

const CACHE_NAME = "mytown360-v1";

const CORE_ASSETS = [
    "/",
    "/index.html",
    "/manifest.json"
];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        console.log(
            "[MyTown360 SW] Installing..."
        );

        event.waitUntil(

            caches.open(CACHE_NAME)
                .then(cache => {

                    return cache.addAll(
                        CORE_ASSETS
                    );

                })

        );

        self.skipWaiting();

    }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    event => {

        console.log(
            "[MyTown360 SW] Activating..."
        );

        event.waitUntil(

            caches.keys()
                .then(cacheNames => {

                    return Promise.all(

                        cacheNames
                            .filter(
                                cacheName =>
                                    cacheName !== CACHE_NAME
                            )
                            .map(
                                cacheName =>
                                    caches.delete(
                                        cacheName
                                    )
                            )

                    );

                })

        );

        self.clients.claim();

    }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;

        /*
         * Only handle GET requests.
         */

        if (
            request.method !== "GET"
        ) {
            return;
        }


        /*
         * Navigation requests:
         *
         * Network first.
         * If the network fails,
         * return cached index.html.
         */

        if (
            request.mode === "navigate"
        ) {

            event.respondWith(

                fetch(request)

                    .then(response => {

                        /*
                         * Save the newest
                         * version in cache.
                         */

                        const responseClone =
                            response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    "/index.html",
                                    responseClone
                                );

                            });

                        return response;

                    })

                    .catch(() => {

                        return caches.match(
                            "/index.html"
                        );

                    })

            );

            return;

        }


        /*
         * Other files:
         *
         * Cache first, then network.
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
                             * Cache successful
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

    }
);