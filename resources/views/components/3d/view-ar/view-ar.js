// ======================================================
// VISOR IFC EN REALIDAD AUMENTADA (WebXR + ThatOpen)
//
// Incluye:
//  - Hit-test y colocación del modelo
//  - Control de opacidad
//  - Filtros por categorías y por propiedades
//  - Ajuste fino de posición (D-pad)
//  - 🆕 Selección BIM por raycasting + panel de propiedades
// =====================================================


// =====================================================
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
// VARIABLES PRINCIPALES
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
// 🆕 SELECCIÓN BIM (RAYCASTING)
// =====================================================
//
// NO usamos OBF.Highlighter ni OBC.Raycasters porque
// ambos exigen un `world.renderer` completo de ThatOpen,
// y en AR usamos nuestro propio THREE.WebGLRenderer con
// renderer.xr.enabled = true.
//
// En su lugar usamos las APIs nativas del FragmentsModel:
//
//   model.raycast({ camera, mouse, dom })
//   model.highlight(localIds, materialDefinition)
//   model.resetHighlight(localIds)
//
// Esto es más ligero, no depende del World y funciona
// perfectamente dentro de una sesión XR.
// =====================================================

let bimSelectMode = false;

// { modelId, localId }
let selectedBimElement = null;

// Último dato leído, para poder reabrir el panel
let lastBimInfoData = null;

let bimRaycastBusy = false;

// Material de resaltado del elemento seleccionado
const BIM_HIGHLIGHT_MATERIAL = {
    color: new THREE.Color('#f59e0b'),
    opacity: 1,
    transparent: false,
    renderedFaces: 0,
};


// =====================================================
// GUARDA GLOBAL ANTI-PROPAGACIÓN HACIA XR
// =====================================================
//
// El evento 'select' de una sesión immersive-ar en Chrome
// Android NO se genera mediante el flujo normal de eventos
// DOM. Chrome lo sintetiza internamente a partir del toque
// crudo sobre la capa de dom-overlay, de forma independiente
// a que el botón pulsado haya hecho stopPropagation().
//
// Por eso la única forma confiable de evitar que un tap
// sobre la UI dispare una acción 3D es con una bandera de
// estado consultada DIRECTAMENTE dentro de onARSelect().
// =====================================================

let uiPointerActive = false;
let uiPointerReleaseTimer = null;

function markUIPointerActive() {

    uiPointerActive = true;

    if (uiPointerReleaseTimer) {
        clearTimeout(uiPointerReleaseTimer);
        uiPointerReleaseTimer = null;
    }
}

function markUIPointerInactiveSoon() {

    if (uiPointerReleaseTimer) {
        clearTimeout(uiPointerReleaseTimer);
    }

    uiPointerReleaseTimer =
        setTimeout(() => {
            uiPointerActive = false;
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

    const toast =
        document.createElement('div');

    toast.id = `ar-toast-${++toastCounter}`;
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


function openPanel(panelKey) {

    closeAllPanels();

    const panel =
        document.getElementById(
            `ar-panel-${panelKey}`
        );

    if (panel) {
        panel.classList.add('ar-panel-open');
    }

    const btn =
        document.querySelector(
            `.ar-fab[data-panel="${panelKey}"]`
        );

    if (btn) {
        btn.classList.add('active');
    }
}


function setupARPanels() {

    document
        .querySelectorAll('.ar-fab[data-panel]')
        .forEach(btn => {

            btn.addEventListener('click', (e) => {

                e.stopPropagation();

                const key = btn.dataset.panel;

                const targetPanel =
                    document.getElementById(
                        `ar-panel-${key}`
                    );

                if (!targetPanel) {
                    return;
                }

                const isOpen =
                    targetPanel.classList.contains(
                        'ar-panel-open'
                    );

                closeAllPanels();

                if (!isOpen) {
                    openPanel(key);
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

        const count = activePropertyFilters.length;

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

    hitTestEnabled = false;

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

    hitTestSource = null;

    if (arReticle) {
        arReticle.visible = false;
    }

    modelPlaced = true;

    updatePositionStatusUI();

    console.log(
        '🔒 Hit-test desactivado (modelo colocado)'
    );
}


function enableHitTest() {

    // Si estaba en modo selección BIM, lo apagamos:
    // no tiene sentido reubicar y seleccionar a la vez.
    if (bimSelectMode) {
        setBimSelectMode(false);
    }

    hitTestEnabled = true;
    hitTestSource = null;
    hitTestSourceRequested = false;
    surfaceFoundNotified = false;
    modelPlaced = false;

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

        statusEl.classList.remove('searching');

    } else {

        statusEl.textContent =
            '🔍 Buscando superficie...';

        statusEl.classList.add('searching');
    }
}


// =====================================================
// CORRECCIÓN DE POSICIÓN DEL MODELO
// =====================================================

function getCameraRelativeRight() {

    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    const forward = new THREE.Vector3();

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

    if (!arModel || !arModel.visible) {

        showToast(
            '⚠️ Coloca primero el modelo para poder ajustarlo',
            'error'
        );

        return;
    }

    switch (direction) {

        case 'up':
            arModel.position.y += positionStep;
            break;

        case 'down':
            arModel.position.y -= positionStep;
            break;

        case 'left': {
            const right = getCameraRelativeRight();
            arModel.position.addScaledVector(
                right,
                -positionStep
            );
            break;
        }

        case 'right': {
            const right = getCameraRelativeRight();
            arModel.position.addScaledVector(
                right,
                positionStep
            );
            break;
        }

        default:
            return;
    }

    // Mantener la matriz mundial sincronizada:
    // el raycast de fragments depende de ella.
    arModel.updateMatrixWorld(true);

    if (fragments) {
        fragments.core.update(true);
    }
}


function resetModelPosition() {

    if (!arModel || !lastPlacedPosition) {

        showToast(
            '⚠️ No hay una posición de anclaje guardada',
            'error'
        );

        return;
    }

    arModel.position.copy(lastPlacedPosition);

    arModel.updateMatrixWorld(true);

    if (fragments) {
        fragments.core.update(true);
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
                        nudgeModel(btn.dataset.direction);
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

            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                startMoving();
            });

            btn.addEventListener('pointerup', (e) => {
                e.stopPropagation();
                stopMoving();
            });

            btn.addEventListener('pointerleave', stopMoving);
            btn.addEventListener('pointercancel', stopMoving);

            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        });


    const resetPositionBtn =
        document.getElementById('ar-reset-position');

    if (resetPositionBtn) {

        resetPositionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resetModelPosition();
        });
    }


    const relocateBtn =
        document.getElementById('ar-relocate-model');

    if (relocateBtn) {

        relocateBtn.addEventListener('click', (e) => {

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
        });
    }


    document
        .querySelectorAll('.ar-step-btn')
        .forEach(btn => {

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                setPositionStep(Number(btn.dataset.step));
            });
        });
}


// =====================================================
// 🆕 MODO SELECCIÓN BIM
// =====================================================

function setBimSelectMode(enabled) {

    bimSelectMode = enabled;

    const btn =
        document.getElementById('ar-btn-bim-select');

    const indicator =
        document.getElementById('ar-bim-select-indicator');

    const crosshair =
        document.getElementById('ar-crosshair');

    if (btn) {
        btn.classList.toggle('active', enabled);
    }

    if (indicator) {
        indicator.classList.toggle('visible', enabled);
    }

    if (crosshair) {
        crosshair.classList.toggle('visible', enabled);
    }
}


function toggleBimSelectMode() {

    if (!modelLoaded || !arModel || !arModel.visible) {

        showToast(
            '⚠️ Primero coloca el modelo sobre una superficie',
            'error'
        );

        return;
    }

    if (bimSelectMode) {

        setBimSelectMode(false);

        showToast(
            '🔓 Modo selección desactivado',
            'info',
            2000
        );

        return;
    }

    // Si el hit-test estaba activo (modo reubicar),
    // lo bloqueamos para que el tap no mueva el modelo.
    if (hitTestEnabled) {
        disableHitTest();
    }

    setBimSelectMode(true);

    showToast(
        '🎯 Apunta con la mira a un elemento y toca la pantalla',
        'info',
        5000
    );
}


function setCrosshairBusy(busy) {

    const crosshair =
        document.getElementById('ar-crosshair');

    if (crosshair) {
        crosshair.classList.toggle('busy', busy);
    }
}


// =====================================================
// 🆕 RAYCAST SOBRE LOS MODELOS FRAGMENTS
// =====================================================
//
// En una sesión XR no disponemos de coordenadas de toque
// fiables (el evento 'select' no las entrega), por eso
// lanzamos el rayo desde el CENTRO de la pantalla, que es
// justamente donde dibujamos la mira (crosshair).
//
// three.js copia cada frame la pose y la matriz de
// proyección de la cámara XR dentro de nuestra
// PerspectiveCamera, así que `camera` es válida aquí.
// =====================================================

async function raycastFragmentsAtScreenCenter() {

    const dom = renderer.domElement;

    const rect = dom.getBoundingClientRect();

    const mouse = new THREE.Vector2(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
    );

    const results = [];

    for (const [, model] of fragments.list) {

        let result = null;

        try {

            result = await model.raycast({
                camera: camera,
                mouse: mouse,
                dom: dom,
            });

        } catch (error) {

            console.warn(
                '⚠️ Error en raycast del modelo',
                model.modelId,
                error
            );

            continue;
        }

        if (result) {
            result.fragmentsModel = model;
            results.push(result);
        }
    }

    if (!results.length) {
        return null;
    }

    let closest = results[0];

    for (let i = 1; i < results.length; i++) {

        if (results[i].distance < closest.distance) {
            closest = results[i];
        }
    }

    return closest;
}


// =====================================================
// 🆕 RESALTADO DEL ELEMENTO SELECCIONADO
// =====================================================

async function clearBimHighlight() {

    if (!selectedBimElement || !fragments) {
        return;
    }

    const model =
        fragments.list.get(
            selectedBimElement.modelId
        );

    if (!model) {
        return;
    }

    try {

        await model.resetHighlight([
            selectedBimElement.localId
        ]);

        await fragments.core.update(true);

    } catch (error) {

        console.warn(
            '⚠️ No se pudo limpiar el resaltado:',
            error
        );
    }
}


async function applyBimHighlight(model, localId) {

    try {

        await model.highlight(
            [localId],
            BIM_HIGHLIGHT_MATERIAL
        );

        await fragments.core.update(true);

    } catch (error) {

        console.warn(
            '⚠️ No se pudo resaltar el elemento:',
            error
        );
    }
}


async function clearBimSelection(closePanel = true) {

    await clearBimHighlight();

    selectedBimElement = null;
    lastBimInfoData = null;

    if (closePanel) {

        const panel =
            document.getElementById('ar-panel-bim-info');

        if (panel) {
            panel.classList.remove('ar-panel-open');
        }
    }

    resetBimInfoPanel();
}


function resetBimInfoPanel() {

    const body =
        document.getElementById('ar-bim-info-body');

    if (body) {

        body.innerHTML = `
<div class="small text-white-50 text-center py-3">
    Selecciona un elemento para ver sus propiedades
</div>
`;
    }
}


// =====================================================
// 🆕 OBTENER DATOS IFC DEL ELEMENTO
// =====================================================

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
// 🆕 SELECCIONAR ELEMENTO BIM
// =====================================================

async function selectBimElement(model, localId) {

    const data =
        await getElementInfo(model, localId);

    if (!data) {

        showToast(
            '⚠️ No se pudo obtener información del elemento',
            'error'
        );

        return;
    }

    // Quitar resaltado anterior
    await clearBimHighlight();

    // Aplicar nuevo resaltado
    await applyBimHighlight(model, localId);

    selectedBimElement = {
        modelId: model.modelId,
        localId: localId,
    };

    const info = {
        localId:    data._localId?.value,
        guid:       data._guid?.value,
        category:   data._category?.value,
        name:       data.Name?.value,
        objectType: data.ObjectType?.value,
        tag:        data.Tag?.value,
    };

    const propertySets =
        extractPropertySets(data);

    lastBimInfoData = { info, propertySets };

    buildBimInfoUI(lastBimInfoData);

    openPanel('bim-info');
}


// =====================================================
// 🆕 CONSTRUIR UI DEL PANEL DE INFORMACIÓN BIM
// =====================================================

function buildBimInfoUI({ info, propertySets }) {

    const body =
        document.getElementById('ar-bim-info-body');

    if (!body) {
        return;
    }

    body.innerHTML = '';


    // -----------------------------
    // TÍTULO
    // -----------------------------

    const title =
        document.createElement('div');

    title.className = 'ar-bim-info-title';

    title.textContent =
        info.name ||
        info.category ||
        'Elemento BIM';

    body.appendChild(title);


    // -----------------------------
    // INFORMACIÓN BÁSICA
    // -----------------------------

    const basic =
        document.createElement('div');

    const basicFields = [
        ['Categoría', info.category],
        ['Nombre',    info.name],
        ['Tipo',      info.objectType],
        ['GUID',      info.guid],
        ['Tag',       info.tag],
        ['ID',        info.localId],
    ];

    let basicHtml = '';

    for (const [label, value] of basicFields) {

        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            continue;
        }

        basicHtml += `
<div class="ar-bim-info-row">
    <div class="ar-bim-info-label">${escapeHtml(label)}</div>
    <div class="ar-bim-info-value">${escapeHtml(String(value))}</div>
</div>
`;
    }

    basic.innerHTML = basicHtml;

    body.appendChild(basic);


    // -----------------------------
    // PROPERTY SETS
    // -----------------------------

    if (!propertySets.size) {

        const empty =
            document.createElement('div');

        empty.className =
            'small text-white-50 mt-3 text-center';

        empty.textContent =
            'Este elemento no tiene Property Sets';

        body.appendChild(empty);

    } else {

        for (const [setName, properties] of propertySets) {

            const section =
                document.createElement('div');

            section.className = 'ar-bim-info-section';

            const header =
                document.createElement('div');

            header.className =
                'ar-bim-info-section-header';

            header.innerHTML = `
<span class="text-truncate">${escapeHtml(setName)}</span>
<i class="bi bi-chevron-right"></i>
`;

            const sectionBody =
                document.createElement('div');

            sectionBody.className =
                'ar-bim-info-section-body d-none';

            let rowsHtml = '';

            for (const property of properties) {

                rowsHtml += `
<div class="ar-bim-info-row">
    <div class="ar-bim-info-label">${escapeHtml(property.name)}</div>
    <div class="ar-bim-info-value">${escapeHtml(
        property.value !== null && property.value !== undefined
            ? String(property.value)
            : '-'
    )}</div>
</div>
`;
            }

            sectionBody.innerHTML = rowsHtml;

            header.addEventListener('click', (e) => {

                e.stopPropagation();

                const hidden =
                    sectionBody.classList.toggle('d-none');

                const icon = header.querySelector('i');

                icon.className = hidden
                    ? 'bi bi-chevron-right'
                    : 'bi bi-chevron-down';
            });

            section.appendChild(header);
            section.appendChild(sectionBody);

            body.appendChild(section);
        }
    }


    // -----------------------------
    // BOTÓN DESELECCIONAR
    // -----------------------------

    const deselect =
        document.createElement('button');

    deselect.type = 'button';
    deselect.className = 'ar-bim-deselect-btn';

    deselect.innerHTML =
        '<i class="bi bi-x-circle me-2"></i>Quitar selección';

    deselect.addEventListener('click', async (e) => {

        e.stopPropagation();

        await clearBimSelection(true);

        showToast(
            '✖️ Selección eliminada',
            'info',
            2000
        );
    });

    body.appendChild(deselect);

    // Volver arriba al abrir
    body.scrollTop = 0;
}


// =====================================================
// 🆕 CONFIGURAR BOTONES DE SELECCIÓN BIM
// =====================================================

function setupBimSelect() {

    const btn =
        document.getElementById('ar-btn-bim-select');

    if (btn) {

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBimSelectMode();
        });
    }

    const closeInfo =
        document.getElementById('ar-close-bim-info');

    if (closeInfo) {

        closeInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            // Solo cerramos el panel; el resaltado se
            // mantiene para que el usuario siga viendo
            // qué eligió.
            closeAllPanels();
        });
    }
}


// =====================================================
// INICIALIZAR VISOR
// =====================================================

async function initViewer() {

    // =================================================
    // THAT OPEN
    // =================================================

    components = new OBC.Components();

    const worlds = components.get(OBC.Worlds);

    world = worlds.create();

    world.scene = new OBC.SimpleScene(components);

    world.scene.setup();

    world.scene.three.background = null;

    scene = world.scene.three;


    // =================================================
    // WEBGL RENDERER (XR)
    //
    // Importante: NO asignamos este renderer a
    // world.renderer. Los setters de OBC.SimpleWorld
    // esperan una instancia de OBC.SimpleRenderer y
    // fallan con un renderer XR externo.
    //
    // No lo necesitamos: ni Hider, ni FragmentsManager,
    // ni model.raycast/highlight dependen de world.renderer.
    // =================================================

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


    // =================================================
    // CAMERA
    // =================================================

    camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
    );

    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);


    // =================================================
    // COMPONENTS
    // =================================================

    components.init();


    // =================================================
    // HIDER
    // =================================================

    hider = components.get(OBC.Hider);


    // =================================================
    // FRAGMENTS
    // =================================================

    fragments = components.get(OBC.FragmentsManager);

    fragments.init('/engine/worker.mjs');


    // =================================================
    // MATERIALES: POLYGON OFFSET
    //
    // Evita z-fighting entre el elemento resaltado y la
    // geometría original.
    // =================================================

    try {

        fragments.core.models.materials.list.onItemSet.add(
            ({ value: material }) => {

                const isLod =
                    'isLodMaterial' in material &&
                    material.isLodMaterial;

                if (!isLod) {
                    material.polygonOffset = true;
                    material.polygonOffsetUnits = 1;
                    material.polygonOffsetFactor =
                        Math.random();
                }
            }
        );

    } catch (error) {

        console.warn(
            '⚠️ No se pudo configurar polygonOffset:',
            error
        );
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

            model.useCamera(camera);

            scene.add(model.object);

            arModel = model.object;

            arModel.scale.set(1, 1, 1);

            arModel.visible = false;

            loadedModelId = model.modelId;

            modelLoaded = true;
            modelLoading = false;

            console.log(
                '✅ Modelo registrado en escena:',
                loadedModelId
            );
        }
    );


    // =================================================
    // BOTÓN AR
    // =================================================

    const arButton = ARButton.createButton(
        renderer,
        {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: arUI }
        }
    );

    document.body.appendChild(arButton);


    // =================================================
    // SLIDER DE OPACIDAD
    // =================================================

    if (opacitySlider) {

        opacitySlider.addEventListener('input', (e) => {

            e.stopPropagation();

            opacityValue =
                Number(opacitySlider.value) / 100;

            if (opacityText) {
                opacityText.textContent =
                    `${opacitySlider.value}%`;
            }

            setModelOpacity(opacityValue);
        });
    }


    // =================================================
    // SETUP DE UI
    // =================================================

    setupPropertyFilters();
    setupARPanels();
    setupPositionCorrection();
    setupBimSelect();
    setupGlobalUIGuard();

    updateFabBarHeightVar();

    window.addEventListener(
        'resize',
        updateFabBarHeightVar
    );


    // =================================================
    // RESET DE FILTROS
    // =================================================

    const resetFiltersBtn =
        document.getElementById('ar-reset-filters');

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
        new THREE.RingGeometry(0.08, 0.1, 32);

    reticleGeometry.rotateX(-Math.PI / 2);

    const reticleMaterial =
        new THREE.MeshBasicMaterial();

    arReticle = new THREE.Mesh(
        reticleGeometry,
        reticleMaterial
    );

    arReticle.matrixAutoUpdate = false;
    arReticle.visible = false;

    scene.add(arReticle);


    // =================================================
    // CONTROLLER XR
    // =================================================

    arController = renderer.xr.getController(0);

    arController.addEventListener('select', onARSelect);

    scene.add(arController);


    // =================================================
    // INICIO DE AR
    // =================================================

    renderer.xr.addEventListener('sessionstart', () => {

        console.log('AR iniciado');

        isAR = true;

        hitTestSource = null;
        hitTestSourceRequested = false;
        hitTestEnabled = true;
        modelPlaced = false;
        surfaceFoundNotified = false;
        lastPlacedPosition = null;
        uiPointerActive = false;

        setBimSelectMode(false);

        closeAllPanels();

        if (arModel) {
            arModel.visible = false;
        }

        if (opacitySlider) {
            opacitySlider.value =
                Math.round(opacityValue * 100);
        }

        if (opacityText) {
            opacityText.textContent =
                `${Math.round(opacityValue * 100)}%`;
        }

        if (arUI) {
            arUI.style.display = 'block';
        }

        updatePositionStatusUI();

        requestAnimationFrame(updateFabBarHeightVar);

        showToast(
            '🟢 Sesión AR iniciada. Buscando superficie...',
            'info',
            5000
        );
    });


    // =================================================
    // FIN DE AR
    // =================================================

    renderer.xr.addEventListener('sessionend', async () => {

        console.log('AR finalizado');

        isAR = false;

        hitTestSource = null;
        hitTestSourceRequested = false;
        hitTestEnabled = true;
        modelPlaced = false;
        surfaceFoundNotified = false;
        uiPointerActive = false;

        setBimSelectMode(false);

        await clearBimSelection(true);

        closeAllPanels();

        if (arReticle) {
            arReticle.visible = false;
        }

        if (arUI) {
            arUI.style.display = 'none';
        }

        if (arModel) {
            arModel.visible = true;
        }
    });


    // =================================================
    // ANIMATION LOOP
    // =================================================

    renderer.setAnimationLoop((timestamp, frame) => {

        updateAR(frame);

        if (isAR && arModel) {
            fragments.core.update();
        }

        renderer.render(scene, camera);
    });


    // =================================================
    // RESIZE
    // =================================================

    window.addEventListener('resize', onResize);


    // =================================================
    // OCULTAR UI FUERA DE AR
    // =================================================

    if (arUI) {
        arUI.style.display = 'none';
    }
}


// =====================================================
// CONSTRUIR PROPERTIES DEL MODELO
// =====================================================

async function buildModelProperties(model) {

    const items = await model.getItems();

    const ids = Array.from(items.keys());

    const data = await model.getItemsData(
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

        const id = item._localId?.value;

        if (id === undefined) {
            continue;
        }

        const propertySets = extractPropertySets(item);

        for (const [, propertyList] of propertySets) {

            for (const property of propertyList) {

                if (
                    property.value === null ||
                    property.value === undefined ||
                    property.value === ''
                ) {
                    continue;
                }

                const key = property.name;
                const value = String(property.value);

                if (!properties.has(key)) {
                    properties.set(key, new Map());
                }

                const values = properties.get(key);

                if (!values.has(value)) {
                    values.set(value, []);
                }

                values.get(value).push(id);
            }
        }
    }

    return properties;
}


// =====================================================
// CONSTRUIR CATEGORÍAS DEL MODELO
// =====================================================

async function buildModelCategories(model) {

    const items = await model.getItems();

    const ids = Array.from(items.keys());

    const data = await model.getItemsData(
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

        const id = item._localId?.value;
        const category = item._category?.value;

        if (id === undefined || !category) {
            continue;
        }

        if (!categories.has(category)) {
            categories.set(category, []);
        }

        categories.get(category).push(id);
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

        if (!node || typeof node !== 'object') {
            return;
        }

        if (visited.has(node)) {
            return;
        }

        visited.add(node);

        if (node._category?.value === 'IFCPROPERTYSET') {

            const setName =
                node.Name?.value ?? 'Sin nombre';

            if (!propertySets.has(setName)) {
                propertySets.set(setName, []);
            }

            const properties = node.HasProperties ?? [];

            for (const property of properties) {

                const name = property.Name?.value;

                if (!name) {
                    continue;
                }

                propertySets.get(setName).push({
                    name,
                    value:
                        property.NominalValue?.value ?? null,
                    type:
                        property.NominalValue?.type ?? null
                });
            }
        }

        for (const key of Object.keys(node)) {

            const value = node[key];

            if (Array.isArray(value)) {

                for (const child of value) {
                    traverse(child);
                }

            } else if (value && typeof value === 'object') {

                traverse(value);
            }
        }
    }

    traverse(data);

    return propertySets;
}


// =====================================================
// CONSTRUIR UI DE PROPERTIES (FILTROS)
// =====================================================

function buildPropertyUI() {

    const selectKey =
        document.getElementById('ar-property-key');

    const selectValue =
        document.getElementById('ar-property-value');

    if (!selectKey || !selectValue) {

        console.warn(
            '⚠️ No se encontraron los selects de property-key/value'
        );

        return;
    }

    selectKey.innerHTML =
        '<option value="">Seleccionar propiedad</option>';

    selectValue.innerHTML =
        '<option value="">Seleccionar valor</option>';

    selectValue.disabled = true;

    const sortedKeys =
        Array.from(modelProperties.keys())
            .sort((a, b) => a.localeCompare(b));

    for (const key of sortedKeys) {

        const option = document.createElement('option');

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

    const cont =
        document.getElementById('ar-categories-container');

    if (!cont) {

        console.warn(
            '⚠️ No se encontró ar-categories-container'
        );

        return;
    }

    cont.innerHTML = '';

    for (const [groupName, categoryIds] of modelCategories) {

        const group = document.createElement('div');

        group.className = 'ar-category-item';

        group.innerHTML = `
<div class="d-flex align-items-center gap-2 p-2">
    <input type="checkbox" checked
           class="form-check-input ar-category-toggle m-0"
           data-category="${escapeHtml(groupName)}">
    <span class="text-truncate flex-grow-1"
          title="${escapeHtml(groupName)}">${escapeHtml(groupName)}</span>
    <span class="badge bg-secondary">${categoryIds.length}</span>
</div>
`;

        cont.appendChild(group);
    }

    cont.querySelectorAll('.ar-category-toggle')
        .forEach(checkbox => {

            checkbox.addEventListener(
                'change',
                async (e) => {

                    await toggleCategory(
                        e.target.dataset.category,
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
        document.getElementById('ar-property-key');

    if (selectKey) {

        selectKey.addEventListener('change', function () {

            const key = this.value;

            const selectValue =
                document.getElementById('ar-property-value');

            const btnApply =
                document.getElementById('ar-apply-property');

            selectValue.innerHTML =
                '<option value="">Seleccionar valor</option>';

            selectValue.disabled = true;
            btnApply.disabled = true;

            if (!key) {
                return;
            }

            const values = modelProperties.get(key);

            const sortedValues = values
                ? Array.from(values.keys())
                    .sort((a, b) => a.localeCompare(b))
                : [];

            for (const value of sortedValues) {

                const option =
                    document.createElement('option');

                option.value = value;
                option.textContent = value;

                selectValue.appendChild(option);
            }

            selectValue.disabled =
                sortedValues.length === 0;
        });
    }


    const selectValue =
        document.getElementById('ar-property-value');

    if (selectValue) {

        selectValue.addEventListener('change', function () {

            document
                .getElementById('ar-apply-property')
                .disabled = !this.value;
        });
    }


    const btnApply =
        document.getElementById('ar-apply-property');

    if (btnApply) {

        btnApply.addEventListener('click', async (e) => {

            e.stopPropagation();

            const key =
                document.getElementById('ar-property-key').value;

            const value =
                document.getElementById('ar-property-value').value;

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
                activePropertyFilters.push({ key, value });
            }

            clearPropertySelectors();

            renderPropertyFilters();

            await applyAllFilters();
        });
    }


    const btnClear =
        document.getElementById('ar-clear-property');

    if (btnClear) {

        btnClear.addEventListener('click', async (e) => {

            e.stopPropagation();

            activePropertyFilters = [];

            clearPropertySelectors();

            renderPropertyFilters();

            await applyAllFilters();
        });
    }
}


function clearPropertySelectors() {

    const keyEl =
        document.getElementById('ar-property-key');

    const valueEl =
        document.getElementById('ar-property-value');

    const applyEl =
        document.getElementById('ar-apply-property');

    if (keyEl) {
        keyEl.value = '';
    }

    if (valueEl) {
        valueEl.innerHTML =
            '<option value="">Seleccionar valor</option>';
        valueEl.disabled = true;
    }

    if (applyEl) {
        applyEl.disabled = true;
    }
}


// =====================================================
// RENDERIZAR FILTROS ACTIVOS
// =====================================================

function renderPropertyFilters() {

    const cont =
        document.getElementById('ar-property-filters');

    if (!cont) {
        return;
    }

    cont.innerHTML = '';

    if (!activePropertyFilters.length) {

        cont.innerHTML = `
<div class="small text-white-50">Sin filtros activos</div>
`;

        return;
    }

    for (
        let index = 0;
        index < activePropertyFilters.length;
        index++
    ) {

        const filter = activePropertyFilters[index];

        const item = document.createElement('div');

        item.className = 'ar-filter-chip';

        item.innerHTML = `
<div class="d-flex align-items-center justify-content-between gap-1">
    <span class="small text-truncate">
        ${escapeHtml(filter.key)}: ${escapeHtml(filter.value)}
    </span>
    <button type="button"
            class="btn btn-sm p-0 ar-filter-remove"
            data-index="${index}"
            style="line-height: 1;">
        <i class="bi bi-x"></i>
    </button>
</div>
`;

        cont.appendChild(item);
    }

    cont.querySelectorAll('.ar-filter-remove')
        .forEach(button => {

            button.addEventListener('click', async (e) => {

                e.stopPropagation();

                const index =
                    Number(button.dataset.index);

                activePropertyFilters.splice(index, 1);

                renderPropertyFilters();

                await applyAllFilters();
            });
        });
}


// =====================================================
// TOGGLE CATEGORÍA
// =====================================================

async function toggleCategory(category, visible) {

    categoryVisibility.set(category, visible);

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

    clearPropertySelectors();

    renderPropertyFilters();

    await applyAllFilters();
}


// =====================================================
// APLICAR TODOS LOS FILTROS
// =====================================================

async function applyAllFilters() {

    if (!fragments || !loadedModelId || !hider) {
        return;
    }

    const filteredIds = getFilteredModelIds();

    const modelIdMap = {
        [loadedModelId]: filteredIds
    };

    await hider.set(false);

    await hider.set(true, modelIdMap);

    await fragments.core.update(true);

    updateFabBadges();


    // Si el elemento seleccionado quedó oculto,
    // limpiamos la selección para evitar confusión.
    if (
        selectedBimElement &&
        !filteredIds.has(selectedBimElement.localId)
    ) {
        await clearBimSelection(true);
    }
}


// =====================================================
// OBTENER IDS FILTRADOS
// =====================================================

function getFilteredModelIds() {

    let ids = new Set();

    for (const [category, categoryIds] of modelCategories) {

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

        for (const filter of activePropertyFilters) {

            if (!filtersByKey.has(filter.key)) {
                filtersByKey.set(filter.key, []);
            }

            filtersByKey.get(filter.key).push(filter.value);
        }

        for (const [key, values] of filtersByKey) {

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
                [...ids].filter(id => groupIds.has(id))
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

    const div = document.createElement('div');

    div.textContent = value;

    return div.innerHTML;
}


// =====================================================
// CAMBIAR OPACIDAD DEL MODELO
// =====================================================

function setModelOpacity(opacity) {

    const value =
        THREE.MathUtils.clamp(opacity, 0, 1);

    if (!arModel) {
        return;
    }

    arModel.traverse((object) => {

        if (!object.isMesh || !object.material) {
            return;
        }

        const materials =
            Array.isArray(object.material)
                ? object.material
                : [object.material];

        materials.forEach((material) => {

            if (!material.userData.opacityOriginal) {

                material.userData.opacityOriginal = {
                    opacity:     material.opacity,
                    transparent: material.transparent,
                    depthWrite:  material.depthWrite,
                    depthTest:   material.depthTest,
                    side:        material.side,
                    alphaTest:   material.alphaTest,
                    blending:    material.blending
                };
            }

            const original =
                material.userData.opacityOriginal;

            if (value >= 1) {

                material.opacity     = original.opacity;
                material.transparent = original.transparent;

            } else {

                material.opacity     = original.opacity * value;
                material.transparent = true;
            }

            material.depthWrite = original.depthWrite;
            material.depthTest  = original.depthTest;
            material.side       = original.side;
            material.alphaTest  = original.alphaTest;
            material.blending   = original.blending;

            material.needsUpdate = true;
        });
    });

    if (fragments && modelLoaded) {
        fragments.core.update(true);
    }
}


// =====================================================
// SELECT EN AR
// =====================================================

async function onARSelect() {

    if (!isAR) {
        return;
    }


    // -------------------------------------------------
    // GUARDA ANTI-PROPAGACIÓN
    //
    // Si el dedo está (o acaba de estar) sobre algún
    // control de la UI, ignoramos este 'select'.
    // -------------------------------------------------

    if (uiPointerActive) {

        console.log(
            '🚫 Select ignorado: interacción activa con la UI'
        );

        return;
    }


    // =================================================
    // 🆕 MODO SELECCIÓN BIM
    // =================================================

    if (bimSelectMode) {

        if (bimRaycastBusy) {
            return;
        }

        if (!modelLoaded || !arModel || !arModel.visible) {

            showToast(
                '⚠️ El modelo todavía no está colocado',
                'error'
            );

            return;
        }

        bimRaycastBusy = true;
        setCrosshairBusy(true);

        try {

            const result =
                await raycastFragmentsAtScreenCenter();

            if (!result) {

                showToast(
                    '🔍 Nada bajo la mira. Apunta a una superficie del modelo.',
                    'info',
                    2500
                );

            } else {

                console.log(
                    '🎯 Hit BIM → localId:',
                    result.localId,
                    'modelo:',
                    result.fragmentsModel.modelId
                );

                await selectBimElement(
                    result.fragmentsModel,
                    result.localId
                );
            }

        } catch (error) {

            console.error(
                '❌ Error en la selección BIM:',
                error
            );

            showToast(
                '❌ Error al seleccionar el elemento',
                'error'
            );

        } finally {

            bimRaycastBusy = false;
            setCrosshairBusy(false);
        }

        return;
    }


    // =================================================
    // MODO COLOCACIÓN (HIT-TEST)
    // =================================================

    if (!hitTestEnabled) {
        return;
    }

    if (!arReticle || !arReticle.visible) {
        return;
    }

    const position = new THREE.Vector3();

    position.setFromMatrixPosition(arReticle.matrix);


    // -------------------------------------------------
    // MODELO YA CARGADO → SOLO REPOSICIONAR
    // -------------------------------------------------

    if (modelLoaded && arModel) {

        arModel.position.copy(position);

        arModel.visible = true;

        arModel.updateMatrixWorld(true);

        lastPlacedPosition = position.clone();

        console.log(
            '📍 Modelo reposicionado'
        );

        showToast(
            '📍 Modelo reposicionado',
            'success'
        );

        disableHitTest();

        return;
    }


    if (modelLoading) {
        return;
    }

    modelLoading = true;

    const url = container.dataset.url;

    if (!url) {

        console.error('❌ No existe data-url en #viewer');

        modelLoading = false;

        showToast(
            '❌ No se encontró la URL del modelo',
            'error'
        );

        return;
    }


    // -------------------------------------------------
    // CARGAR IFC
    // -------------------------------------------------

    try {

        console.log('📥 Iniciando carga desde:', url);

        showToast(
            '📥 Cargando modelo IFC...',
            'info',
            8000
        );

        const response =
            await fetch(url + '?type=frag');

        if (!response.ok) {

            throw new Error(
                `Error HTTP ${response.status}`
            );
        }

        const buffer = await response.arrayBuffer();

        console.log(
            '📦 Buffer recibido, tamaño:',
            buffer.byteLength
        );

        await fragments.core.load(
            buffer,
            { modelId: 'main' }
        );

        console.log(
            '✅ fragments.core.load resuelto'
        );

        const model = fragments.list.get('main');

        if (!model) {

            throw new Error(
                'Modelo no encontrado en fragments.list'
            );
        }


        console.log('🔍 Construyendo properties...');

        modelProperties =
            await buildModelProperties(model);

        console.log(
            '✅ Properties:',
            modelProperties.size
        );


        console.log('🔍 Construyendo categories...');

        modelCategories =
            await buildModelCategories(model);

        console.log(
            '✅ Categories:',
            modelCategories.size
        );


        buildPropertyUI();
        buildCategoryUI();


        let totalElements = 0;

        for (const categoryIds of modelCategories.values()) {
            totalElements += categoryIds.length;
        }

        showToast(
            `✅ Modelo cargado: ${totalElements} elementos, ${modelCategories.size} categorías`,
            'success',
            5000
        );

        await fragments.core.update(true);


        if (arModel) {

            arModel.position.copy(position);

            arModel.scale.set(1, 1, 1);

            arModel.visible = true;

            arModel.updateMatrixWorld(true);

            lastPlacedPosition = position.clone();

            setModelOpacity(opacityValue);

            console.log(
                '✅ Modelo colocado en AR:',
                loadedModelId
            );

            showToast(
                '📍 Modelo colocado. Usa 🎯 para inspeccionar elementos.',
                'success',
                5000
            );

            disableHitTest();
        }

    } catch (error) {

        console.error('❌ Error cargando IFC:', error);

        modelLoading = false;

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

    const session = renderer.xr.getSession();

    if (!referenceSpace || !session) {
        return;
    }


    if (!hitTestSourceRequested) {

        session
            .requestReferenceSpace('viewer')
            .then((viewerSpace) => {

                return session.requestHitTestSource({
                    space: viewerSpace
                });
            })
            .then((source) => {

                if (!hitTestEnabled) {

                    try {
                        source.cancel();
                    } catch (e) {}

                    return;
                }

                hitTestSource = source;
            })
            .catch((error) => {

                console.error(
                    'Error creando Hit Test:',
                    error
                );
            });

        session.addEventListener('end', () => {

            hitTestSourceRequested = false;
            hitTestSource = null;

            if (arReticle) {
                arReticle.visible = false;
            }
        });

        hitTestSourceRequested = true;
    }


    if (hitTestSource) {

        const hitTestResults =
            frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length) {

            const hit = hitTestResults[0];

            const pose = hit.getPose(referenceSpace);

            if (pose) {

                arReticle.visible = true;

                arReticle.matrix.fromArray(
                    pose.transform.matrix
                );

                if (!surfaceFoundNotified) {

                    surfaceFoundNotified = true;

                    showToast(
                        '🎯 Superficie detectada. Toca la pantalla para colocar el modelo',
                        'success',
                        5000
                    );
                }
            }

        } else {

            arReticle.visible = false;
        }
    }
}


// =====================================================
// RESIZE
// =====================================================

function onResize() {

    if (!container || !camera || !renderer) {
        return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}


// =====================================================
// INICIAR
// =====================================================

initViewer()
    .catch((error) => {

        console.error(
            'No se pudo iniciar el visor:',
            error
        );
    });
