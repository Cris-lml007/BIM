// =====================================================
// CONTENEDOR
// =====================================================

const container =
    document.getElementById('viewer');

if (!container) {
    throw new Error(
        'No se encontró el elemento #viewer'
    );
}


// =====================================================
// UI DOM OVERLAY
// =====================================================

const arUI =
    document.getElementById('ar-ui-container');

const opacitySlider =
    document.getElementById('ar-opacity');

const opacityText =
    document.getElementById('ar-opacity-value');


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


// =====================================================
// INICIALIZAR VISOR
// =====================================================

async function initViewer() {

    // =================================================
    // THAT OPEN
    // =================================================

    components =
        new OBC.Components();


    const worlds =
        components.get(
            OBC.Worlds
        );


    world =
        worlds.create();


    world.scene =
        new OBC.SimpleScene(
            components
        );


    world.scene.setup();


    world.scene.three.background =
        null;


    scene =
        world.scene.three;


    // =================================================
    // WEBGL RENDERER
    // =================================================

    renderer =
        new THREE.WebGLRenderer({
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


    // -------------------------------------------------
    // ACTIVAR WEBXR
    // -------------------------------------------------

    renderer.xr.enabled =
        true;


    container.appendChild(
        renderer.domElement
    );


    // =================================================
    // CAMERA
    // =================================================

    camera =
        new THREE.PerspectiveCamera(
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
    // COMPONENTS
    // =================================================

    components.init();


    // =================================================
    // FRAGMENTS
    // =================================================

    fragments =
        components.get(
            OBC.FragmentsManager
        );


    fragments.init(
        '/engine/worker.mjs'
    );


    // =================================================
    // CUANDO SE CARGA EL MODELO
    // =================================================

    fragments.list.onItemSet.add(
        ({ value: model }) => {

            console.log(
                'Modelo Fragments cargado'
            );


            // -------------------------------------------------
            // CÁMARA
            // -------------------------------------------------

            model.useCamera(
                camera
            );


            // -------------------------------------------------
            // AGREGAR MODELO A LA ESCENA
            // -------------------------------------------------

            scene.add(
                model.object
            );


            arModel =
                model.object;


            // -------------------------------------------------
            // ESCALA
            // -------------------------------------------------

            arModel.scale.set(
                0.1,
                0.1,
                0.1
            );


            // -------------------------------------------------
            // OCULTO HASTA COLOCAR
            // -------------------------------------------------

            arModel.visible =
                false;


            modelLoaded =
                true;


            modelLoading =
                false;


            // -------------------------------------------------
            // ACTUALIZAR FRAGMENTS
            // -------------------------------------------------

            fragments.core.update(
                true
            );


            // -------------------------------------------------
            // APLICAR OPACIDAD ACTUAL
            // -------------------------------------------------

            setModelOpacity(
                opacityValue
            );


            console.log(
                'Modelo preparado'
            );
        }
    );


    // =================================================
    // BOTÓN AR
    // =================================================

    const arButton =
        ARButton.createButton(
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


    document.body.appendChild(
        arButton
    );


    // =================================================
    // CONFIGURAR SLIDER
    // =================================================

    if (opacitySlider) {

        opacitySlider.addEventListener(
            'input',
            () => {

                opacityValue =
                    Number(
                        opacitySlider.value
                    ) / 100;


                // -------------------------------------------------
                // ACTUALIZAR TEXTO
                // -------------------------------------------------

                if (opacityText) {

                    opacityText.textContent =
                        `${opacitySlider.value}%`;
                }


                // -------------------------------------------------
                // CAMBIAR MODELO
                // -------------------------------------------------

                setModelOpacity(
                    opacityValue
                );
            }
        );
    }


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
    // INICIO DE AR
    // =================================================

    renderer.xr.addEventListener(
        'sessionstart',
        () => {

            console.log(
                'AR iniciado'
            );


            isAR =
                true;


            hitTestSource =
                null;


            hitTestSourceRequested =
                false;


            // -------------------------------------------------
            // OCULTAR MODELO
            // -------------------------------------------------

            if (arModel) {

                arModel.visible =
                    false;
            }


            // -------------------------------------------------
            // SINCRONIZAR SLIDER
            // -------------------------------------------------

            if (opacitySlider) {

                opacitySlider.value =
                    Math.round(
                        opacityValue * 100
                    );
            }


            if (opacityText) {

                opacityText.textContent =
                    `${Math.round(
                        opacityValue * 100
                    )}%`;
            }


            // -------------------------------------------------
            // MOSTRAR DOM OVERLAY
            // -------------------------------------------------

            if (arUI) {

                arUI.style.display =
                    'block';
            }
        }
    );


    // =================================================
    // FIN DE AR
    // =================================================

    renderer.xr.addEventListener(
        'sessionend',
        () => {

            console.log(
                'AR finalizado'
            );


            isAR =
                false;


            hitTestSource =
                null;


            hitTestSourceRequested =
                false;


            // -------------------------------------------------
            // OCULTAR RETICLE
            // -------------------------------------------------

            if (arReticle) {

                arReticle.visible =
                    false;
            }


            // -------------------------------------------------
            // OCULTAR DOM OVERLAY
            // -------------------------------------------------

            if (arUI) {

                arUI.style.display =
                    'none';
            }


            // -------------------------------------------------
            // MOSTRAR MODELO
            // -------------------------------------------------

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

            updateAR(
                frame
            );


            // -------------------------------------------------
            // FRAGMENTS
            // -------------------------------------------------

            if (
                isAR &&
                arModel
            ) {

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


    // =================================================
    // OCULTAR UI FUERA DE AR
    // =================================================

    if (arUI) {

        arUI.style.display =
            'none';
    }
}


// =====================================================
// CAMBIAR OPACIDAD DEL MODELO
// =====================================================

function setModelOpacity(opacity) {

    const value =
        THREE.MathUtils.clamp(
            opacity,
            0,
            1
        );


    if (!arModel) {
        return;
    }


    arModel.traverse(
        (object) => {

            if (
                !object.isMesh ||
                !object.material
            ) {

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

                    // ==========================================
                    // GUARDAR ESTADO ORIGINAL
                    // ==========================================

                    if (
                        !material.userData.opacityOriginal
                    ) {

                        material.userData.opacityOriginal = {

                            opacity:
                                material.opacity,

                            transparent:
                                material.transparent,

                            depthWrite:
                                material.depthWrite,

                            depthTest:
                                material.depthTest,

                            side:
                                material.side,

                            alphaTest:
                                material.alphaTest,

                            blending:
                                material.blending
                        };
                    }


                    const original =
                        material.userData.opacityOriginal;


                    // ==========================================
                    // 100%
                    // ==========================================

                    if (
                        value >= 1
                    ) {

                        material.opacity =
                            original.opacity;


                        material.transparent =
                            original.transparent;


                        material.depthWrite =
                            original.depthWrite;


                        material.depthTest =
                            original.depthTest;


                        material.side =
                            original.side;


                        material.alphaTest =
                            original.alphaTest;


                        material.blending =
                            original.blending;
                    }


                    // ==========================================
                    // MENOS DE 100%
                    // ==========================================

                    else {

                        // -------------------------------------------------
                        // REDUCIR OPACIDAD
                        // -------------------------------------------------

                        material.opacity =
                            original.opacity *
                            value;


                        // -------------------------------------------------
                        // MATERIAL ORIGINALMENTE TRANSPARENTE
                        // -------------------------------------------------

                        if (
                            original.transparent
                        ) {

                            material.transparent =
                                true;
                        }


                        // -------------------------------------------------
                        // MATERIAL ORIGINALMENTE OPACO
                        // -------------------------------------------------

                        else {

                            material.transparent =
                                true;
                        }


                        // -------------------------------------------------
                        // CONSERVAR ESTADO ORIGINAL
                        // -------------------------------------------------

                        material.depthWrite =
                            original.depthWrite;


                        material.depthTest =
                            original.depthTest;


                        material.side =
                            original.side;


                        material.alphaTest =
                            original.alphaTest;


                        material.blending =
                            original.blending;
                    }


                    material.needsUpdate =
                        true;
                }
            );
        }
    );


    // =================================================
    // ACTUALIZAR FRAGMENTS
    // =================================================

    if (fragments) {

        fragments.core.update(
            true
        );
    }
}


// =====================================================
// SELECT EN AR
// =====================================================

async function onARSelect() {

    if (!isAR) {
        return;
    }


    // =================================================
    // COMPROBAR RETICLE
    // =================================================

    if (
        !arReticle ||
        !arReticle.visible
    ) {

        return;
    }


    // =================================================
    // OBTENER POSICIÓN
    // =================================================

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


    modelLoading =
        true;


    // =================================================
    // URL
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


            // -------------------------------------------------
            // APLICAR OPACIDAD ACTUAL
            // -------------------------------------------------

            setModelOpacity(
                opacityValue
            );


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


    if (!referenceSpace ||
        !session) {

        return;
    }


    // =================================================
    // CREAR HIT TEST SOURCE
    // =================================================

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
                            space: viewerSpace
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

                    console.error(
                        'Error creando Hit Test:',
                        error
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


    // =================================================
    // RESULTADOS HIT TEST
    // =================================================

    if (hitTestSource) {

        const hitTestResults =
            frame.getHitTestResults(
                hitTestSource
            );


        if (
            hitTestResults.length
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

initViewer()
    .catch(
        (error) => {

            console.error(
                'No se pudo iniciar el visor:',
                error
            );
        }
    );
