// ======================================================
// CONTENEDOR
// =====================================================

const container =
    document.getElementById('viewer');

if (!container) {
    throw new Error(
        'No se encontró el elemento #viewer'
    );
}


// =====================================================
// UI DOM OVERLAY
// =====================================================

const arUI =
    document.getElementById('ar-ui-container');

const opacitySlider =
    document.getElementById('ar-opacity');

const opacityText =
    document.getElementById('ar-opacity-value');


// =====================================================
// VARIABLES
// =====================================================

let components;
let world;
let fragments;
let hider;

let renderer;
let scene;
let camera;

let arController;
let arReticle;

let hitTestSource = null;
let hitTestSourceRequested = false;
let hitTestEnabled = true;

let arModel = null;

let modelLoading = false;
let modelLoaded = false;
let modelPlaced = false;

let isAR = false;

let opacityValue = 1;

let surfaceFoundNotified = false;


// =====================================================
// BIM SELECT (RAYCASTING)
// =====================================================

let bimSelectMode = false;
let selectedBimElement = null;
let highlighter = null;

// Meshes generados para raycasting preciso
let raycastMeshes = [];


// =====================================================
// GUARDA GLOBAL ANTI-PROPAGACIÓN HACIA XR
// =====================================================

let uiPointerActive = false;
let uiPointerReleaseTimer = null;

// =====================================================
// WRAPPER DEL RENDERER XR PARA THAT OPEN
// =====================================================
//
// OBC.Raycasters / OBF.Highlighter necesitan que
// world.renderer exista y tenga:
//   - .three → el WebGLRenderer
//   - .onResize / .onBeforeUpdate / .onAfterUpdate (eventos)
//   - métodos mínimos (update, dispose, getSize, resize)
//
// Como en AR usamos un WebGLRenderer propio con xr.enabled,
// creamos este wrapper para "presentarlo" como un renderer
// válido para That Open sin perder el control del loop XR.
// =====================================================

function createARRendererWrapper(threeRenderer, container) {

    return {

        three: threeRenderer,

        enabled: true,

        isDisposeable: () => true,
        isUpdateable: () => true,
        isResizeable: () => true,

        onResize: new OBC.Event(),
        onBeforeUpdate: new OBC.Event(),
        onAfterUpdate: new OBC.Event(),
        onDisposed: new OBC.Event(),

        update: () => {},

        dispose: () => {},

        getSize: () => {

            return new THREE.Vector2(
                container.clientWidth,
                container.clientHeight
            );
        },

        resize: (size) => {

            if (!size) {

                threeRenderer.setSize(
                    container.clientWidth,
                    container.clientHeight
                );

                return;
            }

            threeRenderer.setSize(
                size.x,
                size.y
            );
        },

        setSize: (width, height) => {

            threeRenderer.setSize(
                width,
                height
            );
        },
    };
}




function markUIPointerActive() {

    uiPointerActive =
        true;

    if (uiPointerReleaseTimer) {

        clearTimeout(
            uiPointerReleaseTimer
        );

        uiPointerReleaseTimer =
            null;
    }
}

function markUIPointerInactiveSoon() {

    if (uiPointerReleaseTimer) {

        clearTimeout(
            uiPointerReleaseTimer
        );
    }

    uiPointerReleaseTimer =
        setTimeout(() => {

            uiPointerActive =
                false;

        }, 400);
}

function setupGlobalUIGuard() {

    if (!arUI) {
        return;
    }

    arUI.addEventListener(
        'pointerdown',
        markUIPointerActive,
        true
    );

    arUI.addEventListener(
        'pointerup',
        markUIPointerInactiveSoon,
        true
    );

    arUI.addEventListener(
        'pointercancel',
        markUIPointerInactiveSoon,
        true
    );

    arUI.addEventListener(
        'touchend',
        markUIPointerInactiveSoon,
        true
    );
}


// =====================================================
// CORRECCIÓN DE POSICIÓN
// =====================================================

let positionStep = 0.03;
let lastPlacedPosition = null;

// =====================================================
// PROPERTY SETS / FILTROS
// =====================================================

let loadedModelId = null;

let modelProperties = new Map();
let modelCategories = new Map();

let activePropertyFilters = [];
let categoryVisibility = new Map();


// =====================================================
// TOASTS
// =====================================================

let toastCounter = 0;

function showToast(message, type = 'info', duration = 4000) {

    const toastContainer =
        document.getElementById('ar-toast-container');

    if (!toastContainer) {
        return;
    }

    const id =
        `ar-toast-${++toastCounter}`;

    const toast =
        document.createElement('div');

    toast.id = id;
    toast.className = `ar-toast ar-toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('ar-toast-show');
    });

    setTimeout(() => {

        toast.classList.remove('ar-toast-show');

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, duration);
}


// =====================================================
// ALTURA DINÁMICA DEL FAB BAR
// =====================================================

function updateFabBarHeightVar() {

    const fabBar =
        document.getElementById('ar-fab-bar');

    if (!fabBar || !arUI) {
        return;
    }

    const height =
        fabBar.getBoundingClientRect().height;

    if (height > 0) {

        arUI.style.setProperty(
            '--ar-fab-height',
            `${height}px`
        );
    }
}


// =====================================================
// PANELES FLOTANTES (FAB BAR)
// =====================================================

function closeAllPanels() {

    document
        .querySelectorAll('.ar-floating-panel')
        .forEach(panel => {
            panel.classList.remove('ar-panel-open');
        });

    document
        .querySelectorAll('.ar-fab[data-panel]')
        .forEach(btn => {
            btn.classList.remove('active');
        });
}


function setupARPanels() {

    const fabButtons =
        document.querySelectorAll('.ar-fab[data-panel]');

    fabButtons.forEach(btn => {

        btn.addEventListener('click', (e) => {

            e.stopPropagation();

            const targetId =
                `ar-panel-${btn.dataset.panel}`;

            const targetPanel =
                document.getElementById(targetId);

            if (!targetPanel) {
                return;
            }

            const isOpen =
                targetPanel.classList.contains(
                    'ar-panel-open'
                );

            closeAllPanels();

            if (!isOpen) {

                targetPanel.classList.add(
                    'ar-panel-open'
                );

                btn.classList.add('active');
            }
        });
    });

    document
        .querySelectorAll('.ar-panel-close')
        .forEach(btn => {

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeAllPanels();
            });
        });
}


function updateFabBadges() {

    const propsBadge =
        document.getElementById(
            'ar-fab-badge-properties'
        );

    if (propsBadge) {

        const count =
            activePropertyFilters.length;

        propsBadge.textContent = count;

        propsBadge.style.display =
            count > 0 ? 'flex' : 'none';
    }

    const catBadge =
        document.getElementById(
            'ar-fab-badge-categories'
        );

    if (catBadge) {

        let hiddenCount = 0;

        categoryVisibility.forEach(visible => {

            if (!visible) {
                hiddenCount++;
            }
        });

        catBadge.textContent = hiddenCount;

        catBadge.style.display =
            hiddenCount > 0 ? 'flex' : 'none';
    }
}


// =====================================================
// HABILITAR / DESHABILITAR HIT-TEST
// =====================================================

function disableHitTest() {

    hitTestEnabled =
        false;

    if (
        hitTestSource &&
        typeof hitTestSource.cancel === 'function'
    ) {

        try {

            hitTestSource.cancel();

        } catch (error) {

            console.warn(
                '⚠️ No se pudo cancelar hitTestSource:',
                error
            );
        }
    }

    hitTestSource =
        null;

    if (arReticle) {

        arReticle.visible =
            false;
    }

    modelPlaced =
        true;

    updatePositionStatusUI();

    console.log(
        '🔒 Hit-test desactivado (modelo colocado)'
    );
}


function enableHitTest() {

    hitTestEnabled =
        true;

    hitTestSource =
        null;

    hitTestSourceRequested =
        false;

    surfaceFoundNotified =
        false;

    modelPlaced =
        false;

    updatePositionStatusUI();

    showToast(
        '🔍 Buscando nueva superficie. Toca la pantalla para reubicar el modelo',
        'info',
        5000
    );

    console.log(
        '🔓 Hit-test reactivado (modo reubicar)'
    );
}


function updatePositionStatusUI() {

    const statusEl =
        document.getElementById(
            'ar-position-status'
        );

    if (!statusEl) {
        return;
    }

    if (modelPlaced) {

        statusEl.textContent =
            '🔒 Posición bloqueada (hit-test desactivado)';

        statusEl.classList.remove(
            'searching'
        );

    } else {

        statusEl.textContent =
            '🔍 Buscando superficie...';

        statusEl.classList.add(
            'searching'
        );
    }
}


// =====================================================
// CORRECCIÓN DE POSICIÓN DEL MODELO
// =====================================================

function getCameraRelativeRight() {

    const right =
        new THREE.Vector3();

    const up =
        new THREE.Vector3();

    const forward =
        new THREE.Vector3();

    camera.matrixWorld.extractBasis(
        right,
        up,
        forward
    );

    right.y = 0;

    if (right.lengthSq() < 0.0001) {

        right.set(1, 0, 0);

    } else {

        right.normalize();
    }

    return right;
}


function nudgeModel(direction) {

    if (!isAR) {
        return;
    }

    if (
        !arModel ||
        !arModel.visible
    ) {

        showToast(
            '⚠️ Coloca primero el modelo para poder ajustarlo',
            'error'
        );

        return;
    }

    switch (direction) {

        case 'up':

            arModel.position.y +=
                positionStep;

            break;

        case 'down':

            arModel.position.y -=
                positionStep;

            break;

        case 'left': {

            const right =
                getCameraRelativeRight();

            arModel.position.addScaledVector(
                right,
                -positionStep
            );

            break;
        }

        case 'right': {

            const right =
                getCameraRelativeRight();

            arModel.position.addScaledVector(
                right,
                positionStep
            );

            break;
        }

        default:
            return;
    }

    if (fragments) {

        fragments.core.update(
            true
        );
    }
}


function resetModelPosition() {

    if (
        !arModel ||
        !lastPlacedPosition
    ) {

        showToast(
            '⚠️ No hay una posición de anclaje guardada',
            'error'
        );

        return;
    }

    arModel.position.copy(
        lastPlacedPosition
    );

    if (fragments) {

        fragments.core.update(
            true
        );
    }

    showToast(
        '↩️ Posición restablecida al anclaje original',
        'info'
    );
}


function setPositionStep(step) {

    positionStep = step;

    document
        .querySelectorAll('.ar-step-btn')
        .forEach(btn => {

            btn.classList.toggle(
                'active',
                Number(btn.dataset.step) === step
            );
        });
}


function setupPositionCorrection() {

    document
        .querySelectorAll('.ar-dpad-btn[data-direction]')
        .forEach(btn => {

            let holdInterval = null;
            let holdTimeout = null;

            const startMoving = () => {

                nudgeModel(btn.dataset.direction);

                holdTimeout = setTimeout(() => {

                    holdInterval = setInterval(() => {

                        nudgeModel(
                            btn.dataset.direction
                        );

                    }, 140);

                }, 350);
            };

            const stopMoving = () => {

                if (holdTimeout) {
                    clearTimeout(holdTimeout);
                    holdTimeout = null;
                }

                if (holdInterval) {
                    clearInterval(holdInterval);
                    holdInterval = null;
                }
            };

            btn.addEventListener(
                'pointerdown',
                (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startMoving();
                }
            );

            btn.addEventListener(
                'pointerup',
                (e) => {
                    e.stopPropagation();
                    stopMoving();
                }
            );

            btn.addEventListener(
                'pointerleave',
                stopMoving
            );

            btn.addEventListener(
                'pointercancel',
                stopMoving
            );

            btn.addEventListener(
                'contextmenu',
                (e) => e.preventDefault()
            );
        });


    const resetPositionBtn =
        document.getElementById(
            'ar-reset-position'
        );

    if (resetPositionBtn) {

        resetPositionBtn.addEventListener(
            'click',
            (e) => {
                e.stopPropagation();
                resetModelPosition();
            }
        );
    }


    const relocateBtn =
        document.getElementById(
            'ar-relocate-model'
        );

    if (relocateBtn) {

        relocateBtn.addEventListener(
            'click',
            (e) => {

                e.stopPropagation();

                if (!arModel || !modelLoaded) {

                    showToast(
                        '⚠️ Todavía no hay un modelo cargado',
                        'error'
                    );

                    return;
                }

                closeAllPanels();

                enableHitTest();
            }
        );
    }


    document
        .querySelectorAll('.ar-step-btn')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                (e) => {
                    e.stopPropagation();
                    setPositionStep(
                        Number(btn.dataset.step)
                    );
                }
            );
        });
}


// =====================================================
// RAYCASTING SOBRE EL MODELO FRAGMENTS
// =====================================================

async function buildRaycastMeshes() {

    raycastMeshes = [];

    for (const [, model] of fragments.list) {

        const idsWithGeometry =
            await model.getItemsIdsWithGeometry();

        const allMeshesData =
            await model.getItemsGeometry(
                idsWithGeometry
            );

        const geometries = new Map();

        for (const itemId in allMeshesData) {

            const meshData =
                allMeshesData[itemId];

            for (const geomData of meshData) {

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

                if (!geometries.has(representationId)) {

                    const geometry =
                        new THREE.BufferGeometry();

                    geometry.setAttribute(
                        'position',
                        new THREE.Float32BufferAttribute(
                            geomData.positions,
                            3
                        )
                    );

                    geometry.setIndex(
                        Array.from(geomData.indices)
                    );

                    geometries.set(
                        representationId,
                        geometry
                    );
                }

                const geometry =
                    geometries.get(representationId);

                const mesh =
                    new THREE.Mesh(geometry);

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

                raycastMeshes.push(mesh);
            }
        }
    }

    console.log(
        '🔧 Meshes de raycast generados:',
        raycastMeshes.length
    );
}


async function raycastFragments(screenX, screenY) {

    const results = [];

    for (const [, model] of fragments.list) {

        const mouse = new THREE.Vector2(
            screenX,
            screenY
        );

        const result =
            await model.raycast({
                camera: camera,
                mouse: mouse,
                dom: renderer.domElement,
            });

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
}


// =====================================================
// SELECCIÓN BIM
// =====================================================

function toggleBimSelectMode() {

    bimSelectMode = !bimSelectMode;

    const btn =
        document.getElementById(
            'ar-btn-bim-select'
        );

    const indicator =
        document.getElementById(
            'ar-bim-select-indicator'
        );

    const crosshair =
        document.getElementById(
            'ar-crosshair'
        );

    if (btn) {

        btn.classList.toggle(
            'active',
            bimSelectMode
        );
    }

    if (indicator) {

        indicator.classList.toggle(
            'visible',
            bimSelectMode
        );
    }

    if (crosshair) {

        crosshair.classList.toggle(
            'visible',
            bimSelectMode
        );
    }

    if (bimSelectMode) {

        showToast(
            '🎯 Modo selección BIM activado. Toca un elemento del modelo.',
            'info',
            4000
        );

    } else {

        // Al desactivar, limpiar selección
        clearBimSelection();

        showToast(
            '🔓 Modo selección BIM desactivado',
            'info',
            2000
        );
    }
}


async function clearBimSelection() {

    if (highlighter) {

        try {
            await highlighter.clear('select');
        } catch (e) {
            console.warn(
                '⚠️ Error limpiando highlighter:',
                e
            );
        }
    }

    selectedBimElement = null;

    // Cerrar panel de info si está abierto
    const infoPanel =
        document.getElementById(
            'ar-panel-bim-info'
        );

    if (infoPanel) {

        infoPanel.classList.remove(
            'ar-panel-open'
        );
    }
}


async function selectBimElementAR(model, localId) {

    const data =
        await getElementInfo(
            model,
            localId
        );

    if (!data) {

        showToast(
            '⚠️ No se pudo obtener información del elemento',
            'error'
        );

        return;
    }

    // Limpiar selección anterior
    if (highlighter) {

        try {
            await highlighter.clear('select');
        } catch (e) {
            console.warn(
                '⚠️ Error limpiando highlighter:',
                e
            );
        }
    }

    // Highlight del elemento
    const modelIdMap = {};

    modelIdMap[model.modelId] = new Set([
        localId
    ]);

    if (highlighter) {

        try {

            await highlighter.highlightByID(
                'select',
                modelIdMap,
                false
            );

        } catch (e) {

            console.warn(
                '⚠️ Error al hacer highlight:',
                e
            );
        }
    }

    selectedBimElement = {
        model,
        localId
    };

    // Construir la información
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

    // Mostrar panel
    buildBimInfoPanelAR({
        info,
        propertySets
    });

    showToast(
        `✅ Seleccionado: ${info.name || info.category || 'Elemento'}`,
        'success',
        3000
    );
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


// =====================================================
// CONSTRUIR PANEL DE INFORMACIÓN BIM (AR)
// =====================================================

function buildBimInfoPanelAR({ info, propertySets }) {

    const body =
        document.getElementById(
            'ar-bim-info-body'
        );

    if (!body) {
        return;
    }

    body.innerHTML = '';


    // =========================
    // TÍTULO
    // =========================

    const title =
        document.createElement('div');

    title.className =
        'ar-bim-info-title';

    title.textContent =
        info.name || info.category || 'Elemento BIM';

    body.appendChild(title);


    // =========================
    // INFORMACIÓN BÁSICA
    // =========================

    const basic =
        document.createElement('div');

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
<div class="ar-bim-info-row">
    <div class="ar-bim-info-label">
        ${escapeHtml(label)}
    </div>
    <div class="ar-bim-info-value">
        ${escapeHtml(String(value))}
    </div>
</div>
`;
    }

    body.appendChild(basic);


    // =========================
    // PROPERTY SETS
    // =========================

    for (const [setName, properties] of propertySets) {

        const section =
            document.createElement('div');

        section.className =
            'ar-bim-info-section';

        const header =
            document.createElement('div');

        header.className =
            'ar-bim-info-section-header';

        header.innerHTML = `
<span>${escapeHtml(setName)}</span>
<i class="bi bi-chevron-down"></i>
`;

        const sectionBody =
            document.createElement('div');

        sectionBody.className =
            'ar-bim-info-section-body';

        for (const property of properties) {

            sectionBody.innerHTML += `
<div class="ar-bim-info-row">
    <div class="ar-bim-info-label">
        ${escapeHtml(property.name)}
    </div>
    <div class="ar-bim-info-value">
        ${escapeHtml(
            property.value !== null
                ? String(property.value)
                : '-'
        )}
    </div>
</div>
`;
        }

        header.addEventListener('click', (e) => {

            e.stopPropagation();

            const hidden =
                sectionBody.classList.toggle('d-none');

            const icon =
                header.querySelector('i');

            icon.className = hidden
                ? 'bi bi-chevron-right'
                : 'bi bi-chevron-down';
        });

        section.appendChild(header);
        section.appendChild(sectionBody);

        body.appendChild(section);
    }


    // =========================
    // ABRIR PANEL
    // =========================

    closeAllPanels();

    const panel =
        document.getElementById(
            'ar-panel-bim-info'
        );

    if (panel) {

        panel.classList.add(
            'ar-panel-open'
        );
    }
}


// =====================================================
// CONFIGURAR BOTÓN BIM SELECT
// =====================================================

function setupBimSelect() {

    const btnBimSelect =
        document.getElementById(
            'ar-btn-bim-select'
        );

    if (btnBimSelect) {

        btnBimSelect.addEventListener(
            'click',
            (e) => {

                e.stopPropagation();

                if (!modelLoaded) {

                    showToast(
                        '⚠️ Primero carga y coloca el modelo',
                        'error'
                    );

                    return;
                }

                toggleBimSelectMode();
            }
        );
    }


    // Cerrar info BIM también limpia selección
    const closeInfoBtn =
        document.getElementById(
            'ar-close-bim-info'
        );

    if (closeInfoBtn) {

        closeInfoBtn.addEventListener(
            'click',
            async (e) => {

                e.stopPropagation();

                await clearBimSelection();

                closeAllPanels();
            }
        );
    }
}


// =====================================================
// INICIALIZAR VISOR
// =====================================================

async function initViewer() {

    // =================================================
    // THAT OPEN
    // =================================================

    components =
        new OBC.Components();


    const worlds =
        components.get(
            OBC.Worlds
        );


    world =
        worlds.create();


    world.scene =
        new OBC.SimpleScene(
            components
        );


    world.scene.setup();


    world.scene.three.background =
        null;


    scene =
        world.scene.three;


    // =================================================
    // WEBGL RENDERER (XR)
    // =================================================

    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });


    renderer.setPixelRatio(
        window.devicePixelRatio
    );


    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );


    renderer.xr.enabled =
        true;


    container.appendChild(
        renderer.domElement
    );


    // =================================================
    // CAMERA
    // =================================================

    camera =
        new THREE.PerspectiveCamera(
            70,

            container.clientWidth /
            container.clientHeight,

            0.01,
            1000
        );


    camera.position.set(
        10,
        10,
        10
    );


    camera.lookAt(
        0,
        0,
        0
    );


    // =================================================
    // 🆕 WRAPPER DEL RENDERER PARA THAT OPEN
    // =================================================
    //
    // IMPORTANTE: debe asignarse ANTES de components.init()
    // y antes de pedir Raycasters/Highlighter.
    // =================================================

    world.renderer =
        createARRendererWrapper(
            renderer,
            container
        );


    // =================================================
    // 🆕 CAMERA PARA EL WORLD
    // =================================================
    //
    // El Raycasters también lee world.camera.three
    // =================================================

    world.camera = {
        three: camera,
        enabled: true,
        onAspectUpdated: new OBC.Event(),
        onDisposed: new OBC.Event(),
        isDisposeable: () => true,
        isUpdateable: () => true,
        update: () => {},
        dispose: () => {},
    };


    // =================================================
    // COMPONENTS INIT
    // =================================================

    components.init();


    // =================================================
    // HIDER
    // =================================================

    hider =
        components.get(
            OBC.Hider
        );


    // =================================================
    // FRAGMENTS
    // =================================================

    fragments =
        components.get(
            OBC.FragmentsManager
        );


    fragments.init(
        '/engine/worker.mjs'
    );


    // =================================================
    // RAYCASTERS (ahora sí puede acceder al renderer)
    // =================================================

    try {

        components.get(OBC.Raycasters).get(world);

        console.log(
            '✅ Raycasters configurados'
        );

    } catch (e) {

        console.warn(
            '⚠️ No se pudo configurar Raycasters:',
            e
        );
    }


    // =================================================
    // HIGHLIGHTER
    // =================================================

    try {

        highlighter =
            components.get(
                OBF.Highlighter
            );

        highlighter.setup({
            world,

            selectMaterialDefinition: {
                color: new THREE.Color('#f59e0b'),
                opacity: 1,
                transparent: false,
                renderedFaces: 0,
            },
        });

        console.log(
            '✅ Highlighter configurado'
        );

    } catch (e) {

        console.warn(
            '⚠️ No se pudo configurar el Highlighter:',
            e
        );

        highlighter = null;
    }




    // =================================================
    // CUANDO SE CARGA EL MODELO
    // =================================================

    fragments.list.onItemSet.add(
        ({ value: model }) => {

            console.log(
                '🟢 onItemSet disparado, modelId:',
                model.modelId
            );


            model.useCamera(
                camera
            );


            scene.add(
                model.object
            );


            arModel =
                model.object;


            arModel.scale.set(
                1,
                1,
                1
            );


            arModel.visible =
                false;


            loadedModelId =
                model.modelId;


            modelLoaded =
                true;


            modelLoading =
                false;


            console.log(
                '✅ Modelo registrado en escena:',
                loadedModelId
            );
        }
    );


    // =================================================
    // MATERIALS (POLYGON OFFSET)
    // =================================================

    fragments.core.models.materials.list.onItemSet.add(
        ({ value: material }) => {

            if (
                !(
                    'isLodMaterial' in material &&
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


    // =================================================
    // BOTÓN AR
    // =================================================

    const arButton =
        ARButton.createButton(
            renderer,
            {
                requiredFeatures: [
                    'hit-test'
                ],

                optionalFeatures: [
                    'dom-overlay'
                ],

                domOverlay: {
                    root: arUI
                }
            }
        );


    document.body.appendChild(
        arButton
    );


    // =================================================
    // CONFIGURAR SLIDER DE OPACIDAD
    // =================================================

    if (opacitySlider) {

        opacitySlider.addEventListener(
            'input',
            (e) => {

                e.stopPropagation();

                opacityValue =
                    Number(
                        opacitySlider.value
                    ) / 100;


                if (opacityText) {

                    opacityText.textContent =
                        `${opacitySlider.value}%`;
                }


                setModelOpacity(
                    opacityValue
                );
            }
        );
    }


    // =================================================
    // CONFIGURAR FILTROS DE PROPERTIES
    // =================================================

    setupPropertyFilters();


    // =================================================
    // CONFIGURAR PANELES FLOTANTES / FAB BAR
    // =================================================

    setupARPanels();


    // =================================================
    // CONFIGURAR CORRECCIÓN DE POSICIÓN
    // =================================================

    setupPositionCorrection();


    // =================================================
    // CONFIGURAR BIM SELECT
    // =================================================

    setupBimSelect();


    // =================================================
    // GUARDA GLOBAL ANTI-PROPAGACIÓN
    // =================================================

    setupGlobalUIGuard();


    // =================================================
    // MEDIR ALTURA DEL FAB BAR
    // =================================================

    updateFabBarHeightVar();

    window.addEventListener(
        'resize',
        updateFabBarHeightVar
    );


    // =================================================
    // CONFIGURAR RESET DE FILTROS
    // =================================================

    const resetFiltersBtn =
        document.getElementById(
            'ar-reset-filters'
        );

    if (resetFiltersBtn) {

        resetFiltersBtn.addEventListener(
            'click',
            async (e) => {

                e.stopPropagation();

                await resetAllFilters();

                showToast(
                    '🔄 Filtros reiniciados',
                    'info'
                );
            }
        );
    }


    // =================================================
    // RETICLE
    // =================================================

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


    arReticle =
        new THREE.Mesh(
            reticleGeometry,
            reticleMaterial
        );


    arReticle.matrixAutoUpdate =
        false;


    arReticle.visible =
        false;


    scene.add(
        arReticle
    );


    // =================================================
    // CONTROLLER
    // =================================================

    arController =
        renderer.xr.getController(0);


    arController.addEventListener(
        'select',
        onARSelect
    );


    scene.add(
        arController
    );


    // =================================================
    // INICIO DE AR
    // =================================================

    renderer.xr.addEventListener(
        'sessionstart',
        () => {

            console.log(
                'AR iniciado'
            );


            isAR =
                true;


            hitTestSource =
                null;


            hitTestSourceRequested =
                false;


            hitTestEnabled =
                true;

            modelPlaced =
                false;

            updatePositionStatusUI();


            surfaceFoundNotified =
                false;


            lastPlacedPosition =
                null;


            uiPointerActive =
                false;


            // Resetear modo BIM select al iniciar AR
            bimSelectMode = false;
            selectedBimElement = null;

            const bimBtn =
                document.getElementById(
                    'ar-btn-bim-select'
                );

            if (bimBtn) {
                bimBtn.classList.remove('active');
            }

            const indicator =
                document.getElementById(
                    'ar-bim-select-indicator'
                );

            if (indicator) {
                indicator.classList.remove('visible');
            }

            const crosshair =
                document.getElementById(
                    'ar-crosshair'
                );

            if (crosshair) {
                crosshair.classList.remove('visible');
            }


            closeAllPanels();


            if (arModel) {

                arModel.visible =
                    false;
            }


            if (opacitySlider) {

                opacitySlider.value =
                    Math.round(
                        opacityValue * 100
                    );
            }


            if (opacityText) {

                opacityText.textContent =
                    `${Math.round(
                        opacityValue * 100
                    )}%`;
            }


            if (arUI) {

                arUI.style.display =
                    'block';
            }


            requestAnimationFrame(
                updateFabBarHeightVar
            );


            showToast(
                '🟢 Sesión AR iniciada. Buscando superficie...',
                'info',
                5000
            );
        }
    );


    // =================================================
    // FIN DE AR
    // =================================================

    renderer.xr.addEventListener(
        'sessionend',
        async () => {

            console.log(
                'AR finalizado'
            );


            isAR =
                false;


            hitTestSource =
                null;


            hitTestSourceRequested =
                false;


            hitTestEnabled =
                true;


            modelPlaced =
                false;


            surfaceFoundNotified =
                false;


            uiPointerActive =
                false;


            // Resetear BIM select
            bimSelectMode = false;

            await clearBimSelection();

            const bimBtn =
                document.getElementById(
                    'ar-btn-bim-select'
                );

            if (bimBtn) {
                bimBtn.classList.remove('active');
            }

            const indicator =
                document.getElementById(
                    'ar-bim-select-indicator'
                );

            if (indicator) {
                indicator.classList.remove('visible');
            }

            const crosshair =
                document.getElementById(
                    'ar-crosshair'
                );

            if (crosshair) {
                crosshair.classList.remove('visible');
            }


            closeAllPanels();


            if (arReticle) {

                arReticle.visible =
                    false;
            }


            if (arUI) {

                arUI.style.display =
                    'none';
            }


            if (arModel) {

                arModel.visible =
                    true;
            }
        }
    );


    // =================================================
    // ANIMATION LOOP
    // =================================================

    renderer.setAnimationLoop(
        (timestamp, frame) => {

            updateAR(
                frame
            );


            if (
                isAR &&
                arModel
            ) {

                fragments.core.update();
            }


            renderer.render(
                scene,
                camera
            );
        }
    );


    // =================================================
    // RESIZE
    // =================================================

    window.addEventListener(
        'resize',
        onResize
    );


    // =================================================
    // OCULTAR UI FUERA DE AR
    // =================================================

    if (arUI) {

        arUI.style.display =
            'none';
    }
}


// =====================================================
// CONSTRUIR PROPERTIES DEL MODELO
// =====================================================

async function buildModelProperties(model) {

    const items =
        await model.getItems();

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

    return properties;
}


// =====================================================
// CONSTRUIR CATEGORÍAS DEL MODELO
// =====================================================

async function buildModelCategories(model) {

    const items =
        await model.getItems();

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

    return categories;
}


// =====================================================
// EXTRAER PROPERTY SETS
// =====================================================

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


// =====================================================
// CONSTRUIR UI DE PROPERTIES
// =====================================================

function buildPropertyUI() {

    const selectKey =
        document.getElementById(
            'ar-property-key'
        );

    const selectValue =
        document.getElementById(
            'ar-property-value'
        );

    if (!selectKey || !selectValue) {

        console.warn(
            '⚠️ No se encontraron los selects de property-key/value en el DOM'
        );

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

    for (const key of modelProperties.keys()) {
        allKeys.add(key);
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

    console.log(
        '🧩 buildPropertyUI: keys cargadas:',
        sortedKeys.length
    );
}


// =====================================================
// CONSTRUIR UI DE CATEGORÍAS
// =====================================================

function buildCategoryUI() {

    const container =
        document.getElementById(
            'ar-categories-container'
        );

    if (!container) {

        console.warn(
            '⚠️ No se encontró ar-categories-container en el DOM'
        );

        return;
    }

    container.innerHTML = '';

    for (
        const [groupName, categoryIds]
        of modelCategories
    ) {

        const group =
            document.createElement('div');

        group.className =
            'ar-category-item';

        group.innerHTML = `
<div class="d-flex align-items-center gap-2 p-2">

    <input
        type="checkbox"
        checked
        class="form-check-input ar-category-toggle m-0"
        data-category="${escapeHtml(groupName)}"
    >

    <span
        class="text-truncate flex-grow-1"
        title="${escapeHtml(groupName)}"
    >
        ${escapeHtml(groupName)}
    </span>

    <span class="badge bg-secondary">
        ${categoryIds.length}
    </span>

</div>
`;

        container.appendChild(group);
    }

    container
        .querySelectorAll('.ar-category-toggle')
        .forEach(checkbox => {

            checkbox.addEventListener(
                'change',
                async (e) => {

                    const category =
                        e.target.dataset.category;

                    await toggleCategory(
                        category,
                        e.target.checked
                    );
                }
            );
        });

    console.log(
        '🧩 buildCategoryUI: categorías cargadas:',
        modelCategories.size
    );
}


// =====================================================
// CONFIGURAR FILTROS DE PROPERTIES
// =====================================================

function setupPropertyFilters() {

    const selectKey =
        document.getElementById(
            'ar-property-key'
        );

    if (selectKey) {

        selectKey.addEventListener(
            'change',
            function () {

                const key = this.value;

                const selectValue =
                    document.getElementById(
                        'ar-property-value'
                    );

                const btnApply =
                    document.getElementById(
                        'ar-apply-property'
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

                const values =
                    modelProperties.get(key);

                if (values) {
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
            }
        );
    }


    const selectValue =
        document.getElementById(
            'ar-property-value'
        );

    if (selectValue) {

        selectValue.addEventListener(
            'change',
            function () {

                const btnApply =
                    document.getElementById(
                        'ar-apply-property'
                    );

                btnApply.disabled = !this.value;
            }
        );
    }


    const btnApply =
        document.getElementById(
            'ar-apply-property'
        );

    if (btnApply) {

        btnApply.addEventListener(
            'click',
            async (e) => {

                e.stopPropagation();

                const key =
                    document.getElementById(
                        'ar-property-key'
                    ).value;

                const value =
                    document.getElementById(
                        'ar-property-value'
                    ).value;

                if (!key || !value) {
                    return;
                }

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

                document.getElementById(
                    'ar-property-key'
                ).value = '';

                document.getElementById(
                    'ar-property-value'
                ).innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;

                document.getElementById(
                    'ar-property-value'
                ).disabled = true;

                document.getElementById(
                    'ar-apply-property'
                ).disabled = true;

                renderPropertyFilters();

                await applyAllFilters();
            }
        );
    }


    const btnClear =
        document.getElementById(
            'ar-clear-property'
        );

    if (btnClear) {

        btnClear.addEventListener(
            'click',
            async (e) => {

                e.stopPropagation();

                activePropertyFilters = [];

                document.getElementById(
                    'ar-property-key'
                ).value = '';

                document.getElementById(
                    'ar-property-value'
                ).innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;

                document.getElementById(
                    'ar-property-value'
                ).disabled = true;

                document.getElementById(
                    'ar-apply-property'
                ).disabled = true;

                renderPropertyFilters();

                await applyAllFilters();
            }
        );
    }
}


// =====================================================
// RENDERIZAR FILTROS ACTIVOS
// =====================================================

function renderPropertyFilters() {

    const container =
        document.getElementById(
            'ar-property-filters'
        );

    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (!activePropertyFilters.length) {

        container.innerHTML = `
<div class="small text-white-50">
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
            'ar-filter-chip';

        item.innerHTML = `
<div class="d-flex align-items-center justify-content-between gap-1">

    <span class="small text-truncate">
        ${escapeHtml(filter.key)}:
        ${escapeHtml(filter.value)}
    </span>

    <button
        type="button"
        class="btn btn-sm p-0 ar-filter-remove"
        data-index="${index}"
        style="line-height: 1;">
        <i class="bi bi-x"></i>
    </button>

</div>
`;

        container.appendChild(item);
    }

    container
        .querySelectorAll('.ar-filter-remove')
        .forEach(button => {

            button.addEventListener(
                'click',
                async (e) => {

                    e.stopPropagation();

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


// =====================================================
// TOGGLE CATEGORÍA
// =====================================================

async function toggleCategory(category, visible) {

    categoryVisibility.set(
        category,
        visible
    );

    await applyAllFilters();
}


// =====================================================
// RESETEAR TODOS LOS FILTROS
// =====================================================

async function resetAllFilters() {

    categoryVisibility.clear();

    activePropertyFilters = [];

    document
        .querySelectorAll('.ar-category-toggle')
        .forEach(cb => {
            cb.checked = true;
        });

    const keyEl =
        document.getElementById(
            'ar-property-key'
        );

    const valueEl =
        document.getElementById(
            'ar-property-value'
        );

    const applyEl =
        document.getElementById(
            'ar-apply-property'
        );

    if (keyEl) keyEl.value = '';

    if (valueEl) {

        valueEl.innerHTML = `
<option value="">
    Seleccionar valor
</option>
`;
        valueEl.disabled = true;
    }

    if (applyEl) applyEl.disabled = true;

    renderPropertyFilters();

    await applyAllFilters();
}


// =====================================================
// APLICAR TODOS LOS FILTROS
// =====================================================

async function applyAllFilters() {

    if (
        !fragments ||
        !loadedModelId ||
        !hider
    ) {
        return;
    }

    const filteredIds =
        getFilteredModelIds();

    const modelIdMap = {
        [loadedModelId]: filteredIds
    };

    await hider.set(false);

    await hider.set(
        true,
        modelIdMap
    );

    fragments.core.update(true);

    updateFabBadges();
}


// =====================================================
// OBTENER IDS FILTRADOS
// =====================================================

function getFilteredModelIds() {

    let ids = new Set();

    for (
        const [category, categoryIds]
        of modelCategories
    ) {

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


    if (activePropertyFilters.length) {

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

        for (
            const [key, values]
            of filtersByKey
        ) {

            const propertyValues =
                modelProperties.get(key);

            if (!propertyValues) {
                return new Set();
            }

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

            if (!groupIds.size) {
                return new Set();
            }

            ids = new Set(
                [...ids].filter(
                    id => groupIds.has(id)
                )
            );

            if (!ids.size) {
                return ids;
            }
        }
    }

    return ids;
}


// =====================================================
// ESCAPAR HTML
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement('div');

    div.textContent = value;

    return div.innerHTML;
}


// =====================================================
// CAMBIAR OPACIDAD DEL MODELO
// =====================================================

function setModelOpacity(opacity) {

    const value =
        THREE.MathUtils.clamp(
            opacity,
            0,
            1
        );


    if (!arModel) {
        return;
    }


    arModel.traverse(
        (object) => {

            if (
                !object.isMesh ||
                !object.material
            ) {

                return;
            }


            const materials =
                Array.isArray(
                    object.material
                )
                    ? object.material
                    : [object.material];


            materials.forEach(
                (material) => {

                    if (
                        !material.userData.opacityOriginal
                    ) {

                        material.userData.opacityOriginal = {

                            opacity:
                                material.opacity,

                            transparent:
                                material.transparent,

                            depthWrite:
                                material.depthWrite,

                            depthTest:
                                material.depthTest,

                            side:
                                material.side,

                            alphaTest:
                                material.alphaTest,

                            blending:
                                material.blending
                        };
                    }


                    const original =
                        material.userData.opacityOriginal;


                    if (
                        value >= 1
                    ) {

                        material.opacity =
                            original.opacity;

                        material.transparent =
                            original.transparent;

                        material.depthWrite =
                            original.depthWrite;

                        material.depthTest =
                            original.depthTest;

                        material.side =
                            original.side;

                        material.alphaTest =
                            original.alphaTest;

                        material.blending =
                            original.blending;

                    } else {

                        material.opacity =
                            original.opacity *
                            value;

                        material.transparent =
                            true;

                        material.depthWrite =
                            original.depthWrite;

                        material.depthTest =
                            original.depthTest;

                        material.side =
                            original.side;

                        material.alphaTest =
                            original.alphaTest;

                        material.blending =
                            original.blending;
                    }


                    material.needsUpdate =
                        true;
                }
            );
        }
    );


    if (fragments && modelLoaded) {

        fragments.core.update(
            true
        );
    }
}


// =====================================================
// SELECT EN AR
// =====================================================

async function onARSelect() {

    if (!isAR) {
        return;
    }


    // GUARDA PRINCIPAL ANTI-PROPAGACIÓN
    if (uiPointerActive) {

        console.log(
            '🚫 Select ignorado: interacción activa con la UI'
        );

        return;
    }


    // =================================================
    // MODO BIM SELECT ACTIVO
    // =================================================

    if (bimSelectMode && modelLoaded && modelPlaced) {

        console.log(
            '🎯 BIM Select: ejecutando raycast...'
        );

        // Obtener la posición del centro de la pantalla
        // En AR, el toque no da coordenadas fiables del
        // raycaster interno de XR para fragments, así que
        // lanzamos un ray desde el centro de la pantalla
        // (donde está el crosshair).

        const domRect =
            renderer.domElement.getBoundingClientRect();

        const centerX =
            domRect.left + domRect.width / 2;

        const centerY =
            domRect.top + domRect.height / 2;

        try {

            const result =
                await raycastFragments(
                    centerX,
                    centerY
                );

            if (result) {

                console.log(
                    '🎯 Raycast hit, localId:',
                    result.localId
                );

                await selectBimElementAR(
                    result.fragmentsModel,
                    result.localId
                );

            } else {

                showToast(
                    '⚠️ No se detectó ningún elemento. Apunta al modelo con el crosshair.',
                    'info',
                    3000
                );
            }

        } catch (e) {

            console.error(
                '❌ Error en raycast BIM:',
                e
            );

            showToast(
                '❌ Error al intentar seleccionar el elemento',
                'error'
            );
        }

        return;
    }


    // =================================================
    // COMPORTAMIENTO NORMAL (COLOCAR MODELO)
    // =================================================

    if (!hitTestEnabled) {
        return;
    }


    if (
        !arReticle ||
        !arReticle.visible
    ) {

        return;
    }


    const position =
        new THREE.Vector3();


    position.setFromMatrixPosition(
        arReticle.matrix
    );


    // =================================================
    // MODELO YA CARGADO → SOLO REPOSICIONAR
    // =================================================

    if (
        modelLoaded &&
        arModel
    ) {

        arModel.position.copy(
            position
        );


        arModel.visible =
            true;


        lastPlacedPosition =
            position.clone();


        console.log(
            '📍 Modelo colocado (ya estaba cargado)'
        );


        showToast(
            '📍 Modelo reposicionado',
            'success'
        );


        disableHitTest();

        // Construir meshes de raycast después de colocar
        buildRaycastMeshes().catch(e => {
            console.warn(
                '⚠️ Error construyendo meshes de raycast:',
                e
            );
        });

        return;
    }


    if (modelLoading) {
        return;
    }


    modelLoading =
        true;


    const url =
        container.dataset.url;


    if (!url) {

        console.error(
            '❌ No existe data-url en #viewer'
        );


        modelLoading =
            false;


        showToast(
            '❌ No se encontró la URL del modelo',
            'error'
        );


        return;
    }


    // =================================================
    // CARGAR IFC
    // =================================================

    try {

        console.log(
            '📥 Iniciando carga desde:',
            url
        );


        showToast(
            '📥 Cargando modelo IFC...',
            'info',
            8000
        );


        const response =
            await fetch(
                url + '?type=frag'
            );


        if (!response.ok) {

            throw new Error(
                `Error HTTP ${response.status}`
            );
        }


        const buffer =
            await response.arrayBuffer();


        console.log(
            '📦 Buffer recibido, tamaño:',
            buffer.byteLength
        );


        await fragments.core.load(
            buffer,
            {
                modelId: 'main'
            }
        );


        console.log(
            '✅ fragments.core.load resuelto completamente'
        );


        const model =
            fragments.list.get('main');


        if (!model) {

            throw new Error(
                'Modelo no encontrado en fragments.list después de load()'
            );
        }


        console.log(
            '🔍 Construyendo properties...'
        );

        modelProperties =
            await buildModelProperties(model);

        console.log(
            '✅ Properties construidas:',
            modelProperties.size
        );


        console.log(
            '🔍 Construyendo categories...'
        );

        modelCategories =
            await buildModelCategories(model);

        console.log(
            '✅ Categories construidas:',
            modelCategories.size
        );


        buildPropertyUI();
        buildCategoryUI();


        let totalElements = 0;

        for (
            const categoryIds
            of modelCategories.values()
        ) {

            totalElements +=
                categoryIds.length;
        }


        showToast(
            `✅ Modelo cargado: ${totalElements} elementos, ${modelCategories.size} categorías`,
            'success',
            5000
        );


        await fragments.core.update(
            true
        );


        if (arModel) {

            arModel.position.copy(
                position
            );


            arModel.scale.set(
                1,
                1,
                1
            );


            arModel.visible =
                true;


            lastPlacedPosition =
                position.clone();


            setModelOpacity(
                opacityValue
            );


            console.log(
                '✅ Modelo colocado en AR con ID:',
                loadedModelId
            );


            showToast(
                '📍 Modelo colocado sobre la superficie',
                'success'
            );


            disableHitTest();

            // Construir meshes de raycast
            buildRaycastMeshes().catch(e => {
                console.warn(
                    '⚠️ Error construyendo meshes de raycast:',
                    e
                );
            });
        }

    } catch (error) {

        console.error(
            '❌ Error cargando IFC:',
            error
        );


        modelLoading =
            false;


        showToast(
            '❌ Error cargando el modelo IFC',
            'error',
            6000
        );
    }
}


// =====================================================
// HIT TEST
// =====================================================

function updateAR(frame) {

    if (!frame) {
        return;
    }


    if (!hitTestEnabled) {

        if (arReticle) {
            arReticle.visible = false;
        }

        return;
    }


    const referenceSpace =
        renderer.xr.getReferenceSpace();


    const session =
        renderer.xr.getSession();


    if (!referenceSpace ||
        !session) {

        return;
    }


    if (
        !hitTestSourceRequested
    ) {

        session
            .requestReferenceSpace(
                'viewer'
            )
            .then(
                (viewerSpace) => {

                    return session
                        .requestHitTestSource({
                            space: viewerSpace
                        });
                }
            )
            .then(
                (source) => {

                    if (!hitTestEnabled) {

                        try {
                            source.cancel();
                        } catch (e) {}

                        return;
                    }

                    hitTestSource =
                        source;
                }
            )
            .catch(
                (error) => {

                    console.error(
                        'Error creando Hit Test:',
                        error
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


                if (arReticle) {

                    arReticle.visible =
                        false;
                }
            }
        );


        hitTestSourceRequested =
            true;
    }


    if (hitTestSource) {

        const hitTestResults =
            frame.getHitTestResults(
                hitTestSource
            );


        if (
            hitTestResults.length
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


                if (!surfaceFoundNotified) {

                    surfaceFoundNotified =
                        true;


                    showToast(
                        '🎯 Superficie detectada. Toca la pantalla para colocar el modelo',
                        'success',
                        5000
                    );
                }
            }

        } else {

            arReticle.visible =
                false;
        }
    }
}


// =====================================================
// RESIZE
// =====================================================

function onResize() {

    if (
        !container ||
        !camera ||
        !renderer
    ) {

        return;
    }


    const width =
        container.clientWidth;


    const height =
        container.clientHeight;


    camera.aspect =
        width / height;


    camera.updateProjectionMatrix();


    renderer.setSize(
        width,
        height
    );
}


// =====================================================
// INICIAR
// =====================================================

initViewer()
    .catch(
        (error) => {

            console.error(
                'No se pudo iniciar el visor:',
                error
            );
        }
    );
