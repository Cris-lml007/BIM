
const container = document.getElementById('viewer');

if (!container) {
    throw new Error('No se encontró el elemento #viewer');
}

const arUI = document.getElementById('ar-ui-container');
const opacitySlider = document.getElementById('ar-opacity');
const opacityText = document.getElementById('ar-opacity-value');

let components;
let world;
let fragments;
let hider;

let renderer;
let scene;
let camera;

let arController;
let arReticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

let arModel = null;
let bimModel = null;
let bimModelId = null;

let modelLoading = false;
let modelLoaded = false;
let isAR = false;
let opacityValue = 1;

let modelCategories = new Map();
let modelProperties = new Map();
let allModelIds = [];
let activePropertyFilters = [];
let categoryVisibility = new Map();
let filterUIReady = false;

// =====================================================
// INICIALIZACIÓN
// =====================================================

async function initViewer() {
    try {
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
        renderer.setSize(
            container.clientWidth,
            container.clientHeight
        );

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
        hider = components.get(OBC.Hider);

        await fragments.init('/engine/worker.mjs');

        // Registrar el evento antes de cargar cualquier modelo.
        fragments.list.onItemSet.add(async ({ key, value: model }) => {
            try {
                console.log('Modelo Fragments registrado:', key);

                model.useCamera(camera);
                scene.add(model.object);

                // Guardamos por separado el objeto Three.js
                // y el modelo BIM administrado por Fragments.
                bimModel = model;
                bimModelId = key;
                arModel = model.object;

                arModel.scale.set(1, 1, 1);
                arModel.visible = false;

                fragments.core.update(true);

                setModelOpacity(opacityValue);

                modelLoaded = true;
                modelLoading = false;

                await prepareBimFilters(model);

                console.log('Modelo BIM preparado:', key);
            } catch (error) {
                modelLoading = false;
                showARError(
                    'El modelo se cargó, pero falló la preparación de los filtros BIM.',
                    error
                );
            }
        });

        createARInterface();
        createReticle();
        createARController();
        configureARSessionEvents();

        renderer.setAnimationLoop((timestamp, frame) => {
            updateAR(frame);

            if (isAR && bimModel) {
                fragments.core.update();
            }

            renderer.render(scene, camera);
        });

        window.addEventListener('resize', onResize);

        if (arUI) {
            arUI.style.display = 'none';
        }
    } catch (error) {
        showARError('No se pudo iniciar el visor AR.', error);
    }
}

// =====================================================
// INTERFAZ AR
// =====================================================

function createARInterface() {
    const arButton = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: arUI || document.body }
    });

    document.body.appendChild(arButton);

    if (opacitySlider) {
        opacitySlider.addEventListener('input', () => {
            opacityValue = Number(opacitySlider.value) / 100;

            if (opacityText) {
                opacityText.textContent = `${opacitySlider.value}%`;
            }

            setModelOpacity(opacityValue);
        });
    }

    createFilterPanel();
}

function createFilterPanel() {
    if (!arUI || document.getElementById('ar-bim-filters')) {
        return;
    }

    const panel = document.createElement('div');
    panel.id = 'ar-bim-filters';
    panel.innerHTML = `
        <details>
            <summary><strong>Filtros BIM</strong></summary>

            <div class="ar-filter-section">
                <label for="ar-category-search">Buscar categoría</label>
                <input id="ar-category-search" type="search"
                       placeholder="Ej. IFCWALL">

                <div id="ar-category-list" class="ar-category-list">
                    Carga un modelo para ver las categorías.
                </div>
            </div>

            <hr>

            <div class="ar-filter-section">
                <label for="ar-property-key">Propiedad</label>
                <select id="ar-property-key">
                    <option value="">Selecciona una propiedad</option>
                </select>

                <label for="ar-property-value">Valor</label>
                <select id="ar-property-value" disabled>
                    <option value="">Selecciona un valor</option>
                </select>

                <button type="button" id="ar-add-property-filter">
                    Añadir filtro
                </button>

                <div id="ar-property-filters"></div>
            </div>

            <div id="ar-filter-info" aria-live="polite">
                Sin filtros aplicados.
            </div>

            <div class="ar-filter-actions">
                <button type="button" id="ar-apply-filters">
                    Aplicar filtros
                </button>
                <button type="button" id="ar-clear-filters">
                    Limpiar filtros
                </button>
            </div>
        </details>
    `;

    arUI.appendChild(panel);

    document.getElementById('ar-category-search')
        .addEventListener('input', renderCategoryList);

    document.getElementById('ar-property-key')
        .addEventListener('change', renderPropertyValues);

    document.getElementById('ar-add-property-filter')
        .addEventListener('click', addPropertyFilter);

    document.getElementById('ar-apply-filters')
        .addEventListener('click', () => {
            applyAllFilters().catch(error => {
                showARError('No se pudieron aplicar los filtros.', error);
            });
        });

    document.getElementById('ar-clear-filters')
        .addEventListener('click', () => {
            clearAllFilters().catch(error => {
                showARError('No se pudieron limpiar los filtros.', error);
            });
        });

    filterUIReady = true;
}

// =====================================================
// PREPARAR CATEGORÍAS Y PROPIEDADES DEL MODELO
// =====================================================

async function prepareBimFilters(model) {
    modelCategories = new Map();
    modelProperties = new Map();
    categoryVisibility = new Map();
    activePropertyFilters = [];

    const ids = await getAllModelIds(model);
    allModelIds = ids.map(normalizeId);

    if (!allModelIds.length) {
        updateFilterInfo('No se encontraron elementos BIM en el modelo.');
        return;
    }

    const data = await model.getItemsData(allModelIds, {
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

    for (let i = 0; i < allModelIds.length; i++) {
        const id = allModelIds[i];
        const item = data[i];

        if (!item) continue;

        const category = getCategoryName(item);

        if (category) {
            if (!modelCategories.has(category)) {
                modelCategories.set(category, []);
            }

            modelCategories.get(category).push(id);
        }

        const propertySets = extractPropertySets(item);

        for (const [setName, properties] of propertySets) {
            for (const property of properties) {
                const key = `${setName}.${property.name}`;
                const value = String(property.value ?? '(sin valor)');

                if (!modelProperties.has(key)) {
                    modelProperties.set(key, new Map());
                }

                const valuesMap = modelProperties.get(key);

                if (!valuesMap.has(value)) {
                    valuesMap.set(value, []);
                }

                valuesMap.get(value).push(id);
            }
        }
    }

    for (const category of modelCategories.keys()) {
        categoryVisibility.set(category, true);
    }

    renderCategoryList();
    renderPropertyKeys();
    renderPropertyFilters();
    updateFilterInfo(
        `Modelo ${String(bimModelId)}: ${allModelIds.length} elementos, ` +
        `${modelCategories.size} categorías y ${modelProperties.size} propiedades.`
    );
}

async function getAllModelIds(model) {
    // Método usado por versiones de Fragments que exponen todos los IDs.
    if (typeof model.getItemsIds === 'function') {
        return await model.getItemsIds();
    }

    // Alternativa para versiones con consulta por categorías.
    if (typeof model.getItemsOfCategories === 'function') {
        return await model.getItemsOfCategories([/.*/]);
    }

    throw new Error(
        'La versión de Fragments no expone getItemsIds() ni getItemsOfCategories().'
    );
}

function normalizeId(id) {
    return id;
}

function getCategoryName(item) {
    const value =
        item?._category?.value ??
        item?._category ??
        item?.category?.value ??
        item?.category;

    if (typeof value === 'string') {
        return value;
    }

    return null;
}

// =====================================================
// EXTRAER CONJUNTOS DE PROPIEDADES IFC
// =====================================================

function extractPropertySets(root) {
    const result = new Map();
    const visited = new Set();

    function visit(node) {
        if (!node || typeof node !== 'object') return;
        if (visited.has(node)) return;

        visited.add(node);

        if (Array.isArray(node)) {
            for (const child of node) visit(child);
            return;
        }

        const category = node?._category?.value;
        const isPropertySet = category === 'IFCPROPERTYSET';

        if (isPropertySet) {
            const setName =
                node.Name?.value ??
                node.Name ??
                'Propiedades';

            const properties = [];
            const children = node.HasProperties ?? [];

            const propertyNodes = Array.isArray(children)
                ? children
                : Object.values(children);

            for (const property of propertyNodes) {
                if (!property || typeof property !== 'object') continue;

                const name =
                    property.Name?.value ??
                    property.Name;

                const nominalValue = property.NominalValue;
                let value = nominalValue?.value ?? nominalValue;

                if (value === undefined || value === null) {
                    value =
                        property.Value?.value ??
                        property.Value ??
                        '';
                }

                if (name !== undefined && name !== null) {
                    properties.push({
                        name: String(name),
                        value: String(value ?? '')
                    });
                }
            }

            if (!result.has(String(setName))) {
                result.set(String(setName), []);
            }

            result.get(String(setName)).push(...properties);
        }

        for (const value of Object.values(node)) {
            if (value && typeof value === 'object') {
                visit(value);
            }
        }
    }

    visit(root);
    return result;
}

// =====================================================
// INTERFAZ DE CATEGORÍAS
// =====================================================

function renderCategoryList() {
    const list = document.getElementById('ar-category-list');
    const search = document.getElementById('ar-category-search');

    if (!list) return;

    const query = (search?.value ?? '').trim().toLowerCase();
    list.replaceChildren();

    const categories = [...modelCategories.keys()]
        .filter(category => category.toLowerCase().includes(query))
        .sort();

    if (!categories.length) {
        list.textContent = 'No hay categorías coincidentes.';
        return;
    }

    for (const category of categories) {
        const label = document.createElement('label');
        label.className = 'ar-category-option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = categoryVisibility.get(category) !== false;

        checkbox.addEventListener('change', async () => {
            categoryVisibility.set(category, checkbox.checked);

            try {
                await applyAllFilters();
            } catch (error) {
                showARError('No se pudo filtrar la categoría.', error);
            }
        });

        const text = document.createElement('span');
        text.textContent =
            `${category} (${modelCategories.get(category).length})`;

        label.append(checkbox, text);
        list.appendChild(label);
    }
}

// =====================================================
// INTERFAZ DE PROPIEDADES
// =====================================================

function renderPropertyKeys() {
    const select = document.getElementById('ar-property-key');
    if (!select) return;

    select.replaceChildren();

    const initial = document.createElement('option');
    initial.value = '';
    initial.textContent = 'Selecciona una propiedad';
    select.appendChild(initial);

    for (const key of [...modelProperties.keys()].sort()) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        select.appendChild(option);
    }

    renderPropertyValues();
}

function renderPropertyValues() {
    const keySelect = document.getElementById('ar-property-key');
    const valueSelect = document.getElementById('ar-property-value');

    if (!keySelect || !valueSelect) return;

    valueSelect.replaceChildren();

    const initial = document.createElement('option');
    initial.value = '';
    initial.textContent = 'Selecciona un valor';
    valueSelect.appendChild(initial);

    const key = keySelect.value;
    const values = modelProperties.get(key);

    if (!values) {
        valueSelect.disabled = true;
        return;
    }

    valueSelect.disabled = false;

    for (const value of [...values.keys()].sort()) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = `${value} (${values.get(value).length})`;
        valueSelect.appendChild(option);
    }
}

function addPropertyFilter() {
    const key = document.getElementById('ar-property-key')?.value;
    const value = document.getElementById('ar-property-value')?.value;

    if (!key || value === undefined || value === '') {
        updateFilterInfo('Selecciona una propiedad y un valor.');
        return;
    }

    const exists = activePropertyFilters.some(
        filter => filter.key === key && filter.value === value
    );

    if (!exists) {
        activePropertyFilters.push({ key, value });
    }

    renderPropertyFilters();
}

function renderPropertyFilters() {
    const container = document.getElementById('ar-property-filters');
    if (!container) return;

    container.replaceChildren();

    if (!activePropertyFilters.length) {
        container.textContent = 'No hay filtros de propiedades.';
        return;
    }

    for (const filter of activePropertyFilters) {
        const row = document.createElement('div');
        row.className = 'ar-property-filter';

        const text = document.createElement('span');
        text.textContent = `${filter.key} = ${filter.value}`;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '×';
        remove.setAttribute(
            'aria-label',
            `Quitar filtro ${filter.key} ${filter.value}`
        );

        remove.addEventListener('click', async () => {
            activePropertyFilters = activePropertyFilters.filter(
                item => !(item.key === filter.key && item.value === filter.value)
            );

            renderPropertyFilters();

            try {
                await applyAllFilters();
            } catch (error) {
                showARError('No se pudo actualizar el filtro.', error);
            }
        });

        row.append(text, remove);
        container.appendChild(row);
    }
}

// =====================================================
// APLICAR FILTROS
// =====================================================

async function getFilteredModelIds(model) {
    const categoryIds = new Set();

    for (const [category, ids] of modelCategories) {
        if (categoryVisibility.get(category) !== false) {
            for (const id of ids) categoryIds.add(id);
        }
    }

    // Si un elemento no tiene categoría reconocida, no se incluye
    // cuando se está aplicando el filtro de categorías.
    let filtered = new Set(
        allModelIds.filter(id => categoryIds.has(id))
    );

    // Múltiples valores de una misma propiedad: OR.
    // Propiedades diferentes: AND.
    const filtersByKey = new Map();

    for (const filter of activePropertyFilters) {
        if (!filtersByKey.has(filter.key)) {
            filtersByKey.set(filter.key, []);
        }

        filtersByKey.get(filter.key).push(filter.value);
    }

    for (const [key, values] of filtersByKey) {
        const propertyValues = modelProperties.get(key);
        const matchingIds = new Set();

        for (const value of values) {
            const ids = propertyValues?.get(value) ?? [];

            for (const id of ids) {
                matchingIds.add(id);
            }
        }

        filtered = new Set(
            [...filtered].filter(id => matchingIds.has(id))
        );
    }

    return [...filtered];
}

async function applyAllFilters() {
    if (!bimModel || !bimModelId || !hider) {
        updateFilterInfo('Carga el modelo antes de aplicar filtros.');
        return;
    }

    const ids = await getFilteredModelIds(bimModel);

    // La clave debe coincidir con la clave registrada en fragments.list.
    const modelIdMap = {
        [bimModelId]: ids
    };

    await hider.set(false);
    await hider.set(true, modelIdMap);

    updateFilterInfo(
        `Visibles: ${ids.length} de ${allModelIds.length} elementos.`
    );

    fragments.core.update(true);
}

async function clearAllFilters() {
    activePropertyFilters = [];

    for (const category of modelCategories.keys()) {
        categoryVisibility.set(category, true);
    }

    renderCategoryList();
    renderPropertyFilters();

    if (bimModel && hider) {
        await hider.set(false);
        await hider.set(true, {
            [bimModelId]: allModelIds
        });

        fragments.core.update(true);
    }

    updateFilterInfo('Filtros limpiados.');
}

function updateFilterInfo(message) {
    const element = document.getElementById('ar-filter-info');

    if (element) {
        element.textContent = message;
    }
}

// =====================================================
// COLOCACIÓN AR
// =====================================================

function createReticle() {
    const geometry = new THREE.RingGeometry(0.08, 0.1, 32);
    geometry.rotateX(-Math.PI / 2);

    arReticle = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial()
    );

    arReticle.matrixAutoUpdate = false;
    arReticle.visible = false;

    scene.add(arReticle);
}

function createARController() {
    arController = renderer.xr.getController(0);
    arController.addEventListener('select', onARSelect);
    scene.add(arController);
}

function configureARSessionEvents() {
    renderer.xr.addEventListener('sessionstart', () => {
        isAR = true;
        hitTestSource = null;
        hitTestSourceRequested = false;

        if (arModel) {
            arModel.visible = false;
        }

        if (opacitySlider) {
            opacitySlider.value = String(Math.round(opacityValue * 100));
        }

        if (opacityText) {
            opacityText.textContent =
                `${Math.round(opacityValue * 100)}%`;
        }

        if (arUI) {
            arUI.style.display = 'block';
        }
    });

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
}

async function onARSelect() {
    if (!isAR || !arReticle?.visible) return;

    const position = new THREE.Vector3();
    position.setFromMatrixPosition(arReticle.matrix);

    // Si ya está cargado, el toque vuelve a colocarlo.
    if (modelLoaded && arModel) {
        arModel.position.copy(position);
        arModel.visible = true;

        fragments.core.update(true);
        return;
    }

    if (modelLoading) return;

    const url = container.dataset.url;

    if (!url) {
        showARError('No existe data-url en #viewer.');
        return;
    }

    modelLoading = true;

    try {
        const response = await fetch(url + '?type=frag');

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();

        // No registrar manualmente un segundo modelo.
        // El evento onItemSet asigna bimModel, bimModelId y arModel.
        await fragments.core.load(buffer, { modelId: 'main' });

        // En algunas versiones el evento de registro puede ejecutarse
        // al resolver load; verificamos el registro por su clave real.
        const registeredModel = fragments.list.get('main');

        if (registeredModel && !bimModel) {
            bimModel = registeredModel;
            bimModelId = 'main';
            arModel = registeredModel.object;

            registeredModel.useCamera(camera);
            scene.add(registeredModel.object);

            arModel.scale.set(1, 1, 1);
            arModel.visible = false;

            modelLoaded = true;
            modelLoading = false;

            await prepareBimFilters(registeredModel);
        }

        if (!arModel) {
            throw new Error(
                'Fragments terminó la carga, pero no se encontró el modelo registrado.'
            );
        }

        arModel.position.copy(position);
        arModel.scale.set(1, 1, 1);
        arModel.visible = true;

        setModelOpacity(opacityValue);
        fragments.core.update(true);
    } catch (error) {
        modelLoading = false;
        showARError('No se pudo cargar o colocar el modelo BIM.', error);
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
            .then(viewerSpace => session.requestHitTestSource({
                space: viewerSpace
            }))
            .then(source => {
                hitTestSource = source;
            })
            .catch(error => {
                hitTestSourceRequested = false;
                showARError('No se pudo iniciar el hit-test AR.', error);
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

    if (!pose) {
        arReticle.visible = false;
        return;
    }

    arReticle.visible = true;
    arReticle.matrix.fromArray(pose.transform.matrix);
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

            if (value >= 1) {
                material.opacity = original.opacity;
                material.transparent = original.transparent;
                material.depthWrite = original.depthWrite;
                material.depthTest = original.depthTest;
                material.side = original.side;
                material.alphaTest = original.alphaTest;
                material.blending = original.blending;
            } else {
                material.opacity = original.opacity * value;
                material.transparent = true;
                material.depthWrite = original.depthWrite;
                material.depthTest = original.depthTest;
                material.side = original.side;
                material.alphaTest = original.alphaTest;
                material.blending = original.blending;
            }

            material.needsUpdate = true;
        });
    });

    if (fragments) {
        fragments.core.update(true);
    }
}

// =====================================================
// RESIZE Y ERRORES
// =====================================================

function onResize() {
    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function showARError(message, error = null) {
    console.error(message, error);

    const details = error?.message ? `\n${error.message}` : '';
    window.alert(message + details);
}

// =====================================================
// INICIAR
// =====================================================

initViewer();
