

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

</div>

</div>
