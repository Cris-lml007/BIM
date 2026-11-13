<div>
    {{-- ========================================== --}}
    {{--  ENCABEZADO                                --}}
    {{-- ========================================== --}}
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
    <style>
        #tutorialModal .modal-body {
            max-height: 65vh !important;
            overflow-y: auto !important;
        }
    </style>
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
            <h2 class="h4 fw-bold mb-1">
                <i class="bi bi-collection-play text-primary me-2"></i>Gestión de Tutoriales
            </h2>
            <p class="text-muted mb-0">Administra los videos del carrusel de la página principal.</p>
        </div>
        <button wire:click="openCreateModal"
            class="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-2">
            <i class="bi bi-plus-lg"></i> Nuevo tutorial
        </button>
    </div>

    {{-- Flash message --}}
    @if (session()->has('message'))
        <div class="alert alert-success alert-dismissible fade show rounded-3" role="alert">
            <i class="bi bi-check-circle me-2"></i>{{ session('message') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    @endif

    {{-- ========================================== --}}
    {{--  BÚSQUEDA                                  --}}
    {{-- ========================================== --}}
    <div class="mb-3">
        <div class="input-group">
            <span class="input-group-text bg-white border-end-0">
                <i class="bi bi-search text-muted"></i>
            </span>
            <input type="text" wire:model.live.debounce.300ms="search" class="form-control border-start-0"
                placeholder="Buscar por título o descripción...">
            @if ($search)
                <button wire:click="$set('search', '')" class="btn btn-outline-secondary">
                    <i class="bi bi-x-lg"></i>
                </button>
            @endif
        </div>
    </div>

    {{-- ========================================== --}}
    {{--  TABLA                                     --}}
    {{-- ========================================== --}}
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th style="width:60px" class="text-center">#</th>
                        <th style="width:140px">Miniatura</th>
                        <th>Título</th>
                        <th class="d-none d-lg-table-cell">Descripción</th>
                        <th style="width:80px" class="text-center">Orden</th>
                        <th style="width:90px" class="text-center">Estado</th>
                        <th style="width:130px" class="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($this->tutorials as $tutorial)
                        <tr>
                            {{-- ID --}}
                            <td class="text-center text-muted fw-semibold">{{ $tutorial->id }}</td>

                            {{-- Miniatura --}}
                            <td>
                                @if ($tutorial->thumbnail_url)
                                    <img src="{{ $tutorial->thumbnail_url }}" alt="{{ $tutorial->title }}"
                                        class="rounded-3 shadow-sm" style="width:120px; height:68px; object-fit:cover;">
                                @else
                                    <div class="bg-light rounded-3 d-flex align-items-center justify-content-center"
                                        style="width:120px; height:68px;">
                                        <i class="bi bi-image text-muted fs-4"></i>
                                    </div>
                                @endif
                            </td>

                            {{-- Título + link --}}
                            <td>
                                <div class="fw-bold">{{ $tutorial->title }}</div>
                                <a href="{{ $tutorial->youtube_url }}" target="_blank"
                                    class="text-decoration-none small text-danger">
                                    <i class="bi bi-youtube me-1"></i>Ver en YouTube
                                </a>
                            </td>

                            {{-- Descripción --}}
                            <td class="d-none d-lg-table-cell">
                                <span class="text-muted small">
                                    {{ Str::limit($tutorial->description, 70) }}
                                </span>
                            </td>

                            {{-- Orden --}}
                            <td class="text-center">
                                <span class="badge bg-secondary rounded-pill">{{ $tutorial->order }}</span>
                            </td>

                            {{-- Estado --}}
                            <td class="text-center">
                                <button wire:click="toggleActive({{ $tutorial->id }})"
                                    class="btn btn-sm rounded-pill px-3 {{ $tutorial->is_active ? 'btn-success' : 'btn-outline-secondary' }}"
                                    title="{{ $tutorial->is_active ? 'Desactivar' : 'Activar' }}">
                                    <i
                                        class="bi {{ $tutorial->is_active ? 'bi-check-circle-fill' : 'bi-pause-circle' }}"></i>
                                    {{ $tutorial->is_active ? 'Activo' : 'Inactivo' }}
                                </button>
                            </td>

                            {{-- Acciones --}}
                            <td class="text-center">
                                <div class="btn-group" role="group">
                                    <button wire:click="openEditModal({{ $tutorial->id }})"
                                        class="btn btn-sm btn-outline-primary" title="Editar">
                                        <i class="bi bi-pencil-square"></i>
                                    </button>
                                    <button wire:click="confirmDelete({{ $tutorial->id }})"
                                        class="btn btn-sm btn-outline-danger" title="Eliminar">
                                        <i class="bi bi-trash3"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="text-center py-5">
                                <i class="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                                <p class="text-muted mb-2">No hay tutoriales registrados.</p>
                                <button wire:click="openCreateModal" class="btn btn-primary btn-sm rounded-pill px-3">
                                    <i class="bi bi-plus-lg me-1"></i>Agregar primero
                                </button>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        {{-- Footer con conteo --}}
        @if ($this->tutorials->isNotEmpty())
            <div class="card-footer bg-white border-top py-2 px-3">
                <small class="text-muted">
                    <i class="bi bi-collection me-1"></i>
                    {{ $this->tutorials->count() }} tutorial{{ $this->tutorials->count() !== 1 ? 'es' : '' }}
                    · {{ $this->tutorials->where('is_active', true)->count() }}
                    activo{{ $this->tutorials->where('is_active', true)->count() !== 1 ? 's' : '' }}
                </small>
            </div>
        @endif
    </div>

    {{-- ========================================== --}}
    {{--  MODAL: CREAR / EDITAR                     --}}
    {{-- ========================================== --}}
    <div wire:ignore.self class="modal fade" id="tutorialModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4">

                {{-- Header --}}
                <div class="modal-header bg-primary text-white rounded-top-4 border-0">
                    <h5 class="modal-title fw-bold">
                        <i class="bi {{ $modalMode === 'create' ? 'bi-plus-circle' : 'bi-pencil-square' }} me-2"></i>
                        {{ $modalMode === 'create' ? 'Nuevo Tutorial' : 'Editar Tutorial' }}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                        wire:click="closeModal"></button>
                </div>

                {{-- Body --}}
                <form wire:submit="save">
                    <div class="modal-body p-4">

                        {{-- Título --}}
                        <div class="mb-3">
                            <label class="form-label fw-semibold">
                                Título <span class="text-danger">*</span>
                            </label>
                            <input type="text" wire:model="title"
                                class="form-control @error('title') is-invalid @enderror"
                                placeholder="Ej: Introducción a BIM">
                            @error('title')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        {{-- URL de YouTube --}}
                        <div class="mb-3">
                            <label class="form-label fw-semibold">
                                URL de YouTube <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <span class="input-group-text bg-white">
                                    <i class="bi bi-youtube text-danger"></i>
                                </span>
                                <input type="url" wire:model.live.debounce.500ms="youtube_url"
                                    class="form-control @error('youtube_url') is-invalid @enderror"
                                    placeholder="https://www.youtube.com/watch?v=...">
                                @error('youtube_url')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>

                            {{-- Preview de miniatura --}}
                            @if ($youtube_url)
                                @php
                                    preg_match('/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/', $youtube_url, $m);
                                    $previewId = $m[1] ?? null;
                                @endphp
                                @if ($previewId)
                                    <div class="mt-2">
                                        <small class="text-muted d-block mb-1">Vista previa:</small>
                                        <img src="https://img.youtube.com/vi/{{ $previewId }}/hqdefault.jpg"
                                            class="rounded-3 shadow-sm" style="max-width:280px; width:100%;"
                                            alt="Preview">
                                    </div>
                                @endif
                            @endif
                        </div>

                        {{-- Descripción --}}
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Descripción</label>
                            <textarea wire:model="description" rows="3" class="form-control @error('description') is-invalid @enderror"
                                placeholder="Breve descripción del tutorial..."></textarea>
                            @error('description')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="row g-3">
                            {{-- Orden --}}
                            <div class="col-sm-4">
                                <label class="form-label fw-semibold">Orden</label>
                                <input type="number" wire:model="order" min="0"
                                    class="form-control @error('order') is-invalid @enderror">
                                @error('order')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>

                            {{-- Estado --}}
                            <div class="col-sm-4 d-flex align-items-end">
                                <div class="form-check form-switch mb-2">
                                    <input class="form-check-input" type="checkbox" wire:model="is_active"
                                        id="isActiveSwitch">
                                    <label class="form-check-label fw-semibold" for="isActiveSwitch">
                                        {{ $is_active ? 'Activo' : 'Inactivo' }}
                                    </label>
                                </div>
                            </div>

                            {{-- Thumbnail personalizado --}}
                            <div class="col-sm-4">
                                <label class="form-label fw-semibold">Miniatura (opcional)</label>
                                <input type="file" wire:model="thumbnail" accept="image/*"
                                    class="form-control form-control-sm @error('thumbnail') is-invalid @enderror">
                                @error('thumbnail')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                                <div wire:loading wire:target="thumbnail" class="small text-primary mt-1">
                                    <span class="spinner-border spinner-border-sm me-1"></span>Subiendo...
                                </div>
                            </div>
                        </div>

                    </div>

                    {{-- Footer --}}
                    <div class="modal-footer border-top bg-light rounded-bottom-4">
                        <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal"
                            wire:click="closeModal">
                            Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary rounded-pill px-4">
                            <i class="bi bi-check-lg me-1"></i>
                            {{ $modalMode === 'create' ? 'Crear tutorial' : 'Guardar cambios' }}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    </div>

    {{-- ========================================== --}}
    {{--  MODAL: CONFIRMAR ELIMINACIÓN              --}}
    {{-- ========================================== --}}
    <div wire:ignore.self class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-sm modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 text-center p-4">
                <div class="mb-3">
                    <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size:3rem;"></i>
                </div>
                <h5 class="fw-bold">¿Eliminar tutorial?</h5>
                <p class="text-muted small">Esta acción no se puede deshacer.</p>
                <div class="d-flex gap-2 justify-content-center mt-3">
                    <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">
                        Cancelar
                    </button>
                    <button wire:click="delete" class="btn btn-danger rounded-pill px-4">
                        <i class="bi bi-trash3 me-1"></i>Eliminar
                    </button>
                </div>
            </div>
        </div>
    </div>

    {{-- ========================================== --}}
    {{--  SCRIPTS PARA CONTROLAR MODALES            --}}
    {{-- ========================================== --}}
    @script
        <script>
            // Modal crear/editar
            const tutorialModal = new bootstrap.Modal(document.getElementById('tutorialModal'));

            $wire.on('open-modal', () => {
                tutorialModal.show();
            });

            $wire.on('close-modal', () => {
                tutorialModal.hide();
            });

            // Limpiar formulario al cerrar manualmente (botón X o backdrop)
            document.getElementById('tutorialModal').addEventListener('hidden.bs.modal', () => {
                $wire.call('closeModal');
            });

            // Modal eliminar
            const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

            $wire.on('open-delete-modal', () => {
                deleteModal.show();
            });

            $wire.on('close-delete-modal', () => {
                deleteModal.hide();
            });

            document.getElementById('deleteModal').addEventListener('hidden.bs.modal', () => {
                $wire.set('showDeleteConfirm', false);
            });
        </script>
    @endscript
</div>
