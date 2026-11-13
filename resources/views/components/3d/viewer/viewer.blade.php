<div>
    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <style>
        /* =========================================
           PANELES CONTRAIBLES
        ========================================= */

        .collapsible-section {
            width: 100%;
            margin-bottom: 12px;
        }

        .collapsible-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 10px 12px;
            margin-bottom: 0;
            border-radius: 5px;
            cursor: pointer;
            user-select: none;
            background: rgba(255, 255, 255, 0.05);
            transition: background 0.2s ease;
        }

        .collapsible-header:hover {
            background: rgba(255, 255, 255, 0.10);
        }

        .collapsible-header .collapse-icon {
            font-size: 11px;
            color: #adb5bd;
            transition: transform 0.25s ease;
        }

        .collapsible-content {
            display: grid;
            grid-template-rows: 1fr;
            opacity: 1;
            margin-top: 12px;
            transition:
                grid-template-rows 0.3s ease,
                opacity 0.25s ease,
                margin 0.3s ease;
        }

        .collapsible-content-inner {
            min-height: 0;
            overflow: hidden;
        }

        .collapsible-section.collapsed .collapsible-content {
            grid-template-rows: 0fr;
            opacity: 0;
            margin-top: 0;
        }

        .collapsible-section.collapsed .collapse-icon {
            transform: rotate(-90deg);
        }

        .collapsible-section.collapsed .collapsible-header {
            margin-bottom: 0;
        }
    </style>

    <div id="app-splash" class="app-splash">
        <div class="splash-content">
            <div class="spinner-border text-light"></div>
            <h5 class="mt-3 text-light">
                <span class="text-primary"><b>BIM</b>NOVA</span> AR
            </h5>
            <p class="text-light">Inicializando aplicación...</p>
        </div>
    </div>

    <nav class="navbar px-3">
        <div class="navbar-brand">
            <span class="text-primary"><b>BIM</b>NOVA</span><span class="text-light"> AR</span>
        </div>

        <div class="d-flex gap-2">
            <button class="btn btn-sm btn-dark"
                data-bs-toggle="modal"
                data-bs-target="#modal-models">
                Cargar Modelos
            </button>

            <button data-bs-toggle="modal"
                data-bs-target="#modal-views"
                class="btn btn-sm btn-dark">
                Vista
            </button>


            <a class="btn btn-sm btn-danger"
                href="{{ route('app.project.model3d', $project->id) }}">
                Salir
            </a>
        </div>
    </nav>

    <div class="container-fluid">
        <div class="d-flex app-layout">

            {{-- ========================================= --}}
            {{-- SIDEBAR IZQUIERDO --}}
            {{-- ========================================= --}}

            <div class="sidebar left p-3" id="leftSidebar">

                {{-- CAPAS --}}
                <div class="collapsible-section">

                    <div class="panel-title collapsible-header"
                        data-collapse="layers-content">

                        <span>
                            <i class="fas fa-layer-group mr-2"></i>
                            Capas
                        </span>

                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </div>

                    <div id="layers-content" class="collapsible-content">
                        <div class="collapsible-content-inner">

                            <button class="btn btn-dark w-100 panel-title mb-3"
                                type="button"
                                id="btn-reset-isolate">
                                Reiniciar
                            </button>

                            <div id="layers-container"></div>

                        </div>
                    </div>

                </div>

                <hr class="border-secondary my-3">

                {{-- PROPIEDADES --}}
                <div class="collapsible-section">

                    <div class="panel-title collapsible-header"
                        data-collapse="properties-content">

                        <span>
                            <i class="fas fa-filter mr-2"></i>
                            Propiedades
                        </span>

                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </div>

                    <div id="properties-content" class="collapsible-content">
                        <div class="collapsible-content-inner">

                            <div class="mb-2">

                                <label for="property-key"
                                    class="form-label small mb-1">
                                    Clave
                                </label>

                                <select id="property-key"
                                    class="form-control form-control-sm">

                                    <option value="">
                                        Seleccionar propiedad
                                    </option>

                                </select>

                            </div>

                            <div class="mb-2">

                                <label for="property-value"
                                    class="form-label small mb-1">
                                    Valor
                                </label>

                                <select id="property-value"
                                    class="form-control form-control-sm"
                                    disabled>

                                    <option value="">
                                        Seleccionar valor
                                    </option>

                                </select>

                            </div>

                            <div class="d-flex gap-1">

                                <button type="button"
                                    id="btn-apply-property"
                                    class="btn btn-primary btn-sm flex-grow-1"
                                    disabled>
                                    Aplicar
                                </button>

                                <button type="button"
                                    id="btn-clear-property"
                                    class="btn btn-secondary btn-sm">
                                    Limpiar
                                </button>

                            </div>

                            <div id="property-filters" class="mt-3"></div>

                            <div id="property-filter-info"
                                class="small text-secondary mt-2">
                            </div>

                        </div>
                    </div>

                </div>

            </div>

            <div class="sidebar-tab left-tab" id="leftTab">
                <i class="bi bi-chevron-right"></i>
            </div>

            {{-- ========================================= --}}
            {{-- VIEWPORT --}}
            {{-- ========================================= --}}

            <div class="viewer-container position-relative p-0"
                id="viewer-wrapper">

                {{-- SPLASH LOADING --}}
                <div id="loading" class="loading-splash">
                    <div class="loading-content">
                        <div class="spinner-border text-light"></div>
                        <p class="mt-3">Cargando modelo...</p>
                    </div>
                </div>

                {{-- VIEWPORT --}}
                <div class="viewport"
                    id="viewer"
                    data-url="{{ route('app.Attachment', $model->model->id) }}"
                    data-type="{{ $model->model->type }}">

                    {{-- PANEL INFORMACIÓN BIM --}}
                    <div id="element-info-panel"
                        class="element-info-panel d-none">

                        <div class="element-info-header">

                            <div class="overflow-hidden">

                                <small class="text-secondary">
                                    Elemento BIM
                                </small>

                                <div id="element-info-title"
                                    class="fw-semibold text-truncate">
                                    Elemento
                                </div>

                            </div>

                            <button type="button"
                                id="close-element-info"
                                class="btn btn-sm btn-dark">
                                <i class="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <div id="element-info-content"
                            class="element-info-content">
                        </div>

                    </div>

                    {{-- TOOLBAR --}}
                    <div class="toolbar" id="toolbar">

                        <button id="btn-anchor" class="tool-btn">
                            <i class="nf nf-fa-anchor"></i>
                        </button>

                        <button id="btn-issue" class="tool-btn">
                            <i class="nf nf-oct-issue_opened"></i>
                        </button>

                        <button id="btn-fit" class="tool-btn">
                            <i class="nf nf-md-fit_to_screen"></i>
                        </button>

                        <button id="btn-rulers" class="tool-btn">
                            <i class="bi bi-rulers"></i>
                        </button>

                        <button id="btn-clipper" class="tool-btn">
                            <i class="bi bi-scissors"></i>
                        </button>

                    </div>

                    {{-- CLIPPER --}}
                    <div id="clipper-panel" class="clipper-panel d-none">

                        <div class="clipper-title d-flex justify-content-between align-items-center">

                            <span>Secciones de Corte</span>

                            <button type="button"
                                id="btn-reset-clipper"
                                class="btn btn-sm btn-outline-light">

                                <i class="bi bi-arrow-counterclockwise"></i>
                                Reset

                            </button>

                        </div>

                        <label>X</label>

                        <div class="range-group">
                            <input type="range" id="xMin" step="0.1">
                            <input type="range" id="xMax" step="0.1">
                        </div>

                        <label>Y</label>

                        <div class="range-group">
                            <input type="range" id="yMin" step="0.1">
                            <input type="range" id="yMax" step="0.1">
                        </div>

                        <label>Z</label>

                        <div class="range-group">
                            <input type="range" id="zMin" step="0.1">
                            <input type="range" id="zMax" step="0.1">
                        </div>

                    </div>

                    {{-- BOTTOM BAR --}}
                    <div class="bottom-bar collapsed" id="bottomBar">

                        <div class="bottom-header" id="bottomToggle">

                            <span id="xyz">
                                XYZ: (0,0,0)
                            </span>

                            <div>
                                Anclajes y Incidencias
                                <i class="bi bi-chevron-up"></i>
                            </div>

                        </div>

                        <div class="bottom-content">

                            <table class="table table-dark table table-hover mb-0">

                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Tipo</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody id="anchors-table"></tbody>

                            </table>

                        </div>

                    </div>

                </div>
            </div>

            {{-- ========================================= --}}
            {{-- SIDEBAR DERECHO --}}
            {{-- ========================================= --}}

            <div class="sidebar-tab right-tab" id="rightTab">
                <i class="bi bi-chevron-left"></i>
            </div>

            <div class="sidebar right p-3" id="rightSidebar">

                {{-- NIVELES --}}
                <div class="collapsible-section">

                    <div class="panel-title collapsible-header"
                        data-collapse="levels-content">

                        <span>
                            <i class="fas fa-building mr-2"></i>
                            Niveles
                        </span>

                        <i class="fas fa-chevron-down collapse-icon"></i>

                    </div>

                    <div id="levels-content" class="collapsible-content">
                        <div class="collapsible-content-inner">

                            <button class="btn btn-dark w-100 panel-title mb-3"
                                type="button"
                                id="btn-reset-levels">
                                Reiniciar
                            </button>

                            <div id="levels-container" class="mb-3"></div>

                        </div>
                    </div>

                </div>

                <hr class="border-secondary my-3">

                {{-- MODELOS --}}
                <div class="collapsible-section">

                    <div class="panel-title collapsible-header"
                        data-collapse="models-content">

                        <span>
                            <i class="fas fa-cubes mr-2"></i>
                            Modelos
                        </span>

                        <i class="fas fa-chevron-down collapse-icon"></i>

                    </div>

                    <div id="models-content" class="collapsible-content">
                        <div class="collapsible-content-inner">

                            <div id="models-container"></div>

                        </div>
                    </div>

                </div>

            </div>

        </div>
    </div>

    {{-- ========================================= --}}
    {{-- MODAL INCIDENCIA --}}
    {{-- ========================================= --}}

    <div class="modal fade"
        id="incidentDetailModal"
        tabindex="-1"
        aria-hidden="true">

        <div class="modal-dialog modal-xl modal-dialog-centered">

            <div class="modal-content bg-dark text-white">

                <div class="modal-header">

                    <h5 class="modal-title">
                        Detalle de incidencia
                    </h5>

                    <button type="button"
                        class="btn-close btn-close-white"
                        data-bs-dismiss="modal">
                    </button>

                </div>

                <div class="modal-body">

                    <livewire:app.incident-detail
                        modal_name="modal-incident-detail"
                        :project="$project" />

                </div>

            </div>

        </div>

    </div>

    <button type="button"
        id="open-incident-modal"
        class="d-none"
        data-bs-toggle="modal"
        data-bs-target="#incidentDetailModal">
    </button>

    {{-- ========================================= --}}
    {{-- MODAL VISTAS --}}
    {{-- ========================================= --}}

    <div class="modal fade"
        tabindex="-1"
        id="modal-views"
        data-bs-theme="dark">

        <div class="modal-dialog modal-md modal-dialog-centered">

            <div class="modal-content border-0 shadow-lg">

                <div class="modal-header border-bottom border-secondary">

                    <h5 class="modal-title fw-semibold">

                        <i class="bi bi-camera text-primary me-2"></i>
                        Vistas

                    </h5>

                    <button type="button"
                        class="btn-close btn-close-white"
                        data-bs-dismiss="modal">
                    </button>

                </div>

                <div class="modal-body">

                    <div class="row g-3 text-center">

                        <div class="col-4">
                            <div class="view-card"
                                data-view="top"
                                data-bs-dismiss="modal">
                                ⬆️
                                <div>Top</div>
                            </div>
                        </div>

                        <div class="col-4">
                            <div class="view-card"
                                data-view="front"
                                data-bs-dismiss="modal">
                                ⬛
                                <div>Front</div>
                            </div>
                        </div>

                        <div class="col-4">
                            <div class="view-card"
                                data-view="left"
                                data-bs-dismiss="modal">
                                ⬅️
                                <div>Left</div>
                            </div>
                        </div>

                        <div class="col-4">
                            <div class="view-card"
                                data-view="right"
                                data-bs-dismiss="modal">
                                ➡️
                                <div>Right</div>
                            </div>
                        </div>

                        <div class="col-4">
                            <div class="view-card"
                                data-view="back"
                                data-bs-dismiss="modal">
                                🔲
                                <div>Back</div>
                            </div>
                        </div>

                        <div class="col-4">
                            <div class="view-card"
                                data-view="iso"
                                data-bs-dismiss="modal">
                                🔳
                                <div>3D</div>
                            </div>
                        </div>

                        <div class="col-12 mt-2">
                            <div class="view-card fit"
                                data-view="fit"
                                data-bs-dismiss="modal">
                                🔍 Ajustar vista
                            </div>
                        </div>

                    </div>

                </div>

            </div>

        </div>

    </div>

    {{-- ========================================= --}}
    {{-- MODAL MODELOS --}}
    {{-- ========================================= --}}

    <div class="modal fade"
        tabindex="-1"
        id="modal-models"
        data-bs-theme="dark">

        <div class="modal-dialog modal-lg modal-dialog-scrollable">

            <div class="modal-content border-0 shadow-lg">

                <div class="modal-header border-bottom border-secondary">

                    <h5 class="modal-title fw-semibold">

                        <i class="nf nf-fa-cube text-primary me-2"></i>
                        Cargar Modelos

                    </h5>

                    <button type="button"
                        class="btn-close btn-close-white"
                        data-bs-dismiss="modal">
                    </button>

                </div>

                <div class="modal-body">

                    <div class="row g-3">

                        @foreach ($models as $item)

                            <div class="col-md-6 col-lg-4">

                                <div class="model-card p-3 h-100 d-flex flex-column justify-content-between"
                                    data-url="{{ route('app.Attachment', $item->id) }}"
                                    data-name="{{ $item->name . '|' . $item->id }}"
                                    name="loadIfc"
                                    data-bs-dismiss="modal">

                                    <div class="text-center mb-2">
                                        <i class="nf nf-fa-cube model-icon"></i>
                                    </div>

                                    <div class="text-center small fw-semibold text-truncate"
                                        title="{{ $item->name }}">
                                        {{ $item->name }}
                                    </div>

                                    <button class="btn btn-sm btn-primary w-100 mt-3">
                                        Cargar
                                    </button>

                                </div>

                            </div>

                        @endforeach

                    </div>

                </div>

            </div>

        </div>

    </div>

    {{-- ========================================= --}}
    {{-- MODAL MARK --}}
    {{-- ========================================= --}}

    <div class="modal fade"
        tabindex="-1"
        id="modal-mark"
        data-bs-theme="dark">

        <div class="modal-dialog modal-dialog-scrollable">

            <div class="modal-content border-0 shadow-lg">

                <div class="modal-header border-bottom border-secondary">

                    <h5 class="modal-title fw-semibold">

                        <i class="nf nf-fa-cube text-primary me-2"></i>
                        Cargar Modelos

                    </h5>

                    <button type="button"
                        class="btn-close btn-close-white"
                        data-bs-dismiss="modal">
                    </button>

                </div>

                <div class="modal-body">

                    <div class="row g-3">

                        @foreach ($models as $item)

                            <div class="col-md-6 col-lg-4">

                                <div class="model-card p-3 h-100 d-flex flex-column justify-content-between"
                                    data-url="{{ route('app.Attachment', $item->id) }}"
                                    data-name="asa"
                                    name="loadIfc"
                                    data-bs-dismiss="modal">

                                    <div class="text-center mb-2">
                                        <i class="nf nf-fa-cube model-icon"></i>
                                    </div>

                                    <div class="text-center small fw-semibold text-truncate"
                                        title="{{ $item->name }}">
                                        {{ $item->name }}
                                    </div>

                                    <button class="btn btn-sm btn-primary w-100 mt-3">
                                        Cargar
                                    </button>

                                </div>

                            </div>

                        @endforeach

                    </div>

                </div>

            </div>

        </div>

    </div>

    {{-- ========================================= --}}
    {{-- JAVASCRIPT PANELES CONTRAIBLES --}}
    {{-- ========================================= --}}

    <script>
        (() => {

            function initCollapsiblePanels() {

                document.querySelectorAll('.collapsible-header').forEach(header => {

                    // Evitar registrar eventos duplicados.
                    if (header.dataset.collapseInitialized === 'true') {
                        return;
                    }

                    header.dataset.collapseInitialized = 'true';

                    header.addEventListener('click', () => {

                        const section = header.closest('.collapsible-section');

                        if (!section) return;

                        section.classList.toggle('collapsed');

                    });

                });

            }

            // Inicialización normal.
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initCollapsiblePanels);
            } else {
                initCollapsiblePanels();
            }

            // Compatibilidad con navegación Livewire.
            document.addEventListener('livewire:navigated', initCollapsiblePanels);

        })();
    </script>

</div>
