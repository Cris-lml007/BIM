@extends('layouts.main')

@section('header')
<div class="container d-flex justify-content-between">
    <h1>Gestión de Usuarios</h1>
    <button data-bs-toggle="modal" data-bs-target="#modal-user" class="btn btn-primary"><i class="fa fa-plus"></i>
        Añadir Nuevo Usuario</button>

</div>
@endsection

@section('content_body')
<div class="container">
    <x-card>
        <livewire:admin.users-view></livewire:admin.users-view>
    </x-card>

</div>

    <x-modal id="modal-user" title="Nuevo Usuario" class="modal-lg">
        <livewire:admin.users-form modal_name="modal-user"></livewire:admin.users-form>
    </x-modal>
@endsection
