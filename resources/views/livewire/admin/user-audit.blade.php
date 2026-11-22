<div>
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h3 class="mb-1">
                <i class="fas fa-user-shield mr-2"></i>
                Auditoría de usuarios
            </h3>
            <p class="text-muted mb-0">
                Consulta y supervisa la información de los usuarios de BIMNova.
            </p>
        </div>
    </div>

    <div class="card card-outline card-primary">
        <div class="card-header">
            <h3 class="card-title">
                <i class="fas fa-users mr-1"></i>
                Usuarios registrados
            </h3>
        </div>

        <div class="card-body">
            <div class="row mb-3">
                <div class="col-md-8 mb-2">
                    <input
                        type="search"
                        class="form-control"
                        placeholder="Buscar por nombre, correo o ID..."
                        wire:model.live.debounce.300ms="search"
                    >
                </div>

                <div class="col-md-4 mb-2">
                    <select class="form-control" wire:model.live="roleFilter">
                        <option value="">Todos los roles</option>
                        @foreach($roles as $role)
                            <option value="{{ $role->value }}">
                                {{ $role->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table table-hover table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Proyectos propios</th>
                            <th>Participaciones</th>
                            <th>Registro</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        @forelse($users as $user)
                            <tr>
                                <td>{{ $user->id }}</td>

                                <td>
                                    <strong>{{ $user->name }}</strong>
                                </td>

                                <td>{{ $user->email }}</td>

                                <td>
                                    @php
                                        $role = $user->role;
                                    @endphp

                                    <span class="badge badge-info">
                                        {{ $role instanceof \BackedEnum ? $role->name : $role }}
                                    </span>
                                </td>

                                <td>
                                    <span class="badge badge-primary">
                                        {{ $user->projects_owner_count }}
                                    </span>
                                </td>

                                <td>
                                    <span class="badge badge-secondary">
                                        {{ $user->project_memberships_count }}
                                    </span>
                                </td>

                                <td>
                                    {{ $user->created_at?->format('d/m/Y') }}
                                </td>

                                <td>
                                    <a
                                        href="{{ route('admin.audit.user', $user) }}"
                                        class="btn btn-sm btn-primary"
                                    >
                                        <i class="fas fa-eye"></i>
                                        Auditar
                                    </a>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="8" class="text-center text-muted py-4">
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="mt-3">
                {{ $users->links() }}
            </div>
        </div>
    </div>
</div>
