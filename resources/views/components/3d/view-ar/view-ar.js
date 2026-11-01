// ======================== CONFIGURACIÓN DESDE DATA-* ========================
const $container = document.getElementById('ar-container');
if (!$container) throw new Error('No se encontró #ar-container');

const MODEL_URL    = $container.dataset.url        || '';
const MODEL_TYPE   = $container.dataset.type        || '';
const MODEL_ID_STR = $container.dataset.modelId     || 'main';
const PROJECT_ID   = $container.dataset.projectId   || '';

// Coordenadas del anclaje actual (para posicionar el modelo)
const ANCHOR_POS = new THREE.Vector3(
    parseFloat($container.dataset.anchorX)  || 0,
    parseFloat($container.dataset.anchorY)  || 0,
    parseFloat($container.dataset.anchorZ)  || 0
);
const ANCHOR_NORMAL = new THREE.Vector3(
    parseFloat($container.dataset.anchorNx) || 0,
    parseFloat($container.dataset.anchorNy) || 0,
    parseFloat($container.dataset.anchorNz) || 0
);

// Datos precargados desde @json
let incidentsData = [];
try { incidentsData = JSON.parse($container.dataset.incidents || '[]'); } catch (_) {}
let anchorsData = [];
try { anchorsData = JSON.parse($container.dataset.anchors || '[]'); } catch (_) {}

// ======================== ESTADO GLOBAL ========================
let isAR             = false;
let modelLoaded      = false;
let hitTestEnabled   = false;
let hitTestSource    = null;
let hitTestRequested = false;
let uiPointerActive  = false;

// Three / OBC
let renderer, scene, camera, reticle, arModel;
let components, world, fragments;
let controller;

// BIM Select
let bimSelectMode      = false;
let selectedBimElement = null;
let lastBimInfoData    = null;
let bimRaycastBusy     = false;

const BIM_HIGHLIGHT = {
    color: new THREE.Color('#f59e0b'),
    opacity: 1, transparent: false, renderedFaces: 0,
};

// Incidencias
let incidentMode        = false;
let incidentMarkers     = [];   // { mesh: THREE.Group, data }
let incidentRayBusy     = false;
let pendingLocalPos     = null;
let pendingLocalNormal  = null;

// Filtros
let filteredIds            = null;
let activeCategories       = new Set();
let activePropertyFilters  = [];

// ======================== REFERENCIAS DOM ========================
const $overlay       = document.getElementById('ar-ui-container');
const $toasts        = document.getElementById('ar-toast-container');
const $fabBar        = document.querySelector('.ar-fab-bar');

// BIM
const $btnBimSel     = document.getElementById('ar-btn-bim-select');
const $btnBimInfo    = document.getElementById('ar-btn-bim-info');
const $crossBim      = document.getElementById('ar-crosshair-bim');
const $indBim        = document.getElementById('ar-bim-select-indicator');
const $panelBim      = document.getElementById('ar-panel-bim-info');
const $bimBody       = document.getElementById('ar-bim-info-body');
const $closeBim      = document.getElementById('ar-close-bim-info');

// Incidencias
const $btnIncMode    = document.getElementById('ar-btn-incident-mode');
const $btnIncList    = document.getElementById('ar-btn-incident-list');
const $crossInc      = document.getElementById('ar-crosshair-inc');
const $indInc        = document.getElementById('ar-incident-indicator');
const $incForm       = document.getElementById('ar-incident-form');
const $incTitle      = document.getElementById('ar-inc-title');
const $incSave       = document.getElementById('ar-inc-save');
const $incCancel     = document.getElementById('ar-inc-cancel');
const $panelInc      = document.getElementById('ar-panel-incidents');
const $incBody       = document.getElementById('ar-incidents-body');
const $closeInc      = document.getElementById('ar-close-incidents');

// D-Pad
const $btnDpad       = document.getElementById('ar-btn-dpad');
const $dpad          = document.getElementById('ar-dpad');

// ======================== UTILIDADES ========================
function showToast(msg, type = 'info', ms = 3000) {
    if (!$toasts) return;
    const t = document.createElement('div');
    t.className = `ar-toast ar-toast-${type}`;
    t.textContent = msg;
    $toasts.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, ms);
}

function updateFabHeight() {
    if (!$fabBar) return;
    document.documentElement.style.setProperty(
        '--ar-fab-height', `${$fabBar.getBoundingClientRect().height}px`
    );
}

function openPanel(key) {
    document.querySelectorAll('.ar-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.ar-fab[data-panel]').forEach(b => b.classList.remove('active'));
    const panel = document.getElementById(`ar-panel-${key}`);
    const fab   = document.querySelector(`.ar-fab[data-panel="${key}"]`);
    if (panel) panel.classList.remove('hidden');
    if (fab)   fab.classList.add('active');
}

function closeAllPanels() {
    document.querySelectorAll('.ar-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.ar-fab[data-panel]').forEach(b => b.classList.remove('active'));
}

function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

// ======================== LIVEWIRE HELPER ========================
function getWire() {
    try {
        if (window.Livewire) {
            const c = Livewire.first();
            if (c) return c.$wire;
        }
    } catch (_) {}
    return null;
}

async function wireSaveMark(title, model, type, x, y, z, nx, ny, nz) {
    const wire = getWire();
    if (!wire) throw new Error('Livewire no disponible');
    return await wire.saveMark(
        title, model, type,
        parseFloat(x.toFixed(6)),
        parseFloat(y.toFixed(6)),
        parseFloat(z.toFixed(6)),
        parseFloat(nx.toFixed(6)),
        parseFloat(ny.toFixed(6)),
        parseFloat(nz.toFixed(6))
    );
}

async function wireRemoveMark(id, type) {
    const wire = getWire();
    if (!wire) throw new Error('Livewire no disponible');
    return await wire.removeMark(id, type);
}

// ======================== INICIALIZACIÓN ========================
async function initAR() {
    // OBC
    components = new OBC.Components();
    world = components.get(OBC.Worlds).create(OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer);
    fragments = components.get(OBC.FragmentsManager);
    await fragments.init('/engine/worker.mjs');

    // Renderer XR
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    $container.appendChild(renderer.domElement);

    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 200);

    // Luces
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(2, 5, 3);
    scene.add(dir);

    // Reticle
    const rGeo = new THREE.RingGeometry(0.05, 0.07, 32).rotateX(-Math.PI / 2);
    reticle = new THREE.Mesh(rGeo, new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide }));
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Grupo modelo AR
    arModel = new THREE.Group();
    arModel.visible = false;
    scene.add(arModel);

    // ARButton
    const arBtn = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: $overlay || document.body },
    });
    arBtn.style.bottom = '90px';
    document.body.appendChild(arBtn);

    // Controller
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onARSelect);
    scene.add(controller);

    // Sesión
    renderer.xr.addEventListener('sessionstart', onSessionStart);
    renderer.xr.addEventListener('sessionend', onSessionEnd);

    // UI pointer guard
    if ($overlay) {
        $overlay.addEventListener('pointerdown', () => { uiPointerActive = true; }, true);
        $overlay.addEventListener('pointerup',   () => { setTimeout(() => { uiPointerActive = false; }, 120); }, true);
    }

    // Setup todo
    setupBimSelect();
    setupIncidentSystem();
    setupDPad();
    setupOpacity();
    setupFilters();
    setupPanelCloseButtons();
    updateFabHeight();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateFabHeight();
    });

    renderer.setAnimationLoop(animate);
}

// ======================== SESIÓN XR ========================
function onSessionStart() {
    isAR = true;
    hitTestRequested = false;
    hitTestSource = null;
    showToast('📱 Sesión AR iniciada', 'success');
}

async function onSessionEnd() {
    isAR = false;
    hitTestEnabled = false;
    hitTestSource = null;
    hitTestRequested = false;
    reticle.visible = false;
    setBimSelectMode(false);
    setIncidentMode(false);
    await clearBimSelection(true);
    closeAllPanels();
    showToast('Sesión AR finalizada', 'info');
}

// ======================== HIT-TEST ========================
function requestHitTest(session) {
    if (hitTestRequested) return;
    hitTestRequested = true;
    session.requestReferenceSpace('viewer').then(vs => {
        session.requestHitTestSource({ space: vs }).then(src => {
            hitTestSource = src;
            hitTestEnabled = true;
        });
    }).catch(() => {});
}

function disableHitTest() {
    hitTestEnabled = false;
    reticle.visible = false;
}

// ======================== SELECT (TAP) ========================
function onARSelect() {
    if (!isAR || uiPointerActive) return;

    // 1. BIM SELECT
    if (bimSelectMode) {
        if (bimRaycastBusy) return;
        if (!modelLoaded || !arModel.visible) { showToast('⚠️ Coloca el modelo primero', 'warning'); return; }
        bimRaycastBusy = true;
        $crossBim?.classList.add('busy');
        try {
            const hit = raycastCenter();
            if (!hit) { showToast('🔍 Nada bajo la mira', 'info'); return; }
            selectBimElement(hit.fragmentsModel, hit.localId);
        } finally {
            bimRaycastBusy = false;
            $crossBim?.classList.remove('busy');
        }
        return;
    }

    // 2. INCIDENT MODE
    if (incidentMode) {
        if (incidentRayBusy) return;
        if (!modelLoaded || !arModel.visible) { showToast('⚠️ Coloca el modelo primero', 'warning'); return; }
        incidentRayBusy = true;
        $crossInc?.classList.add('busy');
        try {
            const hit = raycastCenter();
            if (!hit) { showToast('🔍 No se detectó geometría', 'info'); return; }
            const localPos    = arModel.worldToLocal(hit.point.clone());
            const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
            const localNormal = worldNormal.transformDirection(arModel.matrixWorld.clone().invert()).normalize();
            showIncidentForm(localPos, localNormal);
        } finally {
            incidentRayBusy = false;
            $crossInc?.classList.remove('busy');
        }
        return;
    }

    // 3. FLUJO NORMAL
    if (!modelLoaded) {
        if (reticle.visible) loadModel();
    } else if (!arModel.visible) {
        if (reticle.visible) placeModelAtReticle();
    }
}

// ======================== CARGA DE MODELO ========================
async function loadModel() {
    if (!MODEL_URL) { showToast('⚠️ No hay modelo', 'warning'); return; }
    showToast('⏳ Cargando modelo…', 'info', 6000);
    try {
        const sep = MODEL_URL.includes('?') ? '&' : '?';
        const res = await fetch(`${MODEL_URL}${sep}type=frag`);
        console.log(`${MODEL_URL}${sep}type=frag`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        const model  = await fragments.core.load(buffer, { modelId: MODEL_ID_STR });

        // Z-fighting fix
        try {
            fragments.core.models.materials.list.onItemSet.add(({ value: mat }) => {
                if (!mat || mat.isLodMaterial) return;
                mat.polygonOffset = true;
                mat.polygonOffsetFactor = Math.random() * 2;
                mat.polygonOffsetUnits  = 1;
            });
        } catch (_) {}

        // Centrar geometría en el origen del grupo
        const box = new THREE.Box3();
        model.meshes.forEach(m => box.expandByObject(m));
        const center = box.getCenter(new THREE.Vector3());
        model.meshes.forEach(m => {
            m.position.sub(center);
            arModel.add(m);
        });

        // Guardar offset del anclaje en coordenadas locales centradas
        arModel.userData.anchorOffset = ANCHOR_POS.clone().sub(center);

        modelLoaded = true;
        arModel.visible = false;
        showToast('✅ Modelo cargado. Apunta y toca para colocar.', 'success', 4000);

        // Construir marcadores de incidencias y anclajes precargados
        buildAllMarkers();
        populateCategoryFilters();
    } catch (e) {
        console.error('Error cargando modelo:', e);
        showToast('❌ Error al cargar modelo', 'error');
    }
}

function placeModelAtReticle() {
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    reticle.matrix.decompose(pos, quat, scl);

    arModel.position.copy(pos);
    arModel.quaternion.copy(quat);
    arModel.scale.set(1, 1, 1);

    // Offset para que el punto de anclaje quede en la posición del reticle
    if (arModel.userData.anchorOffset) {
        const offset = arModel.userData.anchorOffset.clone().applyQuaternion(quat);
        arModel.position.sub(offset);
    }

    arModel.visible = true;
    arModel.updateMatrixWorld(true);
    updateMarkerScales();
    showToast('📍 Modelo colocado en el anclaje', 'success');
}

// ======================== RAYCAST ========================
function raycastCenter() {
    if (!renderer || !camera) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((rect.left + rect.width  / 2) / rect.width)  *  2 - 1,
        -((rect.top  + rect.height / 2) / rect.height) *  2 + 1
    );
    let best = null;
    for (const [, model] of fragments.list) {
        try {
            const r = model.raycast({ camera, mouse, dom: renderer.domElement });
            if (r && (!best || r.distance < best.distance)) {
                r.fragmentsModel = model;
                best = r;
            }
        } catch (_) {}
    }
    return best;
}

// ======================== BIM SELECT ========================
function setBimSelectMode(on) {
    bimSelectMode = on;
    $btnBimSel?.classList.toggle('active', on);
    $crossBim?.classList.toggle('visible', on);
    $indBim?.classList.toggle('visible', on);
    if (on) {
        if (incidentMode) setIncidentMode(false);
        disableHitTest();
    }
}

function toggleBimSelect() {
    if (!modelLoaded || !arModel.visible) { showToast('⚠️ Coloca el modelo primero', 'warning'); return; }
    setBimSelectMode(!bimSelectMode);
    showToast(bimSelectMode ? '🎯 Selección BIM activa' : 'Selección BIM desactivada', 'info');
}

function clearBimHighlight() {
    if (!selectedBimElement) return;
    try {
        const m = fragments.list.get(selectedBimElement.modelId);
        if (m) { m.resetHighlight([selectedBimElement.localId]); fragments.core.update(true); }
    } catch (_) {}
}

function applyBimHighlight(model, localId) {
    try { model.highlight([localId], BIM_HIGHLIGHT); fragments.core.update(true); } catch (_) {}
}

async function clearBimSelection(closePanel = true) {
    clearBimHighlight();
    selectedBimElement = null;
    lastBimInfoData = null;
    if (closePanel) $panelBim?.classList.add('hidden');
}

function getElementInfo(model, localId) {
    try {
        return model.getItemsData([localId], {
            attributesDefault: true,
            relations: {
                IsDefinedBy: { attributes: true, relations: true },
                IsTypedBy:   { attributes: true, relations: true },
            },
        });
    } catch (_) { return null; }
}

function extractPropertySets(data) {
    const sets = {};
    if (!data || !Array.isArray(data)) return sets;
    for (const item of data) {
        for (const rel of (item.IsDefinedBy || [])) {
            const pset = rel.RelatingPropertyDefinition;
            if (!pset) continue;
            const name = pset.Name || 'Sin nombre';
            const props = {};
            for (const p of (pset.HasProperties || [])) {
                props[p.Name || '—'] = p.NominalValue?.value ?? p.NominalValue ?? p.value ?? '—';
            }
            if (Object.keys(props).length) sets[name] = props;
        }
    }
    return sets;
}

function selectBimElement(model, localId) {
    const data = getElementInfo(model, localId);
    clearBimHighlight();
    selectedBimElement = { modelId: model.id || MODEL_ID_STR, localId };
    applyBimHighlight(model, localId);

    const info = data?.[0] || {};
    lastBimInfoData = {
        info: {
            _localId:  localId,
            _guid:     info._guid || info.GlobalId || '—',
            _category: info._category || info.Class || '—',
            Name:      info.Name || '—',
            ObjectType:info.ObjectType || '—',
            Tag:       info.Tag || '—',
        },
        propertySets: extractPropertySets(data),
    };
    buildBimInfoUI(lastBimInfoData);
    openPanel('bim-info');
}

function buildBimInfoUI({ info, propertySets }) {
    if (!$bimBody) return;
    let h = '<div class="ar-bim-section">';
    for (const [k, v] of [['Categoría', info._category], ['Nombre', info.Name],
        ['Tipo', info.ObjectType], ['GUID', info._guid], ['Tag', info.Tag], ['ID', info._localId]]) {
        h += `<div class="ar-bim-row"><span class="ar-bim-key">${k}</span><span class="ar-bim-val">${v ?? '—'}</span></div>`;
    }
    h += '</div>';
    for (const [sn, props] of Object.entries(propertySets)) {
        h += `<details class="ar-bim-pset"><summary>${sn} (${Object.keys(props).length})</summary><div class="ar-bim-section">`;
        for (const [pk, pv] of Object.entries(props))
            h += `<div class="ar-bim-row"><span class="ar-bim-key">${pk}</span><span class="ar-bim-val">${pv}</span></div>`;
        h += '</div></details>';
    }
    h += '<button class="ar-bim-deselect-btn" id="ar-bim-deselect">Quitar selección</button>';
    $bimBody.innerHTML = h;
    $bimBody.scrollTop = 0;
    document.getElementById('ar-bim-deselect')?.addEventListener('click', () => clearBimSelection(true));
}

function setupBimSelect() {
    $btnBimSel?.addEventListener('click', toggleBimSelect);
    $btnBimInfo?.addEventListener('click', () => {
        if (lastBimInfoData) openPanel('bim-info');
        else showToast('ℹ️ Selecciona un elemento primero', 'info');
    });
    $closeBim?.addEventListener('click', () => $panelBim?.classList.add('hidden'));
}

// ======================== SISTEMA DE INCIDENCIAS ========================

function priorityColor(p) {
    return parseInt(p) === 3 ? 0xef4444 : parseInt(p) === 2 ? 0xf97316 : 0xfacc15;
}
function priorityLabel(p) {
    return parseInt(p) === 3 ? 'Alta' : parseInt(p) === 2 ? 'Media' : 'Baja';
}
function priorityClass(p) {
    return `p${p || 1}`;
}

// --- Marcadores 3D ---
function createMarker(incident, color) {
    const g = new THREE.Group();

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 14, 14),
        new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 })
    );
    sphere.renderOrder = 999;
    g.add(sphere);

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.3, 1.7, 24),
        new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    ring.renderOrder = 998;
    g.add(ring);

    g.position.set(
        parseFloat(incident.x) || 0,
        parseFloat(incident.y) || 0,
        parseFloat(incident.z) || 0
    );
    g.userData = { type: 'marker', id: incident.id, kind: 'incident' };
    arModel.add(g);
    return g;
}

function buildAllMarkers() {
    clearAllMarkers();
    // Incidencias
    for (const inc of incidentsData) {
        const mesh = createMarker(inc, priorityColor(inc.priority));
        incidentMarkers.push({ mesh, data: inc });
    }
    // Anclajes (marcadores azules)
    for (const anc of anchorsData) {
        const g = new THREE.Group();
        const s = new THREE.Mesh(
            new THREE.SphereGeometry(1, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0x3b82f6, depthTest: false, transparent: true, opacity: 0.7 })
        );
        s.renderOrder = 997;
        g.add(s);
        g.position.set(parseFloat(anc.x) || 0, parseFloat(anc.y) || 0, parseFloat(anc.z) || 0);
        g.userData = { type: 'marker', id: anc.id, kind: 'anchor' };
        arModel.add(g);
    }
    updateMarkerScales();
}

function updateMarkerScales() {
    if (!arModel) return;
    const s = arModel.scale.x || 1;
    const size = 0.025 / s;
    arModel.children.forEach(c => {
        if (c.userData?.type === 'marker') c.scale.setScalar(size);
    });
}

function clearAllMarkers() {
    for (const m of incidentMarkers) {
        arModel.remove(m.mesh);
        m.mesh.traverse(ch => {
            ch.geometry?.dispose();
            if (ch.material) (Array.isArray(ch.material) ? ch.material : [ch.material]).forEach(mt => mt.dispose());
        });
    }
    incidentMarkers = [];
    // También limpiar anclajes
    const toRemove = arModel.children.filter(c => c.userData?.type === 'marker' && c.userData?.kind === 'anchor');
    toRemove.forEach(c => {
        arModel.remove(c);
        c.traverse(ch => {
            ch.geometry?.dispose();
            if (ch.material) (Array.isArray(ch.material) ? ch.material : [ch.material]).forEach(mt => mt.dispose());
        });
    });
}

// --- Modo incidencia ---
function setIncidentMode(on) {
    incidentMode = on;
    $btnIncMode?.classList.toggle('active', on);
    $crossInc?.classList.toggle('visible', on);
    $indInc?.classList.toggle('visible', on);
    if (on) {
        if (bimSelectMode) setBimSelectMode(false);
        disableHitTest();
    }
}

function toggleIncidentMode() {
    if (!modelLoaded || !arModel.visible) { showToast('⚠️ Coloca el modelo primero', 'warning'); return; }
    setIncidentMode(!incidentMode);
    showToast(incidentMode ? '🚩 Modo incidencia activo' : 'Modo incidencia desactivado', 'info');
}

// --- Formulario ---
function showIncidentForm(localPos, localNormal) {
    pendingLocalPos    = localPos.clone();
    pendingLocalNormal = localNormal.clone();
    $incForm?.classList.remove('hidden');
    if ($incTitle) { $incTitle.value = ''; $incTitle.focus(); }
    uiPointerActive = true;
}

function hideIncidentForm() {
    $incForm?.classList.add('hidden');
    pendingLocalPos = null;
    pendingLocalNormal = null;
    uiPointerActive = false;
}

async function submitIncident() {
    const title = ($incTitle?.value || '').trim();
    if (!title) { showToast('⚠️ Escribe un título', 'warning'); $incTitle?.focus(); return; }
    if (!pendingLocalPos || !pendingLocalNormal) { hideIncidentForm(); return; }

    $incSave.disabled = true;
    $incSave.textContent = 'Guardando…';

    try {
        const newId = await wireSaveMark(
            title, 'main', 'incident',
            pendingLocalPos.x, pendingLocalPos.y, pendingLocalPos.z,
            pendingLocalNormal.x, pendingLocalNormal.y, pendingLocalNormal.z
        );
        if (!newId || newId === 'fail') throw new Error('Servidor devolvió fail');

        const inc = {
            id: newId, title, priority: 1, status: 1,
            x: pendingLocalPos.x, y: pendingLocalPos.y, z: pendingLocalPos.z,
            normal_x: pendingLocalNormal.x, normal_y: pendingLocalNormal.y, normal_z: pendingLocalNormal.z,
        };
        incidentsData.push(inc);
        const mesh = createMarker(inc, priorityColor(inc.priority));
        incidentMarkers.push({ mesh, data: inc });
        updateMarkerScales();
        buildIncidentListUI();
        hideIncidentForm();
        showToast(`✅ Incidencia "${title}" guardada`, 'success');
    } catch (e) {
        console.error('Error guardando incidencia:', e);
        showToast('❌ Error al guardar', 'error');
    } finally {
        $incSave.disabled = false;
        $incSave.textContent = 'Guardar';
    }
}

async function deleteIncident(id) {
    try {
        await wireRemoveMark(id, 'incident');
        incidentsData = incidentsData.filter(i => i.id !== id);
        const idx = incidentMarkers.findIndex(m => m.data.id === id);
        if (idx !== -1) {
            const m = incidentMarkers[idx];
            arModel.remove(m.mesh);
            m.mesh.traverse(ch => {
                ch.geometry?.dispose();
                if (ch.material) (Array.isArray(ch.material) ? ch.material : [ch.material]).forEach(mt => mt.dispose());
            });
            incidentMarkers.splice(idx, 1);
        }
        buildIncidentListUI();
        showToast('🗑️ Incidencia eliminada', 'info');
    } catch (e) {
        console.error(e);
        showToast('❌ Error al eliminar', 'error');
    }
}

// --- UI Listado ---
function buildIncidentListUI() {
    if (!$incBody) return;
    if (!incidentsData.length) {
        $incBody.innerHTML = '<p class="ar-empty">No hay incidencias registradas</p>';
        return;
    }
    let h = '';
    for (const inc of incidentsData) {
        h += `
        <div class="ar-inc-item" data-id="${inc.id}">
            <div class="ar-inc-dot ${priorityClass(inc.priority)}"></div>
            <div class="ar-inc-info">
                <div class="ar-inc-title">${escHtml(inc.title)}</div>
                <div class="ar-inc-meta">${priorityLabel(inc.priority)} · ID ${inc.id}</div>
            </div>
            <button class="ar-inc-del" data-del-id="${inc.id}" title="Eliminar">🗑</button>
        </div>`;
    }
    $incBody.innerHTML = h;

    // Listeners de eliminación
    $incBody.querySelectorAll('[data-del-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteIncident(parseInt(btn.dataset.delId));
        });
    });
}

// --- Setup ---
function setupIncidentSystem() {
    $btnIncMode?.addEventListener('click', toggleIncidentMode);
    $btnIncList?.addEventListener('click', () => { buildIncidentListUI(); openPanel('incidents'); });
    $closeInc?.addEventListener('click', () => $panelInc?.classList.add('hidden'));
    $incSave?.addEventListener('click', submitIncident);
    $incCancel?.addEventListener('click', hideIncidentForm);
    $incTitle?.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { e.preventDefault(); submitIncident(); }
        if (e.key === 'Escape') hideIncidentForm();
    });
}

// ======================== D-PAD ========================
function setupDPad() {
    let dpadVisible = false;
    $btnDpad?.addEventListener('click', () => {
        dpadVisible = !dpadVisible;
        $dpad?.classList.toggle('hidden', !dpadVisible);
        $btnDpad?.classList.toggle('active', dpadVisible);
    });
    const step = 0.02;
    const map = {
        'ar-dpad-up':    [0, 0, -step],
        'ar-dpad-down':  [0, 0,  step],
        'ar-dpad-left':  [-step, 0, 0],
        'ar-dpad-right': [ step, 0, 0],
        'ar-dpad-rise':  [0,  step, 0],
        'ar-dpad-lower': [0, -step, 0],
    };
    for (const [id, [dx, dy, dz]] of Object.entries(map)) {
        document.getElementById(id)?.addEventListener('click', () => nudge(dx, dy, dz));
    }
    document.getElementById('ar-dpad-reset')?.addEventListener('click', resetPos);
}

function nudge(dx, dy, dz) {
    if (!arModel?.visible) return;
    arModel.position.x += dx;
    arModel.position.y += dy;
    arModel.position.z += dz;
    arModel.updateMatrixWorld(true);
}

function resetPos() {
    if (!arModel) return;
    arModel.position.set(0, 0, 0);
    arModel.rotation.set(0, 0, 0);
    arModel.scale.set(1, 1, 1);
    arModel.updateMatrixWorld(true);
    updateMarkerScales();
    showToast('🔄 Posición reseteada', 'info');
}

// ======================== OPACIDAD ========================
function setupOpacity() {
    document.getElementById('ar-opacity-slider')?.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        for (const [, model] of fragments.list) {
            try {
                model.meshes.forEach(mesh => mesh.traverse(ch => {
                    if (ch.isMesh && ch.material) {
                        (Array.isArray(ch.material) ? ch.material : [ch.material]).forEach(m => {
                            m.transparent = v < 1; m.opacity = v; m.needsUpdate = true;
                        });
                    }
                }));
            } catch (_) {}
        }
    });
}

// ======================== FILTROS ========================
function populateCategoryFilters() {
    const $cat = document.getElementById('ar-category-filters');
    if (!$cat || !fragments) return;
    const cats = new Set();
    for (const [, model] of fragments.list) {
        try {
            const ids = [...model.getLocalIds()];
            const data = model.getItemsData(ids, { attributesDefault: true });
            data.forEach(d => { if (d._category) cats.add(d._category); });
        } catch (_) {}
    }
    if (!cats.size) { $cat.innerHTML = '<p class="ar-empty">Sin categorías</p>'; return; }
    let h = '';
    for (const c of [...cats].sort()) {
        h += `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px">
            <input type="checkbox" value="${escHtml(c)}" checked /> ${escHtml(c)}
        </label>`;
    }
    $cat.innerHTML = h;
}

function setupFilters() {
    document.getElementById('ar-category-filters')?.addEventListener('change', () => {
        activeCategories.clear();
        document.querySelectorAll('#ar-category-filters input:checked').forEach(c => activeCategories.add(c.value));
        applyAllFilters();
    });
    document.getElementById('ar-prop-apply')?.addEventListener('click', () => {
        const k = document.getElementById('ar-prop-key')?.value?.trim();
        const o = document.getElementById('ar-prop-op')?.value || '=';
        const v = document.getElementById('ar-prop-val')?.value?.trim();
        if (k && v) { activePropertyFilters.push({ key: k, op: o, value: v }); applyAllFilters(); }
    });
    document.getElementById('ar-prop-clear')?.addEventListener('click', () => {
        activePropertyFilters = [];
        applyAllFilters();
    });
}

function applyAllFilters() {
    for (const [, model] of fragments.list) {
        try {
            const hider = model.hider;
            if (!hider) continue;
            const allIds = [...model.getLocalIds()];
            let visible = new Set(allIds);
            if (activeCategories.size) {
                const catIds = new Set();
                const data = model.getItemsData(allIds, { attributesDefault: true });
                data.filter(d => activeCategories.has(d._category)).forEach(d => catIds.add(d._localId));
                visible = new Set([...visible].filter(id => catIds.has(id)));
            }
            hider.set(false);
            if (visible.size < allIds.length) hider.set(true, [...visible]);
            fragments.core.update(true);
            filteredIds = visible;
            if (selectedBimElement && !visible.has(selectedBimElement.localId)) clearBimSelection(true);
        } catch (_) {}
    }
}

// ======================== PANELES (close buttons) ========================
function setupPanelCloseButtons() {
    document.querySelectorAll('.ar-panel-close[data-close]').forEach(btn => {
        btn.addEventListener('click', closeAllPanels);
    });
}

// ======================== ANIMACIÓN ========================
const clock = new THREE.Clock();

function animate(timestamp, frame) {
    if (!isAR) { renderer.render(scene, camera); return; }

    const session  = renderer.xr.getSession();
    const refSpace = renderer.xr.getReferenceSpace();

    if (session && refSpace && !hitTestRequested && !bimSelectMode && !incidentMode) {
        requestHitTest(session);
    }

    if (frame && hitTestSource && !bimSelectMode && !incidentMode) {
        const results = frame.getHitTestResults(hitTestSource);
        if (results.length) {
            const pose = results[0].getPose(refSpace);
            if (pose) { reticle.visible = true; reticle.matrix.fromArray(pose.transform.matrix); }
        } else {
            reticle.visible = false;
        }
    } else if (bimSelectMode || incidentMode) {
        reticle.visible = false;
    }

    // Animar marcadores
    const t = clock.getElapsedTime();
    arModel.children.forEach(c => {
        if (c.userData?.type !== 'marker') return;
        const ring = c.children[1];
        if (ring) {
            const pulse = 1 + 0.15 * Math.sin(t * 3 + (c.userData.id || 0));
            ring.scale.setScalar(pulse);
            ring.material.opacity = 0.2 + 0.15 * Math.sin(t * 3 + (c.userData.id || 0));
            ring.lookAt(camera.position);
        }
    });

    renderer.render(scene, camera);
}

// ======================== ENTRY ========================
initAR();
