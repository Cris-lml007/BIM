<?php

namespace App\Livewire\App;

use Livewire\Component;
use Livewire\WithFileUploads;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
class ProjectDocumentForm extends Component
{
    use WithFileUploads;

    // Propiedades
    public $files = [];
    public $externalLink = '';
    public $uploadProgress = [];
    public $uploadedFiles = [];
    public $showLinkInput = false; // 👈 ESTA ES LA PROPIEDAD QUE FALTABA
    public $isUploading = false;
    public $maxFiles = 10;
    public $maxSize = 10240; // 10MB en KB
    public $acceptedTypes = [
        'image/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    protected $rules = [
        'files.*' => 'file|mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx|max:10240',
        'externalLink' => 'nullable|url'
    ];

    protected $messages = [
        'files.*.mimes' => 'El archivo debe ser: imagen, PDF, Word o Excel',
        'files.*.max' => 'El archivo no puede superar los 10MB',
        'externalLink.url' => 'El enlace debe ser una URL válida'
    ];

    public function mount()
    {
        $this->uploadProgress = [];
        $this->showLinkInput = false; // Inicializar como false
    }

    // Drag & Drop
    public function updatedFiles()
    {
        $this->validateOnly('files');

        if (count($this->files) > $this->maxFiles) {
            $this->addError('files', "No puedes subir más de {$this->maxFiles} archivos");
            $this->files = array_slice($this->files, 0, $this->maxFiles);
            return;
        }

        foreach ($this->files as $key => $file) {
            $this->uploadProgress[$key] = 0;
        }
    }

    // Cambiar entre modo archivos y enlace
    public function toggleLinkInput()
    {
        $this->showLinkInput = !$this->showLinkInput;
        if ($this->showLinkInput) {
            $this->files = []; // Limpiar archivos si se cambia a modo enlace
        } else {
            $this->externalLink = ''; // Limpiar enlace si se cambia a modo archivos
        }
    }

    // Subir archivos
    public function uploadFiles()
    {
        $this->validate();

        if (empty($this->files) && empty($this->externalLink)) {
            $this->addError('general', 'Debes seleccionar al menos un archivo o proporcionar un enlace');
            return;
        }

        $this->isUploading = true;

        try {
            // Subir archivos locales
            if (!empty($this->files)) {
                foreach ($this->files as $key => $file) {
                    // Simular progreso
                    for ($i = 0; $i <= 100; $i += 10) {
                        $this->uploadProgress[$key] = $i;
                        $this->dispatch('progress-update', key: $key, progress: $i);
                        usleep(50000); // Simular tiempo de carga
                    }

                    // Guardar archivo
                    $filename = $this->generateFileName($file);
                    $path = $file->storeAs('uploads', $filename, 'public');

                    $this->uploadedFiles[] = [
                        'name' => $file->getClientOriginalName(),
                        'size' => $this->formatBytes($file->getSize()),
                        'type' => $file->getMimeType(),
                        'path' => $path,
                        'url' => Storage::url($path),
                        'source' => 'local'
                    ];

                    $this->uploadProgress[$key] = 100;
                }
            }

            // Procesar enlace externo
            if (!empty($this->externalLink)) {
                $this->uploadedFiles[] = [
                    'name' => $this->getFileNameFromUrl($this->externalLink),
                    'size' => 'Enlace externo',
                    'type' => 'link',
                    'url' => $this->externalLink,
                    'source' => 'link'
                ];
            }

            // Emitir evento con los archivos subidos
            $this->dispatch('files-uploaded', files: $this->uploadedFiles);

            // Mostrar mensaje de éxito
            session()->flash('message', 'Archivos procesados correctamente');

            // Resetear formulario
            $this->resetForm();

        } catch (\Exception $e) {
            $this->addError('general', 'Error al subir los archivos: ' . $e->getMessage());
        } finally {
            $this->isUploading = false;
        }
    }

    // Eliminar archivo de la lista antes de subir
    public function removeFile($index)
    {
        unset($this->files[$index]);
        $this->files = array_values($this->files);

        if (isset($this->uploadProgress[$index])) {
            unset($this->uploadProgress[$index]);
        }
    }

    // Eliminar archivo ya subido
    public function removeUploadedFile($index)
    {
        if (isset($this->uploadedFiles[$index]['path'])) {
            Storage::disk('public')->delete($this->uploadedFiles[$index]['path']);
        }
        unset($this->uploadedFiles[$index]);
        $this->uploadedFiles = array_values($this->uploadedFiles);

        $this->dispatch('files-updated', files: $this->uploadedFiles);
    }

    // Resetear formulario
    public function resetForm()
    {
        $this->files = [];
        $this->externalLink = '';
        $this->uploadProgress = [];
        $this->showLinkInput = false;
        $this->resetErrorBag();
    }

    // Generar nombre único para el archivo
    private function generateFileName($file)
    {
        $extension = $file->getClientOriginalExtension();
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $slug = Str::slug($originalName);

        return date('Y-m-d_H-i-s') . '_' . $slug . '_' . Str::random(8) . '.' . $extension;
    }

    // Obtener nombre de archivo desde URL
    private function getFileNameFromUrl($url)
    {
        $path = parse_url($url, PHP_URL_PATH);
        $filename = basename($path);

        if (empty($filename) || !pathinfo($filename, PATHINFO_EXTENSION)) {
            $filename = 'enlace_externo_' . date('Y-m-d_H-i-s');
        }

        return $filename;
    }
    public function resetFiles()
    {
        $this->files = [];
        $this->uploadProgress = [];
        $this->resetErrorBag();
    }
    // Formatear bytes
    private function formatBytes($bytes, $decimals = 2)
    {
        $size = ['B', 'KB', 'MB', 'GB'];
        $factor = floor((strlen($bytes) - 1) / 3);

        return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . ' ' . $size[$factor];
    }
    public function render()
    {
        return view('livewire.app.project-document-form');
    }
}
