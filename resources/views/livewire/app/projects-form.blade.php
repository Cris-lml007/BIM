<div>
    <form wire:submit="save">
        <div class="modal-body">
            <div class="row">
                <div class="col">
                    <label for="">Nombre</label>
                    <input type="text" class="form-control" placeholder="Ingrese Nombre de Proyecto" wire:model="name">
                </div>
            </div>
            <div class="row">
                <div class="col">
                    <label for="">Descripción</label>
                    <textarea cols="30" rows="3" class="form-control" placeholder="Ingrese Descripción del Proyecto" wire:model="description"></textarea>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="submit" class="btn btn-primary">Crear</button>
            <button type="reset" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        </div>
    </form>
</div>
