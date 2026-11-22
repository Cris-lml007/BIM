<?php

namespace App\Livewire\Admin;

use App\Models\User;
use App\Enum\RoleSaas;
use Illuminate\Support\Facades\Gate;
use Livewire\Component;
use Livewire\WithPagination;

class UserAudit extends Component
{
    use WithPagination;

    public string $search = '';

    public string $roleFilter = '';

    protected string $paginationTheme = 'bootstrap';

    public function mount(): void
    {
        Gate::authorize('saas-admin');
    }

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function updatedRoleFilter(): void
    {
        $this->resetPage();
    }

    public function render()
    {
        $users = User::query()
            ->when($this->search, function ($query) {
                $search = trim($this->search);

                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('id', $search);
                });
            })
            ->when($this->roleFilter !== '', function ($query) {
                $query->where('role', $this->roleFilter);
            })
            ->withCount('projectsOwner')
            ->withCount('projectMemberships')
            ->latest()
            ->paginate(15);

        return view('livewire.admin.user-audit', [
            'users' => $users,
            'roles' => RoleSaas::cases(),
        ]);
    }
}

