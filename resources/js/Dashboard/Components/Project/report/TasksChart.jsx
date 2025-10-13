// components/TasksChart.jsx
import React from "react";

const TasksChart = ({ reports }) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="card mb-4">
        <div className="card-body text-center py-5">
          <p className="text-muted">No data available for tasks chart</p>
        </div>
      </div>
    );
  }

  const userTasks = {};

  reports.forEach((report) => {
    userTasks[report.username] =
      (userTasks[report.username] || 0) + report.tasks_completed;
  });

  const sortedUsers = Object.entries(userTasks)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8); // Top 8 users

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-4">Tasks Completed by User</h5>
        <div className="row">
          {sortedUsers.map(([username, tasks], index) => {
            const percentage =
              (tasks / Object.values(userTasks).reduce((a, b) => a + b, 0)) *
              100;
            const colors = [
              "primary",
              "success",
              "info",
              "warning",
              "danger",
              "dark",
              "secondary",
              "primary",
            ];

            return (
              <div key={username} className="col-md-6 col-lg-3 mb-3">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <h6 className="card-title">{username}</h6>
                    <div className="progress mb-2" style={{ height: "20px" }}>
                      <div
                        className={`progress-bar bg-${
                          colors[index % colors.length]
                        }`}
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                    <p className="card-text">
                      <strong>{tasks.toLocaleString()}</strong> tasks
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TasksChart;
