import { useState, useEffect, useRef, useCallback } from "react";
import {
  AgGridReact,
  gridTheme,
  defaultColDef,
  sideBarConfig,
  gridOptionsConfig,
} from "@agConfig/AgGridConfig";
import {
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
  InputNumber,
  Input,
  FileExcelOutlined,
  Badge,
  Link
} from "@shared/ui";
import axios from "axios";
import NProgress from "nprogress";
import { CommentOutlined } from "@ant-design/icons";
import ProjectChatModal from "./ProjectChatModal";
const ProjectsTable = ({ projects, showDrawer, setRowData, api, onClose }) => {

  const hasPermission = (userpermission, permName) =>
    userpermission?.some((p) => p.name === permName);
  const { url, props: inertiaProps } = usePage();
  const { auth } = inertiaProps;

  const userPermissions = inertiaProps?.auth?.user?.role?.permissions ?? [];
  const can = (perm) => hasPermission(userPermissions, perm);
  const user = inertiaProps?.auth?.user ?? {};
  const permissions = inertiaProps?.permissions ?? []; // master list
  const hasViewProjectTeamPermission =
    Array.isArray(userPermissions) &&
    userPermissions.some((perm) => perm.name === "View Project Team");

  const hasViewScoreDetailsPermission =
    Array.isArray(userPermissions) &&
    userPermissions.some((perm) => perm.name === "View Score Details");

  const hasViewPersonalScoreDetailsPermission =
    Array.isArray(userPermissions) &&
    userPermissions.some((perm) => perm.name === "View Personal Score Details");

  const hasUpdateScorePermission =
    Array.isArray(userPermissions) &&
    userPermissions.some((perm) => perm.name === "Add/Update Score");

  const hasDeleteProjectPermission =
    Array.isArray(userPermissions) &&
    userPermissions.some((perm) => perm.name === "Delete Project");


  const route = useRoute();
  const [localRowData, setLocalRowData] = useState(projects);
  const gridRef = useRef(null);

  // const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  // const [chatProject, setChatProject] = useState(null);

  const [colDefs, setColDefs] = useState([
    {
      headerName: "Project Points",
      headerTooltip: "Estimator Points",
      field: "project_points",
      filter: "agNumberColumnFilter",
      editable: false,
      sortable: true,
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams: {
        suppressCount: true,
        innerRenderer: (params) => {
          const data = params.data;
          if (!data) return null;

          const total = Number(data.project_points || 0);
          const members = data.project_team_members || [];
          const used = members.reduce(
            (sum, m) => sum + Number(m.points_gain || 0),
            0
          );
          const left = Math.max(total - used, 0);
          const isJoined = members.some((m) => m.user_id === user.id);
          const isSuperAdmin = user.role_id === 1;
          if (!isSuperAdmin && !isJoined) {
            if (params.node) {
              params.node.setExpanded(false);
              params.node.expanded = false;
              params.node.master = false; // hides expand arrow
            }
            return (
              <span style={{ color: "#999", fontStyle: "italic" }}>N/A</span>
            );
          }
          let color = "green";
          if (left === 0) color = "red";
          else if (left < total / 2) color = "orange";
          return (
            <span style={{ fontWeight: 600 }}>
              {total}
              <span style={{ color: "#555" }}> | </span>
              <span style={{ color: "#007bff" }}>Used: {used}</span>
              <span style={{ color }}>{` / Left: ${left}`}</span>
            </span>
          );
        },
      },
      masterDetail: true,
      isRowMaster: (params) => {
        const user = props?.auth?.user ?? {};
        const members = params.data?.project_team_members || [];
        const isJoined = members.some((m) => m.user_id === user.id);
        const isSuperAdmin = user.role_id === 1;
        return isSuperAdmin || isJoined;
      },
    },
    {
      headerName: "Team Members",
      headerTooltip: "Team Members names",
      field: "teams",
      editable: false,
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
              <Tooltip title="Project Chat" color="blue" placement="left">
                <Link
                  href={`/project-chat?project_id=${params.data.id}`}
                  className="btn btn-sm me-1"
                  style={{
                    background: "linear-gradient(45deg, #1a1a2e, #16213e)",
                    border: "1px solid #0f3460",
                    borderRadius: "12px",
                    padding: "4px 12px",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    boxShadow: "0 0 5px rgba(0, 255, 255, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.6), 0 0 5px rgba(0, 255, 255, 0.4)";
                    e.currentTarget.style.borderColor = "#00ffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 5px rgba(0, 255, 255, 0.3)";
                    e.currentTarget.style.borderColor = "#0f3460";
                  }}
                >
                  <CommentOutlined
                    style={{
                      color: "#00ffff",
                      fontWeight: "bold",
                      fontSize: "16px",
                      filter: "drop-shadow(0 0 3px #00ffff)",
                      transition: "all 0.3s ease",
                    }}
                  />
                </Link>
              </Tooltip>
              <Tooltip title="Spread Sheet" color="green" placement="left">
                <div
                  className="btn btn-sm btn-success me-1"
                  onClick={() => alert("Coming soon")}
                >
                  <Badge dot color="red" offset={[2, 2]}>
                    <FileExcelOutlined />
                  </Badge>
                </div>
              </Tooltip>
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
              <Tooltip title="Project Chat" color="blue" placement="left">
                <Link
                  href={`/project-chat?project_id=${params.data.id}`}
                  className="btn btn-sm me-1"
                  style={{
                    background: "linear-gradient(45deg, #1a1a2e, #16213e)",
                    border: "1px solid #0f3460",
                    borderRadius: "12px",
                    padding: "4px 12px",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    boxShadow: "0 0 5px rgba(0, 255, 255, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.6), 0 0 5px rgba(0, 255, 255, 0.4)";
                    e.currentTarget.style.borderColor = "#00ffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 5px rgba(0, 255, 255, 0.3)";
                    e.currentTarget.style.borderColor = "#0f3460";
                  }}
                >
                  <CommentOutlined
                    style={{
                      color: "#00ffff",
                      fontWeight: "bold",
                      fontSize: "16px",
                      filter: "drop-shadow(0 0 3px #00ffff)",
                      transition: "all 0.3s ease",
                    }}
                  />
                </Link>
              </Tooltip>
              <Tooltip title="Spread Sheet" color="green" placement="left">
                <div
                  className="btn btn-sm btn-success me-1"
                  onClick={() => alert("Coming soon")}
                >
                  <Badge dot color="red" offset={[2, 2]}>
                    <FileExcelOutlined />
                  </Badge>
                </div>
              </Tooltip>
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
              {hasViewProjectTeamPermission && (
                <Tooltip
                  title="Team Full Detail"
                  className="btn btn-sm btn-info text-white me-1"
                  color="green"
                  placement="top"
                  onClick={() =>
                    showDrawer("ViewJoinMemberDetail", params.data)
                  }
                >
                  <EyeOutlined />
                </Tooltip>
              )}

              <Avatar.Group>
                {members.map((per, index) => {
                  const user = per.user;
                  const profileMedia = user?.media?.[0];
                  const canViewAllScores = hasViewScoreDetailsPermission;
                  const canViewOwnScore =
                    hasViewPersonalScoreDetailsPermission &&
                    user?.id === auth.user.id;

                  const isClickable = canViewAllScores || canViewOwnScore;

                  const avatarProps = isClickable
                    ? {
                      onClick: () =>
                        showDrawer("AddEditPoint", {
                          ...params.data,
                          member_id: per.id,
                          name: user.name,
                          points_gain: per.points_gain,
                        }),
                      style: {
                        cursor: "pointer",
                        backgroundColor: "#87d068",
                      },
                    }
                    : {};

                  return (
                    <Tooltip title={user?.name} key={index}>
                      {profileMedia ? (
                        <Avatar
                          src={`/${profileMedia.file_path}`}
                          alt={user.name}
                          size={42}
                          style={{
                            objectFit: "contain",
                          }}
                          {...avatarProps}
                        />
                      ) : (
                        <Avatar
                          icon={<UserOutlined />}
                          style={{
                            backgroundColor: "#87d068",
                            ...avatarProps.style,
                          }}
                          {...avatarProps}
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
        return "N/A";
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
          return "N/A";
        }
      },
    },
    ...(can("View Client Admin")
      ? [
        {
          headerName: "Client Name Admin",
          headerTooltip: "Client Name For Admin",
          field: "client_name_for_admin",

          cellRenderer: (params) => {
            if (params.data?.client_name_for_admin) {
              const div = document.createElement("div");
              div.innerHTML =
                params.value || "<i>No Client Name For Admin</i>";
              const text = div.textContent || div.innerText || "";
              return text.length > 100
                ? text.substring(0, 100) + "..."
                : text;
            } else {
              return "N/A";
            }
          },
        },
      ]
      : []),

    {
      headerName: "Mask Client Name",
      headerTooltip: "Masked Client Name",
      field: "mask_client_name",
      valueGetter: (params) => {
        const name = params.data?.client_name_for_admin || "";
        if (!name) return "N/A";

        const clean = name.replace(/\s+/g, " ").trim(); // normalize spaces

        return `bid#${clean.slice(0, 3).toLowerCase()}${clean.slice(-3).toLowerCase()}`;
      },
      cellRenderer: (params) => {
        return params.value;
      },
    },

    ...(can("View Client")
      ? [
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
              return "N/A";
            }
          },
        },
      ]
      : []),
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
              return "N/A";
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
          return "N/A";
        }
      },
    },
    ...(can("View Private Notes")
      ? [
        {
          headerName: "Client Notes Only Admin",
          headerTooltip: "Client Notes only admin or autorised by admin",
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
              return "N/A";
            }
          },
        },
      ]
      : []),
    ...(can("View Initial Link(onside)")
      ? [
        {
          headerName: "OnSide Link / Admin",
          headerTooltip: "Link during project submition by admin",
          field: "project_init_link",

          cellRenderer: (params) => {
            if (params.data.project_init_link) {
              // return params.data.project_init_link;
              return (
                <>
                  <a href={params.data.project_init_link} target="_blank">
                    OnSide Link.
                  </a>
                </>
              );
            } else {
              return "N/A";
            }
          },
        },
      ]
      : []),
    {
      headerName: "Offside Link / Estimator",
      headerTooltip: "Link during project submition by estimator",
      field: "project_final_link",
      cellRenderer: (params) => {
        if (params.data.project_final_link) {
          // return params.data.project_final_link;
          return (
            <>
              <a href={params.data.project_final_link} target="_blank">
                OffSide Link.
              </a>
            </>
          );
        } else {
          return "N/A";
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
          return "N/A";
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
          return "N/A";
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
          return "N/A";
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
          return "N/A";
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
          return "N/A";
        }
      },
    },
    {
      headerName: "Due Date",
      field: "project_due_date",
      editable: false,
      cellEditor: "agDateCellEditor",
      cellRenderer: function (params) {
        if (params.value) {
          const date = new Date(params.value);
          if (!isNaN(date)) {
            const options = {
              year: "numeric",
              month: "short",
              day: "numeric",
              weekday: "long",
            };
            return new Intl.DateTimeFormat("en-US", options).format(date);
          } else {
            return "Invalid Date";
          }
        } else {
          return "Not Set Yet Now.";
        }
      },
    },
    {
      headerName: "| Days | Hrs | Min | Sec |",
      field: "project_due_date",
      filter: false,
      editable: false,
      cellRenderer: (props) => {
        const dueDate = new Date(props.value);

        const Countdown = () => {
          const [timeLeft, setTimeLeft] = useState(calcTimeLeft());

          function calcTimeLeft() {
            const now = new Date();
            const diffMs = dueDate - now;
            if (diffMs <= 0) return [0, 0, 0, 0];

            const days = Math.floor(diffMs / 86400000);
            const hrs = Math.floor((diffMs % 86400000) / 3600000);
            const mins = Math.floor(((diffMs % 86400000) % 3600000) / 60000);
            const secs = Math.floor(
              (((diffMs % 86400000) % 3600000) % 60000) / 1000
            );
            return [days, hrs, mins, secs];
          }

          useEffect(() => {
            const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
            return () => clearInterval(timer);
          }, []);

          const [days, hrs, mins, secs] = timeLeft;
          const expired = dueDate < new Date();

          return (
            <div
              className={expired ? "text-danger" : ""}
              style={{ display: "flex", gap: "4px" }}
            >
              <button className="btn btn-sm btn-outline-primary">
                {String(days).padStart(2, "0")}
              </button>
              <button className="btn btn-sm btn-outline-warning">
                {String(hrs).padStart(2, "0")}
              </button>
              <button className="btn btn-sm btn-outline-info">
                {String(mins).padStart(2, "0")}
              </button>
              <button className="btn btn-sm btn-outline-danger">
                {String(secs).padStart(2, "0")}
              </button>
            </div>
          );
        };

        return <Countdown />;
      },
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
          return "N/A";
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
          return "N/A";
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
          return "N/A";
        }
      },
    },
    ...(can("View Budget")
      ? [
        {
          headerName: "Project Total Budget",
          headerTooltip: "Total Budget Of The Project",
          field: "budget_total",
          filter: "agNumberColumnFilter",

          cellRenderer: (params) => {
            if (params.data?.budget_total) {
              return params.data?.budget_total;
            }
            return "N/A";
          },
        },
      ]
      : []),

    ...(can("View Deduction")
      ? [
        {
          headerName: "Deduction Amount",
          headerTooltip: "Amount Of Deduction",
          field: "deduction_amount",
          filter: "agNumberColumnFilter",
          cellRenderer: (params) => {
            if (params.data?.deduction_amount) {
              return params.data?.deduction_amount;
            }
            return "N/A";
          },
        },
      ]
      : []),

    ...(can("View Budget")
      ? [
        {
          headerName: "Final Price",
          headerTooltip: "Final Price After All, Tax, Discount ...",
          field: "final_Price",
          filter: "agNumberColumnFilter",
          cellRenderer: (params) => {
            const budget = params.data?.budget_total;
            const deduction = params.data?.deduction_amount ?? 0; // Treat null/undefined as 0

            if (budget !== null && budget !== undefined && budget !== "") {
              const total = budget - deduction;
              return `$${total}`;
            }
            return "N/A";
          },
        },
      ]
      : []),

    {
      headerName: "Project Status",
      field: "project_status",
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
            {hasDeleteProjectPermission && (
              <Tooltip title={`Delete Project`} color="red" placement="leftTop">
                <Popconfirm
                  title={`Are you sure you want to delete project`}
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
            )}
          </div>
        </>
      ),
    },
  ]);

  useEffect(() => {
    setRowData(projects);
  }, [projects]);

  const isSSRM = inertiaProps.status === "Deliver";

  const refreshGrid = useCallback(() => {
    if (gridRef.current?.api) {
      if (isSSRM) {
        gridRef.current.api.refreshServerSide();
      } else {
        // For client side, we might need a full refresh from server or just filter
        // Standard client-side refresh:
        gridRef.current.api.redrawRows();
      }
    }
  }, [isSSRM]);

  const confirmDelProject = async (id) => {
    try {
      const { data } = await axios.delete(route("project.destroy", id));
      if (data.project) {
        api.success({
          message: "Success",
          description: data.message,
          placement: "topRight",
        });
        setRowData(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      api.error({
        message: "Error",
        description: "Failed to delete project",
        placement: "topRight",
      });
    }
  };

  const confirmDelJoinedProject = async (id) => {
    try {
      const { data } = await axios.delete(route("DeleteJoinProject", id));
      if (data.project) {
        api.success({
          message: "success",
          description: data.message,
          placement: "topRight",
        });
        setRowData(prev => prev.map(p => p.id === data.project.id ? data.project : p));
      }
    } catch (error) {
      api.error({
        message: "error",
        description: "Failed to remove from joined project",
        placement: "topRight",
      });
    }
  };

  const gridOptions = {
    masterDetail: true,
    detailRowAutoHeight: true,
    onCellDoubleClicked: (params) => {
      if (
        params.colDef.field === "actions" ||
        params.colDef.field === "teams" ||
        params.colDef.field === "client.notes" ||
        params.colDef.field === "final_Price" ||
        params.colDef.headerName === "Mask Client Name" ||
        (params.colDef.field === "project_points" && user.role_id !== 1)
      )
        return;
      showDrawer("EditColumn", {
        ...params.data,
        field: params.colDef.field,
        value: params.value,
        id: params.data.id,
      });
    },
  };

  const DetailCellRenderer = (props) => {
    const data = props.data;
    if (!data) return null;
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState(data?.project_team_members ?? []);
    const totalPoints = Number(data?.project_points ?? 0);
    const usedPoints = members.reduce(
      (sum, m) => sum + Number(m.points_gain || 0),
      0
    );
    const leftPoints = Math.max(0, totalPoints - usedPoints);
    const handleChange = (id, value) => {
      const newVal = Number(value) || 0;
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, points_gain: newVal } : m))
      );
    };
    const handleUpdate = async () => {
      const totalUsed = members.reduce(
        (sum, m) => sum + Number(m.points_gain || 0),
        0
      );
      if (totalUsed > totalPoints) {
        api.error({
          message: "Validation Error",
          description: `Total assigned points (${totalUsed}) exceed total project points (${totalPoints}).`,
          placement: "topRight",
        });
        return;
      }
      try {
        NProgress.start();
        setLoading(true);
        const { data: response } = await axios.put(
          route("project.bulkUpdateScores", data.id),
          { members }
        );
        if (response.project) {
          api.success({
            message: "Success",
            description: response.message,
            placement: "topRight",
          });
          refreshGrid();
        }
      } catch (error) {
        console.error(error.response?.data);
        api.error({
          message: "Error",
          description:
            error.response?.data?.message ||
            "Failed to update project team scores",
          placement: "topRight",
        });
      } finally {
        NProgress.done();
        setLoading(false);
      }
    };
    return (
      <div className="p-4 shadow-sm">
        <h4 className="text-blue-700 font-semibold mb-2">
          Project Team Member Score Detail
        </h4>
        <ul style={{ listStyle: "circle", fontStyle: "italic" }}>
          <li>
            Total Project Points:{" "}
            <span className="font-semibold">{totalPoints}</span>
          </li>
          <li>
            Total Points Used:{" "}
            <span className="font-semibold">{usedPoints}</span>
          </li>
          <li>
            Total Points Left:{" "}
            <span
              className={`font-semibold ${leftPoints < 0 ? "text-red-500" : "text-green-600"
                }`}
            >
              {leftPoints}
            </span>
          </li>
        </ul>
        {members.length > 0 ? (
          <>
            <hr className="my-3" />
            <h5 className="mb-1">Member Breakdown:</h5>
            <ul style={{ listStyle: "circle", fontStyle: "italic" }}>
              {members.map((m) => (
                <li key={m.id} className="mb-1">
                  {m.user?.name || "Unknown"}:
                  {hasUpdateScorePermission ? (
                    <InputNumber
                      size="small"
                      value={Number(m.points_gain || 0)}
                      min={0}
                      onChange={(v) => handleChange(m.id, v)}
                    />
                  ) : (
                    m.points_gain || 0
                  )}{" "}
                  Points
                </li>
              ))}
            </ul>
            {hasUpdateScorePermission && (
              <button
                className="btn btn-sm btn-primary mt-2"
                disabled={loading}
                onClick={handleUpdate}
              >
                {loading ? "Updating..." : "Update All"}
              </button>
            )}
          </>
        ) : (
          <p className="italic text-gray-500 mt-3">
            No members have joined this project yet.
          </p>
        )}
      </div>
    );
  };

  const onFilterTextBoxChanged = useCallback(() => {
    if (gridRef.current?.api) {
      if (isSSRM) {
        gridRef.current.api.refreshServerSide();
      } else {
        gridRef.current.api.setGridOption(
          "quickFilterText",
          document.getElementById("filter-text-box")?.value
        );
      }
    }
  }, [isSSRM]);

  const isSelf = url.includes("/project/self");

  const onGridReady = useCallback((params) => {
    gridRef.current = params;

    // Restore column state if saved
    gridOptionsConfig.onGridReady(params);

    if (isSSRM) {
      const datasource = {
        getRows: async (params) => {
          try {
            NProgress.start();
            const quickFilter = document.getElementById("filter-text-box")?.value || "";
            const filterModel = params.api.getFilterModel();

            const { data } = await axios.post(route("project.status.data", { status: inertiaProps.status || 'All' }), {
              ...params.request,
              filterModel: filterModel,
              isSelf: isSelf,
              quickFilter: quickFilter
            });
            params.success({
              rowData: data.rows,
              rowCount: data.totalCount,
            });
          } catch (e) {
            console.error("SSRM error", e);
            params.fail();
          } finally {
            NProgress.done();
          }
        },
      };

      params.api.setGridOption("serverSideDatasource", datasource);

      // Add listener to refresh on filter changes
      params.api.addEventListener('filterChanged', () => {
        params.api.refreshServerSide();
      });
    }
  }, [inertiaProps.status, isSelf, isSSRM]);




  return (
    <>
      <div>
        <Input
          style={{ maxWidth: "300px" }}
          size="medium"
          className="mb-1 mt-1"
          id="filter-text-box"
          placeholder="Quick Filter..."
          onInput={onFilterTextBoxChanged}
        />
      </div>
      <AgGridReact
        ref={gridRef}
        {...gridOptions}
        columnDefs={colDefs}
        defaultColDef={{
          ...defaultColDef,
          flex: undefined,
        }}
        theme={gridTheme}
        rowModelType={isSSRM ? "serverSide" : undefined}
        rowData={isSSRM ? undefined : projects}
        pagination={isSSRM}
        paginationPageSize={20}
        cacheBlockSize={20}
        sideBar={sideBarConfig}
        onGridReady={onGridReady}
        onColumnMoved={gridOptionsConfig.onColumnMoved}
        onColumnPinned={gridOptionsConfig.onColumnPinned}
        onColumnVisible={gridOptionsConfig.onColumnVisible}
        onColumnResized={gridOptionsConfig.onColumnResized}
        onSortChanged={gridOptionsConfig.onSortChanged}
        maintainColumnOrder={true}
        detailCellRenderer={DetailCellRenderer}
        rowSelection="single"
      />
      {/* <ProjectChatModal
        visible={isChatModalVisible}
        onClose={() => setIsChatModalVisible(false)}
        project={chatProject}
        currentUser={user}
      /> */}
    </>
  );
};
export default ProjectsTable;
