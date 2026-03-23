<div>
    @if ($user->id != null)
        <x-slot name="header">
            <h1>Administrar Usuario</h1>
        </x-slot>


        <!-- Profile Image -->
        <div class="text-center mb-4">
            <div class="position-relative d-inline-block">
                <img class="profile-user-img img-fluid img-circle shadow"
                    src="https://ui-avatars.com/api/?name={{ urlencode($name) }}&background=111827&color=fff&size=128"
                    alt="User profile picture" style="width: 110px; border: 4px solid #fff;">
            </div>
        </div>
    @endif

    <form wire:submit="save">
        <div class="modal-body">
            <div class="row mb-3">
                <div class="col">
                    <label for="">Nombre*</label>
                    <input type="text" class="form-control" placeholder="Ingrese Nombre" wire:model="name">
                    @error('name')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
                <div class="col">
                    <label for="">Correo Electronico*</label>
                    <input type="email" class="form-control" placeholder="Ingrese Correo Electronico"
                        wire:model="email">
                    @error('email')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <label for="">Organización</label>
                    <input type="text" class="form-control" placeholder="Ingrese Organización"
                        wire:model="organization">
                </div>
                <div class="col">
                    <label for="">Celular*</label>
                    <input type="text" class="form-control" placeholder="Ingrese Celular" wire:model="phone">
                    @error('phone')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <label for="">Rol*</label>
                    <select class="form-select" wire:model="role">
                        <option value="">Seleccione Rol</option>
                        @foreach ($roles as $item)
                            <option value="{{ $item->value }}">{{ __('messages.' . $item->name) }}</option>
                        @endforeach
                    </select>
                    @error('role')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
                <div class="col">
                    <label for="">Estado*</label>
                    <select class="form-select" wire:model="status">
                        <option value="null">Selecione Estado</option>
                        <option value="1">Habilitado</option>
                        <option value="0">Deshabilitado</option>
                    </select>
                    @error('status')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <label for="">Contraseña*</label>
                    <div class="input-group">
                        <input type="password" class="form-control" placeholder="Ingrese Contraseña"
                            wire:model.live="password">
                        <button class="btn btn-secondary" wire:click="generatePassword"><i
                                class="nf nf-fa-dice"></i></button>
                    </div>
                    @error('password')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
                <div class="col">
                    <label for="">Confimar Contraseña*</label>
                    <input type="password" class="form-control" placeholder="Repita la Contraseña"
                        wire:model.live="password_confirmation">
                    @error('password_confirmation')
                        <span class="text-danger">{{ $message }}</span>
                    @enderror
                </div>
            </div>
        </div>
        @if ($user->id == null)
            <div class="modal-footer">
                <button class="btn btn-primary" type="submit">Guardar</button>
                <button class="btn btn-secondary" type="reset" data-bs-dismiss="modal">Cancelar</button>
            </div>
        @else
            <div class="d-flex justify-content-end">
                <div class="btn-group">
                    <button class="btn btn-primary" type="submit">Guardar</button>
                    <button class="btn btn-secondary" type="reset" data-bs-dismiss="modal">Cancelar</button>
                </div>
            </div>
        @endif
    </form>
</div>


@script
    <script>
        this.$js.closeModal = () => {
            $('#modal-user').modal('hide');
        };
    </script>
@endscript
