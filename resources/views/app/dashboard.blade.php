@extends('adminlte::page')

@section('title', 'Dashboard')

@section('content_header')
    @can('isAdministration')
        <h1>Dashboard</h1>
    @else
        <div class="container">
            <div class="d-flex justify-content-between">
                <h1>Panel Principal</h1>
            </div>
        </div>
    @endcan
@endsection

@section('content')
    @can('isAdministration')
        <p>Welcome to this beautiful admin panel.</p>
        @else
        <div class="container">
            <div class="row g-3 mb-3">
                <div class="col-md">
                    <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold">{{ $licence?->available_end ? (Carbon\Carbon::parse($licence?->available_end)->isoformat('DD-MM-YY')) : '-' }}</h3>
                        <h6 class="mb-1 text-secondary">{{ $licence?->isValid() ? 'Licencia Valida' : 'Licencia Vencida' }}</h6>
                    </div>
                </div>
            </div>
            <div class="row g-3 mb-3">
                <div class="col-md-4">
                    <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold">{{ $projects_active }}/{{$licence->max_projects ?? 0}}</h3>
                        <h6 class="mb-1 text-secondary">Proyectos Activos</h6>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold">{{ $projects_blocked }}/{{ $licence->max_projects ?? 0 }}</h3>
                        <h6 class="mb-1 text-secondary">Proyectos Bloquados</h6>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                        <h3 class="fw-bold">{{ $number_projects }}</h3>
                        <h6 class="mb-1 text-secondary">Total Compartidos</h6>
                    </div>
                </div>
            </div>
        </div>
        <div class="container">
            <h2>Mis Proyectos</h2>
        </div>
        <livewire:app.projects-view></livewire:app.projects-view>
    @endcan
@endsection

@section('preloader')
    <div id="app-splash" class="app-splash">
        <div class="splash-content">
            <div class="spinner-border text-light"></div>
            <h5 class="mt-3 text-light"><span class="text-primary"><b>BIM</b>NOVA</span> AR</h5>
            <p class="text-light">Cambiando Pestaña...</p>
        </div>
    </div>
@endsection

@section('css')
    <style>
        .app-splash {
            /* position: fixed; */
            width: 100%;
            height: 100vh;
            inset: 0;
            background: radial-gradient(circle, #0f1117, #05070c);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.5s ease, visibility 0.5s ease;
        }

        .splash-content {
            text-align: center;
            color: #e6e6e6;
        }
    </style>
@endsection
