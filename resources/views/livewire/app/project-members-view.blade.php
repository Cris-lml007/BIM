<div>
    @if ($project->is_active == 0)
        <div class="alert alert-danger mt-0">
            <i class="fas fa-lock me-2"></i>
            Este proyecto se encuentra bloqueado
        </div>
    @endif
    <div class="row g-3 mb-3">
        @if (!$project->ownerAccess())
            <small class="alert alert-warning m-0">
                Usted no cuenta con acceso para esta sección, comuníquese con
                <b>BIMNova</b>, para solicitar un acceso.
            </small>
        @endif
        <div class="col-md-6">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">{{ $total_members }}</h3>
                <h6 class="mb-1 text-secondary">Usuarios invitados</h6>
            </div>
        </div>
        <div class="col-md-6">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">{{ $total_members . ' / ' . $total }}</h3>
                <h6 class="mb-1 text-secondary">Miembros/Limite</h6>
            </div>
        </div>

    </div>


    <div x-data="{ activeTab: 'members' }">
        <!-- Botones de pestañas -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="btn-group w-100" role="group">
                    <button type="button" @click="activeTab = 'members'"
                        :class="activeTab === 'members' ? 'btn-primary' : 'btn-outline-primary'" class="btn">
                        <i class="fas fa-users me-2"></i>
                        Miembros del Proyecto
                    </button>

                    <button type="button" @click="activeTab = 'invitations'"
                        :class="activeTab === 'invitations' ? 'btn-primary' : 'btn-outline-primary'" class="btn">
                        <i class="fas fa-envelope me-2"></i>
                        Invitaciones Pendientes
                    </button>
                </div>
            </div>
        </div>

        <div x-show="activeTab === 'members'">

            <livewire:table :heads="$heads" wire:key="members-table" :list="$actions"
                icon="fas fa-users me-2 text-primary" title="Miembros del proyecto"
                footer="Mostrando {{ $members->count() }} de {{ $total_members }} miembros">

                <x-slot name="footer">
                    <tr>
                        <td colspan="{{ count($heads) }}" class="text-muted">
                            Mostrando {{ $members->count() }} de {{ $total_members }} miembros
                        </td>
                    </tr>
                </x-slot>

                @forelse($members as $member)
                    <tr wire:key="{{ $member->id }}">
                        <td>{{ $member->id }}</td>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="avatar-circle me-2"
                                    style="width: 32px; height: 32px; background-color: #{{ substr(md5($member->name), 0, 6) }}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                    {{ strtoupper(substr($member->name, 0, 2)) }}
                                </div>
                                <div>
                                    <strong>{{ $member->name }}</strong>
                                    @if ($member->id === $owner->id)
                                        <span class="badge bg-warning ms-1">Dueño</span>
                                    @endif
                                </div>
                            </div>
                        </td>
                        <td>{{ $member->email }}</td>
                        <td>
                            @if ($member->id === $owner->id)
                                <span class="badge bg-warning">Propietario</span>
                            @else
                                @php
                                    $role = App\Enum\RoleProject::tryFrom($member->pivot->role);
                                @endphp

                                <span class="badge bg-{{ $role?->badgeColor() ?? 'secondary' }}">
                                    <i class="fa {{ $role?->icon() ?? 'fa-user' }} me-1"></i>
                                    {{ $role?->label() ?? 'Desconocido' }}
                                </span>
                            @endif
                        </td>

                        <td>
                            {{ $member->pivot->created_at ? \Carbon\Carbon::parse($member->pivot->created_at)->translatedFormat('d M Y - H:i') : '-' }}
                        </td>
                        <td>
                            <button wire:click="showMemberHistory({{ $member->id }})"
                                class="btn btn-sm btn-info me-1" title="Ver historial">
                                <i class="fa fa-history"></i>
                            </button>
                            @if ($member->id !== $owner->id)
                                <button wire:click="openChangeRoleModal({{ $member->id }})"
                                    class="btn btn-sm btn-warning me-1" title="Cambiar rol">
                                    <i class="fa fa-user-edit"></i>
                                </button>
                                <button wire:click="removeMember({{ $member->id }})" class="btn btn-sm btn-danger"
                                    title="Eliminar miembro">
                                    <i class="fa fa-trash"></i>
                                </button>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="{{ count($heads) }}" class="text-center text-muted py-4">
                            <i class="fa fa-users fa-2x mb-2 d-block"></i>
                            No hay miembros en este proyecto
                        </td>
                    </tr>
                @endforelse
                </livewire:livewire-table>


        </div>

        <div x-show="activeTab === 'invitations'">
            <livewire:table :heads="$headsInvitations" wire:key="invites-table" :list="$actions"
                icon="fas fa-envelope me-2 text-primary" title="Invitaciones pendientes"
                footer="Mostrando {{ $invites->count() }} de {{ $invites->count() }} invitaciones pendientes">

                <x-slot name="footer">
                    <tr>
                        <td colspan="{{ count($heads) }}" class="text-muted">
                        </td>
                    </tr>
                </x-slot>

                @forelse($invites as $invite)
                    <tr wire:key="{{ $invite->id }}">
                        <td>{{ $invite->id }}</td>

                        <td>{{ $invite->email }}</td>
                        <td>
                            @php
                                $role = App\Enum\RoleProject::tryFrom($invite->role);
                            @endphp

                            <span class="badge bg-{{ $role?->badgeColor() ?? 'secondary' }}">
                                <i class="fa {{ $role?->icon() ?? 'fa-user' }} me-1"></i>
                                {{ $role?->label() ?? 'Desconocido' }}
                            </span>
                        </td>

                        <td>

                            <span class="badge bg-secondary">
                                Pendiente
                            </span>

                        </td>
                        <td>
                            {{ \Carbon\Carbon::parse($invite->expired_at)->translatedFormat('d M Y - H:i') }}

                        </td>
                        <td>
                            @if ($invite->id !== $owner->id)
                                <button wire:click="removeInvited({{ $invite->id }})" class="btn btn-sm btn-danger">
                                    <i class="fa fa-trash"></i>
                                </button>
                            @else
                                <span class="text-muted">-</span>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="{{ count($heads) }}" class="text-center text-muted py-4">
                            <i class="fa fa-users fa-2x mb-2 d-block"></i>
                            No hay invitaciones en este proyecto
                        </td>
                    </tr>
                @endforelse
                </livewire:livewire-table>


        </div>
    </div>




    <!-- Modal para confirmar invitación externa -->
    <div class="modal fade" id="modal-member-history" tabindex="-1" aria-labelledby="modal-member-history-label"
        aria-hidden="true" wire:ignore.self>

        <div class="modal-dialog modal-xl modal-dialog-scrollable">

            <div class="modal-content border-0 shadow-lg">

                <!-- HEADER -->
                <div class="modal-header bg-dark text-white">

                    <div>
                        <h4 class="modal-title fw-bold mb-1" id="modal-member-history-label">
                            <i class="fas fa-history me-2"></i>
                            Trayectoria de
                            <span class="text-warning">
                                {{ $selectedMember?->name ?? 'miembro' }}
                            </span>
                        </h4>

                        <small class="text-light opacity-75">
                            Historial completo de participación
                        </small>
                    </div>

                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                        aria-label="Cerrar">
                    </button>

                </div>

                <!-- BODY -->
                <div class="modal-body bg-light">

                    @if ($selectedMemberMemberships?->count())

                        <!-- INFO GENERAL -->
                        <div class="card border-0 shadow-sm mb-4">

                            <div class="card-body">

                                <div class="row align-items-center">

                                    <div class="col-md-8">

                                        <h5 class="fw-bold mb-3">
                                            <i class="fas fa-user-circle me-2 text-primary"></i>
                                            Información del miembro
                                        </h5>

                                        <div class="d-flex flex-wrap gap-2">

                                            <span class="badge bg-primary px-3 py-2">
                                                <i class="fas fa-envelope me-1"></i>
                                                {{ $selectedMember->email }}
                                            </span>

                                            <span class="badge bg-dark px-3 py-2">
                                                <i class="fas fa-diagram-project me-1"></i>
                                                {{ $project->name }}
                                            </span>

                                        </div>

                                    </div>

                                    <div class="col-md-4 text-md-end mt-3 mt-md-0">

                                        <div class="fs-2 fw-bold text-primary">
                                            {{ $selectedMemberMemberships->count() }}
                                        </div>

                                        <div class="text-muted">
                                            registros encontrados
                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                        <!-- MEMBERSHIPS -->
                        @foreach ($selectedMemberMemberships as $membership)
                            <div class="card border-0 shadow-sm mb-4">

                                <!-- CARD HEADER -->
                                <div class="card-header bg-white border-0 py-3">

                                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">

                                        <div>

                                            <h5 class="fw-bold mb-1">
                                                <i class="fas fa-calendar-alt text-primary me-2"></i>
                                                Periodo de participación
                                            </h5>

                                            <div class="text-muted">

                                                <strong>
                                                    {{ optional($membership->started_at)->translatedFormat('d M Y - H:i') ?? '—' }}
                                                </strong>

                                                <span class="mx-2">→</span>

                                                <strong>
                                                    {{ optional($membership->ended_at)->translatedFormat('d M Y - H:i') ?? 'Actual' }}
                                                </strong>

                                            </div>

                                        </div>

                                        <div>

                                            <span class="badge rounded-pill bg-secondary px-3 py-2 fs-6">

                                                {{ $membership->status instanceof App\Enum\MembershipStatus
                                                    ? $membership->status->label()
                                                    : App\Enum\MembershipStatus::tryFrom($membership->status)?->label() ?? 'Desconocido' }}

                                            </span>

                                        </div>

                                    </div>

                                </div>

                                <!-- BODY -->
                                <div class="card-body">

                                    <!-- INFO -->
                                    <div class="row g-3 mb-4">

                                        <div class="col-md-4">

                                            <div class="border rounded p-3 bg-light h-100">

                                                <div class="text-muted small mb-1">
                                                    Rol inicial
                                                </div>

                                                <div class="fw-bold fs-5">

                                                    {{ $membership->role instanceof App\Enum\RoleProject
                                                        ? $membership->role->label()
                                                        : App\Enum\RoleProject::tryFrom($membership->role)?->label() ?? 'Desconocido' }}

                                                </div>

                                            </div>

                                        </div>

                                        <div class="col-md-4">

                                            <div class="border rounded p-3 bg-light h-100">

                                                <div class="text-muted small mb-1">
                                                    Duración
                                                </div>

                                                <div class="fw-semibold">

                                                    {{ $membership->started_at?->diffForHumans() ?? '—' }}

                                                    @if ($membership->ended_at)
                                                        <span class="text-danger">
                                                            hasta
                                                            {{ $membership->ended_at?->diffForHumans() }}
                                                        </span>
                                                    @else
                                                        <span class="badge bg-success">
                                                            Activo actualmente
                                                        </span>
                                                    @endif

                                                </div>

                                            </div>

                                        </div>

                                        <div class="col-md-4">

                                            <div class="border rounded p-3 bg-light h-100">

                                                <div class="text-muted small mb-1">
                                                    Última actualización
                                                </div>

                                                <div class="fw-semibold">

                                                    {{ optional($membership->updated_at)->translatedFormat('d M Y - H:i') ?? '—' }}

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                    <!-- EVENTOS -->
                                    <div>

                                        <h5 class="fw-bold mb-4">
                                            <i class="fas fa-clock-rotate-left me-2 text-primary"></i>
                                            Historial de eventos
                                        </h5>

                                        @if ($membership->histories->count())
                                            <div class="timeline">

                                                @foreach ($membership->histories as $history)
                                                    <div
                                                        class="border-start border-4 border-primary ps-4 pb-4 position-relative">

                                                        <!-- DOT -->
                                                        <div class="position-absolute top-0 start-0 translate-middle
                                                        rounded-circle bg-primary"
                                                            style="width:14px;height:14px;">
                                                        </div>

                                                        <!-- FECHA -->
                                                        <div class="small text-muted mb-1">

                                                            <i class="fas fa-calendar me-1"></i>

                                                            {{ optional($history->performed_at)->translatedFormat('d M Y - H:i') }}

                                                        </div>

                                                        <!-- EVENTO -->
                                                        <h6 class="fw-bold mb-2">

                                                            {{ match ($history->event_type) {
                                                                'joined' => 'Ingreso al proyecto',
                                                                'rejoined' => 'Reingreso al proyecto',
                                                                'removed' => 'Salida/Eliminación',
                                                                'role_changed' => 'Cambio de rol',
                                                                default => ucfirst(str_replace('_', ' ', $history->event_type)),
                                                            } }}

                                                        </h6>

                                                        <!-- ACTOR -->
                                                        <div class="mb-2">

                                                            <span class="badge bg-dark">

                                                                {{ $history->actor?->name ?? 'Sistema' }}

                                                            </span>

                                                        </div>

                                                        <!-- CAMBIOS -->
                                                        <div class="mt-3">

                                                            @if ($history->old_role || $history->new_role)
                                                                <div class="mb-2">

                                                                    <strong>Rol:</strong>

                                                                    <span class="badge bg-secondary">

                                                                        {{ $history->old_role ? App\Enum\RoleProject::tryFrom($history->old_role)?->label() : '—' }}

                                                                    </span>

                                                                    →

                                                                    <span class="badge bg-primary">

                                                                        {{ $history->new_role ? App\Enum\RoleProject::tryFrom($history->new_role)?->label() : '—' }}

                                                                    </span>

                                                                </div>
                                                            @endif

                                                            @if ($history->old_status || $history->new_status)
                                                                <div class="mb-2">

                                                                    <strong>Estado:</strong>

                                                                    <span class="badge bg-secondary">

                                                                        {{ $history->old_status ? App\Enum\MembershipStatus::tryFrom($history->old_status)?->label() : '—' }}

                                                                    </span>

                                                                    →

                                                                    <span class="badge bg-success">

                                                                        {{ $history->new_status ? App\Enum\MembershipStatus::tryFrom($history->new_status)?->label() : '—' }}

                                                                    </span>

                                                                </div>
                                                            @endif

                                                            @if ($history->metadata)
                                                                <div class="alert alert-light border mt-3 mb-0">
                                                                    <strong>Detalles adicionales:</strong>
                                                                    <div class="mt-2">
                                                                        @if (isset($history->metadata['source']))
                                                                            <div class="mb-1">
                                                                                <i
                                                                                    class="fas fa-info-circle text-info me-1"></i>
                                                                                <strong>Origen:</strong>
                                                                                {{ match ($history->metadata['source']) {
                                                                                    'manual' => 'Agregado manualmente',
                                                                                    'invitation' => 'Por invitación',
                                                                                    'auto' => 'Automático',
                                                                                    default => ucfirst($history->metadata['source']),
                                                                                } }}
                                                                            </div>
                                                                        @endif
                                                                        @if (isset($history->metadata['reason']))
                                                                            <div class="mb-1">
                                                                                <i
                                                                                    class="fas fa-comment text-warning me-1"></i>
                                                                                <strong>Motivo:</strong>
                                                                                {{ $history->metadata['reason'] }}
                                                                            </div>
                                                                        @endif
                                                                        @if (isset($history->metadata['notes']))
                                                                            <div class="mb-1">
                                                                                <i
                                                                                    class="fas fa-sticky-note text-secondary me-1"></i>
                                                                                <strong>Notas:</strong>
                                                                                {{ $history->metadata['notes'] }}
                                                                            </div>
                                                                        @endif
                                                                        @if (isset($history->metadata['invitation_token']))
                                                                            <div class="mb-1">
                                                                                <i
                                                                                    class="fas fa-envelope text-primary me-1"></i>
                                                                                <strong>Invitación:</strong> Aceptada
                                                                                por token
                                                                            </div>
                                                                        @endif
                                                                    </div>
                                                                </div>
                                                            @endif

                                                        </div>

                                                    </div>
                                                @endforeach

                                            </div>
                                        @else
                                            <div class="alert alert-warning border-0 shadow-sm">

                                                <i class="fas fa-triangle-exclamation me-2"></i>

                                                No hay eventos registrados para este periodo.

                                            </div>
                                        @endif

                                    </div>

                                </div>

                            </div>
                        @endforeach
                    @else
                        <div class="alert alert-warning shadow-sm border-0">

                            <i class="fas fa-circle-info me-2"></i>

                            No se encontraron registros de trayectoria para este miembro.

                        </div>

                    @endif

                </div>

                <!-- FOOTER -->
                <div class="modal-footer bg-white border-0">

                    <button type="button" class="btn btn-dark px-4" data-bs-dismiss="modal">

                        <i class="fas fa-times me-2"></i>
                        Cerrar

                    </button>

                </div>

            </div>

        </div>

    </div>


    <!-- Modal para cambiar rol de miembro -->
    <div class="modal fade" id="modal-change-role" tabindex="-1" aria-labelledby="modal-change-role-label"
        aria-hidden="true" wire:ignore.self>

        <div class="modal-dialog modal-dialog-centered">

            <div class="modal-content border-0 shadow-lg">

                <!-- HEADER -->
                <div class="modal-header ">

                    <h5 class="modal-title" id="modal-change-role-label">

                        <i class="fas fa-user-edit me-2"></i>
                        Cambiar Rol del Miembro

                    </h5>

                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                        aria-label="Close"></button>

                </div>

                <!-- BODY -->
                <div class="modal-body">

                    @if ($selectedMemberForRoleChange)
                        <div class="text-center mb-4">

                            <div class="avatar-circle mx-auto mb-3"
                                style="width: 60px; height: 60px; background-color: #{{ substr(md5($selectedMemberForRoleChange->name), 0, 6) }}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.5rem;">
                                {{ strtoupper(substr($selectedMemberForRoleChange->name, 0, 2)) }}
                            </div>

                            <h5 class="mb-1">{{ $selectedMemberForRoleChange->name }}</h5>
                            <p class="text-muted mb-0">{{ $selectedMemberForRoleChange->email }}</p>

                        </div>

                        <form wire:submit.prevent="changeMemberRole">

                            <div class="mb-3">

                                <label for="newRole" class="form-label fw-bold">Nuevo Rol</label>

                                <select wire:model.live="newRole" id="newRole" class="form-select" required>

                                    <option value="">Seleccionar rol...</option>
                                    @foreach (App\Enum\RoleProject::cases() as $roleOption)
                                        @if ($roleOption->value != 1)
                                            <option value="{{ $roleOption->value }}"
                                                {{ $currentMemberRole && $currentMemberRole->value === $roleOption->value ? 'selected' : '' }}>

                                                {{ $roleOption->label() }}

                                            </option>
                                        @endif
                                    @endforeach

                                </select>

                                @error('newRole')
                                    <div class="text-danger small mt-1">{{ $message }}</div>
                                @enderror

                            </div>

                            <div class="d-grid gap-2">

                                <button type="submit" class="btn btn-primary" wire:loading.attr="disabled">
                                    <span wire:loading.remove>
                                        <i class="fas fa-save me-2"></i>
                                        Cambiar Rol
                                    </span>
                                    <span wire:loading>
                                        <i class="fas fa-spinner fa-spin me-2"></i>
                                        Cambiando...
                                    </span>
                                </button>

                            </div>

                        </form>
                    @else
                        <div class="text-center text-muted">
                            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                            <p>No se pudo cargar la información del miembro.</p>
                        </div>
                    @endif

                </div>

                <div class="modal-footer border-0">
                    <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">
                        <i class="fas fa-times me-2"></i>
                        Cancelar
                    </button>
                </div>

            </div>

        </div>

    </div>


    <div class="modal fade" id="modal-confirm-invite" tabindex="-1" aria-labelledby="modal-confirm-invite-label"
        aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modal-confirm-invite-label">Confirmar invitación</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Se enviará una invitación a:</p>
                    <p class="fw-bold">{{ $externalEmail }}</p>
                    <p class="text-muted small">El usuario recibirá un correo con instrucciones para unirse al
                        proyecto.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" wire:click="sendExternalInvitation">
                        <i class="fa fa-paper-plane"></i> Enviar invitación
                    </button>
                </div>
            </div>
        </div>
    </div>

    <x-modal id="modal-invite" title="Invitar a un nuevo miembro" class="modal-md">
        <livewire:app.project-member-form modal_name="modal-invite" />
    </x-modal>

</div>

@script
<script>
    this.$js.closeModal = () => {
        $("#" + $wire.current_modal).modal('hide');
    };
</script>
@endscript
