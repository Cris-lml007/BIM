<div>
    <form wire:submit.prevent="save">
        <div class="modal-body">
            <div class="row mb-3">
                <div class="col-md-12">
                    <label for="user_id">Usuario*</label>
                    <input type="text" class="form-control mb-2" placeholder="Buscar usuario..."
                        wire:model.live="userSearch">
                    <select class="form-select" wire:model="user_id">
                        <option value="">Seleccione Usuario</option>
                        @foreach ($users as $user)
                            <option value="{{ $user->id }}">{{ $user->name }} ({{ $user->email }})</option>
                        @endforeach
                    </select>
                    @error('user_id') <span class="text-danger">{{ $message }}</span> @enderror
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="max_projects">Máximo de Proyectos*</label>
                    <input type="number" class="form-control" wire:model="max_projects" placeholder="Ej: 10">
                    @error('max_projects') <span class="text-danger">{{ $message }}</span> @enderror
                </div>
                <div class="col-md-6">
                    <label for="max_users">Máximo de Usuarios*</label>
                    <input type="number" class="form-control" wire:model="max_users" placeholder="Ej: 5">
                    @error('max_users') <span class="text-danger">{{ $message }}</span> @enderror
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="available">Fecha Inicio*</label>
                    <input type="date" class="form-control" wire:model="available">
                    @error('available') <span class="text-danger">{{ $message }}</span> @enderror
                </div>
                <div class="col-md-6">
                    <label for="available_end">Fecha Fin*</label>
                    <input type="date" class="form-control" wire:model="available_end">
                    @error('available_end') <span class="text-danger">{{ $message }}</span> @enderror
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Cerrar</button>
            <button class="btn btn-primary" type="submit">Guardar</button>
        </div>
    </form>
</div>

@script
<script>

    this.$js.closeModal = () => {
        $("#" + $wire.modal_name).modal('hide');
    };
</script>
@endscript