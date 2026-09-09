

<div>
    <style>
.viewport {
    position: relative;
    width: 100%;
    height: 80vh;
}

.opacity-control {
    position: absolute;
    z-index: 10;

    left: 20px;
    bottom: 20px;

    width: 220px;

    padding: 12px;

    background: rgba(0, 0, 0, 0.65);
    border-radius: 8px;

    color: white;
}

.opacity-control label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
}

.opacity-control input {
    width: 100%;
}

    </style>

    <h1>asda</h1>
    <div class="viewport" id="viewer" data-url="{{ route('app.Attachment', 1) }}" data-type="{{ $model->model->type }}">

        <div class="opacity-control">
            <label for="opacity">
                Opacidad:
                <span id="opacity-value">100%</span>
            </label>

            <input type="range" id="opacity" min="0" max="100" value="100" step="1">
        </div>

    </div>

</div>
