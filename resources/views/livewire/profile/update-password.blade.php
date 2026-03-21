<div class="card border-0 shadow-sm rounded-3" style="border-top: 3px solid #2563eb;">
    

    <form wire:submit.prevent="updatePassword">
        <div class="card-body pt-3">

            @if (session('status') === 'password-updated')
                <div class="alert border-0 bg-light text-dark d-flex align-items-center" role="alert">
                    <i class="fas fa-check-circle me-2 text-success"></i>
                    Contraseña actualizada correctamente.
                </div>
            @endif

            <div class="mb-4">
                <label class="form-label text-muted">Contraseña actual</label>
                <input wire:model="current_password"
                       type="password"
                       class="form-control rounded-3 @error('current_password') is-invalid @enderror">
                @error('current_password')
                    <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

            <div class="mb-4">
                <label class="form-label text-muted">Nueva contraseña</label>
                <input wire:model="password"
                       type="password"
                       class="form-control rounded-3 @error('password') is-invalid @enderror">
                @error('password')
                    <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

            <div class="mb-2">
                <label class="form-label text-muted">Confirmar contraseña</label>
                <input wire:model="password_confirmation"
                       type="password"
                       class="form-control rounded-3 @error('password_confirmation') is-invalid @enderror">
                @error('password_confirmation')
                    <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

        </div>

        <div class="card-footer d-flex justify-content-end bg-white border-0 pt-3">
            <button type="submit"
                    class="btn btn-dark d-flex align-items-center gap-2 px-4 py-2 rounded-3"
                    wire:loading.attr="disabled"
                    wire:loading.class="opacity-75">

                <span wire:loading wire:target="updatePassword"
                      class="spinner-border spinner-border-sm"></span>

                <i class="fas fa-check" wire:loading.remove wire:target="updatePassword"></i>

                <span>Actualizar contraseña</span>
            </button>
        </div>
    </form>
</div>