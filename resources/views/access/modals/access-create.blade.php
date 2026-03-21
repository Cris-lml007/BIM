<div>
    <form wire:submit.prevent="store">
        <div class="container ">

            <!-- Fila: Usuario + Buscar -->
            <div class="row mb-5 align-items-center justify-content-center">
                <div class="col-md-8">
                    <div class="input-group">
                        <input type="text" id="user" wire:model.defer="user" class="form-control input-focus"
                            placeholder="Nombre del usuario">
                        <x-button type="primary" wire:click="buscarUsuario">
                            <i class="fas fa-search"></i>
                        </x-button>
                    </div>
                    @error('user') <span class="text-danger">{{ $message }}</span> @enderror
                </div>

            </div>

            <!-- Fila: Max proyectos y Max usuarios -->
            <div class="row mb-5">
                <div class="col-md-6">
                    <label for="max_projects" class="form-label">Máx. proyectos</label>
                    <input type="number" id="max_projects" wire:model.defer="max_projects"
                        class="form-control input-focus" min="1" placeholder="0">
                    @error('max_projects') <span class="text-danger">{{ $message }}</span> @enderror
                </div>

                <div class="col-md-6">
                    <label for="max_users" class="form-label">Máx. usuarios</label>
                    <input type="number" id="max_users" wire:model.defer="max_users" class="form-control input-focus"
                        min="1" placeholder="0">
                    @error('max_users') <span class="text-danger">{{ $message }}</span> @enderror
                </div>
            </div>

            <!-- Fila: Tiempo de acceso -->
            <div class="row mb-3 justify-content-center align-items-center">
                <div class="col-md-8 text-center">
                    <label class="form-label">Tiempo de acceso</label>
                    <div class="d-flex gap-2 d-flex justify-content-center">
                        <input type="date" wire:model.defer="access_start" class="form-control input-focus">
                        <input type="date" wire:model.defer="access_end" class="form-control input-focus">
                    </div>
                    @error('access_start') <span class="text-danger">{{ $message }}</span> @enderror
                    @error('access_end') <span class="text-danger">{{ $message }}</span> @enderror
                </div>
            </div>

            <!-- Sección Resumen -->
            <div class="row">
                <div class="col-md-12">
                    <div class="card shadow-sm p-3 bg-light text-center">
                        <h6 class="fw-bold mb-2">Resumen del acceso:</h6>
                        <p>Usuario: <span class="fw-bold">150 días</span></p>
                        <p>Máx. proyectos: <span class="fw-bold">5</span></p>
                        <p>Máx. usuarios: <span class="fw-bold">150</span></p>
                        <p>Tiempo de acceso: <span class="fw-bold">150 días</span></p>
                        <p>Fecha de Inicio: <span class="fw-bold">150 días</span></p>
                        <p>Fecha de fin: <span class="fw-bold">150 días</span></p>

                    </div>
                </div>
            </div>

        </div>
    </form>

</div>