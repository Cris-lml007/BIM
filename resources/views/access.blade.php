@extends('adminlte::page')

@section('title', 'Accesos')

@section('content')
<div class="row pt-4">
    <div class="col-12">
        <livewire:admin.access-view />
    </div>
</div>
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