

<div>
    <style>
#ar-ui-container {
    position: fixed;
    inset: 0;

    pointer-events: none;

    z-index: 1;
}

.ar-opacity {
    position: absolute;

    left: 50%;
    bottom: 40px;

    transform: translateX(-50%);

    width: 300px;

    padding: 15px 20px;

    background: rgba(17, 17, 17, 0.85);

    border-radius: 12px;

    color: white;

    pointer-events: auto;
}

.ar-opacity label {
    display: block;

    margin-bottom: 10px;

    text-align: center;

    font-weight: bold;
}

#ar-opacity {
    width: 100%;
}

.ar-filter-panel {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 10;
    width: min(290px, calc(100vw - 24px));
    max-height: 45vh;
    overflow-y: auto;
    padding: 12px;
    border-radius: 10px;
    background: rgba(20, 24, 32, 0.92);
    color: white;
}

    </style>

    <h1>AR</h1>
<div id="viewer"
     class="viewport"
     data-url="{{ route('app.Attachment', 1) }}"
     data-type="{{ $model->model->type }}">
</div>

<div id="ar-ui-container">

    <div class="ar-opacity">
        <label>
            Opacidad:
            <span id="ar-opacity-value">100%</span>
        </label>

        <input
            type="range"
            id="ar-opacity"
            min="0"
            max="100"
            value="100"
            step="1"
        >
        </div>


<div id="ar-property-filter" class="ar-filter-panel">

    <div class="fw-bold mb-2">
        Filtrar elementos BIM
    </div>

    <label for="ar-pset" class="small">Property Set</label>
    <select id="ar-pset" class="form-select form-select-sm mb-2">
        <option value="">Seleccionar conjunto</option>
    </select>

    <label for="ar-property" class="small">Propiedad</label>
    <select id="ar-property" class="form-select form-select-sm mb-2" disabled>
        <option value="">Seleccionar propiedad</option>
    </select>

    <label for="ar-property-value" class="small">Valor</label>
    <select id="ar-property-value" class="form-select form-select-sm mb-2" disabled>
        <option value="">Seleccionar valor</option>
    </select>

    <div class="d-flex gap-2">
        <button id="ar-apply-filter" class="btn btn-primary btn-sm flex-grow-1" disabled>
            Aplicar
        </button>

        <button id="ar-clear-filters" class="btn btn-secondary btn-sm">
            Limpiar
        </button>
    </div>

    <div id="ar-active-filters" class="mt-2"></div>

</div>

</div>

</div>
