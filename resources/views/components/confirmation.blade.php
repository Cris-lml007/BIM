<div class="modal fade" id="confirmationModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 rounded-4 shadow" style="overflow: hidden;">

            <!-- Header -->
            <div class="modal-header border-0 px-4 py-3">
                <h5 class="modal-title fw-bold">{{ $title }}</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal">x</button>
            </div>

            <!-- Body -->
            <div class="modal-body px-4 py-4 text-center">
                <i class="@if($type === 'danger') fas fa-exclamation-circle text-white bg-danger 
                @elseif($type === 'warning') fas fa-exclamation-triangle text-dark bg-warning 
                @else fas fa-check-circle text-white bg-dark @endif
                        rounded-circle p-3 mb-3" style="font-size: 2rem;"></i>
                <p class="mb-0 fs-6 text-muted">{{ $message }}</p>
                {{ $slot }}
            </div>

            <!-- Footer -->
            <div class="modal-footer border-0 justify-content-center pb-4">
                <x-button type="secondary" data-bs-dismiss="modal">{{ $cancelButtonText }}</x-button>

                <form method="POST" action="{{ $action }}" class="ms-2">
                    @csrf
                    @method('DELETE') {{-- Opcional: cambia según la acción --}}
                    <x-button type="primary">{{ $confirmButtonText }}</x-button>
                </form>
            </div>

        </div>
    </div>
</div>