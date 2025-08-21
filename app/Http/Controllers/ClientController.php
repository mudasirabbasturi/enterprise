<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClientController extends Controller
{
    // public function __construct()
    // {
    //     $this->authorizeResource(Client::class, 'client');
    //  }
    // @can('branch.view_branches')
    //     <a href="/branches">View Branches</a>
    // @endcan

    // @can('client.create_client')
    //     <a href="/clients/create">Add New Client</a>
    // @endcan

    public function Index()
    {
        $clients = Client::orderBy('created_at', 'desc')->cursor();
        return Inertia('Pages/Client/Index',[
            'clients' => $clients,
            // 'permissions' => Auth::user()->getPermissionsFor('Client'),
        ]);
    }

    public function Store(StoreClientRequest $request)
    {
        $validated = $request->validated();
        Client::create($validated);
        return redirect()->back()->with('message', 'Client created successfully.');
    }

    public function Update(UpdateClientRequest $request, $id)
    {
        $client = Client::findOrFail($id);
    
        // if (!Gate::allows('update', $client)) {
        //     abort(403, 'Unauthorized to update this client.');
        // }

        $validated = $request->validated();
        $client->update($validated);
        return redirect()->back()->with('message', 'Client updated successfully.');
    }

    public function Destroy($id)
    {
        $client = Client::findOrFail($id);
        
        // if (!Gate::allows('delete', $client)) {
        //     abort(403, 'Unauthorized to delete this client.');
        // }

        $client->delete();
        return back()->with('message', 'Client deleted successfully!');
    }
}
