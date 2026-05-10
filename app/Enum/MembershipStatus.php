<?php

namespace App\Enum;

enum MembershipStatus: int
{
    case ACTIVE = 1;
    case PENDING = 2;
    case EXPELLED = 3;
    case LEFT = 4;
    case BLOCKED = 5;

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Activo',
            self::PENDING => 'Pendiente',
            self::EXPELLED => 'Expulsado',
            self::LEFT => 'Abandonado',
            self::BLOCKED => 'Bloqueado',
        };
    }

    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }
}
