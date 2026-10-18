
<div>
    <x-slot name="header">
        <h1>Visor 3D</h1>
    </x-slot>

    <div id="viewer"
         class="viewport"
         data-url="{{ route('app.Attachment', 1) }}"
         data-type="{{ $model->model->type }}">
    </div>

    <div class="mt-3">
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
            class="custom-range"
        >
    </div>
</div>
