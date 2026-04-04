<div class="row g-3 mb-3">

    @if(!$project->ownerAccess())
        <small class="alert alert-warning m-0">
            Usted no cuenta con acceso para esta sección, comuníquese con
            <b>BIMNova</b>, para solicitar un acceso.
        </small>
    @endif
    <div class="card mb-4 shadow-sm rounded-4">
        <div class="card-header border-0 bg-white pt-3 pb-0">
            <div class="d-flex justify-content-between align-items-center">
                <h6 class="fw-bold mb-0">
                    <i class="fas fa-hdd me-2 text-primary"></i>Almacenamiento
                </h6>
            </div>
        </div>
        <div class="card-body pt-2 pb-3">
            <div class="progress mt-2" style="height: 10px; border-radius: 999px;">
                <div class="progress-bar
                    {{ $percentage > 80 ? 'bg-danger' : ($percentage > 50 ? 'bg-warning' : 'bg-success') }}"
                    role="progressbar" style="width: {{ $percentage }}%; border-radius: 999px;"
                    aria-valuenow="{{ $percentage }}" aria-valuemin="0" aria-valuemax="100">
                </div>
            </div>
            <div class="d-flex justify-content-between mt-2">
                <small class="text-muted">Usado: {{ $usedMB }} MB ({{ $percentage }}%)</small>
                <small class="text-muted">Disponible: {{ $availableMB }} MB</small>
            </div>
        </div>
    </div>

    {{-- ── Filtros y búsqueda ──────────────────────────────────────────── --}}
    <div class="card shadow-sm rounded-4">
        <div class="card-header border-0 bg-white pt-3">
            <div class="row g-2 align-items-center">
                <div class="col-md-6">
                    <h6 class="fw-bold mb-0">
                        <i class="fas fa-folder-open me-2 text-primary"></i>Mis Archivos
                    </h6>
                </div>
                <div class="col-md-4">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="fas fa-search text-muted"></i>
                        </span>
                        <input type="text" wire:model.live="search" class="form-control border-start-0 bg-light"
                            placeholder="Buscar documento...">
                    </div>
                </div>
                <div class="col-md-2">
                    <select wire:model.live="filterType" class="form-select form-select-sm bg-light">
                        <option value="">Todos</option>
                        <option value="link">Enlace</option>
                        <option value="image">Imagen</option>
                        <option value="pdf">PDF</option>
                        <option value="word">Word</option>
                        <option value="excel">Excel</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="card-body p-0">
            @if($documents->isEmpty())
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-folder-open fa-3x mb-3 d-block opacity-50"></i>
                    <p class="mb-0">No hay documentos registrados en este proyecto.</p>
                    <small>Haz clic en <strong>Subir</strong> para agregar archivos o enlaces.</small>
                </div>
            @else
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th style="width: 40px;"></th>
                                <th wire:click="sortBy('name')" style="cursor:pointer;" class="user-select-none">
                                    Nombre
                                    @if($sortField === 'name')
                                        <i
                                            class="fas fa-sort-{{ $sortDirection === 'asc' ? 'up' : 'down' }} ms-1 text-primary"></i>
                                    @else
                                        <i class="fas fa-sort ms-1 text-muted opacity-50"></i>
                                    @endif
                                </th>
                                <th wire:click="sortBy('type')" style="cursor:pointer;" class="user-select-none">
                                    Tipo
                                    @if($sortField === 'type')
                                        <i
                                            class="fas fa-sort-{{ $sortDirection === 'asc' ? 'up' : 'down' }} ms-1 text-primary"></i>
                                    @else
                                        <i class="fas fa-sort ms-1 text-muted opacity-50"></i>
                                    @endif
                                </th>
                                <th wire:click="sortBy('size')" style="cursor:pointer;" class="user-select-none">
                                    Tamaño
                                    @if($sortField === 'size')
                                        <i
                                            class="fas fa-sort-{{ $sortDirection === 'asc' ? 'up' : 'down' }} ms-1 text-primary"></i>
                                    @else
                                        <i class="fas fa-sort ms-1 text-muted opacity-50"></i>
                                    @endif
                                </th>
                                <th wire:click="sortBy('created_at')" style="cursor:pointer;" class="user-select-none">
                                    Subido
                                    @if($sortField === 'created_at')
                                        <i
                                            class="fas fa-sort-{{ $sortDirection === 'asc' ? 'up' : 'down' }} ms-1 text-primary"></i>
                                    @else
                                        <i class="fas fa-sort ms-1 text-muted opacity-50"></i>
                                    @endif
                                </th>
                                <th class="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($documents as $doc)
                                <tr wire:key="doc-{{ $doc->id }}">
                                    {{-- Icono --}}
                                    <td class="text-center">
                                        <i class="{{ $doc->getIconClass() }} fa-lg"></i>
                                    </td>

                                    {{-- Nombre --}}
                                    <td>
                                        <span class="fw-semibold text-dark text-truncate d-inline-block"
                                            style="max-width: 280px;">
                                            {{ $doc->name }}
                                        </span>
                                        @if($doc->isLink())
                                            <small class="text-muted d-block text-truncate" style="max-width: 280px;">
                                                <i class="fas fa-external-link-alt me-1"></i>
                                                <a href="{{ $doc->view_url }}" target="_blank"
                                                    class="text-decoration-none text-muted">
                                                    {{ $doc->path }}
                                                </a>
                                            </small>
                                        @endif
                                    </td>

                                    {{-- Tipo --}}
                                    <td>
                                        @if($doc->isLink())
                                            <span class="badge bg-info text-dark">Enlace</span>
                                        @elseif(str_contains($doc->type, 'image'))
                                            <span class="badge bg-primary">Imagen</span>
                                        @elseif(str_contains($doc->type, 'pdf'))
                                            <span class="badge bg-danger">PDF</span>
                                        @elseif(str_contains($doc->type, 'word'))
                                            <span class="badge bg-primary">Word</span>
                                        @elseif(str_contains($doc->type, 'excel') || str_contains($doc->type, 'spreadsheet'))
                                            <span class="badge bg-success">Excel</span>
                                        @else
                                            <span class="badge bg-secondary">{{ $doc->type }}</span>
                                        @endif
                                    </td>

                                    {{-- Tamaño --}}
                                    <td>
                                        <small class="text-muted">{{ $doc->formatted_size }}</small>
                                    </td>

                                    {{-- Fecha --}}
                                    <td>
                                        <small class="text-muted">
                                            {{ $doc->created_at->translatedFormat('d M Y - H:i') }}
                                        </small>
                                    </td>

                                    {{-- Acciones --}}
                                    <td class="text-end">
                                        <a href="{{ $doc->view_url }}" target="_blank"
                                            class="btn btn-sm btn-primary rounded-circle me-1" title="Ver">
                                            <i class="fas fa-eye"></i>
                                        </a>
                                        <button wire:click="deleteDocument({{ $doc->id }})"
                                            class="btn btn-sm btn-danger rounded-circle" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>

                <div class="px-3 py-2 border-top">
                    <small class="text-muted">
                        Mostrando {{ $documents->count() }} de {{ $totalDocs }} documentos
                    </small>
                </div>
            @endif
        </div>
    </div>

</div>