<div>
    <form wire:submit.prevent="save">
        <div class="modal-body">
            <div class="row mb-3">
                <div class="col-md-12">
                    <label for="user_id">Usuario*</label>
                    @if ($user)
                        <select class="form-select" wire:model="user_id">
                            <option value="{{ $user->id }}">
                                {{ $user->name }} ({{ $user->email }})
                            </option>
                        </select>
                    @endif
                </div>
            </div>

            <div class="row g-4 mb-4">
                <!-- Proyectos -->
                <div class="col-md-4">
                    <label class="form-label fw-semibold ">
                        <i class="fas fa-folder-open me-1"></i> Proyectos *
                    </label>
                    <input type="number" class="form-control" wire:model="max_projects" placeholder="" min="1">
                    @error('max_projects')
                        <span class="text-danger small">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Usuarios -->
                <div class="col-md-4">
                    <label class="form-label fw-semibold ">
                        <i class="fas fa-users me-1"></i> Usuarios *
                    </label>
                    <input type="number" class="form-control" wire:model="max_users" placeholder="" min="1">
                    @error('max_users')
                        <span class="text-danger small">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Espacio -->
                <div class="col-md-4">
                    <label class="form-label fw-semibold ">
                        <i class="fas fa-database me-1"></i> Espacio máximo *
                    </label>
                    <div class="input-group">
                        <input type="number" class="form-control" wire:model="max_space" placeholder="1024"
                            min="1">
                        <select name="unit" id="" class="form-select" wire:model="unit">
                            @foreach ($unit_space as $key => $value)
                                <option value="{{ $key }}">{{ $value }}</option>
                            @endforeach
                        </select>
                    </div>

                    @error('max_space')
                        <span class="text-danger small">{{ $message }}</span>
                    @enderror
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="available">Fecha Inicio*</label>
                    <input readonly type="date" class="form-control" wire:model="available">

                </div>

                <div class="col-md-6">
                    <label for="available_end">Fecha Fin*</label>
                    <input type="date" class="form-control" wire:model="available_end">
                    @error('available_end')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
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
