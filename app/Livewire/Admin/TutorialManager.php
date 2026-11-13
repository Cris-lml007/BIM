<?php

namespace App\Livewire\Admin;

use App\Models\Tutorial;
use Livewire\Component;
use Livewire\WithFileUploads;

class TutorialManager extends Component
{
    use WithFileUploads;

    // --- Propiedades del formulario ---
    public $title = '';
    public $description = '';
    public $youtube_url = '';
    public $order = 0;
    public $is_active = true;
    public $thumbnail;
    public $editingId = null;

    // --- Estado del modal ---
    public $showModal = false;
    public $modalMode = 'create'; // 'create' | 'edit'

    // --- Confirmación de eliminación ---
    public $deleteId = null;
    public $showDeleteConfirm = false;

    // --- Búsqueda ---
    public $search = '';

    protected function rules(): array
    {
        return [
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'youtube_url' => 'required|url|max:255',
            'order'       => 'required|integer|min:0',
            'is_active'   => 'boolean',
            'thumbnail'   => 'nullable|image|max:2048',
        ];
    }

    protected function messages(): array
    {
        return [
            'title.required'       => 'El título es obligatorio.',
            'youtube_url.required' => 'La URL de YouTube es obligatoria.',
            'youtube_url.url'      => 'Ingresa una URL válida.',
            'thumbnail.image'      => 'El archivo debe ser una imagen.',
            'thumbnail.max'        => 'La imagen no debe superar 2 MB.',
        ];
    }

    // =============================================
    //  CRUD
    // =============================================

    public function openCreateModal(): void
    {
        $this->resetForm();
        $this->modalMode = 'create';
        $this->editingId = null;
        $this->order = Tutorial::max('order') + 1;
        $this->showModal = true;
        $this->dispatch('open-modal');
    }

    public function openEditModal(int $id): void
    {
        $this->resetValidation();
        $tutorial = Tutorial::findOrFail($id);

        $this->editingId   = $tutorial->id;
        $this->title       = $tutorial->title;
        $this->description = $tutorial->description ?? '';
        $this->youtube_url = $tutorial->youtube_url;
        $this->order       = $tutorial->order;
        $this->is_active   = $tutorial->is_active;
        $this->thumbnail   = null;
        $this->modalMode   = 'edit';
        $this->showModal   = true;
        $this->dispatch('open-modal');
    }

    public function save(): void
    {
        $this->validate();

        $data = [
            'title'       => $this->title,
            'description' => $this->description,
            'youtube_url' => $this->youtube_url,
            'order'       => $this->order,
            'is_active'   => $this->is_active,
        ];

        if ($this->thumbnail) {
            $data['thumbnail'] = $this->thumbnail->store('tutorials', 'public');
        }

        if ($this->editingId) {
            $tutorial = Tutorial::findOrFail($this->editingId);

            // Eliminar thumbnail anterior si se sube uno nuevo
            if ($this->thumbnail && $tutorial->thumbnail) {
                \Storage::disk('public')->delete($tutorial->thumbnail);
            }

            $tutorial->update($data);
            session()->flash('message', 'Tutorial actualizado correctamente.');
        } else {
            Tutorial::create($data);
            session()->flash('message', 'Tutorial creado correctamente.');
        }

        $this->closeModal();
    }

    public function confirmDelete(int $id): void
    {
        $this->deleteId = $id;
        $this->showDeleteConfirm = true;
        $this->dispatch('open-delete-modal');
    }

    public function delete(): void
    {
        $tutorial = Tutorial::findOrFail($this->deleteId);

        if ($tutorial->thumbnail) {
            \Storage::disk('public')->delete($tutorial->thumbnail);
        }

        $tutorial->delete();
        $this->showDeleteConfirm = false;
        $this->deleteId = null;
        $this->dispatch('close-delete-modal');
        session()->flash('message', 'Tutorial eliminado correctamente.');
    }

    public function toggleActive(int $id): void
    {
        $tutorial = Tutorial::findOrFail($id);
        $tutorial->update(['is_active' => !$tutorial->is_active]);
    }

    // =============================================
    //  Helpers
    // =============================================

    public function closeModal(): void
    {
        $this->showModal = false;
        $this->dispatch('close-modal');
    }

    public function resetForm(): void
    {
        $this->resetValidation();
        $this->title       = '';
        $this->description = '';
        $this->youtube_url = '';
        $this->order       = 0;
        $this->is_active   = true;
        $this->thumbnail   = null;
        $this->editingId   = null;
    }

    public function getTutorialsProperty()
    {
        return Tutorial::when($this->search, function ($q) {
                $q->where('title', 'like', "%{$this->search}%")
                  ->orWhere('description', 'like', "%{$this->search}%");
            })
            ->orderBy('order')
            ->get();
    }

    public function render()
    {
        return view('livewire.admin.tutorial-manager');
    }
}
