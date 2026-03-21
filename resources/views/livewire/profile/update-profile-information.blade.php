<div class="row">
    <div class="col-md-4">
        <!-- Profile Image -->
        <div class="card card-primary card-outline shadow-sm">
            <div class="card-body box-profile">
                <div class="text-center mb-3">
    <div class="position-relative d-inline-block">
        <img class="profile-user-img img-fluid img-circle shadow"
             src="https://ui-avatars.com/api/?name={{ urlencode($name) }}&background=111827&color=fff&size=128"
             alt="User profile picture"
             style="width: 110px; border: 4px solid #fff;">
    </div>
</div>

                <h3 class="profile-username text-center">{{ $name }}</h3>
                <p class="text-muted text-center">{{ $organization ?: 'Sin Organización' }}</p>

                <ul class="list-group list-group-unbordered mb-3">
                    <li class="list-group-item">
                        <b>Email</b> <span class="float-right text-muted">{{ $email }}</span>
                    </li>
                    <li class="list-group-item">
                        <b>Teléfono</b> <span class="float-right text-primary font-weight-bold">{{ $phone ?: 'No registrado' }}</span>
                    </li>
                </ul>
            </div>
            <!-- /.card-body -->
        </div>
        <!-- /.card -->
    </div>
    
    <div class="col-md-8">
        <div class="card card-primary shadow-sm">
            <div class="card-header">
                <h3 class="card-title"><i class="fas fa-edit mr-2"></i> Actualizar Teléfono</h3>
            </div>
            <!-- /.card-header -->
            <form wire:submit.prevent="updateProfileInformation">
                <div class="card-body">
                    @if (session('status') === 'profile-information-updated')
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            <i class="fas fa-check-circle mr-2"></i> Teléfono actualizado correctamente.
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                    @endif

                    <div class="form-group mb-4">
                        <label for="phone">Número de Teléfono</label>
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <span class="input-group-text"><i class="fas fa-phone"></i></span>
                            </div>
                            <input wire:model="phone" type="text" class="form-control form-control-lg @error('phone') is-invalid @enderror" id="phone" placeholder="Ingresa tu número de teléfono">
                            @error('phone') <span class="invalid-feedback">{{ $message }}</span> @enderror
                        </div>
                        <small class="form-text text-muted">Asegúrate de incluir el código de país si es necesario.</small>
                    </div>

                    <hr>

                    <h5 class="text-muted mb-2"><i class="fas fa-lock mr-2"></i> Información Restringida</h5>
                    <div class="row">
    <div class="col-md-6 mb-3">
        <div class="p-3 border rounded-3 bg-light">
            <small class="text-muted d-block">Nombre Completo</small>
            <span class="fw-semibold text-dark">{{ $name }}</span>
        </div>
    </div>

    <div class="col-md-6 mb-3">
        <div class="p-3 border rounded-3 bg-light">
            <small class="text-muted d-block">Organización</small>
            <span class="fw-semibold text-dark">{{ $organization }}</span>
        </div>
    </div>
</div>
                 
                </div>
                <!-- /.card-body -->
<div class="card-footer d-flex justify-content-end bg-white border-0 pt-3">
    <button type="submit"
            class="btn btn-dark d-flex align-items-center gap-2 px-4 py-2 rounded-3"
            wire:loading.attr="disabled"
            wire:loading.class="opacity-75">

        <span wire:loading wire:target="updateProfileInformation"
              class="spinner-border spinner-border-sm"
              role="status"></span>


        <i class="fas fa-check mr-2" wire:loading.remove wire:target="updateProfileInformation"></i>

        <span> Guardar cambios</span>
    </button>
</div>
            </form>
        </div>
    </div>
</div>
