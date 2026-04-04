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
        $ownerAccess = $this->project->ownerAccess();

        if (empty($ownerAccess)) {
            return $this->emptyResponse();
        }

        return $this->authorizedResponse($ownerAccess);
    }
    protected function emptyResponse()
    {
        return view('livewire.app.project-documente-view', [
            'documents' => collect(),
            'usedMB' => 0,
            'availableMB' => 0,
            'percentage' => 0,
            'totalDocs' => 0,
            'totalLinks' => 0,
            'totalSizeBytes' => 0,
        ]);
    }
    protected function authorizedResponse($ownerAccess)
    {
        $baseQuery = $this->baseQuery();

        $documents = $this->getDocuments($baseQuery);

        [
            $totalSizeBytes,
            $totalDocs,
            $totalLinks
        ] = $this->getStats($baseQuery);

        [
            $usedMB,
            $availableMB,
            $percentage
        ] = $this->getStorageData($totalSizeBytes, $ownerAccess);

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
    protected function baseQuery()
    {
        return Document::where('project_id', $this->project->id);
    }
    protected function getDocuments($baseQuery)
    {
        $query = clone $baseQuery;

        if (!empty($this->search)) {
            $query->where('name', 'like', "%{$this->search}%");
        }

        if (!empty($this->filterType)) {
            match ($this->filterType) {
                'link' => $query->where('type', 'link'),
                'image' => $query->where('type', 'like', '%image%'),
                'pdf' => $query->where('type', 'like', '%pdf%'),
                'word' => $query->where('type', 'like', '%word%'),
                'excel' => $query->where('type', 'like', '%excel%'),
                default => null,
            };
        }

        return $query
            ->orderBy($this->sortField ?? 'id', $this->sortDirection ?? 'desc')
            ->get();
    }
    protected function getStats($baseQuery)
    {
        $totalSizeBytes = (clone $baseQuery)
            ->where('type', '!=', 'link')
            ->sum('size');

        $totalDocs = (clone $baseQuery)->count();

        $totalLinks = (clone $baseQuery)
            ->where('type', 'link')
            ->count();

        return [$totalSizeBytes, $totalDocs, $totalLinks];
    }
    protected function getStorageData($totalSizeBytes, $ownerAccess)
    {
        $maxMB = $ownerAccess->max_storage ?? 0;

        $totalSizeMB = $totalSizeBytes / (1024 ** 2);

        $usedMB = round($totalSizeMB, 2);
        $availableMB = max(0, round($maxMB - $totalSizeMB, 2));

        $percentage = $maxMB > 0
            ? min(100, round(($totalSizeMB / $maxMB) * 100, 1))
            : 0;

        return [$usedMB, $availableMB, $percentage];
    }
}
