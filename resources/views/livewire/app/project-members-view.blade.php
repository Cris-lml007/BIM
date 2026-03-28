<div>
    <div class="row g-3 mb-3">
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">{{ $total_members }}</h3>
                <h6 class="mb-1 text-secondary">Total Miembros</h6>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">{{ $admins }}</h3>
                <h6 class="mb-1 text-secondary">Administradores</h6>

            </div>
        </div>
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold">{{ $basic_members }}</h3>
                <h6 class="mb-1 text-secondary">Miembros</h6>

            </div>
        </div>
    </div>
    <x-card>
        <!-- Tabla de miembros usando el componente livewire-table -->
        <livewire:table :heads="$heads" wire:model.live="actions" wire:key="members-table" :list="$actions">

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
                            <span class="badge bg-{{ $member->pivot->role === 'admin' ? 'success' : 'primary' }}">
                                {{ ucfirst($member->pivot->role) }}
                            </span>
                        @endif
                    </td>
                    <td>{{ $member->pivot->created_at ? $member->pivot->created_at->format('d/m/Y') : '-' }}</td>
                    <td>
                        @if ($member->id !== $owner->id)
                            <button wire:click="removeMember({{ $member->id }})" class="btn btn-sm btn-danger">
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
                        No hay miembros en este proyecto
                    </td>
                </tr>
            @endforelse
            </livewire:livewire-table>


    </x-card>


    <!-- Modal para confirmar invitación externa -->
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