@extends('layouts.main')

@section('header')
    {{ $header ?? '' }}
@endsection

@section('content_body')
{{ $slot }}
@endsection
