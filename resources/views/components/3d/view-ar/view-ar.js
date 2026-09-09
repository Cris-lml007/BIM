const container = document.getElementById('viewer');

let components;
let world;
let fragments;

let renderer;
let scene;
let camera;


// =====================================================
// AR
// =====================================================

let arController = null;
let arReticle = null;

let hitTestSource = null;
let hitTestSourceRequested = false;


// =====================================================
// MODELO
// =====================================================

let arModel = null;
let modelLoading = false;
let modelLoaded = false;


// =====================================================
// INICIALIZAR
// =====================================================

async function initViewer() {

    try {

        // =================================================
        // THAT OPEN - COMPONENTS
        // =================================================

        components = new OBC.Components();

        const worlds = components.get(
            OBC.Worlds
        );

        world = worlds.create();


        // =================================================
        // ESCENA
        // =================================================

        world.scene = new OBC.SimpleScene(
            components
        );

        world.scene.setup();

        world.scene.three.background = null;

        scene = world.scene.three;


        // =================================================
        // RENDERER THREE.JS
        // =================================================

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        renderer.setPixelRatio(
            window.devicePixelRatio
        );

        renderer.setSize(
            container.clientWidth,
            container.clientHeight
        );

        renderer.xr.enabled = true;


        container.appendChild(
            renderer.domElement
        );


        // =================================================
        // CÁMARA THREE.JS
        // =================================================

        camera = new THREE.PerspectiveCamera(
            70,
            container.clientWidth /
                container.clientHeight,
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


        // =================================================
        // INICIALIZAR COMPONENTS
        // =================================================

        components.init();


        // =================================================
        // FRAGMENTS
        // =================================================

        fragments = components.get(
            OBC.FragmentsManager
        );

        fragments.init(
            '/engine/worker.mjs'
        );


        // =================================================
        // CUANDO SE CARGA UN MODELO
        // =================================================

        fragments.list.onItemSet.add(
            ({ value: model }) => {

                console.log(
                    'Fragments creó el modelo'
                );


                // Decirle a Fragments qué cámara usar
                model.useCamera(
                    camera
                );


                // Agregar modelo a Three.js
                scene.add(
                    model.object
                );


                arModel = model.object;


                // Tamaño pequeño
                arModel.scale.set(
                    0.1,
                    0.1,
                    0.1
                );


                // Todavía no mostrarlo
                // hasta que termine la colocación
                arModel.visible = false;


                modelLoaded = true;
                modelLoading = false;


                fragments.core.update(
                    true
                );


                console.log(
                    'Modelo IFC listo'
                );

            }
        );


        // =================================================
        // WEBXR
        // =================================================

        const arButton =
            ARButton.createButton(
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


        // =================================================
        // INICIO AR
        // =================================================

        renderer.xr.addEventListener(
            'sessionstart',
            () => {

                console.log(
                    'Sesión AR iniciada'
                );


                if (arModel) {

                    arModel.visible = false;

                }

            }
        );


        // =================================================
        // FIN AR
        // =================================================

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


        // =================================================
        // RETÍCULA
        // =================================================

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


        arReticle.matrixAutoUpdate =
            false;

        arReticle.visible = false;


        scene.add(
            arReticle
        );


        // =================================================
        // CONTROLADOR AR
        // =================================================

        arController =
            renderer.xr.getController(0);


        arController.addEventListener(
            'select',
            onARSelect
        );


        scene.add(
            arController
        );


        // =================================================
        // LOOP
        // =================================================

        renderer.setAnimationLoop(
            (timestamp, frame) => {

                updateAR(frame);


                // Solo actualizar Fragments
                // cuando existe un modelo
                if (arModel) {

                    fragments.core.update();

                }


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
            () => {

                camera.aspect =
                    container.clientWidth /
                    container.clientHeight;

                camera.updateProjectionMatrix();


                renderer.setSize(
                    container.clientWidth,
                    container.clientHeight
                );

            }
        );


        console.log(
            'Visor AR inicializado'
        );

    } catch (error) {

        console.error(
            'ERROR REAL:',
            error
        );


        alert(
            'No se pudo iniciar el visor AR.\n\n' +
            error.message
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


    // =================================================
    // SOLICITAR HIT TEST SOURCE
    // =================================================

    if (!hitTestSourceRequested) {

        session
            .requestReferenceSpace(
                'viewer'
            )
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


    // =================================================
    // ESPERAR HIT TEST
    // =================================================

    if (!hitTestSource) {

        return;

    }


    // =================================================
    // RESULTADOS
    // =================================================

    const hitTestResults =
        frame.getHitTestResults(
            hitTestSource
        );


    if (
        hitTestResults.length > 0
    ) {

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
// CLICK / TOQUE
// =====================================================

async function onARSelect() {

    // =================================================
    // VERIFICAR SUPERFICIE
    // =================================================

    if (
        !arReticle ||
        !arReticle.visible
    ) {

        return;

    }


    // =================================================
    // EVITAR DOBLE CARGA
    // =================================================

    if (modelLoading) {

        return;

    }


    // =================================================
    // POSICIÓN DEL RETÍCULO
    // =================================================

    const position =
        new THREE.Vector3();


    position.setFromMatrixPosition(
        arReticle.matrix
    );


    console.log(
        'Superficie seleccionada:',
        position
    );


    // =================================================
    // SI YA EXISTE EL MODELO
    // =================================================

    if (
        modelLoaded &&
        arModel
    ) {

        arModel.position.copy(
            position
        );


        arModel.scale.set(
            0.1,
            0.1,
            0.1
        );


        arModel.visible = true;


        fragments.core.update(
            true
        );


        console.log(
            'Modelo colocado'
        );


        return;

    }


    // =================================================
    // CARGAR MODELO
    // =================================================

    modelLoading = true;


    console.log(
        'Cargando IFC...'
    );


    try {

        const url =
            container.dataset.url;


        if (!url) {

            throw new Error(
                'No se encontró la URL del modelo.'
            );

        }


        // =================================================
        // OBTENER FRAGMENT
        // =================================================

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
            'FRAG recibido:',
            buffer.byteLength,
            'bytes'
        );


        // =================================================
        // CARGAR EN FRAGMENTS
        // =================================================

        await fragments.core.load(
            buffer,
            {
                modelId: 'main'
            }
        );


        // =================================================
        // VERIFICAR MODELO
        // =================================================

        if (!arModel) {

            throw new Error(
                'Fragments no creó el modelo.'
            );

        }


        // =================================================
        // COLOCAR
        // =================================================

        arModel.position.copy(
            position
        );


        // Tamaño
        arModel.scale.set(
            0.1,
            0.1,
            0.1
        );


        arModel.visible = true;


        fragments.core.update(
            true
        );


        console.log(
            '================================'
        );

        console.log(
            'MODELO COLOCADO EN AR'
        );

        console.log(
            'Posición:',
            position
        );

        console.log(
            '================================'
        );


    } catch (error) {

        console.error(
            'ERROR CARGANDO IFC:',
            error
        );


        alert(
            'No se pudo cargar el modelo IFC.\n\n' +
            error.message
        );


        modelLoading = false;

    }

}


// =====================================================
// INICIAR
// =====================================================

initViewer();
