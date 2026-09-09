
// ==========================================
// CONTENEDOR
// ==========================================

const container = document.getElementById('ar');


// ==========================================
// ESCENA
// ==========================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xf0f0f0);


// ==========================================
// CÁMARA
// ==========================================

const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);


// ==========================================
// RENDERER
// ==========================================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.xr.enabled = true;

renderer.setSize(
    container.clientWidth,
    container.clientHeight
);

renderer.setPixelRatio(window.devicePixelRatio);

container.appendChild(renderer.domElement);


// ==========================================
// BOTÓN AR
// ==========================================

document.body.appendChild(
    ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test']
    })
);


// ==========================================
// CUBO
// ==========================================

// 20 cm x 20 cm x 20 cm
const geometry = new THREE.BoxGeometry(
    0.2,
    0.2,
    0.2
);

const material = new THREE.MeshStandardMaterial({
    color: 0x2196f3
});

const cube = new THREE.Mesh(
    geometry,
    material
);

cube.visible = false;

scene.add(cube);


// ==========================================
// LUCES
// ==========================================

const ambientLight = new THREE.AmbientLight(
    0xffffff,
    1
);

scene.add(ambientLight);


const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    2
);

directionalLight.position.set(5, 5, 5);

scene.add(directionalLight);


// ==========================================
// CONTROLADOR XR
// ==========================================

const controller = renderer.xr.getController(0);

controller.addEventListener(
    'select',
    onSelect
);

scene.add(controller);


// ==========================================
// RETÍCULA
// ==========================================

const reticleGeometry = new THREE.RingGeometry(
    0.08,
    0.1,
    32
);

reticleGeometry.rotateX(-Math.PI / 2);


const reticleMaterial = new THREE.MeshBasicMaterial();

const reticle = new THREE.Mesh(
    reticleGeometry,
    reticleMaterial
);

reticle.matrixAutoUpdate = false;

reticle.visible = false;

scene.add(reticle);


// ==========================================
// HIT TEST
// ==========================================

let hitTestSource = null;

let hitTestSourceRequested = false;


// ==========================================
// COLOCAR CUBO
// ==========================================

function onSelect() {

    if (!reticle.visible) {
        return;
    }

    // Obtener posición detectada
    cube.position.setFromMatrixPosition(
        reticle.matrix
    );

    // Mostrar cubo
    cube.visible = true;
}


// ==========================================
// ANIMACIÓN XR
// ==========================================

renderer.setAnimationLoop(
    (timestamp, frame) => {

        if (frame) {

            const referenceSpace =
                renderer.xr.getReferenceSpace();

            const session =
                renderer.xr.getSession();


            // ----------------------------------
            // Solicitar HIT TEST
            // ----------------------------------

            if (!hitTestSourceRequested) {

                session
                    .requestReferenceSpace('viewer')
                    .then((referenceSpace) => {

                        session
                            .requestHitTestSource({
                                space: referenceSpace
                            })
                            .then((source) => {

                                hitTestSource = source;

                            });

                    });


                session.addEventListener(
                    'end',
                    () => {

                        hitTestSourceRequested = false;

                        hitTestSource = null;

                        reticle.visible = false;

                        cube.visible = false;

                    }
                );


                hitTestSourceRequested = true;
            }


            // ----------------------------------
            // RESULTADOS DEL HIT TEST
            // ----------------------------------

            if (hitTestSource) {

                const hitTestResults =
                    frame.getHitTestResults(
                        hitTestSource
                    );


                if (hitTestResults.length) {

                    const hit =
                        hitTestResults[0];


                    const pose =
                        hit.getPose(
                            referenceSpace
                        );


                    reticle.visible = true;


                    reticle.matrix.fromArray(
                        pose.transform.matrix
                    );

                } else {

                    reticle.visible = false;

                }

            }

        }


        // ----------------------------------
        // RENDER
        // ----------------------------------

        renderer.render(
            scene,
            camera
        );

    }
);


// ==========================================
// RESIZE
// ==========================================

window.addEventListener(
    'resize',
    () => {

        camera.aspect =
            container.clientWidth /
            container.clientHeight;

        camera.updateProjectionMatrix();


        renderer.setSize(
            container.clientWidth,
            container.clientHeight
        );

    }
);
