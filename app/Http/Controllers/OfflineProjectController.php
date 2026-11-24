<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class OfflineProjectController extends Controller
{
    /**
     * Obtener todos los recursos necesarios para descargar
     * un proyecto y consultarlo sin conexión.
     */
    public function show(Project $project): JsonResponse
    {
        // Respetar los permisos normales de BIMNova.
        Gate::authorize('view', $project);

        $project->load([
            'models.model',
            'models.anchors',
            'models.incidents.comments.user',
            'models.incidents.comments.attachments',
        ]);

        $models = $project->models->map(function ($model) {

            $frag = $model->model;

            return [
                'id' => $model->id,
                'name' => $model->name,
                'description' => $model->description,

                // Datos del archivo FRAG.
                'frag' => $frag ? [
                    'attachment_id' => $frag->id,
                    'url' => url(
                        "/dashboard/attachment/{$frag->id}?type=frag"
                    ),
                    'type' => 'frag',
                    'source_type' => $frag->type
                ] : null,

                // Anclajes existentes del modelo.
                'anchors' => $model->anchors->map(function ($anchor) {
                    return [
                        'id' => $anchor->id,
                        'hash' => $anchor->hash,
                        'user_id' => $anchor->user_id,
                        'title' => $anchor->title,

                        'position' => [
                            'x' => $anchor->x,
                            'y' => $anchor->y,
                            'z' => $anchor->z,
                        ],

                        'normal' => [
                            'x' => $anchor->normal_x,
                            'y' => $anchor->normal_y,
                            'z' => $anchor->normal_z,
                        ],
                    ];
                })->values(),

                // Incidencias existentes del modelo.
                'incidents' => $model->incidents->map(function ($incident) {

                    return [
                        'id' => $incident->id,
                        'title' => $incident->title,
                        'description' => $incident->description,
                        'priority' => $incident->priority,
                        'status' => $incident->status,
                        'user_id' => $incident->user_id,
                        'model_id' => $incident->model,

                        'position' => [
                            'x' => $incident->x,
                            'y' => $incident->y,
                            'z' => $incident->z,
                        ],

                        'normal' => [
                            'x' => $incident->normal_x,
                            'y' => $incident->normal_y,
                            'z' => $incident->normal_z,
                        ],

                        // Comentarios de la incidencia.
                        'comments' => $incident->comments->map(function ($comment) {

                            return [
                                'id' => $comment->id,
                                'user_id' => $comment->user_id,
                                'user' => $comment->user?->name,
                                'comment' => $comment->comment,
                                'created_at' => $comment->created_at,

                                // Metadatos de archivos adjuntos.
                                'attachments' => $comment->attachments->map(
                                    function ($attachment) {
                                        return [
                                            'id' => $attachment->id,
                                            'name' => $attachment->name,
                                            'type' => $attachment->type,
                                        ];
                                    }
                                )->values(),
                            ];
                        })->values(),
                    ];
                })->values(),
            ];
        })->values();

        return response()->json([
            'success' => true,

            'project' => [
                'id' => $project->id,
                'name' => $project->name,
            ],

            'models' => $models,

            'summary' => [
                'models' => $models->count(),

                'frags' => $models->filter(
                    fn ($model) => $model['frag'] !== null
                )->count(),

                'anchors' => $models->sum(
                    fn ($model) => count($model['anchors'])
                ),

                'incidents' => $models->sum(
                    fn ($model) => count($model['incidents'])
                ),

                'comments' => $models->sum(
                    fn ($model) => collect($model['incidents'])
                        ->sum(fn ($incident) => count($incident['comments']))
                ),
            ],
        ]);
    }
}
