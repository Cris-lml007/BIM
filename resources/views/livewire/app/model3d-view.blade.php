<div>
    <x-slot name="header">


        <div class="container">
            <div class="d-flex justify-content-between align-items-center">

                <div class="d-flex align-items-center gap-3">
                    <small class="text-muted">
                        <i class="fas fa-folder-open me-1"></i> {{ $project->name }}
                    </small>
                    <h3 class="mb-0">Modelo 3D</h3>
                </div>

                <button data-bs-toggle="modal" data-bs-target="#modal-3d" class="btn btn-primary"><i
                        class="fa fa-plus"></i>
                    Subir
                    Modelo 3D</button>
            </div>
            <hr class="mt-3 mb-4">
        </div>

    </x-slot>

    <div class="container">
        <div class="row">
            @foreach ($data as $item)
                <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
                    <div class="card">
                        <div class="position-relative" style="height: 150px; background: #eee;">

                            <img src="{{ route('app.thumbnail', $item->model->id) }}" alt=""
                                style="width: 100%; height: 100%; object-fit: contain;">

                            <!-- BADGE -->
                            <span class="badge text-bg-primary position-absolute bottom-0 end-0 m-2">
                                {{ strtoupper($item->model->type) }}
                            </span>

                        </div>
                        <div class="card-body">
                            <h5 class="card-title">{{ $item->name }}</h5>
                            <p class="card-text">{{ $item->description }}</p>
                            <span>por: {{ $item->user->name }}</span><br>
                            <span>fecha: {{ \Carbon\Carbon::parse($item->created_at)->format('D M Y') }}</span>
                        </div>
                        <a href="{{ route('app.project.model3d.id', ['project' => $this->project->id, 'model' => $item->id]) }}"
                            class="btn btn-primary" style="border-top-left-radius: 0;border-top-right-radius: 0;">Abrir</a>
                    </div>
                </div>
            @endforeach
        </div>
    </div>

    <x-modal id="modal-3d" class="modal-lg" title="Subir Modelo 3D" wire:ignore="">
        <livewire:app.model3d-form :project="$project" wire:key="model3d-form"></livewire:app.model3d-form>
    </x-modal>
</div>