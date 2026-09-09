
// =====================================================
// CONTENEDOR
// =====================================================

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
// UI AR
// =====================================================

let arUI = null;

let opacityBar = null;
let opacityKnob = null;

let opacityValue = 1;

let opacityDragging = false;


// =====================================================
// RAYCASTER PARA LA UI
// =====================================================

const uiRaycaster = new THREE.Raycaster();


// =====================================================
// INICIALIZAR VISOR
// =====================================================

async function initViewer() {

    // =================================================
    // THAT OPEN
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
    // CAMERA
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


            model.useCamera(
                camera
            );


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

            setModelOpacity(
                opacityValue
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
        'selectstart',
        onARSelectStart
    );


    arController.addEventListener(
        'selectend',
        onARSelectEnd
    );


    arController.addEventListener(
        'select',
        onARSelect
    );


    scene.add(
        arController
    );


    // =================================================
    // CREAR HUD AR
    // =================================================

    createARUI();


    // =================================================
    // INICIO DE AR
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


            // -------------------------------------------------
            // OCULTAR MODELO
            // -------------------------------------------------

            if (arModel) {

                arModel.visible =
                    false;
            }


            // -------------------------------------------------
            // MOSTRAR UI
            // -------------------------------------------------

            if (arUI) {

                arUI.visible =
                    true;
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


            isAR = false;


            hitTestSource =
                null;

            hitTestSourceRequested =
                false;


            opacityDragging =
                false;


            // -------------------------------------------------
            // OCULTAR RETICLE
            // -------------------------------------------------

            if (arReticle) {

                arReticle.visible =
                    false;
            }


            // -------------------------------------------------
            // OCULTAR UI
            // -------------------------------------------------

            if (arUI) {

                arUI.visible =
                    false;
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

            updateAR(frame);


            // -------------------------------------------------
            // ACTUALIZAR SLIDER
            // -------------------------------------------------

            if (
                isAR &&
                opacityDragging
            ) {

                updateOpacitySlider();
            }


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
}


// =====================================================
// CREAR UI AR
// =====================================================

function createARUI() {

    arUI =
        new THREE.Group();


    // -------------------------------------------------
    // POSICIÓN DEL HUD
    // -------------------------------------------------

    arUI.position.set(
        0,
        -0.35,
        -1.2
    );


    // =================================================
    // PANEL
    // =================================================

    const panelGeometry =
        new THREE.PlaneGeometry(
            0.8,
            0.25
        );


    const panelMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x111111,
            transparent: true,
            opacity: 0.85,
            depthTest: false
        });


    const panel =
        new THREE.Mesh(
            panelGeometry,
            panelMaterial
        );


    panel.renderOrder =
        100;


    arUI.add(
        panel
    );


    // =================================================
    // BARRA
    // =================================================

    const barGeometry =
        new THREE.PlaneGeometry(
            0.55,
            0.025
        );


    const barMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            depthTest: false
        });


    opacityBar =
        new THREE.Mesh(
            barGeometry,
            barMaterial
        );


    opacityBar.position.set(
        0,
        -0.02,
        0.02
    );


    opacityBar.renderOrder =
        101;


    arUI.add(
        opacityBar
    );


    // =================================================
    // KNOB
    // =================================================

    const knobGeometry =
        new THREE.CircleGeometry(
            0.045,
            32
        );


    const knobMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x4f46e5,
            depthTest: false
        });


    opacityKnob =
        new THREE.Mesh(
            knobGeometry,
            knobMaterial
        );


    opacityKnob.position.set(
        0.275,
        -0.02,
        0.03
    );


    opacityKnob.renderOrder =
        102;


    arUI.add(
        opacityKnob
    );


    // =================================================
    // TEXTO
    // =================================================

    const label =
        createTextSprite(
            'OPACIDAD'
        );


    label.position.set(
        -0.28,
        0.055,
        0.03
    );


    label.scale.set(
        0.22,
        0.07,
        1
    );


    arUI.add(
        label
    );


    // =================================================
    // VALOR
    // =================================================

    const value =
        createTextSprite(
            '100%'
        );


    value.name =
        'opacity-value';


    value.position.set(
        0.28,
        0.055,
        0.03
    );


    value.scale.set(
        0.14,
        0.06,
        1
    );


    arUI.add(
        value
    );


    // =================================================
    // OCULTAR INICIALMENTE
    // =================================================

    arUI.visible =
        false;


    // =================================================
    // AGREGAR A CÁMARA
    // =================================================

    camera.add(
        arUI
    );


    scene.add(
        camera
    );
}


// =====================================================
// CREAR TEXTO
// =====================================================

function createTextSprite(text) {

    const canvas =
        document.createElement(
            'canvas'
        );


    canvas.width =
        512;

    canvas.height =
        128;


    const context =
        canvas.getContext(
            '2d'
        );


    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    context.font =
        'bold 48px Arial';


    context.fillStyle =
        'white';


    context.textAlign =
        'center';


    context.textBaseline =
        'middle';


    context.fillText(
        text,
        canvas.width / 2,
        canvas.height / 2
    );


    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    texture.needsUpdate =
        true;


    const material =
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false
        });


    const sprite =
        new THREE.Sprite(
            material
        );


    sprite.userData.canvas =
        canvas;

    sprite.userData.context =
        context;


    return sprite;
}


// =====================================================
// ACTUALIZAR TEXTO DE OPACIDAD
// =====================================================

function updateOpacityText(value) {

    if (!arUI) {
        return;
    }


    const sprite =
        arUI.getObjectByName(
            'opacity-value'
        );


    if (!sprite) {
        return;
    }


    const canvas =
        sprite.userData.canvas;


    const context =
        sprite.userData.context;


    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    context.font =
        'bold 48px Arial';


    context.fillStyle =
        'white';


    context.textAlign =
        'center';


    context.textBaseline =
        'middle';


    context.fillText(
        `${Math.round(value * 100)}%`,
        canvas.width / 2,
        canvas.height / 2
    );


    sprite.material.map.needsUpdate =
        true;
}


// =====================================================
// ACTUALIZAR POSICIÓN DEL KNOB
// =====================================================

function updateOpacityKnob(value) {

    if (!opacityKnob) {
        return;
    }


    const minX =
        -0.275;

    const maxX =
        0.275;


    opacityKnob.position.x =
        THREE.MathUtils.lerp(
            minX,
            maxX,
            value
        );
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

    console.log('Opacidad:', value);

    const text =
        document.getElementById('opacity-value');

    text.textContent =
        `${Math.round(value * 100)}%`;


    if (!arModel) {
        return;
    }


    arModel.traverse((object) => {

        if (!object.isMesh || !object.material) {
            return;
        }


        const materials =
            Array.isArray(object.material)
                ? object.material
                : [object.material];


        materials.forEach((material) => {

            // ==========================================
            // GUARDAR ORIGINAL
            // ==========================================

            if (!material.userData.opacityOriginal) {

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

                console.log(
                    'Guardando material original:',
                    material.userData.opacityOriginal
                );
            }


            const original =
                material.userData.opacityOriginal;


            // ==========================================
            // 100%
            // ==========================================

            if (value >= 1) {

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
            // < 100%
            // ==========================================

            else {

                material.opacity =
                    original.opacity * value;

                material.transparent =
                    true;

                /*
                 * IMPORTANTE:
                 * No modificamos depthWrite.
                 */
            }


            material.needsUpdate = true;
        });
    });


    /*
     * Forzar actualización de Fragments
     */
    if (fragments) {
        fragments.core.update(true);
    }
}


// =====================================================
// SELECCIONAR / TOCAR
// =====================================================

function onARSelectStart() {

    if (!isAR) {
        return;
    }


    // -------------------------------------------------
    // COMPROBAR SI TOCÓ EL SLIDER
    // -------------------------------------------------

    if (isControllerOverSlider()) {

        opacityDragging =
            true;

        updateOpacitySlider();

        return;
    }
}


// =====================================================
// SOLTAR
// =====================================================

function onARSelectEnd() {

    opacityDragging =
        false;
}


// =====================================================
// SELECT
// =====================================================

async function onARSelect() {

    if (!isAR) {
        return;
    }


    // Si estaba interactuando
    // con el slider, no colocar modelo

    if (isControllerOverSlider()) {

        return;
    }


    // -------------------------------------------------
    // COMPROBAR RETICLE
    // -------------------------------------------------

    if (
        !arReticle ||
        !arReticle.visible
    ) {

        return;
    }


    // -------------------------------------------------
    // POSICIÓN
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
        // COLOCAR
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
// SABER SI EL CONTROLLER ESTÁ SOBRE EL SLIDER
// =====================================================

function isControllerOverSlider() {

    if (
        !arUI ||
        !arUI.visible ||
        !opacityBar
    ) {

        return false;
    }


    // -------------------------------------------------
    // MATRIZ DEL CONTROLLER
    // -------------------------------------------------

    const origin =
        new THREE.Vector3();


    const direction =
        new THREE.Vector3(
            0,
            0,
            -1
        );


    origin.setFromMatrixPosition(
        arController.matrixWorld
    );


    direction.applyQuaternion(
        arController.quaternion
    );


    direction.normalize();


    // -------------------------------------------------
    // RAYCAST
    // -------------------------------------------------

    uiRaycaster.set(
        origin,
        direction
    );


    const intersects =
        uiRaycaster.intersectObject(
            opacityBar,
            false
        );


    return intersects.length > 0;
}


// =====================================================
// ACTUALIZAR SLIDER DURANTE DRAG
// =====================================================

function updateOpacitySlider() {

    if (
        !opacityDragging ||
        !opacityBar
    ) {

        return;
    }


    // -------------------------------------------------
    // RAY DEL CONTROLLER
    // -------------------------------------------------

    const origin =
        new THREE.Vector3();


    const direction =
        new THREE.Vector3(
            0,
            0,
            -1
        );


    origin.setFromMatrixPosition(
        arController.matrixWorld
    );


    direction.applyQuaternion(
        arController.quaternion
    );


    direction.normalize();


    uiRaycaster.set(
        origin,
        direction
    );


    // -------------------------------------------------
    // INTERSECCIÓN
    // -------------------------------------------------

    const intersects =
        uiRaycaster.intersectObject(
            opacityBar,
            false
        );


    if (!intersects.length) {
        return;
    }


    const point =
        intersects[0].point;


    // -------------------------------------------------
    // CONVERTIR A COORDENADAS DEL SLIDER
    // -------------------------------------------------

    const localPoint =
        opacityBar.worldToLocal(
            point.clone()
        );


    // -------------------------------------------------
    // RANGO
    // -------------------------------------------------

    const minX =
        -0.275;

    const maxX =
        0.275;


    const x =
        THREE.MathUtils.clamp(
            localPoint.x,
            minX,
            maxX
        );


    // -------------------------------------------------
    // CONVERTIR A 0-1
    // -------------------------------------------------

    const value =
        (x - minX) /
        (maxX - minX);


    // -------------------------------------------------
    // APLICAR
    // -------------------------------------------------

    setModelOpacity(
        value
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
    // HIT TEST SOURCE
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
    // RESULTADOS
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
