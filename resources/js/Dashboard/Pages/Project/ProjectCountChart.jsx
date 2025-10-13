import React, { useMemo, useRef, useEffect } from "react";
import { useRoute, Link, Breadcrumb, usePage } from "@shared/ui";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

const ProjectCountChart = ({ ProjectCountChart }) => {
  const route = useRoute();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  useEffect(() => {
    if (!ProjectCountChart || ProjectCountChart.length === 0) return;

    const ctx = chartRef.current.getContext("2d");

    // Destroy old chart before re-rendering (avoid duplicate canvas issues)
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare data
    const labels = ProjectCountChart.map((item) => {
      const date = new Date(item.year, item.month - 1);
      return `${date.toLocaleString("default", { month: "short" })} ${
        item.year
      }`;
    });

    const data = ProjectCountChart.map((item) => item.count);

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Projects per Month",
            data,
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Number of Projects by Month" },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });
  }, [ProjectCountChart]);
  return (
    <>
      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
          <Breadcrumb
            className="breadCrumb"
            items={[
              { title: <Link href="/">Home</Link> },
              {
                title: (
                  <Link href={route("project.status", { status: "Pending" })}>
                    Project
                  </Link>
                ),
              },

              { title: "Project Chart" },
            ]}
          />
        </div>

        <div className="chart">
          {" "}
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </>
  );
};

export default ProjectCountChart;
