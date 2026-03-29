<div>
    <div id="viewer-wrapper" style="position: relative;">

        <div id="loading"
            style="
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.8);
                    z-index: 10;
                    ">
            <div>
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Cargando modelo...</p>
            </div>
        </div>

        <div class="row" style="height: 500px;">

            <!-- VIEWER -->
            <div class="col d-flex" style="height: 100%;">
                <div id="viewer" data-url="{{ route('model3d', $model->model->id) }}" style="flex: 1;">
                </div>
                <div id="viewer-controls" style="position:absolute; top:10px; right:10px; z-index:20;">
                    <button class="btn btn-sm btn-light" data-view="front">Front</button>
                    <button class="btn btn-sm btn-light" data-view="top">Top</button>
                    <button class="btn btn-sm btn-light" data-view="left">Left</button>
                    <button class="btn btn-sm btn-light" data-view="iso">Iso</button>
                    <button class="btn btn-sm btn-primary" data-action="fit">Fit</button>
                </div>
            </div>

            <!-- PANEL -->
            <div class="col-3 d-flex flex-column" style="height: 100%;">
                <label>Materiales</label>

                <div style="flex: 1; overflow-y: auto;">
                    <table class="table mb-0" id="materials-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th><i class="nf nf-fa-eye"></i></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>

        </div>
    </div>
</div>

