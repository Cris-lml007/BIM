<div>
    <style>
        #ar-ui-container {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 1;
        }

        .ar-controls {
            position: absolute;
            left: 50%;
            bottom: 40px;
            transform: translateX(-50%);
            width: 300px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            pointer-events: auto;
        }

        .ar-panel {
            background: rgba(17, 17, 17, 0.85);
            border-radius: 12px;
            padding: 15px 20px;
            color: white;
        }

        .ar-panel label {
            display: block;
            margin-bottom: 10px;
            text-align: center;
            font-weight: bold;
        }

        #ar-opacity {
            width: 100%;
        }

        /* Property Filters */
        .ar-filter-section {
            max-height: 300px;
            overflow-y: auto;
        }

        .ar-filter-section select,
        .ar-filter-section input[type="text"] {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 6px;
            padding: 8px 12px;
            width: 100%;
            margin-bottom: 10px;
        }

        .ar-filter-section select option {
            background: #1a1a1a;
            color: white;
        }

        .ar-filter-buttons {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }

        .ar-filter-buttons button {
            flex: 1;
            padding: 8px;
            border-radius: 6px;
            font-size: 12px;
        }

        .ar-filter-chip {
            background: rgba(37, 99, 235, 0.3);
            border: 1px solid rgba(37, 99, 235, 0.5);
            border-radius: 6px;
            padding: 6px 10px;
            margin-bottom: 6px;
        }

        .ar-filter-chip .ar-filter-remove {
            color: white;
            background: transparent;
            border: none;
            padding: 0;
            margin-left: 5px;
        }

        .ar-filter-chip .ar-filter-remove:hover {
            color: #ef4444;
        }

        /* Categories */
        .ar-category-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            margin-bottom: 6px;
            transition: background 0.2s;
        }

        .ar-category-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .ar-category-item input {
            accent-color: #2563eb;
        }

        .ar-category-item span:first-of-type {
            font-size: 13px;
        }

        /* Reset button */
        .ar-reset-btn {
            width: 100%;
            padding: 10px;
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #ef4444;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .ar-reset-btn:hover {
            background: rgba(239, 68, 68, 0.3);
        }
    </style>

    <h1>AR</h1>

    <div id="viewer"
         class="viewport"
         data-url="{{ route('app.Attachment', 1) }}"
         data-type="{{ $model->model->type }}">
    </div>

    <div id="ar-ui-container">

        <div class="ar-controls">

            <!-- Opacidad -->
            <div class="ar-panel">
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

            <!-- Filtros de Properties -->
            <div class="ar-panel ar-filter-section">
                <label>Filtrar por Propiedades</label>

                <select id="ar-property-key">
                    <option value="">Seleccionar propiedad</option>
                </select>

                <select id="ar-property-value" disabled>
                    <option value="">Seleccionar valor</option>
                </select>

                <div class="ar-filter-buttons">
                    <button
                        type="button"
                        id="ar-apply-property"
                        class="btn btn-primary btn-sm"
                        disabled>
                        Aplicar
                    </button>
                    <button
                        type="button"
                        id="ar-clear-property"
                        class="btn btn-secondary btn-sm">
                        Limpiar
                    </button>
                </div>

                <div id="ar-property-filters" class="mt-3">
                    <div class="small text-white-50">
                        Sin filtros activos
                    </div>
                </div>
            </div>

            <!-- Categorías -->
            <div class="ar-panel ar-filter-section">
                <label>Categorías IFC</label>

                <div id="ar-categories-container">
                    <!-- Se llena dinámicamente -->
                </div>
            </div>

            <!-- Reset -->
            <button
                type="button"
                id="ar-reset-filters"
                class="ar-reset-btn">
                <i class="bi bi-arrow-counterclockwise me-2"></i>
                Reiniciar Filtros
            </button>

        </div>

    </div>
</div>
