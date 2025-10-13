import React, { lazy, useMemo, useRef, useEffect } from "react";
import { router } from "@inertiajs/react";
const ReportFilters = lazy(() =>
  import("@component/project/report/ReportFilters")
);
const PointsChart = lazy(() => import("@component/project/report/PointsChart"));
const ProjectsChart = lazy(() =>
  import("@component/project/report/ProjectsChart")
);
const TasksChart = lazy(() => import("@component/project/report/TasksChart"));

export default function ProjectReportChart({
  reports = [],
  filters = {},
  availableYears = [],
  availableUsers = [],
  months = [],
}) {
  const handleFilterChange = (newFilters) => {
    router.get(route("project.report.chart"), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  const clearFilters = () => {
    router.get(route("project.report.chart"));
  };

  // Ensure arrays to prevent map errors
  const safeReports = Array.isArray(reports) ? reports : [];
  const safeAvailableYears = Array.isArray(availableYears)
    ? availableYears
    : [];
  const safeAvailableUsers = Array.isArray(availableUsers)
    ? availableUsers
    : [];
  const safeMonths = Array.isArray(months) ? months : [];

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Project Performance Dashboard</h2>
            <button
              className="btn btn-outline-secondary"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>

          <ReportFilters
            filters={filters}
            availableYears={safeAvailableYears}
            availableUsers={safeAvailableUsers}
            months={safeMonths}
            onFilterChange={handleFilterChange}
          />

          {safeReports.length === 0 ? (
            <div className="alert alert-info text-center">
              <h5>No Data Found</h5>
              <p className="mb-0">
                No reports match your current filters. Try adjusting your
                criteria.
              </p>
            </div>
          ) : (
            <>
              <PointsChart reports={safeReports} />
              <ProjectsChart reports={safeReports} />
              <TasksChart reports={safeReports} />

              {/* Summary Statistics */}
              <div className="row mt-4">
                <div className="col-md-4">
                  <div className="card text-center bg-primary text-white">
                    <div className="card-body">
                      <h3>
                        {safeReports
                          .reduce((sum, r) => sum + r.total_points, 0)
                          .toLocaleString()}
                      </h3>
                      <p className="mb-0">Total Points</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-center bg-success text-white">
                    <div className="card-body">
                      <h3>
                        {safeReports.reduce(
                          (sum, r) => sum + r.projects_count,
                          0
                        )}
                      </h3>
                      <p className="mb-0">Total Projects</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-center bg-info text-white">
                    <div className="card-body">
                      <h3>
                        {safeReports
                          .reduce((sum, r) => sum + r.tasks_completed, 0)
                          .toLocaleString()}
                      </h3>
                      <p className="mb-0">Total Tasks</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
