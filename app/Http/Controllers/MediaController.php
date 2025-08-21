<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Media;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{

    public function Index(Request $request, $id)
    {
       // All media for this user
        $media = Media::select('id', 'user_id', 'file_path', 'category')
            ->where('user_id', $id)
            ->get();

        // Latest single profile
        $profile = Media::select('user_id', 'file_path', 'category')
            ->where('user_id', $id)
            ->where('category', 'profile')
            ->latest()
            ->first();

        // Latest single id_card_front
        $idCardFront = Media::select('user_id', 'file_path', 'category')
            ->where('user_id', $id)
            ->where('category', 'id_card_front')
            ->latest()
            ->first();
            
        // Latest single id_card_back
        $idCardBack = Media::select('user_id', 'file_path', 'category')
            ->where('user_id', $id)
            ->where('category', 'id_card_back')
            ->latest()
            ->first();

        // Latest single resume
        $resume = Media::select('user_id', 'file_path', 'category')
            ->where('user_id', $id)
            ->where('category', 'resume')
            ->latest()
            ->first();

        return response()->json([
            'media' => $media,
            'profile' => $profile,
            'idCardFront' => $idCardFront,
            'idCardBack' => $idCardBack,
            'resume' => $resume,
        ]);
    }

    public function Upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpeg,png,pdf,jpg|max:20480',
            'user_id' => 'required|exists:users,id',
            'category' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $path = $file->store('uploads/media', 'public');

        Media::create([
            'user_id' => $request->user_id,
            'file_path' => $path,
            'category' => $request->category,
        ]);

        return redirect()->back()->with('message', 'File uploaded successfully.');
    }

    public function destroy($id)
    {
        $media = Media::findOrFail($id);
        $filePath = $this->cleanFilePath($media->file_path);
        if ($filePath && Storage::disk('public')->exists($filePath)) {
            Storage::disk('public')->delete($filePath);
        }
        $media->delete();
        return back()->with('message', 'File deleted successfully.');
    }

    protected function cleanFilePath($path) {
        $path = str_replace('D:\BID_BACKUP_RENEW\v5\storage\app\public\\', '', $path);
        $path = str_replace('\\', '/', $path);
        $path = preg_replace('/(uploads\/media)+/', 'uploads/media', $path);
        return $path;
    }
}
