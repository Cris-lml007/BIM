<div>
<x-slot name="header">
    <div class="w-100">

        <div class="d-flex justify-content-between align-items-center flex-wrap">
            <h1 class="h2 fw-bold text-dark mb-2">
                {{ strtoupper($project->name) }}
            </h1>

            <div class="d-flex align-items-center gap-2 flex-wrap">
                <button type="button"
                    id="btn-download-project"
                    class="btn btn-sm btn-outline-primary"
                    data-project-id="{{ $project->id }}">
                    <i class="fas fa-cloud-download-alt mr-1"></i>
                    Descargar proyecto
                </button>

                <button type="button"
                    id="btn-delete-project"
                    class="btn btn-sm btn-outline-danger d-none"
                    data-project-id="{{ $project->id }}">
                    <i class="fas fa-trash-alt mr-1"></i>
                    Eliminar descarga offline
                </button>
            </div>
        </div>

        <div id="project-download-container" class="mt-3 d-none w-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <small id="project-download-status">
                    Preparando descarga...
                </small>

                <small id="project-download-percentage">0%</small>
            </div>

            <div class="progress" style="height: 7px;">
                <div id="project-download-progress"
                    class="progress-bar"
                    role="progressbar"
                    style="width: 0%">
                </div>
            </div>
        </div>

    </div>
</x-slot>
    <x-card>
        <div class="container-fluid py-4">
            <div class="row g-4">
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <p class="text-muted mb-1 small">Modelos 3D</p>
                                    <h2
                                        class="display-6 fw-semibold mb-0 @if ($stats['models3d'] >= $project->owner->access->max_models) text-danger @endif">
                                        {{ $stats['models3d'] }}</h2>
                                </div>
                                <div class="bg-purple bg-opacity-10 rounded-3 p-3">
                                    <i class="fas fa-cube fa-2x text-purple"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Stats Cards -->
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <p class="text-muted mb-1 small">Planos</p>
                                    <h2 class="display-6 fw-semibold mb-0">{{ $stats['plans'] }}</h2>
                                </div>
                                <div class="bg-primary bg-opacity-10 rounded-3 p-3">
                                    <i class="nf nf-md-floor_plan fa-2x text-primary"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <p class="text-muted mb-1 small">Documentos</p>
                                    <h2 class="display-6 fw-semibold mb-0">{{ $stats['documents'] }}</h2>
                                </div>
                                <div class="bg-warning bg-opacity-10 rounded-3 p-3">
                                    <i class="fas fa-folder fa-2x text-warning"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <p class="text-muted mb-1 small">Miembros</p>
                                    <h2 class="display-6 fw-semibold mb-0">{{ $stats['members'] }}</h2>
                                </div>
                                <div class="bg-success bg-opacity-10 rounded-3 p-3">
                                    <i class="fas fa-users fa-2x text-success"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="g-4">
                    <div class="col">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-body p-4">
                                <div>
                                    <h5><strong>Acerca del Proyecto</strong></h5>
                                </div>
                                <div>
                                    <p>{{ $project->description }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Invitados y Miembros -->
                <div class="col-12 col-lg-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-white border-0 pt-4 px-4">
                            <h5 class="card-title fw-semibold mb-1">Equipo del Proyecto</h5>
                        </div>
                        <div class="card-body p-4 pt-0">
                            <div class="list-group list-group-flush">
                                @forelse($membersList as $member)
                                    <div
                                        class="list-group-item px-0 py-3 d-flex align-items-center bg-transparent border-0">
                                        <div class="flex-shrink-0">
                                            <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold
                                                            {{ $member->type === 'pending' ? 'bg-secondary' : 'bg-primary' }}"
                                                style="width: 40px; height: 40px;">
                                                {{ $member->initials }}
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <p class="mb-0 fw-semibold text-truncate" style="max-width: 150px;">
                                                {{ $member->name }}
                                            </p>
                                            <small class="text-muted d-block text-truncate"
                                                style="max-width: 150px;">{{ $member->email }}</small>
                                        </div>

                                        <div class="ms-auto">
                                            @if (!is_int($member->role))
                                                <span class="badge bg-warning text-dark rounded-pill small">

                                                    {{ $member->role }}
                                                </span>
                                            @endif
                                        </div>

                                    </div>
                                @empty
                                    <p class="text-muted small py-3">No hay miembros registrados.</p>
                                @endforelse
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-lg-8">
                    <div class="card border-0 shadow-sm h-100">
                        <div
                            class="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                            <h5 class="card-title fw-semibold mb-1">Actividad Reciente</h5>

                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush">
                                @forelse($activities as $activity)
                                    <div class="list-group-item px-4 py-3 d-flex align-items-start bg-transparent">
                                        <div class="flex-shrink-0">
                                            <div
                                                class="rounded-circle bg-opacity-10 p-2
                                                            {{ str_contains($activity->type, 'image') || str_contains($activity->type, 'pdf') ? 'bg-primary' : 'bg-warning' }}">
                                                <i
                                                    class="fas fa-file-upload {{ str_contains($activity->type, 'image') || str_contains($activity->type, 'pdf') ? 'text-primary' : 'text-warning' }}"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <p class="mb-1"><strong>{{ $activity->user->name ?? 'Usuario' }}</strong>
                                                subió
                                                "{{ $activity->name }}"</p>
                                            <small class="text-muted">
                                                <i
                                                    class="far fa-clock me-1"></i>{{ $activity->created_at->diffForHumans() }}
                                            </small>
                                        </div>
                                    </div>
                                @empty
                                    <div class="p-4 text-center text-muted">
                                        <i class="fas fa-history fa-2x mb-3 opacity-20"></i>
                                        <p class="small mb-0">No hay actividad reciente.</p>
                                    </div>
                                @endforelse
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="col-12">
                    <div class="mt-3">
                        <h6 class="fw-semibold mb-3 text-muted">Acciones rápidas</h6>
                        <div class="row g-3">
                            <div class="col-6 col-sm-3">
                                <a href="{{ route('app.project.documents', $project) }}"
                                    class="btn btn-light w-100 py-3 border hover-shadow transition d-flex align-items-center justify-content-center text-decoration-none text-dark">
                                    <i class="nf nf-md-floor_plan text-primary me-2"></i>
                                    <span class="fw-semibold">Subir Plano</span>
                                </a>
                            </div>
                            <div class="col-6 col-sm-3">
                                <a href="{{ route('app.project.model3d', $project) }}"
                                    class="btn btn-light w-100 py-3 border hover-shadow transition d-flex align-items-center justify-content-center text-decoration-none text-dark">
                                    <i class="fas fa-cube text-purple me-2"></i>
                                    <span class="fw-semibold">Modelo 3D</span>
                                </a>
                            </div>
                            <div class="col-6 col-sm-3">
                                <a href="{{ route('app.project.documents', $project) }}"
                                    class="btn btn-light w-100 py-3 border hover-shadow transition d-flex align-items-center justify-content-center text-decoration-none text-dark">
                                    <i class="fas fa-file-alt text-warning me-2"></i>
                                    <span class="fw-semibold">Documento</span>
                                </a>
                            </div>
                            <div class="col-6 col-sm-3">
                                <a href="{{ route('app.project.members', $project) }}"
                                    class="btn btn-light w-100 py-3 border hover-shadow transition d-flex align-items-center justify-content-center text-decoration-none text-dark">
                                    <i class="fas fa-user-plus text-success me-2"></i>
                                    <span class="fw-semibold">Invitar</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </x-card>
</div>

<style>
    /* Estilos personalizados */
    .bg-purple {
        background-color: #6f42c1 !important;
    }

    .text-purple {
        color: #6f42c1 !important;
    }

    .bg-purple.bg-opacity-10 {
        background-color: rgba(111, 66, 193, 0.1) !important;
    }

    .hover-shadow:hover {
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
        transform: translateY(-2px);
        transition: all 0.2s ease;
    }

    .transition {
        transition: all 0.2s ease;
    }

    .card {
        border-radius: 1rem !important;
    }

    .btn-light {
        background-color: #f8f9fa;
    }

    .btn-light:hover {
        background-color: #e9ecef;
    }

    .list-group-item {
        border-color: #f0f0f0;
    }
</style>


@script
<script>
(async function initProjectOffline() {

    const downloadButton = document.getElementById('btn-download-project');
    const deleteButton = document.getElementById('btn-delete-project');

    const downloadContainer = document.getElementById('project-download-container');
    const downloadStatus = document.getElementById('project-download-status');
    const downloadPercentage = document.getElementById('project-download-percentage');
    const downloadProgress = document.getElementById('project-download-progress');

    if (!downloadButton || !deleteButton || !downloadContainer) {
        console.warn('[BIMNova Offline] No se encontraron los elementos necesarios.');
        return;
    }

    const projectId = String(downloadButton.dataset.projectId);

    if (projectId !== String(deleteButton.dataset.projectId)) {
        console.error('[BIMNova Offline] Los IDs de proyecto no coinciden.');
        return;
    }

    const originalDownloadContent = downloadButton.innerHTML;
    const originalDeleteContent = deleteButton.innerHTML;

    let processing = false;

    async function waitForOfflineModule(maxAttempts = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            if (
                window.BIMNovaOffline &&
                typeof window.BIMNovaOffline.getProjects === 'function' &&
                typeof window.BIMNovaOffline.downloadProject === 'function' &&
                typeof window.BIMNovaOffline.deleteProjectDownload === 'function'
            ) {
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        return false;
    }

    function setDownloadButton(state) {
        downloadButton.classList.remove('d-none');

        switch (state) {
            case 'loading':
                downloadButton.disabled = true;
                downloadButton.innerHTML =
                    '<i class="fas fa-spinner fa-spin mr-1"></i> Descargando...';
                break;

            case 'downloaded':
                downloadButton.classList.add('d-none');
                downloadButton.disabled = false;
                downloadButton.innerHTML = originalDownloadContent;
                break;

            case 'retry':
                downloadButton.disabled = false;
                downloadButton.innerHTML =
                    '<i class="fas fa-redo mr-1"></i> Reintentar descarga';
                break;

            default:
                downloadButton.disabled = false;
                downloadButton.innerHTML = originalDownloadContent;
        }
    }

    function setDeleteButton(state) {
        switch (state) {
            case 'hidden':
                deleteButton.classList.add('d-none');
                deleteButton.disabled = false;
                deleteButton.innerHTML = originalDeleteContent;
                break;

            case 'loading':
                deleteButton.classList.remove('d-none');
                deleteButton.disabled = true;
                deleteButton.innerHTML =
                    '<i class="fas fa-spinner fa-spin mr-1"></i> Eliminando...';
                break;

            default:
                deleteButton.classList.remove('d-none');
                deleteButton.disabled = false;
                deleteButton.innerHTML = originalDeleteContent;
        }
    }

    function resetProgress() {
        downloadContainer.classList.add('d-none');

        downloadProgress.style.width = '0%';
        downloadProgress.className = 'progress-bar';

        downloadPercentage.textContent = '0%';
        downloadStatus.textContent = 'Preparando descarga...';
    }

    async function refreshProjectState() {
        const available = await waitForOfflineModule();

        if (!available) {
            console.warn('[BIMNova Offline] Módulo offline no disponible.');
            return;
        }

        try {
            const projects = await window.BIMNovaOffline.getProjects();

            const project = projects.find(
                item => String(item.projectId) === projectId
            );

            console.log('[BIMNova Offline] Estado del proyecto:', project);

            if (project?.status === 'downloaded') {
                setDownloadButton('downloaded');
                setDeleteButton('visible');
            } else if (project) {
                // Si existe una descarga parcial, permitimos reintentar
                // y también eliminar los archivos descargados.
                setDownloadButton('retry');
                setDeleteButton('visible');
            } else {
                setDownloadButton('default');
                setDeleteButton('hidden');
            }

        } catch (error) {
            console.error('[BIMNova Offline] Error consultando proyecto:', error);
        }
    }

    // ELIMINAR DESCARGA OFFLINE
    deleteButton.addEventListener('click', async () => {

        if (processing) return;

        const confirmed = confirm(
            '¿Deseas eliminar la descarga offline de este proyecto?\n\n' +
            'Los archivos originales del servidor no serán afectados.'
        );

        if (!confirmed) return;

        processing = true;
        setDeleteButton('loading');

        try {
            const available = await waitForOfflineModule();

            if (!available) {
                throw new Error('El módulo offline no está disponible.');
            }

            const deleted = await window.BIMNovaOffline.deleteProjectDownload(projectId);

            const projects = await window.BIMNovaOffline.getProjects();

            const remaining = projects.find(
                item => String(item.projectId) === projectId
            );

            if (remaining) {
                throw new Error('El proyecto continúa registrado en IndexedDB.');
            }

            setDeleteButton('hidden');
            setDownloadButton('default');

            resetProgress();

            console.log('[BIMNova Offline] Descarga eliminada:', {
                projectId,
                deletedFiles: deleted
            });

            alert(
                'La descarga offline fue eliminada correctamente.\n' +
                'Archivos eliminados: ' + deleted
            );

        } catch (error) {
            console.error('[BIMNova Offline] Error eliminando proyecto:', error);

            setDeleteButton('visible');

            alert('No se pudo eliminar la descarga offline: ' + error.message);

        } finally {
            processing = false;
        }
    });

    // DESCARGAR PROYECTO
    downloadButton.addEventListener('click', async () => {

        if (processing) return;

        if (!navigator.onLine) {
            alert('Necesitas conexión a Internet para descargar el proyecto.');
            return;
        }

        processing = true;
        setDownloadButton('loading');

        downloadContainer.classList.remove('d-none');

        downloadProgress.className = 'progress-bar';
        downloadProgress.style.width = '0%';

        downloadPercentage.textContent = '0%';
        downloadStatus.textContent = 'Preparando proyecto...';

        try {
            const available = await waitForOfflineModule();

            if (!available) {
                throw new Error('El módulo de descargas offline no está disponible.');
            }

            const result = await window.BIMNovaOffline.downloadProject(
                projectId,
                progress => {

                    const percentage = progress.percentage ?? 0;

                    downloadProgress.style.width = `${percentage}%`;
                    downloadPercentage.textContent = `${percentage}%`;

                    if (progress.phase === 'files') {
                        downloadStatus.textContent =
                            `Descargando modelos (${progress.current}/${progress.total})`;

                    } else if (progress.phase === 'completed') {
                        downloadStatus.textContent = 'Finalizando descarga...';
                    }
                }
            );

            downloadProgress.className = 'progress-bar';

            if (result.success) {

                downloadProgress.classList.add('bg-success');
                downloadProgress.style.width = '100%';

                downloadPercentage.textContent = '100%';

                downloadStatus.textContent =
                    `Proyecto descargado correctamente. ${result.downloaded} modelo(s).`;

                setDownloadButton('downloaded');
                setDeleteButton('visible');

            } else {

                downloadProgress.classList.add('bg-warning');

                downloadStatus.textContent =
                    `Descarga incompleta: ${result.downloaded} correcto(s), ` +
                    `${result.failed} fallido(s).`;

                setDownloadButton('retry');
                setDeleteButton('visible');
            }

            console.log('[BIMNova Offline] Resultado:', result);

        } catch (error) {

            console.error('[BIMNova Offline] Error:', error);

            downloadProgress.classList.add('bg-danger');

            downloadStatus.textContent = 'Error al descargar el proyecto.';

            setDownloadButton('retry');

        } finally {
            processing = false;
        }
    });

    // Comprobar el estado al entrar a la página.
    await refreshProjectState();

})();
</script>
@endscript
