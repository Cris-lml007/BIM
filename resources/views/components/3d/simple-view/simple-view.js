const rgbeLoader = new RGBELoader();
const gltfLoader = new GLTFLoader();

let renderer, scene, camera, controls;
let currentModel = null;

const container = document.getElementById('viewer');

let components, world;
let fragments;
let model = null;

async function initViewer(container) {
    components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    world = worlds.create();
    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, container);
    world.renderer.isConfigurable({antialias: true, preserveDrawingBuffer: true})
    renderer = world.renderer.three;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    world.camera = new OBC.SimpleCamera(components);
    components.init();
    world.scene.setup();
    const pmremGenerator = new THREE.PMREMGenerator(world.renderer.three);
    pmremGenerator.compileEquirectangularShader();
    new RGBELoader()
        .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/venice_sunset_1k.hdr', function(texture) {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            world.scene.three.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();
        });
    const scene = world.scene.three;
    scene.background = new THREE.Color(0xeeeeee);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
    fragments = new FRAGS.FragmentsModels();
}


async function ifcLoader(file){

    const ifcLoader = components.get(OBC.IfcLoader);

    await ifcLoader.setup({
        autoSetWasm: false,
        wasm: {
            path: "https://unpkg.com/web-ifc@0.0.75/",
            absolute: true,
        },
    });

    const githubUrl =
        "https://thatopen.github.io/engine_fragment/resources/worker.mjs";

    const workerBlob = await (await fetch(githubUrl)).blob();

    const workerUrl = URL.createObjectURL(
        new File([workerBlob], "worker.mjs", { type: "text/javascript" })
    );

    fragments = components.get(OBC.FragmentsManager);
    fragments.init(workerUrl);

    world.scene.three.clear();
    world.camera.controls.addEventListener("update", () => {
        fragments.core.update();
    });

    fragments.list.onItemSet.add(({ value: model }) => {
        model.useCamera(world.camera.three);
        world.scene.three.add(model.object);
        fragments.core.update(true);
    });

    // 🔧 fix z-fighting
    fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
        if (!("isLodMaterial" in material && material.isLodMaterial)) {
            material.polygonOffset = true;
            material.polygonOffsetUnits = 1;
            material.polygonOffsetFactor = Math.random();
        }
    });

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    await ifcLoader.load(uint8, false, file.name, {
        processData: {
            progressCallback: (progress) => {
                const percent = Math.round(progress * 100);
                showViewerLoader(`Procesando IFC... ${percent}%`);
            },
        },
    });

    showViewerLoader(`Generando Vista...`);
    console.log("IFC cargado desde FILE 🚀");

    setTimeout(() => {
        hideViewerLoader();
        generateThumbnail();
    }, 1000);
    await generateFragmentsFile();
}

async function generateFragmentsFile() {

    const [model] = fragments.list.values();
    if (!model) return;

    const fragsBuffer = await model.getBuffer(false);

    const file = new File([fragsBuffer], "model.frag", {
        type: "application/octet-stream"
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const input = document.getElementById('frag');
    input.files = dataTransfer.files;

    input.dispatchEvent(new Event('change'));

    console.log("FRAG generado y guardado en input 💾");
}

async function loadIFC(file) {

    if (model) {
        model.dispose();
    }

    const buffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(buffer);
    const serializer = new FRAGS.IfcImporter();

    serializer.wasm = {
        absolute: true,
        path: "https://unpkg.com/web-ifc@0.0.75/",
    };

    const bytes = await serializer.process({
        bytes: typedArray,
        raw: true
    });

    model = await fragments.load(bytes, {
        modelId: Date.now().toString(),
        camera: world.camera.three,
        raw: true,
    });

    // world.scene.three.clear();
    world.scene.three.add(model.object);
    await fragments.update(true);
    console.log("IFC cargado correctamente 🚀");
    setTimeout(() => generateThumbnail(), 1000);
}

function attachToInput(blob) {
    const file = new File([blob], 'thumbnail.png', {
        type: 'image/png'
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const input = document.getElementById('thumbnail');
    input.files = dataTransfer.files;

    input.dispatchEvent(new Event('change'));
}

function generateThumbnail() {
    renderer.render(world.scene.three, world.camera.three);
    const dataURL = renderer.domElement.toDataURL('image/png');

    fetch(dataURL)
        .then(res => res.blob())
        .then(blob => {
            attachToInput(blob);
        });
}

async function loadGLB(file) {
    showViewerLoader('cargando modelo');
    world.scene.three.clear();
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
        console.log("GLB cargado 🚀");
        setTimeout(() => {
            hideViewerLoader();
            generateThumbnail();
        }, 1000);
    });
    URL.revokeObjectURL(url);
}

document.addEventListener('change', async (e) => {
    if (e.target.id !== 'file-input') return;
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!container.dataset.loaded) {
        await initViewer(container);
        container.dataset.loaded = true;
    }

    if (ext === 'ifc') {
        ifcLoader(file);
    } else if (ext === 'glb' || ext === 'gltf') {
        loadGLB(file);
    }
});

function showViewerLoader(text = "Procesando modelo...") {
    const loader = document.getElementById('viewer-loader');
    const label = document.getElementById('viewer-progress');

    if (label) label.innerText = text;
    loader.style.display = 'flex';
}

function hideViewerLoader() {
    const loader = document.getElementById('viewer-loader');
    loader.style.display = 'none';
}





document.addEventListener('shown.bs.modal', async (event) => {
    if (event.target.id !== 'modal-3d') return;
    const container = document.getElementById('viewer');
    if (container.dataset.loaded) return;
    await initViewer(container);
    container.dataset.loaded = true;
});

document.getElementById('btn-generate').addEventListener('click',()=>{
    generateThumbnail();
});


document.addEventListener('livewire-upload-progress', event => {
    const progress = event.detail.progress;
    const bar = document.getElementById('upload-progress');

    if (bar) {
        bar.style.width = progress + '%';
    }
});
