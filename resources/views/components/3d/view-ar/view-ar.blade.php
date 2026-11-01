<div>
    <style>
        #ar-ui-container {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 1;
            --ar-fab-height: 92px;
        }

        /* =====================================================
           TOASTS
           ===================================================== */

        #ar-toast-container {
            position: absolute;
            top: max(16px, env(safe-area-inset-top));
            left: 50%;
            transform: translateX(-50%);
            width: min(92vw, 420px);
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
            z-index: 30;
        }

        .ar-toast {
            background: rgba(17, 17, 17, 0.92);
            color: white;
            border-radius: 10px;
            padding: 10px 16px;
            font-size: 13px;
            line-height: 1.3;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
            border-left: 4px solid #2563eb;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .ar-toast-show {
            opacity: 1;
            transform: translateY(0);
        }

        .ar-toast-success { border-left-color: #22c55e; }
        .ar-toast-error   { border-left-color: #ef4444; }
        .ar-toast-info    { border-left-color: #2563eb; }

        /* =====================================================
           PANELES FLOTANTES
           ===================================================== */

        .ar-floating-panel {
            position: absolute;
            left: 50%;
            bottom: calc(var(--ar-fab-height) + 14px);
            transform: translateX(-50%) translateY(16px);
            width: min(92vw, 380px);
            max-height: 50vh;
            background: rgba(17, 17, 17, 0.94);
            border-radius: 14px;
            color: white;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity 0.2s ease, transform 0.2s ease;
            z-index: 20;
        }

        .ar-floating-panel.ar-panel-open {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(0);
            pointer-events: auto;
            z-index: 26;
        }

        .ar-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            font-weight: bold;
            flex-shrink: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ar-panel-close {
            background: transparent;
            border: none;
            color: white;
            font-size: 16px;
            padding: 4px 8px;
            line-height: 1;
            touch-action: manipulation;
        }

        .ar-panel-body {
            padding: 14px 16px;
            overflow-y: auto;
            touch-action: pan-y;
            -webkit-overflow-scrolling: touch;
        }

        /* =====================================================
           FAB BAR
           ===================================================== */

        #ar-fab-bar {
            position: absolute;
            left: 50%;
            bottom: max(20px, env(safe-area-inset-bottom));
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            pointer-events: auto;
            z-index: 25;
            flex-wrap: nowrap;
            overflow-x: auto;
            max-width: 95vw;
            padding: 2px;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }

        #ar-fab-bar::-webkit-scrollbar { display: none; }

        .ar-fab {
            position: relative;
            flex-shrink: 0;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: rgba(17, 17, 17, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: white;
            font-size: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
            transition: background 0.2s ease, transform 0.15s ease;
            touch-action: manipulation;
        }

        .ar-fab:active { transform: scale(0.92); }

        .ar-fab.active {
            background: #2563eb;
            border-color: #2563eb;
        }

        /* Botón BIM select activo → ámbar */
        #ar-btn-bim-select.active {
            background: #f59e0b;
            border-color: #f59e0b;
            color: #111;
        }

        .ar-fab-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            min-width: 20px;
            height: 20px;
            padding: 0 4px;
            background: #ef4444;
            border-radius: 10px;
            font-size: 11px;
            font-weight: bold;
            display: none;
            align-items: center;
            justify-content: center;
            border: 2px solid #111;
        }

        /* =====================================================
           CONTENIDO INTERNO DE LOS PANELES
           ===================================================== */

        .ar-filter-section select {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 6px;
            padding: 8px 12px;
            width: 100%;
            margin-bottom: 10px;
            touch-action: manipulation;
        }

        .ar-filter-section select option {
            background: #1a1a1a;
            color: white;
        }

        .ar-filter-buttons {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }

        .ar-filter-buttons button {
            flex: 1;
            padding: 8px;
            border-radius: 6px;
            font-size: 12px;
            touch-action: manipulation;
        }

        .ar-filter-chip {
            background: rgba(37, 99, 235, 0.3);
            border: 1px solid rgba(37, 99, 235, 0.5);
            border-radius: 6px;
            padding: 6px 10px;
            margin-bottom: 6px;
        }

        .ar-filter-chip .ar-filter-remove {
            color: white;
            background: transparent;
            border: none;
            padding: 0;
            margin-left: 5px;
            touch-action: manipulation;
        }

        .ar-category-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            margin-bottom: 6px;
        }

        .ar-category-item input {
            accent-color: #2563eb;
            touch-action: manipulation;
        }

        .ar-category-item span:first-of-type { font-size: 13px; }

        .ar-categories-scroll {
            max-height: 100%;
            overflow-y: auto;
        }

        /* =====================================================
           CORRECCIÓN DE POSICIÓN (D-PAD)
           ===================================================== */

        .ar-dpad-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }

        .ar-dpad {
            display: grid;
            grid-template-columns: 60px 60px 60px;
            grid-template-rows: 60px 60px 60px;
            grid-template-areas:
                ".    up    ."
                "left center right"
                ".    down  .";
            gap: 6px;
        }

        .ar-dpad-btn {
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
        }

        .ar-dpad-btn:active {
            background: #2563eb;
            border-color: #2563eb;
        }

        .ar-dpad-up    { grid-area: up; }
        .ar-dpad-down  { grid-area: down; }
        .ar-dpad-left  { grid-area: left; }
        .ar-dpad-right { grid-area: right; }

        .ar-dpad-center {
            grid-area: center;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            text-align: center;
            color: rgba(255, 255, 255, 0.45);
            line-height: 1.2;
            padding: 4px;
        }

        .ar-step-group {
            display: flex;
            gap: 6px;
            width: 100%;
        }

        .ar-step-btn {
            flex: 1;
            padding: 8px 4px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            font-size: 11px;
            touch-action: manipulation;
        }

        .ar-step-btn.active {
            background: #2563eb;
            border-color: #2563eb;
        }

        .ar-position-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
        }

        .ar-position-reset-btn,
        .ar-position-relocate-btn {
            width: 100%;
            padding: 10px;
            border-radius: 6px;
            touch-action: manipulation;
        }

        .ar-position-reset-btn {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #ef4444;
        }

        .ar-position-relocate-btn {
            background: rgba(34, 197, 94, 0.15);
            border: 1px solid rgba(34, 197, 94, 0.4);
            color: #22c55e;
        }

        .ar-position-hint {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            text-align: center;
            margin: 0;
        }

        .ar-position-status {
            font-size: 11px;
            text-align: center;
            margin: 0;
            padding: 6px 10px;
            border-radius: 6px;
            background: rgba(34, 197, 94, 0.15);
            color: #22c55e;
        }

        .ar-position-status.searching {
            background: rgba(37, 99, 235, 0.15);
            color: #60a5fa;
        }

        /* =====================================================
           PANEL INFO BIM
           ===================================================== */

        .ar-bim-info-title {
            font-size: 15px;
            font-weight: 700;
            color: #f59e0b;
            margin-bottom: 10px;
            word-break: break-word;
        }

        .ar-bim-info-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding: 6px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            font-size: 12px;
        }

        .ar-bim-info-label {
            color: rgba(255, 255, 255, 0.55);
            flex-shrink: 0;
            max-width: 42%;
        }

        .ar-bim-info-value {
            color: white;
            text-align: right;
            word-break: break-word;
            flex: 1;
        }

        .ar-bim-info-section { margin-top: 10px; }

        .ar-bim-info-section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 10px;
            background: rgba(255, 255, 255, 0.07);
            border-radius: 6px;
            font-size: 12.5px;
            font-weight: 600;
            touch-action: manipulation;
            user-select: none;
            -webkit-user-select: none;
        }

        .ar-bim-info-section-header:active {
            background: rgba(255, 255, 255, 0.14);
        }

        .ar-bim-info-section-body { padding: 2px 10px; }

        .ar-bim-deselect-btn {
            width: 100%;
            margin-top: 14px;
            padding: 9px;
            border-radius: 6px;
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #ef4444;
            font-size: 12px;
            touch-action: manipulation;
        }

        /* =====================================================
           INDICADOR MODO SELECCIÓN + CROSSHAIR
           ===================================================== */

        .ar-bim-select-indicator {
            position: absolute;
            top: max(64px, calc(env(safe-area-inset-top) + 56px));
            left: 50%;
            transform: translateX(-50%);
            background: rgba(245, 158, 11, 0.92);
            color: #111;
            font-size: 12px;
            font-weight: 700;
            padding: 7px 16px;
            border-radius: 20px;
            pointer-events: none;
            z-index: 28;
            display: none;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
            white-space: nowrap;
        }

        .ar-bim-select-indicator.visible { display: block; }

        #ar-crosshair {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 44px;
            height: 44px;
            pointer-events: none;
            z-index: 18;
            display: none;
        }

        #ar-crosshair.visible { display: block; }

        #ar-crosshair .ch-line-h,
        #ar-crosshair .ch-line-v {
            position: absolute;
            background: #f59e0b;
            box-shadow: 0 0 4px rgba(0, 0, 0, 0.7);
        }

        #ar-crosshair .ch-line-h {
            top: 50%;
            left: 0;
            right: 0;
            height: 2px;
            margin-top: -1px;
        }

        #ar-crosshair .ch-line-v {
            left: 50%;
            top: 0;
            bottom: 0;
            width: 2px;
            margin-left: -1px;
        }

        #ar-crosshair .ch-dot {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 8px;
            height: 8px;
            margin: -4px 0 0 -4px;
            border-radius: 50%;
            background: #f59e0b;
            border: 1px solid rgba(0, 0, 0, 0.5);
        }

        #ar-crosshair.busy .ch-dot { background: #22c55e; }
    </style>

    <div id="viewer"
         class="viewport"
         data-url="{{ route('app.Attachment', 1) }}"
         data-type="{{ $model->model->type }}">
    </div>

    <div id="ar-ui-container">

        <!-- TOASTS -->
        <div id="ar-toast-container"></div>

        <!-- INDICADOR MODO SELECCIÓN BIM -->
        <div id="ar-bim-select-indicator" class="ar-bim-select-indicator">
            🎯 Apunta y toca para seleccionar
        </div>

        <!-- CROSSHAIR -->
        <div id="ar-crosshair">
            <div class="ch-line-h"></div>
            <div class="ch-line-v"></div>
            <div class="ch-dot"></div>
        </div>

        <!-- PANEL: OPACIDAD -->
        <div id="ar-panel-opacity" class="ar-floating-panel">
            <div class="ar-panel-header">
                <span><i class="bi bi-droplet-half me-2"></i>Opacidad</span>
                <button type="button" class="ar-panel-close">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div class="ar-panel-body">
                <div class="d-flex align-items-center gap-3">
                    <input type="range"
                           id="ar-opacity"
                           min="0" max="100" value="100" step="1"
                           style="flex: 1; touch-action: manipulation;">
                    <span id="ar-opacity-value"
                          style="min-width: 48px; text-align: right;">100%</span>
                </div>
            </div>
        </div>

        <!-- PANEL: FILTRO POR PROPIEDADES -->
        <div id="ar-panel-properties" class="ar-floating-panel">
            <div class="ar-panel-header">
                <span><i class="bi bi-funnel me-2"></i>Filtrar propiedades</span>
                <button type="button" class="ar-panel-close">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div class="ar-panel-body ar-filter-section">
                <select id="ar-property-key">
                    <option value="">Seleccionar propiedad</option>
                </select>

                <select id="ar-property-value" disabled>
                    <option value="">Seleccionar valor</option>
                </select>

                <div class="ar-filter-buttons">
                    <button type="button" id="ar-apply-property"
                            class="btn btn-primary btn-sm" disabled>Aplicar</button>
                    <button type="button" id="ar-clear-property"
                            class="btn btn-secondary btn-sm">Limpiar</button>
                </div>

                <div id="ar-property-filters" class="mt-3">
                    <div class="small text-white-50">Sin filtros activos</div>
                </div>
            </div>
        </div>

        <!-- PANEL: CATEGORÍAS -->
        <div id="ar-panel-categories" class="ar-floating-panel">
            <div class="ar-panel-header">
                <span><i class="bi bi-layers me-2"></i>Categorías IFC</span>
                <button type="button" class="ar-panel-close">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div class="ar-panel-body">
                <div id="ar-categories-container" class="ar-categories-scroll"></div>
            </div>
        </div>

        <!-- PANEL: POSICIÓN -->
        <div id="ar-panel-position" class="ar-floating-panel">
            <div class="ar-panel-header">
                <span><i class="bi bi-arrows-move me-2"></i>Ajustar posición</span>
                <button type="button" class="ar-panel-close">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div class="ar-panel-body">
                <div class="ar-dpad-wrapper">

                    <p id="ar-position-status" class="ar-position-status searching">
                        🔍 Buscando superficie...
                    </p>

                    <div class="ar-dpad">
                        <button type="button" class="ar-dpad-btn ar-dpad-up"
                                data-direction="up"><i class="bi bi-arrow-up"></i></button>

                        <button type="button" class="ar-dpad-btn ar-dpad-left"
                                data-direction="left"><i class="bi bi-arrow-left"></i></button>

                        <div class="ar-dpad-center">Mantén<br>presionado</div>

                        <button type="button" class="ar-dpad-btn ar-dpad-right"
                                data-direction="right"><i class="bi bi-arrow-right"></i></button>

                        <button type="button" class="ar-dpad-btn ar-dpad-down"
                                data-direction="down"><i class="bi bi-arrow-down"></i></button>
                    </div>

                    <p class="ar-position-hint">
                        Izquierda/derecha se mueven según hacia dónde apunta la cámara
                    </p>

                    <div class="ar-step-group">
                        <button type="button" class="ar-step-btn" data-step="0.01">Fino<br>1cm</button>
                        <button type="button" class="ar-step-btn active" data-step="0.03">Normal<br>3cm</button>
                        <button type="button" class="ar-step-btn" data-step="0.08">Grueso<br>8cm</button>
                    </div>

                    <div class="ar-position-actions">
                        <button type="button" id="ar-reset-position" class="ar-position-reset-btn">
                            <i class="bi bi-arrow-counterclockwise me-2"></i>
                            Volver al anclaje original
                        </button>

                        <button type="button" id="ar-relocate-model" class="ar-position-relocate-btn">
                            <i class="bi bi-geo-alt me-2"></i>
                            Reubicar en otra superficie
                        </button>
                    </div>

                </div>
            </div>
        </div>

        <!-- PANEL: INFO DEL ELEMENTO BIM -->
        <div id="ar-panel-bim-info" class="ar-floating-panel">
            <div class="ar-panel-header">
                <span><i class="bi bi-info-circle me-2"></i>Elemento BIM</span>
                <button type="button" class="ar-panel-close" id="ar-close-bim-info">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div class="ar-panel-body" id="ar-bim-info-body">
                <div class="small text-white-50 text-center py-3">
                    Selecciona un elemento para ver sus propiedades
                </div>
            </div>
        </div>

        <!-- FAB BAR -->
        <div id="ar-fab-bar">

            <button type="button" class="ar-fab" data-panel="opacity" title="Opacidad">
                <i class="bi bi-droplet-half"></i>
            </button>

            <button type="button" class="ar-fab" data-panel="categories" title="Categorías">
                <i class="bi bi-layers"></i>
                <span class="ar-fab-badge" id="ar-fab-badge-categories">0</span>
            </button>

            <button type="button" class="ar-fab" data-panel="properties" title="Filtrar">
                <i class="bi bi-funnel"></i>
                <span class="ar-fab-badge" id="ar-fab-badge-properties">0</span>
            </button>

            <button type="button" class="ar-fab" data-panel="position" title="Ajustar posición">
                <i class="bi bi-arrows-move"></i>
            </button>

            <!-- 🆕 BOTÓN SELECCIÓN BIM -->
            <button type="button" id="ar-btn-bim-select" class="ar-fab"
                    title="Seleccionar elemento BIM">
                <i class="bi bi-crosshair"></i>
            </button>

            <!-- 🆕 BOTÓN VER INFO (abre el último seleccionado) -->
            <button type="button" class="ar-fab" data-panel="bim-info" title="Info elemento">
                <i class="bi bi-info-circle"></i>
            </button>

            <button type="button" id="ar-reset-filters" class="ar-fab" title="Reiniciar filtros">
                <i class="bi bi-arrow-counterclockwise"></i>
            </button>

        </div>

    </div>
</div>
