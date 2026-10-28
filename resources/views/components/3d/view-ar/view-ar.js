// =====================================================
// THREE.JS + WEBXR + THAT OPEN COMPONENTS
// VISOR AR CON RETÍCULA, HIT TEST Y OPACIDAD
// =====================================================


// =====================================================
// CONTENEDOR
// =====================================================

const container = document.getElementById('viewer');

if (!container) {
    throw new Error('No se encontró el elemento #viewer');
}


// =====================================================
// UI DOM OVERLAY
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
    // WEBGL RENDERER
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

    container.appendChild(renderer.domElement);


    // =================================================
    // CAMERA
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
    // INICIALIZAR COMPONENTES
    // =================================================

    components.init();


    // =================================================
    // FRAGMENTS
    // =================================================

    fragments = components.get(OBC.FragmentsManager);

    fragments.init('/engine/worker.mjs');


    // =================================================
    // CARGA DE MODELOS FRAGMENTS
    // =================================================

    fragments.list.onItemSet.add(({ value: model }) => {

        console.log('[FRAGMENTS] Modelo recibido');

        // ---------------------------------------------
        // CÁMARA DEL MODELO
        // ---------------------------------------------

        model.useCamera(camera);


        // ---------------------------------------------
        // AGREGAR MODELO A LA ESCENA
        // ---------------------------------------------

        scene.add(model.object);

        arModel = model.object;


        // ---------------------------------------------
        // TRANSFORMACIÓN INICIAL
        // ---------------------------------------------

        arModel.scale.set(1, 1, 1);

        arModel.visible = false;


        // ---------------------------------------------
        // ESTADO DE CARGA
        // ---------------------------------------------

        modelLoaded = true;

        modelLoading = false;


        // ---------------------------------------------
        // ACTUALIZAR FRAGMENTS
        // ---------------------------------------------

        fragments.core.update(true);


        // ---------------------------------------------
        // APLICAR OPACIDAD
        // ---------------------------------------------

        setModelOpacity(opacityValue);


        console.log('[FRAGMENTS] Modelo preparado');
    });


    // =================================================
    // CREAR RETÍCULA
    // =================================================

    createARReticle();


    // =================================================
    // CONTROLADOR AR
    // =================================================

    arController = renderer.xr.getController(0);

    arController.addEventListener(
        'select',
        onARSelect
    );

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
    // SLIDER DE OPACIDAD
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
    // INICIO DE SESIÓN AR
    // =================================================

    renderer.xr.addEventListener(
        'sessionstart',
        onARSessionStart
    );


    // =================================================
    // FIN DE SESIÓN AR
    // =================================================

    renderer.xr.addEventListener(
        'sessionend',
        onARSessionEnd
    );


    // =================================================
    // BUCLE DE RENDERIZADO
    // =================================================

    renderer.setAnimationLoop((timestamp, frame) => {

        // ---------------------------------------------
        // ACTUALIZAR HIT TEST Y RETÍCULA
        // ---------------------------------------------

        updateAR(frame);


        // ---------------------------------------------
        // ACTUALIZAR FRAGMENTS EN AR
        // ---------------------------------------------

        if (isAR && arModel && modelLoaded) {

            fragments.core.update();
        }


        // ---------------------------------------------
        // ACTUALIZAR MATRICES DE LA ESCENA
        // ---------------------------------------------

        scene.updateMatrixWorld(true);


        // ---------------------------------------------
        // RENDERIZAR
        // ---------------------------------------------

        renderer.render(scene, camera);
    });


    // =================================================
    // REDIMENSIONAMIENTO
    // =================================================

    window.addEventListener('resize', onResize);


    // =================================================
    // OCULTAR INTERFAZ FUERA DE AR
    // =================================================

    if (arUI) {
        arUI.style.display = 'none';
    }


    console.log('[VISOR] Inicializado correctamente');
}


// =====================================================
// CREAR RETÍCULA AR
// =====================================================

function createARReticle() {

    // ---------------------------------------------
    // GEOMETRÍA
    // ---------------------------------------------

    const geometry = new THREE.RingGeometry(
        0.12,
        0.16,
        48
    );

    // El anillo se coloca horizontalmente.
    geometry.rotateX(-Math.PI / 2);


    // ---------------------------------------------
    // MATERIAL
    // ---------------------------------------------

    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
    });


    // ---------------------------------------------
    // MESH
    // ---------------------------------------------

    arReticle = new THREE.Mesh(
        geometry,
        material
    );


    // ---------------------------------------------
    // CONFIGURACIÓN
    // ---------------------------------------------

    arReticle.matrixAutoUpdate = true;

    arReticle.visible = false;

    arReticle.renderOrder = 999;

    arReticle.frustumCulled = false;


    // ---------------------------------------------
    // AGREGAR A LA ESCENA
    // ---------------------------------------------

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


    // ---------------------------------------------
    // OCULTAR MODELO HASTA COLOCARLO
    // ---------------------------------------------

    if (arModel) {

        arModel.visible = false;
    }


    // ---------------------------------------------
    // RESTABLECER RETÍCULA
    // ---------------------------------------------

    arReticle.visible = false;

    arReticle.position.set(0, 0, 0);

    arReticle.quaternion.identity();


    // ---------------------------------------------
    // SINCRONIZAR OPACIDAD
    // ---------------------------------------------

    if (opacitySlider) {

        opacitySlider.value =
            Math.round(opacityValue * 100);
    }

    if (opacityText) {

        opacityText.textContent =
            `${Math.round(opacityValue * 100)}%`;
    }


    // ---------------------------------------------
    // MOSTRAR INTERFAZ
    // ---------------------------------------------

    if (arUI) {

        arUI.style.display = 'block';
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


    // ---------------------------------------------
    // OCULTAR RETÍCULA
    // ---------------------------------------------

    if (arReticle) {

        arReticle.visible = false;
    }


    // ---------------------------------------------
    // OCULTAR INTERFAZ
    // ---------------------------------------------

    if (arUI) {

        arUI.style.display = 'none';
    }


    // ---------------------------------------------
    // MOSTRAR MODELO FUERA DE AR
    // ---------------------------------------------

    if (arModel) {

        arModel.visible = true;
    }
}


// =====================================================
// HIT TEST
// =====================================================

async function updateAR(frame) {

    if (!frame || !isAR) {
        return;
    }


    const session = renderer.xr.getSession();

    const referenceSpace = renderer.xr.getReferenceSpace();


    if (!session || !referenceSpace) {
        return;
    }


    // =================================================
    // CREAR FUENTE DE HIT TEST
    // =================================================

    if (!hitTestSourceRequested) {

        hitTestSourceRequested = true;

        console.log('[AR] Solicitando Hit Test...');

        try {

            const viewerSpace =
                await session.requestReferenceSpace('viewer');


            // -----------------------------------------
            // COMPROBAR QUE LA SESIÓN SIGUE ACTIVA
            // -----------------------------------------

            if (
                !isAR ||
                renderer.xr.getSession() !== session
            ) {

                hitTestSourceRequested = false;

                return;
            }


            // -----------------------------------------
            // SOLICITAR FUENTE DE HIT TEST
            // -----------------------------------------

            const source =
                await session.requestHitTestSource({
                    space: viewerSpace
                });


            // -----------------------------------------
            // COMPROBAR SESIÓN NUEVAMENTE
            // -----------------------------------------

            if (
                !isAR ||
                renderer.xr.getSession() !== session
            ) {

                source.cancel();

                hitTestSourceRequested = false;

                return;
            }


            hitTestSource = source;

            console.log(
                '[AR] Hit Test inicializado correctamente'
            );


        } catch (error) {

            console.error(
                '[AR] Error creando Hit Test:',
                error
            );

            hitTestSourceRequested = false;

            return;
        }
    }


    // =================================================
    // ESPERAR A LA FUENTE
    // =================================================

    if (!hitTestSource) {
        return;
    }


    // =================================================
    // OBTENER RESULTADOS
    // =================================================

    const results =
        frame.getHitTestResults(hitTestSource);


    // ---------------------------------------------
    // NO SE DETECTÓ NINGUNA SUPERFICIE
    // ---------------------------------------------

    if (results.length === 0) {

        arReticle.visible = false;

        return;
    }


    // =================================================
    // OBTENER POSE
    // =================================================

    const hit = results[0];

    const pose = hit.getPose(referenceSpace);


    if (!pose) {

        arReticle.visible = false;

        return;
    }


    // =================================================
    // ACTUALIZAR POSICIÓN Y ORIENTACIÓN
    // =================================================

    const transform = new THREE.Matrix4();

    transform.fromArray(
        pose.transform.matrix
    );


    transform.decompose(
        arReticle.position,
        arReticle.quaternion,
        arReticle.scale
    );


    // ---------------------------------------------
    // ASEGURAR ESCALA NORMAL
    // ---------------------------------------------

    arReticle.scale.set(1, 1, 1);


    // ---------------------------------------------
    // MOSTRAR RETÍCULA
    // ---------------------------------------------

    arReticle.visible = true;


    // ---------------------------------------------
    // ACTUALIZAR MATRICES
    // ---------------------------------------------

    arReticle.updateMatrix();

    arReticle.updateMatrixWorld(true);
}


// =====================================================
// SELECT AR: TOCAR PANTALLA
// =====================================================

async function onARSelect() {

    if (!isAR) {
        return;
    }


    // =================================================
    // COMPROBAR RETÍCULA
    // =================================================

    if (!arReticle || !arReticle.visible) {

        console.log(
            '[AR] No hay una superficie detectada'
        );

        return;
    }


    // =================================================
    // OBTENER POSICIÓN DE LA RETÍCULA
    // =================================================

    const position = arReticle.position.clone();


    // =================================================
    // SI EL MODELO YA ESTÁ CARGADO
    // =================================================

    if (modelLoaded && arModel) {

        arModel.position.copy(position);

        arModel.visible = true;

        fragments.core.update(true);

        console.log('[AR] Modelo colocado');

        return;
    }


    // =================================================
    // EVITAR CARGAS SIMULTÁNEAS
    // =================================================

    if (modelLoading) {

        console.log('[AR] El modelo ya se está cargando');

        return;
    }


    modelLoading = true;


    // =================================================
    // OBTENER URL DEL MODELO
    // =================================================

    const url = container.dataset.url;


    if (!url) {

        console.error(
            '[AR] No existe data-url en #viewer'
        );

        modelLoading = false;

        return;
    }


    // =================================================
    // CARGAR FRAGMENTS
    // =================================================

    try {

        console.log('[AR] Cargando modelo...');


        const separator = url.includes('?') ? '&' : '?';

        const response = await fetch(
            `${url}${separator}type=frag`
        );


        if (!response.ok) {

            throw new Error(
                `Error HTTP ${response.status}`
            );
        }


        const buffer = await response.arrayBuffer();


        console.log('[AR] Fragment recibido');


        await fragments.core.load(
            buffer,
            {
                modelId: 'main'
            }
        );


        // ---------------------------------------------
        // COMPROBAR MODELO
        // ---------------------------------------------

        if (!arModel) {

            throw new Error(
                'El modelo se cargó, pero no se encontró su objeto Three.js'
            );
        }


        // ---------------------------------------------
        // COLOCAR MODELO
        // ---------------------------------------------

        arModel.position.copy(position);

        arModel.scale.set(1, 1, 1);

        arModel.visible = true;


        // ---------------------------------------------
        // APLICAR OPACIDAD
        // ---------------------------------------------

        setModelOpacity(opacityValue);


        // ---------------------------------------------
        // ACTUALIZAR FRAGMENTS
        // ---------------------------------------------

        fragments.core.update(true);


        modelLoaded = true;

        console.log('[AR] Modelo colocado correctamente');


    } catch (error) {

        console.error(
            '[AR] Error cargando el modelo:',
            error
        );

    } finally {

        modelLoading = false;
    }
}


// =====================================================
// CAMBIAR OPACIDAD DEL MODELO
// =====================================================

function setModelOpacity(opacity) {

    const value = THREE.MathUtils.clamp(
        opacity,
        0,
        1
    );


    if (!arModel) {
        return;
    }


    // =================================================
    // RECORRER OBJETOS
    // =================================================

    arModel.traverse((object) => {

        if (
            !object.isMesh ||
            !object.material
        ) {

            return;
        }


        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];


        materials.forEach((material) => {

            // -----------------------------------------
            // GUARDAR ESTADO ORIGINAL
            // -----------------------------------------

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


            const original =
                material.userData.opacityOriginal;


            // -----------------------------------------
            // OPACIDAD ORIGINAL
            // -----------------------------------------

            if (value >= 1) {

                material.opacity = original.opacity;

                material.transparent = original.transparent;

                material.depthWrite = original.depthWrite;

                material.depthTest = original.depthTest;

                material.side = original.side;

                material.alphaTest = original.alphaTest;

                material.blending = original.blending;
            }


            // -----------------------------------------
            // OPACIDAD REDUCIDA
            // -----------------------------------------

            else {

                material.opacity =
                    original.opacity * value;

                material.transparent = true;

                material.depthWrite = original.depthWrite;

                material.depthTest = original.depthTest;

                material.side = original.side;

                material.alphaTest = original.alphaTest;

                material.blending = original.blending;
            }


            material.needsUpdate = true;
        });
    });


    // =================================================
    // ACTUALIZAR FRAGMENTS
    // =================================================

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


    if (width === 0 || height === 0) {
        return;
    }


    camera.aspect = width / height;

    camera.updateProjectionMatrix();


    renderer.setSize(
        width,
        height
    );
}


// =====================================================
// INICIAR VISOR
// =====================================================

initViewer().catch((error) => {

    console.error(
        '[VISOR] No se pudo inicializar:',
        error
    );
});
