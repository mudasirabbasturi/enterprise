import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Ably from "ably";
import { debounce } from "lodash";
import {
  AgGridReact,
  gridTheme,
  defaultColDef,
  sideBarConfig,
  gridOptionsConfig,
} from "@agConfig/AgGridConfig";
import {
  Tooltip,
  Popconfirm,
  Avatar,
  InputNumber,
  Input,
  Badge
} from "antd";

import {
  Link,
  usePage,
} from "@inertiajs/react";
import { Collapse } from "@shared/ui";
import { useRoute } from "@ziggy";
import NProgress from "nprogress";
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  FileExcelOutlined,
  CommentOutlined
} from "@ant-design/icons";
import ProjectChatModal from "@component/Chat/ProjectChatModal";

const ProjectsTable = ({ projects, showDrawer, setRowData, api, onClose }) => {

  const hasPermission = (userpermission, permName) =>
    userpermission?.some((p) => p.name === permName);
  const { url, props: inertiaProps } = usePage();
  const { auth } = inertiaProps;

  const userPermissions = inertiaProps?.auth?.user?.role?.permissions ?? [];
  const can = (perm) => hasPermission(userPermissions, perm);
  const user = inertiaProps?.auth?.user ?? {};
  const permissions = inertiaProps?.permissions ?? []; // master list
  
  // Chat Modal State
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedProjectForChat, setSelectedProjectForChat] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    const ably = new Ably.Realtime({ authUrl: '/api/ably/auth' });
    const userChannel = ably.channels.get(`user.${user.id}`);
    
    userChannel.subscribe('project-notification', (msgEvent) => {
      const data = msgEvent.data;
      const projectId = data.project_id;
      const msg = data.message;
      
      if (msg.user_id !== user.id && window.activeProjectChatId !== projectId) {
        // Play sound notification
        const sound = new Audio("/uploads/media/sound_effect/chat/chat_message_notification.mp3");
        sound.play().catch(() => { });

        // Update row data in ag-grid to increment unread_count for the matching project
        if (gridRef.current?.api) {
          const rowNode = gridRef.current.api.getRowNode(projectId);
          if (rowNode) {
            rowNode.setData({
              ...rowNode.data,
              unread_count: (rowNode.data.unread_count || 0) + 1
            });
          }
        }
        
        // Also update the parent rows state
        if (setRowData) {
          setRowData(prev => prev.map(p => {
            if (p.id === projectId) {
              return { ...p, unread_count: (p.unread_count || 0) + 1 };
            }
            return p;
          }));
        }
      }
    });

    return () => {
      userChannel.unsubscribe();
      ably.close();
    };
  }, [user?.id, setRowData]);

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


  const colDefs = useMemo(() => [
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
        const isJoined = members.some((m) => m.user?.id === auth.user.id);
        const isSuperAdmin = auth.user.role_id === 1;
        const showChatIcon = isSuperAdmin || (params.data.project_status !== "Pending" && isJoined);

        if (members.length === 0) {
          return (
            <div className="d-flex align-items-center">
              {showChatIcon && (
                <Tooltip title="Project Chat" color="blue" placement="left">
                  <Badge count={params.data.unread_count || 0} size="small" offset={[5, -5]}>
                    <button
                      onClick={() => {
                        setSelectedProjectForChat(params.data);
                        setIsChatModalOpen(true);
                      }}
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
                        cursor: "pointer",
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
                    </button>
                  </Badge>
                </Tooltip>
              )}
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
              {showChatIcon && (
                <Tooltip title="Project Chat" color="blue" placement="left">
                  <Badge count={params.data.unread_count || 0} size="small" offset={[5, -5]}>
                    <button
                      onClick={() => {
                        setSelectedProjectForChat(params.data);
                        setIsChatModalOpen(true);
                      }}
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
                        cursor: "pointer",
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
                    </button>
                  </Badge>
                </Tooltip>
              )}
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
  ], [
    userPermissions,
    auth?.user?.id,
    hasViewProjectTeamPermission,
    hasViewScoreDetailsPermission,
    hasViewPersonalScoreDetailsPermission,
    hasUpdateScorePermission,
    hasDeleteProjectPermission
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
    
    const isSuperAdmin = user.role_id === 1;
    const projectMembers = data?.project_team_members ?? [];
    const currentUserMember = projectMembers.find((m) => m.user_id === user.id);
    
    // Filter members based on permissions
    const displayMembers = isSuperAdmin ? projectMembers : (currentUserMember ? [currentUserMember] : []);
    
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState(displayMembers);
    const totalPoints = Number(data?.project_points ?? 0);
    const usedPoints = isSuperAdmin 
      ? projectMembers.reduce((sum, m) => sum + Number(m.points_gain || 0), 0)
      : (currentUserMember ? Number(currentUserMember.points_gain || 0) : 0);
    const leftPoints = Math.max(0, totalPoints - usedPoints);
    
    const handleChange = (id, value) => {
      if (!isSuperAdmin) return; // Non-super admin cannot edit
      const newVal = Number(value) || 0;
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, points_gain: newVal } : m))
      );
    };
    
    const handleUpdate = async () => {
      if (!isSuperAdmin) {
        api.error({
          message: "Permission Denied",
          description: "Only Super Admin can update team member scores.",
          placement: "topRight",
        });
        return;
      }
      
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

    const stripHtml = (html) => {
      if (!html) return "";
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent || div.innerText || "";
    };

    const DataField = ({ label, value, show = true }) => {
      if (!show || !value) return null;
      return (
        <div className="row mb-3">
          <div className="col-4">
            <span className="fw-semibold text-muted" style={{ fontSize: "0.95rem", userSelect: "text" }}>{label}:</span>
          </div>
          <div className="col-8">
            <span className="text-dark" style={{ fontSize: "0.95rem", userSelect: "text" }}>{value}</span>
          </div>
        </div>
      );
    };

    return (
      <div className="p-3" style={{ maxHeight: "90vh", overflowY: "auto", userSelect: "text" }}>
        <div className="row m-0 g-4">
          {/* Left Column - Project Details from Grid */}
          <div className={isSuperAdmin ? "col-12 col-lg-6" : "col-12"}>
            <div className="card border-light shadow-sm">
              <div className="card-body p-4">
                <h5 className="card-title mb-4" style={{ color: "#1890ff", fontWeight: "700", fontSize: "1.1rem" }}>
                  📋 Project Details
                </h5>
                
                {/* Main Project Info */}
                <DataField label="Title" value={data.project_title} show={!!data.project_title} />
                <DataField label="Status" value={data.project_status} show={!!data.project_status} />
                
                <hr className="my-3" />
                
                {/* Address & Template */}
                <DataField label="Address" value={stripHtml(data.project_address)} show={!!data.project_address} />
                <DataField label="Template" value={stripHtml(data.project_template)} show={!!data.project_template} />
                
                {/* Client Info */}
                {can("View Client Admin") && isSuperAdmin && (
                  <DataField label="Client (Admin)" value={stripHtml(data.client_name_for_admin)} show={!!data.client_name_for_admin} />
                )}
                <DataField label="Mask Client" value={`bid#${stripHtml(data.client_name_for_admin || "").slice(0, 3).toLowerCase()}${stripHtml(data.client_name_for_admin || "").slice(-3).toLowerCase()}`} show={!!data.client_name_for_admin} />
                
                {/* Construction & Area Info */}
                <DataField label="Construction Type" value={data.project_construction_type} show={!!data.project_construction_type} />
                <DataField label="Area" value={data.project_area} show={!!data.project_area} />
                <DataField label="Floor Number" value={data.project_floor_number} show={!!data.project_floor_number} />
                <DataField label="Line Items Pricing" value={data.project_line_items_pricing} show={!!data.project_line_items_pricing} />
                
                <hr className="my-3" />
                
                {/* Scopes & Pricing */}
                <DataField label="Main Scope" value={stripHtml(data.project_main_scope)} show={!!data.project_main_scope} />
                <DataField label="Scope Details" value={stripHtml(data.project_scope_details)} show={!!data.project_scope_details} />
                <DataField label="Pricing" value={stripHtml(data.project_pricing)} show={!!data.project_pricing} />
                
                <hr className="my-3" />
                
                {/* Notes */}
                {can("View Client") && (
                  <DataField label="Client Notes" value={stripHtml(data.client?.notes)} show={!!data.client?.notes} />
                )}
                {can("View Admin Notes") && isSuperAdmin && (
                  <DataField label="Admin Notes" value={stripHtml(data.project_admin_notes)} show={!!data.project_admin_notes} />
                )}
                <DataField label="Estimator Notes" value={stripHtml(data.project_notes_estimator)} show={!!data.project_notes_estimator} />
                {can("View Private Notes") && (
                  <DataField label="Private Notes" value={stripHtml(data.notes_private)} show={!!data.notes_private} />
                )}
                
                <hr className="my-3" />
                
                {/* Links */}
                {can("View Initial Link(onside)") && data.project_init_link && (
                  <div className="row mb-3">
                    <div className="col-4">
                      <span className="fw-semibold text-muted" style={{ fontSize: "0.95rem", userSelect: "text" }}>Admin Link:</span>
                    </div>
                    <div className="col-8">
                      <a href={data.project_init_link} target="_blank" rel="noreferrer" className="text-primary" style={{ fontSize: "0.95rem", userSelect: "text" }}>
                        View Link
                      </a>
                    </div>
                  </div>
                )}
                {data.project_final_link && (
                  <div className="row mb-3">
                    <div className="col-4">
                      <span className="fw-semibold text-muted" style={{ fontSize: "0.95rem", userSelect: "text" }}>Estimator Link:</span>
                    </div>
                    <div className="col-8">
                      <a href={data.project_final_link} target="_blank" rel="noreferrer" className="text-primary" style={{ fontSize: "0.95rem", userSelect: "text" }}>
                        View Link
                      </a>
                    </div>
                  </div>
                )}
                
                <hr className="my-3" />
                
                {/* Budget Info */}
                {can("View Budget") && (
                  <>
                    <DataField label="Total Budget" value={`$${data.budget_total}`} show={!!data.budget_total} />
                    {can("View Deduction") && (
                      <DataField label="Deduction" value={`$${data.deduction_amount}`} show={!!data.deduction_amount} />
                    )}
                    <DataField label="Final Price" value={`$${data.budget_total - (data.deduction_amount ?? 0)}`} show={!!data.budget_total} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Team Member Scores (Only for Super Admin) */}
          {isSuperAdmin && (
            <div className="col-12 col-lg-6">
              <div className="card border-primary shadow-sm">
                <div className="card-body p-4">
                  <h5 className="card-title mb-4" style={{ color: "#1890ff", fontWeight: "700", fontSize: "1.1rem" }}>
                    👥 Team Member Scores
                  </h5>
                  
                  {/* Stats Grid */}
                  <div className="row g-3 mb-4">
                    <div className="col-4">
                      <div className="p-3 rounded" style={{ backgroundColor: "#f0f5ff", border: "1px solid #b3d8ff" }}>
                        <div className="fw-semibold text-muted" style={{ fontSize: "0.85rem", userSelect: "text" }}>Total Points</div>
                        <div className="h4 mb-0 text-primary fw-bold" style={{ userSelect: "text" }}>{totalPoints}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-3 rounded" style={{ backgroundColor: "#e6f7ff", border: "1px solid #91d5ff" }}>
                        <div className="fw-semibold text-muted" style={{ fontSize: "0.85rem", userSelect: "text" }}>Used</div>
                        <div className="h4 mb-0 text-info fw-bold" style={{ userSelect: "text" }}>{usedPoints}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-3 rounded" style={{ backgroundColor: leftPoints < 0 ? "#fff2e8" : "#f6ffed", border: `1px solid ${leftPoints < 0 ? "#ffbb96" : "#b7eb8f"}` }}>
                        <div className="fw-semibold text-muted" style={{ fontSize: "0.85rem", userSelect: "text" }}>Remaining</div>
                        <div className={`h4 mb-0 fw-bold ${leftPoints < 0 ? "text-danger" : "text-success"}`} style={{ userSelect: "text" }}>
                          {leftPoints}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <hr className="my-4" />
                  
                  {/* Members Section */}
                  {members.length > 0 ? (
                    <>
                      <h6 className="mb-3 fw-bold" style={{ fontSize: "1rem", color: "#262626" }}>Team Members:</h6>
                      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                        {members.map((m, idx) => (
                          <div key={m.id} className="mb-3 p-3 rounded" style={{ backgroundColor: idx % 2 === 0 ? "#fafafa" : "#fff", border: "1px solid #f0f0f0", transition: "all 0.2s" }}>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-semibold mb-2" style={{ fontSize: "0.95rem", color: "#262626", userSelect: "text" }}>
                                  {m.user?.name || "Unknown User"}
                                </div>
                                <div className="text-muted" style={{ fontSize: "0.85rem", userSelect: "text" }}>
                                  Current Points: <span className="fw-bold text-primary">{Number(m.points_gain || 0)}</span>
                                </div>
                              </div>
                              <div>
                                <InputNumber
                                  size="large"
                                  value={Number(m.points_gain || 0)}
                                  min={0}
                                  max={totalPoints}
                                  onChange={(v) => handleChange(m.id, v)}
                                  style={{ width: "100px", fontSize: "0.95rem" }}
                                  prefix={<span style={{ fontSize: "0.85rem" }}>pts</span>}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        className="btn btn-primary w-100 mt-4"
                        disabled={loading}
                        style={{ fontSize: "0.95rem", padding: "0.6rem", fontWeight: "600" }}
                        onClick={handleUpdate}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Updating...
                          </>
                        ) : (
                          "💾 Update All Scores"
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-muted mb-0" style={{ fontSize: "0.95rem", userSelect: "text" }}>
                        📭 No members have joined this project yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const onFilterTextBoxChanged = useCallback(
    debounce(() => {
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
    }, 300),
    [isSSRM]
  );

  const isSelf = url.includes("/project/self");

  const onGridReady = useCallback((params) => {
    gridRef.current = params;

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

       {/* Project Chat Modal */}
      <ProjectChatModal
        isOpen={isChatModalOpen}
        onClose={() => {
          setIsChatModalOpen(false);
          if (selectedProjectForChat) {
            const projectId = selectedProjectForChat.id;
            if (gridRef.current?.api) {
              const rowNode = gridRef.current.api.getRowNode(projectId);
              if (rowNode) {
                rowNode.setData({
                  ...rowNode.data,
                  unread_count: 0
                });
              }
            }
            if (setRowData) {
              setRowData(prev => prev.map(p => p.id === projectId ? { ...p, unread_count: 0 } : p));
            }
          }
        }}
        project={selectedProjectForChat}
        auth={auth}
      />
    </>
  );
};
export default React.memo(ProjectsTable);
