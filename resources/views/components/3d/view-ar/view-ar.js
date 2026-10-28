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

let loadedModelId = null;

// =====================================================
// PROPERTY SETS - NUEVAS VARIABLES
// =====================================================

let modelProperties = new Map();
let modelCategories = new Map();
let activePropertyFilters = [];
let categoryVisibility = new Map();
let activeLevels = {};


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
    // =====================================================

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
    // =====================================================

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
    // =====================================================

    components.init();


    // =================================================
    // FRAGMENTS
    // =====================================================

    fragments =
        components.get(
            OBC.FragmentsManager
        );


    fragments.init(
        '/engine/worker.mjs'
    );


    // =================================================
    // HIDER PARA FILTROS
    // =====================================================

    const hider =
        components.get(
            OBC.Hider
        );


// =====================================================
// CUANDO SE CARGA EL MODELO (dentro de initViewer)
// =====================================================

// =====================================================
// CUANDO SE CARGA EL MODELO
// =====================================================

fragments.list.onItemSet.add(
    async ({ value: model }) => {

        console.log('===========================================');
        console.log('🟢 onItemSet disparado');
        console.log('model.modelId:', model.modelId);
        console.log('model.id:', model.id);
        console.log('model.object?.name:', model.object?.name);
        console.log('fragments.list keys:', [...fragments.list.keys()]);
        console.log('fragments.list size:', fragments.list.size);
        console.log('===========================================');

        try {

            model.useCamera(camera);

            scene.add(model.object);

            arModel = model.object;

            arModel.scale.set(1, 1, 1);

            arModel.visible = false;

            // -------------------------------------------------
            // GUARDAR EL MODELID REAL
            // -------------------------------------------------

            loadedModelId = model.modelId;

            console.log('💾 loadedModelId guardado:', loadedModelId);

            modelLoaded = true;
            modelLoading = false;

            modelProperties = await buildModelProperties(model);
            modelCategories = await buildModelCategories(model);

            buildPropertyUI();
            buildCategoryUI();

            await fragments.core.update(true);

            setModelOpacity(opacityValue);

            console.log('✅ Modelo preparado con ID:', loadedModelId);

        } catch (error) {

            console.error('❌ Error procesando modelo cargado:', error);
            modelLoading = false;
        }
    }
);


    // =================================================
    // BOTÓN AR
    // =====================================================

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
    // CONFIGURAR SLIDER DE OPACIDAD
    // =====================================================

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
    // CONFIGURAR FILTROS DE PROPERTIES
    // =====================================================

    setupPropertyFilters();


    // =================================================
    // CONFIGURAR RESET DE FILTROS
    // =====================================================

    const resetFiltersBtn =
        document.getElementById('ar-reset-filters');

    if (resetFiltersBtn) {

        resetFiltersBtn.addEventListener(
            'click',
            async () => {

                await resetAllFilters();
            }
        );
    }


    // =================================================
    // RETICLE
    // =====================================================

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
    // =====================================================

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
    // =====================================================

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
    // =====================================================

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
    // =====================================================

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
    // =====================================================

    window.addEventListener(
        'resize',
        onResize
    );


    // =================================================
    // OCULTAR UI FUERA DE AR
    // =====================================================

    if (arUI) {

        arUI.style.display =
            'none';
    }
}


// =====================================================
// CONSTRUIR PROPERTIES DEL MODELO
// =====================================================

async function buildModelProperties(model) {

    const items = await model.getItems();

    const ids = Array.from(items.keys());

    const data = await model.getItemsData(
        ids,
        {
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
        }
    );

    const properties = new Map();

    for (const item of data) {

        const id = item._localId?.value;

        if (id === undefined) {
            continue;
        }

        const propertySets =
            extractPropertySets(item);

        for (
            const [, propertyList]
            of propertySets
        ) {

            for (
                const property
                of propertyList
            ) {

                if (
                    property.value === null ||
                    property.value === undefined ||
                    property.value === ''
                ) {
                    continue;
                }

                const key = property.name;

                const value = String(property.value);

                if (!properties.has(key)) {
                    properties.set(
                        key,
                        new Map()
                    );
                }

                const values = properties.get(key);

                if (!values.has(value)) {
                    values.set(
                        value,
                        []
                    );
                }

                values
                    .get(value)
                    .push(id);
            }
        }
    }

    return properties;
}


// =====================================================
// CONSTRUIR CATEGORÍAS DEL MODELO
// =====================================================

async function buildModelCategories(model) {

    const items = await model.getItems();

    const ids = Array.from(items.keys());

    const data = await model.getItemsData(
        ids,
        {
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
        }
    );

    const categories = new Map();

    for (const item of data) {

        const id = item._localId?.value;

        const category = item._category?.value;

        if (
            id === undefined ||
            !category
        ) {
            continue;
        }

        if (!categories.has(category)) {
            categories.set(
                category,
                []
            );
        }

        categories
            .get(category)
            .push(id);
    }

    return categories;
}


// =====================================================
// EXTRAER PROPERTY SETS
// =====================================================

function extractPropertySets(data) {

    const propertySets = new Map();
    const visited = new Set();

    function traverse(node) {

        if (
            !node ||
            typeof node !== 'object'
        ) {
            return;
        }

        if (visited.has(node)) {
            return;
        }

        visited.add(node);

        if (
            node._category?.value === 'IFCPROPERTYSET'
        ) {

            const setName =
                node.Name?.value ?? 'Sin nombre';

            if (!propertySets.has(setName)) {
                propertySets.set(setName, []);
            }

            const properties =
                node.HasProperties ?? [];

            for (const property of properties) {

                const name =
                    property.Name?.value;

                if (!name) {
                    continue;
                }

                propertySets
                    .get(setName)
                    .push({
                        name,
                        value:
                            property.NominalValue?.value ??
                            null,
                        type:
                            property.NominalValue?.type ??
                            null
                    });
            }
        }

        for (const key of Object.keys(node)) {

            const value = node[key];

            if (Array.isArray(value)) {

                for (const child of value) {
                    traverse(child);
                }

            } else if (
                value &&
                typeof value === 'object'
            ) {

                traverse(value);
            }
        }
    }

    traverse(data);

    return propertySets;
}


// =====================================================
// CONSTRUIR UI DE PROPERTIES
// =====================================================

function buildPropertyUI() {

    const selectKey =
        document.getElementById(
            'ar-property-key'
        );

    const selectValue =
        document.getElementById(
            'ar-property-value'
        );

    if (!selectKey || !selectValue) {
        return;
    }

    selectKey.innerHTML = `
<option value="">
    Seleccionar propiedad
</option>
`;

    selectValue.innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;

    selectValue.disabled = true;

    const allKeys = new Set();

    for (const key of modelProperties.keys()) {
        allKeys.add(key);
    }

    const sortedKeys =
        Array.from(allKeys)
            .sort((a, b) =>
                a.localeCompare(b)
            );

    for (const key of sortedKeys) {

        const option =
            document.createElement('option');

        option.value = key;
        option.textContent = key;

        selectKey.appendChild(option);
    }
}


// =====================================================
// CONSTRUIR UI DE CATEGORÍAS
// =====================================================

function buildCategoryUI() {

    const container =
        document.getElementById('ar-categories-container');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    for (const [groupName, categoryIds] of modelCategories) {

        const group =
            document.createElement('div');

        group.className =
            'ar-category-item';

        group.innerHTML = `
<div class="d-flex align-items-center gap-2 p-2">

    <input
        type="checkbox"
        checked
        class="form-check-input ar-category-toggle m-0"
        data-category="${escapeHtml(groupName)}"
    >

    <span
        class="text-truncate flex-grow-1"
        title="${escapeHtml(groupName)}"
    >
        ${escapeHtml(groupName)}
    </span>

    <span class="badge bg-secondary">
        ${categoryIds.length}
    </span>

</div>
`;

        container.appendChild(group);
    }

    // Agregar eventos a los checkboxes
    container
        .querySelectorAll('.ar-category-toggle')
        .forEach(checkbox => {

            checkbox.addEventListener(
                'change',
                async (e) => {

                    const category =
                        e.target.dataset.category;

                    await toggleCategory(
                        category,
                        e.target.checked
                    );
                }
            );
        });
}


// =====================================================
// CONFIGURAR FILTROS DE PROPERTIES
// =====================================================

function setupPropertyFilters() {

    // -------------------------------------------------
    // SELECTOR DE CLAVE
    // -------------------------------------------------

    const selectKey =
        document.getElementById('ar-property-key');

    if (selectKey) {

        selectKey.addEventListener(
            'change',
            function () {

                const key = this.value;

                const selectValue =
                    document.getElementById(
                        'ar-property-value'
                    );

                const btnApply =
                    document.getElementById(
                        'ar-apply-property'
                    );

                selectValue.innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;

                selectValue.disabled = true;
                btnApply.disabled = true;

                if (!key) {
                    return;
                }

                const allValues = new Set();

                const values =
                    modelProperties.get(key);

                if (values) {
                    for (const value of values.keys()) {
                        allValues.add(value);
                    }
                }

                const sortedValues =
                    Array.from(allValues)
                        .sort((a, b) =>
                            a.localeCompare(b)
                        );

                for (const value of sortedValues) {

                    const option =
                        document.createElement('option');

                    option.value = value;
                    option.textContent = value;

                    selectValue.appendChild(option);
                }

                selectValue.disabled =
                    sortedValues.length === 0;
            }
        );
    }


    // -------------------------------------------------
    // SELECTOR DE VALOR
    // -------------------------------------------------

    const selectValue =
        document.getElementById('ar-property-value');

    if (selectValue) {

        selectValue.addEventListener(
            'change',
            function () {

                const btnApply =
                    document.getElementById(
                        'ar-apply-property'
                    );

                btnApply.disabled = !this.value;
            }
        );
    }


    // -------------------------------------------------
    // BOTÓN APLICAR
    // -------------------------------------------------

    const btnApply =
        document.getElementById('ar-apply-property');

    if (btnApply) {

        btnApply.addEventListener(
            'click',
            async () => {

                const key =
                    document.getElementById(
                        'ar-property-key'
                    ).value;

                const value =
                    document.getElementById(
                        'ar-property-value'
                    ).value;

                if (!key || !value) {
                    return;
                }

                // Evitar duplicados
                const exists =
                    activePropertyFilters.some(
                        filter =>
                            filter.key === key &&
                            filter.value === value
                    );

                if (!exists) {

                    activePropertyFilters.push({
                        key,
                        value
                    });
                }

                // Limpiar selección
                document.getElementById(
                    'ar-property-key'
                ).value = '';

                document.getElementById(
                    'ar-property-value'
                ).innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;

                document.getElementById(
                    'ar-property-value'
                ).disabled = true;

                document.getElementById(
                    'ar-apply-property'
                ).disabled = true;

                // Actualizar lista
                renderPropertyFilters();

                // Aplicar filtros
                await applyAllFilters();
            }
        );
    }


    // -------------------------------------------------
    // BOTÓN LIMPIAR
    // -------------------------------------------------

    const btnClear =
        document.getElementById('ar-clear-property');

    if (btnClear) {

        btnClear.addEventListener(
            'click',
            async () => {

                activePropertyFilters = [];

                document.getElementById(
                    'ar-property-key'
                ).value = '';

                document.getElementById(
                    'ar-property-value'
                ).innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;

                document.getElementById(
                    'ar-property-value'
                ).disabled = true;

                document.getElementById(
                    'ar-apply-property'
                ).disabled = true;

                renderPropertyFilters();

                await applyAllFilters();
            }
        );
    }
}


// =====================================================
// RENDERIZAR FILTROS ACTIVOS
// =====================================================

function renderPropertyFilters() {

    const container =
        document.getElementById('ar-property-filters');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (!activePropertyFilters.length) {

        container.innerHTML = `
<div class="small text-white-50">
    Sin filtros activos
</div>
`;

        return;
    }

    for (
        let index = 0;
        index < activePropertyFilters.length;
        index++
    ) {

        const filter = activePropertyFilters[index];

        const item = document.createElement('div');

        item.className =
            'ar-filter-chip';

        item.innerHTML = `
<div class="d-flex align-items-center gap-1">

    <span class="small">
        ${escapeHtml(filter.key)}:
        ${escapeHtml(filter.value)}
    </span>

    <button
        type="button"
        class="btn btn-sm p-0 ar-filter-remove"
        data-index="${index}"
        style="line-height: 1;">
        <i class="bi bi-x"></i>
    </button>

</div>
`;

        container.appendChild(item);
    }

    container
        .querySelectorAll('.ar-filter-remove')
        .forEach(button => {

            button.addEventListener(
                'click',
                async () => {

                    const index =
                        Number(
                            button.dataset.index
                        );

                    activePropertyFilters
                        .splice(index, 1);

                    renderPropertyFilters();

                    await applyAllFilters();
                }
            );
        });
}


// =====================================================
// TOGGLE CATEGORÍA
// =====================================================

async function toggleCategory(category, visible) {

    categoryVisibility.set(
        category,
        visible
    );

    await applyAllFilters();
}


// =====================================================
// RESETEAR TODOS LOS FILTROS
// =====================================================

async function resetAllFilters() {

    // Limpiar categorías
    categoryVisibility.clear();

    // Limpiar properties
    activePropertyFilters = [];

    // Resetear UI de categorías
    document
        .querySelectorAll('.ar-category-toggle')
        .forEach(cb => {
            cb.checked = true;
        });

    // Resetear selects
    document.getElementById(
        'ar-property-key'
    ).value = '';

    document.getElementById(
        'ar-property-value'
    ).innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;

    document.getElementById(
        'ar-property-value'
    ).disabled = true;

    document.getElementById(
        'ar-apply-property'
    ).disabled = true;

    // Renderizar filtros
    renderPropertyFilters();

    // Aplicar (mostrar todo)
    await applyAllFilters();
}


// =====================================================
// APLICAR TODOS LOS FILTROS
// =====================================================

async function applyAllFilters() {

    const hider =
        components.get(
            OBC.Hider
        );

    for (const [modelId, model] of fragments.list) {

        const filteredIds =
            getFilteredModelIds(model);

        const modelIdMap = {
            [modelId]: filteredIds
        };

        await hider.set(
            true,
            modelIdMap
        );
    }

    // Actualizar fragments
    if (fragments) {
        fragments.core.update(true);
    }
}


// =====================================================
// OBTENER IDS FILTRADOS
// =====================================================

function getFilteredModelIds(model) {

    let ids = new Set();

    // Categorías
    for (const [category, categoryIds] of modelCategories) {

        const visible =
            categoryVisibility.has(category)
                ? categoryVisibility.get(category)
                : true;

        if (!visible) {
            continue;
        }

        for (const id of categoryIds) {
            ids.add(id);
        }
    }

    // Property filters
    if (activePropertyFilters.length) {

        const filtersByKey = new Map();

        for (
            const filter
            of activePropertyFilters
        ) {

            if (!filtersByKey.has(filter.key)) {
                filtersByKey.set(
                    filter.key,
                    []
                );
            }

            filtersByKey
                .get(filter.key)
                .push(filter.value);
        }

        for (
            const [key, values]
            of filtersByKey
        ) {

            const propertyValues =
                modelProperties.get(key);

            if (!propertyValues) {
                return new Set();
            }

            const groupIds = new Set();

            for (const value of values) {

                const propertyIds =
                    propertyValues.get(value);

                if (!propertyIds) {
                    continue;
                }

                for (const id of propertyIds) {
                    groupIds.add(id);
                }
            }

            if (!groupIds.size) {
                return new Set();
            }

            ids = new Set(
                [...ids].filter(
                    id => groupIds.has(id)
                )
            );

            if (!ids.size) {
                return ids;
            }
        }
    }

    return ids;
}


// =====================================================
// ESCAPAR HTML
// =====================================================

function escapeHtml(value) {

    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}


// =====================================================
// CAMBIAR OPACIDAD DEL MODELO
// =====================================================

function setModelOpacity(opacity) {

    const value = THREE.MathUtils.clamp(opacity, 0, 1);

    if (!arModel) {
        console.warn('⚠️ setModelOpacity: arModel es null');
        return;
    }

    arModel.traverse((object) => {
        // ... tu código de materiales igual ...
    });

    console.log('🎨 setModelOpacity: fragments.list.has(main)?', fragments?.list?.has('main'));
    console.log('🎨 setModelOpacity: loadedModelId actual:', loadedModelId);
    console.log('🎨 setModelOpacity: keys disponibles:', fragments ? [...fragments.list.keys()] : 'fragments no existe');

    if (fragments && loadedModelId && fragments.list.has(loadedModelId)) {
        fragments.core.update(true);
        console.log('✅ update() ejecutado correctamente');
    } else {
        console.warn('⚠️ update() OMITIDO porque el modelId no coincide o no existe aún');
    }
}


// =====================================================
// SELECT EN AR
// =====================================================

async function onARSelect() {

    if (!isAR) return;
    if (!arReticle || !arReticle.visible) return;

    const position = new THREE.Vector3();
    position.setFromMatrixPosition(arReticle.matrix);

    if (modelLoaded && arModel) {
        arModel.position.copy(position);
        arModel.visible = true;
        console.log('📍 Modelo colocado (ya estaba cargado)');
        return;
    }

    if (modelLoading) {
        console.log('⏳ Ya está cargando, ignorando tap');
        return;
    }

    modelLoading = true;

    const url = container.dataset.url;

    if (!url) {
        console.error('❌ No existe data-url en #viewer');
        modelLoading = false;
        return;
    }

    try {

        console.log('📥 Iniciando carga desde:', url);

        const response = await fetch(url + '?type=frag');

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();

        console.log('📦 Buffer recibido, tamaño:', buffer.byteLength);

        console.log('🚀 Llamando fragments.core.load con modelId: "main"');

        const loadResult = await fragments.core.load(buffer, {
            modelId: 'main'
        });

        console.log('✅ fragments.core.load resuelto');
        console.log('loadResult:', loadResult);
        console.log('fragments.list keys DESPUÉS de load:', [...fragments.list.keys()]);

        // -------------------------------------------------
        // ESPERAR A QUE onItemSet TERMINE DE PROCESAR
        // -------------------------------------------------

        await waitForModel();

        console.log('🎯 waitForModel resuelto. loadedModelId:', loadedModelId);

        if (arModel) {
            arModel.position.copy(position);
            arModel.visible = true;
            console.log('✅ Modelo colocado en AR con ID:', loadedModelId);
        } else {
            console.error('❌ arModel sigue null después de waitForModel');
        }

    } catch (error) {

        console.error('❌ Error cargando IFC:', error);
        console.error('Stack:', error.stack);
        modelLoading = false;
    }
}


function waitForModel(timeout = 8000) {

    return new Promise((resolve, reject) => {

        const start = performance.now();

        function check() {

            if (arModel && modelLoaded) {
                console.log('🔍 waitForModel: condición cumplida');
                resolve();
                return;
            }

            if (performance.now() - start > timeout) {
                console.error('⏱️ waitForModel: TIMEOUT');
                reject(new Error('Timeout esperando el modelo'));
                return;
            }

            requestAnimationFrame(check);
        }

        check();
    });
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
    // =====================================================

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
    // =====================================================

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
