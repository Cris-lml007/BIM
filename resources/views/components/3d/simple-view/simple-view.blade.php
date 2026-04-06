<div>
    <!-- <div id="viewer" class="w-100" style="height: 300px;"></div> -->
    <!-- <button class="btn btn-secondary w-100" id="btn-generate" type="button">Generar Imagen</button> -->

    <div style="position: relative;">
        <!-- LOADER -->
        <div id="viewer-loader"
            style="
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            background: rgba(255,255,255,0.8);
            z-index:10;
            flex-direction: column;
        ">
            <div class="spinner-border text-primary"></div>
            <small class="mt-2" id="viewer-progress">Subir Modelo</small>
        </div>

        <!-- VIEWER -->
        <div id="viewer" class="w-100" style="height: 300px;"></div>
    </div>

    <button class="btn btn-secondary w-100 mt-2" id="btn-generate" type="button">
        Generar Imagen
    </button>
</div>
