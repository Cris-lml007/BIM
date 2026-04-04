<div wire:loading.class="opacity-50 pointer-events-none" wire:target="save,files">
    <div wire:loading wire:target="files" class="small text-muted">Cargando archivos...</div>
    @error('general')
        <div class="alert alert-danger alert-dismissible fade show py-2 small rounded-3 mb-3" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>{{ $message }}
            <button type="button" class="btn-close btn-sm" data-bs-dismiss="alert"></button>
        </div>
    @enderror

    <div class="d-flex justify-content-center gap-3 mb-4">
        <button type="button" wire:click="toggleLinkInput" class="btn px-4 py-2 rounded-pill fw-semibold
                   {{ !$showLinkInput ? 'btn-primary shadow-sm' : 'btn-outline-secondary' }}">
            <i class="fas fa-upload me-2"></i>Subir Archivos
        </button>
        <button type="button" wire:click="toggleLinkInput" class="btn px-4 py-2 rounded-pill fw-semibold
                   {{ $showLinkInput ? 'btn-primary shadow-sm' : 'btn-outline-secondary' }}">
            <i class="fas fa-link me-2"></i>Enlace Externo
        </button>
    </div>

    @if(!$showLinkInput)
        <div x-data="{ isDragging: false }" @dragenter.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
            @dragover.prevent="isDragging = true"
            @drop.prevent="isDragging = false; $wire.uploadMultiple('files', $event.dataTransfer.files)"
            :class="isDragging ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'"
            class="border border-1 border-primary rounded-4 p-3 transition m-3" style="min-height: 260px;">

            <input type="file" wire:model="files" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                class="d-none" x-ref="fileInput">

            @if(count($files) === 0)
                <div class="text-center py-4" style="cursor:pointer" @click="$refs.fileInput.click()">
                    <div class="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                        <i class="fas fa-cloud-upload-alt fa-3x text-primary"></i>
                    </div>
                    <div class="mb-2">
                        <span class="fw-semibold text-primary">Haz clic para seleccionar</span>
                        <span class="text-muted mx-2">o arrastra y suelta</span>
                    </div>
                    <p class="small text-muted mb-1">
                        <i class="fas fa-file-image me-1"></i>JPG, PNG &nbsp;
                        <i class="fas fa-file-pdf me-1"></i>PDF &nbsp;
                        <i class="fas fa-file-word me-1"></i>DOC, DOCX &nbsp;
                        <i class="fas fa-file-excel me-1"></i>XLS, XLSX
                    </p>
                    <p class="small text-muted mb-0">
                        <i class="fas fa-database me-1"></i>Máx. 10 MB por archivo &nbsp;
                        <i class="fas fa-layer-group me-1"></i>Máx. {{ $maxFiles }} archivos
                    </p>
                </div>
            @else
                <div class="d-flex justify-content-between align-items-center mb-3 px-1">
                    <h6 class="fw-bold mb-0 fs-6">
                        <i class="fas fa-list me-2 text-primary"></i>
                        Archivos seleccionados
                        <span class="badge bg-primary rounded-pill ms-1">{{ count($files) }}</span>
                    </h6>
                    <button type="button" wire:click="resetForm" class="btn btn-sm btn-outline-danger rounded-pill px-3">
                        <i class="fas fa-trash-alt me-1"></i>Limpiar
                    </button>
                </div>

                <div class="vstack gap-2 overflow-auto" style="max-height: 280px;">
                    @foreach($files as $index => $file)
                        <div class="d-flex align-items-center justify-content-between p-3 bg-white rounded-3 border shadow-sm">
                            <div class="d-flex align-items-center gap-3 flex-grow-1 min-width-0">
                                <div class="fs-4">
                                    @php $mime = $file->getMimeType(); @endphp
                                    @if(str_contains($mime, 'image'))
                                        <i class="fas fa-file-image text-primary"></i>
                                    @elseif(str_contains($mime, 'pdf'))
                                        <i class="fas fa-file-pdf text-danger"></i>
                                    @elseif(str_contains($mime, 'word'))
                                        <i class="fas fa-file-word text-primary"></i>
                                    @elseif(str_contains($mime, 'excel') || str_contains($mime, 'spreadsheet'))
                                        <i class="fas fa-file-excel text-success"></i>
                                    @else
                                        <i class="fas fa-file-alt text-secondary"></i>
                                    @endif
                                </div>
                                <div class="flex-grow-1 min-width-0">
                                    <p class="fw-semibold text-dark mb-0 text-truncate" style="max-width: 400px; font-size: .9rem;">
                                        {{ $file->getClientOriginalName() }}
                                    </p>

                                </div>
                            </div>
                            <button type="button" wire:click="removeFile({{ $index }})"
                                class="btn btn-sm btn-link text-danger p-0 ms-2">
                                <i class="fas fa-times-circle fa-lg"></i>
                            </button>
                        </div>
                    @endforeach
                </div>

                <div class="text-center mt-3 pt-2 border-top">
                    <label class="btn btn-outline-primary btn-sm rounded-pill px-4" style="cursor:pointer;">
                        <i class="fas fa-plus me-2"></i>Agregar más archivos
                        <input type="file" wire:model="files" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                            class="d-none">
                    </label>
                </div>
            @endif
        </div>

        @error('files')
            <div class="text-danger small mt-2">
                <i class="fas fa-exclamation-circle me-1"></i>{{ $message }}
            </div>
        @enderror
        @error('files.*')
            <div class="text-danger small mt-2">
                <i class="fas fa-exclamation-circle me-1"></i>{{ $message }}
            </div>
        @enderror
    @endif

    @if($showLinkInput)
        <div class="border border-1 border-primary rounded-4 p-3 transition m-3" style="min-height: 200px;">
            <div class="text-center mb-4">
                <div class="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4">
                    <i class="fas fa-link fa-3x text-primary"></i>
                </div>
            </div>
            <label class="form-label fw-semibold text-secondary small text-uppercase">URL del enlace</label>
            <div class="input-group shadow-sm">
                <span class="input-group-text bg-white border-end-0">
                    <i class="fas fa-link text-primary"></i>
                </span>
                <input type="url" wire:model.live="externalLink" placeholder="https://drive.google.com/..."
                    class="form-control border-start-0 @error('externalLink') is-invalid @enderror" style="height: 50px;">
            </div>
            @error('externalLink')
                <div class="text-danger small mt-2">
                    <i class="fas fa-exclamation-circle me-1"></i>{{ $message }}
                </div>
            @enderror
            <p class="text-center text-muted small mt-3 mb-0">
                <i class="fas fa-info-circle me-1"></i>
                Compatible con Google Drive, Dropbox, OneDrive, SharePoint, etc.
            </p>
        </div>
    @endif

    <div class="m-2">
        <button type="button" wire:click="save" wire:loading.attr="disabled"
            class="btn btn-primary w-100 fw-bold rounded-pill shadow-sm py-2">
            <span wire:loading.remove wire:target="save">
                <i class="fas fa-save me-2"></i>
                {{ $showLinkInput ? 'Guardar enlace' : 'Registrar' }}
            </span>
            <span wire:loading wire:target="save">
                <i class="fas fa-spinner fa-spin me-2"></i>Guardando...
            </span>
        </button>
    </div>
</div>