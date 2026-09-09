
const container = document.getElementById('viewer');

let components;
let world;
let fragments;
let renderer;
let scene;

// AR
let arController = null;
let arReticle = null;

let hitTestSource = null;
let hitTestSourceRequested = false;

// Modelo
let arModel = null;
let modelLoading = false;
let modelLoaded = false;


// =====================================================
// INICIALIZAR VISOR
// =====================================================

async function initViewer() {

    try {

        // ---------------------------------------------
        // THAT OPEN
        // ---------------------------------------------

        components = new OBC.Components();

        const worlds = components.get(OBC.Worlds);

        world = worlds.create();


        // Escena
        world.scene = new OBC.SimpleScene(components);

        world.scene.setup();

        world.scene.three.background = null;


        // Renderer
        world.renderer = new OBF.WebGLRenderer(
            components,
            container
        );

        renderer = world.renderer.three;


        // Cámara
        world.camera = new OBC.OrthoPerspectiveCamera(
            components
        );

        await world.camera.controls.setLookAt(
            10,
            10,
            10,
            0,
            0,
            0
        );


        components.init();


        // Referencia a escena Three.js
        scene = world.scene.three;

        scene.background = null;


        // ---------------------------------------------
        // FRAGMENTS
        // ---------------------------------------------

        fragments = components.get(
            OBC.FragmentsManager
        );

        fragments.init(
            '/engine/worker.mjs'
        );


        world.camera.controls.addEventListener(
            'update',
            () => {
                fragments.core.update();
            }
        );


        world.onCameraChanged.add(
            (camera) => {

                for (const [, model] of fragments.list) {

                    model.useCamera(
                        camera.three
                    );

                }

                fragments.core.update();
            }
        );


        // ---------------------------------------------
        // CUANDO APARECE EL MODELO
        // ---------------------------------------------

        fragments.list.onItemSet.add(
            ({ value: model }) => {

                model.useCamera(
                    world.camera.three
                );

                scene.add(
                    model.object
                );

                arModel = model.object;

                // Tamaño inicial
                arModel.scale.set(
                    0.1,
                    0.1,
                    0.1
                );

                arModel.visible = true;

                modelLoaded = true;
                modelLoading = false;

                fragments.core.update(true);

                console.log(
                    'Modelo IFC cargado'
                );
            }
        );


        // ---------------------------------------------
        // WEBXR
        // ---------------------------------------------

        renderer.xr.enabled = true;


        const arButton = ARButton.createButton(
            renderer,
            {
                requiredFeatures: [
                    'hit-test'
                ]
            }
        );


        document.body.appendChild(
            arButton
        );


        // ---------------------------------------------
        // ENTRAR AR
        // ---------------------------------------------

        renderer.xr.addEventListener(
            'sessionstart',
            () => {

                console.log(
                    'Sesión AR iniciada'
                );

                // El modelo no se muestra
                // hasta tocar una superficie
                if (arModel) {

                    arModel.visible = false;

                }

            }
        );


        // ---------------------------------------------
        // SALIR AR
        // ---------------------------------------------

        renderer.xr.addEventListener(
            'sessionend',
            () => {

                console.log(
                    'Sesión AR finalizada'
                );

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


        // ---------------------------------------------
        // RETÍCULA
        // ---------------------------------------------

        const reticleGeometry =
            new THREE.RingGeometry(
                0.08,
                0.1,
                32
            );

        reticleGeometry.rotateX(
            -Math.PI / 2
        );


        const reticleMaterial =
            new THREE.MeshBasicMaterial();


        arReticle = new THREE.Mesh(
            reticleGeometry,
            reticleMaterial
        );


        arReticle.matrixAutoUpdate = false;

        arReticle.visible = false;


        scene.add(
            arReticle
        );


        // ---------------------------------------------
        // CONTROLADOR AR
        // ---------------------------------------------

        arController =
            renderer.xr.getController(0);


        arController.addEventListener(
            'select',
            onARSelect
        );


        scene.add(
            arController
        );


        // ---------------------------------------------
        // LOOP
        // ---------------------------------------------

        renderer.setAnimationLoop(
            (timestamp, frame) => {

                updateAR(frame);

                fragments.core.update();

                renderer.render(
                    scene,
                    world.camera.three
                );

            }
        );


    } catch (error) {

        console.error(
            'Error inicializando AR:',
            error
        );

        alert(
            'No se pudo iniciar el visor AR.'
        );

    }

}


// =====================================================
// HIT TEST
// =====================================================

async function updateAR(frame) {

    if (!frame) {
        return;
    }


    const session =
        renderer.xr.getSession();


    const referenceSpace =
        renderer.xr.getReferenceSpace();


    // ---------------------------------------------
    // CREAR HIT TEST SOURCE
    // ---------------------------------------------

    if (!hitTestSourceRequested) {

        session
            .requestReferenceSpace('viewer')
            .then(
                (viewerSpace) => {

                    session
                        .requestHitTestSource({
                            space: viewerSpace
                        })
                        .then(
                            (source) => {

                                hitTestSource =
                                    source;

                            }
                        );

                }
            );


        hitTestSourceRequested = true;

    }


    // ---------------------------------------------
    // ESPERAR HIT TEST
    // ---------------------------------------------

    if (!hitTestSource) {

        return;

    }


    // ---------------------------------------------
    // RESULTADOS
    // ---------------------------------------------

    const hitTestResults =
        frame.getHitTestResults(
            hitTestSource
        );


    if (hitTestResults.length > 0) {

        const hit =
            hitTestResults[0];


        const pose =
            hit.getPose(
                referenceSpace
            );


        if (pose) {

            arReticle.visible = true;

            arReticle.matrix.fromArray(
                pose.transform.matrix
            );

        }

    } else {

        arReticle.visible = false;

    }

}


// =====================================================
// CLICK / TOQUE EN SUPERFICIE
// =====================================================

async function onARSelect() {

    // ---------------------------------------------
    // ¿HAY SUPERFICIE?
    // ---------------------------------------------

    if (
        !arReticle ||
        !arReticle.visible
    ) {

        return;

    }


    // ---------------------------------------------
    // EVITAR DOBLE CARGA
    // ---------------------------------------------

    if (modelLoading) {

        return;

    }


    // ---------------------------------------------
    // SI YA ESTÁ CARGADO
    // ---------------------------------------------

    if (modelLoaded && arModel) {

        const position =
            new THREE.Vector3();


        position.setFromMatrixPosition(
            arReticle.matrix
        );


        arModel.position.copy(
            position
        );


        arModel.visible = true;


        console.log(
            'Modelo colocado:',
            position
        );


        return;

    }


    // ---------------------------------------------
    // CARGAR IFC
    // ---------------------------------------------

    modelLoading = true;


    const position =
        new THREE.Vector3();


    position.setFromMatrixPosition(
        arReticle.matrix
    );


    console.log(
        'Superficie detectada'
    );

    console.log(
        'Posición:',
        position
    );

    console.log(
        'Cargando modelo IFC...'
    );


    try {

        const url =
            container.dataset.url;


        if (!url) {

            throw new Error(
                'No se encontró la URL del modelo.'
            );

        }


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


        await fragments.core.load(
            buffer,
            {
                modelId: 'main'
            }
        );


        // -----------------------------------------
        // ESPERAR A QUE FRAGMENTS CREE EL MODELO
        // -----------------------------------------

        if (!arModel) {

            console.warn(
                'El modelo todavía no está disponible.'
            );

            return;

        }


        // -----------------------------------------
        // COLOCAR MODELO
        // -----------------------------------------

        arModel.position.copy(
            position
        );


        // Tamaño pequeño
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


    } catch (error) {

        console.error(
            'Error cargando IFC:',
            error
        );


        alert(
            'No se pudo cargar el modelo IFC.'
        );


        modelLoading = false;

    }

}


// =====================================================
// INICIAR
// =====================================================

initViewer();
