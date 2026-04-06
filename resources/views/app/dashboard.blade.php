@extends('adminlte::page')

@section('title', 'Dashboard')

@section('content_header')
    <h1>Administración</h1>
@endsection

@section('content')
    @can('isAdministration')
        <div class="container">

            <div class="row g-3 mb-3">
                <div class="col-md-3">
                    <div class="card text-center shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold">120</h3>
                        <small class="text-muted">Accesos Totales</small>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card text-center shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold text-success">95</h3>
                        <small class="text-muted">Activas</small>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card text-center shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold text-warning">15</h3>
                        <small class="text-muted">Por vencer</small>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card text-center shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold text-danger">10</h3>
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
                            <h3 class="fw-bold mb-0">850</h3>
                            <small class="text-success">+12 este mes</small>
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
                            <h3 class="fw-bold mb-0">320</h3>
                            <small class="text-primary">+5 este mes</small>
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
                            <h3 class="fw-bold mb-0">120GB</h3>
                            <small class="text-warning">Designado a accesos</small>
                        </div>
                        <div class="bg-warning bg-opacity-10 text-warning rounded-circle p-3">
                            <i class="fas fa-database fa-lg"></i>
                        </div>
                    </div>
                </div>

            </div>

            <div class="row g-3 mb-3">
                <div class="col-md-3">
                    <a href="{{ route('access.show') }}" class="btn btn-primary w-100">
                        + Crear Acceso
                    </a>
                </div>
                <div class="col-md-3">
                    <a href="{{ route('administration.users')  }}" class="btn btn-success w-100">+ Crear Usuario</a>
                </div>
                <div class="col-md-3">
                    <a href="#" class="btn btn-warning w-100">Ver Reportes</a>
                </div>

                <div class="col-md-3">
                    <a href="#" class="btn btn-dark w-100">Configuración</a>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">

                    <div class="card shadow-sm rounded-4 mb-3">
                        <div class="card-body">
                            <h5>Alertas</h5>

                            <ul class="list-group">
                                <li class="list-group-item text-danger">
                                    ⚠️ Empresa B alcanzó el límite de almacenamiento
                                </li>
                                <li class="list-group-item text-warning">
                                    ⏳ 5 licencias vencen en 7 días
                                </li>
                                <li class="list-group-item text-info">
                                    ℹ️ Nuevo usuario registrado hoy
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
                <div class="col-md-6">

                    <div class="card shadow-sm rounded-4 mb-3">
                        <div class="card-body">
                            <h5>Actividad Reciente</h5>

                            <ul class="list-group">
                                <li class="list-group-item">Juan creó un proyecto</li>
                                <li class="list-group-item">Empresa X subió archivos</li>
                                <li class="list-group-item">Admin bloqueó usuario</li>
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
                    <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold">2024-04-15</h3>
                        <h6 class="mb-1 text-secondary">Licencia Valida</h6>
                    </div>
                </div>
            </div>
            <div class="row g-3 mb-3">
                <div class="col-md-4">
                    <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold">1/5</h3>
                        <h6 class="mb-1 text-secondary">Proyectos Activos</h6>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold">2/5</h3>
                        <h6 class="mb-1 text-secondary">Proyectos Bloquados</h6>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold">3/5</h3>
                        <h6 class="mb-1 text-secondary">Total Compartidos</h6>
                    </div>
                </div>
            </div>
        </div>
        <livewire:app.projects-view></livewire:app.projects-view>
    @endcan
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