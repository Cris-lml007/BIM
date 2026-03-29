const loader = new GLTFLoader();
const rgbeLoader = new RGBELoader();

let renderer, scene, camera, controls;
let currentModel = null;

const materialLayers = {};

function registerMaterial(material, mesh) {
    const name = material.name || "Sin nombre";

    if (!materialLayers[name]) {
        materialLayers[name] = {
            material: material,
            meshes: []
        };
    }

    materialLayers[name].meshes.push(mesh);
}

function buildMaterialUI() {
    const tbody = document.querySelector('#materials-table tbody');
    tbody.innerHTML = '';

    Object.keys(materialLayers).forEach(name => {

        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${name}</td>
            <td>
                <input type="checkbox" checked data-material="${name}">
            </td>
        `;

        tbody.appendChild(row);
    });
}




const loading = document.getElementById('loading');
const container = document.getElementById('viewer');
const modelUrl = container.dataset.url;
loading.style.display = 'flex';

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);

renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

container.appendChild(renderer.domElement);

// luces
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

scene.background = new THREE.Color(0xeeeeee);

// HDRI (clave para materiales PBR)
rgbeLoader.load(
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/venice_sunset_1k.hdr',
    function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
    }
);

camera.position.set(0, 0, 5);

// controles
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const grid = new THREE.GridHelper(20, 20);
scene.add(grid);

const axes = new THREE.AxesHelper(10);
scene.add(axes);

// loop
function animate() {
    requestAnimationFrame(animate);

    controls.update();
    renderer.render(scene, camera);
}

function setView(view) {

    if (!camera || !controls) return;

    switch(view) {
        case 'front':
            camera.position.set(0, 0, 10);
            break;

        case 'top':
            camera.position.set(0, 10, 0);
            break;

        case 'left':
            camera.position.set(10, 0, 0);
            break;

        case 'iso':
            camera.position.set(10, 10, 10);
            break;
    }

    camera.lookAt(0, 0, 0);
    controls.update();
}

function fitModel() {

    if (!currentModel) return;

    const box = new THREE.Box3().setFromObject(currentModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    camera.position.set(center.x, center.y, cameraZ * 1.5);
    camera.lookAt(center);

    controls.target.copy(center);
    controls.update();
}





animate();


console.log("Three.js inicializado correctamente");


loader.load(
    modelUrl,
    function (gltf) {

        const model = gltf.scene;
        currentModel = gltf.scene;
        scene.add(currentModel);

        // centrar modelo
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.sub(center);

        // ajustar cámara
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        camera.position.set(0, 0, cameraZ * 1.5);
        camera.lookAt(0, 0, 0);

        // materiales doble cara
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.side = THREE.DoubleSide;
                console.log(child.name);
                console.log("material: "+child.material.name);
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => registerMaterial(mat, child));
                } else {
                    registerMaterial(child.material, child);
                }
            }
        });
        buildMaterialUI();

        console.log("Modelo cargado correctamente");
        loading.style.display = 'none';

        console.log("Modelo cargado correctamente");

    },
    function (xhr) {
        // progreso
        if (xhr.total) {
            const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
            loading.innerHTML = `
                <div>
                    <div class="spinner-border text-primary"></div>
                    <p class="mt-2">Cargando ${percent}%</p>
                </div>
            `;
        }
    },
    function (error) {
        console.error("Error cargando modelo:", error);
    }
);



function toggleMaterial(name, visible) {
    const layer = materialLayers[name];

    if (!layer) return;

    layer.meshes.forEach(mesh => {
        mesh.visible = visible;
    });
}



document.addEventListener('change', (e) => {
    if (!e.target.dataset.material) return;

    const name = e.target.dataset.material;
    const visible = e.target.checked;

    toggleMaterial(name, visible);
});

document.addEventListener('click', (e) => {

    // 👉 VISTAS
    if (e.target.dataset.view) {
        setView(e.target.dataset.view);
    }

    // 👉 FIT MODEL
    if (e.target.dataset.action === 'fit') {
        fitModel();
    }

});
