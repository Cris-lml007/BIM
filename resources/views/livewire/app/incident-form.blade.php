<div>
    <form wire:submit="save">
        <div>
            <div class="p-3">
                <!-- Título -->
                <div class="mb-3">
                    <label class="form-label">Título</label>
                    <input type="text" class="form-control" wire:model="titulo" required
                        placeholder="Titulo breve del problema...">
                    @error('titulo')
                        <small class="text-danger">{{ $message }}</small>
                    @enderror
                </div>

                <!-- Descripción -->
                <div class="mb-3">
                    <label class="form-label">Descripción</label>
                    <textarea class="form-control" rows="3" wire:model="descripcion" placeholder="Detalle técnico del problema"></textarea>
                    @error('descripcion')
                        <small class="text-danger">{{ $message }}</small>
                    @enderror
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Prioridad</label><select class="form-select" wire:model="prioridad" required>

                            <option value="">Seleccionar</option>
                            <option value="3">Alta</option>
                            <option value="2">Media</option>
                            <option value="1">Baja</option>

                        </select>

                        @error('prioridad')
                            <small class="text-danger">{{ $message }}</small>
                        @enderror
                    </div>

                        <div class="col-6">
                            <label for="">Modelo</label>
                            <select name="" id="" class="form-select" wire:model="modelo" required>
                                <option value="">Seleccionar</option>
                                <option value="1">Red</option>
                            </select>
                        </div>
                </div>

                <!-- Coordenadas -->
                <div class="row align-items-end g-2 bg-light p-2 mb-3 rounded">

                    <div class="col-md-3">
                        <h6 class="fw-bold">Coordenadas</h6>
                    </div>

                    <div class="col-md-3">
                        <input type="number" step="0.01" class="form-control" placeholder="X" wire:model="x" required>
                    </div>

                    <div class="col-md-3">
                        <input type="number" step="0.01" class="form-control" placeholder="Y" wire:model="y" required>
                    </div>

                    <div class="col-md-3">
                        <input type="number" step="0.01" class="form-control" placeholder="Z" wire:model="z" required>
                    </div>

                </div>
                <!-- Botones -->
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-secondary" type="button" data-bs-dismiss="modal"
                        wire:click="resetForm">Cerrar</button>


                    <button type="submit" class="btn btn-primary" wire:loading.attr="disabled">
                        <span wire:loading.remove>Guardar</span>
                        <span wire:loading>Guardando...</span>
                    </button>
                </div>

            </div>
        </div>
    </form>
</div>
