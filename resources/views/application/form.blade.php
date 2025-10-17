<!doctype html>
<html lang="en">

<head>
    <title>:: Job :: Application Form</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge, chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <meta name="description" content="Form template v5">
    <meta name="author" content="Form Template, design by: Mudasir Abbas Turi">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</head>

<body>
    <div class="container-fluid mt-2 mb-2">
         <div class="row clearfix">
            <div class="col-12">
                @if (session('successMsg'))
                    <div class="alert alert-success">
                        {{ session('successMsg') }}
                    </div>
                @endif

                @if (session('errorMsg'))
                    <div class="alert alert-danger">
                        {{ session('errorMsg') }}
                    </div>
                @endif
            </div>
        </div>
        <div class="row clearfix">
            <div class="col-lg-12 col-md-12 col-sm-12">
                <div class="card p-3">
                    <form method="POST" action="{{ route('submit.application.form') }}" enctype="multipart/form-data" class="p-3 border rounded shadow-sm bg-light">
                        @csrf
                        <fieldset>
                            <legend class="mb-3 fw-semibold">Job Application</legend>

                            <div class="mb-3">
                                <label for="name" class="form-label">Your Name: *</label>
                                <input type="text" class="form-control" placeholder="Full Name *" name="name" id="name" required>
                            </div>

                            <div class="mb-3">
                                <label for="email" class="form-label">Your Email Address *</label>
                                <input type="email" class="form-control" placeholder="Email Address *" name="email" id="email" required>
                            </div>

                            <div class="mb-3">
                                <label for="phone" class="form-label">Your Phone Number *</label>
                                <input type="tel" class="form-control" placeholder="Phone Number *" name="phone" id="phone" required>
                            </div>

                            <div class="mb-3">
                                <label for="file_path" class="form-label">Upload Your Resume: *</label>
                                <input class="form-control" type="file" id="file_path" name="file_path" accept=".png,.jpeg,.jpg,.pdf,.doc,.docx" required>
                                <div class="form-text">Accepted formats: PDF, DOC, DOCX. Max size 5MB.</div>
                            </div>

                            <div class="mb-3">
                                <label for="cover_letter" class="form-label">Cover Letter (Optional)</label>
                                <textarea class="form-control" rows="4" placeholder="Write a short message..." name="cover_letter" id="cover_letter"></textarea>
                            </div>

                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <i class="bi bi-send me-2"></i> Apply Now
                                </button>
                            </div>
                        </fieldset>
                    </form>
                </div>
            </div>
        </div>
    </div>


</body>

</html>
