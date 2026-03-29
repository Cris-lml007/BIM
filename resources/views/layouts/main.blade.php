@extends('adminlte::page')

@section('content')
<div class="container">
    <div class="content-header" style="padding: 15px 0 !important;">
        <div class="container-fluid" style="--bs-gutter-x: 0rem !important;">
            <div class="d-flex justify-content-between mt-3">
                @yield('header')
            </div>
        </div>
    </div>
</div>

    @yield('content_body')
@endsection
