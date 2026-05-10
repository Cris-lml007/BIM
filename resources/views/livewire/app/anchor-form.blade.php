<div>
    <div class="modal-body">
        <div class="row">
            <div class="col" style="width: 40%;">
                <div class="d-flex justify-content-end item-align-center">
                    <img src="{{ $qr ?? '' }}" alt="{{ $qr ?? '' }}" class="w-100">
                </div>
            </div>
            <div class="col">
                <label for="">Nombre</label>
                <input type="text" class="form-control" wire:model="name">
                <label for="">Modelo</label>
                <input type="text" class="form-control" disabled wire:model="model">
                <label for="">Estado</label>
                <select class="form-select" wire:model="status">
                    <option value="1">Activo</option>
                    <option value="0">Deshabilitado</option>
                </select>
                <label for="">Creado Por</label>
                <input type="text" class="form-control" disabled wire:model="by">
                <label for="">Creado En:</label>
                <input type="date" class="form-control" disabled wire:model="create_at">
            </div>
        </div>
    </div>
    <div class="modal-footer">
        <a href="{{ route('app.project.model3d.id', ['project' => $project_id, 'model' => $model_id]) }}" class="btn btn-primary">Ir a modelo</a>
        <button class="btn btn-secondary">Cerrar</button>
    </div>
</div>
