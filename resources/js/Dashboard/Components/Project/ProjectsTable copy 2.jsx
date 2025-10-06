import { useState, useEffect, useRef } from "react";
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
} from "@shared/ui";
import axios from "axios";
import NProgress from "nprogress";
const ProjectsTable = ({ projects, showDrawer, setRowData, api, onClose }) => {
  const hasPermission = (userpermission, permName) =>
    userpermission?.some((p) => p.name === permName);
  const { auth } = usePage().props;

  const { props } = usePage();
  const userPermissions = props?.auth?.user?.role?.permissions ?? [];
  const can = (perm) => hasPermission(userPermissions, perm);

  const user = props?.auth?.user ?? {};
  const permissions = props?.permissions ?? []; // master list

  const hasViewProjectTeamPermission =
    Array.isArray(userPermissions) &&
    userPermissions.some((perm) => perm.name === "View Project Team");

  const hasViewScoreDetailsPermission =
    Array.isArray(userPermissions) &&
    userPermissions.some((perm) => perm.name === "View Score Details");

  const hasViewPersonalScoreDetailsPermission =
    Array.isArray(userPermissions) &&
    userPermissions.some((perm) => perm.name === "View Personal Score Details");

  const hasDeleteProjectPermission =
    Array.isArray(userPermissions) &&
    userPermissions.some((perm) => perm.name === "Delete Project");

  // Update permission

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

  const columnPermissions = {
    project_title: "View Project Title",
    project_address: "View Project Address",
    client_id: "View Client Personal",
    client_name: "View Client Personal",
    client_email: "View Client Personal",
    client_phone: "View Client Personal",
    client_notes: "View Client Personal",
    project_admin_notes: "View Admin Notes",
    project_notes_estimator: "View Estimator Notes",
    notes_private: "View ClientAdmin Notes",
    project_init_link: "View Initial Link",
    project_final_link: "View Final Link",
    project_pricing: "View Project Pricing",
    project_area: "View Project Area",
    project_construction_type: "View Construction Type",
    project_line_items_pricing: "View LineItems Pricing",
    project_floor_number: "View Floor Number",
    project_main_scope: "View Main Scope",
    project_scope_details: "View Scope Details",
    project_template: "View Project Template",
    project_due_date: "View Due Date",
    budget_total: "View Budget",
    deduction_amount: "View Deduction",
    final_Price: "View Budget",
    project_points: "View All Points",
    project_status: "View Project Status",
    project_source: "View Project Source",
  };

  const canShowColumn = (field) => {
    const perm = columnPermissions[field];
    return !perm || can(perm);
  };

  const applyColumnPermissions = (columns) =>
    columns.filter((col) => canShowColumn(col.field));
  const [colDefs, setColDefs] = useState(
    applyColumnPermissions([
      {
        headerName: "Project Points",
        headerTooltip: "Estimator Points",
        field: "project_points",
        cellRenderer: "agGroupCellRenderer",
        cellRendererParams: {
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
                          const members =
                            params.data.project_team_members || [];
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
            return text.length > 100 ? text.substring(0, 100) + "..." : text;
          } else {
            return "⭕❌❌🚫";
          }
        },
      },
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
            return text.length > 100 ? text.substring(0, 100) + "..." : text;
          } else {
            return "⭕❌❌🚫";
          }
        },
      },
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

      {
        headerName: "Client Notes Only Admin",
        headerTooltip: "Client Notes only admin or autorised by admin",
        field: "notes_private",
        cellRenderer: (params) => {
          if (params.data?.notes_private) {
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
        headerName: "OnSide Link / Admin",
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
      {
        headerName: "OffSide Link / Estimator",
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
                <Tooltip
                  title={`Delete Project`}
                  color="red"
                  placement="leftTop"
                >
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
    ])
  );

  useEffect(() => {
    setRowData(projects);
  }, [projects]);

  // add project channel
  useEffect(() => {
    const channel = window.Echo.channel("project-channel");
    const handler = (data) => {
      if (data.project) {
        if (user.email !== data.userEmail) {
          setRowData((prev) => [data.project, ...prev]);
        }
      }
    };
    channel.listen(".event-project-created", handler);
    return () => {
      channel.stopListening(".event-project-created", handler);
    };
  }, []);

  // join project channel
  useEffect(() => {
    const channel = window.Echo.channel("project-channel");
    const handler = (data) => {
      if (data.project) {
        if (user.email !== data.userEmail) {
          setRowData((prev) =>
            prev.map((p) => (p.id === data.project.id ? data.project : p))
          );
        }
      }
    };
    channel.listen(".event-project-joined", handler);
    return () => {
      channel.stopListening(".event-project-joined", handler);
    };
  }, []);

  // delete project channel
  useEffect(() => {
    const channel = window.Echo.channel("project-channel");
    const handler = (data) => {
      if (data.project) {
        if (user.email !== data.userEmail) {
          setRowData((prev) =>
            prev.filter((item) => item.id !== Number(data.project.id))
          );
        }
      }
    };
    channel.listen(".event-project-delete", handler);
    return () => {
      channel.stopListening(".event-project-delete", handler);
    };
  }, []);

  // leave join project
  useEffect(() => {
    const channel = window.Echo.channel("project-channel");
    const handler = (data) => {
      if (data.project) {
        if (user.email !== data.userEmail) {
          setRowData((prev) =>
            prev.map((proj) =>
              proj.id === data.project.id ? data.project : proj
            )
          );
        }
      }
    };
    channel.listen(".event-project-leave", handler);
    return () => {
      channel.stopListening(".event-project-leave", handler);
    };
  }, []);

  const confirmDelProject = async (id) => {
    try {
      const { data } = await axios.delete(route("project.destroy", id));
      if (data.project) {
        api.success({
          message: "Success",
          description: data.message,
          placement: "topRight",
        });
        setRowData((prev) =>
          prev.filter((item) => item.id !== Number(data.project.id))
        );
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
        setRowData((prev) =>
          prev.map((proj) =>
            proj.id === data.project.id ? data.project : proj
          )
        );
      }
    } catch (error) {
      api.error({
        message: "error",
        description: "Failed to remove from joined project",
        placement: "topRight",
      });
    } finally {
    }
  };

  const gridOptions = {
    masterDetail: true,
    detailRowAutoHeight: true,
    onCellDoubleClicked: (params) => {
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
          setRowData?.((prev) =>
            prev.map((row) =>
              row.id === response.project.id ? response.project : row
            )
          );
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
              className={`font-semibold ${
                leftPoints < 0 ? "text-red-500" : "text-green-600"
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
                  {m.user?.name || "Unknown"}:{" "}
                  <InputNumber
                    size="small"
                    value={Number(m.points_gain || 0)}
                    min={0}
                    onChange={(v) => handleChange(m.id, v)}
                  />{" "}
                  Points
                </li>
              ))}
            </ul>
            <button
              className="btn btn-sm btn-primary mt-2"
              disabled={loading}
              onClick={handleUpdate}
            >
              {loading ? "Updating..." : "Update All"}
            </button>
          </>
        ) : (
          <p className="italic text-gray-500 mt-3">
            No members have joined this project yet.
          </p>
        )}
      </div>
    );
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
        sideBar={sideBarConfig}
        onGridReady={gridOptionsConfig.onGridReady}
        onColumnMoved={gridOptionsConfig.onColumnMoved}
        onColumnPinned={gridOptionsConfig.onColumnPinned}
        onColumnVisible={gridOptionsConfig.onColumnVisible}
        onColumnResized={gridOptionsConfig.onColumnResized}
        onSortChanged={gridOptionsConfig.onSortChanged}
        detailCellRenderer={DetailCellRenderer}
      />
    </>
  );
};
export default ProjectsTable;
