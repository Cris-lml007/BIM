@extends('layouts.main')

@section('header')
    <div class="container d-flex justify-content-between">
        <h1>Documentos del proyecto</h1>
        <button data-bs-toggle="modal" data-bs-target="#modal-document" class="btn btn-primary">
            <i class="fas fa-cloud-upload-alt me-2 "></i>

            Subir
        </button>
    </div>
@endsection

@section('content_body')
    <div class="container">
    </div>

    <x-modal id="modal-document" title="Documento" class="modal-lg">
        <livewire:app.project-document-form :project="$project"
            modal_name="modal-document"></livewire:app.project-document-form>
    </x-modal>
@endsection