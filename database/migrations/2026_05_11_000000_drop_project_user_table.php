<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the legacy project_user table
        // All data has been migrated to project_memberships
        if (Schema::hasTable('project_user')) {
            Schema::dropIfExists('project_user');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the legacy table for rollback purposes
        Schema::create('project_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('role');
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
            $table->unique(['project_id', 'user_id']);
        });
    }
};
