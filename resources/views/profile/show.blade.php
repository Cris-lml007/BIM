@extends('adminlte::page')

@section('title', 'Configuración de Cuenta')

@section('content_header')
    <h1>Configuración de Cuenta</h1>
@stop

@section('content')
    <div class="row">
        <div class="col-md-12 p-4">
            @livewire('profile.update-profile-information')
        </div>
       
    </div>
@stop

@section('css')
    @livewireStyles
@stop

@section('js')
    @livewireScripts
@stop
