@extends('adminlte::page')

@section('title', 'Accesos')

@section('content_header')
<livewire:base-modal />
<div class="container">
    <div class="row">
        <div class="col-md-6">

            <h1>Accesos</h1>
        </div>

        <div class="col-md-6 d-flex align-items-end justify-content-end">
            <x-button onclick="Livewire.dispatch('openModal', {
        view: 'access.modals.access-create',
        data: {},
        title: 'Crear acceso',
        isSave: true,
        textBtnSave: 'Guardar'
    })" type="primary">
                Agregar acceso
            </x-button>
        </div>

    </div>
</div>

@stop

@section('content')
<!-- DASHBOARD DE ACCESOS LIMPIO -->
<div class="container my-2">

    <!-- RESUMEN DE USUARIOS -->
    <div class="row g-3 mb-4">
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">128</h3>
                <h6 class="mb-1 text-secondary">Activos</h6>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">23</h3>
                <h6 class="mb-1 text-secondary">Inactivos</h6>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">23</h3>
                <h6 class="mb-1 text-secondary">Supervisados</h6>
            </div>
        </div>
    </div>

    <livewire:access-table />

</div>


<x-confirmation title="Bloquear usuario" message="¿Deseas bloquear este usuario?" confirmButtonText="Bloquear"
    type="warning" />

@stop

@section('css')
<!-- BOOTSTRAP 5 -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
@livewireStyles
@stop

@section('js')
@livewireScripts
@stop