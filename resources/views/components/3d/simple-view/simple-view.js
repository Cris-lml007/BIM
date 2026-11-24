
const gltfLoader = new GLTFLoader();

let renderer, scene, camera, controls;
let currentModel = null;
let components, world, fragments;
let model = null;

const container = document.getElementById('viewer');

function emitModelEvent(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
}

function showViewerLoader(text = 'Procesando modelo...') {
    const loader = document.getElementById('viewer-loader');
    const label = document.getElementById('viewer-progress');

    if (label) label.innerText = text;
    if (loader) loader.style.display = 'flex';
}

function hideViewerLoader() {
    const loader = document.getElementById('viewer-loader');

    if (loader) loader.style.display = 'none';
}

function reportProgress(progress, message) {
    emitModelEvent('bimnova-model-progress', {
        progress,
        message
    });

    showViewerLoader(message);
}

async function initViewer(container) {
    components = new OBC.Components();

    const worlds = components.get(OBC.Worlds);
    world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, container);

    world.renderer.isConfigurable({
        antialias: true,
        preserveDrawingBuffer: true
    });

    renderer = world.renderer.three;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    world.camera = new OBC.SimpleCamera(components);

    components.init();
    world.scene.setup();

    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    pmremGenerator.compileEquirectangularShader();

    new RGBELoader().load(
        'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/venice_sunset_1k.hdr',
        texture => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;

            world.scene.three.environment = envMap;

            texture.dispose();
            pmremGenerator.dispose();
        },
        undefined,
        error => {
            console.warn('No se pudo cargar el HDR:', error);
            pmremGenerator.dispose();
        }
    );

    scene = world.scene.three;
    scene.background = new THREE.Color(0xeeeeee);

    const hemiLight = new THREE.HemisphereLight(
        0xffffff,
        0x444444,
        1
    );

    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);

    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    world.camera.controls.setLookAt(
        10, 10, 10,
        0, 0, 0
    );
}

async function ifcLoader(file) {
    const ifcLoader = components.get(OBC.IfcLoader);

    await ifcLoader.setup({
        autoSetWasm: false,
        wasm: {
            path: 'https://unpkg.com/web-ifc@0.0.75/',
            absolute: true
        }
    });

    const githubUrl =
        'https://thatopen.github.io/engine_fragment/resources/worker.mjs';

    const workerResponse = await fetch(githubUrl);

    if (!workerResponse.ok) {
        throw new Error('No se pudo obtener el worker de Fragments.');
    }

    const workerBlob = await workerResponse.blob();

    const workerUrl = URL.createObjectURL(
        new File([workerBlob], 'worker.mjs', {
            type: 'text/javascript'
        })
    );

    fragments = components.get(OBC.FragmentsManager);

    await fragments.init(workerUrl);

    world.camera.controls.addEventListener('update', () => {
        fragments.core.update();
    });

    fragments.list.onItemSet.add(async ({ value: loadedModel }) => {
        loadedModel.useCamera(world.camera.three);

        world.scene.three.add(loadedModel.object);

        fragments.core.update(true);

        try {
            const items = await loadedModel.getItems();

            if (items.length > 0) {
                const properties = await loadedModel.getProperties(items[0]);

                console.log(
                    'PROPIEDADES DEL PRIMER ITEM:',
                    properties
                );
            }
        } catch (error) {
            console.error('Error obteniendo propiedades:', error);
        }
    });

    fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
        if (!('isLodMaterial' in material && material.isLodMaterial)) {
            material.polygonOffset = true;
            material.polygonOffsetUnits = 1;
            material.polygonOffsetFactor = Math.random();
        }
    });

    reportProgress(5, 'Leyendo archivo IFC...');

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    await ifcLoader.load(uint8, false, file.name, {
        instanceCallback: importer => {
            importer.addAllAttributes();
            importer.addAllRelations();
        },

        processData: {
            progressCallback: progress => {
                const percentage = Math.round(progress * 100);

                reportProgress(
                    percentage,
                    `Procesando IFC... ${percentage}%`
                );
            }
        }
    });

    reportProgress(95, 'Finalizando geometría 3D...');

    // Esperamos a que Fragments termine de procesar el modelo.
    await new Promise((resolve, reject) => {
        let attempts = 0;

        const check = () => {
            const models = Array.from(fragments.list.values());

            if (models.length > 0 && !models[0].isProcessing) {
                resolve();
                return;
            }

            attempts++;

            if (attempts > 1800) {
                reject(new Error('Tiempo de espera agotado al procesar el modelo.'));
                return;
            }

            requestAnimationFrame(check);
        };

        check();
    });

    reportProgress(97, 'Generando archivo FRAG...');

    await generateFragmentsFile();

    reportProgress(98, 'Generando imagen de vista previa...');

    await generateThumbnail();

    reportProgress(100, 'Procesamiento y generación completados.');

    emitModelEvent('bimnova-model-generated');

    hideViewerLoader();

    console.log('IFC procesado, FRAG y thumbnail generados correctamente.');
}

async function generateFragmentsFile() {
    const loadedModels = Array.from(fragments.list.values());
    const loadedModel = loadedModels[0];

    if (!loadedModel) {
        throw new Error('No existe un modelo para generar el FRAG.');
    }

    const fragsBuffer = await loadedModel.getBuffer(false);

    if (!fragsBuffer || fragsBuffer.byteLength === 0) {
        throw new Error('El FRAG generado está vacío.');
    }

    const file = new File(
        [fragsBuffer],
        'model.frag',
        { type: 'application/octet-stream' }
    );

    assignFileToInput('frag', file);

    console.log('FRAG generado correctamente.');
}

function assignFileToInput(inputId, file) {
    const input = document.getElementById(inputId);

    if (!input) {
        throw new Error(`No se encontró el input ${inputId}.`);
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    input.files = dataTransfer.files;

    input.dispatchEvent(new Event('change', {
        bubbles: true
    }));
}

async function generateThumbnail() {
    if (!renderer || !world) {
        throw new Error('El visor todavía no está inicializado.');
    }

    renderer.render(
        world.scene.three,
        world.camera.three
    );

    const blob = await new Promise((resolve, reject) => {
        renderer.domElement.toBlob(result => {
            if (!result) {
                reject(new Error('No se pudo generar el thumbnail.'));
                return;
            }

            resolve(result);
        }, 'image/png');
    });

    if (!blob || blob.size === 0) {
        throw new Error('La imagen de vista previa está vacía.');
    }

    const file = new File(
        [blob],
        'thumbnail.png',
        { type: 'image/png' }
    );

    assignFileToInput('thumbnail', file);

    console.log('Thumbnail generado correctamente.');

    return file;
}

async function loadGLB(file) {
    showViewerLoader('Cargando modelo GLB...');

    const url = URL.createObjectURL(file);

    try {
        const gltf = await new Promise((resolve, reject) => {
            gltfLoader.load(url, resolve, undefined, reject);
        });

        const obj = gltf.scene;

        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());

        obj.position.sub(center);

        const size = box.getSize(new THREE.Vector3()).length();

        world.camera.controls.setLookAt(
            size, size, size,
            0, 0, 0
        );

        currentModel = obj;
        world.scene.three.add(obj);

        await generateThumbnail();

        hideViewerLoader();

        console.log('GLB cargado correctamente.');
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function processSelectedFile(file) {
    emitModelEvent('bimnova-model-start');

    showViewerLoader('Inicializando visor...');

    try {
        if (!container.dataset.loaded) {
            await initViewer(container);
            container.dataset.loaded = 'true';
        }

        const extension = file.name.split('.').pop().toLowerCase();

        if (extension === 'ifc') {
            await ifcLoader(file);
        } else if (extension === 'glb' || extension === 'gltf') {
            await loadGLB(file);

            emitModelEvent('bimnova-model-generated');
        } else {
            throw new Error('Formato de modelo no compatible.');
        }
    } catch (error) {
        console.error('Error procesando el modelo:', error);

        hideViewerLoader();

        emitModelEvent('bimnova-model-error', {
            message: error.message || 'Error procesando el modelo.'
        });

        Swal.fire({
            icon: 'error',
            title: 'Error procesando el modelo',
            text: error.message || 'No se pudo procesar el archivo.'
        });
    }
}

document.addEventListener('change', async event => {
    if (event.target.id !== 'file-input') return;

    const file = event.target.files?.[0];

    if (!file) return;

    await processSelectedFile(file);
});

document.addEventListener('shown.bs.modal', async event => {
    if (event.target.id !== 'modal-3d') return;

    if (container.dataset.loaded) return;

    try {
        await initViewer(container);
        container.dataset.loaded = 'true';
        hideViewerLoader();
    } catch (error) {
        console.error('Error inicializando visor:', error);
    }
});

document.getElementById('btn-generate')?.addEventListener('click', async () => {
    try {
        await generateThumbnail();

        Swal.fire({
            icon: 'success',
            title: 'Imagen generada'
        });
    } catch (error) {
        console.error(error);

        Swal.fire({
            icon: 'error',
            title: 'No se pudo generar la imagen',
            text: error.message
        });
    }
});
