import React, { useMemo } from "react";
import {
  AgGridReact,
  gridTheme,
  defaultColDef,
  sideBarConfig,
  gridOptionsConfig,
} from "@agConfig/AgGridConfig";
import { useRoute, Link, Breadcrumb, usePage } from "@shared/ui";
const Report = ({ reports }) => {
  const route = useRoute();
  const rowData = reports || [];

  const colDefs = useMemo(
    () => [
      {
        headerName: "User Name",
        field: "username",
        sortable: true,
        filter: true,
      },
      { headerName: "Year", field: "year", sortable: true, filter: true },
      { headerName: "Month", field: "month", sortable: true, filter: true },
      {
        headerName: "Total Projects",
        field: "projects_count",
        sortable: true,
        filter: true,
      },
      {
        headerName: "Total Tasks",
        field: "tasks_count",
        sortable: true,
        filter: true,
      },
      {
        headerName: "Total Points",
        field: "total_points",
        sortable: true,
        filter: true,
      },
      {
        headerName: "Points Gain",
        field: "points_gain",
        sortable: true,
        filter: true,
      },
    ],
    []
  );

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

              { title: "Project Report" },
            ]}
          />
        </div>

        <div className="ag-grid-wrapper">
          <AgGridReact
            rowData={rowData}
            columnDefs={colDefs}
            defaultColDef={{
              ...defaultColDef,
              flex: undefined,
              resizable: true,
              filter: true,
              floatingFilter: true,
            }}
            theme={gridTheme}
            pagination={true}
            paginationAutoPageSize={true}
            sideBar={sideBarConfig}
            onGridReady={gridOptionsConfig.onGridReady}
            onColumnMoved={gridOptionsConfig.onColumnMoved}
            onColumnPinned={gridOptionsConfig.onColumnPinned}
            onColumnVisible={gridOptionsConfig.onColumnVisible}
            onColumnResized={gridOptionsConfig.onColumnResized}
            onSortChanged={gridOptionsConfig.onSortChanged}
          />
        </div>
      </div>
    </>
  );
};

export default Report;
