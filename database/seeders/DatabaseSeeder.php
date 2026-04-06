<?php

namespace Database\Seeders;

use App\Enum\RoleSaas;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        $u = User::create([
            'name' => 'admin',
            'email' => 'admin@example.com',
            'password' => '12345678',
            'phone' => 12345678,
            'organization' => 'BIMNOVA'
        ]);

        $u->role = RoleSaas::ADMIN;
        $u->save();
    }
}
