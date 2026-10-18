
const container = document.getElementById('viewer');

if (!container) {
    throw new Error('No se encontró #viewer');
}

const arUI = document.getElementById('ar-ui-container');
const opacitySlider = document.getElementById('ar-opacity');
const opacityText = document.getElementById('ar-opacity-value');

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
let arModelInstance = null;
let arHider = null;

let modelLoading = false;
let modelLoaded = false;
let isAR = false;
let opacityValue = 1;

let arPropertySets = new Map();
let arActiveFilters = [];
let arIndexModelId = null;


// =====================================================
// INICIALIZAR VISOR
// =====================================================

async function initViewer() {

    components = new OBC.Components();

    const worlds = components.get(OBC.Worlds);
    world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.scene.setup();

    world.scene.three.background = null;
    scene = world.scene.three;

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.xr.enabled = true;

    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
    );

    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    components.init();

    fragments = components.get(OBC.FragmentsManager);
    arHider = components.get(OBC.Hider);

    fragments.init('/engine/worker.mjs');


    // =================================================
    // MODELO FRAGMENTS CARGADO
    // =================================================

    fragments.list.onItemSet.add(async ({ value: model }) => {

        console.log('Modelo Fragments cargado');

        model.useCamera(camera);
        scene.add(model.object);

        arModelInstance = model;
        arModel = model.object;

        arModel.scale.set(1, 1, 1);
        arModel.visible = false;

        modelLoaded = true;
        modelLoading = false;

        fragments.core.update(true);

        setModelOpacity(opacityValue);

        // Construir índice de propiedades para este modelo.
        arIndexModelId = model.modelId;
        arPropertySets = await buildARPropertyIndex(model);

        buildARPropertyUI();
        initARPropertyFilters();

        console.log('Modelo preparado y filtros listos');
    });


    // =================================================
    // BOTÓN WEBXR
    // =================================================

    const arButton = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: {
            root: arUI
        }
    });

    document.body.appendChild(arButton);


    // =================================================
    // EVENTOS DEL DOM OVERLAY
    // =================================================

    if (arUI) {

        // Impide que una interacción HTML se convierta
        // también en una selección del mundo XR.
        arUI.addEventListener('beforexrselect', event => {
            event.preventDefault();
        });

        // El panel no debe enviar sus interacciones
        // a la lógica de colocación del modelo.
        arUI.addEventListener('pointerdown', event => {
            if (event.target.closest('#ar-property-filter, #ar-controls')) {
                event.stopPropagation();
            }
        });

        arUI.addEventListener('click', event => {
            if (event.target.closest('#ar-property-filter, #ar-controls')) {
                event.stopPropagation();
            }
        });

        arUI.addEventListener('dblclick', event => {
            if (event.target.closest('#ar-property-filter, #ar-controls')) {
                event.stopPropagation();
            }
        });
    }


    // =================================================
    // OPACIDAD
    // =================================================

    if (opacitySlider) {

        opacitySlider.addEventListener('input', () => {

            opacityValue = Number(opacitySlider.value) / 100;

            if (opacityText) {
                opacityText.textContent = `${opacitySlider.value}%`;
            }

            setModelOpacity(opacityValue);
        });
    }


    // =================================================
    // RETÍCULA
    // =================================================

    const reticleGeometry = new THREE.RingGeometry(0.08, 0.1, 32);
    reticleGeometry.rotateX(-Math.PI / 2);

    arReticle = new THREE.Mesh(
        reticleGeometry,
        new THREE.MeshBasicMaterial()
    );

    arReticle.matrixAutoUpdate = false;
    arReticle.visible = false;

    scene.add(arReticle);


    // =================================================
    // CONTROLADOR XR
    // =================================================

    arController = renderer.xr.getController(0);
    arController.addEventListener('select', onARSelect);

    scene.add(arController);


    // =================================================
    // SESIÓN AR INICIADA
    // =================================================

    renderer.xr.addEventListener('sessionstart', () => {

        isAR = true;
        hitTestSource = null;
        hitTestSourceRequested = false;

        if (arModel) {
            arModel.visible = false;
        }

        if (opacitySlider) {
            opacitySlider.value = Math.round(opacityValue * 100);
        }

        if (opacityText) {
            opacityText.textContent = `${Math.round(opacityValue * 100)}%`;
        }

        if (arUI) {
            arUI.style.display = 'block';
        }
    });


    // =================================================
    // SESIÓN AR FINALIZADA
    // =================================================

    renderer.xr.addEventListener('sessionend', () => {

        isAR = false;
        hitTestSource = null;
        hitTestSourceRequested = false;

        if (arReticle) {
            arReticle.visible = false;
        }

        if (arUI) {
            arUI.style.display = 'none';
        }

        if (arModel) {
            arModel.visible = true;
        }
    });


    // =================================================
    // ANIMATION LOOP
    // =================================================

    renderer.setAnimationLoop((timestamp, frame) => {

        updateAR(frame);

        if (isAR && arModel) {
            fragments.core.update();
        }

        renderer.render(scene, camera);
    });


    window.addEventListener('resize', onResize);

    if (arUI) {
        arUI.style.display = 'none';
    }
}


// =====================================================
// INDEXAR PROPERTY SETS
// =====================================================

async function buildARPropertyIndex(model) {

    const items = await model.getItems();
    const ids = Array.from(items.keys());

    const data = await model.getItemsData(ids, {
        attributesDefault: true,
        relations: {
            IsDefinedBy: {
                attributes: true,
                relations: true
            },
            IsTypedBy: {
                attributes: true,
                relations: true
            }
        }
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
                    ) {
                        continue;
                    }

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

            for (const child of Object.values(node)) {

                if (Array.isArray(child)) {
                    child.forEach(traverse);
                } else if (child && typeof child === 'object') {
                    traverse(child);
                }
            }
        }

        traverse(item);
    }

    return propertySets;
}


// =====================================================
// SELECTORES DE FILTROS
// =====================================================

function fillARSelect(select, placeholder, values) {

    select.innerHTML = '';

    const option = document.createElement('option');
    option.value = '';
    option.textContent = placeholder;

    select.appendChild(option);

    for (const value of values) {

        const item = document.createElement('option');
        item.value = value;
        item.textContent = value;

        select.appendChild(item);
    }

    select.disabled = values.length === 0;
}


function buildARPropertyUI() {

    const select = document.getElementById('ar-pset');

    if (!select) return;

    fillARSelect(
        select,
        'Seleccionar conjunto',
        Array.from(arPropertySets.keys()).sort()
    );

    fillARSelect(
        document.getElementById('ar-property'),
        'Seleccionar propiedad',
        []
    );

    fillARSelect(
        document.getElementById('ar-property-value'),
        'Seleccionar valor',
        []
    );

    document.getElementById('ar-apply-filter').disabled = true;
}


// =====================================================
// REGISTRAR EVENTOS UNA SOLA VEZ
// =====================================================

function initARPropertyFilters() {

    const pset = document.getElementById('ar-pset');
    const property = document.getElementById('ar-property');
    const value = document.getElementById('ar-property-value');
    const apply = document.getElementById('ar-apply-filter');
    const clear = document.getElementById('ar-clear-filters');

    if (!pset || pset.dataset.initialized) return;

    pset.dataset.initialized = 'true';

    pset.addEventListener('change', () => {

        const properties = arPropertySets.get(pset.value);

        fillARSelect(
            property,
            'Seleccionar propiedad',
            properties ? Array.from(properties.keys()).sort() : []
        );

        fillARSelect(value, 'Seleccionar valor', []);
        apply.disabled = true;
    });

    property.addEventListener('change', () => {

        const properties = arPropertySets.get(pset.value);
        const values = properties?.get(property.value);

        fillARSelect(
            value,
            'Seleccionar valor',
            values ? Array.from(values.keys()).sort() : []
        );

        apply.disabled = true;
    });

    value.addEventListener('change', () => {
        apply.disabled = !value.value;
    });

    apply.addEventListener('click', async event => {

        event.preventDefault();
        event.stopPropagation();

        if (!pset.value || !property.value || !value.value) return;

        const filter = {
            pset: pset.value,
            property: property.value,
            value: value.value
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

    clear.addEventListener('click', async event => {

        event.preventDefault();
        event.stopPropagation();

        arActiveFilters = [];

        renderARActiveFilters();

        await applyARPropertyFilters();
    });
}


// =====================================================
// MOSTRAR FILTROS ACTIVOS
// =====================================================

function renderARActiveFilters() {

    const container = document.getElementById('ar-active-filters');

    if (!container) return;

    container.innerHTML = '';

    if (!arActiveFilters.length) {

        const empty = document.createElement('div');
        empty.className = 'small';
        empty.textContent = 'Sin filtros activos';

        container.appendChild(empty);

        return;
    }

    arActiveFilters.forEach((filter, index) => {

        const row = document.createElement('div');
        row.className = 'ar-filter-item';

        const text = document.createElement('span');

        text.textContent =
            `${filter.pset} · ${filter.property}: ${filter.value}`;

        const button = document.createElement('button');

        button.type = 'button';
        button.textContent = '×';
        button.setAttribute('aria-label', 'Eliminar filtro');

        button.addEventListener('click', async event => {

            event.preventDefault();
            event.stopPropagation();

            arActiveFilters.splice(index, 1);

            renderARActiveFilters();

            await applyARPropertyFilters();
        });

        row.append(text, button);

        container.appendChild(row);
    });
}


// =====================================================
// APLICAR FILTROS
// =====================================================

async function applyARPropertyFilters() {

    if (!arModelInstance || !arHider || !arIndexModelId) {
        return;
    }

    const allItems = await arModelInstance.getItems();

    let ids = new Set(allItems.keys());

    const groups = new Map();

    for (const filter of arActiveFilters) {

        const key = `${filter.pset}|||${filter.property}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        groups.get(key).push(filter);
    }

    // OR entre valores de la misma propiedad.
    // AND entre propiedades diferentes.
    for (const filters of groups.values()) {

        const matchingIds = new Set();

        for (const filter of filters) {

            const propertyIds = arPropertySets
                .get(filter.pset)
                ?.get(filter.property)
                ?.get(filter.value);

            if (propertyIds) {
                for (const id of propertyIds) {
                    matchingIds.add(id);
                }
            }
        }

        ids = new Set(
            [...ids].filter(id => matchingIds.has(id))
        );
    }

    const modelIdMap = {
        [arIndexModelId]: ids
    };

    await arHider.set(false);
    await arHider.set(true, modelIdMap);

    fragments.core.update(true);
}


// =====================================================
// OPACIDAD
// =====================================================

function setModelOpacity(opacity) {

    const value = THREE.MathUtils.clamp(opacity, 0, 1);

    if (!arModel) return;

    arModel.traverse(object => {

        if (!object.isMesh || !object.material) return;

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

        materials.forEach(material => {

            if (!material.userData.opacityOriginal) {

                material.userData.opacityOriginal = {
                    opacity: material.opacity,
                    transparent: material.transparent,
                    depthWrite: material.depthWrite,
                    depthTest: material.depthTest,
                    side: material.side,
                    alphaTest: material.alphaTest,
                    blending: material.blending
                };
            }

            const original = material.userData.opacityOriginal;

            material.opacity = original.opacity * value;

            if (value < 1) {
                material.transparent = true;
            } else {
                material.transparent = original.transparent;
            }

            material.depthWrite = original.depthWrite;
            material.depthTest = original.depthTest;
            material.side = original.side;
            material.alphaTest = original.alphaTest;
            material.blending = original.blending;

            material.needsUpdate = true;
        });
    });

    if (fragments) {
        fragments.core.update(true);
    }
}


// =====================================================
// COLOCAR / CARGAR MODELO
// =====================================================

async function onARSelect() {

    if (!isAR || !arReticle?.visible) return;

    const position = new THREE.Vector3();

    position.setFromMatrixPosition(arReticle.matrix);

    // Si ya está cargado, moverlo.
    if (modelLoaded && arModel) {

        arModel.position.copy(position);
        arModel.visible = true;

        return;
    }

    if (modelLoading) return;

    modelLoading = true;

    const url = container.dataset.url;

    if (!url) {

        console.error('No existe data-url en #viewer');

        modelLoading = false;

        return;
    }

    try {

        const response = await fetch(url + '?type=frag');

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();

        await fragments.core.load(buffer, {
            modelId: 'main'
        });

        // La preparación del modelo y su índice de
        // propiedades se realiza en onItemSet.

        if (arModel) {

            arModel.position.copy(position);
            arModel.scale.set(1, 1, 1);
            arModel.visible = true;

            setModelOpacity(opacityValue);

            fragments.core.update(true);
        }

    } catch (error) {

        console.error('Error cargando IFC:', error);

        modelLoading = false;
    }
}


// =====================================================
// HIT TEST
// =====================================================

function updateAR(frame) {

    if (!frame) return;

    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!referenceSpace || !session) return;

    if (!hitTestSourceRequested) {

        hitTestSourceRequested = true;

        session.requestReferenceSpace('viewer')
            .then(viewerSpace => {
                return session.requestHitTestSource({
                    space: viewerSpace
                });
            })
            .then(source => {
                hitTestSource = source;
            })
            .catch(error => {
                console.error('Error creando Hit Test:', error);
                hitTestSourceRequested = false;
            });

        session.addEventListener('end', () => {

            hitTestSourceRequested = false;
            hitTestSource = null;

            if (arReticle) {
                arReticle.visible = false;
            }
        }, { once: true });
    }

    if (!hitTestSource) return;

    const results = frame.getHitTestResults(hitTestSource);

    if (!results.length) {

        arReticle.visible = false;

        return;
    }

    const pose = results[0].getPose(referenceSpace);

    if (pose) {

        arReticle.visible = true;

        arReticle.matrix.fromArray(pose.transform.matrix);
    }
}


// =====================================================
// RESIZE
// =====================================================

function onResize() {

    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}


// =====================================================
// INICIAR
// =====================================================

initViewer().catch(error => {
    console.error('No se pudo iniciar el visor:', error);
});
