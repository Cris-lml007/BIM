
// ============================================================
// ELEMENTOS
// ============================================================

const container = document.getElementById('viewer');


// ============================================================
// THAT OPEN
// ============================================================

let components;
let world;
let fragments;


// ============================================================
// AR
// ============================================================

let arRenderer;
let arCamera;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

let arSessionStarted = false;


// ============================================================
// MODELO
// ============================================================

let model = null;

let modelScale = 1;


// ============================================================
// ALERTAS
// ============================================================

function arAlert(message) {

    alert(
        '[BIM AR]\n\n' +
        message
    );

}


// ============================================================
// INICIALIZAR THAT OPEN
// ============================================================

async function initViewer() {

    try {

        // ----------------------------------------------------
        // COMPONENTS
        // ----------------------------------------------------

        components = new OBC.Components();


        // ----------------------------------------------------
        // WORLD
        // ----------------------------------------------------

        const worlds =
            components.get(OBC.Worlds);

        world =
            worlds.create();


        // ----------------------------------------------------
        // SCENE
        // ----------------------------------------------------

        world.scene =
            new OBC.SimpleScene(
                components
            );

        world.scene.setup();


        // AR necesita fondo transparente
        world.scene.three.background =
            null;


        // ----------------------------------------------------
        // RENDERER THAT OPEN
        // ----------------------------------------------------

        world.renderer =
            new OBF.PostproductionRenderer(
                components,
                container
            );


        // ----------------------------------------------------
        // CAMERA THAT OPEN
        // ----------------------------------------------------

        world.camera =
            new OBC.OrthoPerspectiveCamera(
                components
            );


        await world.camera.controls.setLookAt(
            5,
            5,
            5,
            0,
            0,
            0
        );


        // ----------------------------------------------------
        // INICIALIZAR COMPONENTS
        // ----------------------------------------------------

        components.init();


        // ----------------------------------------------------
        // FRAGMENTS
        // ----------------------------------------------------

        fragments =
            components.get(
                OBC.FragmentsManager
            );


        fragments.init(
            '/engine/worker.mjs'
        );


        // ----------------------------------------------------
        // ACTUALIZAR FRAGMENTS CON LA CÁMARA NORMAL
        // ----------------------------------------------------

        world.camera.controls.addEventListener(
            'update',
            () => {

                fragments.core.update();

            }
        );


        // ----------------------------------------------------
        // CUANDO CAMBIA LA CÁMARA
        // ----------------------------------------------------

        world.onCameraChanged.add(
            (camera) => {

                for (
                    const [, currentModel]
                    of fragments.list
                ) {

                    currentModel.useCamera(
                        camera.three
                    );

                }

                fragments.core.update(true);

            }
        );


        // ----------------------------------------------------
        // CUANDO SE AGREGA UN MODELO
        // ----------------------------------------------------

        fragments.list.onItemSet.add(
            ({ value: currentModel }) => {

                currentModel.useCamera(
                    world.camera.three
                );

                world.scene.three.add(
                    currentModel.object
                );

                fragments.core.update(true);

            }
        );


        // ----------------------------------------------------
        // INICIALIZAR AR
        // ----------------------------------------------------

        initAR();


        arAlert(
            'Visor inicializado correctamente.\n\n' +
            'Ahora se puede cargar el IFC.'
        );


    } catch (error) {

        alert(
            '[BIM AR] ERROR AL INICIALIZAR VISOR\n\n' +
            error.message
        );

        console.error(error);

        throw error;

    }

}


// ============================================================
// CARGAR IFC
// ============================================================

async function loadIFC(url) {

    try {

        arAlert(
            'Cargando fragmento IFC...'
        );

        const fragUrl =
            url + '?type=frag';

        const response =
            await fetch(fragUrl);

        if (!response.ok) {

            throw new Error(
                'Error descargando el fragmento.\n\n' +
                'HTTP: ' +
                response.status
            );

        }

        const buffer =
            await response.arrayBuffer();

        if (!buffer || buffer.byteLength === 0) {

            throw new Error(
                'El fragmento está vacío.'
            );

        }

        arAlert(
            'Fragmento recibido.\n\n' +
            'Tamaño: ' +
            (buffer.byteLength / 1024 / 1024).toFixed(2) +
            ' MB\n\n' +
            'Cargando con Fragments...'
        );


        // ----------------------------------------------------
        // CARGAR FRAGMENT
        // ----------------------------------------------------

        await fragments.core.load(
            buffer,
            {
                modelId: 'main'
            }
        );


        // ----------------------------------------------------
        // OBTENER MODELO
        // ----------------------------------------------------

        model =
            fragments.list.get('main');


        if (!model) {

            throw new Error(
                'Fragments terminó la carga, ' +
                'pero no se encontró el modelo main.'
            );

        }


        // ----------------------------------------------------
        // ASEGURAR QUE ESTÁ EN LA ESCENA
        // ----------------------------------------------------

        if (
            !model.object.parent
        ) {

            world.scene.three.add(
                model.object
            );

        }


        // ----------------------------------------------------
        // CÁMARA NORMAL
        // ----------------------------------------------------

        model.useCamera(
            world.camera.three
        );


        // ----------------------------------------------------
        // ACTUALIZAR
        // ----------------------------------------------------

        fragments.core.update(
            true
        );


        arAlert(
            '¡IFC CARGADO!\n\n' +
            'Modelo encontrado: SI\n\n' +
            'Ahora entra a AR.\n\n' +
            'Busca una superficie y toca la pantalla.'
        );


    } catch (error) {

        alert(
            '[BIM AR] ERROR AL CARGAR IFC\n\n' +
            error.message
        );

        console.error(
            '[BIM AR]',
            error
        );

    }

}


// ============================================================
// INICIALIZAR WEBXR
// ============================================================

function initAR() {

    try {

        // ----------------------------------------------------
        // RENDERER AR
        // ----------------------------------------------------

        arRenderer =
            new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });


        arRenderer.xr.enabled =
            true;


        arRenderer.setPixelRatio(
            window.devicePixelRatio
        );


        arRenderer.setSize(
            container.clientWidth,
            container.clientHeight
        );


        arRenderer.setClearColor(
            0x000000,
            0
        );


        // ----------------------------------------------------
        // CÁMARA AR
        // ----------------------------------------------------

        arCamera =
            new THREE.PerspectiveCamera(
                70,
                container.clientWidth /
                container.clientHeight,
                0.01,
                1000
            );


        // ----------------------------------------------------
        // RETÍCULA
        // ----------------------------------------------------

        reticle =
            new THREE.Mesh(

                new THREE.RingGeometry(
                    0.08,
                    0.10,
                    32
                ).rotateX(
                    -Math.PI / 2
                ),

                new THREE.MeshBasicMaterial()

            );


        reticle.matrixAutoUpdate =
            false;

        reticle.visible =
            false;


        world.scene.three.add(
            reticle
        );


        // ----------------------------------------------------
        // CONTROLLER
        // ----------------------------------------------------

        const controller =
            arRenderer.xr.getController(
                0
            );


        controller.addEventListener(
            'select',
            placeModel
        );


        // ----------------------------------------------------
        // BOTÓN AR
        // ----------------------------------------------------

        const arButton =
            ARButton.createButton(
                arRenderer,
                {
                    requiredFeatures: [
                        'hit-test'
                    ]
                }
            );


        arButton.style.position =
            'absolute';

        arButton.style.bottom =
            '20px';

        arButton.style.left =
            '50%';

        arButton.style.transform =
            'translateX(-50%)';

        arButton.style.zIndex =
            '9999';


        container.appendChild(
            arButton
        );


        // ----------------------------------------------------
        // ANIMATION LOOP
        // ----------------------------------------------------

        arRenderer.setAnimationLoop(
            renderAR
        );


        arAlert(
            'AR preparado correctamente.\n\n' +
            'El botón "START AR" debería aparecer.'
        );


    } catch (error) {

        alert(
            '[BIM AR] ERROR AL INICIALIZAR WEBXR\n\n' +
            error.message
        );

        console.error(error);

        throw error;

    }

}


// ============================================================
// COLOCAR MODELO
// ============================================================

function placeModel() {

    try {

        arAlert(
            'TOUCH DETECTADO.\n\n' +
            'WebXR recibió correctamente el toque.'
        );


        // ----------------------------------------------------
        // RETÍCULA
        // ----------------------------------------------------

        if (!reticle) {

            arAlert(
                'ERROR:\n\n' +
                'La retícula no existe.'
            );

            return;

        }


        if (!reticle.visible) {

            arAlert(
                'ERROR:\n\n' +
                'La retícula no está visible.\n\n' +
                'No se encontró una superficie.'
            );

            return;

        }


        // ----------------------------------------------------
        // MODELO
        // ----------------------------------------------------

        if (!model) {

            arAlert(
                'ERROR:\n\n' +
                'No existe el modelo IFC.'
            );

            return;

        }


        // ----------------------------------------------------
        // ACTUALIZAR CÁMARA DEL FRAGMENT
        // ----------------------------------------------------

        model.useCamera(
            arCamera
        );


        // ----------------------------------------------------
        // ACTUALIZAR FRAGMENTS
        // ----------------------------------------------------

        fragments.core.update(
            true
        );


        // ----------------------------------------------------
        // POSICIÓN
        // ----------------------------------------------------

        const position =
            new THREE.Vector3();

        position.setFromMatrixPosition(
            reticle.matrix
        );


        /*
         * IMPORTANTE:
         *
         * No modificamos la escala aquí.
         * El modelo conserva el tamaño pequeño
         * calculado cuando cargamos el IFC.
         */

        model.object.position.copy(
            position
        );


        // ----------------------------------------------------
        // ROTACIÓN
        // ----------------------------------------------------

        const rotation =
            new THREE.Quaternion();


        rotation.setFromRotationMatrix(
            reticle.matrix
        );


        model.object.quaternion.copy(
            rotation
        );


        // ----------------------------------------------------
        // HACER VISIBLE
        // ----------------------------------------------------

        model.object.visible =
            true;


        model.object.updateMatrixWorld(
            true
        );


        // ----------------------------------------------------
        // ACTUALIZAR FRAGMENTS
        // ----------------------------------------------------

        fragments.core.update(
            true
        );


        arSessionStarted =
            true;


        arAlert(
            'MODELO COLOCADO.\n\n' +
            'Si no aparece, el problema está ' +
            'en el renderizado/cámara del modelo.'
        );


    } catch (error) {

        alert(
            '[BIM AR] ERROR AL COLOCAR MODELO\n\n' +
            error.message
        );

        console.error(error);

    }

}


// ============================================================
// RENDER AR
// ============================================================

function renderAR(
    timestamp,
    frame
) {

    try {

        if (frame) {

            const referenceSpace =
                arRenderer.xr.getReferenceSpace();


            const session =
                arRenderer.xr.getSession();


            // ------------------------------------------------
            // SOLICITAR HIT TEST
            // ------------------------------------------------

            if (
                !hitTestSourceRequested
            ) {

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

                            alert(
                                '[BIM AR] ERROR HIT TEST\n\n' +
                                error.message
                            );

                            console.error(
                                error
                            );

                        }
                    );


                // ------------------------------------------------
                // FIN DE SESIÓN
                // ------------------------------------------------

                session.addEventListener(
                    'end',
                    () => {

                        hitTestSource =
                            null;

                        hitTestSourceRequested =
                            false;

                        reticle.visible =
                            false;

                        arSessionStarted =
                            false;


                        if (model) {

                            model.object.visible =
                                false;

                        }

                    }
                );


                hitTestSourceRequested =
                    true;

            }


            // ------------------------------------------------
            // RESULTADO HIT TEST
            // ------------------------------------------------

            if (hitTestSource) {

                const results =
                    frame.getHitTestResults(
                        hitTestSource
                    );


                if (
                    results.length > 0
                ) {

                    const hit =
                        results[0];


                    const pose =
                        hit.getPose(
                            referenceSpace
                        );


                    if (pose) {

                        reticle.visible =
                            true;


                        reticle.matrix.fromArray(
                            pose.transform.matrix
                        );

                    }

                } else {

                    reticle.visible =
                        false;

                }

            }

        }


        // ----------------------------------------------------
        // RENDER
        // ----------------------------------------------------

        arRenderer.render(
            world.scene.three,
            arCamera
        );


    } catch (error) {

        /*
         * NO usamos alert aquí porque esta función
         * se ejecuta muchas veces por segundo.
         */

        console.error(
            '[BIM AR] Render error:',
            error
        );

    }

}


// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
    'resize',
    () => {

        if (!container) {
            return;
        }


        const width =
            container.clientWidth;


        const height =
            container.clientHeight;


        if (
            arCamera &&
            height > 0
        ) {

            arCamera.aspect =
                width / height;

            arCamera.updateProjectionMatrix();

        }


        if (arRenderer) {

            arRenderer.setSize(
                width,
                height
            );

        }

    }
);


// ============================================================
// INICIAR
// ============================================================

async function start() {

    try {

        // ----------------------------------------------------
        // INICIAR VISOR
        // ----------------------------------------------------

        await initViewer();


        // ----------------------------------------------------
        // DATOS BLADE
        // ----------------------------------------------------

        const url =
            container.dataset.url;


        const type =
            container.dataset.type;


        if (!url) {

            throw new Error(
                'No existe data-url en #viewer.'
            );

        }


        if (!type) {

            throw new Error(
                'No existe data-type en #viewer.'
            );

        }


        // ----------------------------------------------------
        // COMPROBAR FORMATO
        // ----------------------------------------------------

        if (
            type.toLowerCase() !==
            'ifc'
        ) {

            throw new Error(
                'El formato recibido no es IFC.\n\n' +
                'Tipo: ' +
                type
            );

        }


        // ----------------------------------------------------
        // CARGAR IFC
        // ----------------------------------------------------

        await loadIFC(
            url
        );


    } catch (error) {

        alert(
            '[BIM AR] ERROR GENERAL\n\n' +
            error.message
        );

        console.error(error);

    }

}


// ============================================================
// EJECUTAR
// ============================================================

start();
