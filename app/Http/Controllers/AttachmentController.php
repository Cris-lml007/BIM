<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function getThumbnail($id){
        $attachment = Attachment::findOrFail($id);
        $path = "projects/{$attachment->fileable->project_id}/thumbnails/{$attachment->id}.png";
        if (!Storage::exists($path)) {
            abort(404);
        }

        return response()->file(storage_path("app/private/".$path));
    }

    public function getAttachment($id){
        $attachment = Attachment::findOrFail($id);
        $path = "projects/{$attachment->fileable->project_id}/{$attachment->file}";
        if (!Storage::exists($path)) {
            abort(404);
        }

        return response()->file(storage_path("app/private/".$path));
    }
}
