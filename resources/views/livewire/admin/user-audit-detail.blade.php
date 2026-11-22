<div>
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <a href="{{ route('admin.audit.index') }}"
               class="btn btn-sm btn-outline-secondary mb-2">
                <i class="fas fa-arrow-left"></i> Volver a usuarios
            </a>

            <h3 class="mb-1">
                <i class="fas fa-user-shield mr-2"></i>
                Auditoría de usuario
            </h3>

            <p class="text-muted mb-0">
                Consulta administrativa de toda la información del usuario.
            </p>
        </div>
    </div>

    {{-- Información del usuario --}}
    <div class="card card-outline card-primary">
        <div class="card-body">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h4 class="mb-1">{{ $user->name }}</h4>
                    <p class="text-muted mb-2">{{ $user->email }}</p>

                    <span class="badge badge-info">
                        {{ $user->role instanceof \BackedEnum
                            ? $user->role->name
                            : $user->role }}
                    </span>

                    <span class="badge badge-secondary">
                        ID: {{ $user->id }}
                    </span>
                </div>

                <div class="col-md-4 text-md-right mt-3 mt-md-0">
                    <small class="text-muted d-block">Fecha de registro</small>
                    <strong>
                        {{ $user->created_at?->format('d/m/Y H:i') }}
                    </strong>
                </div>
            </div>
        </div>
    </div>

    {{-- Estadísticas --}}
    <div class="row">
        @php
            $cards = [
                ['title' => 'Proyectos propios', 'value' => $stats['owned_projects'], 'icon' => 'fa-folder', 'color' => 'primary'],
                ['title' => 'Participaciones', 'value' => $stats['member_projects'], 'icon' => 'fa-users', 'color' => 'success'],
                ['title' => 'Modelos 3D', 'value' => $stats['models'], 'icon' => 'fa-cube', 'color' => 'info'],
                ['title' => 'Documentos', 'value' => $stats['documents'], 'icon' => 'fa-file-alt', 'color' => 'warning'],
            ];
        @endphp

        @foreach($cards as $card)
            <div class="col-md-3 col-sm-6">
                <div class="small-box bg-{{ $card['color'] }}">
                    <div class="inner">
                        <h3>{{ $card['value'] }}</h3>
                        <p>{{ $card['title'] }}</p>
                    </div>
                    <div class="icon">
                        <i class="fas {{ $card['icon'] }}"></i>
                    </div>
                </div>
            </div>
        @endforeach
    </div>

    {{-- Proyectos --}}
    <div class="card card-outline card-primary">
        <div class="card-header">
            <h3 class="card-title">
                <i class="fas fa-folder-open mr-1"></i>
                Proyectos del usuario
            </h3>

            <div class="card-tools">
                <span class="badge badge-primary">
                    {{ $projects->count() }} proyectos
                </span>
            </div>
        </div>

        <div class="card-body">
            @forelse($projects as $project)
                <div class="card card-light mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between flex-wrap">
                            <div>
                                <h5 class="mb-1">
                                    {{ $project->name }}
                                </h5>

                                <p class="text-muted mb-2">
                                    {{ $project->description ?: 'Sin descripción' }}
                                </p>

                                @if($project->audit_type === 'owner')
                                    <span class="badge badge-primary">
                                        <i class="fas fa-crown"></i>
                                        Propietario
                                    </span>
                                @else
                                    <span class="badge badge-success">
                                        <i class="fas fa-user-check"></i>
                                        Miembro
                                    </span>
                                @endif

                                <span class="badge badge-secondary">
                                    ID: {{ $project->id }}
                                </span>
                            </div>

                            <div class="mt-2">
                                <a href="{{ route('admin.audit.project', $project) }}"
                                   class="btn btn-primary btn-sm">
                                    <i class="fas fa-eye"></i>
                                    Auditar proyecto
                                </a>
                            </div>
                        </div>

                        <hr>

                        <div class="row text-center">
                            <div class="col-4 col-md-3">
                                <strong>{{ $project->models_count }}</strong>
                                <small class="d-block text-muted">Modelos 3D</small>
                            </div>

                            <div class="col-4 col-md-3">
                                <strong>{{ $project->documents_count }}</strong>
                                <small class="d-block text-muted">Documentos</small>
                            </div>

                            <div class="col-4 col-md-3">
                                <strong>{{ $project->active_memberships_count }}</strong>
                                <small class="d-block text-muted">Miembros activos</small>
                            </div>
                        </div>
                    </div>
                </div>
            @empty
                <div class="text-center text-muted py-5">
                    <i class="fas fa-folder-open fa-3x mb-3"></i>
                    <p>Este usuario todavía no tiene proyectos.</p>
                </div>
            @endforelse
        </div>
    </div>
</div>
