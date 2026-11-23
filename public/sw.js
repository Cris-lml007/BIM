const DB_NAME = 'bimnova-offline';
const DB_VERSION = 1;

const FILES_STORE = 'files';
const CLIENTS_STORE = 'clients';

const DOWNLOAD_HEADER = 'X-BIMNova-Offline-Download';

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(FILES_STORE)) {
                db.createObjectStore(FILES_STORE, {
                    keyPath: 'key'
                });
            }

            if (!db.objectStoreNames.contains(CLIENTS_STORE)) {
                db.createObjectStore(CLIENTS_STORE, {
                    keyPath: 'clientId'
                });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbOperation(storeName, mode, callback) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        let result;

        try {
            result = callback(store);
        } catch (error) {
            db.close();
            reject(error);
            return;
        }

        transaction.oncomplete = () => {
            db.close();
            resolve(result?.result);
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };

        transaction.onabort = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

async function setClientUser(clientId, userId) {
    return dbOperation(CLIENTS_STORE, 'readwrite', store => {
        return store.put({
            clientId,
            userId: String(userId)
        });
    });
}

async function getClientUser(clientId) {
    if (!clientId) return null;

    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            CLIENTS_STORE,
            'readonly'
        );

        const request = transaction
            .objectStore(CLIENTS_STORE)
            .get(clientId);

        request.onsuccess = () => {
            db.close();
            resolve(request.result?.userId ?? null);
        };

        request.onerror = () => {
            db.close();
            reject(request.error);
        };
    });
}

function buildFileKey(userId, url) {
    return `${userId}::${url}`;
}

/**
 * Almacena un FRAG únicamente cuando la descarga
 * fue solicitada explícitamente por el usuario.
 */
async function saveFrag(userId, url, response) {
    if (!userId || !response.ok) return false;

    if (response.headers.get('X-BIMNova-Cacheable') !== '1') {
        return false;
    }

    const responseUserId = response.headers.get(
        'X-BIMNova-User-Id'
    );

    if (String(userId) !== String(responseUserId)) {
        console.warn('[BIMNova SW] Usuario no coincide.');
        return false;
    }

    const projectId = response.headers.get(
        'X-BIMNova-Project-Id'
    );

    if (!projectId) {
        console.warn('[BIMNova SW] Respuesta sin Project ID.');
        return false;
    }

    const blob = await response.clone().blob();

    const record = {
        key: buildFileKey(userId, url),
        userId: String(userId),
        projectId: String(projectId),
        url,
        blob,
        contentType: response.headers.get('Content-Type')
            || 'application/octet-stream',
        savedAt: Date.now()
    };

    await dbOperation(FILES_STORE, 'readwrite', store => {
        return store.put(record);
    });

    console.log('[BIMNova SW] FRAG almacenado:', {
        userId,
        projectId,
        url,
        size: blob.size
    });

    return true;
}

async function getFrag(userId, url) {
    if (!userId) return null;

    const key = buildFileKey(userId, url);
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            FILES_STORE,
            'readonly'
        );

        const request = transaction
            .objectStore(FILES_STORE)
            .get(key);

        request.onsuccess = () => {
            db.close();
            resolve(request.result ?? null);
        };

        request.onerror = () => {
            db.close();
            reject(request.error);
        };
    });
}

async function offlineResponse(userId, url) {
    const record = await getFrag(userId, url);

    if (!record) {
        return new Response(
            'Este modelo no está disponible sin conexión.',
            {
                status: 503,
                headers: {
                    'Content-Type': 'text/plain'
                }
            }
        );
    }

    return new Response(record.blob, {
        status: 200,
        headers: {
            'Content-Type': record.contentType,
            'X-BIMNova-Offline': '1',
            'Cache-Control': 'no-store'
        }
    });
}

// Contexto de usuario y administración de descargas.
self.addEventListener('message', event => {
    const data = event.data || {};

    if (data.type === 'SET_USER_CONTEXT') {
        event.waitUntil(
            setClientUser(event.source.id, data.userId)
                .then(() => {
                    event.ports?.[0]?.postMessage({
                        success: true
                    });
                })
        );
    }

    if (data.type === 'CLEAR_USER_CONTEXT') {
        event.waitUntil(
            clearUserData(String(data.userId))
                .then(() => {
                    event.ports?.[0]?.postMessage({
                        success: true
                    });
                })
        );
    }

    if (data.type === 'DELETE_PROJECT_DOWNLOAD') {
        event.waitUntil(
            deleteProjectFiles(
                String(data.userId),
                String(data.projectId)
            ).then(deleted => {
                event.ports?.[0]?.postMessage({
                    success: true,
                    deleted
                });
            })
        );
    }
});

async function clearUserData(userId) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            [FILES_STORE, CLIENTS_STORE],
            'readwrite'
        );

        const files = transaction.objectStore(FILES_STORE);
        const clients = transaction.objectStore(CLIENTS_STORE);

        const fileRequest = files.openCursor();

        fileRequest.onsuccess = () => {
            const cursor = fileRequest.result;

            if (!cursor) return;

            if (String(cursor.value.userId) === userId) {
                cursor.delete();
            }

            cursor.continue();
        };

        const clientRequest = clients.openCursor();

        clientRequest.onsuccess = () => {
            const cursor = clientRequest.result;

            if (!cursor) return;

            if (String(cursor.value.userId) === userId) {
                cursor.delete();
            }

            cursor.continue();
        };

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };

        transaction.onabort = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

/**
 * Elimina solamente los FRAG de un proyecto
 * pertenecientes al usuario indicado.
 */
async function deleteProjectFiles(userId, projectId) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            FILES_STORE,
            'readwrite'
        );

        const store = transaction.objectStore(FILES_STORE);
        const request = store.openCursor();

        let deleted = 0;

        request.onsuccess = () => {
            const cursor = request.result;

            if (!cursor) return;

            const record = cursor.value;

            if (
                String(record.userId) === userId &&
                String(record.projectId) === projectId
            ) {
                cursor.delete();
                deleted++;
            }

            cursor.continue();
        };

        transaction.oncomplete = () => {
            db.close();
            resolve(deleted);
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };

        transaction.onabort = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

// Interceptamos únicamente los archivos FRAG.
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;
    if (url.searchParams.get('type') !== 'frag') return;
    if (!/(?:^|\/)attachment\/\d+\/?$/.test(url.pathname)) return;

    event.respondWith((async () => {
        const userId = await getClientUser(event.clientId);

        // Solo se almacena cuando offline.js marca
        // expresamente la petición como descarga voluntaria.
        const explicitDownload =
            request.headers.get(DOWNLOAD_HEADER) === '1';

        // No enviamos el encabezado interno a Laravel.
        const headers = new Headers(request.headers);
        headers.delete(DOWNLOAD_HEADER);

        const networkRequest = new Request(request, {
            headers
        });

        try {
            const response = await fetch(networkRequest);

            if (!response.ok) {
                return response;
            }

            if (explicitDownload) {
                console.log(
                    '[BIMNova SW] Descarga offline solicitada:',
                    request.url
                );

                try {
                    await saveFrag(
                        userId,
                        request.url,
                        response
                    );
                } catch (error) {
                    console.error(
                        '[BIMNova SW] Error almacenando FRAG:',
                        error
                    );
                }
            }

            return response;

        } catch (error) {
            console.warn(
                '[BIMNova SW] Sin conexión. Buscando FRAG local:',
                request.url
            );

            return offlineResponse(userId, request.url);
        }
    })());
});
