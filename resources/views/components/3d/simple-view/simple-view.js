const loader = new GLTFLoader();
const rgbeLoader = new RGBELoader();

let renderer, scene, camera, controls;
let currentModel = null;


function attachToInput(blob) {
    const file = new File([blob], 'thumbnail.png', {
        type: 'image/png'
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const input = document.getElementById('thumbnail');
    input.files = dataTransfer.files;

    // 🔥 IMPORTANTE para Livewire
    input.dispatchEvent(new Event('change'));
}

function generateThumbnail() {
    const dataURL = renderer.domElement.toDataURL('image/png');

    fetch(dataURL)
        .then(res => res.blob())
        .then(blob => {
            attachToInput(blob);
        });
}






function preview(file) {
    const url = URL.createObjectURL(file);

    loader.load(
        url,
        function (gltf) {

            // eliminar modelo anterior
            if (currentModel) {
                scene.remove(currentModel);
            }

            currentModel = gltf.scene;
            scene.add(currentModel);

            // centrar modelo
            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            currentModel.position.sub(center);

            // ajustar cámara correctamente
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

            camera.position.set(0, 0, cameraZ * 1.5);
            camera.lookAt(0, 0, 0);

            // asegurar doble cara (opcional)
            currentModel.traverse((child) => {
                if (child.isMesh) {
                    child.material.side = THREE.DoubleSide;
                }
            });


            setTimeout(() => {
                generateThumbnail();
            }, 300);
            console.log("Modelo cargado correctamente");
        },
        undefined,
        function (error) {
            console.error("Error cargando modelo:", error);
        }
    );
}

// input file
document.addEventListener('change', (e) => {
    if (e.target.id !== 'file-input') return;

    const file = e.target.files[0];
    if (!file) return;

    preview(file);
});

// modal init
document.addEventListener('shown.bs.modal', function (event) {
    const modal = event.target;

    if (modal.id !== 'modal-3d') return;

    const container = document.getElementById('viewer');

    // evitar duplicar canvas
    if (container.querySelector('canvas')) return;

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
    const grid = new THREE.GridHelper(10, 10);
    scene.add(grid);

    const axes = new THREE.AxesHelper(5);
    scene.add(axes);

    // loop
    function animate() {
        requestAnimationFrame(animate);

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    console.log("Three.js inicializado correctamente");
});

document.getElementById('btn-generate').addEventListener('click',()=>{
    generateThumbnail();
});
