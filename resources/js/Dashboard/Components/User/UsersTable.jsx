import { useState, useEffect, useRef, lazy, Suspense, use } from "react";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import {
  router, // InertiaJS
  useRoute, // ziggy routing
  Tooltip,
  Popconfirm,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
} from "@shared/ui";

const UsersTable = ({ users, showDrawer }) => {
  const route = useRoute();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([
    {
      headerName: "User Status",
      headerTooltip: "Employee Status",
      field: "status",
      pinned: "left",
      width: 120,
      editable: false,
      cellRenderer: (params) => {
        const status = params.data.status;
        const statusClasses = {
          active: "active-status-progress",
          inactive: "active-status-revision",
          suspended: "active-status-hold",
          terminated: "active-status-cancelled",
          retired: "active-status-completed",
          default: "default",
        };
        const statusClass = statusClasses[status] || statusClasses.default;

        return (
          <span
            className={`${statusClass}`}
            style={{ padding: "3px", borderRadius: "3px" }}
          >
            {status}
          </span>
        );
      },
    },
    {
      headerName: "User Name",
      headerTooltip: "Employee Name",
      field: "name",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.name ? params.data.name : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Password",
      headerTooltip: "Edit Password",
      field: "password",
      editable: false,
      filter: false,
      cellRenderer: () => {
        return "➰➰➰➰➰";
      },
    },
    {
      headerName: "Assign Role",
      headerTooltip: "User's Role",
      field: "role_id",
      editable: false,
      cellRenderer: (params) => {
        return params.data.role?.name ? params.data.role.name : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Email",
      headerTooltip: "Employee Email",
      field: "email",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.email ? params.data.email : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Phone",
      headerTooltip: "Employee Mobile Phone",
      field: "phone",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.phone ? params.data.phone : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Branch",
      headerTooltip: "Employee Branch Name",
      field: "branch_id",
      editable: false,
      cellRenderer: (params) => {
        return params.data.branch?.name ? params.data.branch.name : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Department",
      headerTooltip: "Employee Department Name",
      field: "department_id",
      editable: false,
      cellRenderer: (params) => {
        return params.data.department?.name
          ? params.data.department.name
          : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Designation",
      headerTooltip: "Employee Designation",
      field: "designation_id",
      editable: false,
      cellRenderer: (params) => {
        return params.data.designation?.name
          ? params.data.designation.name
          : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Country",
      headerTooltip: "Employee Country",
      field: "country",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.country ? params.data.country : "⭕❌❌🚫";
      },
    },
    {
      headerName: "State",
      headerTooltip: "Employee State",
      field: "state",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.state ? params.data.state : "⭕❌❌🚫";
      },
    },
    {
      headerName: "City",
      headerTooltip: "Employee City",
      field: "city",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.city ? params.data.city : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Postal/Zip Code",
      headerTooltip: "Employee Postal Or Zip Code",
      field: "postal_or_zip_code",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.postal_or_zip_code
          ? params.data.postal_or_zip_code
          : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Current Address",
      headerTooltip: "Employee Current Address",
      field: "current_address",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.current_address
          ? params.data.current_address
          : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Permanent Address",
      headerTooltip: "Employee Permanent Address",
      field: "permanent_address",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.permanent_address
          ? params.data.permanent_address
          : "⭕❌❌🚫";
      },
    },
    {
      headerName: "DOB",
      headerTooltip: "Employee Date Of Birth",
      field: "dob",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.dob ? params.data.dob : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Joining Date",
      headerTooltip: "Employee Joining Date",
      field: "joining_date",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.joining_date
          ? params.data.joining_date
          : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Hiring Date",
      headerTooltip: "Employee Hiring Date",
      field: "hiring_date",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.hiring_date ? params.data.hiring_date : "⭕❌❌🚫";
      },
    },
    {
      headerName: "Leaving Date",
      headerTooltip: "Employee Leaving Date",
      field: "leaving_date",
      editable: false,
      cellRenderer: (params) => {
        return params.data?.leaving_date
          ? params.data.leaving_date
          : "⭕❌❌🚫";
      },
    },
    {
      field: "notes",
      editable: true,
      cellEditorPopup: true,
      cellRenderer: (params) => {
        const div = document.createElement("div");
        div.innerHTML = params.value || "<i>No Notes</i>";
        const text = div.textContent || div.innerText || "";
        return text.length > 100 ? text.substring(0, 100) + "..." : text;
      },
    },
    {
      field: "notes_private",
      editable: true,
      cellEditorPopup: true,
      cellRenderer: (params) => {
        const div = document.createElement("div");
        div.innerHTML = params.value || "<i>No Notes</i>";
        const text = div.textContent || div.innerText || "";
        return text.length > 100 ? text.substring(0, 100) + "..." : text;
      },
    },
    {
      headerName: "File | View | Edit | Delete",
      field: "actions",
      filter: false,
      editable: false,
      sortable: false,
      pinned: "right",
      cellRenderer: (params) => (
        <>
          <div className="">
            <Tooltip
              title={`View, Add, Edit, Del File.`}
              color="green"
              placement="leftTop"
            >
              <button
                className="btn btn-primary btn-sm me-1"
                onClick={() => showDrawer("media", params.data)}
              >
                <FolderOpenOutlined />
              </button>
            </Tooltip>
            <Tooltip
              title={`View User With Full Record`}
              color="green"
              placement="leftTop"
            >
              <button
                className="btn btn-success btn-sm me-1"
                onClick={() => showDrawer("view", params.data)}
              >
                <EyeOutlined />
              </button>
            </Tooltip>
            <Tooltip title={`Edit User`} color="orange" placement="leftTop">
              <button
                className="btn btn-warning btn-sm me-1"
                onClick={() => showDrawer("edit", params.data)}
              >
                <EditOutlined />
              </button>
            </Tooltip>
            <Tooltip title={`Delete User`} color="red" placement="leftTop">
              <Popconfirm
                title={`Are you sure you want to delete "${params.data.name}"?`}
                onConfirm={() => confirmDelUser(params.data.id)}
                okText="Yes"
                cancelText="No"
              >
                <DeleteOutlined
                  style={{ border: "1px dashed red" }}
                  className="btn btn-danger btn-sm"
                />
              </Popconfirm>
            </Tooltip>
          </div>
        </>
      ),
    },
  ]);

  useEffect(() => {
    setRowData(users);
  }, [users]);

  // Popconfirm User Delete
  const confirmDelUser = (id) =>
    new Promise((resolve) => {
      const url = route("user.destroy", id);
      router.delete(url, {
        preserveScroll: true,
        onSuccess: () => {
          resolve();
        },
        onError: () => {
          message.error("Failed to delete user");
        },
      });
    });

  const gridOptions = {
    onCellClicked: (params) => {
      if (params.colDef.field === "actions") return;
      showDrawer("EditUserColumn", {
        ...params.data, // Spread all row data
        field: params.colDef.field, // Column field name
        value: params.value, // Current cell value
        id: params.data.id, // Row ID
      });
    },
  };
  return (
    <>
      <AgGridReact
        rowData={rowData}
        {...gridOptions}
        columnDefs={colDefs}
        defaultColDef={{
          ...defaultColDef,
          flex: undefined,
        }}
        theme={gridTheme}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </>
  );
};
export default UsersTable;
