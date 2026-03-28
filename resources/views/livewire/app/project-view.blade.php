<div>
    <x-slot name="header">
        <h1>{{ $project->name }}</h1>
    </x-slot>

    <div class="row g-3 mb-3">
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold"><i class="nf nf-fa-cube"></i> 1</h3>
                <h6 class="mb-1 text-secondary">Total Modelos 3D</h6>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold"><i class="nf nf-md-floor_plan"></i> 2</h3>
                <h6 class="mb-1 text-secondary">Total Planos 2D</h6>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-center bg-light shadow-sm rounded-4 py-3">
                <h3 class="fw-bold"><i class="nf nf-cod-issue_reopened"></i> 3</h3>
                <h6 class="mb-1 text-secondary">Total Incidencias</h6>
            </div>
        </div>
    </div>

    <div class="container">
        <h4>Anclajes Virtuales</h4>
        <x-card>
            <livewire:table :heads="$heads" wire:model="list">
            </livewire:table>
        </x-card>
    </div>
</div>
