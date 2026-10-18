
const container = document.getElementById('viewer');

if (!container) {
    alert('Error AR: no se encontró el elemento #viewer.');
    throw new Error('No se encontró #viewer');
}

const arUI = document.getElementById('ar-ui-container');
const opacitySlider = document.getElementById('ar-opacity');
const opacityText = document.getElementById('ar-opacity-value');

let components = null;
let world = null;
let fragments = null;
let renderer = null;
let scene = null;
let camera = null;
let arController = null;
let arReticle = null;
let arHider = null;

let hitTestSource = null;
let hitTestSourceRequested = false;
let arModel = null;
let arModelInstance = null;
let arIndexModelId = null;

let modelLoading = false;
let modelLoaded = false;
let isAR = false;
let opacityValue = 1;

let arPropertySets = new Map();
let arActiveFilters = [];
let propertyIndexLoading = false;
let arSession = null;
let errorPanel = null;
let lastErrorMessage = '';


// --------------------------------------------------
// ERRORES VISIBLES EN EL MÓVIL
// --------------------------------------------------

function showARError(message, error = null, useAlert = true) {
    const details = error
        ? (error.message || String(error))
        : '';

    const fullMessage = details
        ? `${message}\nDetalle: ${details}`
        : message;

    console.error('[Visor AR]', fullMessage, error || '');

    if (!errorPanel) {
        errorPanel = document.getElementById('ar-error-panel');

        if (!errorPanel) {
            errorPanel = document.createElement('div');
            errorPanel.id = 'ar-error-panel';
            errorPanel.style.display = 'none';
            document.body.appendChild(errorPanel);
        }
    }

    errorPanel.replaceChildren();

    const title = document.createElement('strong');
    title.textContent = 'Error del visor AR';

    const text = document.createElement('pre');
    text.style.whiteSpace = 'pre-wrap';
    text.style.margin = '8px 0';
    text.textContent = fullMessage;

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Cerrar';
    close.addEventListener('click', () => {
        errorPanel.style.display = 'none';
    });

    errorPanel.append(title, text, close);
    errorPanel.style.display = 'block';

    if (useAlert && fullMessage !== lastErrorMessage) {
        lastErrorMessage = fullMessage;

        // La alerta permite leer el error en el móvil.
        window.alert(fullMessage);
    }
}

function showARMessage(message) {
    console.info('[Visor AR]', message);
}


// Captura errores JavaScript no controlados.
window.addEventListener('error', event => {
    showARError(
        'Se produjo un error de JavaScript.',
        event.error || event.message
    );
});

window.addEventListener('unhandledrejection', event => {
    showARError(
        'Falló una operación asíncrona.',
        event.reason
    );
});


// --------------------------------------------------
// INICIALIZACIÓN
// --------------------------------------------------

async function initViewer() {
    try {
        if (!window.THREE) {
            throw new Error('Three.js no está cargado.');
        }

        if (!window.OBС && !window.OBC) {
            throw new Error('That Open Components (OBC) no está cargado.');
        }

        if (!window.ARButton) {
            throw new Error('ARButton no está cargado.');
        }

        const OBC = window.OBC || window.OBС;

        if (!arUI) {
            throw new Error(
                'No se encontró #ar-ui-container en el HTML.'
            );
        }

        // El root de dom-overlay debe permanecer visible.
        arUI.style.display = 'block';
        arUI.style.pointerEvents = 'none';

        const controls = document.getElementById('ar-controls');
        const filterPanel = document.getElementById('ar-property-filter');

        if (controls) controls.style.display = 'none';
        if (filterPanel) filterPanel.style.display = 'none';

        // Escena.
        components = new OBC.Components();

        const worlds = components.get(OBC.Worlds);
        world = worlds.create();

        world.scene = new OBC.SimpleScene(components);
        world.scene.setup();
        world.scene.three.background = null;

        scene = world.scene.three;

        // Renderer.
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(
            container.clientWidth,
            container.clientHeight
        );

        renderer.xr.enabled = true;
        container.appendChild(renderer.domElement);

        // Cámara usada por Three.js y WebXR.
        camera = new THREE.PerspectiveCamera(
            70,
            container.clientWidth / container.clientHeight,
            0.01,
            1000
        );

        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);

        await components.init();

        // Fragments.
        fragments = components.get(OBC.FragmentsManager);

        try {
            arHider = components.get(OBC.Hider);
        } catch (error) {
            arHider = null;
            console.warn('Hider no disponible:', error);
        }

        await fragments.init('/engine/worker.mjs');

        // Cada modelo cargado se incorpora a la escena.
        fragments.list.onItemSet.add(({ value: model }) => {
            prepareLoadedModel(model).catch(error => {
                showARError(
                    'El modelo se cargó, pero falló su preparación.',
                    error
                );
            });
        });

        // Botón AR.
        const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: arUI }
        });

        document.body.appendChild(arButton);

        // El overlay intercepta controles, no el resto de la escena.
        arUI.addEventListener('beforexrselect', event => {
            if (event.target.closest(
                '#ar-property-filter, #ar-controls'
            )) {
                event.preventDefault();
            }
        });

        // Opacidad.
        if (opacitySlider) {
            opacitySlider.addEventListener('input', () => {
                opacityValue = Number(opacitySlider.value) / 100;

                if (opacityText) {
                    opacityText.textContent =
                        `${opacitySlider.value}%`;
                }

                setModelOpacity(opacityValue);
            });
        }

        // Retícula de hit-test.
        const reticleGeometry = new THREE.RingGeometry(
            0.08, 0.1, 32
        );

        reticleGeometry.rotateX(-Math.PI / 2);

        arReticle = new THREE.Mesh(
            reticleGeometry,
            new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                side: THREE.DoubleSide
            })
        );

        arReticle.matrixAutoUpdate = false;
        arReticle.visible = false;
        scene.add(arReticle);

        // Controlador de selección AR.
        arController = renderer.xr.getController(0);
        arController.addEventListener('select', onARSelect);
        scene.add(arController);

        // La sesión AR ya está iniciada.
        renderer.xr.addEventListener('sessionstart', () => {
            isAR = true;
            hitTestSource = null;
            hitTestSourceRequested = false;
            arSession = renderer.xr.getSession();

            if (arModel) arModel.visible = false;

            if (controls) controls.style.display = 'block';
            if (filterPanel) filterPanel.style.display = 'block';

            if (opacitySlider) {
                opacitySlider.value = String(
                    Math.round(opacityValue * 100)
                );
            }

            if (opacityText) {
                opacityText.textContent =
                    `${Math.round(opacityValue * 100)}%`;
            }

            showARMessage('Sesión AR iniciada.');
        });

        renderer.xr.addEventListener('sessionend', () => {
            isAR = false;
            arSession = null;
            hitTestSource = null;
            hitTestSourceRequested = false;

            if (arReticle) arReticle.visible = false;

            if (controls) controls.style.display = 'none';
            if (filterPanel) filterPanel.style.display = 'none';

            if (arModel) arModel.visible = true;

            showARMessage('Sesión AR finalizada.');
        });

        // Bucle de renderizado.
        renderer.setAnimationLoop((timestamp, frame) => {
            try {
                updateAR(frame);

                if (isAR && arModel && fragments) {
                    fragments.core.update();
                }

                renderer.render(scene, camera);
            } catch (error) {
                renderer.setAnimationLoop(null);

                showARError(
                    'Error en el bucle de renderizado.',
                    error
                );
            }
        });

        window.addEventListener('resize', onResize);

        showARMessage('Visor inicializado. Pulsa el botón AR.');

    } catch (error) {
        showARError(
            'No se pudo inicializar el visor. Comprueba las dependencias, la ruta del worker y el navegador.',
            error
        );

        throw error;
    }
}


// --------------------------------------------------
// PREPARAR MODELO CARGADO
// --------------------------------------------------

async function prepareLoadedModel(model) {
    model.useCamera(camera);

    if (model.object.parent !== scene) {
        scene.add(model.object);
    }

    arModelInstance = model;
    arModel = model.object;

    arModel.scale.set(1, 1, 1);
    arModel.visible = false;

    modelLoaded = true;
    modelLoading = false;
    arIndexModelId = model.modelId;

    fragments.core.update(true);
    setModelOpacity(opacityValue);

    // Los filtros se construyen en segundo plano.
    // Un fallo aquí no debe detener la cámara AR.
    propertyIndexLoading = true;

    try {
        arPropertySets = await buildARPropertyIndex(model);
        buildARPropertyUI();
        initARPropertyFilters();
        renderARActiveFilters();

        showARMessage(
            `Índice BIM preparado: ${arPropertySets.size} Property Sets.`
        );
    } catch (error) {
        console.error('Error preparando los filtros BIM:', error);

        showARError(
            'El modelo está cargado, pero no se pudieron preparar los filtros BIM.',
            error
        );
    } finally {
        propertyIndexLoading = false;
    }
}


// --------------------------------------------------
// ÍNDICE DE PROPERTY SETS
// --------------------------------------------------

async function buildARPropertyIndex(model) {
    const items = await model.getItems();
    const ids = Array.from(items.keys());

    const data = await model.getItemsData(ids, {
        attributesDefault: true,
        relations: {
            IsDefinedBy: {
                attributes: true,
                relations: true
            },
            IsTypedBy: {
                attributes: true,
                relations: true
            }
        }
    });

    const propertySets = new Map();

    for (const item of data) {
        const id = item._localId?.value;

        if (id === undefined || id === null) continue;

        const visited = new Set();

        function traverse(node) {
            if (!node || typeof node !== 'object') return;
            if (visited.has(node)) return;

            visited.add(node);

            if (node._category?.value === 'IFCPROPERTYSET') {
                const setName = node.Name?.value || 'Sin nombre';

                if (!propertySets.has(setName)) {
                    propertySets.set(setName, new Map());
                }

                const properties = propertySets.get(setName);

                for (const property of node.HasProperties || []) {
                    const name = property.Name?.value;
                    const rawValue = property.NominalValue?.value;

                    if (
                        !name ||
                        rawValue === null ||
                        rawValue === undefined ||
                        rawValue === ''
                    ) {
                        continue;
                    }

                    const value = String(rawValue);

                    if (!properties.has(name)) {
                        properties.set(name, new Map());
                    }

                    const values = properties.get(name);

                    if (!values.has(value)) {
                        values.set(value, new Set());
                    }

                    values.get(value).add(id);
                }
            }

            for (const child of Object.values(node)) {
                if (Array.isArray(child)) {
                    child.forEach(traverse);
                } else if (child && typeof child === 'object') {
                    traverse(child);
                }
            }
        }

        traverse(item);
    }

    return propertySets;
}


// --------------------------------------------------
// INTERFAZ DE FILTROS BIM
// --------------------------------------------------

function fillARSelect(select, placeholder, values) {
    if (!select) return;

    select.replaceChildren();

    const option = document.createElement('option');
    option.value = '';
    option.textContent = placeholder;
    select.appendChild(option);

    for (const value of values) {
        const item = document.createElement('option');
        item.value = value;
        item.textContent = value;
        select.appendChild(item);
    }

    select.disabled = values.length === 0;
}

function buildARPropertyUI() {
    const pset = document.getElementById('ar-pset');
    const property = document.getElementById('ar-property');
    const value = document.getElementById('ar-property-value');
    const apply = document.getElementById('ar-apply-filter');

    if (!pset || !property || !value || !apply) {
        console.warn('Faltan controles HTML para los filtros BIM.');
        return;
    }

    fillARSelect(
        pset,
        'Seleccionar conjunto',
        Array.from(arPropertySets.keys()).sort()
    );

    fillARSelect(property, 'Seleccionar propiedad', []);
    fillARSelect(value, 'Seleccionar valor', []);

    apply.disabled = true;
}

function initARPropertyFilters() {
    const pset = document.getElementById('ar-pset');
    const property = document.getElementById('ar-property');
    const value = document.getElementById('ar-property-value');
    const apply = document.getElementById('ar-apply-filter');
    const clear = document.getElementById('ar-clear-filters');

    if (!pset || !property || !value || !apply || !clear) {
        return;
    }

    if (pset.dataset.initialized === 'true') return;
    pset.dataset.initialized = 'true';

    pset.addEventListener('change', () => {
        const properties = arPropertySets.get(pset.value);

        fillARSelect(
            property,
            'Seleccionar propiedad',
            properties ? Array.from(properties.keys()).sort() : []
        );

        fillARSelect(value, 'Seleccionar valor', []);
        apply.disabled = true;
    });

    property.addEventListener('change', () => {
        const properties = arPropertySets.get(pset.value);
        const values = properties?.get(property.value);

        fillARSelect(
            value,
            'Seleccionar valor',
            values ? Array.from(values.keys()).sort() : []
        );

        apply.disabled = true;
    });

    value.addEventListener('change', () => {
        apply.disabled = !value.value;
    });

    apply.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();

        if (!pset.value || !property.value || !value.value) return;

        const filter = {
            pset: pset.value,
            property: property.value,
            value: value.value
        };

        const exists = arActiveFilters.some(item =>
            item.pset === filter.pset &&
            item.property === filter.property &&
            item.value === filter.value
        );

        if (!exists) arActiveFilters.push(filter);

        renderARActiveFilters();

        try {
            await applyARPropertyFilters();
        } catch (error) {
            showARError('No se pudieron aplicar los filtros BIM.', error);
        }
    });

    clear.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();

        arActiveFilters = [];
        renderARActiveFilters();

        try {
            await applyARPropertyFilters();
        } catch (error) {
            showARError('No se pudieron limpiar los filtros BIM.', error);
        }
    });
}

function renderARActiveFilters() {
    const target = document.getElementById('ar-active-filters');
    if (!target) return;

    target.replaceChildren();

    if (!arActiveFilters.length) {
        const empty = document.createElement('div');
        empty.className = 'small';
        empty.textContent = 'Sin filtros activos';
        target.appendChild(empty);
        return;
    }

    arActiveFilters.forEach((filter, index) => {
        const row = document.createElement('div');
        row.className = 'ar-filter-item';

        const text = document.createElement('span');
        text.textContent =
            `${filter.pset} · ${filter.property}: ${filter.value}`;

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = '×';
        button.setAttribute('aria-label', 'Eliminar filtro');

        button.addEventListener('click', async event => {
            event.preventDefault();
            event.stopPropagation();

            arActiveFilters.splice(index, 1);
            renderARActiveFilters();

            try {
                await applyARPropertyFilters();
            } catch (error) {
                showARError('No se pudo quitar el filtro.', error);
            }
        });

        row.append(text, button);
        target.appendChild(row);
    });
}


// --------------------------------------------------
// APLICAR FILTROS AL MODELO
// --------------------------------------------------

async function applyARPropertyFilters() {
    if (!arModelInstance || !fragments || !arIndexModelId) {
        throw new Error('El modelo todavía no está preparado.');
    }

    if (!arHider) {
        throw new Error(
            'OBC.Hider no está disponible en esta versión de la librería.'
        );
    }

    const allItems = await arModelInstance.getItems();
    const allIds = new Set(allItems.keys());

    // Sin filtros: volver a mostrar todos los elementos.
    if (arActiveFilters.length === 0) {
        await arHider.set(true);
        fragments.core.update(true);
        return;
    }

    // Los valores de la misma propiedad se combinan con OR.
    // Las propiedades diferentes se combinan con AND.
    const groups = new Map();

    for (const filter of arActiveFilters) {
        const key = `${filter.pset}|||${filter.property}`;

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(filter);
    }

    let matchingIds = new Set(allIds);

    for (const filters of groups.values()) {
        const groupIds = new Set();

        for (const filter of filters) {
            const ids = arPropertySets
                .get(filter.pset)
                ?.get(filter.property)
                ?.get(filter.value);

            if (ids) {
                for (const id of ids) groupIds.add(id);
            }
        }

        matchingIds = new Set(
            [...matchingIds].filter(id => groupIds.has(id))
        );
    }

    // Ocultar todo y volver a mostrar únicamente las coincidencias.
    await arHider.set(false);

    if (matchingIds.size > 0) {
        await arHider.set(true, {
            [arIndexModelId]: matchingIds
        });
    }

    fragments.core.update(true);

    showARMessage(
        `Filtros aplicados. Elementos coincidentes: ${matchingIds.size}.`
    );
}


// --------------------------------------------------
// OPACIDAD
// --------------------------------------------------

function setModelOpacity(opacity) {
    const value = THREE.MathUtils.clamp(opacity, 0, 1);

    if (!arModel) return;

    arModel.traverse(object => {
        if (!object.isMesh || !object.material) return;

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

        materials.forEach(material => {
            if (!material.userData.opacityOriginal) {
                material.userData.opacityOriginal = {
                    opacity: material.opacity,
                    transparent: material.transparent,
                    depthWrite: material.depthWrite,
                    depthTest: material.depthTest,
                    side: material.side,
                    alphaTest: material.alphaTest,
                    blending: material.blending
                };
            }

            const original = material.userData.opacityOriginal;

            material.opacity = original.opacity * value;
            material.transparent =
                value < 1 ? true : original.transparent;

            material.depthWrite = original.depthWrite;
            material.depthTest = original.depthTest;
            material.side = original.side;
            material.alphaTest = original.alphaTest;
            material.blending = original.blending;
            material.needsUpdate = true;
        });
    });

    if (fragments) fragments.core.update(true);
}


// --------------------------------------------------
// SELECCIÓN Y CARGA DEL MODELO EN AR
// --------------------------------------------------

async function onARSelect() {
    if (!isAR || !arReticle?.visible) return;

    const position = new THREE.Vector3();
    position.setFromMatrixPosition(arReticle.matrix);

    if (modelLoaded && arModel) {
        arModel.position.copy(position);
        arModel.visible = true;
        fragments.core.update(true);
        return;
    }

    if (modelLoading) return;

    modelLoading = true;

    try {
        const url = container.dataset.url;

        if (!url) {
            throw new Error('Falta data-url en #viewer.');
        }

        const response = await fetch(`${url}?type=frag`);

        if (!response.ok) {
            throw new Error(
                `Error HTTP ${response.status} al descargar el modelo.`
            );
        }

        const buffer = await response.arrayBuffer();

        await fragments.core.load(buffer, {
            modelId: 'main'
        });

        // El evento onItemSet prepara arModel.
        if (!arModel) {
            throw new Error(
                'El modelo se descargó, pero no se detectó en FragmentsManager.'
            );
        }

        arModel.position.copy(position);
        arModel.scale.set(1, 1, 1);
        arModel.visible = true;

        setModelOpacity(opacityValue);
        fragments.core.update(true);

    } catch (error) {
        modelLoading = false;

        showARError(
            'No se pudo cargar o colocar el modelo en AR.',
            error
        );
    }
}


// --------------------------------------------------
// HIT-TEST: DETECTAR SUPERFICIES
// --------------------------------------------------

function updateAR(frame) {
    if (!frame) return;

    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!referenceSpace || !session) return;

    if (!hitTestSourceRequested) {
        hitTestSourceRequested = true;

        session.requestReferenceSpace('viewer')
            .then(viewerSpace => {
                return session.requestHitTestSource({
                    space: viewerSpace
                });
            })
            .then(source => {
                hitTestSource = source;
            })
            .catch(error => {
                hitTestSourceRequested = false;

                showARError(
                    'No se pudo iniciar el hit-test. Comprueba los permisos y la compatibilidad AR del navegador.',
                    error
                );
            });

        session.addEventListener('end', () => {
            hitTestSourceRequested = false;
            hitTestSource = null;

            if (arReticle) arReticle.visible = false;
        }, { once: true });
    }

    if (!hitTestSource) return;

    const results = frame.getHitTestResults(hitTestSource);

    if (!results.length) {
        arReticle.visible = false;
        return;
    }

    const pose = results[0].getPose(referenceSpace);

    if (pose) {
        arReticle.visible = true;
        arReticle.matrix.fromArray(pose.transform.matrix);
    }
}


// --------------------------------------------------
// REDIMENSIONAR
// --------------------------------------------------

function onResize() {
    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width <= 0 || height <= 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}


// --------------------------------------------------
// ARRANQUE
// --------------------------------------------------

initViewer().catch(error => {
    // El error ya se mostró en initViewer.
    console.error('Error final al iniciar el visor:', error);
});
