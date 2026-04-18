const gltfLoader = new GLTFLoader();
// const rgbeLoader = new RGBELoader();

let renderer, scene, camera, controls;
let currentModel = null;

const container = document.getElementById('viewer');
const loading = document.getElementById('loading');
const leftSidebar = document.getElementById('leftSidebar');
const rightSidebar = document.getElementById('rightSidebar');

const leftTab = document.getElementById('leftTab');
const rightTab = document.getElementById('rightTab');
const splash = document.getElementById('app-splash');

let components, world;
let fragments;
let model = null;
let classesMap = {};

let hider;

let clipper_status = false;
let clipper;
let measurer;
let classifier;

let activeLevels = {};
let anchors = [];
let marker;

async function initViewer(container) {
    components = new OBC.Components();
    hider = components.get(OBC.Hider);
    const worlds = components.get(OBC.Worlds);
    world = worlds.create();
    world.scene = new OBC.SimpleScene(components);
    world.scene.setup();
    world.scene.three.background = null;

    world.renderer = new OBF.PostproductionRenderer(components, container);
    world.camera = new OBC.OrthoPerspectiveCamera(components);
    await world.camera.controls.setLookAt(68, 23, -8.5, 0, 0, 0);
    components.init();
    components.get(OBC.Grids).create(world);
    world.scene.setup();
    const scene = world.scene.three;
    scene.background = new THREE.Color(0x1a1d25);
    const workerUrl = "/engine/worker.mjs";
    fragments = components.get(OBC.FragmentsManager);
    fragments.init(workerUrl);

    world.camera.controls.addEventListener("update", () => fragments.core.update());

    world.onCameraChanged.add((camera) => {
        for (const [, model] of fragments.list) {
            model.useCamera(camera.three);
        }
        fragments.core.update(true);
    });

    fragments.list.onItemSet.add(({ value: model }) => {
        model.useCamera(world.camera.three);
        world.scene.three.add(model.object);
        fragments.core.update(true);
    });

    fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
        if (!("isLodMaterial" in material && material.isLodMaterial)) {
            material.polygonOffset = true;
            material.polygonOffsetUnits = 1;
            material.polygonOffsetFactor = Math.random();
        }
    });

    const stats = new Stats();
    stats.showPanel(2);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '10px';
    stats.dom.style.left = '10px';
    stats.dom.style.zIndex = '20';
    container.append(stats.dom);
    world.renderer.onBeforeUpdate.add(() => stats.begin());
    world.renderer.onAfterUpdate.add(() => stats.end());
}

async function ifcLoader(url,id){
    const fragPaths = [
        url+'?type=frag'
    ];

    await Promise.all(
        fragPaths.map(async (path) => {
            const modelId = id;
            if (!modelId) return null;
            const file = await fetch(path);
            const buffer = await file.arrayBuffer();
            return fragments.core.load(buffer, { modelId });
        }),
    );

    renderModelsList();
    await processModel();

    const casters = components.get(OBC.Raycasters);
    casters.get(world);

    clipper = components.get(OBC.Clipper);

    measurer = components.get(OBF.LengthMeasurement);
    measurer.world = world;
    measurer.color = new THREE.Color("#494cb6");
    measurer.snappings = [FRAGS.SnappingClass.POINT];

    const meshes = [];

    for (const [, model] of fragments.list) {
        const idsWithGeometry = await model.getItemsIdsWithGeometry();
        const allMeshesData = await model.getItemsGeometry(idsWithGeometry);

        const geometries = new Map();

        for (const itemId in allMeshesData) {
            const meshData = allMeshesData[itemId];
            for (const geomData of meshData) {
                if (
                    !geomData.positions ||
                        !geomData.indices ||
                        !geomData.transform ||
                        !geomData.representationId
                ) {
                    continue;
                }

                const representationId = geomData.representationId;
                if (!geometries.has(representationId)) {
                    const geometry = new THREE.BufferGeometry();
                    geometry.setAttribute(
                        "position",
                        new THREE.Float32BufferAttribute(geomData.positions, 3),
                    );
                    geometry.setIndex(Array.from(geomData.indices));
                    geometries.set(representationId, geometry);
                }

                const geometry = geometries.get(representationId);

                const mesh = new THREE.Mesh(geometry);
                mesh.applyMatrix4(geomData.transform);
                mesh.applyMatrix4(model.object.matrixWorld);
                mesh.updateWorldMatrix(true, true);
                meshes.push(mesh);
            }
        }
    }

    const pastDelay = measurer.delay;
    const makeSynchronous = async (value) => {
        if (value) {
            measurer.pickerMode = OBF.GraphicVertexPickerMode.SYNCHRONOUS;
            measurer.delay = 0;
            for (const mesh of meshes) {
                world.meshes.add(mesh);
            }
            return;
        }
        measurer.pickerMode = OBF.GraphicVertexPickerMode.DEFAULT;
        measurer.delay = pastDelay;
        for (const mesh of meshes) {
            world.meshes.delete(mesh);
        }
    };

    await makeSynchronous(true);


    classifier = components.get(OBC.Classifier);
    await classifier.byIfcBuildingStorey({ classificationName: "Levels" });
    buildLevelsUIFromClassifier();

    const raycasted = async (data) => {
        const results = [];
        for (const [_, model] of fragments.list) {
            const result = await model.raycast(data);
            if (result) {
                results.push(result);
            }
        }
        await Promise.all(results);
        if (results.length === 0) return null;

        // Find result with smallest distance
        let closestResult = results[0];
        let minDistance = closestResult.distance;

        for (let i = 1; i < results.length; i++) {
            if (results[i].distance < minDistance) {
                minDistance = results[i].distance;
                closestResult = results[i];
            }
        }

        return closestResult;
    };

    const mouse = new THREE.Vector2();

    let onRaycastHoverResult = (_result) => {};
    container.addEventListener("pointermove", async (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        const result = await raycasted({
            camera: world.camera.three,
            mouse,
            dom: world.renderer.three.domElement,
        });
        function format3(n) {
            return Number.isFinite(n) ? n.toFixed(3) : '0.000';
        }
        if(result){
            document.getElementById('xyz').innerHTML =
                `XYZ: (${format3(result.point.x)}, ${format3(result.point.y)}, ${format3(result.point.z)})`;
        }
        if(activeTool == 'anchor' || activeTool == 'issue'){
            onRaycastHoverResult(result);
        }
    });
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 2),
    ]);

    const lineMaterial = new THREE.LineBasicMaterial({ color: "#6528d7" });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    world.scene.three.add(line);
    marker = components.get(OBF.Marker);
    marker.threshold = 10;

    onRaycastHoverResult = (result) => {
        line.visible = !!result;
        if (!result) return;
        // console.log(result);
        const { point, normal } = result;
        if (!normal) return;
        line.position.copy(point);
        const look = point.clone().add(normal);
        line.lookAt(look);
    };
    container.addEventListener("click", async (event) => {
        if(activeTool == 'anchor' || activeTool == 'issue'){
            mouse.x = event.clientX;
            mouse.y = event.clientY;
            const result = await raycasted({
                camera: world.camera.three,
                mouse,
                dom: world.renderer.three.domElement,
            });

            onRaycastClickResult(result);
        }
    });
}


async function onRaycastClickResult(result) {

    if (!result || !activeTool) return;

    if (activeTool !== 'anchor' && activeTool !== 'issue') return;

    const { point } = result;

    const name = prompt(`Nombre del ${activeTool}:`);
    if (!name) return;

    const item = {
        id: Date.now(),
        name,
        type: activeTool,
        x: point.x,
        y: point.y,
        z: point.z,
        status: 'activo'
    };

    anchors.push(item);

    createMarker(item);
    addToTable(item);
}


function createMarker(item) {

    const element = BUI.Component.create(() => BUI.html`
        <div class="marker ${item.type}">
            ${item.type === 'anchor' ? '⚓' : '⚠️'}
        </div>
    `);

    const markerInstance = marker.create(
        world,
        element,
        new THREE.Vector3(item.x, item.y, item.z)
    );

    // 🔥 guardar referencia
    item._marker = markerInstance;

    element.addEventListener('click', () => {
        focusItem(item);
    });
}

function focusItem(item) {

    world.camera.controls.setLookAt(
        item.x + 5, item.y + 5, item.z + 5,
        item.x, item.y, item.z
    );
}

function removeItem(item, tr) {

    // 🔥 quitar de escena
    if (item._marker) {
        marker.delete(item._marker);
    }

    // 🔥 quitar del array
    anchors = anchors.filter(a => a.id !== item.id);

    // 🔥 quitar de la tabla
    tr.remove();
}

function viewItem(item) {

    if (item.type === 'issue') {
        // 🔥 puedes cambiar esto por modal si quieres
        window.open(`/incidencias/${item.id}`, '_blank');
    } else {
        // 🔹 anclaje → mostrar info simple
        alert(`
Anclaje: ${item.name}
XYZ: (${item.x.toFixed(3)}, ${item.y.toFixed(3)}, ${item.z.toFixed(3)})
Estado: ${item.status}
        `);
    }
}

function addToTable(item) {

    const tbody = document.getElementById('anchors-table');
    const tr = document.createElement('tr');

    tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.type}</td>
        <td>${item.status}</td>
        <td class="d-flex gap-1">
            <button class="btn btn-primary btn-sm btn-view">
                <i class="nf nf-fa-eye"></i>
            </button>
            <button class="btn btn-danger btn-sm btn-delete">
                <i class="nf nf-fa-trash"></i>
            </button>
        </td>
    `;

    // 👁️ SOLO ver detalles
    tr.querySelector('.btn-view').addEventListener('click', (e) => {
        e.stopPropagation(); // 🔥 evita que dispare el click de la fila
        viewItem(item);
    });

    // 🗑️ eliminar
    tr.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Eliminar elemento?')) {
            removeItem(item, tr);
        }
    });

    // 🎯 CLICK EN FILA → ENFOCAR
    tr.addEventListener('click', () => {
        focusItem(item);
    });

    // ✨ hover highlight (opcional pero top)
    tr.addEventListener('mouseenter', () => {
        if (item._marker?.element) {
            item._marker.element.style.transform = 'scale(1.5)';
        }
    });

    tr.addEventListener('mouseleave', () => {
        if (item._marker?.element) {
            item._marker.element.style.transform = 'scale(1)';
        }
    });

    tbody.appendChild(tr);
}



async function loadGLB(file) {
    new Promise((resolve, reject) => {
        if (model) {
            world.scene.three.remove(model.object);
            model = null;
        }
        if (currentModel) {
            world.scene.three.remove(currentModel);
            currentModel = null;
        }
        const url = URL.createObjectURL(file);
        gltfLoader.load(url, (gltf) => {
            const obj = gltf.scene;
            const box = new THREE.Box3().setFromObject(obj);
            const center = box.getCenter(new THREE.Vector3());
            obj.position.sub(center);
            const size = box.getSize(new THREE.Vector3()).length();
            world.camera.controls.setLookAt(size, size, size, 0, 0, 0);
            currentModel = obj;
            world.scene.three.add(obj);
            URL.revokeObjectURL(url);

            obj.traverse((child) => {
                if (child.isMesh) {
                    child.material.side = THREE.DoubleSide;
                    // console.log(child.name);
                    // console.log("material: "+child.material.name);
                    // if (Array.isArray(child.material)) {
                    //     child.material.forEach(mat => registerMaterial(mat, child));
                    // } else {
                    //     registerMaterial(child.material, child);
                    // }
                }
            });




            resolve();
        }, undefined, reject);
    });
    await processModel();
}


function showLoading() {
    loading.style.display = 'flex';
}

function hideLoading() {
    loading.style.display = 'none';
}

async function loadFromUrl(url) {
    showLoading();
    const ext = container.dataset.type;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], 'model.' + ext);
        if (ext === 'ifc') {
            await ifcLoader(url,'main')
        } else if (ext === 'glb' || ext === 'gltf') {
            await loadGLB(file);
        } else {
            console.warn("Formato no soportado");
        }
    } catch (e) {
        console.error("Error cargando modelo:", e);
    }
    hideLoading();
}

function renderModelsList() {

    const container = document.getElementById('models-container');
    container.innerHTML = '';

    const models = [...fragments.list.values()];

    models.forEach((model) => {

        const modelId = model.modelId;
        const name = model.object?.name || modelId;

        const item = document.createElement('div');
        item.className = 'card mb-2 p-2 shadow-sm';
        item.style.background = '#1f222a';

        item.innerHTML = `
<div class="d-flex align-items-center justify-content-between">

    <div class="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">

        <!-- 👁️ VISIBILIDAD -->
        <input type="checkbox" checked class="form-check-input model-visible m-0">

        <!-- 🎯 AISLAR -->
        <input type="radio" name="isolate-model" class="form-check-input model-isolate m-0">

        <!-- NOMBRE -->
        <span class="text-truncate text-light flex-grow-1" title="${name}">
            ${name}
        </span>
    </div>

    <!-- ❌ ELIMINAR -->
    <button class="btn btn-sm btn-danger ms-2 remove-model">
        ✕
    </button>

</div>
`;

        const visible = item.querySelector('.model-visible');
        const isolate = item.querySelector('.model-isolate');
        const remove = item.querySelector('.remove-model');

        // 👁️ Mostrar / ocultar modelo
        visible.addEventListener('change', async (e) => {
            await toggleModel(modelId, e.target.checked);
        });

        // 🎯 Aislar modelo
        isolate.addEventListener('change', async (e) => {
            if (e.target.checked) {
                await isolateModel(modelId);
            }
        });

        // ❌ Eliminar modelo
        remove.addEventListener('click', async () => {
            await removeModel(modelId);
        });

        container.appendChild(item);
    });
}

async function toggleModel(modelId, visible) {

    const model = fragments.list.get(modelId);
    if (!model) return;

    const ids = await model.getItemsIdsWithGeometry();

    const modelIdMap = {
        [modelId]: new Set(ids)
    };

    await hider.set(visible, modelIdMap);
}

async function isolateModel(modelId) {

    const model = fragments.list.get(modelId);
    if (!model) return;

    const ids = await model.getItemsIdsWithGeometry();

    const modelIdMap = {
        [modelId]: new Set(ids)
    };

    await hider.isolate(modelIdMap);
}

async function removeModel(modelId) {

    const model = fragments.list.get(modelId);
    if (!model) return;

    // quitar de escena
    world.scene.three.remove(model.object);

    // console.log(fragments.list)
    // eliminar del manager
    fragments.list.delete(modelId);
    fragments.core.disposeModel(modelId);

    // console.log(fragments.list)

    // refrescar UI
    renderModelsList();
    classifier.dispose()
    await classifier.byIfcBuildingStorey({ classificationName: "Levels" });
    buildLevelsUIFromClassifier()
    const container = document.getElementById('layers-container');
    container.innerHTML = '';
    await processModel()
}



function buildLevelsUIFromClassifier() {

    const container = document.getElementById('levels-container');
    container.innerHTML = '';

    const levelsContainer = document.getElementById('levels-container');

    const classification = classifier.list.get("Levels");
    if (!classification) return;

    for (const [name, group] of classification) {

        const row = document.createElement('div');
        row.className = 'card mb-2 shadow-sm';

        row.innerHTML = `
<div class="d-flex align-items-center justify-content-between p-2">

    <div class="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">

        <!-- 👁️ VISIBILIDAD -->
        <input type="checkbox" checked class="form-check-input level-visible m-0">

        <!-- 🎯 AISLAR -->
        <input type="radio" name="isolate-level" class="form-check-input level-isolate m-0">

        <span class="text-light fw-semibold text-truncate flex-grow-1" title="${name}">
            ${name}
        </span>
    </div>
</div>
`;

        const checkbox = row.querySelector('.level-visible');
        const radio = row.querySelector('.level-isolate');

        // 🔹 MULTI NIVEL (checkbox)
        checkbox.addEventListener('change', async (e) => {

            const modelIdMap = await group.get();

            if (e.target.checked) {

                for (const modelId in modelIdMap) {
                    if (!activeLevels[modelId]) {
                        activeLevels[modelId] = new Set();
                    }

                    modelIdMap[modelId].forEach(id => {
                        activeLevels[modelId].add(id);
                    });
                }

            } else {

                for (const modelId in modelIdMap) {
                    if (!activeLevels[modelId]) continue;

                    modelIdMap[modelId].forEach(id => {
                        activeLevels[modelId].delete(id);
                    });
                }
            }

            // 🔄 refrescar visibilidad
            await hider.set(false);
            await hider.set(true, activeLevels);


            document.querySelectorAll('input[name="isolate-group"]').forEach(radio => radio.checked = false);
            document.querySelectorAll('.visibility-toggle').forEach(radio => radio.checked = true);
            // await hider.set(true);
            fragments.core.update()
        });

        // 🔹 AISLAR NIVEL (radio)
        radio.addEventListener('change', async (e) => {

            if (!e.target.checked) return;

            const modelIdMap = await group.get();

            activeLevels = {};

            for (const modelId in modelIdMap) {
                activeLevels[modelId] = new Set(modelIdMap[modelId]);
            }

            // desmarcar todos los checkbox
            document.querySelectorAll('.level-visible')
                .forEach(cb => cb.checked = false);

            checkbox.checked = true;

            await hider.isolate(modelIdMap);

            document.querySelectorAll('input[name="isolate-group"]').forEach(radio => radio.checked = false);
            document.querySelectorAll('.visibility-toggle').forEach(radio => radio.checked = true);
            fragments.core.update()
        });

        // hover UX
        row.addEventListener('mouseenter', () => {
            row.style.background = '#0D6EFD';
        });

        row.addEventListener('mouseleave', () => {
            row.style.background = '#1f222a';
        });

        container.appendChild(row);
    }

    document.getElementById('btn-reset-levels')?.addEventListener('click', async () => {

        // 🔹 reset UI
        document.querySelectorAll('input[name="isolate-level"]').forEach(r => r.checked = false);
        document.querySelectorAll('.level-visible').forEach(cb => cb.checked = true);

        activeLevels = {};

        // 🔹 reconstruir activeLevels con TODO el modelo
        for (const [, model] of fragments.list) {

            const ids = await model.getItemsIdsWithGeometry();

            activeLevels[model.modelId] = new Set(ids);
        }

        // 🔹 mostrar todo
        await hider.set(true);

    });


}

async function processModel() {

    for (const [modelId, model] of fragments.list) {


        // 🔹 1. CLASES (IFCWALL, IFCWINDOW, etc)
        const categories = await model.getItemsOfCategories([/IFC/]);

        // 🔹 2. NIVELES (STOREYS)
        const storeys = await model.getItemsOfCategories([/BUILDINGSTOREY/]);
        const storeyIds = Object.values(storeys).flat();
        const storeysData = await model.getItemsData(storeyIds);

        // storeysData.forEach(storey => {
        //     console.log(storey.Name?.value); // nombre del nivel
        // });
        // console.log(Object.values(storeys).flat());
        // console.log("Niveles:", storeys);


        // 🔹 3. GEOMETRÍA POR CATEGORÍA
        const geomCategories = await model.getItemsWithGeometryCategories();

        // 🔹 4. DATOS (propiedades BIM reales)
        const allIds = Object.values(categories).flat();

        const data = await model.getItemsData(allIds);

        // 👉 AQUÍ construyes tus tablas UI
        buildUI({
            categories,
            storeys,
            geomCategories,
            data,
            model
        });
    }
}

function buildUI({ categories }) {

    const container = document.getElementById('layers-container');
    container.innerHTML = '';

    for (const groupName in categories) {

        const group = document.createElement('div');
        group.className = 'tree-group card mb-2 shadow-sm';

        const header = document.createElement('div');
        header.className = 'tree-header d-flex align-items-center justify-content-between p-2';

        header.innerHTML = `
<div class="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
    <!-- 👁️ VISIBILIDAD -->
    <input type="checkbox" checked class="form-check-input visibility-toggle m-0">

    <!-- 🎯 AISLAR -->
    <input type="radio" name="isolate-group" class="form-check-input isolate-toggle m-0">

    <!-- TEXTO -->
    <span class="fw-semibold text-truncate flex-grow-1" title="${groupName}">
        ${groupName}
    </span>
</div>
`;

        const visibility = header.querySelector('.visibility-toggle');
        const isolate = header.querySelector('.isolate-toggle');

        // 👁️ Mostrar / ocultar
        visibility.addEventListener('change', async (e) => {
            await toggleCategory(groupName, e.target.checked, '');
        });

        // 🎯 Aislar
        isolate.addEventListener('change', async (e) => {
            if (e.target.checked) {
                await toggleCategory(groupName, true, 'isolate');
            }
        });

        group.style.background = '#1f222a';
        // hover UX
        group.addEventListener('mouseenter', () => {
            group.style.background = '#0D6EFD';
        });

        group.addEventListener('mouseleave', () => {
            group.style.background = '#1f222a';
        });

        group.appendChild(header);
        container.appendChild(group);
    }
}

async function toggleCategory(category, visible, type) {

    const modelIdMap = {};

    for (const [, model] of fragments.list) {

        // 🔹 1. obtener elementos por categoría
        const categoryItems = await model.getItemsOfCategories([
            new RegExp(`^${category}$`)
        ]);

        const categoryIds = new Set(Object.values(categoryItems).flat());

        let finalIds = categoryIds;

        // 🔥 2. intersectar con niveles activos (si existen)
        if (Object.keys(activeLevels).length && activeLevels[model.modelId]) {

            const levelIds = activeLevels[model.modelId];

            finalIds = new Set(
                [...categoryIds].filter(id => levelIds.has(id))
            );
        }

        modelIdMap[model.modelId] = finalIds;
    }

    // 🔹 3. aplicar visibilidad
    if (type === 'isolate') {

        document.querySelectorAll('.visibility-toggle')
            .forEach(cb => cb.checked = false);

        await hider.isolate(modelIdMap);

    } else {

        await hider.set(visible, modelIdMap);
    }
}





async function toggleItem(id, visible) {
    const modelIdMap = {};
    const modelId = fragments.list.keys().next().value;
    modelIdMap[modelId] = new Set([id]);
    if(visible)
        await hider.set(true,modelIdMap);
        else
        await hider.set(false,modelIdMap);
}

// abrir desde pestaña
leftTab.addEventListener('click', () => {
    leftSidebar.classList.toggle('collapsed');
});

rightTab.addEventListener('click', () => {
    rightSidebar.classList.toggle('collapsed');
});

// doble click para cerrar
leftSidebar.addEventListener('dblclick', () => {
    leftSidebar.classList.add('collapsed');
});

rightSidebar.addEventListener('dblclick', () => {
    rightSidebar.classList.add('collapsed');
});

document.getElementById('btn-reset-isolate').addEventListener('click', async () => {

    // 🔹 reset UI categorías
    document.querySelectorAll('input[name="isolate-group"]').forEach(r => r.checked = false);
    document.querySelectorAll('.visibility-toggle').forEach(cb => cb.checked = true);

    // 🔹 caso 1: hay niveles activos → respetarlos
    if (Object.keys(activeLevels).length) {

        await hider.set(false);              // ocultar todo
        await hider.set(true, activeLevels); // mostrar SOLO niveles activos

    } else {
        // 🔹 caso 2: no hay filtro → mostrar todo
        await hider.set(true);
    }
});

let toolState = {
    clipper: false,
    ruler: false
}

let activeTool = null

document.addEventListener('dblclick',() => {
    if(activeTool == 'clipper' && clipper.enabled){
        clipper.create(world)
        return;
    }else if(activeTool == 'ruler' && measurer.enabled){
        measurer.create()
        return;
    }
})

function setActiveTool(tool){
    activeTool = tool;

    clipper.enabled = false
    measurer.enabled = false

    if( tool === 'clipper' && toolState.clipper){
        clipper.enabled = true
        toolState.ruler = false
    }else if(tool === 'ruler' && toolState.ruler){
        measurer.enabled = true
        toolState.clipper = false
    }else if( tool == 'anchor' ){

    }else if(tool == 'issue'){

    }
}

function updateUI() {
    btnClipper.classList.toggle('active', activeTool === 'clipper');
    btnRulers.classList.toggle('active', activeTool === 'ruler');
    btnAnchor.classList.toggle('active', activeTool === 'anchor');
    btnIssue.classList.toggle('active', activeTool === 'issue');
}

let btnClipper = document.getElementById('btn-clipper');
btnClipper.addEventListener('click',() => {
    toolState.clipper = !toolState.clipper
    if(toolState.clipper){
        setActiveTool('clipper')
    }else{
        clipper.deleteAll()
        if(activeTool === 'clipper')
            activeTool = null
    }
    updateUI()
});


let btnRulers = document.getElementById('btn-rulers');
btnRulers.addEventListener('click',() => {
    toolState.ruler = !toolState.ruler

    if(toolState.ruler){
        setActiveTool('ruler')
    }else{
        measurer.list.clear()
        measurer.enabled =false
        if(activeTool == 'ruler'){
            activeTool = null
        }
    }
    updateUI()
})

const btnAnchor = document.getElementById('btn-anchor');
btnAnchor.addEventListener('click',(ev) =>{
    if(activeTool == 'anchor')
        setActiveTool('')
        else
        setActiveTool('anchor')
    updateUI()
})

const btnIssue = document.getElementById('btn-issue');
btnIssue.addEventListener('click',(ev) =>{
    if(activeTool == 'issue')
        setActiveTool('')
        else
        setActiveTool('issue')
    updateUI()
})




const bottomBar = document.getElementById('bottomBar');
const toggle = document.getElementById('bottomToggle');

toggle.addEventListener('click', () => {
    bottomBar.classList.toggle('collapsed');
    bottomBar.classList.toggle('expanded');
});



document.getElementsByName('loadIfc').forEach((e) => {
    e.addEventListener('click',async ()=>{
        showLoading()
        try {
            let u = e.dataset.url;
            let id = e.dataset.name + Math.floor(Math.random() * 100) + 1;
            await ifcLoader(u, id)
            fragments.core.update()
        } catch (error) {

        }
        hideLoading()
    })
})

document.getElementById('btn-fit').addEventListener('click',async() =>{
    await world.camera.controls.setLookAt(68, 23, -8.5, 0, 0, 0);
})

function setView(direction) {

    const box = new THREE.Box3();

    for (const [, model] of fragments.list) {
        box.expandByObject(model.object);
    }

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();

    const distance = size * 1.5;

    let pos = new THREE.Vector3();

    switch (direction) {
        case 'top':
            pos.set(center.x, center.y + distance, center.z);
            break;

        case 'bottom':
            pos.set(center.x, center.y - distance, center.z);
            break;

        case 'front':
            pos.set(center.x, center.y, center.z + distance);
            break;

        case 'back':
            pos.set(center.x, center.y, center.z - distance);
            break;

        case 'left':
            pos.set(center.x - distance, center.y, center.z);
            break;

        case 'right':
            pos.set(center.x + distance, center.y, center.z);
            break;

        case 'iso':
        default:
            pos.set(center.x + distance, center.y + distance, center.z + distance);
            break;
    }

    world.camera.controls.setLookAt(
        pos.x, pos.y, pos.z,
        center.x, center.y, center.z,
        true
    );
}

function fitView() {

    const box = new THREE.Box3();

    for (const [, model] of fragments.list) {
        box.expandByObject(model.object);
    }

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();

    world.camera.controls.fitToBox(box, true);

    // opcional: asegurar que mira al centro
    world.camera.controls.setLookAt(
        center.x + size,
        center.y + size,
        center.z + size,
        center.x,
        center.y,
        center.z,
        true
    );
}

document.querySelectorAll('.view-card').forEach(card => {
    card.addEventListener('click', () => {

        const view = card.dataset.view;

        if (view === 'fit') {
            fitView();
        } else {
            setView(view);
        }

        // opcional: controlar rotación
        if (view === 'top' || view === 'front' || view === 'left' || view === 'right' || view === 'back') {
            world.camera.controls.enableRotate = false;
        } else {
            world.camera.controls.enableRotate = true;
        }
    });
});



const url = container.dataset.url;
initViewer(container);
if (url) {
    loadFromUrl(url);
}

setTimeout(() => {
    splash.classList.add('hidden');
}, 2000);
