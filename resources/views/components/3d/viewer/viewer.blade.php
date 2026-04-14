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
            <button class="btn btn-sm btn-dark">Archivo</button>
            <button class="btn btn-sm btn-dark">Vista</button>
            <button class="btn btn-sm btn-dark">Herramientas</button>
            <a class="btn btn-sm btn-danger" href="{{ route('app.project.model3d',$project->id) }}">Salir</a>
        </div>
    </nav>

    <div class="container-fluid">
        <div class="d-flex app-layout">

            <!-- Sidebar -->
            <div class="sidebar left p-3" id="leftSidebar">
                <div class="panel-title">Capas</div>
                <input type="text" class="form-control form-control-sm mb-1" placeholder="Buscar...">
                <button class="btn btn-dark w-100 panel-title mb-3" type="button" id="btn-reset-isolate">Reiniciar</button>
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
                        <button class="tool-btn active"><i class="bi bi-arrows-move"></i></button>
                        <button class="tool-btn"><i class="bi bi-cursor"></i></button>
                        <button class="tool-btn"><i class="bi bi-zoom-in"></i></button>
                        <button id="btn-rulers" class="tool-btn"><i class="bi bi-rulers"></i></button>
                        <button id="btn-clipper" class="tool-btn"><i class="bi bi-scissors"></i></button>
                    </div>

                    <div class="bottom-bar">
                        <span>XYZ: (0,0,0)</span>
                        <!-- <span>FPS: 60</span> -->
                    </div>

                </div>
            </div>

            <!-- Right Panel -->
            <div class="sidebar-tab right-tab" id="rightTab">
                <i class="bi bi-chevron-left"></i>
            </div>
            <div class="sidebar right p-3" id="rightSidebar">
                <div class="panel-title">Propiedades</div>

                <div class="property">
                    <strong>Elemento:</strong><br>Muro_01
                </div>

                <div class="property">
                    <strong>Material:</strong><br>Concreto
                </div>

                <div class="property">
                    <strong>Altura:</strong><br>2.8m
                </div>

                <button class="btn btn-primary w-100 mt-2">Enfocar</button>
            </div>
        </div>
    </div>
</div>
