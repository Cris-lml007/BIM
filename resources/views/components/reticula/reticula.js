let activeInstance = null;

function initializeThreeCubes() {
    const container = document.getElementById('three-cubes-viewer');

    if (!container || container.dataset.initialized === 'true') {
        return;
    }

    container.dataset.initialized = 'true';

    const startButton = document.getElementById('start-ar');
    const clearButton = document.getElementById('clear-cubes');
    const statusElement = document.getElementById('ar-status');
    const countElement = document.getElementById('cube-count');
    const helpElement = document.getElementById('ar-help');

    // --------------------------------------------------
    // ESCENA
    // --------------------------------------------------

    const scene = new THREE.Scene();

    // Cámara transparente en AR: el entorno real se muestra
    // a través del sistema WebXR del dispositivo.
    scene.background = new THREE.Color(0xe2e8f0);

    const camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        100
    );

    // --------------------------------------------------
    // RENDERER
    // --------------------------------------------------

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);

renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local');

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

container.appendChild(renderer.domElement);

    // --------------------------------------------------
    // ILUMINACIÓN
    // --------------------------------------------------

    scene.add(
        new THREE.HemisphereLight(0xffffff, 0x8899aa, 2)
    );

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 6, 4);
    scene.add(light);

    // --------------------------------------------------
    // RETÍCULO
    // --------------------------------------------------

    const reticle = new THREE.Group();

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.07, 0.09, 40),
        new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            side: THREE.DoubleSide,
            depthTest: false
        })
    );

    ring.rotation.x = -Math.PI / 2;
    reticle.add(ring);

    const center = new THREE.Mesh(
        new THREE.CircleGeometry(0.012, 24),
        new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            side: THREE.DoubleSide,
            depthTest: false
        })
    );

    center.rotation.x = -Math.PI / 2;
    center.position.y = 0.001;
    reticle.add(center);

    // La matriz viene directamente de la pose detectada por WebXR.
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;

    scene.add(reticle);

    // --------------------------------------------------
    // CUBOS
    // --------------------------------------------------

    const cubes = [];
    const cubeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);

    function updateCount() {
        countElement.textContent = String(cubes.length);
    }

    function createCubeAt(matrix) {
        const cube = new THREE.Mesh(
            cubeGeometry,
            new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(
                    Math.random(),
                    0.75,
                    0.55
                ),
                roughness: 0.7
            })
        );

        // El cubo se coloca sobre la superficie detectada.
        // La matriz del retículo define posición y orientación.
        const poseMatrix = new THREE.Matrix4().fromArray(matrix);

        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        poseMatrix.decompose(position, quaternion, scale);

        cube.position.copy(position);
        cube.quaternion.copy(quaternion);

        // Elevar media altura para que repose sobre el plano.
        const up = new THREE.Vector3(0, 1, 0)
            .applyQuaternion(quaternion);

        cube.position.addScaledVector(up, 0.075);

        cube.userData.baseY = cube.position.y;

        scene.add(cube);
        cubes.push(cube);

        updateCount();

        console.log('[AR] Cubo colocado', {
            x: cube.position.x,
            y: cube.position.y,
            z: cube.position.z
        });
    }

    function clearCubes() {
        for (const cube of cubes) {
            scene.remove(cube);
            cube.material.dispose();
        }

        cubes.length = 0;
        updateCount();
    }

    clearButton.addEventListener('click', clearCubes);

    // --------------------------------------------------
    // HIT TEST
    // --------------------------------------------------

    let hitTestSource = null;
    let hitTestRequested = false;
    let hasHit = false;
    let currentHitMatrix = null;
    let session = null;
    let disposed = false;

    async function requestHitTestSource(xrSession) {
        if (hitTestRequested) return;

        hitTestRequested = true;

        try {
            const viewerSpace = await xrSession.requestReferenceSpace('viewer');

            // Puede finalizar la sesión mientras esperamos el resultado.
            if (disposed || renderer.xr.getSession() !== xrSession) {
                return;
            }

            hitTestSource = await xrSession.requestHitTestSource({
                space: viewerSpace
            });

            if (disposed || renderer.xr.getSession() !== xrSession) {
                hitTestSource?.cancel();
                hitTestSource = null;
                return;
            }

            console.log('[AR] Hit Test inicializado');
            statusElement.textContent = 'AR activo — buscando superficies';
        } catch (error) {
            console.error('[AR] No se pudo inicializar Hit Test:', error);
            statusElement.textContent = 'Error al inicializar Hit Test';
        }
    }

    // --------------------------------------------------
    // INICIAR Y TERMINAR AR
    // --------------------------------------------------

    async function startAR() {
        if (!navigator.xr) {
            statusElement.textContent = 'WebXR no está disponible';
            helpElement.textContent =
                'Usa un navegador y dispositivo compatibles y accede mediante HTTPS.';
            return;
        }

        try {
            const supported = await navigator.xr.isSessionSupported(
                'immersive-ar'
            );

            if (!supported) {
                statusElement.textContent = 'AR no compatible';
                helpElement.textContent =
                    'Este dispositivo o navegador no admite immersive-ar.';
                return;
            }

            // La sesión se solicita desde el clic del usuario.
            const xrSession = await navigator.xr.requestSession(
                'immersive-ar',
                {
                    requiredFeatures: ['hit-test'],
                    optionalFeatures: ['dom-overlay'],
                    domOverlay: { root: container }
                }
            );

            await renderer.xr.setSession(xrSession);

            console.log('[AR] Sesión iniciada');

            statusElement.textContent = 'AR activo — buscando superficies';
            helpElement.textContent =
                'Mueve el dispositivo lentamente para detectar una superficie.';

        } catch (error) {
            console.error('[AR] Error al iniciar:', error);

            statusElement.textContent = 'No se pudo iniciar AR';
            helpElement.textContent = error.message;
        }
    }

    startButton.addEventListener('click', startAR);

    renderer.xr.addEventListener('sessionstart', () => {
        session = renderer.xr.getSession();

        hasHit = false;
        currentHitMatrix = null;
        hitTestSource = null;
        hitTestRequested = false;
        reticle.visible = false;

        if (session) {
            session.addEventListener('select', onSelect);

            session.addEventListener('end', () => {
                hitTestSource?.cancel();

                hitTestSource = null;
                hitTestRequested = false;
                hasHit = false;
                currentHitMatrix = null;
                reticle.visible = false;
                session = null;

                statusElement.textContent = 'Modo normal';
                helpElement.textContent = 'Pulsa «Iniciar AR» para comenzar.';
            }, { once: true });

            requestHitTestSource(session);
        }
    });

    function onSelect() {
        if (!hasHit || !currentHitMatrix) {
            console.log('[AR] Todavía no hay una superficie detectada');
            return;
        }

        createCubeAt(currentHitMatrix);
    }

    // --------------------------------------------------
    // BUCLE DE ANIMACIÓN
    // --------------------------------------------------

    renderer.setAnimationLoop((timestamp, frame) => {
        // Todas las consultas a XRFrame se ejecutan de forma
        // síncrona dentro del callback actual.
        if (frame && session && hitTestSource) {
            const referenceSpace = renderer.xr.getReferenceSpace();

            if (referenceSpace) {
                const results = frame.getHitTestResults(hitTestSource);

                hasHit = false;
                currentHitMatrix = null;
                reticle.visible = false;

                if (results.length > 0) {
                    const pose = results[0].getPose(referenceSpace);

                    if (pose) {
                        currentHitMatrix = Array.from(
                            pose.transform.matrix
                        );

                        reticle.matrix.fromArray(currentHitMatrix);
                        reticle.matrixWorldNeedsUpdate = true;
                        reticle.visible = true;
                        hasHit = true;

                        statusElement.textContent = 'Superficie detectada';
                        helpElement.textContent =
                            'Toca la pantalla para colocar un cubo.';
                    }
                }

                if (!hasHit) {
                    statusElement.textContent = 'Buscando superficies…';
                    helpElement.textContent =
                        'Mueve el dispositivo lentamente sobre el suelo o una mesa.';
                }
            }
        }

        renderer.render(scene, camera);
    });

    // --------------------------------------------------
    // RESPONSIVE
    // --------------------------------------------------

    function resize() {
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (!width || !height) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // --------------------------------------------------
    // LIMPIEZA
    // --------------------------------------------------

    function destroy() {
        disposed = true;

        const currentSession = renderer.xr.getSession();

        if (currentSession) {
            currentSession.end().catch(console.error);
        }

        hitTestSource?.cancel();
        renderer.setAnimationLoop(null);

        startButton.removeEventListener('click', startAR);
        clearButton.removeEventListener('click', clearCubes);

        resizeObserver.disconnect();
        clearCubes();

        scene.remove(reticle);
        ring.geometry.dispose();
        ring.material.dispose();
        center.geometry.dispose();
        center.material.dispose();
        cubeGeometry.dispose();

        renderer.dispose();
        renderer.domElement.remove();

        delete container.dataset.initialized;
    }

    activeInstance = { destroy };
}

// --------------------------------------------------
// INICIALIZACIÓN LIVEWIRE
// --------------------------------------------------

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThreeCubes, {
        once: true
    });
} else {
    initializeThreeCubes();
}

document.addEventListener('livewire:navigated', initializeThreeCubes);

document.addEventListener('livewire:navigating', () => {
    activeInstance?.destroy();
    activeInstance = null;
});
