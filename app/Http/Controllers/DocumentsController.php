<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class DocumentsController extends Controller
{
    public function show(Project $project)
    {
        return view('admin.project-documents', ['project' => $project]);
    }

    /**
     * Ver/Descargar un documento del proyecto
     */
    public function view(Document $document)
    {
        // Simple verificación de pertenencia al proyecto
        $project = $document->project;

        // Verificar si el usuario es dueño del proyecto o miembro
        $isOwner = Auth::id() === $project->user_id;
        $isMember = $project->members()->where('user_id', Auth::id())->exists();

        if (!$isOwner && !$isMember) {
            abort(403, 'No tienes permiso para ver este documento.');
        }

        if ($document->isLink()) {
            return redirect($document->path);
        }

        if (!Storage::exists($document->path)) {
            abort(404, 'El archivo no existe en el servidor.');
        }

        return Storage::response($document->path, $document->name);
    }
}
