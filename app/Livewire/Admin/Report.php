<?php

namespace App\Livewire\Admin;

use App\Models\User;
use App\Models\Project;
use App\Models\Model3D;
use App\Models\Anchor;
use App\Models\incident;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Livewire\Component;

class Report extends Component
{
    public string $startDate = '';

    public string $endDate = '';

    /**
     * Se carga una vez al montar el componente.
     * Livewire conserva esta información entre actualizaciones.
     */
    public array $storageStats = [];

    public function mount(): void
    {
        // Impide que un usuario sin autorización acceda al reporte.

        $this->startDate = now()->subDays(29)->toDateString();
        $this->endDate = now()->toDateString();

        $this->storageStats = $this->calculateStorage();
    }

    /**
     * Aplicar filtros de fechas.
     */
    public function applyFilters(): void
    {
        $this->validate([
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date', 'after_or_equal:startDate'],
        ]);
    }

    /**
     * Recalcular el almacenamiento manualmente.
     */
    public function refreshStorage(): void
    {

        $this->storageStats = $this->calculateStorage();

        session()->flash(
            'storage-message',
            'El almacenamiento fue actualizado correctamente.'
        );
    }

    /**
     * Calcular el tamaño de todos los directorios de proyectos.
     *
     * Ruta relativa al disco local:
     * projects/{project_id}
     */
    private function calculateStorage(): array
    {
        $disk = Storage::disk('local');

        $projectIds = Project::query()->pluck('id');

        $result = [];

        foreach ($projectIds as $projectId) {
            $folder = "projects/{$projectId}";

            $files = $disk->allFiles($folder);

            $totalBytes = 0;

            foreach ($files as $file) {
                $totalBytes += $disk->size($file);
            }

            $result[$projectId] = [
                'bytes' => $totalBytes,
                'files' => count($files),
            ];
        }

        return $result;
    }

    /**
     * Obtener el período seleccionado.
     */
    private function dateRange(): array
    {
        return [
            Carbon::parse($this->startDate)->startOfDay(),
            Carbon::parse($this->endDate)->endOfDay(),
        ];
    }

    /**
     * Obtener conteos mensuales de un modelo.
     */
private function monthlyCounts(string $model): array
{
    $dateExpression = $this->getMonthExpression();

    return $model::query()
        ->selectRaw("$dateExpression as period, COUNT(*) as total")
        ->whereBetween('created_at', [
            now()->subDays(30)->startOfDay(),
            now()->endOfDay(),
        ])
        ->groupBy('period')
        ->orderBy('period')
        ->pluck('total', 'period')
        ->toArray();
}

    /**
     * Actividad mensual de la plataforma.
     */
    private function monthlyActivity($start, $end): array
    {
        $users = $this->monthlyCounts(User::class, $start, $end);
        $projects = $this->monthlyCounts(Project::class, $start, $end);
        $models = $this->monthlyCounts(Model3D::class, $start, $end);
        $incidents = $this->monthlyCounts(incident::class, $start, $end);

        $result = [];

        foreach ($projects as $period => $total) {
            $result[] = [
                'period' => $period,
                'label' => Carbon::createFromFormat('Y-m', $period)->format('m/Y'),
                'users' => $users[$period] ?? 0,
                'projects' => $projects[$period] ?? 0,
                'models' => $models[$period] ?? 0,
                'incidents' => $incidents[$period] ?? 0,
            ];
        }

        return $result;
    }

    /**
     * Obtener almacenamiento agrupado por propietario.
     *
     * Utiliza la relación existente:
     * User::projectOwner()
     */
private function getMonthExpression(): string
{
    return match (DB::connection()->getDriverName()) {
        'sqlite' => "strftime('%Y-%m', created_at)",
        'mysql', 'mariadb' => "DATE_FORMAT(created_at, '%Y-%m')",
        default => "TO_CHAR(created_at, 'YYYY-MM')",
    };
    }




private function ownerStorageRows()
{
    return User::query()
        ->with('projectsOwner')
        ->get()
        ->map(function ($user) {

            $projects = $user->projectsOwner ?? collect();

            $bytes = $projects->sum(function ($project) {
                return $this->storageStats[$project->id]['bytes'] ?? 0;
            });

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'projects' => $projects->count(),
                'bytes' => $bytes,
                'mb' => round($bytes / 1024 / 1024, 2),
                'gb' => round($bytes / 1024 / 1024 / 1024, 3),
            ];
        })
        ->sortByDesc('bytes')
        ->values();
}

    /**
     * Exportar un resumen CSV.
     */
    public function exportCsv()
    {

        $owners = $this->ownerStorageRows();

        $projects = collect($this->storageStats)
            ->map(function ($storage, $projectId) {
                return [
                    'project_id' => $projectId,
                    'bytes' => $storage['bytes'],
                    'files' => $storage['files'],
                    'mb' => round($storage['bytes'] / 1024 / 1024, 2),
                    'gb' => round($storage['bytes'] / 1024 / 1024 / 1024, 3),
                ];
            })
            ->sortByDesc('bytes')
            ->values();

        return response()->streamDownload(function () use ($owners, $projects) {
            $handle = fopen('php://output', 'w');

            // BOM para que Excel reconozca correctamente UTF-8.
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'TIPO',
                'ID',
                'NOMBRE',
                'CORREO',
                'PROYECTOS',
                'ARCHIVOS',
                'ALMACENAMIENTO (BYTES)',
                'ALMACENAMIENTO (MB)',
                'ALMACENAMIENTO (GB)',
            ]);

            foreach ($owners as $owner) {
                fputcsv($handle, [
                    'USUARIO',
                    $owner['id'],
                    $owner['name'],
                    $owner['email'],
                    $owner['projects'],
                    '',
                    $owner['bytes'],
                    $owner['mb'],
                    $owner['gb'],
                ]);
            }

            foreach ($projects as $project) {
                fputcsv($handle, [
                    'PROYECTO',
                    $project['project_id'],
                    '',
                    '',
                    '',
                    $project['files'],
                    $project['bytes'],
                    $project['mb'],
                    $project['gb'],
                ]);
            }

            fclose($handle);
        }, 'bimnova-reportes-' . now()->format('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function render()
    {
        [$start, $end] = $this->dateRange();

        // Totales históricos de toda la plataforma.
        $totals = [
            'users' => User::count(),
            'projects' => Project::count(),
            'models' => Model3D::count(),
            'incidents' => incident::count(),
            'anchors' => Anchor::count(),
        ];

        // Registros creados durante el período seleccionado.
        $period = [
            'users' => User::whereBetween('created_at', [$start, $end])->count(),
            'projects' => Project::whereBetween('created_at', [$start, $end])->count(),
            'models' => Model3D::whereBetween('created_at', [$start, $end])->count(),
            'incidents' => incident::whereBetween('created_at', [$start, $end])->count(),
            'anchors' => Anchor::whereBetween('created_at', [$start, $end])->count(),
        ];

        // Estadísticas de almacenamiento.
        $storageTotal = collect($this->storageStats)->sum('bytes');

        $projectStorage = collect($this->storageStats)
            ->map(function ($storage, $projectId) {
                return [
                    'project_id' => $projectId,
                    'bytes' => $storage['bytes'],
                    'files' => $storage['files'],
                    'mb' => round($storage['bytes'] / 1024 / 1024, 2),
                    'gb' => round($storage['bytes'] / 1024 / 1024 / 1024, 3),
                ];
            })
            ->sortByDesc('bytes')
            ->values();

        // Propietarios con mayor consumo.
        $owners = $this->ownerStorageRows();

        // Actividad mensual.
        $monthly = $this->monthlyActivity($start, $end);

        $monthlyMax = max(
            1,
            collect($monthly)
                ->flatMap(fn ($item) => [
                    $item['users'],
                    $item['projects'],
                    $item['models'],
                    $item['incidents'],
                ])
                ->max() ?? 0
        );

        // Incidencias agrupadas por estado.
        $incidentStatuses = incident::query()
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get();

        // Incidencias agrupadas por prioridad.
        $incidentPriorities = incident::query()
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('priority, COUNT(*) as total')
            ->groupBy('priority')
            ->orderByDesc('total')
            ->get();

        return view('livewire.admin.report', compact(
            'totals',
            'period',
            'storageTotal',
            'projectStorage',
            'owners',
            'monthly',
            'monthlyMax',
            'incidentStatuses',
            'incidentPriorities'
        ));
    }
}
