<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Comment;
use App\Models\incident;
use App\Models\Model3D;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    /**
     * Obtiene el proyecto al que pertenece un adjunto.
     */
    private function getAttachmentProject(Attachment $attachment): Project
    {
        $fileable = $attachment->fileable;

        abort_unless($fileable, 404);

        if ($fileable instanceof Model3D) {
            return Project::findOrFail($fileable->project_id);
        }

        if ($fileable instanceof Comment) {
            $projectId = incident::whereKey($fileable->incident_id)
                ->value('project_id');

            abort_unless($projectId, 404);

            return Project::findOrFail($projectId);
        }

        abort(404, 'No se pudo determinar el proyecto del archivo.');
    }

    /**
     * Comprueba que el usuario sea propietario o miembro activo.
     */
    private function authorizeProject(Project $project): void
    {
        abort_unless(Auth::check(), 401);

        $userId = Auth::id();

        $isOwner = (int) $project->user_id === (int) $userId;

        $isMember = !$isOwner && $project->members()
            ->where('users.id', $userId)
            ->exists();

        abort_unless($isOwner || $isMember, 403);
    }

    public function getThumbnail($id)
    {
        $attachment = Attachment::findOrFail($id);

        $project = $this->getAttachmentProject($attachment);

        $this->authorizeProject($project);

        $path = "projects/{$project->id}/thumbnails/{$attachment->id}.png";

        abort_unless(Storage::exists($path), 404);

        return response()->file(
            storage_path("app/private/{$path}"),
            [
                'Cache-Control' => 'private, no-cache',
                'X-BIMNova-User-Id' => (string) Auth::id(),
                'X-BIMNova-Project-Id' => (string) $project->id,
            ]
        );
    }

    public function getAttachment(Request $request, $id)
    {
        $attachment = Attachment::findOrFail($id);

        $project = $this->getAttachmentProject($attachment);

        $this->authorizeProject($project);

        $type = $request->query('type');

        if ($type !== null) {
            $type = strtolower($type);

            // Los visores BIMNova utilizan FRAG para los modelos IFC.
            abort_unless($type === 'frag', 400, 'Tipo de archivo no permitido.');

            // Un FRAG solo puede proceder de un modelo 3D.
            abort_unless($attachment->fileable instanceof Model3D, 404);

            $filename = pathinfo($attachment->file, PATHINFO_FILENAME);

            $path = "projects/{$project->id}/{$filename}.frag";
        } else {
            $path = "projects/{$project->id}/{$attachment->file}";
        }

        abort_unless(Storage::exists($path), 404);

        $headers = [
            'Cache-Control' => 'private, no-cache',
            'X-BIMNova-User-Id' => (string) Auth::id(),
            'X-BIMNova-Project-Id' => (string) $project->id,
        ];

        // Solo los FRAG de modelos 3D pueden guardarse offline.
        if ($type === 'frag') {
            $headers['X-BIMNova-Cacheable'] = '1';
        }

        return response()->file(
            storage_path("app/private/{$path}"),
            $headers
        );
    }
}
