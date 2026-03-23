@extends('adminlte::page')

@section('content')
    <div class="content-header" style="padding: 0 !important;">
        <div class="container-fluid" style="--bs-gutter-x: 0rem !important;">
            <div class="d-flex justify-content-between my-3">
                @yield('header')
            </div>
        </div>
    </div>

    @yield('content_body')
@endsection
