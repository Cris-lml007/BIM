@extends('layouts.main')

@section('header')
    <h1>Modelos 3D</h1>
    <button data-bs-toggle="modal" data-bs-target="#modal-3d" class="btn btn-primary"><i class="fa fa-plus"></i> Subir
        Modelo</button>
@endsection

@section('content_body')
    <livewire:app.model3d-view :project="$project"></livewire:app.model3d-view>

    <x-modal id="modal-3d" class="modal-lg" title="Subir Modelo 3D" wire:ignore="">
        <livewire:app.model3d-form :project="$project" wire:key="model3d-form"></livewire:app.model3d-form>
    </x-modal>

    <livewire:3d.simple-view></livewire:3d.simple-view>
@endsection
