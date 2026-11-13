<div>
    <div class="modal-body">
        <div class="row">
            <div class="col">
                <label for="">Nombre</label>
                <input type="text" class="form-control" wire:model="name">
                @error('name')
                    <small class="text-danger">{{ $message }}</small>
                @enderror
            </div>
            <div class="col">
                <label for="">Prioridad</label>
                <select wire:model="priority" class="form-select">
                    <option value="3">Alta</option>
                    <option value="2">Media</option>
                    <option value="1">Baja</option>
                </select>
            </div>
        </div>
    </div>
    <div class="modal-footer">
        <button class="btn btn-primary" wire:click="save">Guardar</button>
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
    </div>
</div>
