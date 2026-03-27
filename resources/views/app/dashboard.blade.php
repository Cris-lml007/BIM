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
    {{-- <link rel="stylesheet" href="/css/admin_custom.css"> --}}
@endsection

@section('js')
    <script>
        console.log("Hi, I'm using the Laravel-AdminLTE package!");
    </script>
@endsection
