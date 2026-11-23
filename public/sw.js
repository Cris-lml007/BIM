const DB_NAME = 'bimnova-offline';
const DB_VERSION = 2;

const FILES_STORE = 'files';
const CLIENTS_STORE = 'clients';
const PROJECTS_STORE = 'projects';

const DOWNLOAD_HEADER = 'X-BIMNova-Offline-Download';

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

/**
 * Abrir base de datos.
 * La actualización conserva los registros existentes.
 */
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

            if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
                db.createObjectStore(PROJECTS_STORE, {
                    keyPath: 'key'
                });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Operación genérica de IndexedDB.
 */
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

/**
 * Asociar una pestaña con un usuario.
 */
async function setClientUser(clientId, userId) {
    return dbOperation(CLIENTS_STORE, 'readwrite', store => {
        return store.put({
            clientId,
            userId: String(userId)
        });
    });
}

/**
 * Obtener usuario asociado a una pestaña.
 */
async function getClientUser(clientId) {
    if (!clientId) return null;

    return dbOperation(CLIENTS_STORE, 'readonly', store => {
        return store.get(clientId);
    }).then(record => record?.userId ?? null);
}

/**
 * Construir clave única de archivo.
 */
function buildFileKey(userId, url) {
    return `${userId}::${url}`;
}

/**
 * Almacenar un FRAG únicamente cuando la descarga
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

/**
 * Consultar un FRAG almacenado.
 */
async function getFrag(userId, url) {
    if (!userId) return null;

    const key = buildFileKey(userId, url);

    return dbOperation(FILES_STORE, 'readonly', store => {
        return store.get(key);
    });
}

/**
 * Responder con un FRAG local.
 */
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

/* =====================================================
   GESTIÓN DE PROYECTOS OFFLINE
===================================================== */

/**
 * Guardar manifiesto de un proyecto.
 */
async function saveProject(userId, project) {
    if (!userId || !project?.project?.id) {
        throw new Error('Datos del proyecto inválidos.');
    }

    const projectId = String(project.project.id);

    const existing = await getProject(userId, projectId);

    const record = {
        key: `${userId}::${projectId}`,
        userId: String(userId),
        projectId,
        name: project.project.name,
        manifest: project,
        status: project.status || 'downloading',
        downloadedAt: existing?.downloadedAt || null,
        updatedAt: Date.now()
    };

    await dbOperation(PROJECTS_STORE, 'readwrite', store => {
        return store.put(record);
    });

    console.log('[BIMNova SW] Proyecto registrado:', {
        userId,
        projectId,
        name: record.name
    });

    return record;
}

/**
 * Obtener un proyecto específico.
 */
async function getProject(userId, projectId) {
    const key = `${userId}::${projectId}`;

    return dbOperation(PROJECTS_STORE, 'readonly', store => {
        return store.get(key);
    });
}

/**
 * Obtener proyectos descargados de un usuario.
 */
async function getUserProjects(userId) {
    const records = await dbOperation(
        PROJECTS_STORE,
        'readonly',
        store => store.getAll()
    );

    return records.filter(
        project => String(project.userId) === String(userId)
    );
}

/**
 * Actualizar estado de un proyecto.
 */
async function updateProjectStatus(userId, projectId, status) {
    const record = await getProject(userId, projectId);

    if (!record) {
        return false;
    }

    record.status = status;
    record.updatedAt = Date.now();

    if (status === 'downloaded') {
        record.downloadedAt = Date.now();
    }

    if (status !== 'downloaded') {
        record.downloadedAt = null;
    }

    await dbOperation(PROJECTS_STORE, 'readwrite', store => {
        return store.put(record);
    });

    console.log('[BIMNova SW] Estado actualizado:', {
        projectId,
        status
    });

    return true;
}

/**
 * Eliminar metadatos de un proyecto.
 */
async function deleteProjectMetadata(userId, projectId) {
    const key = `${userId}::${projectId}`;

    await dbOperation(PROJECTS_STORE, 'readwrite', store => {
        return store.delete(key);
    });
}

/**
 * Eliminar todos los proyectos de un usuario.
 */
async function deleteUserProjects(userId) {
    const projects = await getUserProjects(userId);

    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            PROJECTS_STORE,
            'readwrite'
        );

        const store = transaction.objectStore(PROJECTS_STORE);

        for (const project of projects) {
            store.delete(project.key);
        }

        transaction.oncomplete = () => {
            db.close();
            resolve(projects.length);
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

/* =====================================================
   ELIMINACIÓN DE DESCARGAS
===================================================== */

/**
 * Eliminar todos los datos offline de un usuario.
 */
async function clearUserData(userId) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            [FILES_STORE, CLIENTS_STORE, PROJECTS_STORE],
            'readwrite'
        );

        const files = transaction.objectStore(FILES_STORE);
        const clients = transaction.objectStore(CLIENTS_STORE);
        const projects = transaction.objectStore(PROJECTS_STORE);

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

        const projectRequest = projects.openCursor();

        projectRequest.onsuccess = () => {
            const cursor = projectRequest.result;

            if (!cursor) return;

            if (String(cursor.value.userId) === userId) {
                cursor.delete();
            }

            cursor.continue();
        };

        transaction.oncomplete = () => {
            db.close();

            console.log(
                '[BIMNova SW] Datos offline eliminados:',
                userId
            );

            resolve(true);
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
 * Eliminar solamente los FRAG de un proyecto
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

/**
 * Eliminar descarga completa de un proyecto.
 */
async function deleteProjectDownload(userId, projectId) {
    const deleted = await deleteProjectFiles(
        userId,
        projectId
    );

    await deleteProjectMetadata(userId, projectId);

    console.log('[BIMNova SW] Proyecto eliminado:', {
        userId,
        projectId,
        deletedFiles: deleted
    });

    return deleted;
}

/* =====================================================
   COMUNICACIÓN CON OFFLINE.JS
===================================================== */

self.addEventListener('message', event => {
    const data = event.data || {};

    const respond = async () => {

        try {

            let result;

            switch (data.type) {

                case 'SET_USER_CONTEXT': {
                    await setClientUser(
                        event.source.id,
                        data.userId
                    );

                    result = {
                        success: true
                    };

                    break;
                }

                case 'CLEAR_USER_CONTEXT': {
                    await clearUserData(
                        String(data.userId)
                    );

                    result = {
                        success: true
                    };

                    break;
                }

                case 'DELETE_PROJECT_DOWNLOAD': {
                    const deleted = await deleteProjectDownload(
                        String(data.userId),
                        String(data.projectId)
                    );

                    result = {
                        success: true,
                        deleted
                    };

                    break;
                }

                case 'SAVE_PROJECT': {
                    const project = await saveProject(
                        String(data.userId),
                        data.project
                    );

                    result = {
                        success: true,
                        project
                    };

                    break;
                }

                case 'GET_USER_PROJECTS': {
                    const projects = await getUserProjects(
                        String(data.userId)
                    );

                    result = {
                        success: true,
                        projects
                    };

                    break;
                }

                case 'UPDATE_PROJECT_STATUS': {
                    const updated = await updateProjectStatus(
                        String(data.userId),
                        String(data.projectId),
                        data.status
                    );

                    result = {
                        success: updated
                    };

                    break;
                }

                default: {
                    result = {
                        success: false,
                        error: 'Operación desconocida.'
                    };
                }
            }

            event.ports?.[0]?.postMessage(result);

        } catch (error) {

            console.error(
                '[BIMNova SW] Error procesando mensaje:',
                error
            );

            event.ports?.[0]?.postMessage({
                success: false,
                error: error.message
            });
        }
    };

    event.waitUntil(respond());
});

/* =====================================================
   INTERCEPTAR ARCHIVOS FRAG
===================================================== */

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;
    if (url.searchParams.get('type') !== 'frag') return;
    if (!/(?:^|\/)attachment\/\d+\/?$/.test(url.pathname)) return;

    event.respondWith((async () => {

        const userId = await getClientUser(event.clientId);

        const explicitDownload =
            request.headers.get(DOWNLOAD_HEADER) === '1';

        // No enviar la cabecera interna a Laravel.
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

                    const saved = await saveFrag(
                        userId,
                        request.url,
                        response
                    );

                    // Informar al cliente si realmente se guardó.
                    const responseHeaders = new Headers(
                        response.headers
                    );

                    responseHeaders.set(
                        'X-BIMNova-Offline-Saved',
                        saved ? '1' : '0'
                    );

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: responseHeaders
                    });

                } catch (error) {

                    console.error(
                        '[BIMNova SW] Error almacenando FRAG:',
                        error
                    );

                    const responseHeaders = new Headers(
                        response.headers
                    );

                    responseHeaders.set(
                        'X-BIMNova-Offline-Saved',
                        '0'
                    );

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: responseHeaders
                    });
                }
            }

            return response;

        } catch (error) {

            console.warn(
                '[BIMNova SW] Sin conexión. Buscando FRAG local:',
                request.url
            );

            return offlineResponse(
                userId,
                request.url
            );
        }
    })());
});
