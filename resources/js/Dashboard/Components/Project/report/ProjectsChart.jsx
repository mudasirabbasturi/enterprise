// components/ProjectsChart.jsx
import React from "react";

const ProjectsChart = ({ reports }) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="card mb-4">
        <div className="card-body text-center py-5">
          <p className="text-muted">No data available for projects chart</p>
        </div>
      </div>
    );
  }

  const users = [...new Set(reports.map((r) => r.username))];
  const months = [...new Set(reports.map((r) => r.month_name))].sort((a, b) => {
    const monthOrder = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthOrder.indexOf(a) - monthOrder.indexOf(b);
  });

  const getProjects = (username, month) => {
    const report = reports.find(
      (r) => r.username === username && r.month_name === month
    );
    return report ? report.projects_count : 0;
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title mb-4">Projects Completed</h5>
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead className="table-success">
              <tr>
                <th>User</th>
                {months.map((month) => (
                  <th key={month} className="text-center">
                    {month}
                  </th>
                ))}
                <th className="text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {users.map((username) => (
                <tr key={username}>
                  <td className="fw-bold">{username}</td>
                  {months.map((month) => (
                    <td key={month} className="text-center">
                      <span
                        className={`badge ${
                          getProjects(username, month) > 0
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {getProjects(username, month)}
                      </span>
                    </td>
                  ))}
                  <td className="text-center">
                    <span className="badge bg-primary">
                      {reports
                        .filter((r) => r.username === username)
                        .reduce((sum, r) => sum + r.projects_count, 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectsChart;
