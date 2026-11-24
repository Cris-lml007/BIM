const BIMNovaOffline = (() => {

    let registration = null;

    function getUserId() {
        return document
            .querySelector('meta[name="bimnova-user-id"]')
            ?.content || null;
    }

    function sendMessage(type, data = {}) {
        return new Promise((resolve, reject) => {

            const controller = navigator.serviceWorker.controller;

            if (!controller) {
                reject(new Error(
                    'Service Worker todavía no controla esta página.'
                ));
                return;
            }

            const channel = new MessageChannel();

            channel.port1.onmessage = event => {
                channel.port1.close();
                resolve(event.data);
            };

            channel.port1.onmessageerror = () => {
                channel.port1.close();
                reject(new Error(
                    'No se pudo recibir la respuesta del Service Worker.'
                ));
            };

            controller.postMessage(
                { type, ...data },
                [channel.port2]
            );
        });
    }

    async function init() {

        if (!('serviceWorker' in navigator)) {
            console.warn(
                'Este navegador no soporta Service Worker.'
            );
            return false;
        }

        if (!window.isSecureContext) {
            console.warn(
                'La PWA necesita HTTPS o localhost.'
            );
            return false;
        }

        try {

            registration = await navigator.serviceWorker.register(
                '/sw.js',
                { scope: '/' }
            );

            await navigator.serviceWorker.ready;

            if (!navigator.serviceWorker.controller) {
                await new Promise(resolve => {
                    navigator.serviceWorker.addEventListener(
                        'controllerchange',
                        resolve,
                        { once: true }
                    );
                });
            }

            const userId = getUserId();

            if (userId) {
                await sendMessage('SET_USER_CONTEXT', {
                    userId
                });
            }

            console.info(
                'BIMNova Offline: inicializado.'
            );

            return true;

        } catch (error) {

            console.error(
                'Error inicializando BIMNova Offline:',
                error
            );

            return false;
        }
    }

    /**
     * Descargar archivos FRAG explícitamente.
     */
    async function downloadFiles(urls, onProgress = null) {

        if (!Array.isArray(urls) || !urls.length) {
            throw new Error(
                'No hay archivos para descargar.'
            );
        }

        if (!navigator.serviceWorker.controller) {
            throw new Error(
                'El Service Worker todavía no está activo.'
            );
        }

        const results = [];

        for (let index = 0; index < urls.length; index++) {

            const url = urls[index];

            let result;

            try {

                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'X-BIMNova-Offline-Download': '1'
                    }
                });

                if (!response.ok) {
                    throw new Error(
                        `Error HTTP ${response.status}: ${url}`
                    );
                }
                if (
                    response.headers.get('X-BIMNova-Offline-Saved') !== '1'
                ) {
                    throw new Error(
                        `El FRAG respondió correctamente, pero no pudo guardarse offline: ${url}`
                    );
                }

                await response.arrayBuffer();

                result = {
                    url,
                    success: true
                };

            } catch (error) {

                result = {
                    url,
                    success: false,
                    error: error.message
                };

                console.error(
                    `Error descargando ${url}:`,
                    error
                );
            }

            results.push(result);

            if (typeof onProgress === 'function') {
                onProgress({
                    current: index + 1,
                    total: urls.length,
                    percentage: Math.round(
                        ((index + 1) / urls.length) * 100
                    ),
                    url,
                    result
                });
            }
        }

        return results;
    }

    /**
     * Guardar el manifiesto de un proyecto en IndexedDB.
     */
    async function saveProjectManifest(manifest, status = 'downloading') {

        const userId = getUserId();

        const result = await sendMessage('SAVE_PROJECT', {
            userId,
            project: {
                ...manifest,
                status
            }
        });

        if (!result?.success) {
            throw new Error(
                'No se pudo guardar el proyecto en IndexedDB.'
            );
        }

        return result.project;
    }

    /**
     * Actualizar estado del proyecto.
     */
    async function updateProjectStatus(projectId, status) {

        const userId = getUserId();

        const result = await sendMessage(
            'UPDATE_PROJECT_STATUS',
            {
                userId,
                projectId: String(projectId),
                status
            }
        );

        if (!result?.success) {
            throw new Error(
                'No se pudo actualizar el estado del proyecto.'
            );
        }

        return true;
    }

    /**
     * Descargar un proyecto completo.
     */
    async function downloadProject(projectId, onProgress = null) {

        const userId = getUserId();

        if (!userId) {
            throw new Error(
                'No se pudo identificar al usuario autenticado.'
            );
        }

        if (!navigator.onLine) {
            throw new Error(
                'Necesitas conexión a Internet para descargar el proyecto.'
            );
        }

        if (!navigator.serviceWorker.controller) {
            throw new Error(
                'El Service Worker todavía no está activo.'
            );
        }

        const endpoint =
            `/dashboard/offline/projects/${encodeURIComponent(projectId)}`;

        try {

            // 1. Obtener manifiesto del proyecto.
            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(
                    `No se pudo obtener el proyecto: HTTP ${response.status}`
                );
            }

            const manifest = await response.json();

            if (!manifest.success || !manifest.project) {
                throw new Error(
                    'La respuesta del servidor no contiene un proyecto válido.'
                );
            }

            const projectIdFromServer = String(
                manifest.project.id
            );

            // 2. Identificar los FRAG disponibles.
            const modelsWithFrag = (manifest.models || [])
                .filter(model => model.frag?.url);

            const urls = modelsWithFrag.map(
                model => model.frag.url
            );

            // 3. Guardar manifiesto con estado downloading.
            await saveProjectManifest(
                manifest,
                'downloading'
            );

            // 4. Descargar todos los FRAG.
            let results = [];

            if (urls.length) {

                results = await downloadFiles(
                    urls,
                    progress => {

                        if (typeof onProgress === 'function') {
                            onProgress({
                                phase: 'files',
                                project: manifest.project,
                                current: progress.current,
                                total: progress.total,
                                percentage: progress.percentage,
                                url: progress.url,
                                result: progress.result
                            });
                        }
                    }
                );
            }

            const successful = results.filter(
                result => result.success
            ).length;

            const failed = results.filter(
                result => !result.success
            );

            // 5. Actualizar estado según el resultado.
            const allDownloaded = failed.length === 0;

            await updateProjectStatus(
                projectIdFromServer,
                allDownloaded ? 'downloaded' : 'partial'
            );

            const summary = {
                success: allDownloaded,
                project: manifest.project,
                total: urls.length,
                downloaded: successful,
                failed: failed.length,
                results
            };

            if (typeof onProgress === 'function') {
                onProgress({
                    phase: 'completed',
                    project: manifest.project,
                    percentage: 100,
                    summary
                });
            }

            return summary;

        } catch (error) {

            console.error(
                'Error descargando proyecto offline:',
                error
            );

            throw error;
        }
    }

    /**
     * Consultar proyectos guardados offline.
     */
    async function getProjects() {

        const userId = getUserId();

        if (!userId) {
            throw new Error(
                'No se pudo identificar al usuario.'
            );
        }

        const result = await sendMessage(
            'GET_USER_PROJECTS',
            { userId }
        );

        if (!result?.success) {
            throw new Error(
                'No se pudieron consultar los proyectos offline.'
            );
        }

        return result.projects || [];
    }

    /**
     * Eliminar descarga de un proyecto.
     */
    async function deleteProjectDownload(projectId) {

        const userId = getUserId();

        if (!userId) {
            throw new Error(
                'No se pudo identificar al usuario.'
            );
        }

        const result = await sendMessage(
            'DELETE_PROJECT_DOWNLOAD',
            {
                userId,
                projectId: String(projectId)
            }
        );

        return result;
    }

    /**
     * Eliminar todos los datos offline del usuario.
     */
    async function clearCurrentUser() {

        const userId = getUserId();

        if (!userId || !navigator.serviceWorker.controller) {
            return false;
        }

        await sendMessage('CLEAR_USER_CONTEXT', {
            userId
        });

        return true;
    }

    return {
        init,
        downloadFiles,
        downloadProject,
        getProjects,
        deleteProjectDownload,
        clearCurrentUser,

        get registration() {
            return registration;
        },

        get userId() {
            return getUserId();
        }
    };

})();

window.BIMNovaOffline = BIMNovaOffline;

BIMNovaOffline.init();

window.addEventListener('online', () => {
    window.dispatchEvent(
        new CustomEvent('bimnova:online')
    );
});

window.addEventListener('offline', () => {
    window.dispatchEvent(
        new CustomEvent('bimnova:offline')
    );
});
