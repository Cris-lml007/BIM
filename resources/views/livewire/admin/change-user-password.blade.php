<form wire:submit.prevent="save">
    <div class="modal-body">
        <label for="">Nueva Contraseña*</label>
        <input type="password" class="form-control" placeholder="Ingrese Nueva Contraseña" wire:model="password">
        @error('password')
            <span class="text-danger">{{ $message }}</span>
        @enderror

        <label for="" class="mt-3">Confirmar Nueva Contraseña*</label>
        <input type="password" class="form-control" placeholder="Confirme Nueva Contraseña" wire:model="password_confirmation">
        @error('password_confirmation')
            <span class="text-danger">{{ $message }}</span>
        @enderror
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar</button>
    </div>
</form>
