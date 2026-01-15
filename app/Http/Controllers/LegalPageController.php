<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class LegalPageController extends Controller
{
    private string $wpBase = 'https://bidwinners.net/wp-json/wp/v2/pages';

    // MUST be the WordPress USERNAME, not app name
    private string $wpUser = 'rehantariq3210z';

    // Application password WITHOUT spaces
    private string $wpPass = '55Y0oIV7A7f4kZ4FzyGzJkC1';

    private function fetchPage(string $slug): ?string
    {
        $response = Http::withBasicAuth($this->wpUser, $this->wpPass)
            ->get($this->wpBase, [
                'slug' => $slug,
                'status' => 'private',
                'per_page' => 1,
            ]);

        if (! $response->successful()) {
            return null;
        }

        $data = $response->json();

        if (empty($data)) {
            return null;
        }

        return $data[0]['content']['rendered'] ?? null;
    }

    public function privacy()
    {
        return Inertia::render('Pages/Legal/PrivacyPolicy', [
            'content' => $this->fetchPage('privacy-policy-bidwinners-private'),
        ]);
    }

    public function terms()
    {
        return Inertia::render('Pages/Legal/TermsConditions', [
            'content' => $this->fetchPage('terms-and-condition-bidwinners-private'),
        ]);
    }
}
