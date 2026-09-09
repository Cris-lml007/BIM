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
// CONTROL DE OPACIDAD
// =====================================================

let opacityControl;
let opacityValue;


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
    // THREE.JS WEBGL RENDERER
    // -------------------------------------------------

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


    // -------------------------------------------------
    // CAMERA
    // -------------------------------------------------

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


    // -------------------------------------------------
    // INICIALIZAR COMPONENTS
    // -------------------------------------------------

    components.init();


    // -------------------------------------------------
    // FRAGMENTS
    // -------------------------------------------------

    fragments =
        components.get(
            OBC.FragmentsManager
        );

    fragments.init(
        '/engine/worker.mjs'
    );


    // =================================================
    // MODELO CARGADO
    // =================================================

    fragments.list.onItemSet.add(
        ({ value: model }) => {

            console.log(
                'Modelo Fragments cargado'
            );


            model.useCamera(
                camera
            );


            scene.add(
                model.object
            );


            arModel =
                model.object;


            // -------------------------------------------------
            // ESCALA DEL MODELO
            // -------------------------------------------------

            arModel.scale.set(
                0.1,
                0.1,
                0.1
            );


            // -------------------------------------------------
            // OCULTAR HASTA COLOCARLO
            // -------------------------------------------------

            arModel.visible = false;


            modelLoaded = true;

            modelLoading = false;


            // -------------------------------------------------
            // ACTUALIZAR FRAGMENTS
            // -------------------------------------------------

            fragments.core.update(
                true
            );


            // -------------------------------------------------
            // APLICAR OPACIDAD ACTUAL
            // -------------------------------------------------

            if (opacityControl) {

                const opacity =
                    Number(
                        opacityControl.value
                    ) / 100;

                setModelOpacity(
                    opacity
                );
            }
        }
    );


    // =================================================
    // CONTROL DE OPACIDAD
    // =================================================

    opacityControl =
        document.getElementById(
            'opacity'
        );

    opacityValue =
        document.getElementById(
            'opacity-value'
        );


    if (opacityControl) {

        opacityControl.addEventListener(
            'input',
            () => {

                const opacity =
                    Number(
                        opacityControl.value
                    ) / 100;


                if (opacityValue) {

                    opacityValue.textContent =
                        `${opacityControl.value}%`;
                }


                setModelOpacity(
                    opacity
                );
            }
        );
    }


    // =================================================
    // AR BUTTON
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
    // RETICLE
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


    arReticle =
        new THREE.Mesh(
            reticleGeometry,
            reticleMaterial
        );


    arReticle.matrixAutoUpdate =
        false;

    arReticle.visible =
        false;


    scene.add(
        arReticle
    );


    // =================================================
    // CONTROLLER
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
    // AR SESSION START
    // =================================================

    renderer.xr.addEventListener(
        'sessionstart',
        () => {

            console.log(
                'AR iniciado'
            );


            isAR = true;


            hitTestSource =
                null;

            hitTestSourceRequested =
                false;


            // Ocultar modelo mientras
            // buscamos dónde colocarlo

            if (arModel) {

                arModel.visible =
                    false;
            }
        }
    );


    // =================================================
    // AR SESSION END
    // =================================================

    renderer.xr.addEventListener(
        'sessionend',
        () => {

            console.log(
                'AR finalizado'
            );


            isAR = false;


            hitTestSource =
                null;

            hitTestSourceRequested =
                false;


            if (arReticle) {

                arReticle.visible =
                    false;
            }


            // Mostrar nuevamente
            // el modelo fuera de AR

            if (arModel) {

                arModel.visible =
                    true;
            }
        }
    );


    // =================================================
    // ANIMATION LOOP
    // =================================================

    renderer.setAnimationLoop(
        (timestamp, frame) => {

            // -------------------------------------------------
            // HIT TEST
            // -------------------------------------------------

            updateAR(frame);


            // -------------------------------------------------
            // FRAGMENTS
            // -------------------------------------------------

            // No ejecutamos Fragments mientras
            // todavía no existe ningún modelo.

            if (isAR && arModel) {

                fragments.core.update();
            }


            // -------------------------------------------------
            // RENDER
            // -------------------------------------------------

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
            .requestReferenceSpace(
                'viewer'
            )
            .then(
                (referenceSpace) => {

                    session
                        .requestHitTestSource({
                            space: referenceSpace
                        })
                        .then(
                            (source) => {

                                hitTestSource =
                                    source;
                            }
                        );
                }
            );


        session.addEventListener(
            'end',
            () => {

                hitTestSourceRequested =
                    false;

                hitTestSource =
                    null;


                if (arReticle) {

                    arReticle.visible =
                        false;
                }
            }
        );


        hitTestSourceRequested =
            true;
    }


    // -------------------------------------------------
    // OBTENER HIT TEST
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


            arReticle.visible =
                true;


            arReticle.matrix.fromArray(
                pose.transform.matrix
            );

        } else {

            arReticle.visible =
                false;
        }
    }
}


// =====================================================
// TAP EN AR
// =====================================================

async function onARSelect() {

    // -------------------------------------------------
    // NO HAY SUPERFICIE
    // -------------------------------------------------

    if (
        !arReticle ||
        !arReticle.visible
    ) {
        return;
    }


    // -------------------------------------------------
    // GUARDAR POSICIÓN
    // -------------------------------------------------

    const position =
        new THREE.Vector3();


    position.setFromMatrixPosition(
        arReticle.matrix
    );


    // =================================================
    // MODELO YA CARGADO
    // =================================================

    if (
        modelLoaded &&
        arModel
    ) {

        arModel.position.copy(
            position
        );


        arModel.visible =
            true;


        console.log(
            'Modelo colocado'
        );


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
    // OBTENER URL
    // =================================================

    const url =
        container.dataset.url;


    if (!url) {

        console.error(
            'No existe data-url en #viewer'
        );


        modelLoading =
            false;

        return;
    }


    // =================================================
    // CARGAR IFC
    // =================================================

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
        // COLOCAR MODELO
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


            arModel.visible =
                true;


            fragments.core.update(
                true
            );


            console.log(
                'Modelo colocado en AR'
            );
        }

    } catch (error) {

        console.error(
            'Error cargando IFC:',
            error
        );


        modelLoading =
            false;
    }
}


// =====================================================
// CAMBIAR OPACIDAD
// =====================================================

function setModelOpacity(opacity) {

    if (!arModel) {
        return;
    }


    arModel.traverse(
        (object) => {

            if (!object.isMesh) {
                return;
            }


            if (!object.material) {
                return;
            }


            const materials =
                Array.isArray(
                    object.material
                )
                    ? object.material
                    : [object.material];


            materials.forEach(
                (material) => {

                    material.transparent =
                        opacity < 1;


                    material.opacity =
                        opacity;


                    material.needsUpdate =
                        true;
                }
            );
        }
    );
}


// =====================================================
// RESIZE
// =====================================================

function onResize() {

    if (
        !container ||
        !camera ||
        !renderer
    ) {
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
