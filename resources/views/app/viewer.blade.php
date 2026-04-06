@extends('layouts.main')

@section('header')
<h1>{{ $p_name }} > {{ $m_name }}</h1>
@endsection

@section('content_body')
@php
@endphp
    <livewire:3d.viewer id="{{ $model }}"></livewire:3d.viewer>
@endsection
