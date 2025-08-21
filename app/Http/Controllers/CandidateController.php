<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\Candidate;
use App\Models\Media;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;

class CandidateController extends Controller
{

    public function Index()
    {
        $candidates = Candidate::with('media')->latest()->get();
        return Inertia('Pages/Candidate/Index', [
            'candidates' => $candidates
        ]);
    }

    public function Stats(Request $request, $id) {
        $validate = $request->validate([
            "status" => "required|in:pending,under_review,on_hold,active,accepted,declined,draft,future_consideration",
            "job_letter" => "required|in:draft,sent,accepted,declined,pending",
        ]);
        $record = Candidate::findOrFail($id);
        $record->update($validate);
        return back()->with('message', 'Stats updated successfully!');
    }

    public function Destroy($id)
    {
        $candidate = Candidate::findOrFail($id);
        $candidate->delete();
        return back()->with('message', 'Candidate deleted successfully!');
    }

    public function GenerateJobLetter(Request $request, $id)
    {
        try {
            $imageData = $request->input('image');
            if (!$imageData) {
                return response()->json(['error' => 'Image data missing'], 400);
            }
            $image = str_replace('data:image/png;base64,', '', $imageData);
            $image = str_replace(' ', '+', $image);
            $imageName = 'job_letter_' . time() . '.png';
            $path = 'uploads/media/' . $imageName;
            Storage::disk('public')->put($path, base64_decode($image));
            Media::create([
                'file_path'  => $path,
                'category'   => 'job_letter',
                'model_type' => 'App\Models\Candidate',
                'model_id'   => $id,
            ]);
            return back()->with('message', 'Job Letter Generated Successfully');

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
            
}
