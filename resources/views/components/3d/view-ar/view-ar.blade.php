<div>
    <style>
    #ar-viewer-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

#ar-ui-container {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 16px;
    pointer-events: auto;
    z-index: 10;
}

.ar-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 60vh;
    overflow-y: auto;
    background: rgba(17, 24, 39, 0.85);
    border-radius: 12px;
    padding: 14px;
}

.ar-force-btn {
    width: 100%;
    padding: 14px;
    background: rgba(37, 99, 235, 0.95);
    border: 1px solid rgba(59, 130, 246, 1);
    color: white;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    transition: all 0.2s;
}
.ar-force-btn:hover, .ar-force-btn:active {
    background: rgba(29, 78, 216, 1);
    transform: scale(0.98);
}

.ar-slider-group, .ar-filters-panel, .ar-categories-panel {
    color: white;
}

.ar-slider-group input[type="range"] {
    width: 100%;
}

.ar-filters-panel select,
.ar-filter-buttons button,
#ar-reset-filters {
    width: 100%;
    padding: 10px;
    margin-top: 6px;
    border-radius: 8px;
    border: none;
}

.ar-chips-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

.ar-filter-chip {
    background: rgba(59, 130, 246, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.ar-filter-remove {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-weight: bold;
}

#ar-categories-container {
    max-height: 150px;
    overflow-y: auto;
    margin-top: 8px;
}

.ar-category-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-size: 13px;
}
    </style>
    <div id="ar-viewer-container" data-url="{{ $attachmentUrl ?? route('dashboard.attachment.download', $attachment->id ?? 1) }}"></div>

<div id="ar-ui-container">
    <div class="ar-controls">
        <!-- NUEVO: botón de colocación forzada -->
        <button type="button" id="ar-force-place" class="ar-force-btn">
            <i class="bi bi-geo-alt-fill me-2"></i>
            Colocar modelo aquí
        </button>

        <div class="ar-slider-group">
            <label for="ar-opacity">Opacidad del modelo</label>
            <input type="range" id="ar-opacity" min="0" max="1" step="0.05" value="1">
        </div>

        <div class="ar-filters-panel">
            <h4>Filtrar por propiedad</h4>
            <select id="ar-property-key">
                <option value="">Selecciona una propiedad...</option>
            </select>
            <select id="ar-property-value" disabled>
                <option value="">Selecciona un valor...</option>
            </select>
            <div class="ar-filter-buttons">
                <button type="button" id="ar-apply-property" disabled>Aplicar</button>
                <button type="button" id="ar-clear-property">Limpiar</button>
            </div>
            <div id="ar-property-filters" class="ar-chips-container"></div>
        </div>

        <div class="ar-categories-panel">
            <h4>Categorías IFC</h4>
            <div id="ar-categories-container"></div>
        </div>

        <button type="button" id="ar-reset-filters">Reset de filtros</button>
    </div>
</div>
</div>
