
const container = document.getElementById('viewer');

if (!container) {
    throw new Error('No se encontró el elemento #viewer');
}


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


// =====================================================
// INICIALIZAR VISOR
// =====================================================

async function initViewer() {

    // -------------------------------------------------
    // THAT OPEN
    // -------------------------------------------------

    components = new OBC.Components();

    const worlds = components.get(OBC.Worlds);

    world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.scene.setup();

    world.scene.three.background = null;

    scene = world.scene.three;


    // -------------------------------------------------
    // THREE.JS RENDERER
    // -------------------------------------------------

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    renderer.xr.enabled = true;

    container.appendChild(renderer.domElement);


    // -------------------------------------------------
    // CAMERA
    // -------------------------------------------------

    camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
    );

    camera.position.set(
        10,
        10,
        10
    );

    camera.lookAt(
        0,
        0,
        0
    );


    // -------------------------------------------------
    // INICIALIZAR COMPONENTS
    // -------------------------------------------------

    components.init();


    // -------------------------------------------------
    // FRAGMENTS
    // -------------------------------------------------

    fragments = components.get(OBC.FragmentsManager);

    fragments.init('/engine/worker.mjs');


    // -------------------------------------------------
    // CUANDO SE CARGA EL MODELO
    // -------------------------------------------------

    fragments.list.onItemSet.add(({ value: model }) => {

        console.log('Modelo Fragments cargado');

        model.useCamera(camera);

        scene.add(model.object);

        arModel = model.object;

        // Modelo pequeño para AR
        arModel.scale.set(
            0.1,
            0.1,
            0.1
        );

        // No mostrarlo inmediatamente
        arModel.visible = false;

        modelLoaded = true;
        modelLoading = false;

        // Primera actualización
        fragments.core.update(true);
    });


    // =================================================
    // AR BUTTON
    // =================================================

    const arButton = ARButton.createButton(
        renderer,
        {
            requiredFeatures: [
                'hit-test'
            ]
        }
    );

    document.body.appendChild(arButton);


    // =================================================
    // RETICLE
    // =================================================

    const reticleGeometry = new THREE.RingGeometry(
        0.08,
        0.1,
        32
    );

    reticleGeometry.rotateX(
        -Math.PI / 2
    );

    const reticleMaterial = new THREE.MeshBasicMaterial();

    arReticle = new THREE.Mesh(
        reticleGeometry,
        reticleMaterial
    );

    arReticle.matrixAutoUpdate = false;

    arReticle.visible = false;

    scene.add(arReticle);


    // =================================================
    // CONTROLLER
    // =================================================

    arController = renderer.xr.getController(0);

    arController.addEventListener(
        'select',
        onARSelect
    );

    scene.add(arController);


    // =================================================
    // INICIO DE AR
    // =================================================

    renderer.xr.addEventListener(
        'sessionstart',
        () => {

            console.log('AR iniciado');

            isAR = true;

            hitTestSource = null;
            hitTestSourceRequested = false;

            if (arModel) {
                arModel.visible = false;
            }
        }
    );


    // =================================================
    // FIN DE AR
    // =================================================

    renderer.xr.addEventListener(
        'sessionend',
        () => {

            console.log('AR finalizado');

            isAR = false;

            hitTestSource = null;

            hitTestSourceRequested = false;

            if (arReticle) {
                arReticle.visible = false;
            }

            if (arModel) {
                arModel.visible = true;
            }
        }
    );


    // =================================================
    // ANIMATION LOOP
    // =================================================

    renderer.setAnimationLoop(
        (timestamp, frame) => {

            // Hit-test
            updateAR(frame);


            // -------------------------------------------------
            // IMPORTANTE:
            // Fragments NO se actualiza si todavía no existe
            // el modelo.
            // -------------------------------------------------

            if (isAR && arModel) {
                fragments.core.update();
            }


            // Render
            renderer.render(
                scene,
                camera
            );
        }
    );


    // =================================================
    // RESIZE
    // =================================================

    window.addEventListener(
        'resize',
        onResize
    );
}


// =====================================================
// HIT TEST
// =====================================================

function updateAR(frame) {

    if (!frame) {
        return;
    }

    const referenceSpace =
        renderer.xr.getReferenceSpace();

    const session =
        renderer.xr.getSession();


    // -------------------------------------------------
    // SOLICITAR HIT TEST SOURCE
    // -------------------------------------------------

    if (!hitTestSourceRequested) {

        session
            .requestReferenceSpace('viewer')
            .then((referenceSpace) => {

                session
                    .requestHitTestSource({
                        space: referenceSpace
                    })
                    .then((source) => {

                        hitTestSource = source;
                    });
            });


        session.addEventListener(
            'end',
            () => {

                hitTestSourceRequested = false;

                hitTestSource = null;

                if (arReticle) {
                    arReticle.visible = false;
                }
            }
        );


        hitTestSourceRequested = true;
    }


    // -------------------------------------------------
    // RESULTADOS DEL HIT TEST
    // -------------------------------------------------

    if (hitTestSource) {

        const hitTestResults =
            frame.getHitTestResults(
                hitTestSource
            );


        if (hitTestResults.length) {

            const hit =
                hitTestResults[0];

            const pose =
                hit.getPose(
                    referenceSpace
                );


            arReticle.visible = true;

            arReticle.matrix.fromArray(
                pose.transform.matrix
            );

        } else {

            arReticle.visible = false;
        }
    }
}


// =====================================================
// CLICK / TAP EN AR
// =====================================================

async function onARSelect() {

    // No hay superficie detectada
    if (!arReticle || !arReticle.visible) {
        return;
    }


    // -------------------------------------------------
    // GUARDAR POSICIÓN DEL RETICLE
    // -------------------------------------------------

    const position =
        new THREE.Vector3();

    position.setFromMatrixPosition(
        arReticle.matrix
    );


    // -------------------------------------------------
    // SI EL MODELO YA ESTÁ CARGADO
    // -------------------------------------------------

    if (modelLoaded && arModel) {

        arModel.position.copy(
            position
        );

        arModel.visible = true;

        console.log(
            'Modelo colocado'
        );

        return;
    }


    // -------------------------------------------------
    // EVITAR DOBLE CARGA
    // -------------------------------------------------

    if (modelLoading) {
        return;
    }

    modelLoading = true;


    // -------------------------------------------------
    // URL DEL MODELO
    // -------------------------------------------------

    const url =
        container.dataset.url;


    if (!url) {

        console.error(
            'No existe data-url en #viewer'
        );

        modelLoading = false;

        return;
    }


    // -------------------------------------------------
    // CARGAR FRAGMENT
    // -------------------------------------------------

    try {

        console.log(
            'Cargando modelo...'
        );


        const response =
            await fetch(
                url + '?type=frag'
            );


        if (!response.ok) {

            throw new Error(
                `Error HTTP ${response.status}`
            );
        }


        const buffer =
            await response.arrayBuffer();


        console.log(
            'Fragment recibido'
        );


        await fragments.core.load(
            buffer,
            {
                modelId: 'main'
            }
        );


        // -------------------------------------------------
        // ESPERAR A QUE fragments.list.onItemSet
        // ASIGNE arModel
        // -------------------------------------------------

        if (arModel) {

            arModel.position.copy(
                position
            );

            arModel.scale.set(
                0.1,
                0.1,
                0.1
            );

            arModel.visible = true;

            fragments.core.update(true);

            console.log(
                'Modelo colocado en AR'
            );
        }

    } catch (error) {

        console.error(
            'Error cargando IFC:',
            error
        );

        modelLoading = false;
    }
}


// =====================================================
// RESIZE
// =====================================================

function onResize() {

    if (!container || !camera || !renderer) {
        return;
    }


    const width =
        container.clientWidth;

    const height =
        container.clientHeight;


    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();


    renderer.setSize(
        width,
        height
    );
}


// =====================================================
// INICIAR
// =====================================================

initViewer().catch(
    (error) => {

        console.error(
            'No se pudo iniciar el visor:',
            error
        );
    }
);
