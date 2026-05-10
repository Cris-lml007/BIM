<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('project_user') || !Schema::hasTable('project_memberships')) {
            return;
        }

        DB::table('project_user')->orderBy('id')->chunk(200, function ($rows) {
            foreach ($rows as $row) {
                DB::table('project_memberships')->insert([
                    'project_id' => $row->project_id,
                    'user_id' => $row->user_id,
                    'role' => $row->role,
                    'status' => match ((int) $row->status) {
                        1 => 1,
                        2 => 2,
                        default => 3,
                    },
                    'started_at' => $row->created_at,
                    'ended_at' => (int) $row->status === 1 ? null : $row->updated_at,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]);
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('project_memberships')) {
            return;
        }

        DB::table('project_memberships')->truncate();
    }
};
