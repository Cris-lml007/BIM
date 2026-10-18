

<div>
    <style>

#ar-ui-container {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: block;
    pointer-events: none;
    font-family: Arial, sans-serif;
}

#ar-controls,
#ar-property-filter {
    display: none;
    position: absolute;
    pointer-events: auto;
    touch-action: auto;
}

#ar-controls {
    top: 12px;
    right: 12px;
    width: min(280px, calc(100vw - 24px));
    padding: 12px;
    color: white;
    background: rgba(20, 24, 32, .92);
    border-radius: 10px;
}

#ar-property-filter {
    top: 105px;
    left: 12px;
    width: min(290px, calc(100vw - 24px));
    max-height: calc(100dvh - 125px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 12px;
    color: white;
    background: rgba(20, 24, 32, .94);
    border-radius: 10px;
}

#ar-property-filter label {
    display: block;
    margin: 10px 0 4px;
    font-size: 12px;
}

#ar-property-filter select {
    display: block;
    width: 100%;
    min-height: 40px;
    padding: 6px;
    color: white;
    background: #343a40;
    border: 1px solid #666;
    border-radius: 5px;
    pointer-events: auto;
    touch-action: manipulation;
}

#ar-opacity {
    width: 100%;
    touch-action: pan-y;
}

.ar-filter-buttons {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.ar-filter-buttons button {
    flex: 1;
    min-height: 40px;
    border: 0;
    border-radius: 5px;
    touch-action: manipulation;
}

#ar-apply-filter {
    color: white;
    background: #0d6efd;
}

#ar-clear-filters {
    color: white;
    background: #495057;
}

.ar-filter-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    padding: 8px;
    background: rgba(255, 255, 255, .1);
    border-radius: 5px;
    overflow-wrap: anywhere;
}

.ar-filter-item button {
    flex-shrink: 0;
    min-width: 36px;
    min-height: 36px;
    color: white;
    background: #dc3545;
    border: 0;
    border-radius: 4px;
}

/* Errores visibles en el móvil */
#ar-error-panel {
    position: fixed;
    z-index: 20000;
    top: 12px;
    left: 12px;
    right: 12px;
    padding: 14px;
    color: white;
    background: #842029;
    border: 1px solid #f5c2c7;
    border-radius: 8px;
    font: 14px/1.4 Arial, sans-serif;
    overflow-wrap: anywhere;
    pointer-events: auto;
}

#ar-error-panel button {
    margin-top: 8px;
    padding: 8px 12px;
}

#ar-ui-container #ar-controls,
#ar-ui-container #ar-property-filter {
    position: absolute;
    pointer-events: auto;
    touch-action: auto;
}

#ar-controls {
    top: 12px;
    right: 12px;
    width: min(280px, calc(100vw - 24px));
    padding: 12px;
    color: white;
    background: rgba(20, 24, 32, 0.92);
    border-radius: 10px;
}

#ar-opacity {
    flex: 1;
    min-width: 0;
    touch-action: pan-y;
}

#ar-property-filter {
    top: 105px;
    left: 12px;
    width: min(290px, calc(100vw - 24px));
    max-height: calc(100dvh - 125px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 12px;
    color: white;
    background: rgba(20, 24, 32, 0.94);
    border-radius: 10px;
}

#ar-property-filter label {
    display: block;
    margin: 10px 0 4px;
    font-size: 12px;
}

#ar-property-filter select {
    display: block;
    width: 100%;
    min-height: 36px;
    padding: 6px;
    color: white;
    background: #343a40;
    border: 1px solid #666;
    border-radius: 5px;
    pointer-events: auto;
    touch-action: manipulation;
}

#ar-property-filter select:disabled {
    opacity: 0.5;
}

.ar-filter-buttons {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.ar-filter-buttons button {
    flex: 1;
    min-height: 38px;
    border: 0;
    border-radius: 5px;
    cursor: pointer;
    touch-action: manipulation;
}

#ar-apply-filter {
    color: white;
    background: #0d6efd;
}

#ar-apply-filter:disabled {
    opacity: 0.5;
}

#ar-clear-filters {
    color: white;
    background: #495057;
}

.ar-filter-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    overflow-wrap: anywhere;
}

.ar-filter-item button {
    flex-shrink: 0;
    min-width: 32px;
    min-height: 32px;
    color: white;
    background: #dc3545;
    border: 0;
    border-radius: 4px;
}

    </style>

    <h1>AR</h1>
<div id="viewer"
     class="viewport"
     data-url="{{ route('app.Attachment', 1) }}"
     data-type="{{ $model->model->type }}">
</div>


<div id="ar-ui-container">

    <div id="ar-controls">
        <label for="ar-opacity">Opacidad del modelo</label>

        <div class="d-flex align-items-center gap-2">
            <input
                type="range"
                id="ar-opacity"
                min="0"
                max="100"
                value="100">

            <span id="ar-opacity-value">100%</span>
        </div>
    </div>

    <div id="ar-property-filter">

        <div class="ar-panel-header">
            <strong>Filtros BIM</strong>
        </div>

        <label for="ar-pset">Property Set</label>
        <select id="ar-pset">
            <option value="">Seleccionar conjunto</option>
        </select>

        <label for="ar-property">Propiedad</label>
        <select id="ar-property" disabled>
            <option value="">Seleccionar propiedad</option>
        </select>

        <label for="ar-property-value">Valor</label>
        <select id="ar-property-value" disabled>
            <option value="">Seleccionar valor</option>
        </select>

        <div class="ar-filter-buttons">
            <button type="button" id="ar-apply-filter" disabled>
                Aplicar
            </button>

            <button type="button" id="ar-clear-filters">
                Limpiar
            </button>
        </div>

        <div id="ar-active-filters"></div>

    </div>

</div>

</div>

</div>
