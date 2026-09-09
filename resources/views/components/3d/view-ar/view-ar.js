
// ======================================================
// VARIABLES GENERALES
// ======================================================

const gltfLoader = new GLTFLoader();

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
let min, max, center;

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


// ======================================================
// WEBXR / AR
// ======================================================

let arController = null;
let arReticle = null;

let hitTestSource = null;
let hitTestSourceRequested = false;

let arModel = null;


// ======================================================
// INIT VIEWER
// ======================================================

async function initViewer(container) {

    // --------------------------------------------------
    // THAT OPEN
    // --------------------------------------------------

    components = new OBC.Components();

    hider = components.get(OBC.Hider);

    const worlds = components.get(OBC.Worlds);

    world = worlds.create();


    // --------------------------------------------------
    // SCENE
    // --------------------------------------------------

    world.scene = new OBC.SimpleScene(components);

    world.scene.setup();

    world.scene.three.background = null;


    // --------------------------------------------------
    // RENDERER
    // --------------------------------------------------

    world.renderer = new OBF.PostproductionRenderer(
        components,
        container
    );


    renderer = world.renderer.three;


    // --------------------------------------------------
    // CAMERA
    // --------------------------------------------------

    world.camera = new OBC.OrthoPerspectiveCamera(
        components
    );

    await world.camera.controls.setLookAt(
        68,
        23,
        -8.5,
        0,
        0,
        0
    );


    // --------------------------------------------------
    // COMPONENTS
    // --------------------------------------------------

    components.init();


    // --------------------------------------------------
    // GRID
    // --------------------------------------------------

    components.get(OBC.Grids).create(world);

    world.scene.setup();


    // --------------------------------------------------
    // SCENE THREE
    // --------------------------------------------------

    scene = world.scene.three;

    scene.background = new THREE.Color(
        0x1a1d25
    );


    // ==================================================
    // WEBXR
    // ==================================================

    renderer.xr.enabled = true;


    // --------------------------------------------------
    // AR BUTTON
    // --------------------------------------------------

    const arButton = ARButton.createButton(
        renderer,
        {
            requiredFeatures: [
                'hit-test'
            ]
        }
    );

    document.body.appendChild(arButton);


    // --------------------------------------------------
    // RETICLE
    // --------------------------------------------------

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


    arReticle = new THREE.Mesh(
        reticleGeometry,
        reticleMaterial
    );


    arReticle.matrixAutoUpdate = false;

    arReticle.visible = false;


    scene.add(arReticle);


    // --------------------------------------------------
    // AR CONTROLLER
    // --------------------------------------------------

    arController =
        renderer.xr.getController(0);


    arController.addEventListener(
        'select',
        onARSelect
    );


    scene.add(arController);


    // ==================================================
    // FRAGMENTS
    // ==================================================

    const workerUrl = "/engine/worker.mjs";

    fragments =
        components.get(
            OBC.FragmentsManager
        );

    fragments.init(
        workerUrl
    );


    // --------------------------------------------------
    // CAMERA UPDATE
    // --------------------------------------------------

    world.camera.controls.addEventListener(
        "update",
        () => fragments.core.update()
    );


    // --------------------------------------------------
    // CAMERA CHANGED
    // --------------------------------------------------

    world.onCameraChanged.add(
        (camera) => {

            for (
                const [, model]
                of fragments.list
            ) {

                model.useCamera(
                    camera.three
                );

            }

            fragments.core.update();
        }
    );


    // --------------------------------------------------
    // MODEL ADDED
    // --------------------------------------------------

    fragments.list.onItemSet.add(
        ({ value: model }) => {

            model.useCamera(
                world.camera.three
            );


            scene.add(
                model.object
            );


            // ------------------------------------------
            // GUARDAR MODELO PARA AR
            // ------------------------------------------

            if (!arModel) {

                arModel =
                    model.object;

            }


            fragments.core.update(
                true
            );

        }
    );


    // --------------------------------------------------
    // MATERIALS
    // --------------------------------------------------

    fragments.core.models.materials.list.onItemSet.add(
        ({ value: material }) => {

            if (
                !(
                    "isLodMaterial" in material
                    &&
                    material.isLodMaterial
                )
            ) {

                material.polygonOffset = true;

                material.polygonOffsetUnits = 1;

                material.polygonOffsetFactor =
                    Math.random();

            }

        }
    );


    // ==================================================
    // STATS
    // ==================================================

    const stats = new Stats();

    stats.showPanel(2);

    stats.dom.style.position =
        'absolute';

    stats.dom.style.top =
        '10px';

    stats.dom.style.left =
        '10px';

    stats.dom.style.zIndex =
        '20';

    container.append(
        stats.dom
    );


    world.renderer.onBeforeUpdate.add(
        () => stats.begin()
    );

    world.renderer.onAfterUpdate.add(
        () => stats.end()
    );


    // ==================================================
    // WEBXR ANIMATION LOOP
    // ==================================================

    renderer.setAnimationLoop(
        (timestamp, frame) => {

            updateAR(
                frame
            );

            fragments.core.update();

            renderer.render(
                scene,
                world.camera.three
            );

        }
    );
}


// ======================================================
// AR UPDATE
// ======================================================

async function updateAR(frame) {

    if (!frame) {
        return;
    }


    const session =
        renderer.xr.getSession();


    const referenceSpace =
        renderer.xr.getReferenceSpace();


    // --------------------------------------------------
    // REQUEST HIT TEST
    // --------------------------------------------------

    if (
        !hitTestSourceRequested
    ) {

        session
            .requestReferenceSpace(
                'viewer'
            )
            .then(
                (viewerSpace) => {

                    session
                        .requestHitTestSource({
                            space: viewerSpace
                        })
                        .then(
                            (source) => {

                                hitTestSource =
                                    source;

                            }
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

                arReticle.visible =
                    false;

            },
            {
                once: true
            }
        );


        hitTestSourceRequested =
            true;
    }


    // --------------------------------------------------
    // HIT TEST
    // --------------------------------------------------

    if (!hitTestSource) {
        return;
    }


    const hitTestResults =
        frame.getHitTestResults(
            hitTestSource
        );


    if (
        hitTestResults.length > 0
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


// ======================================================
// AR SELECT
// ======================================================

function onARSelect() {

    if (
        !arReticle ||
        !arReticle.visible
    ) {
        return;
    }


    if (!arModel) {

        console.warn(
            'No hay un modelo IFC cargado.'
        );

        return;
    }


    // --------------------------------------------------
    // POSICIÓN DEL RETÍCULO
    // --------------------------------------------------

    const position =
        new THREE.Vector3();


    position.setFromMatrixPosition(
        arReticle.matrix
    );


    // --------------------------------------------------
    // COLOCAR IFC
    // --------------------------------------------------

    arModel.position.copy(
        position
    );


    arModel.visible =
        true;


    console.log(
        'IFC colocado en:',
        position
    );
}


// ======================================================
// IFC LOADER
// ======================================================

async function ifcLoader(url, id) {

    const fragPaths = [
        url + '?type=frag'
    ];


    await Promise.all(

        fragPaths.map(
            async (path) => {

                const modelId = id;

                if (!modelId) {
                    return null;
                }


                const file =
                    await fetch(path);


                const buffer =
                    await file.arrayBuffer();


                return fragments.core.load(
                    buffer,
                    {
                        modelId
                    }
                );

            }
        )

    );


    renderModelsList();

    await processModel();


    // ==================================================
    // RAYCASTER
    // ==================================================

    const casters =
        components.get(
            OBC.Raycasters
        );

    casters.get(world);


    // ==================================================
    // CLIPPER
    // ==================================================

    clipper =
        components.get(
            OBC.Clipper
        );


    // ==================================================
    // MEASURER
    // ==================================================

    measurer =
        components.get(
            OBF.LengthMeasurement
        );


    measurer.world =
        world;

    measurer.color =
        new THREE.Color(
            "#494cb6"
        );

    measurer.snappings = [
        FRAGS.SnappingClass.POINT
    ];


    // ==================================================
    // SYNCHRONOUS MESHES
    // ==================================================

    const meshes = [];


    for (
        const [, model]
        of fragments.list
    ) {

        const idsWithGeometry =
            await model.getItemsIdsWithGeometry();


        const allMeshesData =
            await model.getItemsGeometry(
                idsWithGeometry
            );


        const geometries =
            new Map();


        for (
            const itemId
            in allMeshesData
        ) {

            const meshData =
                allMeshesData[itemId];


            for (
                const geomData
                of meshData
            ) {

                if (
                    !geomData.positions ||
                    !geomData.indices ||
                    !geomData.transform ||
                    !geomData.representationId
                ) {
                    continue;
                }


                const representationId =
                    geomData.representationId;


                if (
                    !geometries.has(
                        representationId
                    )
                ) {

                    const geometry =
                        new THREE.BufferGeometry();


                    geometry.setAttribute(
                        "position",
                        new THREE.Float32BufferAttribute(
                            geomData.positions,
                            3
                        )
                    );


                    geometry.setIndex(
                        Array.from(
                            geomData.indices
                        )
                    );


                    geometries.set(
                        representationId,
                        geometry
                    );

                }


                const geometry =
                    geometries.get(
                        representationId
                    );


                const mesh =
                    new THREE.Mesh(
                        geometry
                    );


                mesh.applyMatrix4(
                    geomData.transform
                );


                mesh.applyMatrix4(
                    model.object.matrixWorld
                );


                mesh.updateWorldMatrix(
                    true,
                    true
                );


                meshes.push(
                    mesh
                );

            }

        }

    }


    // ==================================================
    // MEASURER SYNCHRONOUS
    // ==================================================

    const pastDelay =
        measurer.delay;


    const makeSynchronous =
        async (value) => {

            if (value) {

                measurer.pickerMode =
                    OBF.GraphicVertexPickerMode.SYNCHRONOUS;


                measurer.delay = 0;


                for (
                    const mesh
                    of meshes
                ) {

                    world.meshes.add(
                        mesh
                    );

                }


                return;
            }


            measurer.pickerMode =
                OBF.GraphicVertexPickerMode.DEFAULT;


            measurer.delay =
                pastDelay;


            for (
                const mesh
                of meshes
            ) {

                world.meshes.delete(
                    mesh
                );

            }

        };


    await makeSynchronous(
        true
    );


    // ==================================================
    // CLASSIFIER
    // ==================================================

    classifier =
        components.get(
            OBC.Classifier
        );


    await classifier.byIfcBuildingStorey({
        classificationName:
            "Levels"
    });


    buildLevelsUIFromClassifier();


    // ==================================================
    // RAYCAST IFC
    // ==================================================

    const raycasted =
        async (data) => {

            const results = [];


            for (
                const [_, model]
                of fragments.list
            ) {

                const result =
                    await model.raycast(
                        data
                    );


                if (result) {

                    results.push(
                        result
                    );

                }

            }


            await Promise.all(
                results
            );


            if (
                results.length === 0
            ) {
                return null;
            }


            let closestResult =
                results[0];


            let minDistance =
                closestResult.distance;


            for (
                let i = 1;
                i < results.length;
                i++
            ) {

                if (
                    results[i].distance
                    <
                    minDistance
                ) {

                    minDistance =
                        results[i].distance;


                    closestResult =
                        results[i];

                }

            }


            return closestResult;
        };


    const mouse =
        new THREE.Vector2();


    let onRaycastHoverResult =
        (_result) => {};


    container.addEventListener(
        "pointermove",
        async (event) => {

            mouse.x =
                event.clientX;

            mouse.y =
                event.clientY;


            const result =
                await raycasted({
                    camera:
                        world.camera.three,

                    mouse,

                    dom:
                        world.renderer.three.domElement,
                });


            function format3(n) {

                return Number.isFinite(n)
                    ? n.toFixed(3)
                    : '0.000';

            }


            if (result) {

                document.getElementById(
                    'xyz'
                ).innerHTML =
                    `XYZ: (${format3(result.point.x)}, ${format3(result.point.y)}, ${format3(result.point.z)})`;

            }


            if (
                activeTool === 'anchor'
                ||
                activeTool === 'issue'
            ) {

                onRaycastHoverResult(
                    result
                );

            }

        }
    );


    // ==================================================
    // RAYCAST LINE
    // ==================================================

    const lineGeometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                new THREE.Vector3(
                    0,
                    0,
                    0
                ),
                new THREE.Vector3(
                    0,
                    0,
                    2
                ),
            ]);


    const lineMaterial =
        new THREE.LineBasicMaterial({
            color: "#6528d7"
        });


    const line =
        new THREE.Line(
            lineGeometry,
            lineMaterial
        );


    scene.add(
        line
    );


    marker =
        components.get(
            OBF.Marker
        );


    marker.threshold =
        10;


    onRaycastHoverResult =
        (result) => {

            line.visible =
                !!result;


            if (!result) {
                return;
            }


            const {
                point,
                normal
            } = result;


            if (!normal) {
                return;
            }


            line.position.copy(
                point
            );


            const look =
                point.clone()
                    .add(normal);


            line.lookAt(
                look
            );

        };


    // ==================================================
    // CLICK IFC
    // ==================================================

    container.addEventListener(
        "click",
        async (event) => {

            if (
                activeTool !== 'anchor'
                &&
                activeTool !== 'issue'
            ) {
                return;
            }


            mouse.x =
                event.clientX;

            mouse.y =
                event.clientY;


            const result =
                await raycasted({
                    camera:
                        world.camera.three,

                    mouse,

                    dom:
                        world.renderer.three.domElement,
                });


            onRaycastClickResult(
                result
            );

        }
    );


    // ==================================================
    // BOUNDING BOX
    // ==================================================

    box_world =
        new THREE.Box3();


    for (
        const [, model]
        of fragments.list
    ) {

        box_world.expandByObject(
            model.object
        );

    }


    min =
        box_world.min;


    max =
        box_world.max;


    center =
        box_world.getCenter(
            new THREE.Vector3()
        );


    createSectionPlanes();


    // ==================================================
    // ANCHORS
    // ==================================================

    let v =
        $wire.anchors;


    for (
        let i = 0;
        i < v.length;
        i++
    ) {

        let item = {

            id:
                v[i].id,

            name:
                v[i].title,

            model:
                v[i].mode_id,

            type:
                'anchor',

            x:
                parseFloat(v[i].x),

            y:
                parseFloat(v[i].y),

            z:
                parseFloat(v[i].z),

            status:
                v[i].is_active
                    ? 'activo'
                    : 'inhabilitado'
        };


        anchors.push(
            item
        );


        createMarker(
            item
        );


        addToTable(
            item
        );

    }

let arRoot = new THREE.Group();
arRoot.visible = false;

scene.add(arRoot);
    for (const [, model] of fragments.list) {
    arRoot.add(model.object);
}
    const box = new THREE.Box3().setFromObject(arRoot);
const size = box.getSize(new THREE.Vector3());

const maxSize = Math.max(size.x, size.y, size.z);

// Por ahora queremos que el modelo mida aproximadamente 1 metro
if (maxSize > 0) {
    const scale = 1 / maxSize;
    arRoot.scale.setScalar(scale);
}

}
function onSelect() {

    if (!reticle.visible) {
        return;
    }

    arRoot.position.setFromMatrixPosition(reticle.matrix);

    arRoot.quaternion.setFromRotationMatrix(reticle.matrix);

    arRoot.visible = true;
}

// ======================================================
// SECCIÓN
// ======================================================

async function createSectionPlanes() {

    const size =
        box_world
            .getSize(
                new THREE.Vector3()
            )
            .length();


    const offset =
        size * 0.5;


    clipper.deleteAll();


    sectionPlanes.xMax =
        await clipper.create(
            world
        );


    sectionPlanes.xMax.helper.position.set(
        max.x + offset,
        center.y,
        center.z
    );


    sectionPlanes.xMax.normal.set(
        -1,
        0,
        0
    );


    sectionPlanes.xMax.helper.visible =
        false;


    sectionPlanes.xMax.controls._gizmo.visible =
        false;


    sectionPlanes.xMax.update();


    sectionPlanes.xMin =
        await clipper.create(
            world
        );


    sectionPlanes.xMin.helper.position.set(
        min.x - offset,
        center.y,
        center.z
    );


    sectionPlanes.xMin.normal.set(
        1,
        0,
        0
    );


    sectionPlanes.xMin.helper.visible =
        false;


    sectionPlanes.xMin.controls._gizmo.visible =
        false;


    sectionPlanes.xMin.update();


    sectionPlanes.yMax =
        await clipper.create(
            world
        );


    sectionPlanes.yMax.helper.position.set(
        center.x,
        max.y + offset,
        center.z
    );


    sectionPlanes.yMax.normal.set(
        0,
        -1,
        0
    );


    sectionPlanes.yMax.helper.visible =
        false;


    sectionPlanes.yMax.controls._gizmo.visible =
        false;


    sectionPlanes.yMax.update();


    sectionPlanes.yMax.update();


    sectionPlanes.yMin =
        await clipper.create(
            world
        );


    sectionPlanes.yMin.helper.position.set(
        center.x,
        min.y - offset,
        center.z
    );


    sectionPlanes.yMin.normal.set(
        0,
        1,
        0
    );


    sectionPlanes.yMin.helper.visible =
        false;


    sectionPlanes.yMin.controls._gizmo.visible =
        false;


    sectionPlanes.yMin.update();


    sectionPlanes.zMax =
        await clipper.create(
            world
        );


    sectionPlanes.zMax.helper.position.set(
        center.x,
        center.y,
        max.z + offset
    );


    sectionPlanes.zMax.normal.set(
        0,
        0,
        -1
    );


    sectionPlanes.zMax.helper.visible =
        false;


    sectionPlanes.zMax.controls._gizmo.visible =
        false;


    sectionPlanes.zMax.update();


    sectionPlanes.zMin =
        await clipper.create(
            world
        );


    sectionPlanes.zMin.helper.position.set(
        center.x,
        center.y,
        min.z - offset
    );


    sectionPlanes.zMin.normal.set(
        0,
        0,
        1
    );


    sectionPlanes.zMin.helper.visible =
        false;


    sectionPlanes.zMin.controls._gizmo.visible =
        false;


    sectionPlanes.zMin.update();


    // --------------------------------------------------
    // SLIDERS
    // --------------------------------------------------

    const axes = [
        'x',
        'y',
        'z'
    ];


    axes.forEach(
        axis => {

            const minInput =
                document.getElementById(
                    `${axis}Min`
                );


            const maxInput =
                document.getElementById(
                    `${axis}Max`
                );


            minInput.min =
                box_world.min[axis];


            minInput.max =
                box_world.max[axis];


            minInput.value =
                box_world.min[axis];


            maxInput.min =
                box_world.min[axis];


            maxInput.max =
                box_world.max[axis];


            maxInput.value =
                box_world.max[axis];

        }
    );


    bindSlider(
        'x',
        sectionPlanes.xMin,
        sectionPlanes.xMax
    );


    bindSlider(
        'y',
        sectionPlanes.yMin,
        sectionPlanes.yMax
    );


    bindSlider(
        'z',
        sectionPlanes.zMin,
        sectionPlanes.zMax
    );

}


// ======================================================
// SLIDER
// ======================================================

function bindSlider(
    axis,
    planeMin,
    planeMax
) {

    const minInput =
        document.getElementById(
            `${axis}Min`
        );


    const maxInput =
        document.getElementById(
            `${axis}Max`
        );


    minInput.addEventListener(
        'input',
        () => {

            let minVal =
                parseFloat(
                    minInput.value
                );


            let maxVal =
                parseFloat(
                    maxInput.value
                );


            if (
                minVal > maxVal
            ) {

                minVal =
                    maxVal;

                minInput.value =
                    maxVal;

            }


            planeMin
                .helper
                .position[axis] =
                    minVal;


            planeMin.update();


            fragments.core.update(
                true
            );

        }
    );


    maxInput.addEventListener(
        'input',
        () => {

            let minVal =
                parseFloat(
                    minInput.value
                );


            let maxVal =
                parseFloat(
                    maxInput.value
                );


            if (
                maxVal < minVal
            ) {

                maxVal =
                    minVal;

                maxInput.value =
                    minVal;

            }


            planeMax
                .helper
                .position[axis] =
                    maxVal;


            planeMax.update();


            fragments.core.update(
                true
            );

        }
    );

}


// ======================================================
// RAYCAST CLICK
// ======================================================

async function onRaycastClickResult(
    result
) {

    if (
        !result ||
        !activeTool
    ) {
        return;
    }


    if (
        activeTool !== 'anchor'
        &&
        activeTool !== 'issue'
    ) {
        return;
    }


    const { point } =
        result;


    const name =
        prompt(
            `Nombre del ${activeTool}:`
        );


    if (!name) {
        return;
    }


    let model =
        result.fragments.object.name;


    const item = {

        id:
            Date.now(),

        name,

        model,

        type:
            activeTool,

        x:
            point.x,

        y:
            point.y,

        z:
            point.z,

        status:
            'activo'

    };


    createMarker(
        item
    );


    let r =
        await $wire.saveMark(
            item.name,
            item.model,
            item.type,
            item.x,
            item.y,
            item.z
        );


    if (
        r != 'fail'
    ) {

        Swal.fire({
            icon:
                'success',

            title:
                'Creado Correctamente'
        });

    } else {

        Swal.fire({
            icon:
                'error',

            title:
                'Falla al Crear'
        });

    }


    item.id =
        r;


    anchors.push(
        item
    );


    addToTable(
        item
    );

}


// ======================================================
// MARKER
// ======================================================

async function createMarker(
    item
) {

    const element =
        BUI.Component.create(
            () => BUI.html`

<div class="marker ${item.type}">
    ${
        item.type === 'anchor'
            ? '⚓'
            : '⚠️'
    }
</div>

`
        );


    const markerInstance =
        marker.create(
            world,
            element,
            new THREE.Vector3(
                item.x,
                item.y,
                item.z
            )
        );


    item._marker =
        markerInstance;


    element.addEventListener(
        'click',
        () => {

            focusItem(
                item
            );

        }
    );

}


// ======================================================
// FOCUS
// ======================================================

function focusItem(item) {

    world.camera.controls.setLookAt(
        item.x + 5,
        item.y + 5,
        item.z + 5,
        item.x,
        item.y,
        item.z
    );

}


// ======================================================
// REMOVE ITEM
// ======================================================

function removeItem(
    item,
    tr
) {

    if (
        item._marker
    ) {

        marker.delete(
            item._marker
        );

    }


    $wire.removeMark(
        item.id,
        item.type
    );


    anchors =
        anchors.filter(
            a => a.id !== item.id
        );


    tr.remove();

}


// ======================================================
// VIEW ITEM
// ======================================================

function viewItem(item) {

    if (
        item.type === 'issue'
    ) {

        window.open(
            `/incidencias/${item.id}`,
            '_blank'
        );

    } else {

        alert(`
Anclaje: ${item.name}
XYZ: (${item.x.toFixed(3)}, ${item.y.toFixed(3)}, ${item.z.toFixed(3)})
Estado: ${item.status}
`);

    }

}


// ======================================================
// TABLE
// ======================================================

function addToTable(item) {

    const tbody =
        document.getElementById(
            'anchors-table'
        );


    const tr =
        document.createElement(
            'tr'
        );


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


    tr.querySelector(
        '.btn-view'
    ).addEventListener(
        'click',
        (e) => {

            e.stopPropagation();

            viewItem(
                item
            );

        }
    );


    tr.querySelector(
        '.btn-delete'
    ).addEventListener(
        'click',
        (e) => {

            e.stopPropagation();


            if (
                confirm(
                    '¿Eliminar elemento?'
                )
            ) {

                removeItem(
                    item,
                    tr
                );

            }

        }
    );


    tr.addEventListener(
        'click',
        () => {

            focusItem(
                item
            );

        }
    );


    tr.addEventListener(
        'mouseenter',
        () => {

            if (
                item._marker?.element
            ) {

                item._marker.element.style.transform =
                    'scale(1.5)';

            }

        }
    );


    tr.addEventListener(
        'mouseleave',
        () => {

            if (
                item._marker?.element
            ) {

                item._marker.element.style.transform =
                    'scale(1)';

            }

        }
    );


    tbody.appendChild(
        tr
    );

}


// ======================================================
// GLB
// ======================================================

async function loadGLB(file) {

    new Promise(
        (resolve, reject) => {

            if (model) {

                scene.remove(
                    model.object
                );

                model =
                    null;

            }


            if (currentModel) {

                scene.remove(
                    currentModel
                );

                currentModel =
                    null;

            }


            const url =
                URL.createObjectURL(
                    file
                );


            gltfLoader.load(
                url,

                (gltf) => {

                    const obj =
                        gltf.scene;


                    const box =
                        new THREE.Box3()
                            .setFromObject(
                                obj
                            );


                    const center =
                        box.getCenter(
                            new THREE.Vector3()
                        );


                    obj.position.sub(
                        center
                    );


                    const size =
                        box.getSize(
                            new THREE.Vector3()
                        ).length();


                    world.camera.controls.setLookAt(
                        size,
                        size,
                        size,
                        0,
                        0,
                        0
                    );


                    currentModel =
                        obj;


                    scene.add(
                        obj
                    );


                    arModel =
                        obj;


                    URL.revokeObjectURL(
                        url
                    );


                    obj.traverse(
                        (child) => {

                            if (
                                child.isMesh
                            ) {

                                child.material.side =
                                    THREE.DoubleSide;

                            }

                        }
                    );


                    resolve();

                },

                undefined,

                reject
            );

        }
    );


    await processModel();

}


// ======================================================
// LOADING
// ======================================================

function showLoading() {

    loading.style.display =
        'flex';

}


function hideLoading() {

    loading.style.display =
        'none';

}


// ======================================================
// LOAD URL
// ======================================================

async function loadFromUrl(
    url
) {

    showLoading();


    const ext =
        container.dataset.type;


    try {

        const response =
            await fetch(
                url
            );


        const blob =
            await response.blob();


        const file =
            new File(
                [blob],
                'model.' + ext
            );


        if (
            ext === 'ifc'
        ) {

            await ifcLoader(
                url,
                'main'
            );

        } else if (
            ext === 'glb'
            ||
            ext === 'gltf'
        ) {

            await loadGLB(
                file
            );

        } else {

            console.warn(
                "Formato no soportado"
            );

        }

    } catch (e) {

        console.error(
            "Error cargando modelo:",
            e
        );

    }


    hideLoading();

}


// ======================================================
// MODELS LIST
// ======================================================

function renderModelsList() {

    const container =
        document.getElementById(
            'models-container'
        );


    container.innerHTML =
        '';


    const models =
        [...fragments.list.values()];


    models.forEach(
        (model) => {

            const modelId =
                model.modelId;


            const name =
                model.object?.name
                ||
                modelId;


            const item =
                document.createElement(
                    'div'
                );


            item.className =
                'card mb-2 p-2 shadow-sm';


            item.style.background =
                '#1f222a';


            item.innerHTML = `

<div class="d-flex align-items-center justify-content-between">

    <div class="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">

        <input
            type="checkbox"
            checked
            class="form-check-input model-visible m-0"
        >

        <input
            type="radio"
            name="isolate-model"
            class="form-check-input model-isolate m-0"
        >

        <span
            class="text-truncate text-light flex-grow-1"
            title="${name}"
        >
            ${name}
        </span>

    </div>

    <button
        class="btn btn-sm btn-danger ms-2 remove-model"
    >
        ✕
    </button>

</div>

`;


            const visible =
                item.querySelector(
                    '.model-visible'
                );


            const isolate =
                item.querySelector(
                    '.model-isolate'
                );


            const remove =
                item.querySelector(
                    '.remove-model'
                );


            visible.addEventListener(
                'change',
                async (e) => {

                    await toggleModel(
                        modelId,
                        e.target.checked
                    );

                }
            );


            isolate.addEventListener(
                'change',
                async (e) => {

                    if (
                        e.target.checked
                    ) {

                        await isolateModel(
                            modelId
                        );

                    }

                }
            );


            remove.addEventListener(
                'click',
                async () => {

                    await removeModel(
                        modelId
                    );

                }
            );


            container.appendChild(
                item
            );

        }
    );

}


// ======================================================
// TOGGLE MODEL
// ======================================================

async function toggleModel(
    modelId,
    visible
) {

    const model =
        fragments.list.get(
            modelId
        );


    if (!model) {
        return;
    }


    const ids =
        await model.getItemsIdsWithGeometry();


    const modelIdMap = {

        [modelId]:
            new Set(ids)

    };


    await hider.set(
        visible,
        modelIdMap
    );

}


// ======================================================
// ISOLATE MODEL
// ======================================================

async function isolateModel(
    modelId
) {

    const model =
        fragments.list.get(
            modelId
        );


    if (!model) {
        return;
    }


    const ids =
        await model.getItemsIdsWithGeometry();


    const modelIdMap = {

        [modelId]:
            new Set(ids)

    };


    await hider.isolate(
        modelIdMap
    );

}


// ======================================================
// REMOVE MODEL
// ======================================================

async function removeModel(
    modelId
) {

    const model =
        fragments.list.get(
            modelId
        );


    if (!model) {
        return;
    }


    scene.remove(
        model.object
    );


    fragments.list.delete(
        modelId
    );


    fragments.core.disposeModel(
        modelId
    );


    if (
        arModel === model.object
    ) {

        arModel =
            null;

    }


    renderModelsList();


    classifier.dispose();


    await classifier.byIfcBuildingStorey({
        classificationName:
            "Levels"
    });


    buildLevelsUIFromClassifier();


    const container =
        document.getElementById(
            'layers-container'
        );


    container.innerHTML =
        '';


    await processModel();

}


// ======================================================
// LEVELS
// ======================================================

function buildLevelsUIFromClassifier() {

    const container =
        document.getElementById(
            'levels-container'
        );


    container.innerHTML =
        '';


    const classification =
        classifier.list.get(
            "Levels"
        );


    if (!classification) {
        return;
    }


    for (
        const [name, group]
        of classification
    ) {

        const row =
            document.createElement(
                'div'
            );


        row.className =
            'card mb-2 shadow-sm';


        row.innerHTML = `

<div class="d-flex align-items-center justify-content-between p-2">

    <div class="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">

        <input
            type="checkbox"
            checked
            class="form-check-input level-visible m-0"
        >

        <input
            type="radio"
            name="isolate-level"
            class="form-check-input level-isolate m-0"
        >

        <span
            class="text-light fw-semibold text-truncate flex-grow-1"
            title="${name}"
        >
            ${name}
        </span>

    </div>

</div>

`;


        const checkbox =
            row.querySelector(
                '.level-visible'
            );


        const radio =
            row.querySelector(
                '.level-isolate'
            );


        checkbox.addEventListener(
            'change',
            async (e) => {

                const modelIdMap =
                    await group.get();


                if (
                    e.target.checked
                ) {

                    for (
                        const modelId
                        in modelIdMap
                    ) {

                        if (
                            !activeLevels[modelId]
                        ) {

                            activeLevels[modelId] =
                                new Set();

                        }


                        modelIdMap[
                            modelId
                        ].forEach(
                            id => {

                                activeLevels[
                                    modelId
                                ].add(
                                    id
                                );

                            }
                        );

                    }

                } else {

                    for (
                        const modelId
                        in modelIdMap
                    ) {

                        if (
                            !activeLevels[modelId]
                        ) {
                            continue;
                        }


                        modelIdMap[
                            modelId
                        ].forEach(
                            id => {

                                activeLevels[
                                    modelId
                                ].delete(
                                    id
                                );

                            }
                        );

                    }

                }


                await hider.set(
                    false
                );


                await hider.set(
                    true,
                    activeLevels
                );


                document.querySelectorAll(
                    'input[name="isolate-group"]'
                ).forEach(
                    radio =>
                        radio.checked =
                            false
                );


                document.querySelectorAll(
                    '.visibility-toggle'
                ).forEach(
                    radio =>
                        radio.checked =
                            true
                );


                fragments.core.update();

            }
        );


        radio.addEventListener(
            'change',
            async (e) => {

                if (
                    !e.target.checked
                ) {
                    return;
                }


                const modelIdMap =
                    await group.get();


                activeLevels =
                    {};


                for (
                    const modelId
                    in modelIdMap
                ) {

                    activeLevels[
                        modelId
                    ] =
                        new Set(
                            modelIdMap[
                                modelId
                            ]
                        );

                }


                document.querySelectorAll(
                    '.level-visible'
                ).forEach(
                    cb =>
                        cb.checked =
                            false
                );


                checkbox.checked =
                    true;


                await hider.isolate(
                    modelIdMap
                );


                document.querySelectorAll(
                    'input[name="isolate-group"]'
                ).forEach(
                    radio =>
                        radio.checked =
                            false
                );


                document.querySelectorAll(
                    '.visibility-toggle'
                ).forEach(
                    radio =>
                        radio.checked =
                            true
                );


                fragments.core.update();

            }
        );


        row.addEventListener(
            'mouseenter',
            () => {

                row.style.background =
                    '#0D6EFD';

            }
        );


        row.addEventListener(
            'mouseleave',
            () => {

                row.style.background =
                    '#1f222a';

            }
        );


        container.appendChild(
            row
        );

    }


    document.getElementById(
        'btn-reset-levels'
    )?.addEventListener(
        'click',
        async () => {

            document.querySelectorAll(
                'input[name="isolate-level"]'
            ).forEach(
                r =>
                    r.checked =
                        false
            );


            document.querySelectorAll(
                '.level-visible'
            ).forEach(
                cb =>
                    cb.checked =
                        true
            );


            activeLevels =
                {};


            for (
                const [, model]
                of fragments.list
            ) {

                const ids =
                    await model.getItemsIdsWithGeometry();


                activeLevels[
                    model.modelId
                ] =
                    new Set(
                        ids
                    );

            }


            await hider.set(
                true
            );

        }
    );

}


// ======================================================
// PROCESS MODEL
// ======================================================

async function processModel() {

    for (
        const [modelId, model]
        of fragments.list
    ) {

        const categories =
            await model.getItemsOfCategories(
                [/IFC/]
            );


        const storeys =
            await model.getItemsOfCategories(
                [/BUILDINGSTOREY/]
            );


        const storeyIds =
            Object.values(
                storeys
            ).flat();


        const storeysData =
            await model.getItemsData(
                storeyIds
            );


        const geomCategories =
            await model.getItemsWithGeometryCategories();


        const allIds =
            Object.values(
                categories
            ).flat();


        const data =
            await model.getItemsData(
                allIds
            );


        buildUI({
            categories,
            storeys,
            geomCategories,
            data,
            model
        });

    }

}


// ======================================================
// BUILD UI
// ======================================================

function buildUI({
    categories
}) {

    const container =
        document.getElementById(
            'layers-container'
        );


    container.innerHTML =
        '';


    for (
        const groupName
        in categories
    ) {

        const group =
            document.createElement(
                'div'
            );


        group.className =
            'tree-group card mb-2 shadow-sm';


        const header =
            document.createElement(
                'div'
            );


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
            header.querySelector(
                '.visibility-toggle'
            );


        const isolate =
            header.querySelector(
                '.isolate-toggle'
            );


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

                if (
                    e.target.checked
                ) {

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


        group.appendChild(
            header
        );


        container.appendChild(
            group
        );

    }

}


// ======================================================
// TOGGLE CATEGORY
// ======================================================

async function toggleCategory(
    category,
    visible,
    type
) {

    const modelIdMap =
        {};


    for (
        const [, model]
        of fragments.list
    ) {

        const categoryItems =
            await model.getItemsOfCategories([
                new RegExp(
                    `^${category}$`
                )
            ]);


        const categoryIds =
            new Set(
                Object.values(
                    categoryItems
                ).flat()
            );


        let finalIds =
            categoryIds;


        if (
            Object.keys(
                activeLevels
            ).length
            &&
            activeLevels[
                model.modelId
            ]
        ) {

            const levelIds =
                activeLevels[
                    model.modelId
                ];


            finalIds =
                new Set(
                    [
                        ...categoryIds
                    ].filter(
                        id =>
                            levelIds.has(
                                id
                            )
                    )
                );

        }


        modelIdMap[
            model.modelId
        ] =
            finalIds;

    }


    if (
        type === 'isolate'
    ) {

        document.querySelectorAll(
            '.visibility-toggle'
        ).forEach(
            cb =>
                cb.checked =
                    false
        );


        await hider.isolate(
            modelIdMap
        );

    } else {

        await hider.set(
            visible,
            modelIdMap
        );

    }

}


// ======================================================
// TOGGLE ITEM
// ======================================================

async function toggleItem(
    id,
    visible
) {

    const modelIdMap =
        {};


    const modelId =
        fragments.list.keys()
            .next()
            .value;


    modelIdMap[
        modelId
    ] =
        new Set([
            id
        ]);


    if (visible) {

        await hider.set(
            true,
            modelIdMap
        );

    } else {

        await hider.set(
            false,
            modelIdMap
        );

    }

}


// ======================================================
// SIDEBARS
// ======================================================

leftTab.addEventListener(
    'click',
    () => {

        leftSidebar.classList.toggle(
            'collapsed'
        );

    }
);


rightTab.addEventListener(
    'click',
    () => {

        rightSidebar.classList.toggle(
            'collapsed'
        );

    }
);


leftSidebar.addEventListener(
    'dblclick',
    () => {

        leftSidebar.classList.add(
            'collapsed'
        );

    }
);


rightSidebar.addEventListener(
    'dblclick',
    () => {

        rightSidebar.classList.add(
            'collapsed'
        );

    }
);


// ======================================================
// RESET ISOLATE
// ======================================================

document.getElementById(
    'btn-reset-isolate'
).addEventListener(
    'click',
    async () => {

        document.querySelectorAll(
            'input[name="isolate-group"]'
        ).forEach(
            r =>
                r.checked =
                    false
        );


        document.querySelectorAll(
            '.visibility-toggle'
        ).forEach(
            cb =>
                cb.checked =
                    true
        );


        if (
            Object.keys(
                activeLevels
            ).length
        ) {

            await hider.set(
                false
            );


            await hider.set(
                true,
                activeLevels
            );

        } else {

            await hider.set(
                true
            );

        }

    }
);


// ======================================================
// TOOLS
// ======================================================

let toolState = {

    clipper:
        false,

    ruler:
        false

};


let activeTool =
    null;


// ======================================================
// DOUBLE CLICK TOOLS
// ======================================================

document.addEventListener(
    'dblclick',
    () => {

        window.clip =
            clipper;


        if (
            activeTool === 'clipper'
            &&
            clipper.enabled
        ) {

            clipper.create(
                world
            );


            return;

        } else if (
            activeTool === 'ruler'
            &&
            measurer.enabled
        ) {

            measurer.create();


            return;

        }

    }
);


// ======================================================
// ACTIVE TOOL
// ======================================================

function setActiveTool(
    tool
) {

    activeTool =
        tool;


    clipper.enabled =
        false;


    measurer.enabled =
        false;


    if (
        tool === 'clipper'
        &&
        toolState.clipper
    ) {

        clipper.enabled =
            true;


        toolState.ruler =
            false;

    } else if (
        tool === 'ruler'
        &&
        toolState.ruler
    ) {

        measurer.enabled =
            true;


        toolState.clipper =
            false;

    } else if (
        tool === 'anchor'
    ) {

    } else if (
        tool === 'issue'
    ) {

    }

}


// ======================================================
// UPDATE UI
// ======================================================

function updateUI() {

    btnClipper.classList.toggle(
        'active',
        activeTool === 'clipper'
    );


    btnRulers.classList.toggle(
        'active',
        activeTool === 'ruler'
    );


    btnAnchor.classList.toggle(
        'active',
        activeTool === 'anchor'
    );


    btnIssue.classList.toggle(
        'active',
        activeTool === 'issue'
    );

}


// ======================================================
// CLIPPER BUTTON
// ======================================================

let btnClipper =
    document.getElementById(
        'btn-clipper'
    );


btnClipper.addEventListener(
    'click',
    () => {

        document.getElementById(
            'clipper-panel'
        ).classList.toggle(
            'd-none'
        );


        toolState.clipper =
            !toolState.clipper;


        if (
            toolState.clipper
        ) {

            setActiveTool(
                'clipper'
            );

        } else {

            clipper.deleteAll();


            if (
                activeTool === 'clipper'
            ) {

                activeTool =
                    null;

            }

        }


        updateUI();

    }
);


// ======================================================
// RULER
// ======================================================

let btnRulers =
    document.getElementById(
        'btn-rulers'
    );


btnRulers.addEventListener(
    'click',
    () => {

        toolState.ruler =
            !toolState.ruler;


        if (
            toolState.ruler
        ) {

            setActiveTool(
                'ruler'
            );

        } else {

            measurer.list.clear();

            measurer.enabled =
                false;


            if (
                activeTool === 'ruler'
            ) {

                activeTool =
                    null;

            }

        }


        updateUI();

    }
);


// ======================================================
// ANCHOR
// ======================================================

const btnAnchor =
    document.getElementById(
        'btn-anchor'
    );


btnAnchor.addEventListener(
    'click',
    (ev) => {

        if (
            activeTool === 'anchor'
        ) {

            setActiveTool(
                ''
            );

        } else {

            setActiveTool(
                'anchor'
            );

        }


        updateUI();

    }
);


// ======================================================
// ISSUE
// ======================================================

const btnIssue =
    document.getElementById(
        'btn-issue'
    );


btnIssue.addEventListener(
    'click',
    (ev) => {

        if (
            activeTool === 'issue'
        ) {

            setActiveTool(
                ''
            );

        } else {

            setActiveTool(
                'issue'
            );

        }


        updateUI();

    }
);


// ======================================================
// BOTTOM BAR
// ======================================================

const bottomBar =
    document.getElementById(
        'bottomBar'
    );


const toggle =
    document.getElementById(
        'bottomToggle'
    );


toggle.addEventListener(
    'click',
    () => {

        bottomBar.classList.toggle(
            'collapsed'
        );


        bottomBar.classList.toggle(
            'expanded'
        );

    }
);


// ======================================================
// LOAD IFC BUTTONS
// ======================================================

document.getElementsByName(
    'loadIfc'
).forEach(
    (e) => {

        e.addEventListener(
            'click',
            async () => {

                showLoading();


                try {

                    let u =
                        e.dataset.url;


                    let id =
                        e.dataset.name;


                    await ifcLoader(
                        u,
                        id
                    );


                    fragments.core.update();

                } catch (error) {

                    console.error(
                        error
                    );

                }


                hideLoading();

            }
        );

    }
);


// ======================================================
// FIT
// ======================================================

document.getElementById(
    'btn-fit'
).addEventListener(
    'click',
    async () => {

        await world.camera.controls.setLookAt(
            68,
            23,
            -8.5,
            0,
            0,
            0
        );

    }
);


// ======================================================
// SET VIEW
// ======================================================

function setView(
    direction
) {

    const box =
        new THREE.Box3();


    for (
        const [, model]
        of fragments.list
    ) {

        box.expandByObject(
            model.object
        );

    }


    const center =
        box.getCenter(
            new THREE.Vector3()
        );


    const size =
        box.getSize(
            new THREE.Vector3()
        ).length();


    const distance =
        size * 1.5;


    let pos =
        new THREE.Vector3();


    switch (
        direction
    ) {

        case 'top':

            pos.set(
                center.x,
                center.y + distance,
                center.z
            );

            break;


        case 'bottom':

            pos.set(
                center.x,
                center.y - distance,
                center.z
            );

            break;


        case 'front':

            pos.set(
                center.x,
                center.y,
                center.z + distance
            );

            break;


        case 'back':

            pos.set(
                center.x,
                center.y,
                center.z - distance
            );

            break;


        case 'left':

            pos.set(
                center.x - distance,
                center.y,
                center.z
            );

            break;


        case 'right':

            pos.set(
                center.x + distance,
                center.y,
                center.z
            );

            break;


        case 'iso':

        default:

            pos.set(
                center.x + distance,
                center.y + distance,
                center.z + distance
            );

            break;

    }


    world.camera.controls.setLookAt(
        pos.x,
        pos.y,
        pos.z,
        center.x,
        center.y,
        center.z,
        true
    );

}


// ======================================================
// FIT VIEW
// ======================================================

function fitView() {

    const box =
        new THREE.Box3();


    for (
        const [, model]
        of fragments.list
    ) {

        box.expandByObject(
            model.object
        );

    }


    const center =
        box.getCenter(
            new THREE.Vector3()
        );


    const size =
        box.getSize(
            new THREE.Vector3()
        ).length();


    world.camera.controls.fitToBox(
        box,
        true
    );


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


// ======================================================
// VIEW CARDS
// ======================================================

document.querySelectorAll(
    '.view-card'
).forEach(
    card => {

        card.addEventListener(
            'click',
            () => {

                const view =
                    card.dataset.view;


                if (
                    view === 'fit'
                ) {

                    fitView();

                } else {

                    setView(
                        view
                    );

                }


                if (
                    view === 'top'
                    ||
                    view === 'front'
                    ||
                    view === 'left'
                    ||
                    view === 'right'
                    ||
                    view === 'back'
                ) {

                    world.camera.controls.enableRotate =
                        false;

                } else {

                    world.camera.controls.enableRotate =
                        true;

                }

            }
        );

    }
);


// ======================================================
// INIT
// ======================================================

const url =
    container.dataset.url;


initViewer(
    container
);


if (url) {

    loadFromUrl(
        url
    );

}


setTimeout(
    () => {

        splash.classList.add(
            'hidden'
        );

    },
    2000
);
