<div>
    <div class="modal-body">
        <div class="row">
            {{-- Código QR --}}
            <div class="col-md-5 d-flex flex-column align-items-center justify-content-center">
                @if ($qr)
                    <img
                        src="{{ $qr }}"
                        alt="Código QR de {{ $name }}"
                        class="img-fluid mb-3"
                        style="max-width: 250px;"
                    >

                    <a
                        href="{{ $qr }}"
                        download="qr-{{ \Illuminate\Support\Str::slug($name ?: 'modelo') }}.png"
                        class="btn btn-outline-primary"
                    >
                        <i class="fas fa-download mr-1"></i>
                        Descargar QR
                    </a>
                @else
                    <div class="text-muted text-center">
                        <i class="fas fa-qrcode fa-4x mb-2"></i>
                        <p>No hay un código QR disponible.</p>
                    </div>
                @endif
            </div>

            {{-- Información --}}
            <div class="col-md-7">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" class="form-control" wire:model="name">
                </div>

                <div class="form-group">
                    <label>Modelo</label>
                    <input type="text" class="form-control" disabled wire:model="model">
                </div>

                <div class="form-group">
                    <label>Estado</label>
                    <select class="form-control" wire:model="status">
                        <option value="1">Activo</option>
                        <option value="0">Deshabilitado</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Creado Por</label>
                    <input type="text" class="form-control" disabled wire:model="by">
                </div>

                <div class="form-group">
                    <label>Creado En</label>
                    <input type="date" class="form-control" disabled wire:model="create_at">
                </div>
            </div>
        </div>

        <hr>

        {{-- Enlace de realidad aumentada --}}
        <div class="form-group mb-0">
            <label for="ar-link">Enlace de realidad aumentada</label>

            <div class="input-group">
                <input
                    type="text"
                    id="ar-link"
                    class="form-control"
                    value="{{ route('app.project.ar.hash', ['project' => $project_id, 'hash' => $hash_anchor]) }}"
                    readonly
                >

                <div class="input-group-append">
                    <button
                        type="button"
                        class="btn btn-outline-secondary"
                        onclick="navigator.clipboard.writeText(document.getElementById('ar-link').value).then(() => {
                            if (window.Swal) {
                                Swal.fire({
                                    toast: true,
                                    position: 'top-end',
                                    icon: 'success',
                                    title: 'Enlace copiado',
                                    showConfirmButton: false,
                                    timer: 2000
                                });
                            }
                        }).catch(() => {
                            const input = document.getElementById('ar-link');
                            input.select();
                            document.execCommand('copy');
                        });"
                    >
                        <i class="fas fa-copy mr-1"></i>
                        Copiar
                    </button>
                </div>
            </div>

            <small class="form-text text-muted">
                Puedes compartir este enlace para acceder directamente al modelo en realidad aumentada.
            </small>
        </div>
    </div>

    <div class="modal-footer">
        <a
            href="{{ route('app.project.model3d.id', ['project' => $project_id, 'model' => $model_id]) }}"
            class="btn btn-primary"
        >
            <i class="fas fa-cube mr-1"></i>
            Ir a modelo
        </a>

        <a
            href="{{ route('app.project.ar.hash', ['project' => $project_id, 'hash' => $hash_anchor]) }}"
            class="btn btn-success"
        >
            <i class="fas fa-vr-cardboard mr-1"></i>
            Realidad Aumentada
        </a>

        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cerrar
        </button>
    </div>
</div>
