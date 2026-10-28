// ============================================
// ESTADO GLOBAL
// ============================================
let container;
let scene, camera, renderer;
let components, fragments, hider;

let arReticle = null;
let hitTestSource = null;
let hitTestSourceRequested = false;

let arModel = null;            // objeto geométrico real del modelo (hijo del contenedor)
let arModelContainer = null;   // NUEVO: contenedor que se mueve/escala en AR
let modelLoaded = false;
let modelLoading = false;
let loadedModelId = null;

let modelProperties = new Map();
let modelCategories = new Map();
let activePropertyFilters = [];
let categoryVisibility = new Map();

let opacityValue = 1;
let isAR = false;

const DESIRED_MAX_SIZE = 2; // metros — tamaño máximo deseado del modelo en AR (modo "maqueta")

// ============================================
// INIT PRINCIPAL
// ============================================
async function initViewer() {
    container = document.getElementById('ar-viewer-container');
    if (!container) {
        console.error('❌ No se encontró #ar-viewer-container');
        return;
    }

    // --- Escena, cámara, renderer ---
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
    );

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // --- Botón AR (WebXR) ---
    const arButton = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'light-estimation'],
        domOverlay: { root: document.getElementById('ar-ui-container') }
    });
    document.body.appendChild(arButton);

    // --- Reticle (indicador de superficie detectada) ---
    const reticleGeometry = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    arReticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    arReticle.matrixAutoUpdate = false;
    arReticle.visible = false;
    scene.add(arReticle);

    // --- Controller táctil (tap en pantalla durante sesión AR) ---
    const controller = renderer.xr.getController(0);
    controller.addEventListener('select', onARSelect);
    scene.add(controller);

    renderer.xr.addEventListener('sessionstart', onARSessionStart);
    renderer.xr.addEventListener('sessionend', onARSessionEnd);

    // ============================================
    // ThatOpen Engine — FragmentsManager
    // ============================================
    components = new OBC.Components();

    fragments = components.get(OBC.FragmentsManager);

    // ⚠️ AJUSTA ESTA RUTA si en tu proyecto el worker.mjs está en otra ubicación/CDN
    const workerUrl = '/vendor/thatopen/worker.mjs';
    await fragments.init(workerUrl);

    hider = components.get(OBC.Hider);

    // --- Listener de carga de modelo (SOLO operaciones síncronas) ---
    fragments.list.onItemSet.add(({ value: model }) => {
        console.log('🟢 onItemSet disparado, modelId:', model.modelId);

        model.useCamera(camera);
        arModel = model.object;

        // NUEVO: contenedor para centrar/escalar sin tocar la geometría interna
        arModelContainer = new THREE.Group();
        arModelContainer.visible = false;
        scene.add(arModelContainer);
        arModelContainer.add(arModel);

        loadedModelId = model.modelId;
        modelLoaded = true;
        modelLoading = false;

        console.log('✅ Modelo registrado en escena:', model.modelId);
    });

    // --- UI: opacidad, force-place, filtros ---
    setupOpacitySlider();
    setupForcePlaceButton();
    setupPropertyFilters();

    renderer.setAnimationLoop(render);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// SESIÓN AR — hit-test lifecycle
// ============================================
function onARSessionStart() {
    isAR = true;
    console.log('AR iniciado');
}

function onARSessionEnd() {
    isAR = false;
    hitTestSource = null;
    hitTestSourceRequested = false;
    if (arReticle) arReticle.visible = false;
    console.log('AR finalizado');
}

// ============================================
// LOOP DE RENDER (hit-test + reticle)
// ============================================
function render(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then((viewerSpace) => {
                session.requestHitTestSource({ space: viewerSpace }).then((source) => {
                    hitTestSource = source;
                });
            });
            session.addEventListener('end', () => {
                hitTestSourceRequested = false;
                hitTestSource = null;
            });
            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);
                arReticle.visible = true;
                arReticle.matrix.fromArray(pose.transform.matrix);
            } else {
                arReticle.visible = false;
            }
        }
    }

    renderer.render(scene, camera);
}

// ============================================
// SELECCIÓN POR TAP (hit-test normal)
// ============================================
async function onARSelect() {
    if (!isAR) return;
    if (!arReticle || !arReticle.visible) return;

    const position = new THREE.Vector3();
    position.setFromMatrixPosition(arReticle.matrix);

    await loadAndPlaceModel(position);
}

// ============================================
// COLOCACIÓN FORZADA (sin depender del hit-test)
// ============================================
async function forcePlaceModel() {
    if (!isAR) {
        console.warn('⚠️ No estás en sesión AR');
        return;
    }

    const distance = 1.5; // metros frente a la cámara — ajustar si es necesario
    const cameraPosition = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    camera.getWorldDirection(cameraDirection);

    const targetPosition = cameraPosition.clone().add(cameraDirection.multiplyScalar(distance));
    targetPosition.y -= 0.5; // simular "suelo" — ajustar si es necesario

    console.log('📍 Colocando modelo forzadamente en:', targetPosition);

    await loadAndPlaceModel(targetPosition);
}

function setupForcePlaceButton() {
    const forcePlaceBtn = document.getElementById('ar-force-place');
    if (forcePlaceBtn) {
        forcePlaceBtn.addEventListener('click', async () => {
            await forcePlaceModel();
        });
    }
}

// ============================================
// CARGA + COLOCACIÓN DEL MODELO (FIX: centrado + autoescala)
// ============================================
async function loadAndPlaceModel(position) {
    // Si ya está cargado, solo reposicionamos el CONTENEDOR (no el modelo crudo)
    if (modelLoaded && arModel && arModelContainer) {
        arModelContainer.position.copy(position);
        arModelContainer.visible = true;
        console.log('📍 Modelo colocado (ya estaba cargado)');
        return;
    }

    if (modelLoading) return;
    modelLoading = true;

    const url = container.dataset.url;
    if (!url) {
        console.error('❌ container.dataset.url no está definido');
        modelLoading = false;
        return;
    }

    try {
        console.log('📥 Iniciando carga desde:', url);
        const response = await fetch(url + '?type=frag');
        if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        console.log('📦 Buffer recibido, tamaño:', buffer.byteLength);

        await fragments.core.load(buffer, { modelId: 'main' });
        console.log('✅ fragments.core.load resuelto completamente');

        const model = fragments.list.get('main');
        if (!model) throw new Error('Modelo no encontrado en fragments.list después de load()');

        console.log('🔍 Construyendo properties...');
        modelProperties = await buildModelProperties(model);
        console.log('✅ Properties construidas:', modelProperties.size);

        console.log('🔍 Construyendo categories...');
        modelCategories = await buildModelCategories(model);
        console.log('✅ Categories construidas:', modelCategories.size);

        buildPropertyUI();
        buildCategoryUI();

        await fragments.core.update(true);

        // ================================================
        // NUEVO: CENTRADO DEL MODELO + AUTOESCALA A "MAQUETA"
        // ================================================
        const box = new THREE.Box3().setFromObject(arModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        console.log('📦 Tamaño real del modelo (antes de centrar):', size);
        console.log('📦 Centro real del modelo (antes de centrar):', center);

        if (!arModel.userData.recentered) {
            // Desplazamos la geometría DENTRO del contenedor para que
            // el centro del modelo quede en el origen local (0,0,0)
            arModel.position.sub(center);
            arModel.userData.recentered = true;
            arModel.userData.originalSize = size.clone();
            console.log('✅ Modelo recentrado. Offset aplicado:', center);
        }

        const maxDimension = Math.max(size.x, size.y, size.z);
        let autoScale = 1;
        if (maxDimension > DESIRED_MAX_SIZE) {
            autoScale = DESIRED_MAX_SIZE / maxDimension;
        }
        console.log('📐 Dimensión máxima:', maxDimension, '→ autoScale aplicado:', autoScale);
        // ================================================
        // FIN DEL FIX
        // ================================================

        // Deshabilitar frustum culling (evita recortes raros tras centrar)
        arModel.traverse((obj) => {
            if (obj.isMesh) obj.frustumCulled = false;
        });

        if (arModelContainer) {
            arModelContainer.position.copy(position);
            arModelContainer.scale.set(autoScale, autoScale, autoScale);
            arModelContainer.visible = true;
            setModelOpacity(opacityValue);
        }

        console.log('✅ Modelo colocado en AR con ID:', loadedModelId);
    } catch (error) {
        console.error('❌ Error cargando IFC:', error);
        modelLoading = false;
    }
}

// ============================================
// OPACIDAD
// ============================================
function setModelOpacity(opacity) {
    opacityValue = opacity;
    if (!arModel) return;

    arModel.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;

        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];

        materials.forEach((material) => {
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

            if (opacity >= 1) {
                material.opacity = original.opacity;
                material.transparent = original.transparent;
                material.depthWrite = original.depthWrite;
                material.depthTest = original.depthTest;
                material.side = original.side;
                material.alphaTest = original.alphaTest;
                material.blending = original.blending;
            } else {
                material.opacity = opacity;
                material.transparent = true;
                material.depthWrite = false;
                material.depthTest = true;
                material.side = THREE.DoubleSide;
                material.blending = THREE.NormalBlending;
            }

            material.needsUpdate = true;
        });
    });

    if (fragments && modelLoaded) {
        fragments.core.update(true);
    }
}

function setupOpacitySlider() {
    const opacitySlider = document.getElementById('ar-opacity');
    if (!opacitySlider) return;

    opacitySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        setModelOpacity(value);
    });
}

// ============================================
// EXTRACCIÓN DE PROPERTY SETS
// ============================================
function extractPropertySets(data) {
    const result = [];

    function walk(node) {
        if (!node || typeof node !== 'object') return;

        if (node._category?.value === 'IFCPROPERTYSET') {
            result.push(node);
        }

        for (const key in node) {
            const value = node[key];
            if (Array.isArray(value)) {
                value.forEach(walk);
            } else if (value && typeof value === 'object') {
                walk(value);
            }
        }
    }

    if (Array.isArray(data)) {
        data.forEach(walk);
    } else {
        walk(data);
    }

    return result;
}

// ============================================
// CONSTRUCCIÓN DE MAPAS DE PROPERTIES
// ============================================
async function buildModelProperties(model) {
    const propertiesMap = new Map();

    const ids = await model.getItems();
    const data = await model.getItemsData(ids, {
        attributesDefault: true,
        relations: {
            IsDefinedBy: { attributes: true, relations: true },
            IsTypedBy: { attributes: true, relations: true }
        }
    });

    data.forEach((itemData, index) => {
        const id = ids[index];
        const propertySets = extractPropertySets(itemData);

        propertySets.forEach((pset) => {
            const props = pset.HasProperties || pset.properties || [];
            const propsArray = Array.isArray(props) ? props : [props];

            propsArray.forEach((prop) => {
                const name = prop.Name?.value ?? prop.name?.value;
                const value = prop.NominalValue?.value ?? prop.value?.value;

                if (name === undefined || value === undefined) return;

                if (!propertiesMap.has(name)) {
                    propertiesMap.set(name, new Map());
                }
                const valuesMap = propertiesMap.get(name);

                const valueKey = String(value);
                if (!valuesMap.has(valueKey)) {
                    valuesMap.set(valueKey, []);
                }
                valuesMap.get(valueKey).push(id);
            });
        });
    });

    return propertiesMap;
}

async function buildModelCategories(model) {
    const categoriesMap = new Map();

    const ids = await model.getItems();
    const data = await model.getItemsData(ids, { attributesDefault: true });

    data.forEach((itemData, index) => {
        const id = ids[index];
        const category = itemData._category?.value;
        if (!category) return;

        if (!categoriesMap.has(category)) {
            categoriesMap.set(category, []);
        }
        categoriesMap.get(category).push(id);
    });

    return categoriesMap;
}

// ============================================
// UI: FILTROS DE PROPIEDADES
// ============================================
function buildPropertyUI() {
    const keySelect = document.getElementById('ar-property-key');
    if (!keySelect) return;

    keySelect.innerHTML = '<option value="">Selecciona una propiedad...</option>';

    const sortedKeys = Array.from(modelProperties.keys()).sort();
    sortedKeys.forEach((key) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        keySelect.appendChild(option);
    });

    console.log('🧩 buildPropertyUI: keys cargadas:', sortedKeys.length);
}

function setupPropertyFilters() {
    const keySelect = document.getElementById('ar-property-key');
    const valueSelect = document.getElementById('ar-property-value');
    const applyBtn = document.getElementById('ar-apply-property');
    const clearBtn = document.getElementById('ar-clear-property');
    const resetBtn = document.getElementById('ar-reset-filters');

    if (keySelect) {
        keySelect.addEventListener('change', () => {
            const selectedKey = keySelect.value;
            if (!valueSelect) return;

            valueSelect.innerHTML = '<option value="">Selecciona un valor...</option>';
            valueSelect.disabled = !selectedKey;
            if (applyBtn) applyBtn.disabled = true;

            if (selectedKey && modelProperties.has(selectedKey)) {
                const values = Array.from(modelProperties.get(selectedKey).keys()).sort();
                values.forEach((value) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    valueSelect.appendChild(option);
                });
            }
        });
    }

    if (valueSelect) {
        valueSelect.addEventListener('change', () => {
            if (applyBtn) applyBtn.disabled = !valueSelect.value;
        });
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const key = keySelect.value;
            const value = valueSelect.value;
            if (!key || !value) return;

            const exists = activePropertyFilters.some(
                (f) => f.key === key && f.value === value
            );
            if (!exists) {
                activePropertyFilters.push({ key, value });
                renderPropertyFilters();
                applyAllFilters();
            }

            keySelect.value = '';
            valueSelect.innerHTML = '<option value="">Selecciona un valor...</option>';
            valueSelect.disabled = true;
            applyBtn.disabled = true;
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            activePropertyFilters = [];
            renderPropertyFilters();
            applyAllFilters();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetAllFilters);
    }
}

function renderPropertyFilters() {
    const container = document.getElementById('ar-property-filters');
    if (!container) return;

    container.innerHTML = '';

    activePropertyFilters.forEach((filter, index) => {
        const chip = document.createElement('span');
        chip.className = 'ar-filter-chip';
        chip.innerHTML = `
            ${escapeHtml(filter.key)}: ${escapeHtml(filter.value)}
            <button type="button" data-index="${index}" class="ar-filter-remove">&times;</button>
        `;
        container.appendChild(chip);
    });

    container.querySelectorAll('.ar-filter-remove').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
            activePropertyFilters.splice(index, 1);
            renderPropertyFilters();
            applyAllFilters();
        });
    });
}

// ============================================
// UI: CATEGORÍAS
// ============================================
function buildCategoryUI() {
    const container = document.getElementById('ar-categories-container');
    if (!container) return;

    container.innerHTML = '';

    const sortedCategories = Array.from(modelCategories.keys()).sort();
    sortedCategories.forEach((category) => {
        const wrapper = document.createElement('label');
        wrapper.className = 'ar-category-item';
        wrapper.innerHTML = `
            <input type="checkbox" class="ar-category-toggle" data-category="${escapeHtml(category)}" checked>
            <span>${escapeHtml(category)}</span>
        `;
        container.appendChild(wrapper);
    });

    container.querySelectorAll('.ar-category-toggle').forEach((checkbox) => {
        checkbox.addEventListener('change', (e) => {
            const category = e.target.dataset.category;
            toggleCategory(category, e.target.checked);
        });
    });

    console.log('🧩 buildCategoryUI: categorías cargadas:', sortedCategories.length);
}

function toggleCategory(category, visible) {
    categoryVisibility.set(category, visible);
    applyAllFilters();
}

function resetAllFilters() {
    activePropertyFilters = [];
    categoryVisibility.clear();

    renderPropertyFilters();

    document.querySelectorAll('.ar-category-toggle').forEach((checkbox) => {
        checkbox.checked = true;
    });

    applyAllFilters();
}

// ============================================
// APLICACIÓN DE FILTROS (categorías AND propiedades)
// ============================================
function getFilteredModelIds() {
    // --- IDs visibles por categoría ---
    let categoryIds = new Set();
    let hasAnyCategory = false;

    modelCategories.forEach((ids, category) => {
        const isVisible = categoryVisibility.has(category)
            ? categoryVisibility.get(category)
            : true;

        if (isVisible) {
            hasAnyCategory = true;
            ids.forEach((id) => categoryIds.add(id));
        }
    });

    if (!hasAnyCategory) {
        return [];
    }

    // --- IDs que cumplen los filtros de propiedades ---
    if (activePropertyFilters.length === 0) {
        return Array.from(categoryIds);
    }

    // Agrupar filtros por clave (OR intra-clave)
    const filtersByKey = new Map();
    activePropertyFilters.forEach((filter) => {
        if (!filtersByKey.has(filter.key)) {
            filtersByKey.set(filter.key, []);
        }
        filtersByKey.get(filter.key).push(filter.value);
    });

    let resultIds = null;

    filtersByKey.forEach((values, key) => {
        const valuesMap = modelProperties.get(key);
        let idsForKey = new Set();

        if (valuesMap) {
            values.forEach((value) => {
                const ids = valuesMap.get(value) || [];
                ids.forEach((id) => idsForKey.add(id));
            });
        }

        if (resultIds === null) {
            resultIds = idsForKey;
        } else {
            // AND entre claves distintas
            resultIds = new Set(
                [...resultIds].filter((id) => idsForKey.has(id))
            );
        }
    });

    // Intersección final con categorías visibles
    const finalIds = [...(resultIds || new Set())].filter((id) => categoryIds.has(id));
    return finalIds;
}

async function applyAllFilters() {
    if (!hider || !loadedModelId) return;

    const filteredIds = getFilteredModelIds();

    await hider.set(false);
    await hider.set(true, { [loadedModelId]: filteredIds });

    await fragments.core.update(true);
}

// ============================================
// UTILIDAD
// ============================================
function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

// ============================================
// BOOTSTRAP
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initViewer().catch((error) => {
        console.error('❌ Error inicializando el visor AR:', error);
    });
});
