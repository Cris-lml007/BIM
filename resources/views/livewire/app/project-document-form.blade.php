<div>
    @if(session()->has('message'))
        <div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {{ session('message') }}
        </div>
    @endif

    @error('general')
        <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ $message }}
        </div>
    @enderror

    <div class="d-flex justify-content-center align-items-center min-vh-100">
        <div class="card border-0 rounded-4" style="width: 900px; max-width: 95%;">
            <div class="card-header bg-white border-bottom-0 pt-4 pb-0">
                <h3 class="text-center mb-0 fw-bold text-dark">
                    <i class="fas fa-cloud-upload-alt me-2 text-primary"></i>
                    Subir Archivos
                </h3>
                <p class="text-center text-muted small mt-2 mb-0">
                    Sube tus archivos de forma rápida y segura
                </p>
            </div>

            <div class="card-body p-4" style="min-height: 550px;">

                <!-- Opciones de subida centradas -->
                <div class="mb-4 d-flex justify-content-center gap-3">
                    <button type="button" wire:click="toggleLinkInput"
                        class="btn {{ !$showLinkInput ? 'btn-primary shadow-sm' : 'btn-outline-secondary' }} px-4 py-2 rounded-pill fw-semibold">
                        <i class="fas fa-upload me-2"></i>
                        Subir Archivos
                    </button>
                    <button type="button" wire:click="toggleLinkInput"
                        class="btn {{ $showLinkInput ? 'btn-primary shadow-sm' : 'btn-outline-secondary' }} px-4 py-2 rounded-pill fw-semibold">
                        <i class="fas fa-link me-2"></i>
                        Enlace Externo
                    </button>
                </div>

                <!-- Área unificada: Drag & Drop + Lista de archivos -->
                <div class="flex-grow-1">
                    @if(!$showLinkInput)
                        <div x-data="{ isDragging: false }" @dragenter.prevent="isDragging = true"
                            @dragleave.prevent="isDragging = false" @dragover.prevent="isDragging = true"
                            @drop.prevent="isDragging = false; $wire.uploadMultiple('files', $event.dataTransfer.files)"
                            class="border-2 border-dashed rounded-4 p-4 transition cursor-pointer bg-light"
                            style="min-height: 380px; display: flex; flex-direction: column; transition: all 0.3s ease;"
                            :class="isDragging ? 'border-primary bg-primary bg-opacity-10 shadow-lg' : 'border-secondary hover:border-primary'"
                            x-ref="dropzone">

                            <!-- Input file separado, NO en el onclick del div -->
                            <input type="file" wire:model="files" multiple
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx" class="d-none" x-ref="fileInput">

                            <!-- Área superior: Icono y texto (visible cuando no hay archivos) -->
                            @if(count($files) == 0)
                                <div class="text-center"
                                    style="flex: 1; display: flex; flex-direction: column; justify-content: center;"
                                    @click="$refs.fileInput.click()">
                                    <div class="mb-4">
                                        <div class="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4">
                                            <i class="fas fa-cloud-upload-alt fa-4x text-primary"></i>
                                        </div>
                                    </div>
                                    <div class="text-secondary">
                                        <span class="fw-semibold text-primary fs-5">Haz clic para seleccionar</span>
                                        <span class="mx-2 text-muted">o</span>
                                        <span class="text-secondary">arrastra y suelta</span>
                                    </div>
                                    <p class="small text-muted mt-3 mb-0">
                                        <i class="fas fa-file-image me-1"></i> JPG, PNG
                                        <i class="fas fa-file-pdf ms-2 me-1"></i> PDF
                                        <i class="fas fa-file-word ms-2 me-1"></i> DOC, DOCX
                                        <i class="fas fa-file-excel ms-2 me-1"></i> XLS, XLSX
                                    </p>
                                    <p class="small text-muted mb-0 mt-2">
                                        <i class="fas fa-database me-1"></i> Max 10MB por archivo
                                        <i class="fas fa-layer-group ms-2 me-1"></i> Max {{ $maxFiles }} archivos
                                    </p>
                                </div>
                            @else
                                <!-- Área de lista de archivos (scroll) -->
                                <div class="flex-grow-1 overflow-auto" style="max-height: 380px;">
                                    <div class="d-flex justify-content-between align-items-center mb-3 sticky-top bg-light py-2 px-2 rounded"
                                        style="background: #f8f9fa !important;">
                                        <h5 class="fw-bold text-dark mb-0 fs-6">
                                            <i class="fas fa-list me-2 text-primary"></i>
                                            Archivos seleccionados
                                            <span class="badge bg-primary rounded-pill ms-2">{{ count($files) }}</span>
                                        </h5>
                                        <button type="button" wire:click="resetFiles"
                                            class="btn btn-sm btn-outline-danger rounded-pill px-3" title="Limpiar todos">
                                            <i class="fas fa-trash-alt me-1"></i> Limpiar
                                        </button>
                                    </div>
                                    <div class="vstack gap-2">
                                        @foreach($files as $index => $file)
                                            <div
                                                class="d-flex align-items-center justify-content-between p-3 bg-white rounded-3 border shadow-sm">
                                                <div class="d-flex align-items-center gap-3 flex-grow-1">
                                                    <div class="fs-3">
                                                        @if(str_contains($file->getMimeType(), 'image'))
                                                            <i class="fas fa-image text-primary"></i>
                                                        @elseif(str_contains($file->getMimeType(), 'pdf'))
                                                            <i class="fas fa-file-pdf text-danger"></i>
                                                        @elseif(str_contains($file->getMimeType(), 'word'))
                                                            <i class="fas fa-file-word text-primary"></i>
                                                        @elseif(str_contains($file->getMimeType(), 'excel'))
                                                            <i class="fas fa-file-excel text-success"></i>
                                                        @else
                                                            <i class="fas fa-file-alt text-secondary"></i>
                                                        @endif
                                                    </div>
                                                    <div class="flex-grow-1">
                                                        <p class="fw-semibold text-dark mb-1 text-truncate"
                                                            style="max-width: 400px; font-size: 0.95rem;">
                                                            {{ $file->getClientOriginalName() }}
                                                        </p>
                                                        <small class="text-muted">
                                                            <i class="fas fa-hdd me-1"></i>
                                                            {{ number_format($file->getSize() / 1024, 2) }} KB
                                                            <i class="fas fa-calendar-alt ms-2 me-1"></i>
                                                            {{ now()->format('d/m/Y H:i') }}
                                                        </small>
                                                    </div>
                                                </div>
                                                <button type="button" wire:click="removeFile({{ $index }})"
                                                    class="btn btn-sm btn-link text-danger p-0" style="width: 32px;">
                                                    <i class="fas fa-times-circle fa-lg"></i>
                                                </button>
                                            </div>

                                            <!-- Barra de progreso -->
                                            @if(isset($uploadProgress[$index]) && $uploadProgress[$index] > 0 && $uploadProgress[$index] < 100)
                                                <div class="mt-1">
                                                    <div class="progress" style="height: 6px; border-radius: 3px;">
                                                        <div class="progress-bar progress-bar-striped progress-bar-animated bg-success"
                                                            style="width: {{ $uploadProgress[$index] }}%; border-radius: 3px;"></div>
                                                    </div>
                                                    <small class="text-muted fs-10">{{ $uploadProgress[$index] }}% completado</small>
                                                </div>
                                            @endif
                                        @endforeach
                                    </div>
                                </div>

                                <!-- Botón para añadir más archivos -->
                                <div class="text-center mt-3 pt-2 border-top">
                                    <label
                                        class="btn btn-outline-primary rounded-pill px-4 py-2 btn-sm cursor-pointer bg-danger">
                                        <i class="fas fa-plus me-2"></i> Agregar más archivos
                                        <input type="file" wire:model="files" multiple
                                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx" class="d-none">
                                    </label>
                                </div>
                            @endif
                        </div>
                    @endif

                    <!-- Input para enlace externo -->
                    @if($showLinkInput)
                        <div class="border-2 border-dashed rounded-4 p-5 bg-light" style="min-height: 380px;">
                            <div class="d-flex flex-column justify-content-center h-100">
                                <div class="text-center mb-4">
                                    <div class="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4">
                                        <i class="fas fa-link fa-3x text-primary"></i>
                                    </div>
                                </div>
                                <label class="form-label fw-semibold text-secondary text-center mb-3">
                                    <i class="fas fa-globe me-1"></i> Ingresa el enlace del archivo
                                </label>
                                <div class="input-group shadow-sm">
                                    <span class="input-group-text bg-white border-end-0">
                                        <i class="fas fa-link text-primary"></i>
                                    </span>
                                    <input type="url" wire:model="externalLink"
                                        placeholder="https://ejemplo.com/archivo.pdf" class="form-control border-start-0"
                                        style="height: 50px;">
                                </div>
                                @error('externalLink')
                                    <div class="alert alert-danger mt-3 py-2 small rounded-pill">
                                        <i class="fas fa-exclamation-circle me-1"></i> {{ $message }}
                                    </div>
                                @enderror
                                <p class="text-center text-muted small mt-3 mb-0">
                                    <i class="fas fa-info-circle me-1"></i> Enlaces a Google Drive, Dropbox, OneDrive, etc.
                                </p>
                            </div>
                        </div>
                    @endif
                </div>

                <!-- Botón de acción -->
                <div class="mt-4 pt-2">
                    <button type="button" wire:click="uploadFiles" wire:loading.attr="disabled"
                        class="btn btn-primary w-100 py-3 fw-bold rounded-pill shadow-sm">
                        <span wire:loading.remove wire:target="uploadFiles">
                            <i class="fas fa-cloud-upload-alt me-2"></i> Subir Archivos
                        </span>
                        <span wire:loading wire:target="uploadFiles">
                            <i class="fas fa-spinner fa-spin me-2"></i> Subiendo archivos...
                        </span>
                    </button>
                </div>

            </div>

            <div class="card-footer bg-white border-top-0 pb-4 text-center">
                <small class="text-muted">
                    <i class="fas fa-shield-alt me-1"></i> Archivos seguros y encriptados
                </small>
            </div>
        </div>
    </div>

    <style>
        .hover\:border-primary:hover {
            border-color: #0d6efd !important;
            background-color: rgba(13, 110, 253, 0.02);
        }

        .transition {
            transition: all 0.3s ease;
        }

        .fs-10 {
            font-size: 0.7rem;
        }

        .cursor-pointer {
            cursor: pointer;
        }

        /* Scroll personalizado profesional */
        .overflow-auto::-webkit-scrollbar {
            width: 8px;
        }

        .overflow-auto::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }

        .overflow-auto::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 10px;
        }

        .overflow-auto::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }

        /* Mejoras visuales */
        .card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.15) !important;
        }

        .btn-primary {
            transition: all 0.2s ease;
        }

        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }

        .rounded-4 {
            border-radius: 1rem !important;
        }
    </style>


    <!-- Archivos subidos recientemente -->
    @if(count($uploadedFiles) > 0)
        <div class="mt-8 pt-6 border-t border-gray-200">
            <h3 class="text-lg font-semibold mb-3 text-gray-700">Archivos procesados ({{ count($uploadedFiles) }})</h3>
            <div class="space-y-2">
                @foreach($uploadedFiles as $index => $file)
                    <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div class="flex items-center space-x-3 flex-1">
                            <div class="text-2xl">
                                @if($file['source'] == 'link')
                                    🔗
                                @elseif(str_contains($file['type'], 'image'))
                                    🖼️
                                @elseif(str_contains($file['type'], 'pdf'))
                                    📄
                                @elseif(str_contains($file['type'], 'word'))
                                    📝
                                @elseif(str_contains($file['type'], 'excel'))
                                    📊
                                @else
                                    📁
                                @endif
                            </div>
                            <div class="flex-1">
                                <a href="{{ $file['url'] }}" target="_blank"
                                    class="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                    {{ $file['name'] }}
                                </a>
                                <p class="text-sm text-gray-500">
                                    @if($file['source'] == 'link')
                                        Enlace externo
                                    @else
                                        {{ $file['size'] }} • {{ strtoupper(pathinfo($file['name'], PATHINFO_EXTENSION)) }}
                                    @endif
                                </p>
                            </div>
                        </div>
                        <button type="button" wire:click="removeUploadedFile({{ $index }})"
                            class="text-red-500 hover:text-red-700 transition">
                            ✕
                        </button>
                    </div>
                @endforeach
            </div>
        </div>
    @endif
</div>