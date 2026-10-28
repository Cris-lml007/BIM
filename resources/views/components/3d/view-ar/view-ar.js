// ======================================================
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

// Notificación de "superficie detectada" (una vez por sesión AR)
let surfaceFoundNotified = false;

// =====================================================
// PROPERTY SETS / FILTROS
// =====================================================

let loadedModelId = null;

let modelProperties = new Map();
let modelCategories = new Map();

let activePropertyFilters = [];
let categoryVisibility = new Map();


// =====================================================
// TOASTS (notificaciones de estado)
// =====================================================

let toastCounter = 0;

function showToast(message, type = 'info', duration = 4000) {

    const toastContainer =
        document.getElementById('ar-toast-container');

    if (!toastContainer) {
        return;
    }

    const id =
        `ar-toast-${++toastCounter}`;

    const toast =
        document.createElement('div');

    toast.id = id;
    toast.className = `ar-toast ar-toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('ar-toast-show');
    });

    setTimeout(() => {

        toast.classList.remove('ar-toast-show');

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, duration);
}


// =====================================================
// PANELES FLOTANTES (FAB BAR)
// =====================================================

function closeAllPanels() {

    document
        .querySelectorAll('.ar-floating-panel')
        .forEach(panel => {
            panel.classList.remove('ar-panel-open');
        });

    document
        .querySelectorAll('.ar-fab[data-panel]')
        .forEach(btn => {
            btn.classList.remove('active');
        });
}


function setupARPanels() {

    const fabButtons =
        document.querySelectorAll('.ar-fab[data-panel]');

    fabButtons.forEach(btn => {

        btn.addEventListener('click', () => {

            const targetId =
                `ar-panel-${btn.dataset.panel}`;

            const targetPanel =
                document.getElementById(targetId);

            if (!targetPanel) {
                return;
            }

            const isOpen =
                targetPanel.classList.contains(
                    'ar-panel-open'
                );

            closeAllPanels();

            if (!isOpen) {

                targetPanel.classList.add(
                    'ar-panel-open'
                );

                btn.classList.add('active');
            }
        });
    });

    document
        .querySelectorAll('.ar-panel-close')
        .forEach(btn => {

            btn.addEventListener('click', () => {
                closeAllPanels();
            });
        });
}


function updateFabBadges() {

    const propsBadge =
        document.getElementById(
            'ar-fab-badge-properties'
        );

    if (propsBadge) {

        const count =
            activePropertyFilters.length;

        propsBadge.textContent = count;

        propsBadge.style.display =
            count > 0 ? 'flex' : 'none';
    }

    const catBadge =
        document.getElementById(
            'ar-fab-badge-categories'
        );

    if (catBadge) {

        let hiddenCount = 0;

        categoryVisibility.forEach(visible => {

            if (!visible) {
                hiddenCount++;
            }
        });

        catBadge.textContent = hiddenCount;

        catBadge.style.display =
            hiddenCount > 0 ? 'flex' : 'none';
    }
}


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
    // HIDER
    // =================================================

    hider =
        components.get(
            OBC.Hider
        );


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
                '🟢 onItemSet disparado, modelId:',
                model.modelId
            );


            model.useCamera(
                camera
            );


            scene.add(
                model.object
            );


            arModel =
                model.object;


            arModel.scale.set(
                1,
                1,
                1
            );


            arModel.visible =
                false;


            loadedModelId =
                model.modelId;


            modelLoaded =
                true;


            modelLoading =
                false;


            console.log(
                '✅ Modelo registrado en escena:',
                loadedModelId
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
    // CONFIGURAR SLIDER DE OPACIDAD
    // =================================================

    if (opacitySlider) {

        opacitySlider.addEventListener(
            'input',
            () => {

                opacityValue =
                    Number(
                        opacitySlider.value
                    ) / 100;


                if (opacityText) {

                    opacityText.textContent =
                        `${opacitySlider.value}%`;
                }


                setModelOpacity(
                    opacityValue
                );
            }
        );
    }


    // =================================================
    // CONFIGURAR FILTROS DE PROPERTIES
    // =================================================

    setupPropertyFilters();


    // =================================================
    // CONFIGURAR PANELES FLOTANTES / FAB BAR
    // =================================================

    setupARPanels();


    // =================================================
    // CONFIGURAR RESET DE FILTROS
    // =================================================

    const resetFiltersBtn =
        document.getElementById(
            'ar-reset-filters'
        );

    if (resetFiltersBtn) {

        resetFiltersBtn.addEventListener(
            'click',
            async () => {

                await resetAllFilters();

                showToast(
                    '🔄 Filtros reiniciados',
                    'info'
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


            surfaceFoundNotified =
                false;


            closeAllPanels();


            if (arModel) {

                arModel.visible =
                    false;
            }


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


            if (arUI) {

                arUI.style.display =
                    'block';
            }


            showToast(
                '🟢 Sesión AR iniciada. Buscando superficie...',
                'info',
                5000
            );
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


            surfaceFoundNotified =
                false;


            closeAllPanels();


            if (arReticle) {

                arReticle.visible =
                    false;
            }


            if (arUI) {

                arUI.style.display =
                    'none';
            }


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

            updateAR(
                frame
            );


            if (
                isAR &&
                arModel
            ) {

                fragments.core.update();
            }


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
// CONSTRUIR PROPERTIES DEL MODELO
// =====================================================

async function buildModelProperties(model) {

    const items =
        await model.getItems();

    const ids =
        Array.from(items.keys());

    const data =
        await model.getItemsData(
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

        const id =
            item._localId?.value;

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

                const key =
                    property.name;

                const value =
                    String(property.value);

                if (!properties.has(key)) {

                    properties.set(
                        key,
                        new Map()
                    );
                }

                const values =
                    properties.get(key);

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

    const items =
        await model.getItems();

    const ids =
        Array.from(items.keys());

    const data =
        await model.getItemsData(
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

        const id =
            item._localId?.value;

        const category =
            item._category?.value;

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

        console.warn(
            '⚠️ No se encontraron los selects de property-key/value en el DOM'
        );

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

    console.log(
        '🧩 buildPropertyUI: keys cargadas:',
        sortedKeys.length
    );
}


// =====================================================
// CONSTRUIR UI DE CATEGORÍAS
// =====================================================

function buildCategoryUI() {

    const container =
        document.getElementById(
            'ar-categories-container'
        );

    if (!container) {

        console.warn(
            '⚠️ No se encontró ar-categories-container en el DOM'
        );

        return;
    }

    container.innerHTML = '';

    for (
        const [groupName, categoryIds]
        of modelCategories
    ) {

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

    console.log(
        '🧩 buildCategoryUI: categorías cargadas:',
        modelCategories.size
    );
}


// =====================================================
// CONFIGURAR FILTROS DE PROPERTIES
// =====================================================

function setupPropertyFilters() {

    const selectKey =
        document.getElementById(
            'ar-property-key'
        );

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


    const selectValue =
        document.getElementById(
            'ar-property-value'
        );

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


    const btnApply =
        document.getElementById(
            'ar-apply-property'
        );

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


    const btnClear =
        document.getElementById(
            'ar-clear-property'
        );

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
        document.getElementById(
            'ar-property-filters'
        );

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

        const filter =
            activePropertyFilters[index];

        const item =
            document.createElement('div');

        item.className =
            'ar-filter-chip';

        item.innerHTML = `
<div class="d-flex align-items-center justify-content-between gap-1">

    <span class="small text-truncate">
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

    categoryVisibility.clear();

    activePropertyFilters = [];

    document
        .querySelectorAll('.ar-category-toggle')
        .forEach(cb => {
            cb.checked = true;
        });

    const keyEl =
        document.getElementById(
            'ar-property-key'
        );

    const valueEl =
        document.getElementById(
            'ar-property-value'
        );

    const applyEl =
        document.getElementById(
            'ar-apply-property'
        );

    if (keyEl) keyEl.value = '';

    if (valueEl) {

        valueEl.innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;
        valueEl.disabled = true;
    }

    if (applyEl) applyEl.disabled = true;

    renderPropertyFilters();

    await applyAllFilters();
}


// =====================================================
// APLICAR TODOS LOS FILTROS
// =====================================================

async function applyAllFilters() {

    if (
        !fragments ||
        !loadedModelId ||
        !hider
    ) {
        return;
    }

    const filteredIds =
        getFilteredModelIds();

    const modelIdMap = {
        [loadedModelId]: filteredIds
    };

    await hider.set(false);

    await hider.set(
        true,
        modelIdMap
    );

    fragments.core.update(true);

    updateFabBadges();
}


// =====================================================
// OBTENER IDS FILTRADOS
// =====================================================

function getFilteredModelIds() {

    let ids = new Set();

    // -------------------------------------------------
    // CATEGORÍAS
    // -------------------------------------------------

    for (
        const [category, categoryIds]
        of modelCategories
    ) {

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


    // -------------------------------------------------
    // PROPERTY FILTERS
    // -------------------------------------------------

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

    const div =
        document.createElement('div');

    div.textContent = value;

    return div.innerHTML;
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

                    } else {

                        material.opacity =
                            original.opacity *
                            value;

                        material.transparent =
                            true;

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


    if (fragments && modelLoaded) {

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


    if (
        !arReticle ||
        !arReticle.visible
    ) {

        return;
    }


    const position =
        new THREE.Vector3();


    position.setFromMatrixPosition(
        arReticle.matrix
    );


    // =================================================
    // MODELO YA CARGADO → SOLO REPOSICIONAR
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
            '📍 Modelo colocado (ya estaba cargado)'
        );


        showToast(
            '📍 Modelo reposicionado',
            'success'
        );


        return;
    }


    if (modelLoading) {
        return;
    }


    modelLoading =
        true;


    const url =
        container.dataset.url;


    if (!url) {

        console.error(
            '❌ No existe data-url en #viewer'
        );


        modelLoading =
            false;


        showToast(
            '❌ No se encontró la URL del modelo',
            'error'
        );


        return;
    }


    // =================================================
    // CARGAR IFC
    // =================================================

    try {

        console.log(
            '📥 Iniciando carga desde:',
            url
        );


        showToast(
            '📥 Cargando modelo IFC...',
            'info',
            8000
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
            '📦 Buffer recibido, tamaño:',
            buffer.byteLength
        );


        await fragments.core.load(
            buffer,
            {
                modelId: 'main'
            }
        );


        console.log(
            '✅ fragments.core.load resuelto completamente'
        );


        const model =
            fragments.list.get('main');


        if (!model) {

            throw new Error(
                'Modelo no encontrado en fragments.list después de load()'
            );
        }


        console.log(
            '🔍 Construyendo properties...'
        );

        modelProperties =
            await buildModelProperties(model);

        console.log(
            '✅ Properties construidas:',
            modelProperties.size
        );


        console.log(
            '🔍 Construyendo categories...'
        );

        modelCategories =
            await buildModelCategories(model);

        console.log(
            '✅ Categories construidas:',
            modelCategories.size
        );


        buildPropertyUI();
        buildCategoryUI();


        let totalElements = 0;

        for (
            const categoryIds
            of modelCategories.values()
        ) {

            totalElements +=
                categoryIds.length;
        }


        showToast(
            `✅ Modelo cargado: ${totalElements} elementos, ${modelCategories.size} categorías`,
            'success',
            5000
        );


        await fragments.core.update(
            true
        );


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


            setModelOpacity(
                opacityValue
            );


            console.log(
                '✅ Modelo colocado en AR con ID:',
                loadedModelId
            );


            showToast(
                '📍 Modelo colocado sobre la superficie',
                'success'
            );
        }

    } catch (error) {

        console.error(
            '❌ Error cargando IFC:',
            error
        );


        modelLoading =
            false;


        showToast(
            '❌ Error cargando el modelo IFC',
            'error',
            6000
        );
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


                if (!surfaceFoundNotified) {

                    surfaceFoundNotified =
                        true;


                    showToast(
                        '🎯 Superficie detectada. Toca la pantalla para colocar el modelo',
                        'success',
                        5000
                    );
                }
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
