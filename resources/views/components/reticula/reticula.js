// ======================================================
// TEST AR: CUBOS SOBRE SUPERFICIES (WebXR + Three.js)
// ------------------------------------------------------
// Claves de esta versión (bugs corregidos del test previo):
// 1. Overlay root separado y transparente (no tapa la cámara)
// 2. scene.background = null durante la sesión AR
// 3. Default reference space ('local-floor'), igual que la app principal
// ======================================================

let activeInstance = null;

function initializeArCubes() {

    const container = document.getElementById('ar-cubes-viewer');

    if (!container || container.dataset.initialized === 'true') {
        return;
    }

    container.dataset.initialized = 'true';

    // --------------------------------------------------
    // DOM
    // --------------------------------------------------

    const overlayRoot = document.getElementById('ar-cubes-overlay');

    const startBtn  = document.getElementById('ar-cubes-start');
    const exitBtn   = document.getElementById('ar-cubes-exit');
    const frontBtn  = document.getElementById('ar-cubes-front');
    const originBtn = document.getElementById('ar-cubes-origin');
    const clearBtn  = document.getElementById('ar-cubes-clear');

    const statusEl = document.getElementById('ar-cubes-status');
    const countEl  = document.getElementById('ar-cubes-count');
    const helpEl   = document.getElementById('ar-cubes-help');
    const logEl    = document.getElementById('ar-cubes-log');

    // --------------------------------------------------
    // ESCENA
    // --------------------------------------------------

    const scene = new THREE.Scene();

    // En escritorio: fondo sólido. En AR se cambia a null
    // (OBLIGATORIO para ver el feed de la cámara real).
    const DESKTOP_BG = new THREE.Color(0xe2e8f0);
    scene.background = DESKTOP_BG;

    const camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        100
    );

    camera.position.set(0, 1.6, 3);
    camera.lookAt(0, 0.8, 0);

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
    // NOTA: NO se llama a setReferenceSpaceType → default 'local-floor',
    // igual que la app principal.

    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 2));

    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(3, 6, 4);
    scene.add(sun);

    // --------------------------------------------------
    // RETÍCULO (depthTest: false → siempre visible)
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

    const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.012, 24),
        new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            side: THREE.DoubleSide,
            depthTest: false
        })
    );
    dot.rotation.x = -Math.PI / 2;
    dot.position.y = 0.001;
    reticle.add(dot);

    reticle.matrixAutoUpdate = false;
    reticle.renderOrder = 999;
    reticle.visible = false;
    scene.add(reticle);

    // --------------------------------------------------
    // CUBOS
    // --------------------------------------------------

    const cubeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const cubes = [];

    function updateCount() {
        if (countEl) countEl.textContent = String(cubes.length);
    }

    function addCube(position, quaternion = null) {
        const color = new THREE.Color().setHSL(Math.random(), 0.75, 0.55);

        const material = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.7,
            emissive: color,        // visible aunque fallen las luces
            emissiveIntensity: 0.35
        });

        const cube = new THREE.Mesh(cubeGeometry, material);
        cube.position.copy(position);
        if (quaternion) cube.quaternion.copy(quaternion);

        scene.add(cube);
        cubes.push(cube);
        updateCount();

        log(`Cubo en (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
    }

    function clearCubes() {
        for (const cube of cubes) {
            scene.remove(cube);
            cube.material.dispose();
        }
        cubes.length = 0;
        updateCount();
        log('Cubos eliminados');
    }

    // --------------------------------------------------
    // LOG EN PANTALLA (últimas 5 líneas)
    // --------------------------------------------------

    const logLines = [];

    function log(message) {
        console.log('[AR Cubes]', message);
        logLines.push(`• ${message}`);
        while (logLines.length > 5) logLines.shift();
        if (logEl) logEl.innerHTML = logLines.map(l => `<div>${l}</div>`).join('');
    }

    let lastStatus = '';

    function setStatus(text) {
        if (text === lastStatus) return;
        lastStatus = text;
        if (statusEl) statusEl.textContent = text;
    }

    function setHelp(text) {
        if (helpEl) helpEl.textContent = text;
    }

    // --------------------------------------------------
    // HIT TEST
    // --------------------------------------------------

    let hitTestSource = null;
    let hitTestRequested = false;
    let hasHit = false;
    let currentHitMatrix = null;
    let everDetected = false;
    let disposed = false;

    async function requestHitTest(session) {
        if (hitTestRequested) return;
        hitTestRequested = true;

        try {
            const viewerSpace = await session.requestReferenceSpace('viewer');

            if (disposed || renderer.xr.getSession() !== session) return;

            hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

            if (disposed || renderer.xr.getSession() !== session) {
                hitTestSource?.cancel();
                hitTestSource = null;
                return;
            }

            log('Hit-test inicializado');
        } catch (error) {
            log('ERROR hit-test: ' + error.message);
            setStatus('Error al inicializar hit-test');
        }
    }

    // --------------------------------------------------
    // SESIÓN
    // --------------------------------------------------

    async function startAR() {
        if (!navigator.xr) {
            setStatus('WebXR no disponible');
            setHelp('Necesitás Chrome en Android con "Google Play Services for AR", vía HTTPS.');
            return;
        }

        try {
            const supported = await navigator.xr.isSessionSupported('immersive-ar');

            if (!supported) {
                setStatus('AR no compatible');
                setHelp('Este dispositivo o navegador no admite immersive-ar.');
                return;
            }

            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: overlayRoot } // ← transparente, SIN el canvas
            });

            await renderer.xr.setSession(session);

        } catch (error) {
            log('ERROR al iniciar: ' + error.message);
            setStatus('No se pudo iniciar AR');
            setHelp(error.message);
        }
    }

    // Los taps sobre botones del overlay TAMBIÉN disparan el evento
    // 'select' de la sesión. Guard: ignorar selects justo después
    // de tocar un botón (evita cubos fantasma al presionar la UI).
    let lastUiTap = 0;

    function onSelect() {
        if (performance.now() - lastUiTap < 300) return;

        if (!hasHit || !currentHitMatrix) {
            log('Tap sin superficie detectada');
            return;
        }

        placeCubeFromMatrix(currentHitMatrix);
    }

    function placeCubeFromMatrix(matrixArray) {
        const m = new THREE.Matrix4().fromArray(matrixArray);
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        m.decompose(position, quaternion, scale);

        // Apoyar el cubo sobre el plano detectado
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
        position.addScaledVector(up, 0.075);

        addCube(position, quaternion);
    }

    // Prueba de render PURA: no depende del hit-test.
    // Si este cubo se ve en AR, el pipeline cámara→canvas→compositor OK.
    function placeCubeInFront() {
        const camPos = new THREE.Vector3();
        const camDir = new THREE.Vector3();
        camera.getWorldPosition(camPos);
        camera.getWorldDirection(camDir);

        const p = camPos.clone().addScaledVector(camDir, 1.0);
        p.y -= 0.2;

        addCube(p);
        log('"Frente a mí" colocado — ¿lo ves?');
    }

    // Con 'local-floor', el origen queda a nivel del piso
    // donde arrancó la sesión. Útil para detectar "estoy
    // parado dentro de la geometría".
    function placeCubeAtOrigin() {
        addCube(new THREE.Vector3(0, 0.075, 0));
        log('Cubo en origen colocado — ¿lo ves?');
    }

    function endAR() {
        const session = renderer.xr.getSession();
        if (session) {
            session.end().catch((e) => log('ERROR al cerrar: ' + e.message));
        }
    }

    // --------------------------------------------------
    // EVENTOS DE SESIÓN
    // --------------------------------------------------

    renderer.xr.addEventListener('sessionstart', () => {
        const session = renderer.xr.getSession();

        // 📌 CLAVE: sin fondo, la cámara real se ve a través del canvas
        scene.background = null;

        startBtn.style.display = 'none';
        exitBtn.style.display = '';

        hasHit = false;
        currentHitMatrix = null;
        everDetected = false;
        hitTestSource = null;
        hitTestRequested = false;
        reticle.visible = false;

        setStatus('AR activo — buscando superficies');
        setHelp('Mové el teléfono lentamente sobre el suelo o una mesa.');
        log('Sesión iniciada');

        session.addEventListener('select', onSelect);

        session.addEventListener('end', () => {
            scene.background = DESKTOP_BG;
            hitTestSource?.cancel();
            hitTestSource = null;
            hitTestRequested = false;
            hasHit = false;
            currentHitMatrix = null;
            reticle.visible = false;

            startBtn.style.display = '';
            exitBtn.style.display = 'none';

            setStatus('Modo escritorio');
            setHelp('Pulsá «Iniciar AR» para comenzar.');
            log('Sesión finalizada');
        }, { once: true });

        requestHitTest(session);
    });

    // --------------------------------------------------
    // LOOP
    // --------------------------------------------------

    renderer.setAnimationLoop((timestamp, frame) => {

        if (frame && hitTestSource) {
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

                        if (!everDetected) {
                            everDetected = true;
                            log('Primera superficie detectada ✔');
                        }
                    }
                }

                if (hasHit) {
                    setStatus('Superficie detectada — tocá para colocar');
                } else {
                    setStatus('Buscando superficies…');
                }
            }
        }

        renderer.render(scene, camera);
    });

    // --------------------------------------------------
    // UI EVENTS
    // --------------------------------------------------

    startBtn.addEventListener('click', startAR);
    exitBtn.addEventListener('click', endAR);
    frontBtn.addEventListener('click', placeCubeInFront);
    originBtn.addEventListener('click', placeCubeAtOrigin);
    clearBtn.addEventListener('click', clearCubes);

    for (const btn of [startBtn, exitBtn, frontBtn, originBtn, clearBtn]) {
        btn.addEventListener('pointerdown', () => {
            lastUiTap = performance.now();
        });
    }

    // --------------------------------------------------
    // RESIZE
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
    // DESTROY (navegación Livewire)
    // --------------------------------------------------

    function destroy() {
        disposed = true;

        const session = renderer.xr.getSession();
        if (session) session.end().catch(console.error);

        hitTestSource?.cancel();
        renderer.setAnimationLoop(null);

        startBtn.removeEventListener('click', startAR);
        exitBtn.removeEventListener('click', endAR);
        frontBtn.removeEventListener('click', placeCubeInFront);
        originBtn.removeEventListener('click', placeCubeAtOrigin);
        clearBtn.removeEventListener('click', clearCubes);

        resizeObserver.disconnect();
        clearCubes();

        scene.remove(reticle);
        ring.geometry.dispose();
        ring.material.dispose();
        dot.geometry.dispose();
        dot.material.dispose();
        cubeGeometry.dispose();

        renderer.dispose();
        renderer.domElement.remove();

        delete container.dataset.initialized;
    }

    activeInstance = { destroy };
}

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
