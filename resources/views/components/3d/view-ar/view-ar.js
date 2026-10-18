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

let arModelData = new Map();
let arPropertySets = new Map();
let arActiveFilters = [];
let arHider;



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
        async ({ value: model }) => {

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
                1,
                1,
                1
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

arModelData.set(model.modelId, model);

arPropertySets = await buildARPropertyIndex(model);

buildARPropertyUI();
initARPropertyFilters();
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
                1,
                1,
                1
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

arHider = components.get(OBC.Hider);

async function buildARPropertyIndex(model) {

    const items = await model.getItems();
    const ids = Array.from(items.keys());

    const data = await model.getItemsData(ids, {
        attributesDefault: true,
        relations: {
            IsDefinedBy: {
                attributes: true,
                relations: true,
            },
            IsTypedBy: {
                attributes: true,
                relations: true,
            },
        },
    });

    const propertySets = new Map();

    for (const item of data) {

        const id = item._localId?.value;

        if (id === undefined) continue;

        const visited = new Set();

        function traverse(node) {

            if (!node || typeof node !== 'object') return;
            if (visited.has(node)) return;

            visited.add(node);

            if (node._category?.value === 'IFCPROPERTYSET') {

                const setName = node.Name?.value ?? 'Sin nombre';

                if (!propertySets.has(setName)) {
                    propertySets.set(setName, new Map());
                }

                const properties = propertySets.get(setName);

                for (const property of node.HasProperties ?? []) {

                    const name = property.Name?.value;
                    const rawValue = property.NominalValue?.value;

                    if (
                        !name ||
                        rawValue === null ||
                        rawValue === undefined ||
                        rawValue === ''
                    ) continue;

                    const value = String(rawValue);

                    if (!properties.has(name)) {
                        properties.set(name, new Map());
                    }

                    const values = properties.get(name);

                    if (!values.has(value)) {
                        values.set(value, new Set());
                    }

                    values.get(value).add(id);
                }
            }

            for (const value of Object.values(node)) {

                if (Array.isArray(value)) {
                    value.forEach(traverse);
                } else if (value && typeof value === 'object') {
                    traverse(value);
                }
            }
        }

        traverse(item);
    }

    return propertySets;
}

function buildARPropertyUI() {

    const psetSelect = document.getElementById('ar-pset');
    if (!psetSelect) return;

    psetSelect.innerHTML =
        '<option value="">Seleccionar conjunto</option>';

    for (const name of arPropertySets.keys()) {

        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;

        psetSelect.appendChild(option);
    }
}

function fillARSelect(select, placeholder, values) {

    select.innerHTML = '';

    const first = document.createElement('option');
    first.value = '';
    first.textContent = placeholder;
    select.appendChild(first);

    for (const value of values) {

        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;

        select.appendChild(option);
    }

    select.disabled = values.length === 0;
}

function initARPropertyFilters() {

    const psetSelect = document.getElementById('ar-pset');
    const propertySelect = document.getElementById('ar-property');
    const valueSelect = document.getElementById('ar-property-value');
    const applyButton = document.getElementById('ar-apply-filter');

    if (!psetSelect || psetSelect.dataset.initialized) return;

    psetSelect.dataset.initialized = 'true';

    psetSelect.addEventListener('change', () => {

        const properties = arPropertySets.get(psetSelect.value);

        fillARSelect(
            propertySelect,
            'Seleccionar propiedad',
            properties ? Array.from(properties.keys()).sort() : []
        );

        fillARSelect(valueSelect, 'Seleccionar valor', []);
        applyButton.disabled = true;
    });

    propertySelect.addEventListener('change', () => {

        const properties = arPropertySets.get(psetSelect.value);
        const values = properties?.get(propertySelect.value);

        fillARSelect(
            valueSelect,
            'Seleccionar valor',
            values ? Array.from(values.keys()).sort() : []
        );

        applyButton.disabled = true;
    });

    valueSelect.addEventListener('change', () => {
        applyButton.disabled = !valueSelect.value;
    });

    applyButton.addEventListener('click', async () => {

        const filter = {
            pset: psetSelect.value,
            property: propertySelect.value,
            value: valueSelect.value,
        };

        const exists = arActiveFilters.some(item =>
            item.pset === filter.pset &&
            item.property === filter.property &&
            item.value === filter.value
        );

        if (!exists) {
            arActiveFilters.push(filter);
        }

        renderARActiveFilters();
        await applyARPropertyFilters();
    });

    document.getElementById('ar-clear-filters')
        ?.addEventListener('click', async () => {

            arActiveFilters = [];

            renderARActiveFilters();
            await applyARPropertyFilters();
        });
}

async function applyARPropertyFilters() {

    if (!arModelData.size) return;

    const modelIdMap = {};

    for (const [modelId, model] of arModelData) {

        const allItems = await model.getItems();
        let ids = new Set(allItems.keys());

        const grouped = new Map();

        for (const filter of arActiveFilters) {

            const key = `${filter.pset}|||${filter.property}`;

            if (!grouped.has(key)) {
                grouped.set(key, []);
            }

            grouped.get(key).push(filter);
        }

        const propertySets = arPropertySets;

        for (const filters of grouped.values()) {

            const matchingIds = new Set();

            for (const filter of filters) {

                const values = propertySets
                    .get(filter.pset)
                    ?.get(filter.property);

                const propertyIds = values?.get(filter.value);

                if (propertyIds) {
                    for (const id of propertyIds) {
                        matchingIds.add(id);
                    }
                }
            }

            ids = new Set([...ids].filter(id => matchingIds.has(id)));
        }

        modelIdMap[modelId] = ids;
    }

    await arHider.set(false);
    await arHider.set(true, modelIdMap);

    fragments.core.update(true);
}

function renderARActiveFilters() {

    const container = document.getElementById('ar-active-filters');
    if (!container) return;

    container.innerHTML = '';

    if (!arActiveFilters.length) {
        container.innerHTML =
            '<div class="small text-light">Sin filtros activos</div>';
        return;
    }

    arActiveFilters.forEach((filter, index) => {

        const row = document.createElement('div');

        row.className =
            'd-flex justify-content-between align-items-center gap-2 small mb-1';

        const label = document.createElement('span');
        label.textContent =
            `${filter.pset} · ${filter.property}: ${filter.value}`;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-outline-light';
        button.textContent = '×';

        button.addEventListener('click', async () => {
            arActiveFilters.splice(index, 1);
            renderARActiveFilters();
            await applyARPropertyFilters();
        });

        row.append(label, button);
        container.appendChild(row);
    });
}
