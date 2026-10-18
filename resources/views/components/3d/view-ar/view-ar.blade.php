
<div>
    <style>
        #viewer {
            position: relative;
            width: 100%;
            height: 75vh;
            min-height: 400px;
            overflow: hidden;
            background: transparent;
        }

        #viewer canvas {
            display: block;
            width: 100%;
            height: 100%;
        }

        #ar-ui-container {
            position: fixed;
            inset: 0;
            z-index: 5;
            pointer-events: none;
        }

        .ar-opacity {
            position: absolute;
            left: 50%;
            bottom: 30px;
            transform: translateX(-50%);
            width: min(300px, calc(100vw - 40px));
            padding: 14px 18px;
            background: rgba(17, 24, 39, 0.92);
            color: white;
            border-radius: 12px;
            pointer-events: auto;
            box-sizing: border-box;
        }

        .ar-opacity label {
            display: block;
            margin-bottom: 8px;
            text-align: center;
            font-weight: 600;
        }

        #ar-opacity {
            display: block;
            width: 100%;
        }

        #ar-bim-filters {
            position: absolute;
            top: 12px;
            left: 12px;
            width: min(340px, calc(100vw - 24px));
            max-height: 55vh;
            overflow-y: auto;
            padding: 12px;
            border-radius: 12px;
            background: rgba(17, 24, 39, 0.94);
            color: white;
            font-size: 14px;
            pointer-events: auto;
            box-sizing: border-box;
        }

        #ar-bim-filters summary {
            cursor: pointer;
            padding: 4px 0;
        }

        #ar-bim-filters label {
            display: block;
            margin: 8px 0 4px;
        }

        #ar-bim-filters select,
        #ar-bim-filters input[type="search"] {
            width: 100%;
            min-height: 36px;
            padding: 7px;
            border: 1px solid #64748b;
            border-radius: 6px;
            background: #fff;
            color: #111827;
            box-sizing: border-box;
        }

        #ar-bim-filters button {
            min-height: 34px;
            margin-top: 7px;
            padding: 6px 10px;
            border: 0;
            border-radius: 6px;
            background: #4f46e5;
            color: white;
            cursor: pointer;
        }

        #ar-bim-filters button:active {
            opacity: 0.8;
        }

        #ar-bim-filters hr {
            border: 0;
            border-top: 1px solid #475569;
            margin: 12px 0;
        }

        .ar-filter-section {
            margin-top: 10px;
        }

        .ar-category-list {
            max-height: 160px;
            overflow-y: auto;
            margin-top: 6px;
            padding: 6px;
            border: 1px solid #475569;
            border-radius: 6px;
        }

        #ar-bim-filters .ar-category-option {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0;
            padding: 6px 2px;
            overflow-wrap: anywhere;
        }

        .ar-category-option input {
            flex-shrink: 0;
        }

        .ar-property-filter {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-top: 6px;
            padding: 6px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            overflow-wrap: anywhere;
        }

        .ar-property-filter button {
            flex-shrink: 0;
            margin-top: 0 !important;
        }

        #ar-filter-info {
            margin-top: 10px;
            padding: 8px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            overflow-wrap: anywhere;
        }

        .ar-filter-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;
        }

        @media (max-width: 600px) {
            #ar-bim-filters {
                max-height: 43vh;
                font-size: 13px;
            }

            .ar-opacity {
                bottom: 16px;
            }

            #viewer {
                height: 70vh;
                min-height: 350px;
            }
        }
    </style>

    <h1>Realidad aumentada</h1>

    <div
        id="viewer"
        class="viewport"
        data-url="{{ route('app.Attachment', 1) }}"
        data-type="{{ $model->model->type }}">
    </div>

    <div id="ar-ui-container">
        <div class="ar-opacity">
            <label for="ar-opacity">
                Opacidad:
                <span id="ar-opacity-value">100%</span>
            </label>

            <input
                type="range"
                id="ar-opacity"
                min="0"
                max="100"
                value="100"
                step="1">
        </div>
    </div>
</div>
