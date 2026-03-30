const gltfLoader = new GLTFLoader();
const rgbeLoader = new RGBELoader();

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
    world.camera.controls.addEventListener("control", () => {
        fragments.update();
    });
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
    generateThumbnail();
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
        setTimeout(() => generateThumbnail(), 100);
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
        loadIFC(file);
    } else if (ext === 'glb' || ext === 'gltf') {
        loadGLB(file);
    }
});


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
