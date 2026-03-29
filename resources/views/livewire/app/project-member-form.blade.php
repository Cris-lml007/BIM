<div class="p-4">
    <!-- Formulario de invitación -->
    <form wire:submit.prevent="checkExistingUser">
        <div class="mb-4">
            <label class="form-label fw-bold">
                <i class="fa fa-envelope me-1"></i> Correo electrónico
            </label>
            <div class="input-group">
                <input type="email" class="form-control @error('email') is-invalid @enderror"
                    placeholder="ejemplo@correo.com" wire:model.live.debounce.300ms="email" autocomplete="off">
                <button type="submit" class="btn btn-primary">
                    <i class="fa fa-search"></i> Verificar
                </button>
            </div>
            @error('email')
                <div class="invalid-feedback d-block">{{ $message }}</div>
            @enderror
        </div>
    </form>

    <!-- Resultados de búsqueda automática -->
    @if($showSearchResults && count($searchResults) > 0)
        <div class="mb-4">
            <label class="form-label fw-bold">
                <i class="fa fa-users me-1"></i> Usuarios encontrados
            </label>
            <div class="list-group">
                @foreach($searchResults as $result)
                    <button type="button" class="list-group-item list-group-item-action d-flex align-items-center"
                        wire:click="selectUser({{ $result['id'] }})">
                        <img src="{{ $result['avatar'] }}" alt="{{ $result['name'] }}" class="rounded-circle me-3" width="40"
                            height="40">
                        <div class="flex-grow-1">
                            <div class="fw-bold">{{ $result['name'] }}</div>
                            <div class="small text-muted">{{ $result['email'] }}</div>
                        </div>
                        <i class="fa fa-circle text-secondary fa-2x"></i>
                    </button>
                @endforeach
            </div>
        </div>
    @endif

    <!-- Usuario seleccionado (existente) -->
    @if($selectedUser && $isExistingUser)
        <div class="mb-4">
            <div class="card bg-light">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-3"
                            style="width: 50px; height: 50px; background-color: #{{ substr(md5($selectedUser['name']), 0, 6) }}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">
                            {{ strtoupper(substr($selectedUser['name'], 0, 2)) }}
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-0">{{ $selectedUser['name'] }}</h6>
                            <small class="text-muted">{{ $selectedUser['email'] }}</small>
                        </div>
                        <i class="fa fa-check-circle text-success fa-2x"></i>
                    </div>
                </div>
            </div>
        </div>
    @endif

    <!-- Formulario para usuario existente -->
    @if($selectedUser && $isExistingUser)
        <div class="mb-4">
            <label class="form-label fw-bold">
                <i class="fa fa-user-tag me-1"></i> Rol en el proyecto
            </label>
            <select class="form-select" wire:model="role">
                <option value="">Seleccione Rol</option>
                @foreach ($roles as $role)
                    <option value="{{ $role->value }}">{{ __('messages.' . $role->name)  }}</option>
                @endforeach
            </select>
            <div class="form-text pt-2">
                <i class="fa fa-info-circle"></i> Los administradores pueden gestionar miembros y configuraciones del
                proyecto
            </div>
        </div>

        <div class="d-grid gap-2">
            <button class="btn btn-primary btn-lg" wire:click="inviteExistingUser">
                <i class="fa fa-paper-plane me-2"></i> Invitar al proyecto
            </button>
        </div>
    @endif

    <!-- Opción para usuario no existente -->
    @if($showExternalInviteConfirm && !$selectedUser && !$isExistingUser && $email)
        <div class="alert alert-info mt-3">
            <div class="d-flex align-items-center mb-3">
                <i class="fa fa-info-circle fa-2x me-3"></i>
                <div>
                    <h6 class="mb-0">Usuario no encontrado</h6>
                    <small>{{ $email }} no está registrado en la plataforma</small>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label fw-bold">Rol para la invitación</label>
                <select class="form-select" wire:model="role">
                    <option value="member">Miembro</option>
                    <option value="admin">Administrador</option>
                </select>
            </div>

            <div class="d-grid gap-2">
                <button class="btn btn-primary btn-lg" wire:click="inviteExternalUser">
                    <i class="fa fa-envelope-open-text me-2"></i> Invitar a crear cuenta
                </button>
                <button class="btn btn-link" wire:click="cancelExternalInvite">
                    <i class="fa fa-arrow-left me-1"></i> Volver
                </button>
            </div>
            <div class="small text-muted mt-2">
                <i class="fa fa-envelope"></i> Se enviará un correo con instrucciones para crear una cuenta y unirse al
                proyecto
            </div>
        </div>
    @endif
</div>

@script
<script>
    this.$js.closeModal = () => {
        $("#" + $wire.modal_name).modal('hide');
    };
</script>
@endscript