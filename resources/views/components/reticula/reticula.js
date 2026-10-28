// =====================================================
// ESTADO
// =====================================================

let activeInstance = null;

function initializeArCubes() {

    const container = document.getElementById('ar-cubes-viewer');

    if (!container || container.dataset.initialized === 'true') {
        return;
    }

    container.dataset.initialized = 'true';

    const startButton   = document.getElementById('start-ar');
    const clearButton   = document.getElementById('clear-cubes');
    const exitButton    = document.getElementById('exit-ar');
    const overlay       = document.getElementById('ar-overlay');
    const statusElement = document.getElementById('ar-status');
    const countElement  = document.getElementById('cube-count');
    const helpElement   = document.getElementById('ar-help');

    const NORMAL_BACKGROUND = new THREE.Color(0xe2e8f0);

    // =================================================
    // ESCENA
    // =================================================

    const scene = new THREE.Scene();

    // Fondo SOLO para el modo normal (fuera de AR).
    // Al entrar en AR se pone en null para que el
    // feed de la cámara sea visible.
    scene.background = NORMAL_BACKGROUND;

    const camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        100
    );

    // =================================================
    // RENDERER
    // =================================================

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');

    container.appendChild(renderer.domElement);

    // =================================================
    // LUCES
    // =================================================

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 2));

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(3, 6, 4);
    scene.add(dirLight);

    // =================================================
    // RETÍCULO
    // =================================================

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

    const centerDot = new THREE.Mesh(
        new THREE.CircleGeometry(0.012, 24),
        new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            side: THREE.DoubleSide,
            depthTest: false
        })
    );
    centerDot.rotation.x = -Math.PI / 2;
    centerDot.position.y = 0.001;
    reticle.add(centerDot);

    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // =================================================
    // CUBOS
    // =================================================

    const cubes = [];
    const cubeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);

    function updateCount() {
        countElement.textContent = String(cubes.length);
    }

    function createCubeAt(matrixArray) {

        const cube = new THREE.Mesh(
            cubeGeometry,
            new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.75, 0.55),
                roughness: 0.7
            })
        );

        const poseMatrix = new THREE.Matrix4().fromArray(matrixArray);

        const position   = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scaleVec   = new THREE.Vector3();

        poseMatrix.decompose(position, quaternion, scaleVec);

        cube.position.copy(position);
        cube.quaternion.copy(quaternion);

        // Elevar media altura para que repose sobre el plano
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
        cube.position.addScaledVector(up, 0.075);

        scene.add(cube);
        cubes.push(cube);

        updateCount();

        console.log('[AR] Cubo colocado en:', cube.position);
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

    // =================================================
    // HIT TEST — estado
    // =================================================

    let session = null;
    let hitTestSource = null;
    let hitTestRequested = false;
    let hasHit = false;
    let currentHitMatrix = null;
    let disposed = false;

    async function requestHitTestSource(xrSession) {
        if (hitTestRequested) return;
        hitTestRequested = true;

        try {
            const viewerSpace = await xrSession.requestReferenceSpace('viewer');

            if (disposed || renderer.xr.getSession() !== xrSession) return;

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

    // =================================================
    // INICIAR AR
    // =================================================

    async function startAR() {

        if (!navigator.xr) {
            statusElement.textContent = 'WebXR no disponible';
            alert('WebXR no está disponible. Usa Chrome Android con HTTPS.');
            return;
        }

        try {
            const supported = await navigator.xr.isSessionSupported('immersive-ar');

            if (!supported) {
                alert('Este dispositivo o navegador no admite immersive-ar.');
                return;
            }

            const xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                // ⚠️ CLAVE: el overlay root es el div dedicado,
                // transparente y SIN el canvas adentro.
                domOverlay: { root: overlay }
            });

            await renderer.xr.setSession(xrSession);

            console.log('[AR] Sesión iniciada');

        } catch (error) {
            console.error('[AR] Error al iniciar:', error);
            alert('No se pudo iniciar AR: ' + error.message);
        }
    }

    startButton.addEventListener('click', startAR);

    exitButton.addEventListener('click', () => {
        renderer.xr.getSession()?.end();
    });

    // =================================================
    // SESSION START / END
    // =================================================

    renderer.xr.addEventListener('sessionstart', () => {

        // ⚠️ CLAVE: fondo transparente para ver la cámara real
        scene.background = null;

        session = renderer.xr.getSession();

        hasHit = false;
        currentHitMatrix = null;
        hitTestSource = null;
        hitTestRequested = false;
        reticle.visible = false;

        overlay.style.display = 'block';

        statusElement.textContent = 'AR activo — buscando superficies';
        helpElement.textContent =
            'Mueve el dispositivo lentamente sobre el suelo o una mesa.';

        if (session) {
            session.addEventListener('select', onSelect);

            session.addEventListener('end', () => {

                // Restaurar fondo del modo normal
                scene.background = NORMAL_BACKGROUND;

                hitTestSource?.cancel();
                hitTestSource = null;
                hitTestRequested = false;
                hasHit = false;
                currentHitMatrix = null;
                reticle.visible = false;
                session = null;

                overlay.style.display = 'none';

                statusElement.textContent = 'Modo normal';

            }, { once: true });

            requestHitTestSource(session);
        }
    });

    function onSelect() {
        if (!hasHit || !currentHitMatrix) {
            console.log('[AR] Todavía no hay superficie detectada');
            return;
        }
        createCubeAt(currentHitMatrix);
    }

    // =================================================
    // LOOP DE RENDER
    // =================================================

    renderer.setAnimationLoop((timestamp, frame) => {

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
                        currentHitMatrix = Array.from(pose.transform.matrix);

                        reticle.matrix.fromArray(currentHitMatrix);
                        reticle.matrixWorldNeedsUpdate = true;
                        reticle.visible = true;
                        hasHit = true;

                        statusElement.textContent = 'Superficie detectada ✅';
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

    // =================================================
    // RESPONSIVE
    // =================================================

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

    // =================================================
    // LIMPIEZA (Livewire navigation)
    // =================================================

    function destroy() {
        disposed = true;

        renderer.xr.getSession()?.end().catch(() => {});

        hitTestSource?.cancel();
        renderer.setAnimationLoop(null);

        startButton.removeEventListener('click', startAR);
        clearButton.removeEventListener('click', clearCubes);

        resizeObserver.disconnect();
        clearCubes();

        scene.remove(reticle);
        ring.geometry.dispose();
        ring.material.dispose();
        centerDot.geometry.dispose();
        centerDot.material.dispose();
        cubeGeometry.dispose();

        renderer.dispose();
        renderer.domElement.remove();

        delete container.dataset.initialized;
    }

    activeInstance = { destroy };
}

// =====================================================
// BOOTSTRAP (compatible con Livewire)
// =====================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeArCubes, { once: true });
} else {
    initializeArCubes();
}

document.addEventListener('livewire:navigated', initializeArCubes);

document.addEventListener('livewire:navigating', () => {
    activeInstance?.destroy();
    activeInstance = null;
});
