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
    // await world.camera.controls.setLookAt(68, 23, -8.5, 21.5, -5.5, 23);
    components.init();
    components.get(OBC.Grids).create(world);
    world.scene.setup();
    const scene = world.scene.three;
    scene.background = new THREE.Color(0x1a1d25);
    const githubUrl =
        "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
    const fetchedUrl = await fetch(githubUrl);
    const workerBlob = await fetchedUrl.blob();
    const workerFile = new File([workerBlob], "worker.mjs", {
        type: "text/javascript",
    });
    const workerUrl = URL.createObjectURL(workerFile);
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

async function ifcLoader(url){
    const fragPaths = [
        url+'?type=frag'
    ];

    await Promise.all(
        fragPaths.map(async (path) => {
            const modelId = path.split("/").pop()?.split(".").shift();
            if (!modelId) return null;
            const file = await fetch(path);
            const buffer = await file.arrayBuffer();
            return fragments.core.load(buffer, { modelId });
        }),
    );

    await processModel();

    // const classifier = components.get(OBC.Classifier);
    // const classificationName = "Custom Classification";
    // const groupName = "My Group";
    // let localIds,data
    // classifier.getGroupData("Custom Classification", "My Group");
    // const slabsModelIdMap = {};
    // for (const [modelId, model] of fragments.list) {
    //     const items = await model.getItemsOfCategories([/IFC/]);
    //     const storeys = await model.getItemsOfCategories([/BUILDINGSTOREY/]);
    //     localIds = Object.values(storeys).flat();
    //     data = await model.getItemsData(localIds);
    //     console.log(data)
    //
    //     const categories = await model.getItemsWithGeometryCategories()
    //     for (const category of categories) {
    //         if (!category) continue;
    //         // modelCategories.add(category);
    //         console.log("categoria: ",category);
    //     }
    //
    //
    // }
    //
    // classifier.addGroupItems(classificationName, groupName, slabsModelIdMap);


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
                    console.log(child.name);
                    console.log("material: "+child.material.name);
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
            await ifcLoader(url)
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

        // console.log("Procesando modelo:", modelId);

        // 🔹 1. CLASES (IFCWALL, IFCWINDOW, etc)
        const categories = await model.getItemsOfCategories([/IFC/]);

        // console.log("Clases:", categories);


        // 🔹 2. NIVELES (STOREYS)
        const storeys = await model.getItemsOfCategories([/BUILDINGSTOREY/]);
        const storeyIds = Object.values(storeys).flat();
        const storeysData = await model.getItemsData(storeyIds);

        storeysData.forEach(storey => {
            console.log(storey.Name?.value); // nombre del nivel
        });
        console.log(Object.values(storeys).flat());
        console.log("Niveles:", storeys);


        // 🔹 3. GEOMETRÍA POR CATEGORÍA
        const geomCategories = await model.getItemsWithGeometryCategories();

        // console.log("Geom categorías:", geomCategories);


        // 🔹 4. DATOS (propiedades BIM reales)
        const allIds = Object.values(categories).flat();

        const data = await model.getItemsData(allIds);

        // console.log("Propiedades:", data);


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

// async function toggleCategory(category, visible,type) {
//     // console.log("es la: ",category)
//     const modelIdMap = {};
//     for (const [, model] of fragments.list) {
//         const items = await model.getItemsOfCategories([
//             new RegExp(`^${category}$`)
//         ]);
//         const ids = Object.values(items).flat();
//         modelIdMap[model.modelId] = new Set(ids);
//     }
//     if(type == 'isolate'){
//         document.querySelectorAll('.visibility-toggle').forEach(radio => radio.checked = false);
//         await hider.isolate(modelIdMap);
//     }else if(visible)
//         await hider.set(true,modelIdMap);
//         else
//         await hider.set(false,modelIdMap);
// }

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
    }
}

function updateUI() {
    btnClipper.classList.toggle('active', activeTool === 'clipper');
    btnRulers.classList.toggle('active', activeTool === 'ruler');
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

const url = container.dataset.url;
initViewer(container);
if (url) {
    loadFromUrl(url);
}

setTimeout(() => {
    splash.classList.add('hidden');
}, 2000);
