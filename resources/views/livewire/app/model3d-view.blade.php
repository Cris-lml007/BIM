<div>
    <x-slot name="header">
        <h1>Modelos 3D</h1>
        <button data-bs-toggle="modal" data-bs-target="#modal-3d" class="btn btn-primary"><i class="fa fa-plus"></i> Subir
            Modelo</button>
    </x-slot>

    <div class="container">
        <div class="row">
            @foreach ($data as $item)
                <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
                    <div class="card">
                        <img class="card-img-top" style="width: 100%;height: 150px;object-fit: contain;background: #eee;"
                             src="{{ route('thumbnail',$item->model->id) }}"
                            alt="">
                        <div class="card-body">
                            <h5 class="card-title">{{ $item->name }}</h5>
                            <p class="card-text">{{ $item->description }}</p>
                            <span>por: {{ $item->user->name }}</span>
                        </div>
                        <a href="{{ route('app.project.model3d.id',['project' => $this->project->id, 'model' => $item->id]) }}" class="btn btn-primary"
                            style="border-top-left-radius: 0;border-top-right-radius: 0;">Abrir</a>
                    </div>
                </div>
            @endforeach
        </div>
    </div>

    <x-modal id="modal-3d" class="modal-lg" title="Subir Modelo 3D" wire:ignore="">
        <livewire:app.model3d-form :project="$project" wire:key="model3d-form"></livewire:app.model3d-form>
    </x-modal>
</div>
