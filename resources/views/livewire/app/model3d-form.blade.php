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
                    <input type="file" class="form-control" id="file-input" wire:model="file" accept=".glb,.ifc">
                    <input type="file" class="d-none" id="thumbnail" wire:model="thumbnail">
                    <input type="file" class="d-none" id="frag" wire:model="frag">
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
            <div wire:loading wire:target="file" class="mt-2">
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: 0%" id="upload-progress">
                    </div>
                </div>
            </div>

        </div>
        <div class="modal-footer">
            <button type="submit" class="btn btn-primary">Guargar</button>
            <button data-bs-dismiss="modal" type="reset" class="btn btn-secondary">Cancelar</button>
            <span wire:loading wire:target="save">
                <span class="spinner-border spinner-border-sm"></span>
                Subiendo...
            </span>
        </div>
    </form>
</div>
