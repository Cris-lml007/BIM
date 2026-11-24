
<div>
    <form wire:submit="save" id="model3d-form">
        <div class="modal-body">
            <div class="row mb-3">
                <div class="col">
                    <label>Nombre</label>
                    <input type="text"
                        class="form-control"
                        placeholder="Ingrese Nombre"
                        wire:model="name">

                    @error('name')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
            </div>

            <div class="row mb-3">
                <div class="col">
                    <label>Descripción</label>
                    <textarea rows="3"
                        class="form-control"
                        placeholder="Ingrese Descripción"
                        wire:model="description"></textarea>

                    @error('description')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
            </div>

            <div class="row mb-3">
                <div class="col">
                    <label>Subir Modelo IFC</label>

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
                        <span class="text-danger">{{ $message }}</span>
                    @enderror

                    @error('thumbnail')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror

                    @error('frag')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
            </div>

            <div class="row mb-3">
                @island
                    <livewire:3d.simple-view></livewire:3d.simple-view>
                @endisland
            </div>

            <div id="model-upload-status" class="mt-3">
                <div class="d-flex justify-content-between mb-1">
                    <small id="model-upload-message">
                        Selecciona un modelo IFC
                    </small>
                    <small id="model-upload-percent">0%</small>
                </div>

                <div class="progress">
                    <div id="model-upload-progress"
                        class="progress-bar progress-bar-striped progress-bar-animated"
                        role="progressbar"
                        style="width: 0%">
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button type="submit"
                id="model-save-button"
                class="btn btn-primary"
                disabled>
                <span id="model-save-label">Esperando archivos...</span>
            </button>

            <button data-bs-dismiss="modal"
                type="button"
                class="btn btn-secondary">
                Cancelar
            </button>

            <span wire:loading wire:target="save">
                <span class="spinner-border spinner-border-sm"></span>
                Guardando...
            </span>
        </div>
    </form>
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

    function updateProgress(value, text) {
        const percentage = Math.max(0, Math.min(100, value));

        progress.style.width = percentage + '%';
        percent.textContent = percentage + '%';

        if (text) {
            message.textContent = text;
        }
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
        updateProgress(
            event.detail.progress,
            event.detail.message
        );
    });

    document.addEventListener('bimnova-model-generated', () => {
        state.generating = false;
        state.generationComplete = true;

        updateProgress(100, 'Modelo procesado. Verificando subidas...');
        updateButton();
    });

    document.addEventListener('bimnova-model-error', event => {
        state.generating = false;
        state.failed = true;

        updateProgress(0, event.detail?.message || 'Error procesando el modelo.');
        updateButton();
    });

    document.addEventListener('livewire-upload-start', event => {
        const name = getInputName(event.target);
        if (!name) return;

        state.uploading[name] = true;
        state.uploaded[name] = false;

        updateButton();
    });

    document.addEventListener('livewire-upload-finish', event => {
        const name = getInputName(event.target);
        if (!name) return;

        state.uploading[name] = false;
        state.uploaded[name] = true;

        updateButton();

        const allUploaded = Object.values(state.uploaded).every(Boolean);

        if (allUploaded && state.generationComplete) {
            updateProgress(100, 'Todos los archivos están listos.');
        }
    });

    document.addEventListener('livewire-upload-error', event => {
        const name = getInputName(event.target);
        if (!name) return;

        state.uploading[name] = false;
        state.uploaded[name] = false;
        state.failed = true;

        updateProgress(0, 'Error subiendo ' + name + '.');
        updateButton();
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
    });

    const fileInput = document.getElementById('file-input');

    fileInput?.addEventListener('change', () => {
        if (!fileInput.files.length) return;

        resetState();
    });

    updateButton();
});
</script>
