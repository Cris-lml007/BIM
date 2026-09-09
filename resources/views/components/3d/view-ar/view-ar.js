
// ======================================================
// VARIABLES
// ======================================================

const container =
    document.getElementById('viewer');

let components;
let world;
let fragments;

let scene;
let renderer;

let arController;
let arReticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

let arModel = null;


// ======================================================
// ALERTAS
// ======================================================

function arAlert(message) {

    alert(
        '[BIM AR]\n\n' +
        message
    );

}


// ======================================================
// INIT
// ======================================================

async function initViewer() {

    try {

        // ==================================================
        // THAT OPEN COMPONENTS
        // ==================================================

        components =
            new OBC.Components();


        // ==================================================
        // WORLD
        // ==================================================

        const worlds =
            components.get(
                OBC.Worlds
            );


        world =
            worlds.create();


        // ==================================================
        // SCENE
        // ==================================================

        world.scene =
            new OBC.SimpleScene(
                components
            );


        world.scene.setup();


        world.scene.three.background =
            null;


        scene =
            world.scene.three;


        // ==================================================
        // RENDERER THAT OPEN
        // ==================================================

        world.renderer =
            new OBF.PostproductionRenderer(
                components,
                container
            );


        renderer =
            world.renderer.three;


        // ==================================================
        // CAMERA
        // ==================================================

        world.camera =
            new OBC.OrthoPerspectiveCamera(
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


        // ==================================================
        // INITIALIZE
        // ==================================================

        components.init();


        // ==================================================
        // FRAGMENTS
        // ==================================================

        const workerUrl =
            '/engine/worker.mjs';


        fragments =
            components.get(
                OBC.FragmentsManager
            );


        fragments.init(
            workerUrl
        );


        // ==================================================
        // FRAGMENTS CAMERA
        // ==================================================

        world.camera.controls.addEventListener(
            'update',
            () => {

                fragments.core.update();

            }
        );


        world.onCameraChanged.add(
            (camera) => {

                for (
                    const [, model]
                    of fragments.list
                ) {

                    model.useCamera(
                        camera.three
                    );

                }


                fragments.core.update();

            }
        );


        // ==================================================
        // MODEL ADDED
        // ==================================================

        fragments.list.onItemSet.add(
            ({ value: model }) => {

                model.useCamera(
                    world.camera.three
                );


                scene.add(
                    model.object
                );


                // Guardamos el objeto para AR
                if (!arModel) {

                    arModel =
                        model.object;

                }


                fragments.core.update(
                    true
                );

            }
        );


        // ==================================================
        // WEBXR
        // ==================================================

        renderer.xr.enabled =
            true;


        // ==================================================
        // AR BUTTON
        // ==================================================

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

renderer.xr.addEventListener('sessionstart', () => {
    if (arModel) {
        arModel.visible = false;
    }
});

renderer.xr.addEventListener('sessionend', () => {
    if (arModel) {
        arModel.visible = true;
    }
});


        // ==================================================
        // RETICLE
        // ==================================================

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
            new THREE.MeshBasicMaterial({
                color: 0xffffff
            });


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


        // ==================================================
        // AR CONTROLLER
        // ==================================================

        arController =
            renderer.xr.getController(0);


        arController.addEventListener(
            'select',
            onARSelect
        );


        scene.add(
            arController
        );


        // ==================================================
        // ANIMATION LOOP
        // ==================================================

        renderer.setAnimationLoop(
            (timestamp, frame) => {

                updateAR(
                    frame
                );


                fragments.core.update();


                renderer.render(
                    scene,
                    world.camera.three
                );

            }
        );


        // ==================================================
        // CARGAR MODELO
        // ==================================================

        const url =
            container.dataset.url;


        if (url) {

            await loadIFC(
                url
            );

        }


    } catch (error) {

        arAlert(
            'ERROR INICIANDO BIM AR:\n\n' +
            error.message
        );


        console.error(
            '[BIM AR]',
            error
        );

    }

}


// ======================================================
// UPDATE AR
// ======================================================

async function updateAR(frame) {

    if (!frame) {
        return;
    }


    const session =
        renderer.xr.getSession();


    const referenceSpace =
        renderer.xr.getReferenceSpace();


    if (
        !session ||
        !referenceSpace
    ) {

        return;

    }


    // ==================================================
    // HIT TEST SOURCE
    // ==================================================

    if (
        !hitTestSourceRequested
    ) {

        hitTestSourceRequested =
            true;


        session
            .requestReferenceSpace(
                'viewer'
            )
            .then(
                (viewerSpace) => {

                    return session
                        .requestHitTestSource({
                            space:
                                viewerSpace
                        });

                }
            )
            .then(
                (source) => {

                    hitTestSource =
                        source;

                }
            )
            .catch(
                (error) => {

                    arAlert(
                        'ERROR CREANDO HIT-TEST:\n\n' +
                        error.message
                    );

                    console.error(
                        error
                    );

                }
            );


        session.addEventListener(
            'end',
            () => {

                hitTestSource =
                    null;


                hitTestSourceRequested =
                    false;


                if (arReticle) {

                    arReticle.visible =
                        false;

                }

            },
            {
                once: true
            }
        );

    }


    // ==================================================
    // HIT TEST
    // ==================================================

    if (!hitTestSource) {
        return;
    }


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

            arReticle.visible =
                true;


            arReticle.matrix.fromArray(
                pose.transform.matrix
            );

        }

    } else {

        arReticle.visible =
            false;

    }

}


// ======================================================
// AR SELECT
// ======================================================

function onARSelect() {

    if (!arReticle || !arReticle.visible) {
        return;
    }

    if (!arModel) {
        alert('El modelo IFC todavía no está cargado.');
        return;
    }

    const position = new THREE.Vector3();

    position.setFromMatrixPosition(arReticle.matrix);

    arModel.position.copy(position);

    // Tamaño inicial del modelo en AR
    arModel.scale.set(0.1, 0.1, 0.1);

    arModel.visible = true;
}


// ======================================================
// LOAD IFC
// ======================================================

async function loadIFC(url) {

    try {

        // ==================================================
        // URL FRAGMENT
        // ==================================================

        const fragUrl =
            url + '?type=frag';


        // ==================================================
        // REQUEST
        // ==================================================

        const response =
            await fetch(
                fragUrl
            );


        if (!response.ok) {

            throw new Error(
                'No se pudo descargar el fragmento IFC.\n\n' +
                'HTTP: ' +
                response.status
            );

        }


        // ==================================================
        // BUFFER
        // ==================================================

        const buffer =
            await response.arrayBuffer();


        if (
            !buffer ||
            buffer.byteLength === 0
        ) {

            throw new Error(
                'El archivo FRAG está vacío.'
            );

        }


        // ==================================================
        // LOAD FRAGMENT
        // ==================================================

        await fragments.core.load(
            buffer,
            {
                modelId: 'main'
            }
        );


        // ==================================================
        // OBTENER MODELO
        // ==================================================

        const loadedModel =
            fragments.list.get(
                'main'
            );


        if (!loadedModel) {

            throw new Error(
                'Fragments no devolvió el modelo main.'
            );

        }


        arModel =
            loadedModel.object;


        // ==================================================
        // ASEGURAR ESCENA
        // ==================================================

        if (
            !arModel.parent
        ) {

            scene.add(
                arModel
            );

        }


        // ==================================================
        // CÁMARA
        // ==================================================

        loadedModel.useCamera(
            world.camera.three
        );


        // ==================================================
        // ACTUALIZAR
        // ==================================================

        fragments.core.update(
            true
        );


        // ==================================================
        // MODELO LISTO
        // ==================================================

        console.log(
            '[BIM AR] IFC cargado correctamente.'
        );


    } catch (error) {

        arAlert(
            'ERROR CARGANDO IFC:\n\n' +
            error.message
        );


        console.error(
            '[BIM AR]',
            error
        );

    }

}


// ======================================================
// START
// ======================================================

initViewer();
