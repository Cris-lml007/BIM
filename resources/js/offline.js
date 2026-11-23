const BIMNovaOffline = (() => {

    let registration = null;

    /**
     * Obtener el ID del usuario autenticado.
     */
    function getUserId() {
        return document
            .querySelector('meta[name="bimnova-user-id"]')
            ?.content || null;
    }

    /**
     * Enviar mensajes al Service Worker.
     */
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

            controller.postMessage(
                { type, ...data },
                [channel.port2]
            );
        });
    }

    /**
     * Inicializar el sistema offline.
     */
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
     * Descargar archivos explícitamente para uso offline.
     *
     * El Service Worker solamente almacenará los archivos
     * que reciban la cabecera X-BIMNova-Offline-Download.
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
                        `No se pudo descargar ${url}: ${response.status}`
                    );
                }

                // Consumir completamente la respuesta.
                // El Service Worker almacena su propia copia.
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
                    url,
                    result
                });
            }
        }

        return results;
    }

    /**
     * Eliminar la descarga offline de un proyecto.
     */
    async function deleteProjectDownload(projectId) {

        const userId = getUserId();

        if (!userId) {
            throw new Error(
                'No se pudo identificar al usuario.'
            );
        }

        if (!navigator.serviceWorker.controller) {
            throw new Error(
                'El Service Worker todavía no está activo.'
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
     * Eliminar todos los archivos offline del usuario.
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

/**
 * Eventos de conectividad.
 */
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
