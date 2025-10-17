<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\Candidate;
use App\Models\Media;
use Illuminate\Support\Facades\Validator;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;

class CandidateController extends Controller
{

    // public function Index()
    // {
    //     $candidates = Candidate::with('media')->latest()->get();
    //     return Inertia('Pages/Candidate/Index', [
    //         'candidates' => $candidates
    //     ]);
    // }

    public function Index()
    {
        $candidates = Candidate::with(['media' => function ($query) {
            $query->whereIn('category', ['cv', 'job_letter'])
                ->orderByDesc('created_at');
        }])
        ->latest()
        ->get();

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

    // public function Destroy($id)
    // {
    //     $candidate = Candidate::findOrFail($id);
    //     $candidate->delete();
    //     return back()->with('message', 'Candidate deleted successfully!');
    // }
    public function Destroy($id)
    {
        try {
            $candidate = Candidate::findOrFail($id);
            $mediaFiles = Media::where('model_type', 'App\Models\Candidate')
                ->where('model_id', $candidate->id)
                ->get();
            foreach ($mediaFiles as $media) {
                $filePath = public_path($media->file_path);
                if (file_exists($filePath)) {
                    @unlink($filePath);
                }
                $media->delete();
            }
            $candidate->delete();
            return back()->with('message', 'Candidate and associated files deleted successfully!');
        } catch (\Exception $e) {
            return back()->with('message', 'Failed to delete candidate: ' . $e->getMessage());
        }
    }

    // public function GenerateJobLetter(Request $request, $id)
    // {
    //     try {
    //         $imageData = $request->input('image');
    //         if (!$imageData) {
    //             return response()->json(['error' => 'Image data missing'], 400);
    //         }
    //         $image = str_replace('data:image/png;base64,', '', $imageData);
    //         $image = str_replace(' ', '+', $image);
    //         $imageName = 'job_letter_' . time() . '.png';
    //         $path = 'uploads/media/' . $imageName;
    //         Storage::disk('public')->put($path, base64_decode($image));

    //         $file = $request->file('file');
    //         $filename = time() . '_' . $file->getClientOriginalName();
    //         $file->move(public_path('uploads/media'), $filename);

    //         Media::create([
    //             'file_path'  => $path,
    //             'category'   => 'job_letter',
    //             'model_type' => 'App\Models\Candidate',
    //             'model_id'   => $id,
    //         ]);
    //         return back()->with('message', 'Job Letter Generated Successfully');

    //     } catch (\Exception $e) {
    //         return response()->json(['error' => $e->getMessage()], 500);
    //     }
    // }

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
            $uploadPath = public_path('uploads/media');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0777, true);
            }
            file_put_contents($uploadPath . '/' . $imageName, base64_decode($image));
            Media::create([
                'file_path'  => 'uploads/media/' . $imageName,
                'category'   => 'job_letter',
                'model_type' => 'App\Models\Candidate',
                'model_id'   => $id,
            ]);
            return back()->with('message', 'Job Letter Generated Successfully');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function applicationForm() {
        return view('application.form');
    }

    public function submitApplicationForm(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|max:255',
            'phone'        => 'required|string|max:50',
            'file_path'    => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240', // 10MB
            'cover_letter' => 'nullable|string|max:5000',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        $existing = Candidate::where('email', $request->email)->first();
        if ($existing) {
            return back()->with('errorMsg', 'An application with this email already exists.');
        }
        try {
            $candidate = Candidate::create([
                'name'         => $request->name,
                'email'        => $request->email,
                'phone'        => $request->phone,
                'cover_letter' => $request->cover_letter,
            ]);
            $file = $request->file('file_path');
            $fileName = 'resume_' . time() . '.' . $file->getClientOriginalExtension();
            $uploadPath = public_path('uploads/media/cv');

            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0777, true);
            }
            $file->move($uploadPath, $fileName);
            Media::create([
                'file_path'  => 'uploads/media/cv/' . $fileName,
                'category'   => 'cv',
                'model_type' => 'App\Models\Candidate',
                'model_id'   => $candidate->id,
            ]);
            return back()->with('successMsg', 'Your application has been received successfully. Our recruitment team will carefully review your submission and contact you if your profile matches our requirements.');
        } catch (\Exception $e) {
            return back()->with('errorMsg', 'Something went wrong: ' . $e->getMessage());
        }
    }

}
