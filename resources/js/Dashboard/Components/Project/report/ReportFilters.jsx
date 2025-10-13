// components/ReportFilters.jsx
import React from "react";

const ReportFilters = ({
  filters,
  availableYears,
  availableUsers,
  months,
  onFilterChange,
}) => {
  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const clearUsers = () => {
    handleFilterChange("users", []);
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h6 className="card-title mb-3">Filter Reports</h6>
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">Year</label>
            <select
              className="form-select"
              value={filters.year || ""}
              onChange={(e) =>
                handleFilterChange(
                  "year",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
            >
              <option value="">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Month</label>
            <select
              className="form-select"
              value={filters.month || ""}
              onChange={(e) =>
                handleFilterChange(
                  "month",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
            >
              <option value="">All Months</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label d-flex justify-content-between">
              <span>Team Members</span>
              {filters.users.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={clearUsers}
                >
                  Clear
                </button>
              )}
            </label>
            <select
              className="form-select"
              multiple
              value={filters.users.map(String)} // Convert to strings for select
              onChange={(e) => {
                const selectedUsers = Array.from(
                  e.target.selectedOptions,
                  (option) => parseInt(option.value)
                );
                handleFilterChange("users", selectedUsers);
              }}
              size="3"
            >
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <small className="text-muted">
              {filters.users.length} user(s) selected
            </small>
          </div>

          <div className="col-md-2 d-flex align-items-end">
            <button
              className="btn btn-outline-danger w-100"
              onClick={() =>
                onFilterChange({
                  year: null,
                  month: null,
                  users: [],
                })
              }
            >
              Reset All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
