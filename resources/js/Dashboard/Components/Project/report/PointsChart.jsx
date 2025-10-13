// components/PointsChart.jsx
import React from "react";

const PointsChart = ({ reports }) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="card mb-4">
        <div className="card-body text-center py-5">
          <p className="text-muted">No data available for points chart</p>
        </div>
      </div>
    );
  }

  // Simple table view instead of Chart.js to avoid complexity
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

  const getPoints = (username, month) => {
    const report = reports.find(
      (r) => r.username === username && r.month_name === month
    );
    return report ? report.total_points : 0;
  };

  const getUserTotal = (username) => {
    return reports
      .filter((r) => r.username === username)
      .reduce((sum, r) => sum + r.total_points, 0);
  };

  const getMonthTotal = (month) => {
    return reports
      .filter((r) => r.month_name === month)
      .reduce((sum, r) => sum + r.total_points, 0);
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title mb-4">Points Overview</h5>
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                <th>User</th>
                {months.map((month) => (
                  <th key={month} className="text-center">
                    {month}
                  </th>
                ))}
                <th className="text-center fw-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {users.map((username) => (
                <tr key={username}>
                  <td className="fw-bold">{username}</td>
                  {months.map((month) => (
                    <td key={month} className="text-center">
                      {getPoints(username, month).toLocaleString()}
                    </td>
                  ))}
                  <td className="text-center fw-bold table-primary">
                    {getUserTotal(username).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="table-info">
                <td className="fw-bold">Monthly Total</td>
                {months.map((month) => (
                  <td key={month} className="text-center fw-bold">
                    {getMonthTotal(month).toLocaleString()}
                  </td>
                ))}
                <td className="text-center fw-bold">
                  {reports
                    .reduce((sum, r) => sum + r.total_points, 0)
                    .toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PointsChart;
