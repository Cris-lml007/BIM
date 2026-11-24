
<div class="bimnova-form">

    <style>
        .bimnova-form {
            --bim-primary: #5146e5;
            --bim-dark: #172033;
            --bim-muted: #64748b;
            color: var(--bim-dark);
        }

        .bimnova-form .form-control {
            border-radius: 10px;
            border: 1px solid #dce2ec;
            padding: 11px 13px;
            transition: border-color .2s, box-shadow .2s;
        }

        .bimnova-form .form-control:focus {
            border-color: var(--bim-primary);
            box-shadow: 0 0 0 3px rgba(81, 70, 229, .12);
        }

        .bimnova-section {
            background: #fff;
            border: 1px solid #e8ecf3;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 18px;
        }

        .bimnova-section-title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 9px;
        }

        .bimnova-section-title i {
            color: var(--bim-primary);
        }

        .bimnova-preview {
            background: #f5f7fb;
            border: 1px solid #e8ecf3;
            border-radius: 14px;
            padding: 12px;
            overflow: hidden;
        }

        .bimnova-progress {
            height: 9px;
            border-radius: 20px;
            background: #e9edf5;
            overflow: hidden;
        }

        .bimnova-progress .progress-bar {
            background: linear-gradient(90deg, #5146e5, #818cf8);
            border-radius: 20px;
            transition: width .3s ease;
        }

        .bimnova-status-card {
            background: #f8f9fc;
            border: 1px solid #e8ecf3;
            padding: 15px;
            border-radius: 12px;
        }

        .bimnova-status-label {
            font-size: 12px;
            color: var(--bim-muted);
        }

        .bimnova-status-value {
            font-size: 14px;
            font-weight: 700;
        }

        .bimnova-primary-btn {
            background: var(--bim-primary);
            border-color: var(--bim-primary);
            border-radius: 10px;
            padding: 10px 22px;
            font-weight: 600;
        }

        .bimnova-primary-btn:disabled {
            opacity: .55;
            cursor: not-allowed;
        }

        /* Splash */
        #bimnova-upload-splash {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(12, 18, 32, .88);
            backdrop-filter: blur(9px);
            opacity: 0;
            visibility: hidden;
            transition: opacity .3s ease, visibility .3s ease;
        }

        #bimnova-upload-splash.active {
            opacity: 1;
            visibility: visible;
        }

        .bimnova-splash-content {
            width: 100%;
            max-width: 440px;
            padding: 35px;
            text-align: center;
            background: #fff;
            border-radius: 22px;
            box-shadow: 0 25px 80px rgba(0, 0, 0, .25);
        }

        .bimnova-splash-icon {
            width: 76px;
            height: 76px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 22px;
            color: var(--bim-primary);
            background: #eeedff;
            font-size: 30px;
        }

        .bimnova-splash-spinner {
            width: 24px;
            height: 24px;
            border: 3px solid #e4e7f0;
            border-top-color: var(--bim-primary);
            border-radius: 50%;
            animation: bimnova-spin .8s linear infinite;
        }

        @keyframes bimnova-spin {
            to { transform: rotate(360deg); }
        }

        .bimnova-splash-title {
            font-size: 21px;
            font-weight: 750;
            margin-bottom: 8px;
            color: #172033;
        }

        .bimnova-splash-message {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 22px;
        }

        .bimnova-splash-progress {
            height: 10px;
            background: #edf0f6;
            border-radius: 20px;
            overflow: hidden;
        }

        .bimnova-splash-progress > div {
            height: 100%;
            width: 0%;
            border-radius: 20px;
            background: linear-gradient(90deg, #5146e5, #818cf8);
            transition: width .3s ease;
        }

        .bimnova-splash-percent {
            display: block;
            text-align: right;
            font-size: 12px;
            font-weight: 700;
            color: var(--bim-primary);
            margin-top: 8px;
        }

        .bimnova-splash-footer {
            color: #94a3b8;
            font-size: 12px;
            margin-top: 22px;
        }

        @media(max-width: 576px) {
            .bimnova-splash-content {
                padding: 25px 20px;
            }

            .bimnova-section {
                padding: 15px;
            }
        }
    </style>

    <form wire:submit="save" id="model3d-form">

        <div class="modal-body">

            <!-- Información -->
            <div class="bimnova-section">
                <div class="bimnova-section-title">
                    <i class="fas fa-cube"></i>
                    Información del modelo
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Nombre</label>
                    <input type="text"
                        class="form-control"
                        placeholder="Ingrese el nombre del modelo"
                        wire:model="name">

                    @error('name')
                        <small class="text-danger">{{ $message }}</small>
                    @enderror
                </div>

                <div>
                    <label class="form-label fw-semibold">Descripción</label>
                    <textarea rows="3"
                        class="form-control"
                        placeholder="Describa el modelo BIM"
                        wire:model="description"></textarea>

                    @error('description')
                        <small class="text-danger">{{ $message }}</small>
                    @enderror
                </div>
            </div>

            <!-- Archivo -->
            <div class="bimnova-section">
                <div class="bimnova-section-title">
                    <i class="fas fa-file-upload"></i>
                    Archivo del modelo
                </div>

                <label class="form-label fw-semibold">
                    Seleccionar modelo IFC
                </label>

                <input type="file"
                    class="form-control"
                    id="file-input"
                    wire:model="file"
                    accept=".ifc">

                <input type="file"
                    class="d-none"
                    id="thumbnail"
                    wire:model="thumbnail">

                <input type="file"
                    class="d-none"
                    id="frag"
                    wire:model="frag">

                @error('file')
                    <small class="text-danger d-block mt-2">{{ $message }}</small>
                @enderror

                @error('thumbnail')
                    <small class="text-danger d-block mt-2">{{ $message }}</small>
                @enderror

                @error('frag')
                    <small class="text-danger d-block mt-2">{{ $message }}</small>
                @enderror

                <small class="text-muted d-block mt-2">
                    Formato admitido: IFC. Los archivos FRAG y la miniatura
                    se generan automáticamente.
                </small>
            </div>

            <!-- Visor -->
            <div class="bimnova-section">
                <div class="bimnova-section-title">
                    <i class="fas fa-cubes"></i>
                    Vista previa 3D
                </div>

                <div class="bimnova-preview">
                    @island
                        <livewire:3d.simple-view></livewire:3d.simple-view>
                    @endisland
                </div>
            </div>

            <!-- Progreso -->
            <div class="bimnova-status-card mb-3" id="model-upload-status">

                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <div class="bimnova-status-value">
                            Estado del procesamiento
                        </div>
                        <small class="bimnova-status-label"
                            id="model-upload-message">
                            Selecciona un modelo IFC
                        </small>
                    </div>

                    <span class="fw-bold text-primary"
                        id="model-upload-percent">
                        0%
                    </span>
                </div>

                <div class="bimnova-progress">
                    <div id="model-upload-progress"
                        class="progress-bar"
                        role="progressbar"
                        style="width: 0%">
                    </div>
                </div>

            </div>
        </div>

        <div class="modal-footer border-0">

            <button type="submit"
                id="model-save-button"
                class="btn btn-primary bimnova-primary-btn"
                disabled>
                <i class="fas fa-save me-1"></i>
                <span id="model-save-label">Esperando archivos...</span>
            </button>

            <button data-bs-dismiss="modal"
                type="button"
                class="btn btn-light border"
                style="border-radius:10px">
                Cancelar
            </button>

            <span wire:loading wire:target="save">
                <span class="spinner-border spinner-border-sm text-primary"></span>
                Guardando...
            </span>
        </div>
    </form>

    <!-- Splash de procesamiento -->
    <div id="bimnova-upload-splash">
        <div class="bimnova-splash-content">

            <div class="bimnova-splash-icon">
                <div class="bimnova-splash-spinner"
                    id="bimnova-splash-spinner"></div>
            </div>

            <div class="bimnova-splash-title"
                id="bimnova-splash-title">
                Procesando modelo BIM
            </div>

            <div class="bimnova-splash-message"
                id="bimnova-splash-message">
                Estamos preparando tu modelo...
            </div>

            <div class="bimnova-splash-progress">
                <div id="bimnova-splash-progress-bar"></div>
            </div>

            <span class="bimnova-splash-percent"
                id="bimnova-splash-percent">
                0%
            </span>

            <div class="bimnova-splash-footer">
                Por favor, no cierres esta ventana.
            </div>
        </div>
    </div>

</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('model3d-form');

    if (!form || form.dataset.uploadInitialized) return;

    form.dataset.uploadInitialized = 'true';

    const saveButton = document.getElementById('model-save-button');
    const saveLabel = document.getElementById('model-save-label');
    const message = document.getElementById('model-upload-message');
    const percent = document.getElementById('model-upload-percent');
    const progress = document.getElementById('model-upload-progress');

    const splash = document.getElementById('bimnova-upload-splash');
    const splashTitle = document.getElementById('bimnova-splash-title');
    const splashMessage = document.getElementById('bimnova-splash-message');
    const splashProgress = document.getElementById('bimnova-splash-progress-bar');
    const splashPercent = document.getElementById('bimnova-splash-percent');
    const splashSpinner = document.getElementById('bimnova-splash-spinner');

    const state = {
        generating: false,
        generationComplete: false,
        uploading: {
            file: false,
            thumbnail: false,
            frag: false
        },
        uploaded: {
            file: false,
            thumbnail: false,
            frag: false
        },
        failed: false,
        saving: false
    };

    let splashHideTimeout = null;

    function showSplash(title, text, value = 0) {
        clearTimeout(splashHideTimeout);

        splashTitle.textContent = title;
        splashMessage.textContent = text;

        splashSpinner.style.display = 'block';

        splash.classList.add('active');

        updateSplashProgress(value);
    }

    function hideSplash() {
        clearTimeout(splashHideTimeout);

        splash.classList.remove('active');
    }

    function updateSplashProgress(value) {
        const percentage = Math.max(0, Math.min(100, Number(value) || 0));

        splashProgress.style.width = percentage + '%';
        splashPercent.textContent = Math.round(percentage) + '%';
    }

    function updateProgress(value, text) {
        const percentage = Math.max(0, Math.min(100, value));

        progress.style.width = percentage + '%';
        percent.textContent = percentage + '%';

        if (text) {
            message.textContent = text;
            splashMessage.textContent = text;
        }

        updateSplashProgress(percentage);
    }

    function updateButton() {
        const allUploaded = Object.values(state.uploaded).every(Boolean);
        const anyUploading = Object.values(state.uploading).some(Boolean);

        const ready =
            state.generationComplete &&
            allUploaded &&
            !anyUploading &&
            !state.generating &&
            !state.failed &&
            !state.saving;

        saveButton.disabled = !ready;

        if (state.saving) {
            saveLabel.textContent = 'Guardando...';
        } else if (state.failed) {
            saveLabel.textContent = 'Error al subir archivos';
        } else if (state.generating) {
            saveLabel.textContent = 'Procesando modelo...';
        } else if (anyUploading) {
            saveLabel.textContent = 'Subiendo archivos...';
        } else if (ready) {
            saveLabel.textContent = 'Guardar';
        } else {
            saveLabel.textContent = 'Esperando archivos...';
        }
    }

    function resetState() {
        state.generating = true;
        state.generationComplete = false;
        state.failed = false;
        state.saving = false;

        state.uploading = {
            file: false,
            thumbnail: false,
            frag: false
        };

        state.uploaded = {
            file: false,
            thumbnail: false,
            frag: false
        };

        updateProgress(0, 'Procesando modelo IFC...');
        updateButton();

        showSplash(
            'Procesando modelo BIM',
            'Leyendo y convirtiendo el archivo IFC...',
            0
        );
    }

    function getInputName(input) {
        if (!input) return null;

        if (input.id === 'file-input') return 'file';
        if (input.id === 'thumbnail') return 'thumbnail';
        if (input.id === 'frag') return 'frag';

        return null;
    }

    document.addEventListener('bimnova-model-start', () => {
        resetState();
    });

    document.addEventListener('bimnova-model-progress', event => {
        const value = event.detail.progress;

        updateProgress(
            value,
            event.detail.message
        );

        if (state.generating) {
            showSplash(
                'Procesando modelo BIM',
                event.detail.message || 'Procesando...',
                value
            );
        }
    });

    document.addEventListener('bimnova-model-generated', () => {
        state.generating = false;
        state.generationComplete = true;

        updateProgress(100, 'Modelo procesado. Verificando subidas...');
        updateButton();

        showSplash(
            'Modelo procesado',
            'Esperando que finalicen las subidas...',
            100
        );

        const allUploaded = Object.values(state.uploaded).every(Boolean);

        if (allUploaded) {
            completeUploads();
        }
    });

    document.addEventListener('bimnova-model-error', event => {
        state.generating = false;
        state.failed = true;

        const errorMessage =
            event.detail?.message || 'Error procesando el modelo.';

        updateProgress(0, errorMessage);
        updateButton();

        showSplash(
            'Error procesando el modelo',
            errorMessage,
            0
        );

        splashSpinner.style.display = 'none';
    });

    document.addEventListener('livewire-upload-start', event => {
        const name = getInputName(event.target);
        if (!name) return;

        state.uploading[name] = true;
        state.uploaded[name] = false;

        updateButton();

        const messages = {
            file: 'Subiendo archivo IFC...',
            thumbnail: 'Subiendo miniatura...',
            frag: 'Subiendo archivo FRAG...'
        };

        showSplash(
            'Subiendo archivos',
            messages[name],
            0
        );
    });

    document.addEventListener('livewire-upload-finish', event => {
        const name = getInputName(event.target);
        if (!name) return;

        state.uploading[name] = false;
        state.uploaded[name] = true;

        updateButton();

        const allUploaded = Object.values(state.uploaded).every(Boolean);

        if (allUploaded && state.generationComplete) {
            completeUploads();
        }
    });

    function completeUploads() {
        updateProgress(100, 'Todos los archivos están listos.');

        splashTitle.textContent = '¡Modelo listo!';
        splashMessage.textContent =
            'Todos los archivos se han procesado y subido correctamente.';

        splashSpinner.style.display = 'none';

        splashProgress.style.width = '100%';
        splashPercent.textContent = '100%';

        splashHideTimeout = setTimeout(() => {
            hideSplash();
        }, 1100);

        updateButton();
    }

    document.addEventListener('livewire-upload-error', event => {
        const name = getInputName(event.target);
        if (!name) return;

        state.uploading[name] = false;
        state.uploaded[name] = false;
        state.failed = true;

        updateProgress(0, 'Error subiendo ' + name + '.');
        updateButton();

        showSplash(
            'Error al subir archivos',
            'No se pudo subir ' + name + '. Verifica tu conexión.',
            0
        );

        splashSpinner.style.display = 'none';
    });

    document.addEventListener('livewire-upload-progress', event => {
        const name = getInputName(event.target);
        if (!name) return;

        if (name === 'file') {
            updateProgress(
                event.detail.progress,
                'Subiendo IFC...'
            );
        }
    });

    form.addEventListener('submit', event => {
        const allUploaded = Object.values(state.uploaded).every(Boolean);

        if (
            !state.generationComplete ||
            !allUploaded ||
            state.generating ||
            state.failed ||
            state.saving
        ) {
            event.preventDefault();
            event.stopImmediatePropagation();
            updateButton();
            return;
        }

        state.saving = true;
        updateButton();

        showSplash(
            'Guardando modelo',
            'Registrando el modelo y almacenando sus archivos...',
            100
        );
    });

    const fileInput = document.getElementById('file-input');

    fileInput?.addEventListener('change', () => {
        if (!fileInput.files.length) return;

        resetState();
    });

    updateButton();
});
</script>
</div>
