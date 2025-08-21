import {
  Link,
  ProjectOutlined,
  CheckCircleOutlined,
  UsergroupAddOutlined,
  CiOutlined,
  BranchesOutlined,
  BankOutlined,
  BulbOutlined,
  GatewayOutlined,
  FileDoneOutlined,
  SettingOutlined,
} from "@shared/ui";

// 🔑 helper function to check permission
const hasPermission = (userpermission, permName) =>
  userpermission?.some((p) => p.name === permName);

export const getSidebarItems = ({
  route,
  user,
  permissions,
  userpermission,
}) => {
  const can = (perm) => hasPermission(userpermission, perm);

  return [
    // Project Management
    ...(can("View Projects Data Table")
      ? [
          {
            key: "project",
            label: "Project Management",
            icon: <ProjectOutlined style={{ fontSize: "20px" }} />,
            children: [
              ...(can("View All Projects")
                ? [
                    {
                      key: "all-projects",
                      label: (
                        <Link href={route("project.index")}>All Projects</Link>
                      ),
                      icon: <CheckCircleOutlined />,
                    },
                  ]
                : []),

              ...(can("View Pending")
                ? [
                    {
                      key: "pending",
                      label: (
                        <Link
                          href={route("project.status", { status: "Pending" })}
                        >
                          Project Pending
                        </Link>
                      ),
                      icon: <CheckCircleOutlined />,
                    },
                  ]
                : []),
              ...(can("View Takeoff On Progress")
                ? [
                    {
                      key: "takeoff-in-progress",
                      label: (
                        <Link
                          href={route("project.status", {
                            status: "Takeoff On Progress",
                          })}
                        >
                          Takeoff In Progress
                        </Link>
                      ),
                      icon: <CheckCircleOutlined />,
                    },
                  ]
                : []),
              ...(can("View Pricing On Progress")
                ? [
                    {
                      key: "pricing-in-progress",
                      label: (
                        <Link
                          href={route("project.status", {
                            status: "Pricing On Progress",
                          })}
                        >
                          Pricing In Progress
                        </Link>
                      ),
                      icon: <CheckCircleOutlined />,
                    },
                  ]
                : []),
              ...(can("View Completed")
                ? [
                    {
                      key: "completed",
                      label: (
                        <Link
                          href={route("project.status", {
                            status: "Completed",
                          })}
                        >
                          Project Completed
                        </Link>
                      ),
                      icon: <CheckCircleOutlined />,
                    },
                  ]
                : []),
              ...(can("View Revision")
                ? [
                    {
                      key: "revision",
                      label: (
                        <Link
                          href={route("project.status", { status: "Revision" })}
                        >
                          Project Revision
                        </Link>
                      ),
                      icon: <CheckCircleOutlined />,
                    },
                  ]
                : []),
              ...(can("View Hold")
                ? [
                    {
                      key: "hold",
                      label: (
                        <Link
                          href={route("project.status", { status: "Hold" })}
                        >
                          Project Hold
                        </Link>
                      ),
                      icon: <CheckCircleOutlined />,
                    },
                  ]
                : []),
              ...(can("View Deliver")
                ? [
                    {
                      key: "deliver",
                      label: (
                        <Link
                          href={route("project.status", { status: "Deliver" })}
                        >
                          Project Deliver
                        </Link>
                      ),
                      icon: <CheckCircleOutlined />,
                    },
                  ]
                : []),
              ...(can("View Cancelled")
                ? [
                    {
                      key: "hold",
                      label: (
                        <Link
                          href={route("project.status", {
                            status: "Cancelled",
                          })}
                        >
                          Project Cancelled
                        </Link>
                      ),
                      icon: <CheckCircleOutlined />,
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),

    // User
    ...(can("View User")
      ? [
          {
            key: "user",
            label: <Link href={route("user.index")}>User & Estimator</Link>,
            icon: <UsergroupAddOutlined style={{ fontSize: "20px" }} />,
          },
        ]
      : []),

    // Client
    ...(can("View Client")
      ? [
          {
            key: "client",
            label: <Link href={route("client.index")}>Client Management</Link>,
            icon: <CiOutlined style={{ fontSize: "20px" }} />,
          },
        ]
      : []),

    // Branch
    ...(can("View Branches")
      ? [
          {
            key: "branch",
            label: <Link href={route("branch.index")}>Branch Management</Link>,
            icon: <BranchesOutlined style={{ fontSize: "20px" }} />,
          },
        ]
      : []),

    // Department
    ...(can("View Department")
      ? [
          {
            key: "department",
            label: (
              <Link href={route("department.index")}>
                Department Management
              </Link>
            ),
            icon: <BankOutlined style={{ fontSize: "20px" }} />,
          },
        ]
      : []),

    // Designation
    ...(can("View Designation")
      ? [
          {
            key: "designation",
            label: (
              <Link href={route("designation.index")}>
                Designation Management
              </Link>
            ),
            icon: <BulbOutlined style={{ fontSize: "20px" }} />,
          },
        ]
      : []),

    // Role
    ...(can("View Role")
      ? [
          {
            key: "role",
            label: <Link href={route("role.index")}>Role & Permission</Link>,
            icon: <GatewayOutlined style={{ fontSize: "20px" }} />,
          },
        ]
      : []),

    // Job Application
    ...(can("View Job Application")
      ? [
          {
            key: "job-application",
            label: (
              <Link href={route("application.index")}>Job Application</Link>
            ),
            icon: <FileDoneOutlined style={{ fontSize: "20px" }} />,
          },
        ]
      : []),

    // Settings
    ...(can("View Setting")
      ? [
          {
            key: "setting",
            label: "Setting",
            icon: <SettingOutlined style={{ fontSize: "20px" }} />,
            children: [
              {
                key: "company-setting",
                label: <Link href="#">Company Setting</Link>,
                icon: <CheckCircleOutlined />,
              },
            ],
          },
        ]
      : []),
  ];
};
