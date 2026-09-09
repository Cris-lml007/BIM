
// ============================================================
// VARIABLES
// ============================================================

const container = document.getElementById('viewer');

let components;
let world;
let fragments;

let arRenderer;
let arCamera;

let arRoot;
let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;


// ============================================================
// INICIALIZAR THAT OPEN
// ============================================================

async function initViewer() {

    components = new OBC.Components();

    const worlds = components.get(OBC.Worlds);

    world = worlds.create();

    // --------------------------------------------------------
    // SCENE
    // --------------------------------------------------------

    world.scene = new OBC.SimpleScene(components);

    world.scene.setup();

    // Fondo transparente
    world.scene.three.background = null;


    // --------------------------------------------------------
    // RENDERER NORMAL
    // --------------------------------------------------------

    world.renderer = new OBF.PostproductionRenderer(
        components,
        container
    );


    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

    world.camera = new OBC.OrthoPerspectiveCamera(
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


    // --------------------------------------------------------
    // COMPONENTS
    // --------------------------------------------------------

    components.init();


    // --------------------------------------------------------
    // FRAGMENTS
    // --------------------------------------------------------

    fragments = components.get(
        OBC.FragmentsManager
    );

    fragments.init(
        "/engine/worker.mjs"
    );


    world.camera.controls.addEventListener(
        "update",
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

            fragments.core.update(true);
        }
    );


    fragments.list.onItemSet.add(
        ({ value: model }) => {

            model.useCamera(
                world.camera.three
            );

            world.scene.three.add(
                model.object
            );

            fragments.core.update(true);

        }
    );


    // --------------------------------------------------------
    // AR
    // --------------------------------------------------------

    initAR();
}


// ============================================================
// CARGAR IFC
// ============================================================

async function loadIFC(url) {

    console.log("Cargando IFC...");

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Error HTTP: ${response.status}`
        );
    }

    const buffer = await response.arrayBuffer();

    await fragments.core.load(
        buffer,
        {
            modelId: "main"
        }
    );


    console.log("IFC cargado");


    // --------------------------------------------------------
    // CREAR CONTENEDOR AR
    // --------------------------------------------------------

    arRoot = new THREE.Group();

    arRoot.visible = false;

    world.scene.three.add(
        arRoot
    );


    // --------------------------------------------------------
    // MOVER MODELO AL ROOT AR
    // --------------------------------------------------------

    for (const [, model] of fragments.list) {

        arRoot.add(
            model.object
        );

    }


    // --------------------------------------------------------
    // REDUCIR MODELO TEMPORALMENTE
    // --------------------------------------------------------

    const box = new THREE.Box3();

    box.setFromObject(
        arRoot
    );


    const size = box.getSize(
        new THREE.Vector3()
    );


    const maxSize = Math.max(
        size.x,
        size.y,
        size.z
    );


    /*
     * Por ahora queremos que el modelo
     * tenga aproximadamente 1 metro
     * en su dimensión más grande.
     */

    if (maxSize > 0) {

        const scale = 1 / maxSize;

        arRoot.scale.setScalar(
            scale
        );

    }


    // --------------------------------------------------------
    // CENTRAR MODELO
    // --------------------------------------------------------

    const scaledBox = new THREE.Box3();

    scaledBox.setFromObject(
        arRoot
    );


    const center = scaledBox.getCenter(
        new THREE.Vector3()
    );


    const min = scaledBox.min;


    arRoot.position.x -= center.x;

    arRoot.position.z -= center.z;

    arRoot.position.y -= min.y;


    console.log("Tamaño original:", size);

    console.log(
        "Escala AR:",
        arRoot.scale.x
    );

}


// ============================================================
// INICIALIZAR AR
// ============================================================

function initAR() {

    // --------------------------------------------------------
    // RENDERER AR
    // --------------------------------------------------------

    arRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    arRenderer.xr.enabled = true;

    arRenderer.setPixelRatio(
        window.devicePixelRatio
    );

    arRenderer.setClearColor(
        0x000000,
        0
    );


    // --------------------------------------------------------
    // CAMERA AR
    // --------------------------------------------------------

    arCamera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth /
        container.clientHeight,
        0.01,
        100
    );


    // --------------------------------------------------------
    // RETICLE
    // --------------------------------------------------------

    reticle = new THREE.Mesh(

        new THREE.RingGeometry(
            0.08,
            0.10,
            32
        ).rotateX(-Math.PI / 2),

        new THREE.MeshBasicMaterial()

    );


    reticle.matrixAutoUpdate = false;

    reticle.visible = false;


    world.scene.three.add(
        reticle
    );


    // --------------------------------------------------------
    // CONTROLLER
    // --------------------------------------------------------

    const controller =
        arRenderer.xr.getController(0);


    controller.addEventListener(
        "select",
        placeModel
    );


    // --------------------------------------------------------
    // AR BUTTON
    // --------------------------------------------------------

    const arButton =
        ARButton.createButton(
            arRenderer,
            {
                requiredFeatures: [
                    "hit-test"
                ]
            }
        );


    arButton.style.position = "absolute";

    arButton.style.bottom = "20px";

    arButton.style.left = "50%";

    arButton.style.transform =
        "translateX(-50%)";


    container.appendChild(
        arButton
    );


    // --------------------------------------------------------
    // ANIMATION LOOP
    // --------------------------------------------------------

    arRenderer.setAnimationLoop(
        renderAR
    );

}


// ============================================================
// COLOCAR MODELO
// ============================================================

function placeModel() {

    if (!reticle.visible) {
        return;
    }


    if (!arRoot) {
        return;
    }


    // --------------------------------------------------------
    // POSICIÓN
    // --------------------------------------------------------

    arRoot.position.setFromMatrixPosition(
        reticle.matrix
    );


    // --------------------------------------------------------
    // ROTACIÓN
    // --------------------------------------------------------

    const quaternion =
        new THREE.Quaternion();

    quaternion.setFromRotationMatrix(
        reticle.matrix
    );


    arRoot.quaternion.copy(
        quaternion
    );


    // --------------------------------------------------------
    // MOSTRAR MODELO
    // --------------------------------------------------------

    arRoot.visible = true;


    console.log(
        "Modelo colocado en AR"
    );

}


// ============================================================
// RENDER AR
// ============================================================

function renderAR(
    timestamp,
    frame
) {

    if (frame) {

        const referenceSpace =
            arRenderer.xr.getReferenceSpace();

        const session =
            arRenderer.xr.getSession();


        // ----------------------------------------------------
        // SOLICITAR HIT TEST
        // ----------------------------------------------------

        if (!hitTestSourceRequested) {

            session
                .requestReferenceSpace("viewer")
                .then(
                    (referenceSpace) => {

                        return session
                            .requestHitTestSource({
                                space: referenceSpace
                            });

                    }
                )
                .then(
                    (source) => {

                        hitTestSource =
                            source;

                    }
                );


            session.addEventListener(
                "end",
                () => {

                    hitTestSource = null;

                    hitTestSourceRequested =
                        false;

                    reticle.visible =
                        false;

                    if (arRoot) {
                        arRoot.visible =
                            false;
                    }

                }
            );


            hitTestSourceRequested =
                true;

        }


        // ----------------------------------------------------
        // HIT TEST
        // ----------------------------------------------------

        if (hitTestSource) {

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


                reticle.visible =
                    true;


                reticle.matrix.fromArray(
                    pose.transform.matrix
                );

            } else {

                reticle.visible =
                    false;

            }

        }

    }


    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    arRenderer.render(
        world.scene.three,
        arCamera
    );

}


// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
    "resize",
    () => {

        if (!container) {
            return;
        }


        const width =
            container.clientWidth;

        const height =
            container.clientHeight;


        if (arCamera) {

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

        await initViewer();


        const url =
            container.dataset.url;


        const type =
            container.dataset.type;


        if (
            type === "ifc"
        ) {

            await loadIFC(
                url
            );

        } else {

            console.error(
                "El archivo no es IFC"
            );

        }

    } catch (error) {

        console.error(
            "Error:",
            error
        );

    }

}


start();
