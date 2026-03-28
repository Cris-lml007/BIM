<div>
    <form wire:submit="save">
        <div class="modal-body">
            <div class="row mb-3">
                <div class="col">
                    <label for="">Nombre</label>
                    <input type="text" class="form-control" placeholder="Ingrese Nombre" wire:model="name">
                    @error('name')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <label for="">Descripción</label>
                    <textarea rows="3" class="form-control" placeholder="Ingrese Descripción" wire:model="description"></textarea>
                    @error('description')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <label for="">Subir Modelo</label>
                    <input type="file" class="form-control" id="file-input" wire:model="file" accept=".glb">
                    <input type="file" class="d-none" id="thumbnail" wire:model="thumbnail">
                    @error('file')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
            </div>
            <div class="row mb-3">
                @island
                    <livewire:3d.simple-view></livewire:3d.simple-view>
                @endisland
            </div>

        </div>
        <div class="modal-footer">
            <button type="submit" class="btn btn-primary">Guargar</button>
            <button data-bs-dismiss="modal" type="reset" class="btn btn-secondary">Cancelar</button>
        </div>
    </form>
</div>
