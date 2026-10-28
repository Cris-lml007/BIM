<div>
    <style>
        /* Root del overlay AR: transparente, SIN fondo.
           Chrome lo promueve a fullscreen durante la sesión
           y se dibuja ENCIMA de cámara + canvas. Cualquier
           fondo opaco acá tapa todo (bug del test anterior). */
        #ar-cubes-overlay {
            position: absolute;
            inset: 0;
            background: transparent;
            pointer-events: none;
            z-index: 5;
        }

        #ar-cubes-overlay .panel {
            position: absolute;
            padding: 10px 14px;
            color: #fff;
            background: rgba(15, 23, 42, .85);
            border-radius: 8px;
            font-size: 13px;
        }

        #ar-cubes-top { top: 12px; left: 12px; }

        #ar-cubes-log-box { top: 12px; right: 12px; max-width: 46%; }
        #ar-cubes-log-box div { opacity: .85; }

        #ar-cubes-help {
            position: absolute;
            bottom: 70px;
            left: 50%;
            transform: translateX(-50%);
            width: max-content;
            max-width: 90%;
            padding: 8px 12px;
            color: #fff;
            background: rgba(15, 23, 42, .85);
            border-radius: 8px;
            text-align: center;
            font-size: 12px;
            pointer-events: none;
        }

        #ar-cubes-bottom {
            position: absolute;
            bottom: 14px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
            width: max-content;
            max-width: 92%;
            pointer-events: auto; /* los botones sí reciben taps */
        }

        #ar-cubes-bottom button {
            padding: 10px 14px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
        }

        .arcb-start { background: #2563eb; color: #fff; }
        .arcb-exit  { background: #ef4444; color: #fff; }
        .arcb-cube  { background: rgba(255,255,255,.92); color: #0f172a; }
        .arcb-clear { background: rgba(148,163,184,.9); color: #0f172a; }
    </style>

    <div class="container-fluid py-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap mb-3">
            <div>
                <h3 class="mb-1">Test AR — Cubos</h3>
                <p class="text-muted mb-0">
                    Banco de pruebas: retícula, hit-test y render de cubos.
                </p>
            </div>
        </div>

        <div class="card">
            <div class="card-body p-0">
                <div id="ar-cubes-viewer" wire:ignore
                     style="position: relative; width: 100%; height: 70vh; min-height: 400px; overflow: hidden; background: #e2e8f0;">

                    <!-- Root del overlay: los botones viven acá adentro
                         para seguir visibles/usables DURANTE la sesión AR -->
                    <div id="ar-cubes-overlay">

                        <div id="ar-cubes-top" class="panel">
                            <div id="ar-cubes-status">Modo escritorio</div>
                            <div>Cubos: <span id="ar-cubes-count">0</span></div>
                        </div>

                        <div id="ar-cubes-log-box" class="panel">
                            <div style="font-weight: 700; margin-bottom: 4px;">Log</div>
                            <div id="ar-cubes-log"></div>
                        </div>

                        <div id="ar-cubes-help">
                            Pulsá «Iniciar AR» para comenzar.
                        </div>

                        <div id="ar-cubes-bottom">
                            <button type="button" id="ar-cubes-start" class="arcb-start">Iniciar AR</button>
                            <button type="button" id="ar-cubes-exit" class="arcb-exit" style="display: none;">Salir de AR</button>
                            <button type="button" id="ar-cubes-front" class="arcb-cube">Cubo frente a mí</button>
                            <button type="button" id="ar-cubes-origin" class="arcb-cube">Cubo en origen</button>
                            <button type="button" id="ar-cubes-clear" class="arcb-clear">Limpiar</button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
