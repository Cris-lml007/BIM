<div>
    <style>
        #ar-ui-container {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 1;
        }

        /* =====================================================
           TOASTS (notificaciones de estado)
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

        .ar-toast-success {
            border-left-color: #22c55e;
        }

        .ar-toast-error {
            border-left-color: #ef4444;
        }

        .ar-toast-info {
            border-left-color: #2563eb;
        }

        /* =====================================================
           PANELES FLOTANTES
           ===================================================== */

        .ar-floating-panel {
            position: absolute;
            left: 50%;
            bottom: 92px;
            transform: translateX(-50%) translateY(16px);
            width: min(92vw, 380px);
            max-height: 55vh;
            background: rgba(17, 17, 17, 0.92);
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
        }

        .ar-panel-body {
            padding: 14px 16px;
            overflow-y: auto;
        }

        /* =====================================================
           FAB BAR (barra de botones inferior)
           ===================================================== */

        #ar-fab-bar {
            position: absolute;
            left: 50%;
            bottom: max(20px, env(safe-area-inset-bottom));
            transform: translateX(-50%);
            display: flex;
            gap: 14px;
            pointer-events: auto;
            z-index: 25;
        }

        .ar-fab {
            position: relative;
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
        }

        .ar-fab:active {
            transform: scale(0.92);
        }

        .ar-fab.active {
            background: #2563eb;
            border-color: #2563eb;
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
           (filtros, categorías, chips)
           ===================================================== */

        .ar-filter-section select {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 6px;
            padding: 8px 12px;
            width: 100%;
            margin-bottom: 10px;
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
        }

        .ar-filter-chip .ar-filter-remove:hover {
            color: #ef4444;
        }

        .ar-category-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            margin-bottom: 6px;
            transition: background 0.2s;
        }

        .ar-category-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .ar-category-item input {
            accent-color: #2563eb;
        }

        .ar-category-item span:first-of-type {
            font-size: 13px;
        }

        .ar-categories-scroll {
            max-height: 100%;
            overflow-y: auto;
        }
    </style>

    <div id="viewer"
         class="viewport"
         data-url="{{ route('app.Attachment', 1) }}"
         data-type="{{ $model->model->type }}">
    </div>

    <div id="ar-ui-container">

        <!-- ================================================= -->
        <!-- TOASTS -->
        <!-- ================================================= -->

        <div id="ar-toast-container"></div>

        <!-- ================================================= -->
        <!-- PANEL: OPACIDAD -->
        <!-- ================================================= -->

        <div id="ar-panel-opacity" class="ar-floating-panel">
            <div class="ar-panel-header">
                <span><i class="bi bi-droplet-half me-2"></i>Opacidad</span>
                <button type="button" class="ar-panel-close">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div class="ar-panel-body">
                <div class="d-flex align-items-center gap-3">
                    <input
                        type="range"
                        id="ar-opacity"
                        min="0"
                        max="100"
                        value="100"
                        step="1"
                        style="flex: 1;"
                    >
                    <span id="ar-opacity-value" style="min-width: 48px; text-align: right;">
                        100%
                    </span>
                </div>
            </div>
        </div>

        <!-- ================================================= -->
        <!-- PANEL: PROPIEDADES -->
        <!-- ================================================= -->

        <div id="ar-panel-properties" class="ar-floating-panel">
            <div class="ar-panel-header">
                <span><i class="bi bi-funnel me-2"></i>Propiedades</span>
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
                    <button
                        type="button"
                        id="ar-apply-property"
                        class="btn btn-primary btn-sm"
                        disabled>
                        Aplicar
                    </button>
                    <button
                        type="button"
                        id="ar-clear-property"
                        class="btn btn-secondary btn-sm">
                        Limpiar
                    </button>
                </div>

                <div id="ar-property-filters" class="mt-3">
                    <div class="small text-white-50">
                        Sin filtros activos
                    </div>
                </div>
            </div>
        </div>

        <!-- ================================================= -->
        <!-- PANEL: CATEGORÍAS -->
        <!-- ================================================= -->

        <div id="ar-panel-categories" class="ar-floating-panel">
            <div class="ar-panel-header">
                <span><i class="bi bi-layers me-2"></i>Categorías IFC</span>
                <button type="button" class="ar-panel-close">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div class="ar-panel-body">
                <div id="ar-categories-container" class="ar-categories-scroll">
                    <!-- Se llena dinámicamente -->
                </div>
            </div>
        </div>

        <!-- ================================================= -->
        <!-- FAB BAR -->
        <!-- ================================================= -->

        <div id="ar-fab-bar">

            <button type="button" class="ar-fab" data-panel="opacity" title="Opacidad">
                <i class="bi bi-droplet-half"></i>
            </button>

            <button type="button" class="ar-fab" data-panel="categories" title="Categorías">
                <i class="bi bi-layers"></i>
                <span class="ar-fab-badge" id="ar-fab-badge-categories">0</span>
            </button>

            <button type="button" class="ar-fab" data-panel="properties" title="Propiedades">
                <i class="bi bi-funnel"></i>
                <span class="ar-fab-badge" id="ar-fab-badge-properties">0</span>
            </button>

            <button type="button" id="ar-reset-filters" class="ar-fab" title="Reiniciar filtros">
                <i class="bi bi-arrow-counterclockwise"></i>
            </button>

        </div>

    </div>
</div>
