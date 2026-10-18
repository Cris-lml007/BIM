
const container = document.getElementById('viewer');

if (!container) {
    throw new Error('No se encontró el elemento #viewer');
}

const opacitySlider = document.getElementById('ar-opacity');
const opacityText = document.getElementById('ar-opacity-value');
const layersList = document.getElementById('layers-list');

let components;
let world;
let fragments;
let hider;

let renderer;
let scene;
let camera;
let controls;

let model = null;
let modelLoading = false;
let modelLoaded = false;
let opacityValue = 1;

// Capas por modelo: Map<modelId, Map<category, localIds[]>>
const modelCategories = new Map();
const layersPreparing = new Set();


// =====================================================
// INICIALIZAR VISOR 3D
// =====================================================

async function initViewer() {

    // THAT OPEN
    components = new OBC.Components();

    const worlds = components.get(OBC.Worlds);
    world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.scene.setup();

    world.scene.three.background = null;
    scene = world.scene.three;


    // RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    container.appendChild(renderer.domElement);


    // CÁMARA
    camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        10000
    );

    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);


    // CONTROLES ORBITALES
    controls = new OrbitControls(
        camera,
        renderer.domElement
    );

    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.update();


    // COMPONENTS
    components.init();


    // FRAGMENTS
    fragments = components.get(OBC.FragmentsManager);
    hider = components.get(OBC.Hider);

    fragments.init('/engine/worker.mjs');


    // =================================================
    // REGISTRO DEL MODELO
    // =================================================

    fragments.list.onItemSet.add(({ value: loadedModel }) => {

        console.log('Modelo Fragments cargado');

        loadedModel.useCamera(camera);

        scene.add(loadedModel.object);

        model = loadedModel.object;
        model.visible = true;

        modelLoaded = true;
        modelLoading = false;

        fragments.core.update(true);

        setModelOpacity(opacityValue);

        // Preparar las capas sin bloquear la visualización.

        console.log('Modelo 3D preparado');
    });


    // =================================================
    // SLIDER DE OPACIDAD
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
    // BUCLE DE RENDERIZADO
    // =================================================

    renderer.setAnimationLoop(() => {

        controls.update();

        if (fragments) {
            fragments.core.update();
        }

        renderer.render(scene, camera);
    });


    // RESIZE
    window.addEventListener('resize', onResize);


    // CARGA AUTOMÁTICA
    await loadModel();
}


// =====================================================
// CARGAR MODELO FRAGMENTS
// =====================================================

async function loadModel() {

    if (modelLoaded || modelLoading) {
        return;
    }

    const url = container.dataset.url;

    if (!url) {
        console.error('No existe data-url en #viewer');
        return;
    }

    modelLoading = true;

    try {

        console.log('Cargando modelo 3D...');

        const response = await fetch(url + '?type=frag');

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();

        console.log('Fragment recibido');

        await fragments.core.load(buffer, {
            modelId: 'main'
        });

        // Mantener el acceso al modelo que ya funciona
        // en tu visor.
        const registeredModel = fragments.list.get('main');

        if (registeredModel) {

            registeredModel.useCamera(camera);

            if (!model) {
                scene.add(registeredModel.object);
                model = registeredModel.object;
            }

            model.visible = true;
            modelLoaded = true;
            modelLoading = false;

            setModelOpacity(opacityValue);
            fragments.core.update(true);

            // El evento onItemSet también prepara las capas.
            // Esta llamada cubre el caso en que el modelo
            // ya estaba registrado antes de consultar la lista.
            await prepareModelLayers(registeredModel);

            console.log('Modelo 3D cargado correctamente');
        }

    } catch (error) {

        console.error('Error cargando el modelo 3D:', error);
        modelLoading = false;
    }
}


// =====================================================
// PREPARAR CAPAS DEL MODELO
// =====================================================

async function prepareModelLayers(loadedModel) {

    const modelId = loadedModel.modelId;

    if (
        modelCategories.has(modelId) ||
        layersPreparing.has(modelId)
    ) {
        return;
    }

    layersPreparing.add(modelId);

    try {

        console.log(`Leyendo PropertySets del modelo ${modelId}...`);

        const categories = await buildModelCategories(loadedModel);

        modelCategories.set(modelId, categories);

        console.log(
            `Capas encontradas en ${modelId}:`,
            Array.from(categories.keys())
        );

        renderLayersUI();

    } finally {

        layersPreparing.delete(modelId);
    }
}


// =====================================================
// EXTRAER CATEGORÍAS DESDE PROPERTYSETS
// =====================================================

async function buildModelCategories(loadedModel) {

    const categories = new Map();

    // Los elementos del modelo se identifican por sus localIds.
console.log('Modelo recibido:', loadedModel.modelId);

const items = await loadedModel.getItems();

console.log('Elementos recibidos:', items);
console.log('Cantidad de elementos:', items.size);
    const ids = Array.from(items.keys());

    if (ids.length === 0) {
        return categories;
    }

    const data = await loadedModel.getItemsData(ids, {
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
        const itemData = data[index];

        if (!itemData) {
            continue;
        }

        const propertySets = extractPropertySets(itemData);

        // La capa procede del PropertySet "Otra"
        // y de su propiedad "Categoría".
        for (const propertySet of propertySets) {

            if (propertySet.name !== 'Otra') {
                continue;
            }

            for (const property of propertySet.properties) {

                if (property.name !== 'Categoría') {
                    continue;
                }

                const category = property.value;

                if (
                    category === null ||
                    category === undefined ||
                    String(category).trim() === ''
                ) {
                    continue;
                }

                const categoryName = String(category).trim();

                if (!categories.has(categoryName)) {
                    categories.set(categoryName, []);
                }

                categories.get(categoryName).push(localId);
            }
        }
    }

    return categories;
}


// =====================================================
// EXTRAER PROPERTYSETS RECURSIVAMENTE
// =====================================================

function extractPropertySets(data) {

    const propertySets = [];
    const visited = new Set();

    function getValue(value) {

        if (
            value &&
            typeof value === 'object' &&
            Object.prototype.hasOwnProperty.call(value, 'value')
        ) {
            return value.value;
        }

        return value;
    }

    function visit(node) {

        if (!node || typeof node !== 'object') {
            return;
        }

        if (visited.has(node)) {
            return;
        }

        visited.add(node);

        // Detectar un IFC PropertySet.
        if (node._category?.value === 'IFCPROPERTYSET') {

            const setName = getValue(node.Name);
            const properties = [];

            const hasProperties = node.HasProperties;

            if (Array.isArray(hasProperties)) {

                for (const property of hasProperties) {

                    if (!property || typeof property !== 'object') {
                        continue;
                    }

                    properties.push({
                        name: getValue(property.Name),
                        value: getValue(property.NominalValue)
                    });
                }

            } else if (
                hasProperties &&
                typeof hasProperties === 'object'
            ) {

                // Algunos datos pueden representar las relaciones
                // como objetos en lugar de arrays.
                for (const property of Object.values(hasProperties)) {

                    if (!property || typeof property !== 'object') {
                        continue;
                    }

                    properties.push({
                        name: getValue(property.Name),
                        value: getValue(property.NominalValue)
                    });
                }
            }

            propertySets.push({
                name: setName,
                properties
            });
        }

        // Recorrer relaciones y propiedades anidadas.
        if (Array.isArray(node)) {

            for (const child of node) {
                visit(child);
            }

        } else {

            for (const child of Object.values(node)) {
                if (child && typeof child === 'object') {
                    visit(child);
                }
            }
        }
    }

    visit(data);

    return propertySets;
}


// =====================================================
// CONSTRUIR INTERFAZ DE CAPAS
// =====================================================

function renderLayersUI() {

    if (!layersList) {
        console.warn('No se encontró el elemento #layers-list');
        return;
    }

    layersList.replaceChildren();

    const allCategories = new Set();

    for (const categories of modelCategories.values()) {
        for (const category of categories.keys()) {
            allCategories.add(category);
        }
    }

    const sortedCategories = Array.from(allCategories).sort(
        (a, b) => a.localeCompare(b)
    );

    if (sortedCategories.length === 0) {

        const message = document.createElement('p');
        message.className = 'text-muted mb-0';
        message.textContent = 'No se encontraron capas definidas en Otra → Categoría.';

        layersList.appendChild(message);
        return;
    }

    for (const category of sortedCategories) {

        const row = document.createElement('div');
        row.className = 'custom-control custom-checkbox mb-2';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'custom-control-input';
        checkbox.id = `layer-${slugify(category)}`;
        checkbox.checked = true;

        const label = document.createElement('label');
        label.className = 'custom-control-label';
        label.htmlFor = checkbox.id;
        label.textContent = category;

        checkbox.addEventListener('change', async () => {

            try {
                await toggleCategory(category, checkbox.checked);
            } catch (error) {
                console.error(`Error cambiando la capa "${category}":`, error);

                // Si la operación falla, reflejar el estado anterior.
                checkbox.checked = !checkbox.checked;
            }
        });

        row.appendChild(checkbox);
        row.appendChild(label);

        layersList.appendChild(row);
    }
}


// =====================================================
// MOSTRAR / OCULTAR UNA CAPA
// =====================================================

async function toggleCategory(category, visible) {

    for (const [modelId, loadedModel] of fragments.list) {

        const categories = modelCategories.get(modelId);

        if (!categories) {
            continue;
        }

        const ids = categories.get(category);

        if (!ids || ids.length === 0) {
            continue;
        }

        const modelIdMap = {
            [modelId]: ids
        };

        await hider.set(visible, modelIdMap);
    }

    fragments.core.update(true);
}


// =====================================================
// CONVERTIR NOMBRE A ID HTML
// =====================================================

function slugify(value) {

    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'layer';
}


// =====================================================
// OPACIDAD DEL MODELO
// =====================================================

function setModelOpacity(opacity) {

    const value = THREE.MathUtils.clamp(opacity, 0, 1);

    if (!model) {
        return;
    }

    model.traverse((object) => {

        if (!object.isMesh || !object.material) {
            return;
        }

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

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

            material.opacity = original.opacity * value;

            material.transparent = value < 1
                ? true
                : original.transparent;

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
// REDIMENSIONAR
// =====================================================

function onResize() {

    if (!container || !camera || !renderer) {
        return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) {
        return;
    }

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}


// =====================================================
// INICIAR
// =====================================================

initViewer().catch((error) => {
    console.error('No se pudo iniciar el visor:', error);
});
