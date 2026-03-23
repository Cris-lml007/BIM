@extends('adminlte::page')

@section('content_header')
<h1>Gestión de Usuarios</h1>
@endsection

@section('content')
<x-card>
    <livewire:users-view></livewire:users-view>
</x-card>
@endsection
