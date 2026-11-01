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

let box_world;
let min,max,center;
let clipperInitialValues;
let highlighter;

const sectionPlanes = {
    xMin: null,
    xMax: null,
    yMin: null,
    yMax: null,
    zMin: null,
    zMax: null
};
let clipper_status = false;
let clipper;

let measurer;
let classifier;

let activeLevels = {};
let anchors = [];
let marker;

let modelCategories = [];
let modelProperties = [];
let activePropertyFilters = [];

let categoryVisibility = new Map();

let selectedBimElement = null;


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

    components.get(OBC.Raycasters).get(world);

    highlighter = components.get(OBF.Highlighter);

    highlighter.setup({
        world,

        selectMaterialDefinition: {
            color: new THREE.Color("#f59e0b"),
            opacity: 1,
            transparent: false,
            renderedFaces: 0,
        },
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

        for (const [, model] of fragments.list) {

            const result =
                await model.raycast(data);

            if (result) {

                result.fragmentsModel = model;

                results.push(result);
            }
        }

        if (results.length === 0) {
            return null;
        }

        let closestResult = results[0];

        for (let i = 1; i < results.length; i++) {

            if (
                results[i].distance <
                    closestResult.distance
            ) {
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

        if (
            activeTool !== 'anchor' &&
                activeTool !== 'issue'
        ) {
            return;
        }

        mouse.x = event.clientX;
        mouse.y = event.clientY;

        const result = await raycasted({
            camera: world.camera.three,
            mouse,
            dom: world.renderer.three.domElement,
        });

        if (!result) {
            return;
        }

        onRaycastClickResult(result);
    });

    container.addEventListener("dblclick", async (event) => {

        // =====================================
        // HERRAMIENTAS
        // =====================================

        if (activeTool === 'clipper') {

            if (clipper.enabled) {
                //await clipper.create(world);
            }

            return;
        }

        if (activeTool === 'ruler') {

            if (measurer.enabled) {
                await measurer.create();
            }

            return;
        }


        // =====================================
        // ANCLA / INCIDENCIA
        // =====================================

        if (
            activeTool === 'anchor' ||
                activeTool === 'issue'
        ) {
            return;
        }


        // =====================================
        // BIM
        // =====================================

        // Si no hay ninguna herramienta activa,
        // el doble click selecciona BIM.

        mouse.x = event.clientX;
        mouse.y = event.clientY;

        const result = await raycasted({
            camera: world.camera.three,
            mouse,
            dom: world.renderer.three.domElement,
        });

        if (!result) {
            return;
        }

        await selectBimElement(
            result.fragmentsModel,
            result.localId
        );
    });


    box_world = new THREE.Box3();

    for (const [, model] of fragments.list) {
        box_world.expandByObject(model.object);
    }

    min = box_world.min;
    max = box_world.max;
    center = box_world.getCenter(new THREE.Vector3());

    clipperInitialValues = {
        xMin: min.x,
        xMax: max.x,

        yMin: min.y,
        yMax: max.y,

        zMin: min.z,
        zMax: max.z,
    };

    createSectionPlanes();
    let v = $wire.anchors;
    let w = $wire.incidents;

    for(let i = 0;i < v.length;i++){
        let item = {
            id: v[i].id,
            name: v[i].title,
            model: v[i].mode_id,
            type: 'anchor',
            x:  parseFloat(v[i].x),
            y: parseFloat(v[i].y),
            z: parseFloat(v[i].z),
            normalX: parseFloat(v[i].normal_x ?? 0) ?? 0,
            normalY: parseFloat(v[i].normal_y ?? 1) ?? 1,
            normalZ: parseFloat(v[i].normal_z ?? 0) ?? 0,
            status: v[i].is_active ? 'activo': 'inhabilitado'
        };
        anchors.push(item);
        createMarker(item);
        addToTable(item);
    }
    for(let i = 0;i < w.length;i++){
        let item = {
            id: w[i].id,
            name: w[i].title,
            model: w[i].mode_id,
            type: 'incident',
            x:  parseFloat(w[i].x),
            y: parseFloat(w[i].y),
            z: parseFloat(w[i].z),
            normalX: parseFloat(w[i].normal_x ?? 0) ?? 0,
            normalY: parseFloat(w[i].normal_y ?? 1) ?? 1,
            normalZ: parseFloat(w[i].normal_z ?? 0) ?? 0,
            status: w[i].is_active ? 'activo': 'inhabilitado'
        };
        anchors.push(item);
        createMarker(item);
        addToTable(item);
    }

}

function buildElementInfoUI({ info, propertySets }) {

    const panel =
    document.getElementById('element-info-panel');

    const title =
    document.getElementById('element-info-title');

    const content =
    document.getElementById('element-info-content');

    title.textContent =
        info.name || 'Elemento BIM';

    content.innerHTML = '';

    // =========================
    // INFORMACIÓN BÁSICA
    // =========================

    const basic = document.createElement('div');

    basic.className = 'element-info-basic';

    const basicFields = [
        ['Categoría', info.category],
        ['Nombre', info.name],
        ['Tipo', info.objectType],
        ['GUID', info.guid],
        ['Tag', info.tag],
        ['ID', info.localId],
    ];

    for (const [label, value] of basicFields) {

        if (
            value === null ||
                value === undefined ||
                value === ''
        ) {
            continue;
        }

        basic.innerHTML += `
<div class="element-info-row">

<div class="element-info-label">
${escapeHtml(label)}
</div>

<div class="element-info-value">
${escapeHtml(String(value))}
</div>

</div>
`;
    }

    content.appendChild(basic);


    // =========================
    // PROPERTY SETS
    // =========================

    for (const [setName, properties] of propertySets) {

        const section =
        document.createElement('div');

        section.className =
            'element-info-section';

        const header =
        document.createElement('div');

        header.className =
            'element-info-section-header';

        header.innerHTML = `
<span>
    ${escapeHtml(setName)}
</span>

<i class="bi bi-chevron-down"></i>
`;

        const body =
        document.createElement('div');

        body.className =
            'element-info-section-body';

        for (const property of properties) {

            body.innerHTML += `
<div class="element-info-row">

<div class="element-info-label">
${escapeHtml(property.name)}
</div>

<div class="element-info-value">
${escapeHtml(
property.value !== null
? String(property.value)
: '-'
)}
</div>

</div>
`;
        }

        header.addEventListener('click', () => {

            const hidden =
            body.classList.toggle('d-none');

            const icon =
            header.querySelector('i');

            icon.className = hidden
                ? 'bi bi-chevron-right'
                : 'bi bi-chevron-down';
        });

        section.appendChild(header);
        section.appendChild(body);

        content.appendChild(section);
    }

    panel.classList.remove('d-none');
}

function escapeHtml(value) {

    const div =
    document.createElement('div');

    div.textContent = value;

    return div.innerHTML;
}

async function selectBimElement(model, localId) {

    const data =
        await getElementInfo(
            model,
            localId
        );

    if (!data) {
        return;
    }

    // Quitar selección anterior
    await highlighter.clear('select');

    const modelIdMap = {};

    modelIdMap[model.modelId] = new Set([
        localId
    ]);

    // Seleccionar elemento
    await highlighter.highlightByID(
        'select',
        modelIdMap,
        false
    );

    selectedBimElement = {
        model,
        localId
    };

    const info = {
        localId:
        data._localId?.value,

        guid:
        data._guid?.value,

        category:
        data._category?.value,

        name:
        data.Name?.value,

        objectType:
        data.ObjectType?.value,

        tag:
        data.Tag?.value,
    };

    const propertySets =
    extractPropertySets(data);

    buildElementInfoUI({
        info,
        propertySets
    });
}

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

async function getElementInfo(model, localId) {

    const data = await model.getItemsData(
        [localId],
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

    if (!data.length) {
        return null;
    }

    return data[0];
}

async function buildModelProperties(model) {

    const items = await model.getItems();

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

    // console.log(
    //     'PROPIEDADES IFC:',
    //     properties
    // );

    return properties;
}

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

    // console.log(
    //     'CATEGORÍAS IFC:',
    //     categories
    // );

    return categories;
}




async function createSectionPlanes() {
    const size = box_world.getSize(new THREE.Vector3()).length();
    const offset = size * 0.5;
    // limpiar anteriores
    clipper.deleteAll();

    // X+
    sectionPlanes.xMax = await clipper.create(world);
    sectionPlanes.xMax.helper.position.set(max.x+offset, center.y, center.z);
    sectionPlanes.xMax.normal.set(-1, 0, 0);
    sectionPlanes.xMax.helper.visible = false;
    sectionPlanes.xMax.controls._gizmo.visible = false
    sectionPlanes.xMax.update();
    // X-
    sectionPlanes.xMin = await clipper.create(world);
    sectionPlanes.xMin.helper.position.set(min.x-offset, center.y, center.z);
    sectionPlanes.xMin.normal.set(1, 0, 0);
    sectionPlanes.xMin.helper.visible = false;
    sectionPlanes.xMin.controls._gizmo.visible = false
    sectionPlanes.xMin.update();
    //
    // // Y+
    sectionPlanes.yMax = await clipper.create(world);
    sectionPlanes.yMax.helper.position.set(center.x, max.y+offset, center.z);
    sectionPlanes.yMax.normal.set(0, -1, 0);
    sectionPlanes.yMax.helper.visible = false;
    sectionPlanes.yMax.controls._gizmo.visible = false
    sectionPlanes.yMax.update();
    //
    // // Y-
    sectionPlanes.yMin = await clipper.create(world);
    sectionPlanes.yMin.helper.position.set(center.x, min.y-offset, center.z);
    sectionPlanes.yMin.normal.set(0, 1, 0);
    sectionPlanes.yMin.helper.visible = false;
    sectionPlanes.yMin.controls._gizmo.visible = false
    sectionPlanes.yMin.update();
    //
    // // Z+
    sectionPlanes.zMax = await clipper.create(world);
    sectionPlanes.zMax.helper.position.set(center.x, center.y, max.z+offset);
    sectionPlanes.zMax.normal.set(0, 0, -1);
    sectionPlanes.zMax.helper.visible = false;
    sectionPlanes.zMax.controls._gizmo.visible = false
    sectionPlanes.zMax.update();
    //
    // // Z-
    sectionPlanes.zMin = await clipper.create(world);
    sectionPlanes.zMin.helper.position.set(center.x, center.y, min.z-offset);
    sectionPlanes.zMin.normal.set(0, 0, 1);
    sectionPlanes.zMin.helper.visible = false;
    sectionPlanes.zMin.controls._gizmo.visible = false
    sectionPlanes.zMin.update();

    const axes = ['x', 'y', 'z'];

    axes.forEach(axis => {
        const minInput = document.getElementById(`${axis}Min`);
        const maxInput = document.getElementById(`${axis}Max`);

        minInput.min = box_world.min[axis];
        minInput.max = box_world.max[axis];
        minInput.value = box_world.min[axis];

        maxInput.min = box_world.min[axis];
        maxInput.max = box_world.max[axis];
        maxInput.value = box_world.max[axis];
    });

    bindSlider('x', sectionPlanes.xMin, sectionPlanes.xMax);
    bindSlider('y', sectionPlanes.yMin, sectionPlanes.yMax);
    bindSlider('z', sectionPlanes.zMin, sectionPlanes.zMax);
}

function bindSlider(axis, planeMin, planeMax) {
    const minInput = document.getElementById(`${axis}Min`);
    const maxInput = document.getElementById(`${axis}Max`);

    minInput.addEventListener('input', () => {
        let minVal = parseFloat(minInput.value);
        let maxVal = parseFloat(maxInput.value);

        if (minVal > maxVal) {
            minVal = maxVal;
            minInput.value = maxVal;
        }

        planeMin.helper.position[axis] = minVal;
        planeMin.update();

        fragments.core.update(true);
    });

    maxInput.addEventListener('input', () => {
        let minVal = parseFloat(minInput.value);
        let maxVal = parseFloat(maxInput.value);

        if (maxVal < minVal) {
            maxVal = minVal;
            maxInput.value = minVal;
        }

        planeMax.helper.position[axis] = maxVal;
        planeMax.update();

        fragments.core.update(true);
    });
}

async function onRaycastClickResult(result) {

    if (!result || !activeTool) return;

    if (activeTool !== 'anchor' && activeTool !== 'issue') return;

    const { point, normal } = result;

    const name = prompt(`Nombre del ${activeTool}:`);
    if (!name) return;

    let model = result.fragments.object.name;
    const item = {
        id: Date.now(),
        name,
        model,
        type: activeTool,
        x: point.x,
        y: point.y,
        z: point.z,
        normalX: normal?.x ?? 0,
        normalY: normal?.y ?? 1,
        normalZ: normal?.z ?? 0,
        status: 'activo'
    };
    createMarker(item);

    let r = await $wire.saveMark(item.name,item.model,item.type,item.x,item.y,item.z, item.normalX, item.normalY, item.normalZ)
    if(r != 'fail'){
        Swal.fire({icon: 'success',title: 'Creado Correctamente'})
    }else{
        Swal.fire({icon: 'error',title: 'Falla al Crear'})
    }
    item.id = r;
    anchors.push(item);
    addToTable(item);
}


async function createMarker(item) {

    const group = new THREE.Group();

    const color =
        item.type === 'anchor'
            ? 0x2563eb
            : 0xdc2626;


    // =========================
    // FIGURA SEGÚN EL TIPO
    // =========================

    let geometry;

    if (item.type === 'anchor') {

        // Anclaje → esfera
        geometry = new THREE.SphereGeometry(
            0.08,
            16,
            16
        );

    } else {

        // Incidencia → octaedro
        geometry = new THREE.OctahedronGeometry(
            0.10
        );
    }


    const material =
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.4,
            metalness: 0.1
        });


    const markerMesh =
        new THREE.Mesh(
            geometry,
            material
        );

    group.add(markerMesh);


    // =========================
    // PEQUEÑO POSTE
    // =========================

    const cylinderGeometry =
        new THREE.CylinderGeometry(
            0.025,
            0.025,
            0.20,
            12
        );

    const cylinder =
        new THREE.Mesh(
            cylinderGeometry,
            material
        );

    cylinder.position.y = 0.10;

    group.add(cylinder);


    // =========================
    // POSICIÓN
    // =========================

    group.position.set(
        item.x,
        item.y,
        item.z
    );


    // =========================
    // ORIENTACIÓN SEGÚN NORMAL
    // =========================

    const normal =
    new THREE.Vector3(
        item.normalX ?? 0,
        item.normalY ?? 1,
        item.normalZ ?? 0
    ).normalize();

    const up =
        new THREE.Vector3(0, 1, 0);

    const quaternion =
        new THREE.Quaternion();

    quaternion.setFromUnitVectors(
        up,
        normal
    );

    group.quaternion.copy(
        quaternion
    );


    // =========================
    // GUARDAR ITEM
    // =========================

    group.userData.markerItem = item;


    // =========================
    // MARKER DE THAT OPEN
    // =========================

    const element = BUI.Component.create(() => BUI.html`
<div
style="
width: 40px;
height: 40px;
pointer-events: auto;
">
</div>
`);


    const markerInstance = marker.create(
        world,
        element,
        new THREE.Vector3(
            item.x,
            item.y,
            item.z
        )
    );


    // Click sobre el marcador
    element.addEventListener('click', () => {
        focusItem(item);
    });


    // Guardar referencias
    item._marker = markerInstance;
    item._marker3D = group;


    // Añadir objeto 3D
    world.scene.three.add(group);
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

    $wire.removeMark(item.id,item.type)
    // 🔥 quitar del array
    anchors = anchors.filter(a => a.id !== item.id);

    // 🔥 quitar de la tabla
    tr.remove();
}

function viewItem(item) {

    if (item.type === 'incident') {
        // 🔥 puedes cambiar esto por modal si quieres
        // window.open(`/incidencias/${item.id}`, '_blank');
        $wire.dispatch('getIncident',{ id: item.id });
        document
            .getElementById('open-incident-modal')
            .click();
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

    const tbody =
    document.getElementById('anchors-table');

    const tr =
    document.createElement('tr');

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

    // Click en la fila
    tr.addEventListener('click', (e) => {
        e.stopPropagation();
        focusItem(item);
    });

    // Doble click en la fila
    tr.addEventListener('dblclick', (e) => {
        e.stopPropagation();
    });

    // Ver
    tr.querySelector('.btn-view')
        .addEventListener('click', (e) => {
            e.stopPropagation();
            viewItem(item);
        });

    tr.querySelector('.btn-view')
        .addEventListener('dblclick', (e) => {
            e.stopPropagation();
        });

    // Eliminar
    tr.querySelector('.btn-delete')
        .addEventListener('click', (e) => {

            e.stopPropagation();

            if (confirm('¿Eliminar elemento?')) {
                removeItem(item, tr);
            }
        });

    tr.querySelector('.btn-delete')
        .addEventListener('dblclick', (e) => {
            e.stopPropagation();
        });

    // Hover
    tr.addEventListener('mouseenter', () => {

        if (item._marker?.element) {
            item._marker.element.style.transform =
                'scale(1.5)';
        }
    });

    tr.addEventListener('mouseleave', () => {

        if (item._marker?.element) {
            item._marker.element.style.transform =
                'scale(1)';
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

        // 🔹 CATEGORÍAS BIM REALES
        modelCategories[modelId] =
            await buildModelCategories(model);

        modelProperties[modelId] =
            await buildModelProperties(model);

        // // 🔹 NIVELES
        // const storeys =
        //     await model.getItemsOfCategories([
        //         /BUILDINGSTOREY/
        //     ]);
        //
        // const storeyIds =
        //     Object.values(storeys).flat();
        //
        // const storeysData =
        //     await model.getItemsData(storeyIds);
        //
        // // 🔹 GEOMETRÍA POR CATEGORÍA
        // const geomCategories =
        //     await model.getItemsWithGeometryCategories();
        //
        // // 🔹 DATOS
        // const categories =
        //     await model.getItemsOfCategories([/IFC/]);
        //
        // const allIds =
        //     Object.values(categories).flat();
        //
        // const data =
        //     await model.getItemsData(allIds);

        buildUI({
            categories: modelCategories[modelId],
        });

        buildPropertyUI(modelId)
    }
}

function buildUI({ categories }) {

    const container =
    document.getElementById('layers-container');

    container.innerHTML = '';

    for (const [groupName] of categories) {

        const group =
        document.createElement('div');

        group.className =
            'tree-group card mb-2 shadow-sm';

        const header =
        document.createElement('div');

        header.className =
            'tree-header d-flex align-items-center justify-content-between p-2';

        header.innerHTML = `
<div class="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">

    <input
        type="checkbox"
        checked
        class="form-check-input visibility-toggle m-0"
    >

    <input
        type="radio"
        name="isolate-group"
        class="form-check-input isolate-toggle m-0"
    >

    <span
        class="fw-semibold text-truncate flex-grow-1"
        title="${groupName}"
    >
        ${groupName}
    </span>

</div>
`;

        const visibility =
        header.querySelector('.visibility-toggle');

        const isolate =
        header.querySelector('.isolate-toggle');

        visibility.addEventListener(
            'change',
            async (e) => {

                await toggleCategory(
                    groupName,
                    e.target.checked,
                    ''
                );
            }
        );

        isolate.addEventListener(
            'change',
            async (e) => {

                if (e.target.checked) {

                    await toggleCategory(
                        groupName,
                        true,
                        'isolate'
                    );
                }
            }
        );

        group.style.background =
            '#1f222a';

        group.addEventListener(
            'mouseenter',
            () => {
                group.style.background =
                    '#0D6EFD';
            }
        );

        group.addEventListener(
            'mouseleave',
            () => {
                group.style.background =
                    '#1f222a';
            }
        );

        group.appendChild(header);
        container.appendChild(group);
    }
}

function buildPropertyUI() {

    const selectKey =
    document.getElementById(
        'property-key'
    );

    const selectValue =
    document.getElementById(
        'property-value'
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

    for (
    const modelId
    of Object.keys(modelProperties)
) {

        const properties =
            modelProperties[modelId];

        if (!properties) {
            continue;
        }

        for (const key of properties.keys()) {
            allKeys.add(key);
        }
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


async function toggleCategory(category, visible, type) {

    /*
     * Guardamos el estado de la capa.
     */
    categoryVisibility.set(
        category,
        visible
    );


    /*
     * AISLAR
     */
    if (type === 'isolate') {

        /*
         * Todas las categorías se ocultan.
         */
        for (
        const [, model]
        of fragments.list
    ) {

            const categories =
                modelCategories[model.modelId];

            if (!categories) {
                continue;
            }

            for (const categoryName of categories.keys()) {

                categoryVisibility.set(
                    categoryName,
                    categoryName === category
                );
            }
        }

        document
            .querySelectorAll(
                '.visibility-toggle'
            )
            .forEach(cb => {
                cb.checked = false;
            });

        await applyAllFilters();

        return;
    }


    /*
     * VISIBILIDAD NORMAL
     */
    await applyAllFilters();
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

document
    .getElementById('btn-reset-isolate')
    .addEventListener('click', async () => {

        /*
         * Todas las capas vuelven a estar visibles.
         */
        categoryVisibility.clear();


        /*
         * UI de capas
         */
        document
            .querySelectorAll(
                'input[name="isolate-group"]'
            )
            .forEach(r => {
                r.checked = false;
            });

        document
            .querySelectorAll(
                '.visibility-toggle'
            )
            .forEach(cb => {
                cb.checked = true;
            });


        /*
         * También eliminamos el filtro
         * de propiedades.
         */
        activePropertyFilters = [];

        renderPropertyFilters();

        document
            .getElementById(
                'property-key'
            )
            .value = '';

        document
            .getElementById(
                'property-value'
            ).innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;

        document
            .getElementById(
                'property-value'
            )
            .disabled = true;

        document
            .getElementById(
                'btn-apply-property'
            )
            .disabled = true;

        document
            .getElementById(
                'property-filter-info'
            )
            .textContent = '';


        /*
         * Aplicar nuevamente los filtros.
         *
         * Si hay niveles activos,
         * solamente esos niveles quedarán visibles.
         */
        await applyAllFilters();
    });

let toolState = {
    clipper: false,
    ruler: false
}

let activeTool = null


function setActiveTool(tool) {

    activeTool = tool;

    clipper.enabled = false;
    measurer.enabled = false;

    if (tool === 'clipper') {

        clipper.enabled = true;

        toolState.clipper = true;
        toolState.ruler = false;

        measurer.list.clear();

        setClipperControlsEnabled(true);

    }

    else if (tool === 'ruler') {

        measurer.enabled = true;

        toolState.ruler = true;
        toolState.clipper = false;

        setClipperControlsEnabled(false);

    }

    else if (tool === 'anchor') {

        toolState.clipper = false;
        toolState.ruler = false;

        setClipperControlsEnabled(false);

    }

    else if (tool === 'issue') {

        toolState.clipper = false;
        toolState.ruler = false;

        setClipperControlsEnabled(false);

    }

    else {

        toolState.clipper = false;
        toolState.ruler = false;

        setClipperControlsEnabled(false);
    }

    updateUI();
}

function setClipperControlsEnabled(enabled) {

    const ids = [
        'xMin',
        'xMax',
        'yMin',
        'yMax',
        'zMin',
        'zMax'
    ];

    for (const id of ids) {

        const input =
        document.getElementById(id);

        if (!input) {
            continue;
        }

        input.disabled = !enabled;
    }

    const reset =
    document.getElementById('btn-reset-clipper');

    if (reset) {
        reset.disabled = !enabled;
    }
}

function updateUI() {
    btnClipper.classList.toggle('active', activeTool === 'clipper');
    btnRulers.classList.toggle('active', activeTool === 'ruler');
    btnAnchor.classList.toggle('active', activeTool === 'anchor');
    btnIssue.classList.toggle('active', activeTool === 'issue');
}

let btnClipper =
document.getElementById('btn-clipper');

btnClipper.addEventListener('click', () => {

    if (activeTool === 'clipper') {

        // Desactivar interacción,
        // PERO conservar los cortes.
        setActiveTool(null);

    } else {

        // Volver a activar interacción.
        setActiveTool('clipper');
    }

    document
        .getElementById('clipper-panel')
        .classList.toggle(
            'd-none',
            activeTool !== 'clipper'
        );

    updateUI();
});

const btnResetClipper =
document.getElementById('btn-reset-clipper');

btnResetClipper.addEventListener('click', () => {
    resetSectionPlanes();
});

async function resetSectionPlanes() {

    const size =
    box_world.getSize(new THREE.Vector3()).length();

    const offset = size * 0.5;

    // X+
    sectionPlanes.xMax.helper.position.set(
        max.x + offset,
        center.y,
        center.z
    );

    sectionPlanes.xMax.update();


    // X-
    sectionPlanes.xMin.helper.position.set(
        min.x - offset,
        center.y,
        center.z
    );

    sectionPlanes.xMin.update();


    // Y+
    sectionPlanes.yMax.helper.position.set(
        center.x,
        max.y + offset,
        center.z
    );

    sectionPlanes.yMax.update();


    // Y-
    sectionPlanes.yMin.helper.position.set(
        center.x,
        min.y - offset,
        center.z
    );

    sectionPlanes.yMin.update();


    // Z+
    sectionPlanes.zMax.helper.position.set(
        center.x,
        center.y,
        max.z + offset
    );

    sectionPlanes.zMax.update();


    // Z-
    sectionPlanes.zMin.helper.position.set(
        center.x,
        center.y,
        min.z - offset
    );

    sectionPlanes.zMin.update();


    // Restaurar sliders
    const axes = ['x', 'y', 'z'];

    axes.forEach(axis => {

        const minInput =
        document.getElementById(`${axis}Min`);

        const maxInput =
        document.getElementById(`${axis}Max`);

        minInput.value =
            box_world.min[axis];

        maxInput.value =
            box_world.max[axis];

    });
}


function resetClipperSliders() {

    if (!clipperInitialValues) {
        return;
    }

    const values = {
        xMin: clipperInitialValues.xMin,
        xMax: clipperInitialValues.xMax,

        yMin: clipperInitialValues.yMin,
        yMax: clipperInitialValues.yMax,

        zMin: clipperInitialValues.zMin,
        zMax: clipperInitialValues.zMax,
    };

    for (const [id, value] of Object.entries(values)) {

        const input =
        document.getElementById(id);

        if (!input) {
            continue;
        }

        input.value = value;

        // Importante:
        // ejecuta la misma lógica que al mover el slider
        input.dispatchEvent(
            new Event('input', {
                bubbles: true
            })
        );
    }
}

function resetClipperPlanes() {

    sectionPlanes.xMin = null;
    sectionPlanes.xMax = null;

    sectionPlanes.yMin = null;
    sectionPlanes.yMax = null;

    sectionPlanes.zMin = null;
    sectionPlanes.zMax = null;
}


let btnRulers = document.getElementById('btn-rulers');
btnRulers.addEventListener('click', () => {

    if (activeTool === 'ruler') {

        measurer.list.clear();

        toolState.ruler = false;

        setActiveTool(null);

    } else {

        setActiveTool('ruler');
    }

    updateUI();
});

const btnAnchor = document.getElementById('btn-anchor');

btnAnchor.addEventListener('click', () => {

    if (activeTool === 'anchor') {
        setActiveTool(null);
    } else {
        setActiveTool('anchor');
    }

    updateUI();
});

const btnIssue = document.getElementById('btn-issue');

btnIssue.addEventListener('click', () => {

    if (activeTool === 'issue') {
        setActiveTool(null);
    } else {
        setActiveTool('issue');
    }

    updateUI();
});




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
            let id = e.dataset.name //+ Math.floor(Math.random() * 100) + 1;
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

async function applyPropertyFilter() {

    const key =
        activePropertyFilter.key;

    const value =
        activePropertyFilter.value;

    if (!key || !value) {
        return;
    }

    await applyAllFilters();

    document
        .getElementById(
            'property-filter-info'
        )
        .textContent =
        `${key}: ${value}`;
}

function getFilteredModelIds(model) {

    const categories =
        modelCategories[model.modelId];

    if (!categories) {
        return new Set();
    }

    let ids = new Set();

    /*
     * CAPAS
     *
     * Si una categoría no tiene estado registrado,
     * asumimos que está visible.
     */
    for (const [category, categoryIds] of categories) {

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


    /*
     * NIVELES
     */
    if (
        Object.keys(activeLevels).length &&
            activeLevels[model.modelId]
    ) {

        const levelIds =
            activeLevels[model.modelId];

        ids = new Set(
            [...ids].filter(
                id => levelIds.has(id)
            )
        );
    }


    /*
     * PROPIEDAD
     */
    if (activePropertyFilters.length) {

        const properties =
            modelProperties[model.modelId];

        if (!properties) {
            return new Set();
        }

        /*
     * Agrupar filtros por clave.
     *
     * Ejemplo:
     *
     * Categoría:
     *   - Muro
     *   - Puerta
     *
     * Fase:
     *   - New Construction
     */
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


        /*
     * Cada clave diferente representa
     * un grupo AND.
     */
        for (
        const [key, values]
        of filtersByKey
    ) {

            const propertyValues =
            properties.get(key);

            if (!propertyValues) {
                return new Set();
            }


            /*
         * Dentro de la misma clave:
         *
         * Muro OR Puerta OR Ventana
         */
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


            /*
         * Ningún valor de este grupo
         * coincide.
         */
            if (!groupIds.size) {
                return new Set();
            }


            /*
         * AND con los otros grupos.
         */
            ids = new Set(
                [...ids].filter(
                    id => groupIds.has(id)
                )
            );


            /*
         * Si ya no quedan elementos,
         * podemos terminar.
         */
            if (!ids.size) {
                return ids;
            }
        }
    }

    return ids;
}

function renderPropertyFilters() {

    const container =
    document.getElementById(
        'property-filters'
    );

    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (!activePropertyFilters.length) {

        container.innerHTML = `
<div class="small text-secondary">
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
            'd-flex align-items-center justify-content-between gap-2 mb-1 p-2 bg-dark rounded';

        item.innerHTML = `
<div class="small text-truncate">

    <div class="text-secondary">
        ${escapeHtml(filter.key)}
    </div>

    <div class="text-white text-truncate">
        ${escapeHtml(filter.value)}
    </div>

</div>

<button
    type="button"
    class="btn btn-sm btn-outline-light property-filter-remove"
    data-index="${index}">
    <i class="bi bi-x"></i>
</button>
`;

        container.appendChild(item);
    }

    container
        .querySelectorAll(
            '.property-filter-remove'
        )
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

async function applyAllFilters() {

    const modelIdMap = {};

    for (const [, model] of fragments.list) {

        const ids =
        getFilteredModelIds(model);

        modelIdMap[model.modelId] =
            ids;
    }

    await hider.set(false);

    await hider.set(
        true,
        modelIdMap
    );
}

async function clearPropertyFilter() {

    activePropertyFilter.key = null;
    activePropertyFilter.value = null;

    await applyAllFilters();
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

document
    .getElementById('close-element-info')
    .addEventListener('click', async () => {

        await highlighter.clear('select');

        selectedBimElement = null;

        document
            .getElementById('element-info-panel')
            .classList.add('d-none');
    });

document
    .getElementById('property-key')
    .addEventListener('change', function () {

        const key =
            this.value;

        const selectValue =
        document.getElementById(
            'property-value'
        );

        const btnApply =
        document.getElementById(
            'btn-apply-property'
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

        for (
        const modelId
        of Object.keys(modelProperties)
    ) {

            const properties =
                modelProperties[modelId];

            if (!properties) {
                continue;
            }

            const values =
            properties.get(key);

            if (!values) {
                continue;
            }

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
    });

document
    .getElementById(
        'btn-apply-property'
    )
    .addEventListener(
        'click',
        async () => {

            const key =
                document.getElementById(
                    'property-key'
                ).value;

            const value =
                document.getElementById(
                    'property-value'
                ).value;

            if (!key || !value) {
                return;
            }

            /*
             * Evitar duplicados.
             */
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

            /*
             * Limpiar selección
             * para poder agregar otro filtro.
             */
            document
                .getElementById(
                    'property-key'
                )
                .value = '';

            document
                .getElementById(
                    'property-value'
                ).innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;

            document
                .getElementById(
                    'property-value'
                )
                .disabled = true;

            document
                .getElementById(
                    'btn-apply-property'
                )
                .disabled = true;

            /*
             * Actualizar lista.
             */
            renderPropertyFilters();

            /*
             * Aplicar todos los filtros.
             */
            await applyAllFilters();
        }
    );

document
    .getElementById(
        'btn-clear-property'
    )
    .addEventListener(
        'click',
        async () => {

            activePropertyFilters = [];

            document
                .getElementById(
                    'property-key'
                )
                .value = '';

            document
                .getElementById(
                    'property-value'
                ).innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;

            document
                .getElementById(
                    'property-value'
                ).disabled = true;

            document
                .getElementById(
                    'btn-apply-property'
                ).disabled = true;

            renderPropertyFilters();

            await applyAllFilters();
        }
    );

document
    .getElementById('property-value')
    .addEventListener('change', function () {

        document
            .getElementById(
                'btn-apply-property'
            )
            .disabled = !this.value;
    });

document
    .querySelectorAll('.toolbar button')
    .forEach(button => {

        button.addEventListener('mousedown', event => {
            event.stopPropagation();
        });

        button.addEventListener('click', event => {
            event.stopPropagation();
        });

        button.addEventListener('dblclick', event =>{
            event.stopPropagation();
        })

    });

document
    .getElementById('bottomBar')
    .addEventListener('mousedown', event => {
        event.stopPropagation();
    });

document
    .getElementById('bottomBar')
    .addEventListener('click', event => {
        event.stopPropagation();
    });

