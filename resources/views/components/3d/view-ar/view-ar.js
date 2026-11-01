// =====================================================
// VISOR IFC EN REALIDAD AUMENTADA (WebXR + ThatOpen)
//
// Incluye:
//  - Hit-test y colocación del modelo (alineada al anclaje)
//  - Control de opacidad
//  - Filtros por categorías y por propiedades
//  - Ajuste fino de posición (D-pad)
//  - Selección BIM por raycasting + panel de propiedades
//  - 🆕 Incidencias y anclajes: carga, marcadores 3D,
//    creación por raycast (Livewire saveMark) y borrado
// =====================================================

// =====================================================
// CONTENEDOR
// =====================================================

const container = document.getElementById('viewer');

if (!container) {
    throw new Error('No se encontró el elemento #viewer');
}

// =====================================================
// UI DOM OVERLAY
// =====================================================

const arUI = document.getElementById('ar-ui-container');
const opacitySlider = document.getElementById('ar-opacity');
const opacityText = document.getElementById('ar-opacity-value');

// =====================================================
// 🆕 DATOS DEL ANCLAJE Y MARCAS (desde data-* del Blade)
// =====================================================

const anchorPosition = new THREE.Vector3(
    parseFloat(container.dataset.anchorX) || 0,
    parseFloat(container.dataset.anchorY) || 0,
    parseFloat(container.dataset.anchorZ) || 0
);

const hasAnchorPosition = anchorPosition.lengthSq() > 0;

let incidentsData = [];
try { incidentsData = JSON.parse(container.dataset.incidents || '[]'); } catch (e) {}

let anchorsData = [];
try { anchorsData = JSON.parse(container.dataset.anchors || '[]'); } catch (e) {}

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

let bimSelectMode = false;
let selectedBimElement = null;
let lastBimInfoData = null;
let bimRaycastBusy = false;

const BIM_HIGHLIGHT_MATERIAL = {
    color: new THREE.Color('#f59e0b'),
    opacity: 1,
    transparent: false,
    renderedFaces: 0,
};

// =====================================================
// 🆕 MODO CREAR MARCA (INCIDENCIA / ANCLAJE)
// =====================================================

let incidentMode = false;
let incidentRaycastBusy = false;

let pendingIncidentPos = null;     // THREE.Vector3 en espacio local del modelo
let pendingIncidentNormal = null;  // THREE.Vector3 en espacio local del modelo

// Registro de marcadores 3D: { id, type, group }
let markerRegistry = [];

// =====================================================
// GUARDA GLOBAL ANTI-PROPAGACIÓN HACIA XR
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
    if (uiPointerReleaseTimer) clearTimeout(uiPointerReleaseTimer);
    uiPointerReleaseTimer = setTimeout(() => {
        uiPointerActive = false;
    }, 400);
}

function setupGlobalUIGuard() {
    if (!arUI) return;
    arUI.addEventListener('pointerdown', markUIPointerActive, true);
    arUI.addEventListener('pointerup', markUIPointerInactiveSoon, true);
    arUI.addEventListener('pointercancel', markUIPointerInactiveSoon, true);
    arUI.addEventListener('touchend', markUIPointerInactiveSoon, true);
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
    const toastContainer = document.getElementById('ar-toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.id = `ar-toast-${++toastCounter}`;
    toast.className = `ar-toast ar-toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('ar-toast-show'));

    setTimeout(() => {
        toast.classList.remove('ar-toast-show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// =====================================================
// ALTURA DINÁMICA DEL FAB BAR
// =====================================================

function updateFabBarHeightVar() {
    const fabBar = document.getElementById('ar-fab-bar');
    if (!fabBar || !arUI) return;
    const height = fabBar.getBoundingClientRect().height;
    if (height > 0) {
        arUI.style.setProperty('--ar-fab-height', `${height}px`);
    }
}

// =====================================================
// PANELES FLOTANTES (FAB BAR)
// =====================================================

function closeAllPanels() {
    document.querySelectorAll('.ar-floating-panel').forEach(p => p.classList.remove('ar-panel-open'));
    document.querySelectorAll('.ar-fab[data-panel]').forEach(b => b.classList.remove('active'));
}

function openPanel(panelKey) {
    closeAllPanels();
    const panel = document.getElementById(`ar-panel-${panelKey}`);
    if (panel) panel.classList.add('ar-panel-open');
    const btn = document.querySelector(`.ar-fab[data-panel="${panelKey}"]`);
    if (btn) btn.classList.add('active');
}

function setupARPanels() {
    document.querySelectorAll('.ar-fab[data-panel]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const key = btn.dataset.panel;
            const targetPanel = document.getElementById(`ar-panel-${key}`);
            if (!targetPanel) return;
            const isOpen = targetPanel.classList.contains('ar-panel-open');
            closeAllPanels();
            if (!isOpen) {
                if (key === 'incidents') renderIncidentList(); // 🆕
                openPanel(key);
            }
        });
    });

    document.querySelectorAll('.ar-panel-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllPanels();
        });
    });
}

function updateFabBadges() {
    const propsBadge = document.getElementById('ar-fab-badge-properties');
    if (propsBadge) {
        const count = activePropertyFilters.length;
        propsBadge.textContent = count;
        propsBadge.style.display = count > 0 ? 'flex' : 'none';
    }

    const catBadge = document.getElementById('ar-fab-badge-categories');
    if (catBadge) {
        let hiddenCount = 0;
        categoryVisibility.forEach(v => { if (!v) hiddenCount++; });
        catBadge.textContent = hiddenCount;
        catBadge.style.display = hiddenCount > 0 ? 'flex' : 'none';
    }
}

// =====================================================
// HABILITAR / DESHABILITAR HIT-TEST
// =====================================================

function disableHitTest() {
    hitTestEnabled = false;
    if (hitTestSource && typeof hitTestSource.cancel === 'function') {
        try { hitTestSource.cancel(); } catch (e) { console.warn(e); }
    }
    hitTestSource = null;
    if (arReticle) arReticle.visible = false;
    modelPlaced = true;
    updatePositionStatusUI();
    console.log('🔒 Hit-test desactivado (modelo colocado)');
}

function enableHitTest() {
    if (bimSelectMode) setBimSelectMode(false);
    if (incidentMode) setIncidentMode(false); // 🆕
    hitTestEnabled = true;
    hitTestSource = null;
    hitTestSourceRequested = false;
    surfaceFoundNotified = false;
    modelPlaced = false;
    updatePositionStatusUI();
    showToast('🔍 Buscando nueva superficie. Toca la pantalla para reubicar el modelo', 'info', 5000);
    console.log('🔓 Hit-test reactivado (modo reubicar)');
}

function updatePositionStatusUI() {
    const statusEl = document.getElementById('ar-position-status');
    if (!statusEl) return;
    if (modelPlaced) {
        statusEl.textContent = '🔒 Posición bloqueada (hit-test desactivado)';
        statusEl.classList.remove('searching');
    } else {
        statusEl.textContent = '🔍 Buscando superficie...';
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
    camera.matrixWorld.extractBasis(right, up, forward);
    right.y = 0;
    if (right.lengthSq() < 0.0001) right.set(1, 0, 0);
    else right.normalize();
    return right;
}

function nudgeModel(direction) {
    if (!isAR) return;
    if (!arModel || !arModel.visible) {
        showToast('⚠️ Coloca primero el modelo para poder ajustarlo', 'error');
        return;
    }

    switch (direction) {
        case 'up':    arModel.position.y += positionStep; break;
        case 'down':  arModel.position.y -= positionStep; break;
        case 'left': {
            const right = getCameraRelativeRight();
            arModel.position.addScaledVector(right, -positionStep);
            break;
        }
        case 'right': {
            const right = getCameraRelativeRight();
            arModel.position.addScaledVector(right, positionStep);
            break;
        }
        default: return;
    }

    arModel.updateMatrixWorld(true);
    if (fragments) fragments.core.update(true);
}

function resetModelPosition() {
    if (!arModel || !lastPlacedPosition) {
        showToast('⚠️ No hay una posición de anclaje guardada', 'error');
        return;
    }
    arModel.position.copy(lastPlacedPosition);
    arModel.updateMatrixWorld(true);
    if (fragments) fragments.core.update(true);
    showToast('↩️ Posición restablecida al anclaje original', 'info');
}

function setPositionStep(step) {
    positionStep = step;
    document.querySelectorAll('.ar-step-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.step) === step);
    });
}

function setupPositionCorrection() {
    document.querySelectorAll('.ar-dpad-btn[data-direction]').forEach(btn => {
        let holdInterval = null;
        let holdTimeout = null;
        const startMoving = () => {
            nudgeModel(btn.dataset.direction);
            holdTimeout = setTimeout(() => {
                holdInterval = setInterval(() => nudgeModel(btn.dataset.direction), 140);
            }, 350);
        };
        const stopMoving = () => {
            if (holdTimeout) { clearTimeout(holdTimeout); holdTimeout = null; }
            if (holdInterval) { clearInterval(holdInterval); holdInterval = null; }
        };
        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); startMoving(); });
        btn.addEventListener('pointerup', (e) => { e.stopPropagation(); stopMoving(); });
        btn.addEventListener('pointerleave', stopMoving);
        btn.addEventListener('pointercancel', stopMoving);
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    const resetPositionBtn = document.getElementById('ar-reset-position');
    if (resetPositionBtn) {
        resetPositionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resetModelPosition();
        });
    }

    const relocateBtn = document.getElementById('ar-relocate-model');
    if (relocateBtn) {
        relocateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!arModel || !modelLoaded) {
                showToast('⚠️ Todavía no hay un modelo cargado', 'error');
                return;
            }
            closeAllPanels();
            enableHitTest();
        });
    }

    document.querySelectorAll('.ar-step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            setPositionStep(Number(btn.dataset.step));
        });
    });
}

// =====================================================
// MODO SELECCIÓN BIM
// =====================================================

function setBimSelectMode(enabled) {
    bimSelectMode = enabled;
    if (enabled && incidentMode) setIncidentMode(false); // 🆕 mutuamente excluyentes

    const btn = document.getElementById('ar-btn-bim-select');
    const indicator = document.getElementById('ar-bim-select-indicator');
    const crosshair = document.getElementById('ar-crosshair');

    if (btn) btn.classList.toggle('active', enabled);
    if (indicator) indicator.classList.toggle('visible', enabled);
    if (crosshair) crosshair.classList.toggle('visible', enabled);
}

function toggleBimSelectMode() {
    if (!modelLoaded || !arModel || !arModel.visible) {
        showToast('⚠️ Primero coloca el modelo sobre una superficie', 'error');
        return;
    }
    if (bimSelectMode) {
        setBimSelectMode(false);
        showToast('🔓 Modo selección desactivado', 'info', 2000);
        return;
    }
    if (hitTestEnabled) disableHitTest();
    setBimSelectMode(true);
    showToast('🎯 Apunta con la mira a un elemento y toca la pantalla', 'info', 5000);
}

function setCrosshairBusy(busy) {
    const crosshair = document.getElementById('ar-crosshair');
    if (crosshair) crosshair.classList.toggle('busy', busy);
}

// =====================================================
// RAYCAST SOBRE LOS MODELOS FRAGMENTS (centro de pantalla)
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
            result = await model.raycast({ camera, mouse, dom });
        } catch (error) {
            console.warn('⚠️ Error en raycast del modelo', model.modelId, error);
            continue;
        }
        if (result) {
            result.fragmentsModel = model;
            results.push(result);
        }
    }

    if (!results.length) return null;

    let closest = results[0];
    for (let i = 1; i < results.length; i++) {
        if (results[i].distance < closest.distance) closest = results[i];
    }
    return closest;
}

// =====================================================
// RESALTADO BIM
// =====================================================

async function clearBimHighlight() {
    if (!selectedBimElement || !fragments) return;
    const model = fragments.list.get(selectedBimElement.modelId);
    if (!model) return;
    try {
        await model.resetHighlight([selectedBimElement.localId]);
        await fragments.core.update(true);
    } catch (error) {
        console.warn('⚠️ No se pudo limpiar el resaltado:', error);
    }
}

async function applyBimHighlight(model, localId) {
    try {
        await model.highlight([localId], BIM_HIGHLIGHT_MATERIAL);
        await fragments.core.update(true);
    } catch (error) {
        console.warn('⚠️ No se pudo resaltar el elemento:', error);
    }
}

async function clearBimSelection(closePanel = true) {
    await clearBimHighlight();
    selectedBimElement = null;
    lastBimInfoData = null;
    if (closePanel) {
        const panel = document.getElementById('ar-panel-bim-info');
        if (panel) panel.classList.remove('ar-panel-open');
    }
    resetBimInfoPanel();
}

function resetBimInfoPanel() {
    const body = document.getElementById('ar-bim-info-body');
    if (body) {
        body.innerHTML = `
<div class="small text-white-50 text-center py-3">
    Selecciona un elemento para ver sus propiedades
</div>`;
    }
}

// =====================================================
// OBTENER DATOS IFC DEL ELEMENTO
// =====================================================

async function getElementInfo(model, localId) {
    const data = await model.getItemsData([localId], {
        attributesDefault: true,
        relations: {
            IsDefinedBy: { attributes: true, relations: true },
            IsTypedBy:   { attributes: true, relations: true },
        },
    });
    if (!data.length) return null;
    return data[0];
}

// =====================================================
// SELECCIONAR ELEMENTO BIM
// =====================================================

async function selectBimElement(model, localId) {
    const data = await getElementInfo(model, localId);
    if (!data) {
        showToast('⚠️ No se pudo obtener información del elemento', 'error');
        return;
    }

    await clearBimHighlight();
    await applyBimHighlight(model, localId);

    selectedBimElement = { modelId: model.modelId, localId };

    const info = {
        localId:    data._localId?.value,
        guid:       data._guid?.value,
        category:   data._category?.value,
        name:       data.Name?.value,
        objectType: data.ObjectType?.value,
        tag:        data.Tag?.value,
    };

    const propertySets = extractPropertySets(data);
    lastBimInfoData = { info, propertySets };
    buildBimInfoUI(lastBimInfoData);
    openPanel('bim-info');
}

// =====================================================
// UI DEL PANEL BIM
// =====================================================

function buildBimInfoUI({ info, propertySets }) {
    const body = document.getElementById('ar-bim-info-body');
    if (!body) return;
    body.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'ar-bim-info-title';
    title.textContent = info.name || info.category || 'Elemento BIM';
    body.appendChild(title);

    const basic = document.createElement('div');
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
        if (value === null || value === undefined || value === '') continue;
        basicHtml += `
<div class="ar-bim-info-row">
    <div class="ar-bim-info-label">${escapeHtml(label)}</div>
    <div class="ar-bim-info-value">${escapeHtml(String(value))}</div>
</div>`;
    }
    basic.innerHTML = basicHtml;
    body.appendChild(basic);

    if (!propertySets.size) {
        const empty = document.createElement('div');
        empty.className = 'small text-white-50 mt-3 text-center';
        empty.textContent = 'Este elemento no tiene Property Sets';
        body.appendChild(empty);
    } else {
        for (const [setName, properties] of propertySets) {
            const section = document.createElement('div');
            section.className = 'ar-bim-info-section';
            const header = document.createElement('div');
            header.className = 'ar-bim-info-section-header';
            header.innerHTML = `
<span class="text-truncate">${escapeHtml(setName)}</span>
<i class="bi bi-chevron-right"></i>`;
            const sectionBody = document.createElement('div');
            sectionBody.className = 'ar-bim-info-section-body d-none';
            let rowsHtml = '';
            for (const property of properties) {
                rowsHtml += `
<div class="ar-bim-info-row">
    <div class="ar-bim-info-label">${escapeHtml(property.name)}</div>
    <div class="ar-bim-info-value">${escapeHtml(
        property.value !== null && property.value !== undefined ? String(property.value) : '-'
    )}</div>
</div>`;
            }
            sectionBody.innerHTML = rowsHtml;
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const hidden = sectionBody.classList.toggle('d-none');
                const icon = header.querySelector('i');
                icon.className = hidden ? 'bi bi-chevron-right' : 'bi bi-chevron-down';
            });
            section.appendChild(header);
            section.appendChild(sectionBody);
            body.appendChild(section);
        }
    }

    const deselect = document.createElement('button');
    deselect.type = 'button';
    deselect.className = 'ar-bim-deselect-btn';
    deselect.innerHTML = '<i class="bi bi-x-circle me-2"></i>Quitar selección';
    deselect.addEventListener('click', async (e) => {
        e.stopPropagation();
        await clearBimSelection(true);
        showToast('✖️ Selección eliminada', 'info', 2000);
    });
    body.appendChild(deselect);

    body.scrollTop = 0;
}

function setupBimSelect() {
    const btn = document.getElementById('ar-btn-bim-select');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBimSelectMode();
        });
    }
    const closeInfo = document.getElementById('ar-close-bim-info');
    if (closeInfo) {
        closeInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllPanels();
        });
    }
}

// =====================================================
// 🆕 SISTEMA DE INCIDENCIAS / ANCLAJES (MARKS)
// =====================================================

// ---- Livewire helper ----
function getLivewireComponent() {
    try {
        if (!window.Livewire) return null;
        const el = document.querySelector('[wire\\:id]');
        if (el) return Livewire.find(el.getAttribute('wire:id'));
        return Livewire.first();
    } catch (e) {
        return null;
    }
}

async function wireSaveMark(title, model, type, x, y, z, nx, ny, nz) {
    const comp = getLivewireComponent();
    if (!comp) throw new Error('Livewire no disponible');
    // Livewire v3: métodos públicos accesibles directo o vía $wire
    if (typeof comp.saveMark === 'function') {
        return await comp.saveMark(title, model, type, x, y, z, nx, ny, nz);
    }
    return await comp.$wire.saveMark(title, model, type, x, y, z, nx, ny, nz);
}

async function wireRemoveMark(id, type) {
    const comp = getLivewireComponent();
    if (!comp) throw new Error('Livewire no disponible');
    if (typeof comp.removeMark === 'function') {
        return await comp.removeMark(id, type);
    }
    return await comp.$wire.removeMark(id, type);
}

// ---- Modo incidencia ----
function setIncidentMode(enabled) {
    incidentMode = enabled;
    if (enabled && bimSelectMode) setBimSelectMode(false); // mutuamente excluyentes

    const btn = document.getElementById('ar-btn-incident-mode');
    const indicator = document.getElementById('ar-incident-indicator');
    const crosshair = document.getElementById('ar-incident-crosshair');

    if (btn) btn.classList.toggle('active', enabled);
    if (indicator) indicator.classList.toggle('visible', enabled);
    if (crosshair) crosshair.classList.toggle('visible', enabled);
}

function toggleIncidentMode() {
    if (!modelLoaded || !arModel || !arModel.visible) {
        showToast('⚠️ Primero coloca el modelo sobre una superficie', 'error');
        return;
    }
    if (incidentMode) {
        setIncidentMode(false);
        showToast('🔓 Modo crear marca desactivado', 'info', 2000);
        return;
    }
    if (hitTestEnabled) disableHitTest();
    setIncidentMode(true);
    showToast('🚩 Apunta al modelo y toca para crear una marca', 'info', 5000);
}

function setIncidentCrosshairBusy(busy) {
    const ch = document.getElementById('ar-incident-crosshair');
    if (ch) ch.classList.toggle('busy', busy);
}

// ---- Marcadores 3D ----
function addMarker(item, type) {
    if (!arModel) return null;

    const color = type === 'anchor' ? 0x3b82f6 : 0xef4444;

    const group = new THREE.Group();

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshBasicMaterial({
            color,
            depthTest: false,
            transparent: true,
            opacity: 0.95,
        })
    );
    sphere.renderOrder = 999;
    group.add(sphere);

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.85, 1.15, 32),
        new THREE.MeshBasicMaterial({
            color,
            depthTest: false,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
        })
    );
    ring.renderOrder = 998;
    group.add(ring);

    group.position.set(
        parseFloat(item.x) || 0,
        parseFloat(item.y) || 0,
        parseFloat(item.z) || 0
    );

    group.userData = { markerId: item.id, markerType: type, ring };

    arModel.add(group);
    markerRegistry.push({ id: item.id, type, group });

    return group;
}

function disposeMarker(group) {
    arModel?.remove(group);
    group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            (Array.isArray(obj.material) ? obj.material : [obj.material])
                .forEach(m => m.dispose());
        }
    });
}

function removeMarkerById(id, type) {
    const idx = markerRegistry.findIndex(m => m.id === id && m.type === type);
    if (idx !== -1) {
        disposeMarker(markerRegistry[idx].group);
        markerRegistry.splice(idx, 1);
    }
}

function clearAllMarkers() {
    [...markerRegistry].forEach(m => disposeMarker(m.group));
    markerRegistry = [];
}

function buildIncidentMarkers() {
    clearAllMarkers();
    for (const inc of incidentsData) addMarker(inc, 'incident');
    for (const anc of anchorsData)   addMarker(anc, 'anchor');
    updateIncidentBadge();
    console.log(`🚩 Marcadores creados: ${incidentsData.length} incidencias, ${anchorsData.length} anclajes`);
}

// Escala proporcional a la distancia a cámara + orientación del anillo
const _markerWorldPos = new THREE.Vector3();

function updateIncidentMarkers() {
    if (!arModel || !camera || !markerRegistry.length) return;
    for (const m of markerRegistry) {
        m.group.getWorldPosition(_markerWorldPos);
        const d = camera.position.distanceTo(_markerWorldPos);
        const s = THREE.MathUtils.clamp(d * 0.055, 0.012, 0.6);
        m.group.scale.setScalar(s);
        if (m.group.userData.ring) m.group.userData.ring.lookAt(camera.position);
    }
}

function updateIncidentBadge() {
    const badge = document.getElementById('ar-fab-badge-incidents');
    if (!badge) return;
    const total = incidentsData.length + anchorsData.length;
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
}

// ---- Listado en el panel ----
function renderIncidentList() {
    const body = document.getElementById('ar-incidents-body');
    if (!body) return;

    const all = [
        ...incidentsData.map(i => ({ ...i, _type: 'incident' })),
        ...anchorsData.map(a => ({ ...a, _type: 'anchor' })),
    ];

    if (!all.length) {
        body.innerHTML = '<div class="small text-white-50 text-center py-3">No hay marcas en este modelo</div>';
        return;
    }

    body.innerHTML = '';
    for (const item of all) {
        const row = document.createElement('div');
        row.className = 'ar-mark-item';
        row.innerHTML = `
<div class="ar-mark-dot ${item._type}"></div>
<div class="ar-mark-info">
    <div class="ar-mark-title">${escapeHtml(item.title || '(sin título)')}</div>
    <div class="ar-mark-meta">${item._type === 'anchor' ? '📌 Anclaje' : '🚩 Incidencia'} · ID ${item.id}</div>
</div>
<button type="button" class="ar-mark-del" title="Eliminar">
    <i class="bi bi-trash"></i>
</button>`;
        row.querySelector('.ar-mark-del').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteMark(item.id, item._type);
        });
        body.appendChild(row);
    }
}

// ---- Formulario modal ----
function showIncidentForm(localPos, localNormal) {
    pendingIncidentPos = localPos.clone();
    pendingIncidentNormal = localNormal.clone();

    const form = document.getElementById('ar-incident-form');
    const titleInput = document.getElementById('ar-incident-title');
    if (form) form.classList.add('open');
    if (titleInput) { titleInput.value = ''; setTimeout(() => titleInput.focus(), 50); }

    markUIPointerActive(); // bloquea selects XR mientras el modal está abierto
}

function hideIncidentForm() {
    const form = document.getElementById('ar-incident-form');
    if (form) form.classList.remove('open');
    pendingIncidentPos = null;
    pendingIncidentNormal = null;
    markUIPointerInactiveSoon();
}

async function submitIncident() {
    const titleInput = document.getElementById('ar-incident-title');
    const typeSelect = document.getElementById('ar-incident-type');
    const saveBtn = document.getElementById('ar-incident-save');

    const title = (titleInput?.value || '').trim();
    const type = typeSelect?.value || 'incident';

    if (!title) {
        showToast('⚠️ Escribe un título para la marca', 'error');
        titleInput?.focus();
        return;
    }
    if (!pendingIncidentPos || !pendingIncidentNormal) {
        showToast('⚠️ Posición no válida', 'error');
        hideIncidentForm();
        return;
    }

    const p = pendingIncidentPos;
    const n = pendingIncidentNormal;

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando…'; }

    try {
        const newId = await wireSaveMark(
            title, 'main', type,
            +p.x.toFixed(6), +p.y.toFixed(6), +p.z.toFixed(6),
            +n.x.toFixed(6), +n.y.toFixed(6), +n.z.toFixed(6)
        );

        if (!newId || newId === 'fail') throw new Error('El servidor devolvió fail');

        const item = {
            id: newId,
            title,
            x: p.x, y: p.y, z: p.z,
            normal_x: n.x, normal_y: n.y, normal_z: n.z,
            priority: type === 'incident' ? 1 : null,
        };

        if (type === 'anchor') anchorsData.push(item);
        else incidentsData.push(item);

        addMarker(item, type);
        updateIncidentBadge();
        renderIncidentList();

        hideIncidentForm();
        showToast(`✅ ${type === 'anchor' ? 'Anclaje' : 'Incidencia'} "${title}" guardada`, 'success', 4000);
    } catch (error) {
        console.error('❌ Error guardando marca:', error);
        showToast('❌ Error al guardar la marca', 'error', 5000);
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Guardar'; }
    }
}

async function deleteMark(id, type) {
    try {
        await wireRemoveMark(id, type);

        if (type === 'anchor') {
            anchorsData = anchorsData.filter(a => a.id !== id);
        } else {
            incidentsData = incidentsData.filter(i => i.id !== id);
        }

        removeMarkerById(id, type);
        updateIncidentBadge();
        renderIncidentList();
        showToast('🗑️ Marca eliminada', 'info', 2500);
    } catch (error) {
        console.error('❌ Error eliminando marca:', error);
        showToast('❌ Error al eliminar', 'error');
    }
}

// ---- Setup de la UI de marcas ----
function setupIncidentUI() {
    const btn = document.getElementById('ar-btn-incident-mode');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleIncidentMode();
        });
    }

    const form = document.getElementById('ar-incident-form');
    const cancelBtn = document.getElementById('ar-incident-cancel');
    const saveBtn = document.getElementById('ar-incident-save');
    const titleInput = document.getElementById('ar-incident-title');
    const typeSelect = document.getElementById('ar-incident-type');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideIncidentForm();
        });
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            submitIncident();
        });
    }
    if (titleInput) {
        titleInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') { e.preventDefault(); submitIncident(); }
            if (e.key === 'Escape') hideIncidentForm();
        });
    }
    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            const t = document.getElementById('ar-incident-form-title');
            if (t) t.textContent = typeSelect.value === 'anchor'
                ? '📌 Nuevo anclaje'
                : '🚩 Nueva incidencia';
        });
    }
    // Cerrar tocando el fondo oscuro
    if (form) {
        form.addEventListener('click', (e) => {
            if (e.target === form) hideIncidentForm();
        });
    }
}

// =====================================================
// INICIALIZAR VISOR
// =====================================================

async function initViewer() {

    // THAT OPEN
    components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    world = worlds.create();
    world.scene = new OBC.SimpleScene(components);
    world.scene.setup();
    world.scene.three.background = null;
    scene = world.scene.three;

    // WEBGL RENDERER (XR) — no se asigna a world.renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // CAMERA
    camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    // COMPONENTS
    components.init();
    hider = components.get(OBC.Hider);

    // FRAGMENTS
    fragments = components.get(OBC.FragmentsManager);
    fragments.init('/engine/worker.mjs');

    // MATERIALES: POLYGON OFFSET
    try {
        fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
            const isLod = 'isLodMaterial' in material && material.isLodMaterial;
            if (!isLod) {
                material.polygonOffset = true;
                material.polygonOffsetUnits = 1;
                material.polygonOffsetFactor = Math.random();
            }
        });
    } catch (error) {
        console.warn('⚠️ No se pudo configurar polygonOffset:', error);
    }

    // CUANDO SE CARGA EL MODELO
    fragments.list.onItemSet.add(({ value: model }) => {
        console.log('🟢 onItemSet disparado, modelId:', model.modelId);
        model.useCamera(camera);
        scene.add(model.object);
        arModel = model.object;
        arModel.scale.set(1, 1, 1);
        arModel.visible = false;
        loadedModelId = model.modelId;
        modelLoaded = true;
        modelLoading = false;
        console.log('✅ Modelo registrado en escena:', loadedModelId);
    });

    // BOTÓN AR
    const arButton = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: arUI }
    });
    document.body.appendChild(arButton);

    // SLIDER DE OPACIDAD
    if (opacitySlider) {
        opacitySlider.addEventListener('input', (e) => {
            e.stopPropagation();
            opacityValue = Number(opacitySlider.value) / 100;
            if (opacityText) opacityText.textContent = `${opacitySlider.value}%`;
            setModelOpacity(opacityValue);
        });
    }

    // SETUP DE UI
    setupPropertyFilters();
    setupARPanels();
    setupPositionCorrection();
    setupBimSelect();
    setupIncidentUI(); // 🆕
    setupGlobalUIGuard();

    updateFabBarHeightVar();
    window.addEventListener('resize', updateFabBarHeightVar);

    // RESET DE FILTROS
    const resetFiltersBtn = document.getElementById('ar-reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await resetAllFilters();
            showToast('🔄 Filtros reiniciados', 'info');
        });
    }

    // RETICLE
    const reticleGeometry = new THREE.RingGeometry(0.08, 0.1, 32);
    reticleGeometry.rotateX(-Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial();
    arReticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    arReticle.matrixAutoUpdate = false;
    arReticle.visible = false;
    scene.add(arReticle);

    // CONTROLLER XR
    arController = renderer.xr.getController(0);
    arController.addEventListener('select', onARSelect);
    scene.add(arController);

    // INICIO DE AR
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
        setIncidentMode(false); // 🆕
        closeAllPanels();

        if (arModel) arModel.visible = false;

        if (opacitySlider) opacitySlider.value = Math.round(opacityValue * 100);
        if (opacityText) opacityText.textContent = `${Math.round(opacityValue * 100)}%`;
        if (arUI) arUI.style.display = 'block';

        updatePositionStatusUI();
        updateIncidentBadge(); // 🆕
        requestAnimationFrame(updateFabBarHeightVar);

        showToast('🟢 Sesión AR iniciada. Buscando superficie...', 'info', 5000);
    });

    // FIN DE AR
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
        setIncidentMode(false); // 🆕
        await clearBimSelection(true);
        hideIncidentForm(); // 🆕
        closeAllPanels();

        if (arReticle) arReticle.visible = false;
        if (arUI) arUI.style.display = 'none';
        if (arModel) arModel.visible = true;
    });

    // ANIMATION LOOP
    renderer.setAnimationLoop((timestamp, frame) => {
        updateAR(frame);
        updateIncidentMarkers(); // 🆕 escala/orientación de marcadores
        if (isAR && arModel) {
            fragments.core.update();
        }
        renderer.render(scene, camera);
    });

    // RESIZE
    window.addEventListener('resize', onResize);

    // OCULTAR UI FUERA DE AR
    if (arUI) arUI.style.display = 'none';
}

// =====================================================
// CONSTRUIR PROPERTIES DEL MODELO
// =====================================================

async function buildModelProperties(model) {
    const items = await model.getItems();
    const ids = Array.from(items.keys());
    const data = await model.getItemsData(ids, {
        attributesDefault: true,
        relations: {
            IsDefinedBy: { attributes: true, relations: true },
            IsTypedBy:   { attributes: true, relations: true },
        },
    });

    const properties = new Map();
    for (const item of data) {
        const id = item._localId?.value;
        if (id === undefined) continue;
        const propertySets = extractPropertySets(item);
        for (const [, propertyList] of propertySets) {
            for (const property of propertyList) {
                if (property.value === null || property.value === undefined || property.value === '') continue;
                const key = property.name;
                const value = String(property.value);
                if (!properties.has(key)) properties.set(key, new Map());
                const values = properties.get(key);
                if (!values.has(value)) values.set(value, []);
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
    const data = await model.getItemsData(ids, {
        attributesDefault: true,
        relations: {
            IsDefinedBy: { attributes: true, relations: true },
            IsTypedBy:   { attributes: true, relations: true },
        },
    });

    const categories = new Map();
    for (const item of data) {
        const id = item._localId?.value;
        const category = item._category?.value;
        if (id === undefined || !category) continue;
        if (!categories.has(category)) categories.set(category, []);
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
        if (!node || typeof node !== 'object') return;
        if (visited.has(node)) return;
        visited.add(node);

        if (node._category?.value === 'IFCPROPERTYSET') {
            const setName = node.Name?.value ?? 'Sin nombre';
            if (!propertySets.has(setName)) propertySets.set(setName, []);
            const properties = node.HasProperties ?? [];
            for (const property of properties) {
                const name = property.Name?.value;
                if (!name) continue;
                propertySets.get(setName).push({
                    name,
                    value: property.NominalValue?.value ?? null,
                    type:  property.NominalValue?.type ?? null
                });
            }
        }

        for (const key of Object.keys(node)) {
            const value = node[key];
            if (Array.isArray(value)) {
                for (const child of value) traverse(child);
            } else if (value && typeof value === 'object') {
                traverse(value);
            }
        }
    }

    traverse(data);
    return propertySets;
}

// =====================================================
// UI DE PROPERTIES (FILTROS)
// =====================================================

function buildPropertyUI() {
    const selectKey = document.getElementById('ar-property-key');
    const selectValue = document.getElementById('ar-property-value');
    if (!selectKey || !selectValue) {
        console.warn('⚠️ No se encontraron los selects de property-key/value');
        return;
    }
    selectKey.innerHTML = '<option value="">Seleccionar propiedad</option>';
    selectValue.innerHTML = '<option value="">Seleccionar valor</option>';
    selectValue.disabled = true;

    const sortedKeys = Array.from(modelProperties.keys()).sort((a, b) => a.localeCompare(b));
    for (const key of sortedKeys) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        selectKey.appendChild(option);
    }
    console.log('🧩 buildPropertyUI: keys cargadas:', sortedKeys.length);
}

function buildCategoryUI() {
    const cont = document.getElementById('ar-categories-container');
    if (!cont) {
        console.warn('⚠️ No se encontró ar-categories-container');
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
</div>`;
        cont.appendChild(group);
    }

    cont.querySelectorAll('.ar-category-toggle').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            await toggleCategory(e.target.dataset.category, e.target.checked);
        });
    });

    console.log('🧩 buildCategoryUI: categorías cargadas:', modelCategories.size);
}

function setupPropertyFilters() {
    const selectKey = document.getElementById('ar-property-key');
    if (selectKey) {
        selectKey.addEventListener('change', function () {
            const key = this.value;
            const selectValue = document.getElementById('ar-property-value');
            const btnApply = document.getElementById('ar-apply-property');
            selectValue.innerHTML = '<option value="">Seleccionar valor</option>';
            selectValue.disabled = true;
            btnApply.disabled = true;
            if (!key) return;
            const values = modelProperties.get(key);
            const sortedValues = values
                ? Array.from(values.keys()).sort((a, b) => a.localeCompare(b))
                : [];
            for (const value of sortedValues) {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                selectValue.appendChild(option);
            }
            selectValue.disabled = sortedValues.length === 0;
        });
    }

    const selectValue = document.getElementById('ar-property-value');
    if (selectValue) {
        selectValue.addEventListener('change', function () {
            document.getElementById('ar-apply-property').disabled = !this.value;
        });
    }

    const btnApply = document.getElementById('ar-apply-property');
    if (btnApply) {
        btnApply.addEventListener('click', async (e) => {
            e.stopPropagation();
            const key = document.getElementById('ar-property-key').value;
            const value = document.getElementById('ar-property-value').value;
            if (!key || !value) return;
            const exists = activePropertyFilters.some(f => f.key === key && f.value === value);
            if (!exists) activePropertyFilters.push({ key, value });
            clearPropertySelectors();
            renderPropertyFilters();
            await applyAllFilters();
        });
    }

    const btnClear = document.getElementById('ar-clear-property');
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
    const keyEl = document.getElementById('ar-property-key');
    const valueEl = document.getElementById('ar-property-value');
    const applyEl = document.getElementById('ar-apply-property');
    if (keyEl) keyEl.value = '';
    if (valueEl) {
        valueEl.innerHTML = '<option value="">Seleccionar valor</option>';
        valueEl.disabled = true;
    }
    if (applyEl) applyEl.disabled = true;
}

function renderPropertyFilters() {
    const cont = document.getElementById('ar-property-filters');
    if (!cont) return;
    cont.innerHTML = '';

    if (!activePropertyFilters.length) {
        cont.innerHTML = `<div class="small text-white-50">Sin filtros activos</div>`;
        return;
    }

    for (let index = 0; index < activePropertyFilters.length; index++) {
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
</div>`;
        cont.appendChild(item);
    }

    cont.querySelectorAll('.ar-filter-remove').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const index = Number(button.dataset.index);
            activePropertyFilters.splice(index, 1);
            renderPropertyFilters();
            await applyAllFilters();
        });
    });
}

async function toggleCategory(category, visible) {
    categoryVisibility.set(category, visible);
    await applyAllFilters();
}

async function resetAllFilters() {
    categoryVisibility.clear();
    activePropertyFilters = [];
    document.querySelectorAll('.ar-category-toggle').forEach(cb => { cb.checked = true; });
    clearPropertySelectors();
    renderPropertyFilters();
    await applyAllFilters();
}

async function applyAllFilters() {
    if (!fragments || !loadedModelId || !hider) return;
    const filteredIds = getFilteredModelIds();
    const modelIdMap = { [loadedModelId]: filteredIds };
    await hider.set(false);
    await hider.set(true, modelIdMap);
    await fragments.core.update(true);
    updateFabBadges();

    if (selectedBimElement && !filteredIds.has(selectedBimElement.localId)) {
        await clearBimSelection(true);
    }
}

function getFilteredModelIds() {
    let ids = new Set();

    for (const [category, categoryIds] of modelCategories) {
        const visible = categoryVisibility.has(category)
            ? categoryVisibility.get(category)
            : true;
        if (!visible) continue;
        for (const id of categoryIds) ids.add(id);
    }

    if (activePropertyFilters.length) {
        const filtersByKey = new Map();
        for (const filter of activePropertyFilters) {
            if (!filtersByKey.has(filter.key)) filtersByKey.set(filter.key, []);
            filtersByKey.get(filter.key).push(filter.value);
        }
        for (const [key, values] of filtersByKey) {
            const propertyValues = modelProperties.get(key);
            if (!propertyValues) return new Set();
            const groupIds = new Set();
            for (const value of values) {
                const propertyIds = propertyValues.get(value);
                if (!propertyIds) continue;
                for (const id of propertyIds) groupIds.add(id);
            }
            if (!groupIds.size) return new Set();
            ids = new Set([...ids].filter(id => groupIds.has(id)));
            if (!ids.size) return ids;
        }
    }
    return ids;
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

function setModelOpacity(opacity) {
    const value = THREE.MathUtils.clamp(opacity, 0, 1);
    if (!arModel) return;

    arModel.traverse((object) => {
        if (!object.isMesh || !object.material) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
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
            if (value >= 1) {
                material.opacity = original.opacity;
                material.transparent = original.transparent;
            } else {
                material.opacity = original.opacity * value;
                material.transparent = true;
            }
            material.depthWrite = original.depthWrite;
            material.depthTest = original.depthTest;
            material.side = original.side;
            material.alphaTest = original.alphaTest;
            material.blending = original.blending;
            material.needsUpdate = true;
        });
    });

    if (fragments && modelLoaded) fragments.core.update(true);
}

// =====================================================
// 🆕 COLOCAR MODELO ALINEADO AL ANCLAJE
// =====================================================
//
// En AR la "cámara" es el dispositivo del usuario. Para que
// la vista quede "en el anclaje", colocamos el modelo de
// forma que el punto (x,y,z) del anclaje quede exactamente
// donde está el reticle (la superficie detectada).
// =====================================================

function placeModelAt(position) {
    arModel.position.copy(position);
    if (hasAnchorPosition) {
        arModel.position.sub(anchorPosition);
    }
    arModel.visible = true;
    arModel.updateMatrixWorld(true);
    lastPlacedPosition = arModel.position.clone();
}

// =====================================================
// SELECT EN AR
// =====================================================

async function onARSelect() {
    if (!isAR) return;

    if (uiPointerActive) {
        console.log('🚫 Select ignorado: interacción activa con la UI');
        return;
    }

    // =================================================
    // 🆕 MODO CREAR MARCA (incidencia / anclaje)
    // =================================================
    if (incidentMode) {
        if (incidentRaycastBusy) return;
        if (!modelLoaded || !arModel || !arModel.visible) {
            showToast('⚠️ El modelo todavía no está colocado', 'error');
            return;
        }

        incidentRaycastBusy = true;
        setIncidentCrosshairBusy(true);

        try {
            const result = await raycastFragmentsAtScreenCenter();

            if (!result) {
                showToast('🔍 Apunta a una superficie del modelo', 'info', 2500);
            } else {
                // Punto de impacto en espacio LOCAL del modelo (coordenadas IFC)
                const localPos = arModel.worldToLocal(result.point.clone());

                // Normal: de object-space → world → local del arModel
                const faceNormal = result.face
                    ? result.face.normal.clone()
                    : new THREE.Vector3(0, 1, 0);
                const worldNormal = faceNormal.transformDirection(result.object.matrixWorld);
                const localNormal = worldNormal
                    .transformDirection(arModel.matrixWorld.clone().invert())
                    .normalize();

                console.log('🚩 Hit para marca → local:', localPos.toArray(), 'normal:', localNormal.toArray());

                showIncidentForm(localPos, localNormal);
            }
        } catch (error) {
            console.error('❌ Error en modo marca:', error);
            showToast('❌ Error al detectar el punto', 'error');
        } finally {
            incidentRaycastBusy = false;
            setIncidentCrosshairBusy(false);
        }
        return;
    }

    // =================================================
    // MODO SELECCIÓN BIM
    // =================================================
    if (bimSelectMode) {
        if (bimRaycastBusy) return;
        if (!modelLoaded || !arModel || !arModel.visible) {
            showToast('⚠️ El modelo todavía no está colocado', 'error');
            return;
        }

        bimRaycastBusy = true;
        setCrosshairBusy(true);

        try {
            const result = await raycastFragmentsAtScreenCenter();
            if (!result) {
                showToast('🔍 Nada bajo la mira. Apunta a una superficie del modelo.', 'info', 2500);
            } else {
                console.log('🎯 Hit BIM → localId:', result.localId, 'modelo:', result.fragmentsModel.modelId);
                await selectBimElement(result.fragmentsModel, result.localId);
            }
        } catch (error) {
            console.error('❌ Error en la selección BIM:', error);
            showToast('❌ Error al seleccionar el elemento', 'error');
        } finally {
            bimRaycastBusy = false;
            setCrosshairBusy(false);
        }
        return;
    }

    // =================================================
    // MODO COLOCACIÓN (HIT-TEST)
    // =================================================
    if (!hitTestEnabled) return;
    if (!arReticle || !arReticle.visible) return;

    const position = new THREE.Vector3();
    position.setFromMatrixPosition(arReticle.matrix);

    // MODELO YA CARGADO → SOLO REPOSICIONAR (alineado al anclaje)
    if (modelLoaded && arModel) {
        placeModelAt(position); // 🆕 aplica offset del anclaje
        console.log('📍 Modelo reposicionado');
        showToast(hasAnchorPosition ? '📍 Modelo reposicionado (alineado al anclaje)' : '📍 Modelo reposicionado', 'success');
        disableHitTest();
        return;
    }

    if (modelLoading) return;
    modelLoading = true;

    const url = container.dataset.url;
    if (!url) {
        console.error('❌ No existe data-url en #viewer');
        modelLoading = false;
        showToast('❌ No se encontró la URL del modelo', 'error');
        return;
    }

    // CARGAR IFC  (🔒 cargador intacto)
    try {
        console.log('📥 Iniciando carga desde:', url);
        showToast('📥 Cargando modelo IFC...', 'info', 8000);

        const response = await fetch(url + '?type=frag');
        if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        console.log('📦 Buffer recibido, tamaño:', buffer.byteLength);

        await fragments.core.load(buffer, { modelId: 'main' });
        console.log('✅ fragments.core.load resuelto');

        const model = fragments.list.get('main');
        if (!model) throw new Error('Modelo no encontrado en fragments.list');

        console.log('🔍 Construyendo properties...');
        modelProperties = await buildModelProperties(model);
        console.log('✅ Properties:', modelProperties.size);

        console.log('🔍 Construyendo categories...');
        modelCategories = await buildModelCategories(model);
        console.log('✅ Categories:', modelCategories.size);

        buildPropertyUI();
        buildCategoryUI();

        let totalElements = 0;
        for (const categoryIds of modelCategories.values()) totalElements += categoryIds.length;

        showToast(`✅ Modelo cargado: ${totalElements} elementos, ${modelCategories.size} categorías`, 'success', 5000);
        await fragments.core.update(true);

        if (arModel) {
            placeModelAt(position); // 🆕 coloca el modelo con el anclaje en el reticle
            arModel.scale.set(1, 1, 1);
            setModelOpacity(opacityValue);

            buildIncidentMarkers(); // 🆕 marcadores 3D de incidencias/anclajes
            renderIncidentList();   // 🆕

            console.log('✅ Modelo colocado en AR:', loadedModelId);
            showToast(
                hasAnchorPosition
                    ? '📍 Modelo colocado en el anclaje. 🚩 crea marcas o 🎯 inspecciona elementos.'
                    : '📍 Modelo colocado. Usa 🎯 para inspeccionar elementos.',
                'success',
                5000
            );
            disableHitTest();
        }
    } catch (error) {
        console.error('❌ Error cargando IFC:', error);
        modelLoading = false;
        showToast('❌ Error cargando el modelo IFC', 'error', 6000);
    }
}

// =====================================================
// HIT TEST
// =====================================================

function updateAR(frame) {
    if (!frame) return;
    if (!hitTestEnabled) {
        if (arReticle) arReticle.visible = false;
        return;
    }

    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();
    if (!referenceSpace || !session) return;

    if (!hitTestSourceRequested) {
        session.requestReferenceSpace('viewer')
            .then((viewerSpace) => session.requestHitTestSource({ space: viewerSpace }))
            .then((source) => {
                if (!hitTestEnabled) {
                    try { source.cancel(); } catch (e) {}
                    return;
                }
                hitTestSource = source;
            })
            .catch((error) => console.error('Error creando Hit Test:', error));

        session.addEventListener('end', () => {
            hitTestSourceRequested = false;
            hitTestSource = null;
            if (arReticle) arReticle.visible = false;
        });

        hitTestSourceRequested = true;
    }

    if (hitTestSource) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            if (pose) {
                arReticle.visible = true;
                arReticle.matrix.fromArray(pose.transform.matrix);
                if (!surfaceFoundNotified) {
                    surfaceFoundNotified = true;
                    showToast('🎯 Superficie detectada. Toca la pantalla para colocar el modelo', 'success', 5000);
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
    if (!container || !camera || !renderer) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// =====================================================
// INICIAR
// =====================================================

initViewer().catch((error) => {
    console.error('No se pudo iniciar el visor:', error);
});
