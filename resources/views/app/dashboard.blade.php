@extends('adminlte::page')

@section('title', 'Dashboard')

@section('content_header')
    <h1>Panel de administración</h1>
@endsection

@section('content')
    @can('isAdministration')
        <div class="container">

            <div class="row g-3 mb-3">
                <div class="col-md-3">
                    <div class="card text-center shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold">{{ $access['total'] }}</h3>
                        <small class="text-muted">Accesos Totales</small>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card text-center shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold text-success">{{ $access['active'] }}</h3>
                        <small class="text-muted">Activas</small>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card text-center shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold text-warning">{{ $access['expiring'] }}</h3>
                        <small class="text-muted">Por vencer</small>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card text-center shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold text-danger"> {{ $access['expired'] }}</h3>
                        <small class="text-muted">Vencidas</small>

                    </div>
                </div>
            </div>

            <div class="row g-3 mb-3">

                <div class="col-md-4">
                    <div
                        class="card shadow-sm border-0 rounded-4 p-3 d-flex flex-row align-items-center justify-content-between">
                        <div>
                            <h6 class="text-muted mb-1">Usuarios</h6>
                            <h3 class="fw-bold mb-0">{{ $userTotal }}</h3>
                            <small class="text-success">+{{ $usersThisMonth }} este mes</small>
                        </div>
                        <div class="bg-primary bg-opacity-10 text-primary rounded-circle p-3">
                            <i class="fas fa-users fa-lg"></i>
                        </div>

                    </div>
                </div>

                <div class="col-md-4">
                    <div
                        class="card shadow-sm border-0 rounded-4 p-3 d-flex flex-row align-items-center justify-content-between">
                        <div>
                            <h6 class="text-muted mb-1">Proyectos</h6>
                            <h3 class="fw-bold mb-0">{{ $projects }}</h3>
                            <small class="text-primary">+{{ $projectsThisMonth }} este mes</small>
                        </div>
                        <div class="bg-success bg-opacity-10 text-success rounded-circle p-3">
                            <i class="fas fa-folder-open fa-lg"></i>
                        </div>

                    </div>
                </div>

                <div class="col-md-4">
                    <div
                        class="card shadow-sm border-0 rounded-4 p-3 d-flex flex-row align-items-center justify-content-between">
                        <div>
                            <h6 class="text-muted mb-1">Almacenamiento</h6>
                            <h3 class="fw-bold mb-0">{{ $storageGB }}GB</h3>
                            <small class="text-warning">Designado a accesos</small>
                        </div>
                        <div class="bg-warning bg-opacity-10 text-warning rounded-circle p-3">
                            <i class="fas fa-database fa-lg"></i>
                        </div>
                    </div>
                </div>

            </div>

            <div class="row g-3 mb-3">

                <div class="col-md-4">
                    <a href="{{ route('administration.access') }}"
                        class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2">
                        <i class="fas fa-key"></i>
                        <span>Crear Acceso</span>
                    </a>
                </div>

                <div class="col-md-4">
                    <a href="{{ route('administration.users') }}"
                        class="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2">
                        <i class="fas fa-user-plus"></i>
                        <span>Crear Usuario</span>
                    </a>
                </div>

                <div class="col-md-4">
                    <a href="#" class="btn btn-warning w-100 d-flex align-items-center justify-content-center gap-2">
                        <i class="fas fa-chart-bar"></i>
                        <span>Ver Reportes</span>
                    </a>
                </div>


            </div>

            <div class="row">
                <div class="col-md-6">

                    <div class="card shadow-sm rounded-4 mb-3">
                        <div class="card-body">
                            <h5>Alertas</h5>

                            <ul class="list-group">

                                @forelse($alerts as $alert)
                                    <li class="list-group-item d-flex align-items-center gap-2">

                                        <i class="{{ $alert['icon'] }} {{ $alert['color'] }}"></i>

                                        <span class="{{ $alert['color'] }}">
                                            {{ $alert['message'] }}
                                        </span>

                                    </li>
                                @empty
                                    <li class="list-group-item text-success text-center">
                                        <i class="fas fa-check-circle"></i> Todo en orden
                                    </li>
                                @endforelse

                            </ul>
                        </div>
                    </div>

                </div>
                <div class="col-md-6">
                    <div class="card shadow-sm rounded-4 mb-3">
                        <div class="card-body">
                            <h5>Actividad Reciente</h5>
                            <ul class="list-group">

                                @forelse($activities as $activity)
                                    <li class="list-group-item d-flex justify-content-between align-items-center">

                                        <div class="d-flex align-items-center gap-2">
                                            <i class="{{ $activity['icon'] }} {{ $activity['color'] }}"></i>
                                            <span>{{ $activity['message'] }}</span>
                                        </div>

                                        <small class="text-muted">
                                            {{ $activity['date']->diffForHumans() }}
                                        </small>

                                    </li>
                                @empty
                                    <li class="list-group-item text-center text-muted">
                                        <i class="fas fa-inbox"></i> Sin actividad reciente
                                    </li>
                                @endforelse


                            </ul>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    @else
        <div class="container">
            <div class="row g-3 mb-3">
                <div class="col-md">
                    <div class="card text-center shadow-sm rounded-4 py-3 border-0">

                        @php
                            $today = now();
                        @endphp

                        @if (!$access)
                            <h3 class="fw-bold text-danger">Sin Acceso</h3>
                            <small class="text-muted">No tienes una licencia asignada</small>
                        @elseif(!$access->is_active)
                            <h3 class="fw-bold text-warning">Bloqueado</h3>
                            <h6 class="text-secondary">Acceso suspendido por administrador</h6>
                        @elseif($access->available_end < $today)
                            <h3 class="fw-bold text-danger">Expirado</h3>
                            <h6 class="text-secondary">Licencia vencida</h6>
                            <small class="text-muted">
                                Venció el {{ \Carbon\Carbon::parse($access->available_end)->format('Y-m-d') }}
                            </small>
                        @else
                            @php
                                $daysLeft = $today->diffInDays($access->available_end);
                            @endphp


                            <div class="mb-2">
                                <i class="fas fa-check-circle text-success fs-2"></i>
                            </div>

                            <h5 class="fw-bold text-success mb-1">Licencia Activa</h5>

                            <p class="text-muted mb-1">Válida hasta</p>

                            <h6 class="fw-bold">
                                {{ \Carbon\Carbon::parse($access->available_end)->format('Y-m-d') }}
                            </h6>

                            <small class="text-muted">
                                {{ ceil(now()->diffInDays($access->available_end, false)) }} días restantes
                            </small>
                        @endif

                    </div>
                </div>
            </div>

            <div class="row g-3 mb-3">
                @if($access)
                    @php
                        $maxProjects = $access->max_projects;
                        $maxUsers = $access->max_users;
                    @endphp

                    <div class="col-md-3">
                        <div class="card text-center shadow-sm rounded-4 py-3 border-0">
                            <h3 class="fw-bold">{{ $projectsUsed }} / {{ $maxProjects }}</h3>
                            <h6 class="text-secondary">Proyectos</h6>
                            <small class="fw-bold {{ $projectsUsed >= $maxProjects ? 'text-danger' : 'text-success' }}">
                                {{ $projectsUsed >= $maxProjects ? 'Límite alcanzado' : 'Disponible' }}
                            </small>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="card text-center shadow-sm rounded-4 py-3 border-0">
                            <h3 class="fw-bold">{{ $usersUsed }} / {{ $maxUsers * $maxProjects}}</h3>
                            <h6 class="text-secondary"> {{ $maxUsers }} Miembros por proyecto</h6>
                            <small class="fw-bold {{ $usersUsed >= $maxUsers * $maxProjects ? 'text-danger' : 'text-success' }}">
                                {{ $usersUsed >= $maxUsers * $maxProjects ? 'Límite alcanzado' : 'En uso' }}
                            </small>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="card text-center shadow-sm rounded-4 py-3 border-0">
                            <h3 class="fw-bold">{{ $storageUsedGB }}GB / {{ $maxStorageGB * $maxProjects}}GB</h3>
                            <h6 class="text-secondary">{{ $maxStorageGB }} GB por proyecto</h6>
                            <small class="fw-bold {{ $storagePercent >= 90 ? 'text-danger' : 'text-primary' }}">
                                {{ round($storagePercent) }}% usado
                            </small>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="card text-center shadow-sm rounded-4 py-3 border-0">
                            <h3 class="fw-bold text-danger">{{ $blockedProjects ?? 0 }}</h3>
                            <h6 class="text-secondary">Proyectos Bloqueados</h6>
                            <small class=" text-primary fw-bold">Requieren atención</small>
                        </div>
                    </div>
                @endif

            </div>


            <div class="row">
                <div class="col-md-6">
                    <div class="card shadow-sm rounded-4 mb-3 border-0">
                        <div class="card-body">
                            <h5>Alertas</h5>

                            <ul class="list-group">
                                @forelse($alerts as $alert)
                                    <li class="list-group-item d-flex align-items-center gap-2">
                                        <i class="{{ $alert['icon'] }} {{ $alert['color'] }}"></i>
                                        <span class="{{ $alert['color'] }}">
                                            {{ $alert['message'] }}
                                        </span>
                                    </li>
                                @empty
                                    <li class="list-group-item text-success text-center">
                                        <i class="fas fa-check-circle"></i> Todo en orden
                                    </li>
                                @endforelse
                            </ul>
                        </div>
                    </div>

                </div>
                <div class="col-md-6">
                    <div class="card shadow-sm rounded-4 mb-3 border-0">
                        <div class="card-body">
                            <h5>Actividad Reciente</h5>

                            <ul class="list-group">
                                @forelse($activities as $activity)
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center gap-2">
                                            <i class="{{ $activity['icon'] }} {{ $activity['color'] }}"></i>
                                            <span>{{ $activity['message'] }}</span>
                                        </div>
                                        <small class="text-muted">
                                            {{ $activity['date']->diffForHumans() }}
                                        </small>
                                    </li>
                                @empty
                                    <li class="list-group-item text-center text-muted">
                                        <i class="fas fa-inbox"></i> Sin actividad reciente
                                    </li>
                                @endforelse
                            </ul>
                        </div>
                    </div>

                </div>
            </div>


        </div>

        @if($access && $access->is_active)
            <livewire:app.projects-view :showOptions="false"></livewire:app.projects-view>
        @endif
    @endcan
@endsection
@section('preloader')
    @include('layouts.main')
@endsection
@section('css')
    {{-- Add here extra stylesheets --}}
    {{--
    <link rel="stylesheet" href="/css/admin_custom.css"> --}}
@endsection

@section('js')
    <script>
        console.log("Hi, I'm using the Laravel-AdminLTE package!");
    </script>
@endsection
