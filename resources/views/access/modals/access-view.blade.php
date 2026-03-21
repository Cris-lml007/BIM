<div class="w-100">
    @php
        // Valores de ejemplo o fallback si no viene data
        $usersLimit = $data['max_users'] ?? 10;
        $usersUsed = random_int(1, $usersLimit);
        $usersPercentage = ($usersLimit > 0) ? ($usersUsed / $usersLimit) * 100 : 0;
        $usersColor = ($usersPercentage >= 100) ? 'danger' : (($usersPercentage >= 80) ? 'warning' : 'secondary');

        $projectsLimit = $data['max_projects'] ?? 5;
        $projectsUsed = random_int(1, $projectsLimit);
        $projectsPercentage = ($projectsLimit > 0) ? ($projectsUsed / $projectsLimit) * 100 : 0;
        $projectsColor = ($projectsPercentage >= 100) ? 'danger' : (($projectsPercentage >= 80) ? 'warning' : 'secondary');

        $startDate = \Carbon\Carbon::parse($data['start_date'] ?? '2025-01-01');
        $endDate = \Carbon\Carbon::parse($data['end_date'] ?? '2026-01-01');
        $now = \Carbon\Carbon::now();
        $totalDays = $startDate->diffInDays($endDate);
        $usedDays = $startDate->diffInDays($now);
        $remainingDays = $now->diffInDays($endDate, true);
        $isExpired = $remainingDays < 0;

        $timePercentage = ($totalDays > 0) ? min(100, max(0, ($usedDays / $totalDays) * 100)) : 0;
        $timeColor = $isExpired ? 'danger' : (($timePercentage >= 90) ? 'warning' : 'secondary');

        $serviceName = $data['service_name'] ?? 'BIM Enterprise';
        $userName = $data['user_name'] ?? 'JAVIER CN';
        $status = $isExpired ? 'Expirado' : 'Activo';
        $statusBadge = $isExpired ? 'bg-danger text-white' : 'bg-success text-white';
    @endphp

    <!-- Header / Banner -->
    <div class="d-flex justify-content-between align-items-center shadow-sm rounded-4 mb-4 p-3 bg-white border">
        <div class="d-flex align-items-center">
            <div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center me-3"
                style="width: 60px; height: 60px;">
                <i class="fas fa-building fa-2x text-white"></i>
            </div>
            <div>
                <h4 class="fw-bold mb-1 text-dark">{{ $userName }}</h4>
                <div class="d-flex align-items-center gap-2 mt-1">
                    <span class="badge {{ $statusBadge }} rounded-pill px-3">{{ $status }}</span>
                    <span class="badge bg-light text-dark rounded-pill px-3">{{ $serviceName }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Timeline de Servicio -->
    <div class="mb-5">
        <div class="d-flex justify-content-between align-items-end mb-2">
            <h6 class="fw-bold text-secondary mb-0"><i class="far fa-calendar-alt me-2"></i>Tiempo de Servicio</h6>
            <span class="fw-bold {{ $isExpired ? 'text-danger' : 'text-secondary' }}">
                @if($isExpired)
                    Expirado hace {{ abs(intval($remainingDays)) }} días
                @else
                    {{ intval($remainingDays) }} días restantes
                @endif
            </span>
        </div>
        <div class="progress" style="height: 12px; border-radius: 10px;">
            <div class="progress-bar bg-{{ $timeColor }}" role="progressbar" style="width: {{ $timePercentage }}%;"
                aria-valuenow="{{ $timePercentage }}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <div class="d-flex justify-content-between mt-2 text-muted small fw-medium">
            <span>Inicio: {{ $startDate->format('d M, Y') }}</span>
            <span>Vence: {{ $endDate->format('d M, Y') }}</span>
        </div>
    </div>

    <div class="row g-4 pb-2">
        <!-- Usuarios Permitidos -->
        <div class="col-md-6">
            <div class="card h-100 border-0 shadow-sm rounded-4 bg-white info-card">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="icon-box bg-light text-{{ $usersColor }} rounded-circle d-flex align-items-center justify-content-center"
                            style="width: 45px; height: 45px;">
                            <i class="fas fa-users fs-5"></i>
                        </div>
                        <h4 class="fw-bold text-dark mb-0">{{ $usersUsed }} <span class="text-muted fs-6">/
                                {{ $usersLimit }}</span></h4>
                    </div>
                    <h6 class="fw-bold text-secondary mb-2">Límite de Usuarios</h6>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-{{ $usersColor }}" role="progressbar"
                            style="width: {{ $usersPercentage }}%;" aria-valuenow="{{ $usersPercentage }}"
                            aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <small class="text-muted mt-2 d-block">
                        @if($usersPercentage >= 100)
                            <i class="fas fa-exclamation-triangle text-danger"></i> Límite alcanzado
                        @elseif($usersPercentage >= 80)
                            <i class="fas fa-info-circle text-warning"></i> Cerca del límite
                        @else
                            Quedan {{ $usersLimit - $usersUsed }} licencias
                        @endif
                    </small>
                </div>
            </div>
        </div>

        <!-- Proyectos Permitidos -->
        <div class="col-md-6">
            <div class="card h-100 border-0 shadow-sm rounded-4 bg-white info-card">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="icon-box bg-light text-{{ $projectsColor }} rounded-circle d-flex align-items-center justify-content-center"
                            style="width: 45px; height: 45px;">
                            <i class="fas fa-project-diagram fs-5"></i>
                        </div>
                        <h4 class="fw-bold text-dark mb-0">{{ $projectsUsed }} <span class="text-muted fs-6">/
                                {{ $projectsLimit }}</span></h4>
                    </div>
                    <h6 class="fw-bold text-secondary mb-2">Límite de Proyectos</h6>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-{{ $projectsColor }}" role="progressbar"
                            style="width: {{ $projectsPercentage }}%;" aria-valuenow="{{ $projectsPercentage }}"
                            aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <small class="text-muted mt-2 d-block">
                        @if($projectsPercentage >= 100)
                            <i class="fas fa-exclamation-triangle text-danger"></i> Límite alcanzado
                        @elseif($projectsPercentage >= 80)
                            <i class="fas fa-info-circle text-warning"></i> Cerca del límite
                        @else
                            Quedan {{ $projectsLimit - $projectsUsed }} proyectos
                        @endif
                    </small>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .info-card {
        transition: all 0.2s ease-in-out;
        border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .progress-bar {
        border-radius: 6px;
    }

    .badge {
        font-size: 0.85rem;
        font-weight: 600;
    }
</style>