@extends('adminlte::page')

@section('content')
    <div class="content-header" style="padding-left: 0 !important;padding-left: 0 !important;">
        <div class="container-fluid" style="--bs-gutter-x: 0rem !important;">
            <div class="d-flex justify-content-between mt-6">
                @yield('header')
            </div>
        </div>
    </div>

    @yield('content_body')
@endsection
