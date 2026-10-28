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
            z-index: 10;
            pointer-events: none;
        }

        .ar-opacity {
            position: absolute;
            left: 50%;
            bottom: 40px;
            transform: translateX(-50%);

            width: min(300px, calc(100% - 40px));

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
            display: block;
            width: 100%;
            cursor: pointer;
        }
    </style>


    <h1>Visor AR</h1>


    {{-- ================================================= --}}
    {{-- VISOR --}}
    {{-- ================================================= --}}

    <div
        id="viewer"
        class="viewport"
        data-url="{{ route('app.Attachment', 1) }}"
        data-type="{{ $model->model->type }}"
    ></div>


    {{-- ================================================= --}}
    {{-- INTERFAZ AR --}}
    {{-- ================================================= --}}

    <div
        id="ar-ui-container"
        style="display: none;"
    >

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
                step="1"
            >

        </div>

    </div>

</div>
