<div>
    {{-- ============================================================
         CONTENEDOR PRINCIPAL AR
         ============================================================ --}}
    <div id="ar-container"
         class="viewport"
         data-url="{{ route('app.Attachment', $model->id) }}"
         data-type="{{ $model->model->type }}"
         data-model-id="{{ $model->id }}"
         data-project-id="{{ $project->id }}"
         data-anchor-x="{{ $currentAnchor['x'] ?? 0 }}"
         data-anchor-y="{{ $currentAnchor['y'] ?? 0 }}"
         data-anchor-z="{{ $currentAnchor['z'] ?? 0 }}"
         data-anchor-nx="{{ $currentAnchor['normal_x'] ?? 0 }}"
         data-anchor-ny="{{ $currentAnchor['normal_y'] ?? 0 }}"
         data-anchor-nz="{{ $currentAnchor['normal_z'] ?? 0 }}"
         data-incidents='@json($incidents)'
         data-anchors='@json($anchors)'>
    </div>

    {{-- ============================================================
         OVERLAY AR  (dom-overlay root para WebXR)
         ============================================================ --}}
    <div id="ar-ui-container" class="ar-overlay">

        {{-- Toasts --}}
        <div id="ar-toast-container" class="ar-toast-container"></div>

        {{-- Indicador BIM --}}
        <div id="ar-bim-select-indicator" class="ar-indicator ar-indicator-bim hidden">
            🎯 Apunta y toca para seleccionar
        </div>

        {{-- Indicador Incidencia --}}
        <div id="ar-incident-indicator" class="ar-indicator ar-indicator-inc hidden">
            🚩 Toca sobre el modelo para colocar una incidencia
        </div>

        {{-- Crosshair BIM --}}
        <div id="ar-crosshair-bim" class="ar-crosshair ar-crosshair-bim hidden">
            <div class="ch-h"></div>
            <div class="ch-v"></div>
            <div class="ch-dot"></div>
        </div>

        {{-- Crosshair Incidencia --}}
        <div id="ar-crosshair-inc" class="ar-crosshair ar-crosshair-inc hidden">
            <div class="ch-h"></div>
            <div class="ch-v"></div>
            <div class="ch-dot"></div>
        </div>

        {{-- ========================================================
             FORMULARIO MODAL DE INCIDENCIA
             ======================================================== --}}
        <div id="ar-incident-form" class="ar-modal-overlay hidden">
            <div class="ar-form-card">
                <h3>🚩 Nueva Incidencia</h3>
                <label for="ar-inc-title">Título</label>
                <input type="text" id="ar-inc-title"
                       placeholder="Describe la incidencia…"
                       maxlength="120" autocomplete="off" />
                <div class="ar-form-actions">
                    <button id="ar-inc-cancel" class="ar-btn-secondary">Cancelar</button>
                    <button id="ar-inc-save"   class="ar-btn-primary">Guardar</button>
                </div>
            </div>
        </div>

        {{-- ========================================================
             PANELES FLOTANTES
             ======================================================== --}}

        {{-- Panel Opacidad --}}
        <div id="ar-panel-opacity" class="ar-panel hidden">
            <div class="ar-panel-header">
                <h3><i class="bi bi-droplet-half"></i> Opacidad</h3>
                <button class="ar-panel-close" data-close>&times;</button>
            </div>
            <div class="ar-panel-body">
                <input type="range" id="ar-opacity-slider" min="0.1" max="1" step="0.05" value="1" />
            </div>
        </div>

        {{-- Panel Categorías --}}
        <div id="ar-panel-categories" class="ar-panel hidden">
            <div class="ar-panel-header">
                <h3><i class="bi bi-layers"></i> Categorías</h3>
                <button class="ar-panel-close" data-close>&times;</button>
            </div>
            <div id="ar-category-filters" class="ar-panel-body">
                <p class="ar-empty">Cargando…</p>
            </div>
        </div>

        {{-- Panel Propiedades --}}
        <div id="ar-panel-properties" class="ar-panel hidden">
            <div class="ar-panel-header">
                <h3><i class="bi bi-funnel"></i> Filtros</h3>
                <button class="ar-panel-close" data-close>&times;</button>
            </div>
            <div class="ar-panel-body">
                <input type="text" id="ar-prop-key" placeholder="Propiedad (ej: FireRating)" />
                <select id="ar-prop-op">
                    <option value="=">=</option>
                    <option value="!=">!=</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                </select>
                <input type="text" id="ar-prop-val" placeholder="Valor" />
                <div class="ar-form-actions" style="margin-top:8px">
                    <button id="ar-prop-apply" class="ar-btn-primary">Aplicar</button>
                    <button id="ar-prop-clear" class="ar-btn-secondary">Limpiar</button>
                </div>
            </div>
        </div>

        {{-- Panel BIM Info --}}
        <div id="ar-panel-bim-info" class="ar-panel hidden">
            <div class="ar-panel-header">
                <h3><i class="bi bi-info-circle"></i> Propiedades BIM</h3>
                <button class="ar-panel-close" id="ar-close-bim-info">&times;</button>
            </div>
            <div id="ar-bim-info-body" class="ar-panel-body">
                <p class="ar-empty">Selecciona un elemento</p>
            </div>
        </div>

        {{-- Panel Incidencias --}}
        <div id="ar-panel-incidents" class="ar-panel hidden">
            <div class="ar-panel-header">
                <h3><i class="bi bi-exclamation-triangle-fill"></i> Incidencias</h3>
                <button class="ar-panel-close" id="ar-close-incidents">&times;</button>
            </div>
            <div id="ar-incidents-body" class="ar-panel-body">
                <p class="ar-empty">Cargando…</p>
            </div>
        </div>

        {{-- ========================================================
             D-PAD
             ======================================================== --}}
        <div id="ar-dpad" class="ar-dpad hidden">
            <button id="ar-dpad-rise"  class="dpad-btn dpad-rise"  title="Subir">▲</button>
            <button id="ar-dpad-left"  class="dpad-btn dpad-left"  title="Izquierda">◀</button>
            <button id="ar-dpad-reset" class="dpad-btn dpad-reset" title="Reset">⊙</button>
            <button id="ar-dpad-right" class="dpad-btn dpad-right" title="Derecha">▶</button>
            <button id="ar-dpad-lower" class="dpad-btn dpad-lower" title="Bajar">▼</button>
            <button id="ar-dpad-up"    class="dpad-btn dpad-up"    title="Adelante">⬆</button>
            <button id="ar-dpad-down"  class="dpad-btn dpad-down"  title="Atrás">⬇</button>
        </div>

        {{-- ========================================================
             FAB BAR
             ======================================================== --}}
        <div class="ar-fab-bar">
            <button class="ar-fab" id="ar-btn-dpad" title="Mover modelo">
                <i class="bi bi-arrows-move"></i>
            </button>
            <button class="ar-fab" id="ar-btn-opacity" data-panel="opacity" title="Opacidad">
                <i class="bi bi-droplet-half"></i>
            </button>
            <button class="ar-fab" id="ar-btn-categories" data-panel="categories" title="Categorías">
                <i class="bi bi-layers"></i>
            </button>
            <button class="ar-fab" id="ar-btn-properties" data-panel="properties" title="Filtros">
                <i class="bi bi-funnel"></i>
            </button>
            <button class="ar-fab" id="ar-btn-bim-select" title="Selección BIM">
                <i class="bi bi-crosshair"></i>
            </button>
            <button class="ar-fab" id="ar-btn-bim-info" data-panel="bim-info" title="Info BIM">
                <i class="bi bi-info-circle"></i>
            </button>
            <button class="ar-fab" id="ar-btn-incident-mode" title="Colocar incidencia">
                <i class="bi bi-geo-alt-fill"></i>
            </button>
            <button class="ar-fab" id="ar-btn-incident-list" data-panel="incidents" title="Listar incidencias">
                <i class="bi bi-exclamation-triangle-fill"></i>
            </button>
        </div>
    </div>

    {{-- ============================================================
         ESTILOS
         ============================================================ --}}
    <style>
        /* ---- Reset & Base ---- */
        :root { --ar-fab-height: 64px; }
        * { box-sizing: border-box; }
        .viewport { position: fixed; inset: 0; z-index: 0; }
        .ar-overlay {
            position: fixed; inset: 0; z-index: 10000;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .ar-overlay > * { pointer-events: auto; }

        /* ---- Toasts ---- */
        .ar-toast-container {
            position: fixed; top: calc(env(safe-area-inset-top, 12px) + 8px);
            left: 50%; transform: translateX(-50%);
            display: flex; flex-direction: column; gap: 6px;
            z-index: 10060; pointer-events: none; width: min(360px, 92vw);
        }
        .ar-toast {
            padding: 10px 16px; border-radius: 10px; font-size: 13px;
            font-weight: 600; color: #fff; text-align: center;
            opacity: 0; transform: translateY(-12px);
            transition: all .3s ease; pointer-events: auto;
            backdrop-filter: blur(8px);
        }
        .ar-toast.show { opacity: 1; transform: translateY(0); }
        .ar-toast-info    { background: rgba(59,130,246,.9); }
        .ar-toast-success { background: rgba(34,197,94,.9); }
        .ar-toast-warning { background: rgba(245,158,11,.9); color: #111; }
        .ar-toast-error   { background: rgba(239,68,68,.9); }

        /* ---- Indicadores ---- */
        .ar-indicator {
            position: fixed; top: calc(env(safe-area-inset-top, 12px) + 50px);
            left: 50%; transform: translateX(-50%);
            padding: 8px 18px; border-radius: 20px;
            font-size: 13px; font-weight: 600; z-index: 10010;
            pointer-events: none; backdrop-filter: blur(6px); white-space: nowrap;
        }
        .ar-indicator.hidden { display: none; }
        .ar-indicator-bim { background: rgba(245,158,11,.92); color: #111; }
        .ar-indicator-inc { background: rgba(239,68,68,.92); color: #fff; }

        /* ---- Crosshairs ---- */
        .ar-crosshair {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none; z-index: 10005;
        }
        .ar-crosshair.hidden { display: none; }
        .ar-crosshair .ch-h, .ar-crosshair .ch-v { position: absolute; }
        .ar-crosshair .ch-h { width: 28px; height: 2px; top: 50%; left: 50%; transform: translate(-50%,-50%); }
        .ar-crosshair .ch-v { width: 2px; height: 28px; top: 50%; left: 50%; transform: translate(-50%,-50%); }
        .ar-crosshair .ch-dot {
            width: 6px; height: 6px; border-radius: 50%;
            position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
        }
        .ar-crosshair-bim .ch-h, .ar-crosshair-bim .ch-v { background: #f59e0b; }
        .ar-crosshair-bim .ch-dot { background: #f59e0b; }
        .ar-crosshair-inc .ch-h, .ar-crosshair-inc .ch-v { background: #ef4444; }
        .ar-crosshair-inc .ch-dot { background: #ef4444; }
        .ar-crosshair.busy .ch-dot { background: #22c55e !important; }

        /* ---- Modal Formulario ---- */
        .ar-modal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,.55);
            z-index: 10050; display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(3px);
        }
        .ar-modal-overlay.hidden { display: none; }
        .ar-form-card {
            background: #1e1e2e; color: #e2e8f0; border-radius: 16px;
            padding: 24px 20px; width: min(340px, 90vw);
            box-shadow: 0 12px 40px rgba(0,0,0,.5);
        }
        .ar-form-card h3 { margin: 0 0 16px; font-size: 17px; text-align: center; }
        .ar-form-card label { display: block; font-size: 12px; color: #94a3b8; margin: 10px 0 4px; }
        .ar-form-card input, .ar-form-card select {
            width: 100%; padding: 10px 12px; border: 1px solid #334155;
            border-radius: 8px; background: #0f172a; color: #e2e8f0;
            font-size: 14px; outline: none;
        }
        .ar-form-card input:focus { border-color: #ef4444; }
        .ar-form-actions { display: flex; gap: 10px; margin-top: 18px; }
        .ar-btn-primary {
            flex: 1; padding: 10px; border: none; border-radius: 8px;
            font-weight: 700; background: #ef4444; color: #fff; font-size: 14px; cursor: pointer;
        }
        .ar-btn-primary:active { background: #dc2626; }
        .ar-btn-primary:disabled { opacity: .5; }
        .ar-btn-secondary {
            flex: 1; padding: 10px; border: 1px solid #475569; border-radius: 8px;
            background: transparent; color: #94a3b8; font-size: 14px; cursor: pointer;
        }

        /* ---- Paneles ---- */
        .ar-panel {
            position: fixed; left: 8px; right: 8px;
            bottom: calc(var(--ar-fab-height, 64px) + 14px);
            max-height: 45vh; background: rgba(15,23,42,.94); color: #e2e8f0;
            border-radius: 16px; z-index: 10020; display: flex; flex-direction: column;
            backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.08); overflow: hidden;
        }
        .ar-panel.hidden { display: none; }
        .ar-panel-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .ar-panel-header h3 { margin: 0; font-size: 15px; }
        .ar-panel-close {
            background: none; border: none; color: #94a3b8;
            font-size: 22px; cursor: pointer; padding: 0 4px;
        }
        .ar-panel-body { overflow-y: auto; padding: 10px 14px; flex: 1; }
        .ar-empty { color: #64748b; text-align: center; font-size: 13px; padding: 20px 0; }

        /* ---- BIM Info ---- */
        .ar-bim-section { margin-bottom: 8px; }
        .ar-bim-row {
            display: flex; justify-content: space-between; padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,.05); font-size: 13px;
        }
        .ar-bim-key { color: #94a3b8; flex-shrink: 0; margin-right: 12px; }
        .ar-bim-val { color: #e2e8f0; text-align: right; word-break: break-all; }
        .ar-bim-pset { margin: 6px 0; }
        .ar-bim-pset summary {
            cursor: pointer; font-size: 13px; font-weight: 600;
            color: #60a5fa; padding: 6px 0;
        }
        .ar-bim-deselect-btn {
            width: 100%; margin-top: 12px; padding: 8px; border: 1px solid #475569;
            border-radius: 8px; background: transparent; color: #94a3b8;
            font-size: 13px; cursor: pointer;
        }

        /* ---- Incidencias Listado ---- */
        .ar-inc-item {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .ar-inc-item:last-child { border-bottom: none; }
        .ar-inc-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .ar-inc-dot.p1 { background: #facc15; }
        .ar-inc-dot.p2 { background: #f97316; }
        .ar-inc-dot.p3 { background: #ef4444; }
        .ar-inc-info { flex: 1; min-width: 0; }
        .ar-inc-title {
            font-size: 13px; font-weight: 600;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ar-inc-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
        .ar-inc-del {
            background: none; border: none; color: #ef4444; font-size: 16px;
            cursor: pointer; padding: 4px 8px;
        }

        /* ---- D-Pad ---- */
        .ar-dpad {
            position: fixed; bottom: calc(var(--ar-fab-height, 64px) + 14px);
            right: 12px; display: grid;
            grid-template-columns: repeat(3, 42px);
            grid-template-rows: repeat(3, 42px);
            gap: 4px; z-index: 10015;
        }
        .ar-dpad.hidden { display: none; }
        .dpad-btn {
            width: 42px; height: 42px; border-radius: 10px;
            background: rgba(15,23,42,.85); color: #e2e8f0;
            border: 1px solid rgba(255,255,255,.12); font-size: 16px;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .dpad-btn:active { background: rgba(59,130,246,.6); }
        .dpad-rise  { grid-column: 2; grid-row: 1; }
        .dpad-left  { grid-column: 1; grid-row: 2; }
        .dpad-reset { grid-column: 2; grid-row: 2; }
        .dpad-right { grid-column: 3; grid-row: 2; }
        .dpad-lower { grid-column: 2; grid-row: 3; }
        .dpad-up    { grid-column: 1; grid-row: 1; }
        .dpad-down  { grid-column: 3; grid-row: 3; }

        /* ---- FAB Bar ---- */
        .ar-fab-bar {
            position: fixed; bottom: 0; left: 0; right: 0;
            display: flex; gap: 6px; padding: 10px 8px;
            padding-bottom: calc(env(safe-area-inset-bottom, 8px) + 10px);
            background: rgba(15,23,42,.88); backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255,255,255,.08);
            overflow-x: auto; z-index: 10030;
            -webkit-overflow-scrolling: touch;
        }
        .ar-fab {
            flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px;
            background: rgba(255,255,255,.08); color: #e2e8f0;
            border: 1px solid rgba(255,255,255,.1); font-size: 18px;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            transition: all .2s;
        }
        .ar-fab:active { transform: scale(.92); }
        .ar-fab.active { background: #f59e0b; color: #111; border-color: #f59e0b; }
        #ar-btn-incident-mode.active { background: #ef4444; color: #fff; border-color: #ef4444; }
    </style>
</div>
