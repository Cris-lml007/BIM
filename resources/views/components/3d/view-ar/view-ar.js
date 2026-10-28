// =====================================================
// THREE.JS + WEBXR + THAT OPEN COMPONENTS
// VISOR AR CON HIT TEST Y FRAGMENTS
// =====================================================


// =====================================================
// CONTENEDOR
// =====================================================

const container = document.getElementById('viewer');

if (!container) {
    throw new Error('No se encontró el elemento #viewer');
}


// =====================================================
// UI
// =====================================================

const arUI = document.getElementById('ar-ui-container');
const opacitySlider = document.getElementById('ar-opacity');
const opacityText = document.getElementById('ar-opacity-value');


// =====================================================
// VARIABLES
// =====================================================

let components;
let world;
let fragments;

let renderer;
let scene;
let camera;

let arController;
let arReticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

let arModel = null;

let modelLoading = false;
let modelLoaded = false;

let isAR = false;

let opacityValue = 1;

let activeSession = null;


// =====================================================
// INICIALIZAR VISOR
// =====================================================

async function initViewer() {

    // =================================================
    // THAT OPEN COMPONENTS
    // =================================================

    components = new OBC.Components();

    const worlds = components.get(OBC.Worlds);

    world = worlds.create();

    world.scene = new OBC.SimpleScene(components);

    world.scene.setup();

    world.scene.three.background = null;

    scene = world.scene.three;


    // =================================================
    // RENDERER
    // =================================================

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    renderer.setClearColor(0x000000, 0);

    renderer.xr.enabled = true;

    // IMPORTANTE:
    // Utilizar el mismo espacio de referencia que el ejemplo.
    renderer.xr.setReferenceSpaceType('local');

    container.appendChild(renderer.domElement);


    // =================================================
    // CÁMARA
    // =================================================

    camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
    );

    camera.position.set(10, 10, 10);

    camera.lookAt(0, 0, 0);


    // =================================================
    // COMPONENTES
    // =================================================

    components.init();


    // =================================================
    // FRAGMENTS
    // =================================================

    fragments = components.get(OBC.FragmentsManager);

    fragments.init('/engine/worker.mjs');


    // =================================================
    // MODELOS CARGADOS
    // =================================================

    fragments.list.onItemSet.add(({ value: model }) => {

        console.log('[FRAGMENTS] Modelo cargado');

        model.useCamera(camera);

        scene.add(model.object);

        arModel = model.object;

        arModel.scale.set(1, 1, 1);

        arModel.visible = false;

        modelLoaded = true;
        modelLoading = false;

        fragments.core.update(true);

        setModelOpacity(opacityValue);

        console.log('[FRAGMENTS] Modelo preparado');
    });


    // =================================================
    // RETÍCULA
    // =================================================

    createARReticle();


    // =================================================
    // CONTROLADOR AR
    // =================================================

    arController = renderer.xr.getController(0);

    arController.addEventListener('select', onARSelect);

    scene.add(arController);


    // =================================================
    // BOTÓN AR
    // =================================================

    const arButton = ARButton.createButton(
        renderer,
        {
            requiredFeatures: [
                'hit-test'
            ],

            optionalFeatures: [
                'dom-overlay'
            ],

            domOverlay: {
                root: arUI
            }
        }
    );

    document.body.appendChild(arButton);


    // =================================================
    // OPACIDAD
    // =================================================

    if (opacitySlider) {

        opacitySlider.addEventListener('input', () => {

            opacityValue =
                Number(opacitySlider.value) / 100;

            if (opacityText) {
                opacityText.textContent =
                    `${opacitySlider.value}%`;
            }

            setModelOpacity(opacityValue);
        });
    }


    // =================================================
    // SESIÓN AR
    // =================================================

    renderer.xr.addEventListener(
        'sessionstart',
        onARSessionStart
    );

    renderer.xr.addEventListener(
        'sessionend',
        onARSessionEnd
    );


    // =================================================
    // BUCLE DE RENDERIZADO
    // =================================================

    renderer.setAnimationLoop((timestamp, frame) => {

        if (isAR && frame) {
            updateAR(frame);
        }

        if (isAR && arModel && modelLoaded) {
            fragments.core.update();
        }

        renderer.render(scene, camera);
    });


    // =================================================
    // RESIZE
    // =================================================

    window.addEventListener('resize', onResize);


    // =================================================
    // OCULTAR UI
    // =================================================

    if (arUI) {
        arUI.style.display = 'none';
    }

    console.log('[VISOR] Inicializado');
}


// =====================================================
// CREAR RETÍCULA
// =====================================================

function createARReticle() {

    const reticleGroup = new THREE.Group();


    // =================================================
    // ANILLO
    // =================================================

    const ringGeometry = new THREE.RingGeometry(
        0.12,
        0.16,
        48
    );

    ringGeometry.rotateX(-Math.PI / 2);

    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
    });

    const ring = new THREE.Mesh(
        ringGeometry,
        ringMaterial
    );

    ring.renderOrder = 999;

    reticleGroup.add(ring);


    // =================================================
    // CRUZ CENTRAL
    // =================================================

    const points = [
        new THREE.Vector3(-0.20, 0, 0),
        new THREE.Vector3( 0.20, 0, 0),

        new THREE.Vector3(0, 0, -0.20),
        new THREE.Vector3(0, 0,  0.20)
    ];

    const crossGeometry = new THREE.BufferGeometry()
        .setFromPoints(points);

    const crossMaterial = new THREE.LineBasicMaterial({
        color: 0xff0000,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
    });

    const cross = new THREE.LineSegments(
        crossGeometry,
        crossMaterial
    );

    cross.renderOrder = 1000;

    reticleGroup.add(cross);


    // =================================================
    // CONFIGURACIÓN DEL GRUPO
    // =================================================

    arReticle = reticleGroup;

    // La matriz se establece directamente desde WebXR.
    arReticle.matrixAutoUpdate = false;

    arReticle.visible = false;

    arReticle.renderOrder = 999;

    arReticle.traverse((object) => {
        object.frustumCulled = false;
    });

    scene.add(arReticle);

    console.log('[AR] Retícula creada');
}


// =====================================================
// INICIO DE SESIÓN AR
// =====================================================

function onARSessionStart() {

    console.log('[AR] Sesión iniciada');

    isAR = true;

    activeSession = renderer.xr.getSession();

    hitTestSource = null;

    hitTestSourceRequested = false;

    if (arModel) {
        arModel.visible = false;
    }

    arReticle.visible = false;

    if (arUI) {
        arUI.style.display = 'block';
    }

    if (opacitySlider) {
        opacitySlider.value = Math.round(opacityValue * 100);
    }

    if (opacityText) {
        opacityText.textContent =
            `${Math.round(opacityValue * 100)}%`;
    }
}


// =====================================================
// FIN DE SESIÓN AR
// =====================================================

function onARSessionEnd() {

    console.log('[AR] Sesión finalizada');

    isAR = false;

    activeSession = null;

    hitTestSource = null;

    hitTestSourceRequested = false;

    if (arReticle) {
        arReticle.visible = false;
    }

    if (arUI) {
        arUI.style.display = 'none';
    }

    if (arModel) {
        arModel.visible = true;
    }
}


// =====================================================
// HIT TEST
// =====================================================

function updateAR(frame) {
    if (!isAR || !frame || !hitTestSource) {
        arReticle.visible = false;
        return;
    }

    const referenceSpace = renderer.xr.getReferenceSpace();

    if (!referenceSpace) {
        arReticle.visible = false;
        return;
    }

    // Todas las operaciones con XRFrame deben ejecutarse
    // sincrónicamente dentro del callback de animación.
    const viewerPose = frame.getViewerPose(referenceSpace);

    if (!viewerPose) {
        arReticle.visible = false;
        return;
    }

    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length === 0) {
        arReticle.visible = false;
        return;
    }

    const hitPose = hitTestResults[0].getPose(referenceSpace);

    if (!hitPose) {
        arReticle.visible = false;
        return;
    }

    arReticle.matrix.fromArray(hitPose.transform.matrix);
    arReticle.matrixWorldNeedsUpdate = true;
    arReticle.visible = true;
}


// =====================================================
// SELECCIÓN AR
// =====================================================

async function onARSelect() {

    if (!isAR) {
        return;
    }

    if (!arReticle || !arReticle.visible) {

        console.log('[AR] No hay superficie detectada');

        return;
    }


    // =================================================
    // POSICIÓN DE LA RETÍCULA
    // =================================================

    const position = new THREE.Vector3();

    position.setFromMatrixPosition(arReticle.matrix);


    // =================================================
    // RECOLOCAR MODELO EXISTENTE
    // =================================================

    if (modelLoaded && arModel) {

        arModel.position.copy(position);

        arModel.visible = true;

        fragments.core.update(true);

        console.log('[AR] Modelo recolocado');

        return;
    }


    // =================================================
    // EVITAR DOBLE CARGA
    // =================================================

    if (modelLoading) {
        return;
    }

    modelLoading = true;


    // =================================================
    // URL
    // =================================================

    const url = container.dataset.url;

    if (!url) {

        console.error('[AR] Falta data-url');

        modelLoading = false;

        return;
    }


    // =================================================
    // CARGAR MODELO
    // =================================================

    try {

        console.log('[AR] Cargando modelo');

        const separator = url.includes('?') ? '&' : '?';

        const response = await fetch(
            `${url}${separator}type=frag`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();

        console.log('[AR] Fragment recibido');

        await fragments.core.load(
            buffer,
            {
                modelId: 'main'
            }
        );


        // El evento onItemSet configura arModel.
        if (!arModel) {
            throw new Error('No se obtuvo el objeto del modelo');
        }

        arModel.position.copy(position);

        arModel.scale.set(1, 1, 1);

        arModel.visible = true;

        setModelOpacity(opacityValue);

        fragments.core.update(true);

        modelLoaded = true;

        console.log('[AR] Modelo colocado');

    } catch (error) {

        console.error('[AR] Error cargando modelo:', error);

    } finally {

        modelLoading = false;
    }
}


// =====================================================
// OPACIDAD
// =====================================================

function setModelOpacity(opacity) {

    if (!arModel) {
        return;
    }

    const value = THREE.MathUtils.clamp(opacity, 0, 1);

    arModel.traverse((object) => {

        if (!object.isMesh || !object.material) {
            return;
        }

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

        materials.forEach((material) => {

            if (!material.userData.opacityOriginal) {

                material.userData.opacityOriginal = {
                    opacity: material.opacity,
                    transparent: material.transparent,
                    depthWrite: material.depthWrite,
                    depthTest: material.depthTest,
                    side: material.side,
                    alphaTest: material.alphaTest,
                    blending: material.blending
                };
            }

            const original = material.userData.opacityOriginal;

            material.opacity = original.opacity * value;

            if (value < 1) {

                material.transparent = true;

                material.depthWrite = original.depthWrite;

            } else {

                material.transparent = original.transparent;

                material.depthWrite = original.depthWrite;
            }

            material.depthTest = original.depthTest;

            material.side = original.side;

            material.alphaTest = original.alphaTest;

            material.blending = original.blending;

            material.needsUpdate = true;
        });
    });

    if (fragments) {
        fragments.core.update(true);
    }
}


// =====================================================
// RESIZE
// =====================================================

function onResize() {

    if (!container || !camera || !renderer) {
        return;
    }

    const width = container.clientWidth;

    const height = container.clientHeight;

    if (!width || !height) {
        return;
    }

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}


// =====================================================
// INICIAR
// =====================================================

initViewer().catch((error) => {

    console.error(
        '[VISOR] Error inicializando:',
        error
    );
});
