
// Contenedor
const container = document.getElementById('ar');

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Cámara
const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);

camera.position.z = 3;

// Renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.xr.enabled = true;

renderer.setSize(
    container.clientWidth,
    container.clientHeight
);

renderer.setPixelRatio(window.devicePixelRatio);

container.appendChild(renderer.domElement);

document.body.appendChild(
    ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test']
    })
);

// Cubo
const geometry = new THREE.BoxGeometry(1, 1, 1);

const material = new THREE.MeshStandardMaterial({
    color: 0x2196f3
});

const cube = new THREE.Mesh(geometry, material);

scene.add(cube);

// Luces
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Animación
function animate() {

    requestAnimationFrame(animate);

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);

}
renderer.setAnimationLoop(() => {

    cube.rotation.y += 0.01;

    renderer.render(scene, camera);

});
cube.position.set(0, 0, -2);
// animate();

// Resize
window.addEventListener('resize', () => {

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

});
