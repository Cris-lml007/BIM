@extends('layouts.main')

@section('header')
    <div class="container">
        <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-3">
                <small class="text-muted">
                    <i class="fas fa-folder-open me-1"></i> {{ $project->name }}
                </small>
                <h3 class="mb-0">Miembros del proyecto</h3>
            </div>
            <button data-bs-toggle="modal" data-bs-target="#modal-member" class="btn btn-primary"
                @if(empty($project->ownerAccess())) disabled @endif>
                <i class="fa fa-plus"></i> Invitar
            </button>
        </div>
        <hr class="mt-3 mb-4">
    </div>
@endsection

@section('content_body')
    <div class="container">
        <livewire:app.project-members-view :project="$project"></livewire:app.project-members-view>
    </div>

    <x-modal id="modal-member" title="Invitar" class="modal-md">
        <livewire:app.project-member-form :project="$project" modal_name="modal-member"></livewire:app.project-member-form>
    </x-modal>
@endsection
