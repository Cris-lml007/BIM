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
    <div class="container">
        <div class="row">
            <div class="col-md-4 d-flex flex-column bg-light rounded-3 shadow-sm">

                <div class="text-center mb-2">
                    <h5 class="fw-bold mb-0">
                        {{ strtoupper($incident->title ?? '...') }}
                    </h5>
                </div>

                <div class="d-flex justify-content-center mb-2 flex-wrap gap-1">

                    <span class="badge {{ $color }}">
                        {{ $text }}
                    </span>

                    <span class="badge @if ($status) bg-warning @else bg-success @endif">
                        {{ $status === 1 ? 'Abierta' : 'Cerrada' }}
                    </span>

                </div>

                <div class="d-flex justify-content-center mb-3">
                    <span class="badge bg-secondary">
                        <i class="fas fa-clock me-1"></i>
                        {{ \Carbon\Carbon::parse($date)->translatedFormat('d M Y : H:i:s') }}
                    </span>
                </div>

                <div class="text-center">
                    <p class="text-muted">
                        {{ $incident->description ?? 'No hay descripción disponible.' }}
                    </p>
                </div>

                @if ($status === 1)
                    <button wire:click="statusIncident({{ $incident->id ?? '' }})"
                        class="btn btn-success btn-sm mt-auto w-100 mb-3">
                        Cerrar incidencia
                    </button>
                @else
                    <button wire:click="statusIncident({{ $incident->id ?? '' }})"
                        class="btn btn-secondary btn-sm mt-auto w-100 mb-3">
                        Reabrir
                    </button>
                @endif

            </div>

            <div class="col-md-8 d-flex flex-column">

                <div id="chat-body" class="flex-grow-1 p-2"
                    style="max-height:400px; overflow:auto; background:#0000002f; border-radius:10px;">

                    @forelse ($comments as $comment)
                        @if ($comment->user_id == auth()->id())
                            <!-- TU MENSAJE -->
                            <div class="d-flex justify-content-end mb-3">
                                <div class="bg-primary text-white p-2 rounded-3 shadow-sm text-end">

                                    <small>{{ $comment->created_at->diffForHumans() }}</small>
                                    <p class="mb-0">{{ $comment->comment }}</p>

                                </div>
                            </div>
                        @else
                            <div class="d-flex mb-3">
                                <div class="me-2">
                                    <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center"
                                        style="width:35px; height:35px;">
                                        {{ strtoupper(substr($comment->user->name, 0, 1)) }}
                                    </div>
                                </div>

                                <div class="bg-white p-2 rounded-3 shadow-sm w-100">

                                    <div class="d-flex justify-content-between">
                                        <strong>{{ $comment->user->email }}</strong>
                                        <small class="text-muted">
                                            {{ $comment->created_at->diffForHumans() }}
                                        </small>
                                    </div>

                                    <p class="mb-0">{{ $comment->comment }}</p>

                                </div>

                            </div>
                        @endif

                    @empty
                        <div class="text-center text-muted py-5">
                            Sin comentarios
                        </div>
                    @endforelse

                </div>

                <!-- INPUT -->
                <div class="m-2">
                    <div class="input-group">

                        <input class="form-control" wire:model="comment" placeholder="Escribir comentario..."
                            @disabled($status === 0)>

                        <button wire:click="addComment({{ $incident->id ?? '' }})" class="btn btn-primary"
                            @disabled($status === 0)>
                            <i class="fas fa-paper-plane"></i>
                        </button>

                    </div>
                </div>

            </div>

        </div>

    </div>

    <script>
        document.addEventListener('scroll-bottom', () => {
            scrollToBottom();
        });

        function scrollToBottom() {
            let chat = document.getElementById('chat-body');
            if (chat) {
                chat.scrollTop = chat.scrollHeight;
            }
        }
        document.addEventListener('DOMContentLoaded', function() {
            scrollToBottom();
        });
    </script>
</div>
