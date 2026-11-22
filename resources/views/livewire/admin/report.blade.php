<div>
    <style>
        .report-header {
            background: linear-gradient(120deg, #0f172a, #312e81);
            color: white;
            border-radius: 16px;
            padding: 28px;
        }

        .report-card {
            border: 0;
            border-radius: 14px;
            box-shadow: 0 3px 16px rgba(15, 23, 42, .06);
            height: 100%;
        }

        .report-icon {
            width: 45px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            font-size: 21px;
        }

        .report-number {
            font-size: 1.8rem;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.2;
        }

        .report-label {
            color: #64748b;
            font-size: .85rem;
        }

        .report-subtitle {
            font-size: .78rem;
            color: #64748b;
        }

        .report-section {
            font-size: 1.1rem;
            font-weight: 750;
            color: #0f172a;
        }

        .report-progress {
            height: 9px;
            background: #e2e8f0;
            border-radius: 20px;
            overflow: hidden;
        }

        .report-progress > div {
            height: 100%;
            border-radius: 20px;
            background: #4f46e5;
        }

        .report-table th {
            color: #64748b;
            font-size: .75rem;
            text-transform: uppercase;
            letter-spacing: .04em;
            white-space: nowrap;
        }

        .report-table td {
            vertical-align: middle;
        }

        .report-month {
            display: grid;
            grid-template-columns: 75px 1fr;
            gap: 12px;
            align-items: center;
            margin-bottom: 18px;
        }

        .report-month-label {
            font-size: .8rem;
            color: #64748b;
            font-weight: 700;
        }

        .report-bars {
            display: grid;
            gap: 5px;
        }

        .report-bar {
            height: 7px;
            border-radius: 10px;
            min-width: 2px;
        }

        .bar-users { background: #4f46e5; }
        .bar-projects { background: #0ea5e9; }
        .bar-models { background: #10b981; }
        .bar-incidents { background: #f59e0b; }

        .report-legend {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            font-size: .78rem;
            color: #64748b;
        }

        .report-legend span {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .report-legend i {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            display: inline-block;
        }

        .report-filter {
            min-width: 155px;
        }

        .report-table-wrapper {
            overflow-x: auto;
        }
    </style>

    <div class="container-fluid py-3">

        {{-- ENCABEZADO --}}
        <div class="report-header mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <div class="text-white-50 small fw-bold text-uppercase mb-2">
                        Administración SaaS
                    </div>

                    <h2 class="fw-bold mb-1">
                        <i class="bi bi-bar-chart-line me-2"></i>
                        Reportes de BIMNova
                    </h2>

                    <p class="text-white-50 mb-0">
                        Estadísticas generales y consumo de recursos de toda la plataforma.
                    </p>
                </div>

                <div class="d-flex flex-wrap gap-2">
                    <button
                        type="button"
                        wire:click="refreshStorage"
                        wire:loading.attr="disabled"
                        class="btn btn-outline-light">
                        <span wire:loading.remove wire:target="refreshStorage">
                            <i class="bi bi-arrow-clockwise me-1"></i>
                            Actualizar almacenamiento
                        </span>

                        <span wire:loading wire:target="refreshStorage">
                            <span class="spinner-border spinner-border-sm me-1"></span>
                            Calculando...
                        </span>
                    </button>

                    <button
                        type="button"
                        wire:click="exportCsv"
                        wire:loading.attr="disabled"
                        class="btn btn-light">
                        <i class="bi bi-file-earmark-spreadsheet me-1"></i>
                        Exportar CSV
                    </button>
                </div>
            </div>
        </div>

        @if (session()->has('storage-message'))
            <div class="alert alert-success alert-dismissible fade show">
                {{ session('storage-message') }}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        @endif

        {{-- FILTROS --}}
        <div class="card report-card mb-4">
            <div class="card-body">
                <form wire:submit="applyFilters">
                    <div class="row align-items-end g-3">
                        <div class="col-12 col-md-4">
                            <label class="form-label fw-semibold">
                                Fecha inicial
                            </label>

                            <input
                                type="date"
                                class="form-control report-filter"
                                wire:model="startDate">
                            @error('startDate')
                                <small class="text-danger">{{ $message }}</small>
                            @enderror
                        </div>

                        <div class="col-12 col-md-4">
                            <label class="form-label fw-semibold">
                                Fecha final
                            </label>

                            <input
                                type="date"
                                class="form-control report-filter"
                                wire:model="endDate">
                            @error('endDate')
                                <small class="text-danger">{{ $message }}</small>
                            @enderror
                        </div>

                        <div class="col-12 col-md-4">
                            <button
                                type="submit"
                                class="btn btn-primary w-100"
                                wire:loading.attr="disabled">
                                <i class="bi bi-funnel me-1"></i>
                                Aplicar filtros
                            </button>
                        </div>
                    </div>
                </form>

                <div class="report-subtitle mt-2">
                    Los totales generales representan toda la plataforma.
                    Los registros nuevos y las incidencias se filtran por las fechas seleccionadas.
                </div>
            </div>
        </div>

        {{-- INDICADORES PRINCIPALES --}}
        <div class="row g-3 mb-4">

            <div class="col-12 col-sm-6 col-xl">
                <div class="card report-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="report-label">Usuarios</div>
                                <div class="report-number">{{ number_format($totals['users']) }}</div>
                                <div class="report-subtitle">
                                    +{{ number_format($period['users']) }} en el período
                                </div>
                            </div>
                            <div class="report-icon bg-primary-subtle text-primary">
                                <i class="bi bi-people"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12 col-sm-6 col-xl">
                <div class="card report-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="report-label">Proyectos</div>
                                <div class="report-number">{{ number_format($totals['projects']) }}</div>
                                <div class="report-subtitle">
                                    +{{ number_format($period['projects']) }} en el período
                                </div>
                            </div>
                            <div class="report-icon bg-info-subtle text-info">
                                <i class="bi bi-folder2-open"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12 col-sm-6 col-xl">
                <div class="card report-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="report-label">Modelos 3D</div>
                                <div class="report-number">{{ number_format($totals['models']) }}</div>
                                <div class="report-subtitle">
                                    +{{ number_format($period['models']) }} en el período
                                </div>
                            </div>
                            <div class="report-icon bg-success-subtle text-success">
                                <i class="bi bi-box"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12 col-sm-6 col-xl">
                <div class="card report-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="report-label">Incidencias</div>
                                <div class="report-number">{{ number_format($totals['incidents']) }}</div>
                                <div class="report-subtitle">
                                    +{{ number_format($period['incidents']) }} en el período
                                </div>
                            </div>
                            <div class="report-icon bg-warning-subtle text-warning">
                                <i class="bi bi-exclamation-circle"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12 col-sm-6 col-xl">
                <div class="card report-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="report-label">Anclajes AR</div>
                                <div class="report-number">{{ number_format($totals['anchors']) }}</div>
                                <div class="report-subtitle">
                                    +{{ number_format($period['anchors']) }} en el período
                                </div>
                            </div>
                            <div class="report-icon bg-danger-subtle text-danger">
                                <i class="bi bi-geo-alt"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        {{-- ALMACENAMIENTO --}}
        <div class="row g-3 mb-4">

            <div class="col-12 col-lg-4">
                <div class="card report-card">
                    <div class="card-body">
                        <div class="report-label mb-2">
                            Almacenamiento total
                        </div>

                        <div class="report-number">
                            {{ number_format($storageTotal / 1024 / 1024 / 1024, 2) }}
                            <span class="fs-6 fw-normal">GB</span>
                        </div>

                        <div class="report-subtitle mt-2">
                            {{ number_format($storageTotal / 1024 / 1024, 2) }} MB utilizados
                        </div>

                        <div class="report-subtitle mt-3">
                            {{ number_format(collect($this->storageStats)->sum('files')) }}
                            archivos encontrados
                        </div>

                        <div class="mt-3 text-muted small">
                            Cálculo basado en los archivos de los directorios de proyectos.
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12 col-lg-8">
                <div class="card report-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h5 class="report-section mb-1">
                                    Proyectos con mayor almacenamiento
                                </h5>
                                <div class="report-subtitle">
                                    Los diez proyectos que más espacio consumen.
                                </div>
                            </div>
                            <i class="bi bi-hdd-stack fs-3 text-primary"></i>
                        </div>

                        @php
                            $topProjects = $projectStorage->take(10);
                            $maxProjectBytes = max(1, (int) $topProjects->max('bytes'));
                        @endphp

                        @forelse ($topProjects as $project)
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="fw-semibold small">
                                        Proyecto #{{ $project['project_id'] }}
                                    </span>
                                    <span class="small text-muted">
                                        {{ number_format($project['mb'], 2) }} MB
                                    </span>
                                </div>

                                <div class="report-progress">
                                    <div style="width: {{ ($project['bytes'] / $maxProjectBytes) * 100 }}%"></div>
                                </div>
                            </div>
                        @empty
                            <p class="text-muted mb-0">
                                No se encontraron proyectos.
                            </p>
                        @endforelse
                    </div>
                </div>
            </div>

        </div>

        {{-- ACTIVIDAD MENSUAL --}}
        <div class="card report-card mb-4">
            <div class="card-body">
                <h5 class="report-section mb-1">
                    Evolución de la plataforma
                </h5>

                <p class="report-subtitle mb-4">
                    Cantidad de registros nuevos por mes durante el período seleccionado.
                </p>

                <div class="report-legend mb-4">
                    <span><i class="bar-users"></i> Usuarios</span>
                    <span><i class="bar-projects"></i> Proyectos</span>
                    <span><i class="bar-models"></i> Modelos</span>
                    <span><i class="bar-incidents"></i> Incidencias</span>
                </div>

                @forelse ($monthly as $month)
                    <div class="report-month">
                        <div class="report-month-label">
                            {{ $month['label'] }}
                        </div>

                        <div class="report-bars">
                            <div
                                class="report-bar bar-users"
                                title="Usuarios: {{ $month['users'] }}"
                                style="width: {{ ($month['users'] / $monthlyMax) * 100 }}%">
                            </div>

                            <div
                                class="report-bar bar-projects"
                                title="Proyectos: {{ $month['projects'] }}"
                                style="width: {{ ($month['projects'] / $monthlyMax) * 100 }}%">
                            </div>

                            <div
                                class="report-bar bar-models"
                                title="Modelos: {{ $month['models'] }}"
                                style="width: {{ ($month['models'] / $monthlyMax) * 100 }}%">
                            </div>

                            <div
                                class="report-bar bar-incidents"
                                title="Incidencias: {{ $month['incidents'] }}"
                                style="width: {{ ($month['incidents'] / $monthlyMax) * 100 }}%">
                            </div>
                        </div>
                    </div>
                @empty
                    <p class="text-muted">No hay actividad para este período.</p>
                @endforelse

                <div class="table-responsive mt-4">
                    <table class="table table-sm report-table">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                <th>Usuarios</th>
                                <th>Proyectos</th>
                                <th>Modelos</th>
                                <th>Incidencias</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($monthly as $month)
                                <tr>
                                    <td>{{ $month['label'] }}</td>
                                    <td>{{ $month['users'] }}</td>
                                    <td>{{ $month['projects'] }}</td>
                                    <td>{{ $month['models'] }}</td>
                                    <td>{{ $month['incidents'] }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {{-- USUARIOS Y ALMACENAMIENTO --}}
        <div class="card report-card mb-4">
            <div class="card-body">
                <div class="mb-3">
                    <h5 class="report-section mb-1">
                        Almacenamiento por propietario
                    </h5>
                    <div class="report-subtitle">
                        Consumo acumulado de los proyectos asociados a cada usuario mediante projectOwner().
                    </div>
                </div>

                <div class="report-table-wrapper">
                    <table class="table table-hover report-table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Correo</th>
                                <th>Proyectos</th>
                                <th>Almacenamiento</th>
                                <th>GB</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($owners->take(15) as $owner)
                                <tr>
                                    <td class="fw-semibold">
                                        {{ $owner['name'] }}
                                        <div class="text-muted small">
                                            ID: {{ $owner['id'] }}
                                        </div>
                                    </td>

                                    <td>{{ $owner['email'] }}</td>

                                    <td>{{ $owner['projects'] }}</td>

                                    <td>
                                        {{ number_format($owner['mb'], 2) }} MB
                                    </td>

                                    <td class="fw-bold">
                                        {{ number_format($owner['gb'], 3) }} GB
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="text-center text-muted py-4">
                                        No hay usuarios registrados.
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {{-- INCIDENCIAS --}}
        <div class="row g-3 mb-4">

            <div class="col-12 col-lg-6">
                <div class="card report-card">
                    <div class="card-body">
                        <h5 class="report-section mb-1">
                            Incidencias por estado
                        </h5>

                        <p class="report-subtitle mb-3">
                            Distribución según el campo status.
                        </p>

                        @forelse ($incidentStatuses as $item)
                            @php
                                $statusLabel = $item->status ?: 'Sin estado';
                                $percentage = $period['incidents'] > 0
                                    ? ($item->total / $period['incidents']) * 100
                                    : 0;
                            @endphp

                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="fw-semibold">
                                        {{ $statusLabel }}
                                    </span>
                                    <span class="text-muted small">
                                        {{ $item->total }} ({{ number_format($percentage, 1) }}%)
                                    </span>
                                </div>

                                <div class="report-progress">
                                    <div style="width: {{ $percentage }}%"></div>
                                </div>
                            </div>
                        @empty
                            <p class="text-muted mb-0">
                                No hay incidencias en este período.
                            </p>
                        @endforelse
                    </div>
                </div>
            </div>

            <div class="col-12 col-lg-6">
                <div class="card report-card">
                    <div class="card-body">
                        <h5 class="report-section mb-1">
                            Incidencias por prioridad
                        </h5>

                        <p class="report-subtitle mb-3">
                            Distribución según el campo priority.
                        </p>

                        @forelse ($incidentPriorities as $item)
                            @php
                                $priorityLabel = $item->priority ?: 'Sin prioridad';
                                $percentage = $period['incidents'] > 0
                                    ? ($item->total / $period['incidents']) * 100
                                    : 0;
                            @endphp

                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="fw-semibold">
                                        {{ $priorityLabel }}
                                    </span>
                                    <span class="text-muted small">
                                        {{ $item->total }} ({{ number_format($percentage, 1) }}%)
                                    </span>
                                </div>

                                <div class="report-progress">
                                    <div style="width: {{ $percentage }}%"></div>
                                </div>
                            </div>
                        @empty
                            <p class="text-muted mb-0">
                                No hay incidencias en este período.
                            </p>
                        @endforelse
                    </div>
                </div>
            </div>

        </div>

        {{-- TABLA DE PROYECTOS --}}
        <div class="card report-card mb-4">
            <div class="card-body">
                <h5 class="report-section mb-1">
                    Almacenamiento de proyectos
                </h5>

                <p class="report-subtitle mb-3">
                    Detalle de todos los directorios encontrados.
                </p>

                <div class="report-table-wrapper">
                    <table class="table table-hover report-table">
                        <thead>
                            <tr>
                                <th>Proyecto</th>
                                <th>Archivos</th>
                                <th>Bytes</th>
                                <th>MB</th>
                                <th>GB</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($projectStorage as $project)
                                <tr>
                                    <td class="fw-semibold">
                                        #{{ $project['project_id'] }}
                                    </td>
                                    <td>{{ number_format($project['files']) }}</td>
                                    <td>{{ number_format($project['bytes']) }}</td>
                                    <td>{{ number_format($project['mb'], 2) }}</td>
                                    <td>{{ number_format($project['gb'], 3) }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="text-center text-muted py-4">
                                        No hay datos de almacenamiento.
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                        <tfoot>
                            <tr class="fw-bold">
                                <td>TOTAL</td>
                                <td>{{ number_format(collect($this->storageStats)->sum('files')) }}</td>
                                <td>{{ number_format($storageTotal) }}</td>
                                <td>{{ number_format($storageTotal / 1024 / 1024, 2) }}</td>
                                <td>{{ number_format($storageTotal / 1024 / 1024 / 1024, 3) }}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>

    </div>
</div>
