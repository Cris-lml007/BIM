
<div>
    <div class="container-fluid py-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap mb-3">
            <div>
                <h3 class="mb-1">Three.js — Realidad aumentada</h3>
                <p class="text-muted mb-0">
                    Detecta una superficie real y coloca cubos.
                </p>
            </div>

            <div class="d-flex flex-wrap" style="gap: 8px;">
                <button
                    type="button"
                    id="start-ar"
                    class="btn btn-primary"
                >
                    <i class="fas fa-vr-cardboard mr-1"></i>
                    Iniciar AR
                </button>

                <button
                    type="button"
                    id="clear-cubes"
                    class="btn btn-secondary"
                >
                    Limpiar cubos
                </button>
            </div>
        </div>

        <div class="card">
            <div class="card-body p-0">
                <div
                    id="three-cubes-viewer"
                    wire:ignore
                    style="
                        position: relative;
                        width: 100%;
                        height: 70vh;
                        min-height: 400px;
                        overflow: hidden;
                        background: #e2e8f0;
                    "
                >
                    <div
                        id="three-cubes-info"
                        style="
                            position: absolute;
                            z-index: 2;
                            top: 12px;
                            left: 12px;
                            padding: 8px 12px;
                            color: white;
                            background: rgba(15, 23, 42, .85);
                            border-radius: 6px;
                            pointer-events: none;
                        "
                    >
                        <div id="ar-status">Modo normal</div>
                        <div>
                            Cubos: <span id="cube-count">0</span>
                        </div>
                    </div>

                    <div
                        id="ar-help"
                        style="
                            position: absolute;
                            z-index: 2;
                            bottom: 15px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: max-content;
                            max-width: 90%;
                            padding: 10px 14px;
                            color: white;
                            background: rgba(15, 23, 42, .85);
                            border-radius: 8px;
                            text-align: center;
                            pointer-events: none;
                        "
                    >
                        Pulsa «Iniciar AR» desde un dispositivo compatible.
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
