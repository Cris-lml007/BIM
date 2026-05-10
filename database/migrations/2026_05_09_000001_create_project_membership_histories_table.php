<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('project_membership_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_membership_id')->nullable()->constrained('project_memberships')->nullOnDelete();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('event_type');
            $table->integer('old_role')->nullable();
            $table->integer('new_role')->nullable();
            $table->tinyInteger('old_status')->nullable();
            $table->tinyInteger('new_status')->nullable();
            $table->foreignId('performed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('performed_at')->useCurrent();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'user_id']);
            $table->index('event_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_membership_histories');
    }
};
