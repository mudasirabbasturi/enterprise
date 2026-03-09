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
  SafetyOutlined,
  FileTextOutlined,
  FieldTimeOutlined,
  CreditCardOutlined,
  ScheduleOutlined
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
    ...(can("View Projects")
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

            ...(can("View Pending Projects")
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
            ...(can("View Takeoff On Progress Projects")
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
            ...(can("View Pricing On Progress Projects")
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
            ...(can("View Completed Projects")
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
            ...(can("View Revision Projects")
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
            ...(can("View Hold Projects")
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
            ...(can("View Deliver Projects")
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
            ...(can("View Cancelled Projects")
              ? [
                {
                  key: "cancelled",
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
    // ...(can("View Job Application")
    //   ? [
    //     {
    //       key: "job-application",
    //       label: (
    //         <Link href={route("application.index")}>Job Application</Link>
    //       ),
    //       icon: <FileDoneOutlined style={{ fontSize: "20px" }} />,
    //     },
    //   ]
    //   : []),

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

    {
      key: "privacy-policy",
      label: (
        <Link href={route("privacy.policy")}>Privacy Policy</Link>
      ),
      icon: <SafetyOutlined style={{ fontSize: "20px" }} />,

    },
    {
      key: "terms-conditions",
      label: (
        <Link href={route("terms.conditions")}>Terms & Conditions</Link>
      ),
      icon: <FileTextOutlined style={{ fontSize: "20px" }} />,
    },
    ...(can("View Shift") || can("View User Shift Schedule") || can("View User Allowed IP") || can("View User Attendance")
      ? [
        {
          key: "work-schedule",
          label: "Work Schedule",
          icon: <FieldTimeOutlined style={{ fontSize: "20px" }} />,
          children: [
            ...(can("View Shift")
              ? [
                {
                  key: "shifts",
                  label: <Link href={route("shifts.index")}>Shifts</Link>,
                  icon: <CheckCircleOutlined />,
                },
              ]
              : []),
            ...(can("View User Shift Schedule")
              ? [
                {
                  key: "users-schedules",
                  label: (
                    <Link href={route("users-schedules.index")}>Users Schedules</Link>
                  ),
                  icon: <CheckCircleOutlined />,
                },
              ]
              : []),
            // ...(can("View User Allowed IP")
            //   ? [
            //     {
            //       key: "allowed-ips",
            //       label: (
            //         <Link href={route("allowed-ips.index")}>Allowed IPs</Link>
            //       ),
            //       icon: <CheckCircleOutlined />,
            //     },
            //   ]
            //   : []),
            ...(can("View User Attendance")
              ? [
                {
                  key: "users-attendance",
                  label: (
                    <Link href={route("users-attendance.index")}>Users Attendance</Link>
                  ),
                  icon: <CheckCircleOutlined />,
                },
              ]
              : []),
          ],
        },
      ]
      : []),
    ...(can("View Leave Request") || can("View Leave Balance") || can("View Leave Type") || can("View Leave Policy") || can("View Holiday")
      ? [
        {
          key: "leave-management",
          label: "Leave Management",
          icon: <ScheduleOutlined style={{ fontSize: "20px" }} />,
          children: [
            ...(can("View Leave Request")
              ? [
                {
                  key: "leave-requests",
                  label: (
                    <Link href={route("leave-requests.index")}>Leave Requests</Link>
                  ),
                  icon: <CheckCircleOutlined />,
                },
              ]
              : []),
            ...(can("View Leave Balance")
              ? [
                {
                  key: "leave-balances",
                  label: (
                    <Link href={route("leave-balances.index")}>Leave Balances</Link>
                  ),
                  icon: <CheckCircleOutlined />,
                },
              ]
              : []),
            ...(can("View Leave Type")
              ? [
                {
                  key: "leave-types",
                  label: (
                    <Link href={route("leave-types.index")}>Leave Types</Link>
                  ),
                  icon: <CheckCircleOutlined />,
                },
              ]
              : []),
            ...(can("View Holiday")
              ? [
                {
                  key: "holidays",
                  label: (
                    <Link href={route("holidays.index")}>Holidays</Link>
                  ),
                  icon: <CheckCircleOutlined />,
                },
              ]
              : []),
          ],
        },
      ]
      : []),
    ...(can("View Salary Setup") ||
      can("View Salary Sheets") ||
      can("View Tax Management") ||
      can("View Salary Packages") ||
      can("View Penalty Management")
      ? [
        {
          key: "payroll-management",
          label: "Payroll Management",
          icon: <CreditCardOutlined style={{ fontSize: "20px" }} />,
          children: [

            ...(can("View Salary Setup")
              ? [
                {
                  key: "salary-setup",
                  label: (
                    <Link href={route("salary-setup.index")}>
                      Salary Setup
                    </Link>
                  ),
                  icon: <CheckCircleOutlined />,
                },
              ]
              : []),

            ...(can("View Salary Sheets")
              ? [
                {
                  key: "salary-sheets",
                  label: (
                    <Link href={route("salary-sheets.index")}>
                      Salary Sheets
                    </Link>
                  ),
                  icon: <CheckCircleOutlined />,
                },
              ]
              : []),

            ...(can("View Tax Management")
              ? [
                {
                  key: "tax-management",
                  label: (
                    <Link href={route("tax-management.index")}>
                      Tax Management
                    </Link>
                  ),
                  icon: <CheckCircleOutlined />,
                },
              ]
              : []),

            ...(can("View Salary Packages")
              ? [
                {
                  key: "salary-packages",
                  label: (
                    <Link href={route("salary-packages.index")}>
                      Salary Packages
                    </Link>
                  ),
                  icon: <CheckCircleOutlined />,
                },
              ]
              : []),

            ...(can("View Penalty Management")
              ? [
                {
                  key: "penalty-management",
                  label: (
                    <Link href={route("penalty-management.index")}>
                      Penalty Management
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
  ];
};
