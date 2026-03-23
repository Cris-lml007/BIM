@extends('adminlte::page')

@section('content_header')
<h1>Gestión de Usuarios</h1>
@endsection

@section('content')
<x-card>
    <livewire:admin.users-view></livewire:admin.users-view>
</x-card>
@endsection
