<?php

namespace App\Enum;

enum RoleProject: int
{
    case OWNER = 1;
    case CONSTRUCTION_MANAGER = 2;
    case CONSTRUCTION_SUPERVISOR = 3;
    case SPECIALIST_ENGINEER = 4;
    case SITE_RESIDENT = 5;

    public function label(): string
    {
        return match ($this) {
            self::OWNER => 'Propietario',
            self::CONSTRUCTION_MANAGER => 'Jefe de Construcción',
            self::CONSTRUCTION_SUPERVISOR => 'Supervisor de Construcción',
            self::SPECIALIST_ENGINEER => 'Ingeniero Especialista',
            self::SITE_RESIDENT => 'Residente de Obra',
        };
    }

    public function badgeColor(): string
    {
        return match ($this) {
            self::OWNER => 'danger',
            self::CONSTRUCTION_MANAGER => 'success',
            self::CONSTRUCTION_SUPERVISOR => 'primary',
            self::SPECIALIST_ENGINEER => 'info',
            self::SITE_RESIDENT => 'warning',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::OWNER => 'fa-crown',
            self::CONSTRUCTION_MANAGER => 'fa-hard-hat',
            self::CONSTRUCTION_SUPERVISOR => 'fa-clipboard-list',
            self::SPECIALIST_ENGINEER => 'fa-microchip',
            self::SITE_RESIDENT => 'fa-building',
        };
    }
}
