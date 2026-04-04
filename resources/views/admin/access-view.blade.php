@extends('layouts.main')

@section('header')
    <div class="container d-flex justify-content-between">
        <h1>Gestión de accesos</h1>
        <button data-bs-toggle="modal" data-bs-target="#modal-user" class="btn btn-primary"><i class="fa fa-plus"></i>
            Nuevo Acceso</button>
    </div>
@endsection

@section('content_body')
    <div class="container">
        <livewire:admin.access-view></livewire:admin.access-view>
    </div>

    <x-modal id="modal-user" title="Nuevo Acceso" class="modal-md">
        <livewire:admin.access-form modal_name="modal-user"></livewire:admin.access-form>
    </x-modal>
@endsection