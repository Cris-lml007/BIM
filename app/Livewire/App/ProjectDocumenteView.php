<?php

namespace App\Livewire\App;

use Livewire\Component;
use App\Models\Document;
use App\Models\Project;
use Storage;

class ProjectDocumenteView extends Component
{
    public Project $project;

    public string $search = '';
    public string $sortField = 'created_at';
    public string $sortDirection = 'desc';
    public string $filterType = ''; // 'link' | 'image' | 'pdf' | 'word' | 'excel' | ''

    protected $listeners = ['document-saved' => '$refresh'];

    public function mount(Project $project)
    {
        $this->project = $project;
    }

    public function deleteDocument(int $id): void
    {
        $document = Document::where('id', $id)
            ->where('project_id', $this->project->id)
            ->firstOrFail();
        if ($document->type !== 'link') {
            // Verificar si el archivo existe en el storage
            if (Storage::disk('local')->exists($document->path)) {
                Storage::disk('local')->delete($document->path);
            }
        }
        $document->delete();

        $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Documento eliminado',
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true
            });
        ");
    }

    public function sortBy(string $field): void
    {
        if ($this->sortField === $field) {
            $this->sortDirection = $this->sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            $this->sortField = $field;
            $this->sortDirection = 'asc';
        }
    }

    public function render()
    {
        $query = Document::where('project_id', $this->project->id);

        // Búsqueda
        if ($this->search) {
            $query->where('name', 'like', '%' . $this->search . '%');
        }

        // Filtro por tipo
        if ($this->filterType) {
            match ($this->filterType) {
                'link' => $query->where('type', 'link'),
                'image' => $query->where('type', 'like', '%image%'),
                'pdf' => $query->where('type', 'like', '%pdf%'),
                'word' => $query->where('type', 'like', '%word%'),
                'excel' => $query->where('type', 'like', '%excel%'),
                default => null,
            };
        }

        $documents = $query->orderBy($this->sortField, $this->sortDirection)->get();

        // Estadísticas de almacenamiento
        $totalSizeBytes = Document::where('project_id', $this->project->id)
            ->where('type', '!=', 'link')
            ->sum('size');

        $maxMB = $this->project->ownerAccess()->max_storage;

        $totalSizeMB = $totalSizeBytes / (1024 ** 2);

        $usedMB = round($totalSizeMB, 2);
        $availableMB = round($maxMB - $totalSizeMB, 2);
        $percentage = min(100, round(($totalSizeMB / $maxMB) * 100, 1));

        $totalDocs = Document::where('project_id', $this->project->id)->count();
        $totalLinks = Document::where('project_id', $this->project->id)->where('type', 'link')->count();

        return view('livewire.app.project-documente-view', compact(
            'documents',
            'usedMB',
            'availableMB',
            'percentage',
            'totalDocs',
            'totalLinks',
            'totalSizeBytes'
        ));
    }
}
