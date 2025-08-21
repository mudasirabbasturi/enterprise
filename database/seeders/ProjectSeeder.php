<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\Client;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $titles = [
            '5 Marla Residential House',
            '10 Marla Commercial Plaza',
            'Basement Renovation Project',
            'Grey Structure Construction',
            'Paint and Finishing Work',
            'Interior Designing Job',
            'Office Space Buildout',
            'Retail Store Fit-out',
            'Road Resurfacing Project',
            'Luxury Apartment Build',
            'NEW CALEDONIA FIRE AND EMS STATION',
            'Children\'s Orchard Academy',
            'LIMITED EXTERIOR REPAIR',
            'FOGO DE CHAO',
            '61 Mason Street Addition',
            'STORE 019 - SPOTSYLVANIA TOWNE CENTRE SPACE 24',
            'SECOND FLOOR APARTMENT 2E',
            'Jester Homes Revitalization',
            'LUBBOCK COUNTY, DETENTION CENTER DIALYSIS SUITE',
            'McDonald\'s USA, LLC',
            'McDonald\'s USA, LLC',
            'KIELY RESIDENCE',
            'WEST 69TH STREET TRANSFER BRIDGE PHASE II',
            'Policz Residence',
            'CRANEY Residence',
            'NEW CONSTRUCTION',
            '3218 N CLARK STREET',
            'The Adams Residence',
            'THE BEEM RESIDENCE',
            'Express Honws Houston South',
            'CUSTOM SPEC DUBLIN AVE SPEC',
            'SHIFT AUTOMOTIVE',
            'FAMOUS STORE #3672',
            'Gateway Mixed Use Project',
            'Planet Fitness',
            'GREEN CHIMNEYS CHILDREN SERVICES',
            'RENOVATE LATRINES SURT, 0-8402',
            'PROPOSED REMODELIN6 FOR HEATHER AND PETER CHESTER',
            'QNTM',
            'THE ELLA AT NORTHPOINTE'
        ];

        $main_scopes = [
            'Complete grey structure with roof slab.',
            'Interior and paint finishing for all floors.',
            'Includes plumbing, electric, and woodwork.',
            'Only exterior cladding and façade design.',
            'Top floor expansion with elevator shaft.',
            'Drywall & Paint - NOTE: 4x12 sheets FOR DRYWALL',
            'quantity take-off and cost estimate that matches t...',
            'I need to estimate the labor (not materials) for t...',
            'Cost estimation and material takeoff',
            'Electrical - Use BlueBeam',
            'cost estimate and complete material takeoff,',
            'Lumber takeoff/list materials',
            'Take-off for the following: Demolition, Framing, S...',
            'takeoff  stucco and painting (interior and Exterio...',
            'Complete matrial takeoff/ estimation',
            'concrete and the paving. all details and for rebar...',
            'Footing, pad footing,ICF foundations, ICF main flo...',
            'Attached, please find a copy of the structural and...',
            'drywall, tape, bed, texture, trim, paint.',
            'Please review the file in the Link for scope',
            'Drywall & Paint - NOTE: 4x12 sheets FOR DRYWALL',
            'Review the Bid Docs folder for Scope',
            'Review the Scope file in the Link',
            'All Retaining wall reparation work',
            'Framing  Drywall  Paint  Finish carpentry  Divisio...',
            'Paint Only - Please add acoustical ceiling as well...',
            'Roof take off and estimate for all roof surfaces o...',
            'Review the Bid Docs folder for Scope',
            'Drywall & Paint - 4x12 sheets size',
            'Drywall & Paint - 4 x12 Sheet',
            'Complete material takeoff/Estimation',
            'estimate for Gypsum Board Shaft Wall Assemblies HA...',
            'DryWall & Paint - Use 4 x 12 Sheet',
            'DryWall & Paint - Use 4 x 12 sheet',
            'Complete material takeoff/ estimation',
            'Bid drywall, texture, paint, trim, ACT, insulation...',
            '- Drywall, Framing, Insulation',
            '- Flooring, floor ...',
            'Exterior Glass & Glazing (Exterior Windows & Doors...',
            'review the scope file on Bidlist folder',
        ];

        $scope_details = [
            'Drywall Painting',
            'Complete material takeoff/ estimation',
            'Drywall, Openings, Siding, Insulation',
            'Concrete &amp; Masonary',
            'GC Drywall & Paint',
            'GC Including Site Work',
            'Drywall & Paint - NOTE: 4x12 sheets FOR DRYWALL',
            'Drywall & Paint - 4x12 sheets size',
            'Siding (Board &amp; Batten + Shingles)',
            'As Provided up to 9th Division.',
            'GC Including Civil Site Works',
            'GC Renovation',
            'Masonry GC Renovation',
            'Masonry Material List',
            'As very little details were provided in drawings.',
            'So, we assumed necessary information and prepared a detailed estimate as much possible.',
            'Notes for assumed items are written with respective description.',
            'Please review the file in the Link for scope',
            'Review the Bid Docs folder for Scope',
            'Drywall Painting',
            'Complete material takeoff/ estimation',
            'Drywall, Openings, Siding, Insulation',
            'Concrete &amp; Masonary',
            'GC Drywall & Paint',
            'GC Including Site Work',
            'Drywall & Paint - NOTE: 4x12 sheets FOR DRYWALL',
            'Drywall & Paint - 4x12 sheets size',
            'Siding (Board &amp; Batten + Shingles)',
            'As Provided up to 9th Division.',
            'GC Including Civil Site Works',
            'GC Renovation',
            'Masonry GC Renovation',
            'Masonry Material List',
            'Review the Scope file in the Link',
            'All Retaining wall reparation work',
            'Framing  Drywall  Paint  Finish carpentry  Divisio...',
            'Paint Only - Please add acoustical ceiling as well...',
            'Roof take off and estimate for all roof surfaces o...',
            'Review the Bid Docs folder for Scope',
            'Drywall & Paint - 4x12 sheets size',

        ];

        $statusList = [
            'Planned', 'Pending', 'Takeoff On Progress', 'Pricing On Progress',
            'Completed', 'Hold', 'Revision', 'Cancelled', 'Deliver'
        ];

        $clients = Client::pluck('id')->all();
        $total = min(count($titles), count($main_scopes), count($scope_details));
        for ($i = 0; $i < $total; $i++) {
            $constructionType = Arr::random(['commercial', 'residential']);
            $title = Arr::random($titles);
            $clientId = Arr::random($clients);
            $budget = rand(100000, 2000000);
            $tax = $budget * 0.08;
            $discount = rand(0, 50000);
            $deduction = rand(0, 30000);
            $finalPrice = $budget + $tax - $discount - $deduction;
            $paid = $finalPrice * (rand(40, 90) / 100);
            $due = $finalPrice - $paid;
            $received = $paid;

            $startDate = Carbon::now()->subDays(rand(30, 90));
            $dueDate = (clone $startDate)->addDays(rand(20, 60));
            $actualStart = (clone $startDate)->addDays(rand(0, 5));
            $actualEnd = (clone $dueDate)->addDays(rand(-5, 10));

            Project::create([
                'project_title' =>  $titles[$i],
                'project_address' => 'Plot #'.rand(1, 99).' - Phase '.rand(1, 10).', City Name',
                'client_id' => $clientId,
                'project_pricing' => 'PKR '.number_format($finalPrice),
                'project_area' => rand(1000, 10000).' sqft',
                'project_construction_type' => $constructionType,
                'project_line_items_pricing' => 'Included in detail sheet',
                'project_floor_number' => rand(1, 5),
                'project_main_scope' => $main_scopes[$i],
                'project_scope_details' => $scope_details[$i],
                'project_template' => 'template_'.rand(1, 5).'.pdf',
                'project_init_link' => 'https://init.project.local/'.$i,
                'project_final_link' => 'https://final.project.local/'.$i,
                'project_notes_owner_or_supervisor' => 'Requested priority material approval.',
                'project_notes_estimator' => 'BOQ updated after site visit.',
                'general_notes' => 'Project should be documented clearly.',
                'notes_private' => 'Client prefers regular status updates.',
                'budget_total' => $budget,
                'tax_amount' => $tax,
                'discount_amount' => $discount,
                'deduction_amount' => $deduction,
                'price_final' => $finalPrice,
                'amount_paid' => $paid,
                'amount_due' => $due,
                'amount_received' => $received,
                'project_start_date' => $startDate->toDateString(),
                'project_due_date' => $dueDate->toDateString(),
                'project_duration' => $startDate->diffInDays($dueDate).' days',
                'actual_start_date' => $actualStart->toDateString(),
                'actual_end_date' => $actualEnd->toDateString(),
                'actual_duration' => $actualStart->diffInDays($actualEnd).' days',
                'project_points' => rand(1, 100),
                'project_status' => Arr::random($statusList),
                'preview_status' => Arr::random(['active', 'draft']),
            ]);
        }
    }
}