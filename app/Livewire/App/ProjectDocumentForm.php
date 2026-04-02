<?php

namespace App\Livewire\App;

use Livewire\Component;
use Livewire\WithFileUploads;
use Illuminate\Support\Facades\Auth;
use App\Models\Document;
use App\Models\Project;
use Livewire\TemporaryUploadedFile;
use Illuminate\Support\Facades\Storage;

class ProjectDocumentForm extends Component
{
    use WithFileUploads;

    public Project $project;
    public string $modal_name = '';

    public $files = [];
    public string $externalLink = '';
    public bool $showLinkInput = false;
    public bool $isUploading = false;

    public int $maxFiles = 10;

    protected function rules(): array
    {
        if ($this->showLinkInput) {
            return [
                'externalLink' => 'required|url|max:2048',
            ];
        }

        return [
            'files' => 'required|array|min:1|max:10',
            'files.*' => 'file|mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx|max:10240', // Añadimos max aquí
        ];
    }

    protected $messages = [
        'files.required' => 'Debes seleccionar al menos un archivo.',
        'files.*.mimes' => 'Sólo se permiten: imagen, PDF, Word o Excel.',
        'files.*.max' => 'Cada archivo no puede superar los 10 MB.',
        'externalLink.required' => 'El enlace es obligatorio.',
        'externalLink.url' => 'Debe ser una URL válida (incluye https://).',
    ];

    public function mount(Project $project, string $modal_name = '')
    {
        $this->project = $project;
        $this->modal_name = $modal_name;
    }

    public function toggleLinkInput(): void
    {
        $this->showLinkInput = !$this->showLinkInput;
        $this->resetErrors();

        if ($this->showLinkInput) {
            $this->files = [];
        } else {
            $this->externalLink = '';
        }
    }

    public function updatedFiles(): void
    {
        if (count($this->files) > $this->maxFiles) {
            $this->addError('files', "No puedes agregar más de {$this->maxFiles} archivos a la vez.");
            $this->files = array_slice($this->files, 0, $this->maxFiles);
        }
    }

    public function removeFile(int $index): void
    {
        unset($this->files[$index]);
        $this->files = array_values($this->files);
    }
    public function save(): void
    {
        $this->validate();

        $this->isUploading = true;

        try {
            $maxMB = $this->project->ownerAccess()->max_storage;
            $maxBytes = $maxMB * (1024 ** 2);

            $currentUsedBytes = Document::where('project_id', $this->project->id)->sum('size');

            $newFilesBytes = 0;


            if ($this->showLinkInput) {
                $name = $this->extractNameFromUrl($this->externalLink);

                Document::create([
                    'name' => $name,
                    'path' => $this->externalLink,
                    'type' => 'link',
                    'size' => 0,
                    'project_id' => $this->project->id,
                    'user_id' => Auth::id(),
                ]);
            } else {
                // Calcular el tamaño total de los nuevos archivos

                foreach ($this->files as $file) {
                    $fileSize = $file->getSize(); // Este método es más confiable en Livewire
                    $newFilesBytes += $fileSize;

                }


                // Verificar espacio disponible
                $totalAfterUpload = $currentUsedBytes + $newFilesBytes;
                if ($totalAfterUpload > $maxBytes) {
                    $availableMB = round(($maxBytes - $currentUsedBytes) / (1024 ** 2), 2);
                    $neededMB = round(($totalAfterUpload - $maxBytes) / (1024 ** 2), 2);

                    // Mostrar error y salir
                    $this->addError('files', "No tienes suficiente espacio disponible. Te quedan {$availableMB} MB y necesitas {$neededMB} MB adicionales.");
                    $this->isUploading = false;
                    return; // Importante: detener la ejecución
                }

                // Guardar los archivos
                foreach ($this->files as $file) {
                    $fileSize = $file->getSize();
                    $originalName = $file->getClientOriginalName();
                    $extension = $file->getClientOriginalExtension();

                    // Generar nombre único
                    $hashName = md5(time() . uniqid() . $originalName) . '.' . $extension;

                    // Asegurar que el directorio existe
                    $directory = "projects/{$this->project->id}";

                    // Guardar en storage privado
                    $path = $file->storeAs($directory, $hashName, 'local'); // Especificar el disco

                    if ($path) {
                        Document::create([
                            'name' => $originalName,
                            'path' => $path,
                            'type' => $file->getMimeType(),
                            'size' => $fileSize,
                            'project_id' => $this->project->id,
                            'user_id' => Auth::id(),
                        ]);
                    }
                }
            }

            $this->dispatch('document-saved')->to(ProjectDocumenteView::class);

            $this->js("
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Documento(s) registrado(s) correctamente',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        ");

            $this->closeModal();
            $this->resetForm();

        } catch (\Throwable $e) {
            \Log::error('Error al guardar documentos: ' . $e->getMessage());
            $this->addError('general', 'Error al guardar: ' . $e->getMessage());
        } finally {
            $this->isUploading = false;
        }
    }

    private function extractNameFromUrl(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH) ?? '';
        $filename = basename($path);

        return (!empty($filename) && pathinfo($filename, PATHINFO_EXTENSION))
            ? $filename
            : 'enlace_externo_' . now()->format('Y-m-d_H-i-s');
    }

    private function closeModal(): void
    {
        $this->js("$('#$this->modal_name').modal('hide')");
    }

    public function resetForm(): void
    {
        $this->files = [];
        $this->externalLink = '';
        $this->showLinkInput = false;
        $this->resetErrorBag();
    }

    private function resetErrors(): void
    {
        $this->resetErrorBag(['files', 'externalLink', 'general']);
    }

    public function render()
    {
        return view('livewire.app.project-document-form');
    }
}