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

@section('preloader')
    <div id="app-splash" class="app-splash">
        <div class="splash-content">
            <div class="spinner-border text-light"></div>
            <h5 class="mt-3 text-light"><span class="text-primary"><b>BIM</b>NOVA</span> AR</h5>
            <p class="text-light">Cambiando Pestaña...</p>
        </div>
    </div>
@endsection

@section('css')
    <style>
        .app-splash {
            /* position: fixed; */
            width: 100%;
            height: 100vh;
            inset: 0;
            background: radial-gradient(circle, #0f1117, #05070c);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.5s ease, visibility 0.5s ease;
        }

        .splash-content {
            text-align: center;
            color: #e6e6e6;
        }
    </style>
@endsection
