<div>
    <form>
        <div class="modal-body">
            <div class="row mb-3">
                <div class="col">
                    <label for="">Nombre</label>
                    <input type="text" class="form-control" placeholder="Ingrese Nombre">
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <label for="">Descripción</label>
                    <textarea rows="3" class="form-control" placeholder="Ingrese Descripción"></textarea>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <label for="">Subir Modelo</label>
                    <input type="file" class="form-control" id="file-input">
                </div>
            </div>
            <div class="row mb-3">
                <livewire:3d.simple-view></livewire:3d.simple-view>
            </div>

        </div>
        <div class="modal-footer">
            <button type="submit" class="btn btn-primary">Guargar</button>
            <button type="reset" class="btn btn-secondary">Cancelar</button>
        </div>
    </form>
</div>
