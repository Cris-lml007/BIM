<div>
    <x-slot name="header">
        <div class="d-flex justify-content-between align-items-center">
            <h1 class="h2 fw-bold text-dark mb-0">{{ strtoupper($project->name) }}</h1>
        </div>

        <small>
            {{ $project->description ?? 'Sin descripción' }}
        </small>
    </x-slot>
    <x-card>
        <div class="container-fluid py-4">
            <div class="row g-4">
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <p class="text-muted mb-1 small">Modelos 3D</p>
                                    <h2 class="display-6 fw-semibold mb-0">{{ $stats['models3d'] }}</h2>
                                </div>
                                <div class="bg-purple bg-opacity-10 rounded-3 p-3">
                                    <i class="fas fa-cube fa-2x text-purple"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Stats Cards -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <p class="text-muted mb-1 small">Planos</p>
                                    <h2 class="display-6 fw-semibold mb-0">{{ $stats['plans'] }}</h2>
                                </div>
                                <div class="bg-primary bg-opacity-10 rounded-3 p-3">
                                    <i class="nf nf-md-floor_plan fa-2x text-primary"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <p class="text-muted mb-1 small">Documentos</p>
                                    <h2 class="display-6 fw-semibold mb-0">{{ $stats['documents'] }}</h2>
                                </div>
                                <div class="bg-warning bg-opacity-10 rounded-3 p-3">
                                    <i class="fas fa-folder fa-2x text-warning"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <p class="text-muted mb-1 small">Miembros</p>
                                    <h2 class="display-6 fw-semibold mb-0">{{ $stats['members'] }}</h2>
                                </div>
                                <div class="bg-success bg-opacity-10 rounded-3 p-3">
                                    <i class="fas fa-users fa-2x text-success"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Invitados y Miembros -->
                <div class="col-12 col-lg-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-white border-0 pt-4 px-4">
                            <h5 class="card-title fw-semibold mb-1">Equipo del Proyecto</h5>
                        </div>
                        <div class="card-body p-4 pt-0">
                            <div class="list-group list-group-flush">
                                @forelse($membersList as $member)
                                    <div
                                        class="list-group-item px-0 py-3 d-flex align-items-center bg-transparent border-0">
                                        <div class="flex-shrink-0">
                                            <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold
                                                            {{ $member->type === 'pending' ? 'bg-secondary' : 'bg-primary' }}"
                                                style="width: 40px; height: 40px;">
                                                {{ $member->initials }}
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <p class="mb-0 fw-semibold text-truncate" style="max-width: 150px;">
                                                {{ $member->name }}
                                            </p>
                                            <small class="text-muted d-block text-truncate"
                                                style="max-width: 150px;">{{ $member->email }}</small>
                                        </div>

                                        <div class="ms-auto">
                                            @if (!is_int($member->role))
                                                <span class="badge bg-warning text-dark rounded-pill small">

                                                    {{ $member->role }}
                                                </span>
                                            @endif
                                        </div>

                                    </div>
                                @empty
                                    <p class="text-muted small py-3">No hay miembros registrados.</p>
                                @endforelse
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-lg-8">
                    <div class="card border-0 shadow-sm h-100">
                        <div
                            class="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                            <h5 class="card-title fw-semibold mb-1">Actividad Reciente</h5>

                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush">
                                @forelse($activities as $activity)
                                    <div class="list-group-item px-4 py-3 d-flex align-items-start bg-transparent">
                                        <div class="flex-shrink-0">
                                            <div
                                                class="rounded-circle bg-opacity-10 p-2
                                                            {{ str_contains($activity->type, 'image') || str_contains($activity->type, 'pdf') ? 'bg-primary' : 'bg-warning' }}">
                                                <i
                                                    class="fas fa-file-upload {{ str_contains($activity->type, 'image') || str_contains($activity->type, 'pdf') ? 'text-primary' : 'text-warning' }}"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <p class="mb-1"><strong>{{ $activity->user->name ?? 'Usuario' }}</strong>
                                                subió
                                                "{{ $activity->name }}"</p>
                                            <small class="text-muted">
                                                <i
                                                    class="far fa-clock me-1"></i>{{ $activity->created_at->diffForHumans() }}
                                            </small>
                                        </div>
                                    </div>
                                @empty
                                    <div class="p-4 text-center text-muted">
                                        <i class="fas fa-history fa-2x mb-3 opacity-20"></i>
                                        <p class="small mb-0">No hay actividad reciente.</p>
                                    </div>
                                @endforelse
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="col-12">
                    <div class="mt-3">
                        <h6 class="fw-semibold mb-3 text-muted">Acciones rápidas</h6>
                        <div class="row g-3">
                            <div class="col-6 col-sm-3">
                                <a href="{{ route('app.project.documents', $project) }}"
                                    class="btn btn-light w-100 py-3 border border-2 hover-shadow transition d-flex align-items-center justify-content-center text-decoration-none text-dark">
                                    <i class="nf nf-md-floor_plan text-primary me-2"></i>
                                    <span class="fw-semibold">Subir Plano</span>
                                </a>
                            </div>
                            <div class="col-6 col-sm-3">
                                <a href="{{ route('app.project.model3d', $project) }}"
                                    class="btn btn-light w-100 py-3 border border-2 hover-shadow transition d-flex align-items-center justify-content-center text-decoration-none text-dark">
                                    <i class="fas fa-cube text-purple me-2"></i>
                                    <span class="fw-semibold">Modelo 3D</span>
                                </a>
                            </div>
                            <div class="col-6 col-sm-3">
                                <a href="{{ route('app.project.documents', $project) }}"
                                    class="btn btn-light w-100 py-3 border border-2 hover-shadow transition d-flex align-items-center justify-content-center text-decoration-none text-dark">
                                    <i class="fas fa-file-alt text-warning me-2"></i>
                                    <span class="fw-semibold">Documento</span>
                                </a>
                            </div>
                            <div class="col-6 col-sm-3">
                                <a href="{{ route('app.project.members', $project) }}"
                                    class="btn btn-light w-100 py-3 border border-2 hover-shadow transition d-flex align-items-center justify-content-center text-decoration-none text-dark">
                                    <i class="fas fa-user-plus text-success me-2"></i>
                                    <span class="fw-semibold">Invitar</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </x-card>
</div>

<style>
    /* Estilos personalizados */
    .bg-purple {
        background-color: #6f42c1 !important;
    }

    .text-purple {
        color: #6f42c1 !important;
    }

    .bg-purple.bg-opacity-10 {
        background-color: rgba(111, 66, 193, 0.1) !important;
    }

    .hover-shadow:hover {
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
        transform: translateY(-2px);
        transition: all 0.2s ease;
    }

    .transition {
        transition: all 0.2s ease;
    }

    .card {
        border-radius: 1rem !important;
    }

    .btn-light {
        background-color: #f8f9fa;
    }

    .btn-light:hover {
        background-color: #e9ecef;
    }

    .list-group-item {
        border-color: #f0f0f0;
    }
</style>
