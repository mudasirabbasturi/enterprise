import { useState, useEffect, useRef } from "react";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import {
  router,
  usePage,
  useRoute,
  Tooltip,
  Popconfirm,
  Avatar,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@shared/ui";
import echo from "@/echo";
const ProjectsTable = ({ projects, showDrawer }) => {
  const hasPermission = (userpermission, permName) =>
    userpermission?.some((p) => p.name === permName);
  const { auth } = usePage().props;
  const { props } = usePage();
  const userPermissions = props.auth.user?.role?.permissions || [];
  const can = (perm) => hasPermission(userPermissions, perm);

  const route = useRoute();

  const LiveCountdownCell = (params) => {
    const timerRef = useRef(null);
    const cellRef = useRef(null);
    const updateCountdown = () => {
      if (!params.value) return "⭕⭕❌❌🚫🚫";
      const dueDate = new Date(params.value);
      if (isNaN(dueDate)) return "Invalid Date";
      const now = new Date();
      const diffMs = dueDate - now;
      if (diffMs <= 0) return `${params.value} | Expired`;
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      return `${params.value} | ${days}d ${hours}h ${mins}m ${secs}s`;
    };

    useEffect(() => {
      if (!cellRef.current) return;
      cellRef.current.innerHTML = updateCountdown();
      timerRef.current = setInterval(() => {
        if (cellRef.current) {
          cellRef.current.innerHTML = updateCountdown();
        }
      }, 1000);
      return () => clearInterval(timerRef.current);
    }, [params.value]);
    return <div ref={cellRef} />;
  };

  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([
    {
      headerName: "Team Members",
      headerTooltip: "Team Members names",
      field: "teams",
      editable: false,
      pinned: "left",
      valueGetter: (params) => {
        const members = params.data.project_team_members || [];
        return members
          .map((m) => m.user?.name)
          .filter(Boolean)
          .join(", ");
      },
      cellRenderer: (params) => {
        const members = params.data.project_team_members || [];
        const names = params.value;

        if (members.length === 0) {
          return (
            <div className="d-flex align-items-center">
              <Tooltip
                title="Join Project"
                className="btn btn-sm btn-primary me-1"
                color="blue"
                placement="left"
                onClick={() => showDrawer("JoinProject", params.data)}
              >
                <LockOutlined />
              </Tooltip>
              <span style={{ color: "#999", fontStyle: "italic" }}>
                No one has joined
              </span>
            </div>
          );
        }

        return (
          <div className="d-flex flex-column">
            <div className="d-flex align-items-center">
              {members.some((m) => m.user?.id === auth.user.id) ? (
                <div className="d-flex">
                  <Tooltip
                    title="Edit Join Project"
                    className="btn btn-sm btn-primary me-1"
                    color="blue"
                    placement="left"
                    onClick={() => showDrawer("EditJoinProject", params.data)}
                  >
                    <UnlockOutlined />
                  </Tooltip>
                  <Tooltip
                    title={`Delete from joined member`}
                    color="red"
                    placement="leftTop"
                  >
                    <Popconfirm
                      title={`Are you sure to delete from joined member`}
                      onConfirm={() => {
                        const members = params.data.project_team_members || [];
                        const currentUserMember = members.find(
                          (member) => member.user?.id === auth.user.id
                        );
                        confirmDelJoinedProject(currentUserMember.id);
                      }}
                      okText="Yes"
                      cancelText="No"
                    >
                      <DeleteOutlined
                        style={{ border: "1px dashed red" }}
                        className="btn btn-sm btn-danger me-1"
                      />
                    </Popconfirm>
                  </Tooltip>
                </div>
              ) : (
                <Tooltip
                  title="Join Project"
                  className="btn btn-sm btn-primary me-1"
                  color="blue"
                  placement="left"
                  onClick={() => showDrawer("JoinProject", params.data)}
                >
                  <LockOutlined />
                </Tooltip>
              )}
              <Tooltip
                title="Team Full Detail"
                className="btn btn-sm btn-info text-white me-1"
                color="green"
                placement="top"
                onClick={() => showDrawer("ViewJoinMemberDetail", params.data)}
              >
                <EyeOutlined />
              </Tooltip>
              <Avatar.Group>
                {members.map((per, index) => {
                  const user = per.user;
                  const profileMedia = user?.media?.[0];

                  return (
                    <Tooltip title={user?.name} key={index}>
                      {profileMedia ? (
                        <Avatar
                          src={`/storage/${profileMedia.file_path}`}
                          alt={user.name}
                          onClick={() =>
                            showDrawer("AddEditPoint", {
                              ...params.data,
                              member_id: per.id,
                              name: user.name,
                              points_gain: per.points_gain,
                            })
                          }
                          style={{ cursor: "pointer" }}
                        />
                      ) : (
                        <Avatar
                          icon={<UserOutlined />}
                          onClick={() =>
                            showDrawer("AddEditPoint", {
                              ...params.data,
                              member_id: per.id,
                              name: user.name,
                              points_gain: per.points_gain,
                            })
                          }
                          style={{
                            backgroundColor: "#87d068",
                            cursor: "pointer",
                          }}
                        />
                      )}
                    </Tooltip>
                  );
                })}
              </Avatar.Group>
            </div>
            <div className="mt-1 text-sm">{names}</div>
          </div>
        );
      },
    },
    {
      headerName: "Project Title",
      headerTooltip: "Project Title",
      field: "project_title",
      cellRenderer: (params) => {
        if (params.data?.project_title) {
          return params.data?.project_title;
        }
        return "⭕❌❌🚫";
      },
    },
    {
      headerName: "Address",
      headerTooltip: "Project Address",
      field: "project_address",

      cellRenderer: (params) => {
        if (params.data?.project_address) {
          const div = document.createElement("div");
          div.innerHTML = params.value || "<i>No Address</i>";
          const text = div.textContent || div.innerText || "";
          return text.length > 100 ? text.substring(0, 100) + "..." : text;
        } else {
          return "⭕❌❌🚫";
        }
      },
    },
    {
      headerName: "Project Pricing",
      headerTooltip: "Project Pricing",
      field: "project_pricing",
      cellRenderer: (params) => {
        if (params.data.project_pricing) {
          return params.data.project_pricing;
        } else {
          return "⭕⭕❌❌🚫🚫";
        }
      },
    },
    {
      headerName: "Prect Area",
      headerTooltip: "Project Area",
      field: "project_area",
      cellRenderer: (params) => {
        if (params.data.project_area) {
          return params.data.project_area;
        } else {
          return "⭕⭕❌❌🚫🚫";
        }
      },
    },
    {
      headerName: "Construction Type",
      headerTooltip: "Project Counstruction Type",
      field: "project_construction_type",
      cellRenderer: (params) => {
        if (params.data.project_construction_type) {
          return params.data.project_construction_type;
        } else {
          return "⭕⭕❌❌🚫🚫";
        }
      },
    },
    {
      headerName: "Line Items Pricing",
      headerTooltip: "Project Line Items Pricing",
      field: "project_line_items_pricing",
      cellRenderer: (params) => {
        if (params.data.project_line_items_pricing) {
          return params.data.project_line_items_pricing;
        } else {
          return "⭕⭕❌❌🚫🚫";
        }
      },
    },
    {
      headerName: "Floor Number",
      headerTooltip: "Project Floor Number",
      field: "project_floor_number",
      cellRenderer: (params) => {
        if (params.data.project_floor_number) {
          return params.data.project_floor_number;
        } else {
          return "⭕⭕❌❌🚫🚫";
        }
      },
    },
    {
      headerName: "Due Date | Time Left",
      field: "project_due_date",
      cellRenderer: LiveCountdownCell,
      filter: false,
      editable: false,
    },
    {
      headerName: "Main Scope",
      headerTooltip: "Project Main Scope",
      field: "project_main_scope",
      cellRenderer: (params) => {
        if (params.data?.project_main_scope) {
          const div = document.createElement("div");
          div.innerHTML = params.value || "<i>No Notes</i>";
          const text = div.textContent || div.innerText || "";
          return text.length > 100 ? text.substring(0, 100) + "..." : text;
        } else {
          return "⭕❌❌🚫";
        }
      },
    },
    {
      headerName: "Scope Details",
      headerTooltip: "Project Scope Details",
      field: "project_scope_details",
      cellRenderer: (params) => {
        if (params.data?.project_scope_details) {
          const div = document.createElement("div");
          div.innerHTML = params.value || "<i>No Notes</i>";
          const text = div.textContent || div.innerText || "";
          return text.length > 100 ? text.substring(0, 100) + "..." : text;
        } else {
          return "⭕❌❌🚫";
        }
      },
    },
    {
      headerName: "Project Template",
      headerTooltip: "Project Template",
      field: "project_template",
      cellRenderer: (params) => {
        if (params.data.project_template) {
          return params.data.project_template;
        } else {
          return "⭕⭕❌❌🚫🚫";
        }
      },
    },
    ...(can("View Client")
      ? [
          {
            headerName: "Client Tile",
            headerTooltip: "Client Title",
            field: "client_id",
            cellRenderer: (params) => {
              if (params.data.client?.title) {
                return params.data.client?.title;
              } else {
                return "⭕⭕❌❌🚫🚫";
              }
            },
          },
          {
            headerName: "Client Name",
            headerTooltip: "Client Name",
            field: "client.name",

            cellRenderer: (params) => {
              if (params.data.client?.name) {
                return params.data.client?.name;
              } else {
                return "⭕⭕❌❌🚫🚫";
              }
            },
          },
          {
            headerName: "Client Email",
            headerTooltip: "Client Email",
            field: "client.email",

            cellRenderer: (params) => {
              if (params.data.client?.email) {
                return params.data.client?.email;
              } else {
                return "⭕⭕❌❌🚫🚫";
              }
            },
          },
          {
            headerName: "Client Phone",
            headerTooltip: "Client Phone",
            field: "client.phone",

            cellRenderer: (params) => {
              if (params.data.client?.phone) {
                return params.data.client?.phone;
              } else {
                return "⭕⭕❌❌🚫🚫";
              }
            },
          },
          {
            headerName: "Client Notes",
            headerTooltip: "Client Notes",
            field: "client.notes",

            cellRenderer: (params) => {
              if (params.data.client?.notes) {
                const div = document.createElement("div");
                div.innerHTML = params.value || "<i>No Client Notes</i>";
                const text = div.textContent || div.innerText || "";
                return text.length > 100
                  ? text.substring(0, 100) + "..."
                  : text;
              } else {
                return "⭕❌❌🚫";
              }
            },
          },
        ]
      : []),

    ...(can("View Init Link")
      ? [
          {
            headerName: "Init Link / Admin",
            headerTooltip: "Link during project submition by admin",
            field: "project_init_link",

            cellRenderer: (params) => {
              if (params.data.project_init_link) {
                return params.data.project_init_link;
              } else {
                return "⭕⭕❌❌🚫🚫";
              }
            },
          },
        ]
      : []),
    {
      headerName: "Final Link",
      headerTooltip: "Findal link when the project is completed",
      field: "project_final_link",

      cellRenderer: (params) => {
        if (params.data.project_final_link) {
          return params.data.project_final_link;
        } else {
          return "⭕⭕❌❌🚫🚫";
        }
      },
    },

    ...(can("View Admin Notes")
      ? [
          {
            headerName: "Admin | Supervisor Notes",
            headerTooltip:
              "Notes from admin or supervisor or from any Authenticate user",
            field: "project_admin_notes",

            cellRenderer: (params) => {
              if (params.data?.project_admin_notes) {
                const div = document.createElement("div");
                div.innerHTML = params.value || "<i>No Notes</i>";
                const text = div.textContent || div.innerText || "";
                return text.length > 100
                  ? text.substring(0, 100) + "..."
                  : text;
              } else {
                return "⭕❌❌🚫";
              }
            },
          },
        ]
      : []),

    {
      headerName: "Estimator Notes",
      headerTooltip: "Notes from estimator or from any authorise user",
      field: "project_notes_estimator",

      cellRenderer: (params) => {
        if (params.data?.project_notes_estimator) {
          const div = document.createElement("div");
          div.innerHTML = params.value || "<i>No Notes</i>";
          const text = div.textContent || div.innerText || "";
          return text.length > 100 ? text.substring(0, 100) + "..." : text;
        } else {
          return "⭕❌❌🚫";
        }
      },
    },
    ...(can("View Private Notes")
      ? [
          {
            headerName: "Notes Only Admin",
            headerTooltip: "Private Notes only admin or autorised by admin",
            field: "notes_private",
            cellRenderer: (params) => {
              if (params.data?.notes_private) {
                const div = document.createElement("div");
                div.innerHTML = params.value || "<i>No Notes</i>";
                const text = div.textContent || div.innerText || "";
                return text.length > 100
                  ? text.substring(0, 100) + "..."
                  : text;
              } else {
                return "⭕❌❌🚫";
              }
            },
          },
        ]
      : []),

    ...(can("View Total Budget")
      ? [
          {
            headerName: "Project Total Budget",
            headerTooltip: "Total Budget Of The Project",
            field: "budget_total",

            cellRenderer: (params) => {
              if (params.data?.budget_total) {
                return params.data?.budget_total;
              }
              return "⭕❌❌🚫";
            },
          },
        ]
      : []),

    ...(can("View Deduction Amount")
      ? [
          {
            headerName: "Deduction Amount",
            headerTooltip: "Amount Of Deduction",
            field: "deduction_amount",
            cellRenderer: (params) => {
              if (params.data?.deduction_amount) {
                return params.data?.deduction_amount;
              }
              return "⭕❌❌🚫";
            },
          },
        ]
      : []),

    ...(can("View Total Budget")
      ? [
          {
            headerName: "Final Price",
            headerTooltip: "Final Price After All, Tax, Discount ...",
            field: "final_Price",
            cellRenderer: (params) => {
              const budget = params.data?.budget_total;
              const deduction = params.data?.deduction_amount ?? 0; // Treat null/undefined as 0

              if (budget !== null && budget !== undefined && budget !== "") {
                return budget - deduction;
              }
              return "⭕❌❌🚫";
            },
          },
        ]
      : []),

    {
      headerName: "Project Status",
      field: "project_status",
      pinned: "right",
      width: 150,
      floatingFilter: false,
      cellRenderer: (params) => {
        const status = params.data.project_status;
        const statusClasses = {
          Pending: "active-status-pending",
          "Takeoff On Progress": "active-status-progress",
          "Pricing On Progress": "active-status-pricing",
          Completed: "active-status-completed",
          Revision: "active-status-revision",
          Hold: "active-status-hold",
          Cancelled: "active-status-cancelled",
          Deliver: "active-status-deliver",
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
      headerName: "In Source / Out Source",
      field: "project_source",
    },
    {
      headerName: "View | Update | Delete",
      field: "actions",
      filter: false,
      editable: false,
      sortable: false,
      pinned: "right",
      cellRenderer: (params) => (
        <>
          <div className="btn-group btn-group-sm">
            <Tooltip
              className="btn btn-success btn-sm me-1"
              title={`View Full Records`}
              color="green"
              placement="leftTop"
              onClick={() => showDrawer("view", params.data)}
            >
              <EyeOutlined />
            </Tooltip>
            <Tooltip
              className="btn btn-warning btn-sm me-1"
              title={`Edit Project`}
              color="orange"
              placement="leftTop"
              onClick={() => showDrawer("edit", params.data)}
            >
              <EditOutlined />
            </Tooltip>
            <Tooltip title={`Delete Project`} color="red" placement="leftTop">
              <Popconfirm
                title={`Are you sure you want to delete "${params.data.project_title}"?`}
                onConfirm={() => confirmDelProject(params.data.id)}
                okText="Yes"
                cancelText="No"
              >
                <DeleteOutlined
                  style={{ border: "1px dashed red" }}
                  className="btn btn-sm btn-danger"
                />
              </Popconfirm>
            </Tooltip>
          </div>
        </>
      ),
    },
  ]);

  useEffect(() => {
    setRowData(projects);
  }, [projects]);

  const confirmDelProject = (id) =>
    new Promise((resolve) => {
      const url = route("project.destroy", id);
      router.delete(url, {
        preserveScroll: true,
        onSuccess: () => {
          resolve();
        },
        onError: () => {
          message.error("Failed to delete project");
        },
      });
    });

  const confirmDelJoinedProject = (id) =>
    new Promise((resolve) => {
      const url = route("DeleteJoinProject", id);
      router.delete(url, {
        preserveScroll: true,
        onSuccess: () => {
          resolve();
        },
        onError: () => {
          message.error("Failed to delete from joined project");
        },
      });
    });

  const gridOptions = {
    onCellClicked: (params) => {
      if (
        params.colDef.field === "actions" ||
        params.colDef.field === "teams" ||
        params.colDef.field === "client.name" ||
        params.colDef.field === "client.email" ||
        params.colDef.field === "client.phone" ||
        params.colDef.field === "client.notes" ||
        params.colDef.field === "final_Price"
      )
        return;
      showDrawer("EditColumn", {
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
        rowData={projects}
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
export default ProjectsTable;
