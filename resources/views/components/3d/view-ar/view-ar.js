
const container = document.getElementById('viewer');

if (!container) {
    throw new Error('No se encontró el elemento #viewer');
}

const arUI = document.getElementById('ar-ui-container');
const opacitySlider = document.getElementById('ar-opacity');
const opacityText = document.getElementById('ar-opacity-value');

// =====================================================
// VARIABLES AR
// =====================================================

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
let modelLoading = false;
let modelLoaded = false;
let isAR = false;
let opacityValue = 1;

// =====================================================
// VARIABLES DE FILTRADO: PATRÓN DEL VIEWER BIM
// =====================================================

// modelCategories[modelId] = Map(categoria, localIds)
// modelProperties[modelId] = Map(propiedad, Map(valor, localIds))

const modelCategories = {};
const modelProperties = {};
const categoryVisibility = {};

let activePropertyFilters = [];

let allModelIds = {};
let filterDataReady = false;

// =====================================================
// INICIALIZAR VIEWER AR
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

        // -------------------------------------------------
        // RENDERER ORIGINAL DE AR
        // -------------------------------------------------

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

        // -------------------------------------------------
        // CÁMARA ORIGINAL DE AR
        // -------------------------------------------------

        camera = new THREE.PerspectiveCamera(
            70,
            container.clientWidth / container.clientHeight,
            0.01,
            1000
        );

        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);

        components.init();

        // -------------------------------------------------
        // FRAGMENTS Y HIDER
        // -------------------------------------------------

        fragments = components.get(OBC.FragmentsManager);
        hider = components.get(OBC.Hider);

        await fragments.init('/engine/worker.mjs');

        // -------------------------------------------------
        // MODELO REGISTRADO
        // -------------------------------------------------

        fragments.list.onItemSet.add(({ value: model }) => {
            try {
                console.log('Modelo registrado en fragments.list');

                model.useCamera(camera);
                scene.add(model.object);

                arModel = model.object;
                arModel.scale.set(1, 1, 1);
                arModel.visible = false;

                modelLoaded = true;
                modelLoading = false;

                fragments.core.update(true);
                setModelOpacity(opacityValue);

                // Importante: utilizar el registro real de modelos,
                // como en el viewer BIM funcional.
                prepareRegisteredModels().catch(error => {
                    showARError(
                        'Error preparando los filtros BIM.',
                        error
                    );
                });
            } catch (error) {
                modelLoading = false;
                showARError('Error registrando el modelo AR.', error);
            }
        });

        createARInterface();
        createReticle();
        createARController();
        configureARSessionEvents();

        // -------------------------------------------------
        // BUCLE AR ORIGINAL
        // -------------------------------------------------

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
    } catch (error) {
        showARError('No se pudo iniciar el visor AR.', error);
    }
}

// =====================================================
// INTERFAZ AR Y FILTROS
// =====================================================

function createARInterface() {
    const arButton = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: {
            root: arUI || document.body
        }
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

            <label for="ar-category-search">Buscar categoría</label>
            <input id="ar-category-search" type="search"
                   placeholder="Buscar categoría">

            <div id="ar-category-list"></div>

            <hr>

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

            <p id="ar-filter-info">Esperando modelo BIM...</p>

            <button type="button" id="ar-apply-filters">
                Aplicar filtros
            </button>

            <button type="button" id="ar-clear-filters">
                Limpiar filtros
            </button>
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
        .addEventListener('click', async () => {
            try {
                await applyAllFilters();
            } catch (error) {
                showARError('No se pudieron aplicar los filtros.', error);
            }
        });

    document.getElementById('ar-clear-filters')
        .addEventListener('click', async () => {
            try {
                await clearAllFilters();
            } catch (error) {
                showARError('No se pudieron limpiar los filtros.', error);
            }
        });
}

// =====================================================
// PROCESAR MODELOS USANDO fragments.list
// =====================================================

async function prepareRegisteredModels() {
    filterDataReady = false;

    for (const [modelId, model] of fragments.list) {
        console.log('Procesando modelo registrado:', modelId);

        // Se usan las funciones del patrón del viewer:
        // model.getItems() y model.getItemsData().
        modelCategories[model.modelId] =
            await buildModelCategories(model);

        modelProperties[model.modelId] =
            await buildModelProperties(model);

        const items = await model.getItems();
        const ids = Array.from(items.keys());

        allModelIds[model.modelId] = ids;

        if (!categoryVisibility[model.modelId]) {
            categoryVisibility[model.modelId] = new Map();
        }

        for (const category of modelCategories[model.modelId].keys()) {
            categoryVisibility[model.modelId].set(category, true);
        }
    }

    renderCategoryList();
    renderPropertyKeys();
    renderPropertyFilters();

    filterDataReady = true;

    updateFilterInfo('Filtros BIM preparados.');
}

// =====================================================
// EXTRAER CATEGORÍAS: PATRÓN DEL VIEWER
// =====================================================

async function buildModelCategories(model) {
    const categories = new Map();

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

    for (let index = 0; index < ids.length; index++) {
        const localId = ids[index];
        const item = data[index];

        if (!item) continue;

        const propertySets = extractPropertySets(item);
        let category = null;

        // La categoría personalizada se obtiene del conjunto "Otra",
        // propiedad "Categoría", como en el viewer funcional.
        const otherProperties = propertySets.get('Otra') || [];

        for (const property of otherProperties) {
            if (property.name === 'Categoría') {
                category = String(property.value);
                break;
            }
        }

        // Si el elemento no tiene esa propiedad, no inventamos
        // una categoría distinta para él.
        if (!category) continue;

        if (!categories.has(category)) {
            categories.set(category, []);
        }

        categories.get(category).push(localId);
    }

    return categories;
}

// =====================================================
// EXTRAER PROPIEDADES: PATRÓN DEL VIEWER
// =====================================================

async function buildModelProperties(model) {
    const properties = new Map();

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

    for (let index = 0; index < ids.length; index++) {
        const localId = ids[index];
        const item = data[index];

        if (!item) continue;

        const propertySets = extractPropertySets(item);

        for (const [setName, setProperties] of propertySets) {
            for (const property of setProperties) {
                const key = `${setName}.${property.name}`;
                const value = String(property.value ?? '');

                if (!properties.has(key)) {
                    properties.set(key, new Map());
                }

                const values = properties.get(key);

                if (!values.has(value)) {
                    values.set(value, []);
                }

                values.get(value).push(localId);
            }
        }
    }

    return properties;
}

// =====================================================
// EXTRAER PROPERTY SETS IFC
// =====================================================

function extractPropertySets(root) {
    const result = new Map();
    const visited = new Set();

    function visit(node) {
        if (!node || typeof node !== 'object') return;
        if (visited.has(node)) return;

        visited.add(node);

        if (Array.isArray(node)) {
            for (const child of node) {
                visit(child);
            }
            return;
        }

        const category = node?._category?.value;

        if (category === 'IFCPROPERTYSET') {
            const setName = String(
                node.Name?.value ??
                node.Name ??
                'Propiedades'
            );

            const properties = [];
            const rawProperties = node.HasProperties ?? [];

            const propertyNodes = Array.isArray(rawProperties)
                ? rawProperties
                : Object.values(rawProperties);

            for (const property of propertyNodes) {
                if (!property || typeof property !== 'object') continue;

                const name =
                    property.Name?.value ??
                    property.Name;

                const rawValue =
                    property.NominalValue?.value ??
                    property.NominalValue ??
                    property.Value?.value ??
                    property.Value ??
                    '';

                if (name !== undefined && name !== null) {
                    properties.push({
                        name: String(name),
                        value: String(rawValue ?? '')
                    });
                }
            }

            if (!result.has(setName)) {
                result.set(setName, []);
            }

            result.get(setName).push(...properties);
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
// MOSTRAR CATEGORÍAS
// =====================================================

function renderCategoryList() {
    const list = document.getElementById('ar-category-list');
    const search = document.getElementById('ar-category-search');

    if (!list) return;

    list.replaceChildren();

    const query = (search?.value || '').toLowerCase();

    for (const [modelId, categories] of Object.entries(modelCategories)) {
        for (const [category, ids] of categories) {
            if (!category.toLowerCase().includes(query)) continue;

            const label = document.createElement('label');
            label.className = 'ar-category-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked =
                categoryVisibility[modelId]?.get(category) !== false;

            checkbox.addEventListener('change', async () => {
                categoryVisibility[modelId].set(
                    category,
                    checkbox.checked
                );

                try {
                    await applyAllFilters();
                } catch (error) {
                    showARError('No se pudo filtrar la categoría.', error);
                }
            });

            const text = document.createElement('span');
            text.textContent = `${category} (${ids.length})`;

            label.append(checkbox, text);
            list.appendChild(label);
        }
    }

    if (!list.children.length) {
        list.textContent = filterDataReady
            ? 'No se encontraron categorías.'
            : 'Esperando los datos del modelo...';
    }
}

// =====================================================
// MOSTRAR PROPIEDADES
// =====================================================

function renderPropertyKeys() {
    const select = document.getElementById('ar-property-key');
    if (!select) return;

    select.replaceChildren();

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona una propiedad';
    select.appendChild(placeholder);

    const keys = new Set();

    for (const properties of Object.values(modelProperties)) {
        for (const key of properties.keys()) {
            keys.add(key);
        }
    }

    for (const key of [...keys].sort()) {
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

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona un valor';
    valueSelect.appendChild(placeholder);

    const key = keySelect.value;
    const values = new Set();

    for (const properties of Object.values(modelProperties)) {
        for (const value of (properties.get(key)?.keys() || [])) {
            values.add(value);
        }
    }

    for (const value of [...values].sort()) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        valueSelect.appendChild(option);
    }

    valueSelect.disabled = !key || values.size === 0;
}

// =====================================================
// FILTROS DE PROPIEDADES
// =====================================================

function addPropertyFilter() {
    const key = document.getElementById('ar-property-key')?.value;
    const value = document.getElementById('ar-property-value')?.value;

    if (!key || value === '') {
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

    for (const filter of activePropertyFilters) {
        const row = document.createElement('div');
        row.className = 'ar-property-filter';

        const text = document.createElement('span');
        text.textContent = `${filter.key} = ${filter.value}`;

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = '×';

        button.addEventListener('click', async () => {
            activePropertyFilters = activePropertyFilters.filter(
                item =>
                    item.key !== filter.key ||
                    item.value !== filter.value
            );

            renderPropertyFilters();

            try {
                await applyAllFilters();
            } catch (error) {
                showARError('No se pudo actualizar el filtro.', error);
            }
        });

        row.append(text, button);
        container.appendChild(row);
    }
}

// =====================================================
// OBTENER ELEMENTOS FILTRADOS
// =====================================================

async function getFilteredModelIds(model) {
    const modelId = model.modelId;
    const categories = modelCategories[modelId] || new Map();
    const visibleCategories = categoryVisibility[modelId] || new Map();

    const allIds = allModelIds[modelId] || [];
    const categoryIds = new Set();

    for (const [category, ids] of categories) {
        if (visibleCategories.get(category) !== false) {
            for (const id of ids) {
                categoryIds.add(id);
            }
        }
    }

    let filtered = new Set(
        allIds.filter(id => categoryIds.has(id))
    );

    const properties = modelProperties[modelId] || new Map();
    const filtersByKey = new Map();

    for (const filter of activePropertyFilters) {
        if (!filtersByKey.has(filter.key)) {
            filtersByKey.set(filter.key, []);
        }

        filtersByKey.get(filter.key).push(filter.value);
    }

    for (const [key, values] of filtersByKey) {
        const propertyValues = properties.get(key);
        const matchingIds = new Set();

        for (const value of values) {
            for (const id of propertyValues?.get(value) || []) {
                matchingIds.add(id);
            }
        }

        filtered = new Set(
            [...filtered].filter(id => matchingIds.has(id))
        );
    }

    return [...filtered];
}

// =====================================================
// APLICAR FILTROS: fragments.list COMO EN EL VIEWER
// =====================================================

async function applyAllFilters() {
    if (!filterDataReady) {
        updateFilterInfo('Espera a que termine la preparación del modelo.');
        return;
    }

    const modelIdMap = {};
    let visibleCount = 0;
    let totalCount = 0;

    for (const [modelId, model] of fragments.list) {
        const filteredIds = await getFilteredModelIds(model);

        // Se utiliza la clave del registro fragments.list,
        // no se presupone que el identificador sea "main".
        modelIdMap[modelId] = filteredIds;

        visibleCount += filteredIds.length;
        totalCount += (allModelIds[model.modelId] || []).length;
    }

    await hider.set(false);
    await hider.set(true, modelIdMap);

    fragments.core.update(true);

    updateFilterInfo(`Visibles: ${visibleCount} de ${totalCount} elementos.`);
}

async function clearAllFilters() {
    activePropertyFilters = [];

    for (const categories of Object.values(categoryVisibility)) {
        for (const category of categories.keys()) {
            categories.set(category, true);
        }
    }

    renderCategoryList();
    renderPropertyFilters();

    const modelIdMap = {};

    for (const [modelId, model] of fragments.list) {
        modelIdMap[modelId] = allModelIds[model.modelId] || [];
    }

    await hider.set(false);
    await hider.set(true, modelIdMap);

    fragments.core.update(true);

    updateFilterInfo('Filtros limpiados.');
}

function updateFilterInfo(message) {
    const info = document.getElementById('ar-filter-info');

    if (info) {
        info.textContent = message;
    }
}

// =====================================================
// RETÍCULA Y CONTROLADOR AR
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

// =====================================================
// EVENTOS DE SESIÓN AR
// =====================================================

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

// =====================================================
// CARGAR Y COLOCAR MODELO: AR ORIGINAL
// =====================================================

async function onARSelect() {
    if (!isAR || !arReticle || !arReticle.visible) {
        return;
    }

    const position = new THREE.Vector3();
    position.setFromMatrixPosition(arReticle.matrix);

    // Si ya está cargado, el toque lo recoloca.
    if (modelLoaded && arModel) {
        arModel.position.copy(position);
        arModel.visible = true;

        fragments.core.update(true);
        return;
    }

    if (modelLoading) {
        return;
    }

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

        // Conservamos la carga del AR que ya funcionaba.
        await fragments.core.load(buffer, {
            modelId: 'main'
        });

        // La instancia del modelo se recibe mediante onItemSet.
        // No se consulta fragments.list.get('main') ni se recrea
        // manualmente el modelo.
        if (!arModel) {
            throw new Error(
                'La carga terminó, pero el evento de registro no asignó el objeto AR.'
            );
        }

        arModel.position.copy(position);
        arModel.scale.set(1, 1, 1);
        arModel.visible = true;

        setModelOpacity(opacityValue);
        fragments.core.update(true);
    } catch (error) {
        modelLoading = false;
        showARError('No se pudo cargar o colocar el modelo AR.', error);
    }
}

// =====================================================
// HIT TEST: AR ORIGINAL
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
                hitTestSourceRequested = false;
                showARError('Error creando Hit Test.', error);
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
// OPACIDAD: AR ORIGINAL
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

    const detail = error?.stack || error?.message || '';

    window.alert(
        message + (detail ? '\n\n' + detail : '')
    );
}

// =====================================================
// INICIAR
// =====================================================

initViewer();
