<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'name',
        'path',
        'type',
        'size',
        'project_id',
        'user_id',
    ];

    /**
     * El proyecto al que pertenece el documento
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * El usuario que subió el documento
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Indica si es un enlace externo
     */
    public function isLink(): bool
    {
        return $this->type === 'link';
    }

    /**
     * Devuelve el icono Bootstrap/FontAwesome según el tipo
     */
    public function getIconClass(): string
    {
        return match (true) {
            str_contains($this->type, 'image') => 'fas fa-file-image text-primary',
            str_contains($this->type, 'pdf')   => 'fas fa-file-pdf text-danger',
            str_contains($this->type, 'word')  => 'fas fa-file-word text-primary',
            str_contains($this->type, 'excel') => 'fas fa-file-excel text-success',
            $this->type === 'link'             => 'fas fa-link text-info',
            default => 'fas fa-file-alt text-secondary',
        };
    }

    /**
     * Devuelve tamaño formateado (KB, MB, etc.)
     */
    public function getFormattedSizeAttribute(): string
    {
        if ($this->type === 'link') {
            return 'Enlace';
        }

        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $factor = floor((strlen((string)(int)$bytes) - 1) / 3);

        return sprintf("%.2f %s", $bytes / pow(1024, $factor), $units[$factor] ?? 'B');
    }

    /**
     * Obtener la URL para ver el documento (enlace o archivo interno)
     */
    public function getViewUrlAttribute(): string
    {
        if ($this->isLink()) {
            return $this->path;
        }

        return route('documents.view', $this->id);
    }
}
