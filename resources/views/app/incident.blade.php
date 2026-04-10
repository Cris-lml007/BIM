@extends('layouts.main')

@section('header')
    <div class="container">
        <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-3">
                <small class="text-muted">
                    <i class="fas fa-folder-open me-1"></i> {{ $project->name }}
                </small>
                <h3 class="mb-0">Incidentes</h3>
            </div>
            <button data-bs-toggle="modal" data-bs-target="#modal-incident" class="btn btn-primary"
                @if (empty($project->ownerAccess())) disabled @endif>
                <i class="fa fa-plus"></i> Registrar
            </button>
        </div>
        <hr class="mt-3 mb-4">
    </div>
@endsection

@section('content_body')
    <div class="contianer">
        <livewire:app.incident-view :project="$project"></livewire:app.incident-view>
    </div>


    <x-modal id="modal-incident" class="modal-md" title="Registrar Incidencia" wire:ignore="">
        <livewire:app.incident-form :project="$project" wire:key="modal-incident"></livewire:app.incident-form>
    </x-modal>
@endsection
