@extends('layouts.main')

@section('header')
    <div class="container">
        <div class="d-flex justify-content-between align-items-center">

            <div class="d-flex align-items-center gap-3">
                <small class="text-muted">
                    <i class="fas fa-folder-open me-1"></i> {{ $project->name }}
                </small>
                <h3 class="mb-0">Documentos</h3>
            </div>

            <button data-bs-toggle="modal" data-bs-target="#modal-document" class="btn btn-primary"
                @if(empty($project->ownerAccess())) disabled @endif>
                <i class="fas fa-cloud-upload-alt me-2 "></i>
                Subir
            </button>
        </div>
        <hr class="mt-3 mb-4">
    </div>

@endsection
@section('preloader')
    @include('layouts.main') 
@endsection
@section('content_body')
    <div class="container">
        <livewire:app.project-documente-view :project="$project"></livewire:app.project-documente-view>
    </div>

    <x-modal id="modal-document" title="Documento" class="modal-lg">
        <livewire:app.project-document-form :project="$project"
            modal_name="modal-document"></livewire:app.project-document-form>
    </x-modal>
@endsection