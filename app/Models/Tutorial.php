<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tutorial extends Model
{
    protected $fillable = [
        'title',
        'description',
        'youtube_url',
        'thumbnail',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Extrae el ID del video de YouTube desde la URL.
     * Soporta formatos:
     *   https://www.youtube.com/watch?v=XXXXX
     *   https://youtu.be/XXXXX
     *   https://www.youtube.com/embed/XXXXX
     */
    public function getYoutubeIdAttribute(): ?string
    {
        $url = $this->youtube_url;

        if (preg_match('/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Miniatura automática de YouTube si no se subió una personalizada.
     */
    public function getThumbnailUrlAttribute(): string
    {
        if ($this->thumbnail) {
            return asset('storage/' . $this->thumbnail);
        }

        return $this->youtube_id
            ? "https://img.youtube.com/vi/{$this->youtube_id}/hqdefault.jpg"
            : '';
    }
}
