<div>
    @php
        $date = $incident->created_at ?? null;

        $priority = $incident->priority ?? null;

        $text = match ($priority) {
            1 => 'Baja',
            2 => 'Media',
            3 => 'Alta',
            default => 'Sin prioridad',
        };

        $color = match ($priority) {
            1 => 'bg-success',
            2 => 'bg-warning text-dark',
            3 => 'bg-danger',
            default => 'bg-secondary',
        };
        $status = $incident->status ?? null;
        $comments = $incident->comments ?? [];
    @endphp
    <div class="card mt-3 shadow-sm">

        <!-- HEADER -->
        <div class="card-body">

            <!-- Línea 1: Título + acción -->
            <div class="d-flex justify-content-between align-items-start">

                <div>
                    <h5 class="mb-1 fw-bold">
                        {{ strtoupper($incident->title ?? '...') }}
                    </h5>

                    <!-- Badges -->
                    <div class="mb-2">


                        <span class="badge me-1 {{ $color }}">
                            {{ $text }}
                        </span>

                        <span
                            class="badge me-1 @if ($status) bg-warning
                            @else
                            bg-success @endif">
                            {{ $status === 1 ? 'Abierta' : 'Cerrada' }}
                        </span>
                        <span class="badge bg-secondary">
                            <i class="fas fa-clock me-1"></i>
                            {{ \Carbon\Carbon::parse($date)->translatedFormat('d M Y : H:m:s') }}

                        </span>
                    </div>
                </div>

                @if ($status === 1)
                    <button wire:click="statusIncident({{ $incident->id ?? '' }})" class="btn btn-success btn-sm">
                        <i class="fas fa-check me-1"></i> Cerrar incidencia
                    </button>
                @else
                    <button wire:click="statusIncident({{ $incident->id ?? '' }})" class="btn btn-secondary btn-sm">
                        <i class="fas fa-check me-1"></i> Reabrir
                    </button>
                @endif
            </div>

            <!-- Línea 2: Descripción -->
            <p class="text-muted mb-3">
                {{ $incident->description ?? 'No hay descripción disponible.' }}
            </p>
        </div>

        <!-- COMENTARIOS -->
        <div class="card-body border-top" style="max-height:300px; overflow:auto; background:#f8f9fa;">
            @forelse ($comments as $comment)
                @if ($comment->user_id == auth()->id())
                    <div class="d-flex justify-content-end mb-3">

                        <div class="text-end">

                            <div class="bg-primary text-white p-2 rounded-3 shadow-sm">

                                <div class="d-flex justify-content-between">
                                    <small class="me-2">
                                        {{ $comment->created_at->diffForHumans() }}
                                    </small>
                                    <strong>Tú</strong>
                                </div>

                                <p class="mb-1">
                                    {{ $comment->comment }}
                                </p>

                            </div>

                        </div>

                    </div>
                @else
                    <div class="d-flex mb-3">

                        <!-- Avatar -->
                        <div class="me-2">
                            <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center"
                                style="width:35px; height:35px;">
                                {{ strtoupper(substr($comment->user->name, 0, 1)) }}
                            </div>
                        </div>

                        <!-- Mensaje -->
                        <div>
                            <div class="bg-white p-2 rounded-3 shadow-sm">

                                <div class="d-flex justify-content-between">
                                    <strong>{{ $comment->user->email }}</strong>
                                    <small class="text-muted ms-2">
                                        {{ $comment->created_at->diffForHumans() }}
                                    </small>
                                </div>

                                <p class="mb-1">
                                    {{ $comment->comment }}
                                </p>

                            </div>
                        </div>

                    </div>
                @endif
            @empty
                <div class="d-flex flex-column align-items-center justify-content-center py-5">

        <div class="bg-light rounded-circle d-flex align-items-center justify-content-center mb-3"
            style="width:60px; height:60px;">
            <i class="fas fa-comment-dots text-secondary"></i>
        </div>

        <h6 class="text-muted mb-1">Sin comentarios</h6>

        <small class="text-muted text-center">
            Esta incidencia aún no tiene interacción.<br>
            Puedes iniciar la conversación.
        </small>

    </div>
            @endforelse
        </div>


        <!-- INPUT -->
        <div class="card-footer bg-white">

            <div class="input-group">

                <input class="form-control" wire:model="comment" placeholder="Escribir comentario..." @disabled($status === 0)>
                <!-- Enviar -->
                <button wire:click="addComment({{ $incident->id ?? '' }})" class="btn btn-primary" @disabled($status === 0)>
                    <i class="fas fa-paper-plane"></i>
                </button>

            </div>

        </div>
    </div>


</div>
