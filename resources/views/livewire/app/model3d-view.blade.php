<div>
    <x-slot name="header">
        <h1>Modelos 3D</h1>
        <button data-bs-toggle="modal" data-bs-target="#modal-3d" class="btn btn-primary"><i class="fa fa-plus"></i> Subir Modelo</button>
    </x-slot>

    <div class="container">
        <div class="row">
            <div class="col-3">
                <div class="card">
                    <img class="card-img-top" src="https://neliosoftware.com/es/wp-content/uploads/sites/3/2018/07/aziz-acharki-549137-unsplash-1200x775.jpg" alt="">
                    <div class="card-body">
                        <h5 class="card-title">Imagen</h5>
                        <p class="card-text">fhalfjakfhskhj</p>
                    </div>
                    <button class="btn btn-primary" style="border-top-left-radius: 0;border-top-right-radius: 0;">Abrir</button>
                </div>
            </div>

            <div class="col-3">
                <div class="card">
                    <img class="card-img-top" src="https://neliosoftware.com/es/wp-content/uploads/sites/3/2018/07/aziz-acharki-549137-unsplash-1200x775.jpg" alt="">
                    <div class="card-body">
                        <h5 class="card-title">Imagen</h5>
                        <p class="card-text">fhalfjakfhskhj</p>
                    </div>
                    <button class="btn btn-primary" style="border-top-left-radius: 0;border-top-right-radius: 0;">Abrir</button>
                </div>
            </div>
            <div class="col-3">
                <div class="card">
                    <img class="card-img-top" src="https://neliosoftware.com/es/wp-content/uploads/sites/3/2018/07/aziz-acharki-549137-unsplash-1200x775.jpg" alt="">
                    <div class="card-body">
                        <h5 class="card-title">Imagen</h5>
                        <p class="card-text">fhalfjakfhskhj</p>
                    </div>
                    <button class="btn btn-primary" style="border-top-left-radius: 0;border-top-right-radius: 0;">Abrir</button>
                </div>
            </div>
            <div class="col-3">
                <div class="card">
                    <img class="card-img-top" src="https://neliosoftware.com/es/wp-content/uploads/sites/3/2018/07/aziz-acharki-549137-unsplash-1200x775.jpg" alt="">
                    <div class="card-body">
                        <h5 class="card-title">Imagen</h5>
                        <p class="card-text">fhalfjakfhskhj</p>
                    </div>
                    <button class="btn btn-primary" style="border-top-left-radius: 0;border-top-right-radius: 0;">Abrir</button>
                </div>
            </div>
        </div>
    </div>

    <x-modal id="modal-3d" class="modal-lg" title="Subir Modelo 3D">
        <livewire:app.model3d-form></livewire:app.model3d-form>
    </x-modal>
</div>
