@extends('layouts.main')

@section('header')
    <div class="container d-flex justify-content-between">
        <h1>Miembros del proyecto</h1>
        <button data-bs-toggle="modal" data-bs-target="#modal-member" class="btn btn-primary"><i class="fa fa-plus"></i>
            Invitar</button>
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