<div>
    <div id="app-splash" class="app-splash">
        <div class="splash-content">
            <div class="spinner-border text-light"></div>
            <h5 class="mt-3 text-light"><span class="text-primary"><b>BIM</b>NOVA</span> AR</h5>
            <p class="text-light">Inicializando aplicación...</p>
        </div>
    </div>

    <nav class="navbar px-3">
        <div class="navbar-brand">
            <span class="text-primary"><b>BIM</b>NOVA</span><span class="text-light"> AR</span>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-sm btn-dark" data-bs-toggle="modal" data-bs-target="#modal-models">Cargar
                Modelos</button>
            <button data-bs-toggle="modal" data-bs-target="#modal-views" class="btn btn-sm btn-dark">Vista</button>
            <button class="btn btn-sm btn-dark">Herramientas</button>
            <a class="btn btn-sm btn-danger" href="{{ route('app.project.model3d', $project->id) }}">Salir</a>
        </div>
    </nav>

    <div class="container-fluid">
        <div class="d-flex app-layout">

            <!-- Sidebar -->
            <div class="sidebar left p-3" id="leftSidebar">
                <div class="panel-title">Capas</div>
                <!-- <input type="text" class="form-control form-control-sm mb-1" placeholder="Buscar..."> -->
                <button class="btn btn-dark w-100 panel-title mb-3" type="button"
                    id="btn-reset-isolate">Reiniciar</button>
                <div id="layers-container"></div>
            </div>
            <div class="sidebar-tab left-tab" id="leftTab">
                <i class="bi bi-chevron-right"></i>
            </div>

            <!-- Viewport -->
            <div class="viewer-container position-relative p-0" id="viewer-wrapper">

                <!-- Splash Loading -->
                <div id="loading" class="loading-splash">
                    <div class="loading-content">
                        <div class="spinner-border text-light"></div>
                        <p class="mt-3">Cargando modelo...</p>
                    </div>
                </div>

                <!-- Viewport -->
                <div class="viewport" id="viewer" data-url="{{ route('app.Attachment', $model->model->id) }}"
                    data-type="{{ $model->model->type }}">

                    <div class="toolbar">
                        <button id="btn-anchor" class="tool-btn"><i class="nf nf-fa-anchor"></i></button>
                        <button id="btn-issue" class="tool-btn"><i class="nf nf-oct-issue_opened"></i></button>
                        <button id="btn-fit" class="tool-btn"><i class="nf nf-md-fit_to_screen"></i></button>
                        <button id="btn-rulers" class="tool-btn"><i class="bi bi-rulers"></i></button>
                        <button id="btn-clipper" class="tool-btn"><i class="bi bi-scissors"></i></button>
                    </div>

                    {{-- <div class="bottom-bar"> --}}
                    {{--     <span id="xyz">XYZ: (0,0,0)</span> --}}
                    {{--     <!-- <span>FPS: 60</span> --> --}}
                    {{-- </div> --}}
                    <div class="bottom-bar collapsed" id="bottomBar">

                        <!-- Header (siempre visible) -->
                        <div class="bottom-header" id="bottomToggle">
                            <span id="xyz">XYZ: (0,0,0)</span>
                            <div>
                                Anclajes y Incidencias
                                <i class="bi bi-chevron-up"></i>
                            </div>
                        </div>

                        <!-- Contenido expandible -->
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
                                <tbody id="anchors-table">
                                </tbody>
                            </table>

                        </div>
                    </div>

                </div>
            </div>

            <!-- Right Panel -->
            <div class="sidebar-tab right-tab" id="rightTab">
                <i class="bi bi-chevron-left"></i>
            </div>
            <div class="sidebar right p-3" id="rightSidebar">

                <!-- 🔹 NIVELES -->
                <div class="panel-title">Niveles</div>
                <button class="btn btn-dark w-100 panel-title mb-3" type="button"
                    id="btn-reset-levels">Reiniciar</button>
                <div id="levels-container" class="mb-3"></div>

                <!-- 🔹 PROPIEDADES -->
                <div class="panel-title">Modelos</div>

                <div id="models-container">
                </div>

            </div>
        </div>
    </div>


    <div class="modal fade" tabindex="-1" id="modal-views" data-bs-theme="dark">
        <div class="modal-dialog modal-md modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">

                <!-- HEADER -->
                <div class="modal-header border-bottom border-secondary">
                    <h5 class="modal-title fw-semibold">
                        <i class="bi bi-camera text-primary me-2"></i>
                        Vistas
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>

                <!-- BODY -->
                <div class="modal-body">

                    <div class="row g-3 text-center">

                        <!-- TOP -->
                        <div class="col-4">
                            <div class="view-card" data-view="top" data-bs-dismiss="modal">
                                ⬆️
                                <div>Top</div>
                            </div>
                        </div>

                        <!-- FRONT -->
                        <div class="col-4">
                            <div class="view-card" data-view="front" data-bs-dismiss="modal">
                                ⬛
                                <div>Front</div>
                            </div>
                        </div>

                        <!-- LEFT -->
                        <div class="col-4">
                            <div class="view-card" data-view="left" data-bs-dismiss="modal">
                                ⬅️
                                <div>Left</div>
                            </div>
                        </div>

                        <!-- RIGHT -->
                        <div class="col-4">
                            <div class="view-card" data-view="right" data-bs-dismiss="modal">
                                ➡️
                                <div>Right</div>
                            </div>
                        </div>

                        <!-- BACK -->
                        <div class="col-4">
                            <div class="view-card" data-view="back" data-bs-dismiss="modal">
                                🔲
                                <div>Back</div>
                            </div>
                        </div>

                        <!-- ISO -->
                        <div class="col-4">
                            <div class="view-card" data-view="iso" data-bs-dismiss="modal">
                                🔳
                                <div>3D</div>
                            </div>
                        </div>

                        <!-- FIT -->
                        <div class="col-12 mt-2">
                            <div class="view-card fit" data-view="fit" data-bs-dismiss="modal">
                                🔍 Ajustar vista
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    </div>



    <div class="modal fade" tabindex="-1" id="modal-models" data-bs-theme="dark">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg">

                <!-- HEADER -->
                <div class="modal-header border-bottom border-secondary">
                    <h5 class="modal-title fw-semibold">
                        <i class="nf nf-fa-cube text-primary me-2"></i>
                        Cargar Modelos
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>

                <!-- BODY -->
                <div class="modal-body">

                    <div class="row g-3">

                        @foreach ($models as $item)
                            <div class="col-md-6 col-lg-4">

                                <div class="model-card p-3 h-100 d-flex flex-column justify-content-between"
                                    data-url="{{ route('app.Attachment', $item->id) }}"
                                    data-name="{{ $item->name }}" name="loadIfc" data-bs-dismiss="modal">

                                    <!-- ICON -->
                                    <div class="text-center mb-2">
                                        <i class="nf nf-fa-cube model-icon"></i>
                                    </div>

                                    <!-- NAME -->
                                    <div class="text-center small fw-semibold text-truncate"
                                        title="{{ $item->name }}">
                                        {{ $item->name }}
                                    </div>

                                    <!-- ACTION -->
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
</div>
