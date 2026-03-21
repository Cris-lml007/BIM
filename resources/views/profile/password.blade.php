@extends('adminlte::page')

@section('title', 'Configuración de Cuenta')

@section('content_header')
    <h1>Cambiar Contraseña</h1>
@stop

@section('content')
    <div class="row justify-content-center">
        <div class="col-md-6 p-4">
            @livewire('profile.update-password')
        </div>
       
    </div>
@stop

@section('css')
    @livewireStyles
@stop

@section('js')
    @livewireScripts
@stop
