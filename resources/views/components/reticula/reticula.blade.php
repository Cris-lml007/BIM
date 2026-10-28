<div>
    <div class="container-fluid py-3">

        <div class="d-flex justify-content-between align-items-center flex-wrap mb-3">
            <div>
                <h3 class="mb-1">Prueba AR — Colocar cubos</h3>
                <p class="text-muted mb-0">
                    Detecta una superficie real y coloca cubos tocando la pantalla.
                </p>
            </div>

            <div class="d-flex flex-wrap" style="gap: 8px;">
                <button type="button" id="start-ar" class="btn btn-primary">
                    <i class="fas fa-vr-cardboard mr-1"></i>
                    Iniciar AR
                </button>
            </div>
        </div>

        {{-- ================================================= --}}
        {{-- CONTENEDOR DEL CANVAS (solo el canvas vive aquí)  --}}
        {{-- ================================================= --}}
        <div class="card">
            <div class="card-body p-0">
                <div
                    id="ar-cubes-viewer"
                    wire:ignore
                    style="
                        position: relative;
                        width: 100%;
                        height: 70vh;
                        min-height: 400px;
                        overflow: hidden;
                        background: #e2e8f0;
                    "
                ></div>
            </div>
        </div>
    </div>

    {{-- ===================================================== --}}
    {{-- OVERLAY AR (dom-overlay root)                         --}}
    {{-- - FUERA del contenedor del canvas                     --}}
    {{-- - SIN background en el root                           --}}
    {{-- - pointer-events: none en el root,                    --}}
    {{--   auto solo en los elementos interactivos             --}}
    {{-- ===================================================== --}}
    <div
        id="ar-overlay"
        wire:ignore
        style="
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 5;
            display: none;
        "
    >
        {{-- Panel de estado --}}
        <div
            style="
                position: absolute;
                top: 12px;
                left: 12px;
                padding: 8px 12px;
                color: white;
                background: rgba(15, 23, 42, .85);
                border-radius: 6px;
            "
        >
            <div id="ar-status">Modo normal</div>
            <div>Cubos: <span id="cube-count">0</span></div>
        </div>

        {{-- Botón limpiar (interactivo → pointer-events: auto) --}}
        <button
            type="button"
            id="clear-cubes"
            style="
                position: absolute;
                top: 12px;
                right: 12px;
                padding: 8px 14px;
                color: white;
                background: rgba(239, 68, 68, .85);
                border: 1px solid rgba(239, 68, 68, 1);
                border-radius: 6px;
                pointer-events: auto;
            "
        >
            Limpiar cubos
        </button>

        {{-- Ayuda inferior --}}
        <div
            id="ar-help"
            style="
                position: absolute;
                bottom: 70px;
                left: 50%;
                transform: translateX(-50%);
                width: max-content;
                max-width: 90%;
                padding: 10px 14px;
                color: white;
                background: rgba(15, 23, 42, .85);
                border-radius: 8px;
                text-align: center;
            "
        >
            Mueve el dispositivo lentamente para detectar una superficie.
        </div>

        {{-- Botón salir de AR (interactivo) --}}
        <button
            type="button"
            id="exit-ar"
            style="
                position: absolute;
                bottom: 15px;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 24px;
                color: white;
                background: rgba(15, 23, 42, .85);
                border: 1px solid rgba(255, 255, 255, .3);
                border-radius: 8px;
                pointer-events: auto;
            "
        >
            Salir de AR
        </button>
    </div>

    @push('scripts')
        <script type="module" src="{{ asset('js/ar-cubes-test.js') }}?v={{ time() }}"></script>
    @endpush
</div>
