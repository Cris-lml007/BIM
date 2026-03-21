<?php

namespace App\Enum;

enum Role: int
{
    CASE ADMIN = 1;
    CASE PRIVILIGIED = 2;
    CASE USER = 3;

    CASE OWNER = 4;
    CASE SITE_MANAGER = 5;
    CASE AUXILIAR = 6;
}
