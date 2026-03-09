import { useRoute, Link, Breadcrumb, usePage, Dropdown, Menu, Button, CaretDownOutlined } from "@shared/ui";

const ProjectHeader = ({ showDrawer }) => {
  const route = useRoute();
  const currentRouteName = route().current();
  const currentStatus = route().params.status ?? null;

  const hasPermission = (userpermission, permName) =>
    userpermission?.some((p) => p.name === permName);
  const { props } = usePage();
  const userPermissions = props.auth.user?.role?.permissions || [];
  const can = (perm) => hasPermission(userPermissions, perm);

  const isActive = (name, status = null) => {
    return (
      currentRouteName === name && (status === null || currentStatus === status)
    );
  };

  const Total = props.projectCounts.Total;
  const All = props.projectCounts.All;
  const Planned = props.projectCounts.Planned;
  const Pending = props.projectCounts.Pending;
  const TakeoffOnProgress = props.projectCounts.TakeoffOnProgress;
  const PricingOnProgress = props.projectCounts.PricingOnProgress;
  const Completed = props.projectCounts.Completed;
  const Hold = props.projectCounts.Hold;
  const Revision = props.projectCounts.Revision;
  const Cancelled = props.projectCounts.Cancelled;
  const Deliver = props.projectCounts.Deliver;


  const SelfAll = props.selfProjectCounts.All;
  const SelfTotal = props.selfProjectCounts.Total;

  const selfMenu = (
    <Menu>
      <Menu.Item key="recent">
        <Link href={route("project.self.status", { status: "Recent" })}>
          Recent All ({SelfAll})
        </Link>
      </Menu.Item>
      <Menu.Item key="takeoff">
        <Link href={route("project.self.status", { status: "Takeoff On Progress" })}>
          Takeoff In Progress ({props.selfProjectCounts.TakeoffOnProgress})
        </Link>
      </Menu.Item>
      <Menu.Item key="pricing">
        <Link href={route("project.self.status", { status: "Pricing On Progress" })}>
          Pricing In Progress ({props.selfProjectCounts.PricingOnProgress})
        </Link>
      </Menu.Item>
      <Menu.Item key="completed">
        <Link href={route("project.self.status", { status: "Completed" })}>
          Completed ({props.selfProjectCounts.Completed})
        </Link>
      </Menu.Item>
      <Menu.Item key="revision">
        <Link href={route("project.self.status", { status: "Revision" })}>
          Revision ({props.selfProjectCounts.Revision})
        </Link>
      </Menu.Item>
      <Menu.Item key="hold">
        <Link href={route("project.self.status", { status: "Hold" })}>
          Hold ({props.selfProjectCounts.Hold})
        </Link>
      </Menu.Item>
      <Menu.Item key="deliver">
        <Link href={route("project.self.status", { status: "Deliver" })}>
          Deliver ({props.selfProjectCounts.Deliver})
        </Link>
      </Menu.Item>
      <Menu.Item key="cancelled">
        <Link href={route("project.self.status", { status: "Cancelled" })}>
          Cancelled ({props.selfProjectCounts.Cancelled})
        </Link>
      </Menu.Item>
      <Menu.Item key="all_self">
        <Link href={route("project.self.status", { status: "All" })}>
          All ({SelfTotal})
        </Link>
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Breadcrumb
        className="breadCrumb"
        items={[{ title: <Link href="/">Home</Link> }, { title: "Projects" }]}
      />
      <div className="d-flex align-items-center flex-wrap">
        {can("View All Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 mb-2 ${isActive("project.index") ? "active-status" : "inactive-status"
              }`}
            href={route("project.index")}
          >
            All
            <span
              style={{
                position: "absolute",
                top: -12,
                right: -4,
                color: "inherit",
                backgroundColor: "inherit",
              }}
              className="badge border"
            >
              {All}
            </span>
          </Link>
        )}
        {can("View Pending Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 mb-2 ${isActive("project.status", "Pending") ||
              currentRouteName === "home.index"
              ? "active-status-pending"
              : "inactive-status"
              }`}
            href={route("project.status", { status: "Pending" })}
          >
            Pending
            <span
              style={{
                position: "absolute",
                top: -12,
                right: -4,
                color: "inherit",
                backgroundColor: "inherit",
              }}
              className="badge border"
            >
              {Pending}
            </span>
          </Link>
        )}
        {can("View Takeoff On Progress Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 mb-2 ${isActive("project.status", "Takeoff On Progress")
              ? "active-status-progress"
              : "inactive-status"
              }`}
            href={route("project.status", { status: "Takeoff On Progress" })}
          >
            Takeoff In Progress
            <span
              style={{
                position: "absolute",
                top: -12,
                right: -4,
                color: "inherit",
                backgroundColor: "inherit",
              }}
              className="badge border"
            >
              {TakeoffOnProgress}
            </span>
          </Link>
        )}
        {can("View Pricing On Progress Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 mb-2 ${isActive("project.status", "Pricing On Progress")
              ? "active-status-pricing"
              : "inactive-status"
              }`}
            href={route("project.status", { status: "Pricing On Progress" })}
          >
            Pricing In Progress
            <span
              style={{
                position: "absolute",
                top: -12,
                right: -4,
                color: "inherit",
                backgroundColor: "inherit",
              }}
              className="badge border"
            >
              {PricingOnProgress}
            </span>
          </Link>
        )}

        {can("View Completed Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 mb-2 ${isActive("project.status", "Completed")
              ? "active-status-completed"
              : "inactive-status"
              }`}
            href={route("project.status", { status: "Completed" })}
          >
            Completed
            <span
              style={{
                position: "absolute",
                top: -12,
                right: -4,
                color: "inherit",
                backgroundColor: "inherit",
              }}
              className="badge border"
            >
              {Completed}
            </span>
          </Link>
        )}

        {can("View Revision Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 mb-2 ${isActive("project.status", "Revision")
              ? "active-status-revision"
              : "inactive-status"
              }`}
            href={route("project.status", { status: "Revision" })}
          >
            Revision
            <span
              style={{
                position: "absolute",
                top: -12,
                right: -4,
                color: "inherit",
                backgroundColor: "inherit",
              }}
              className="badge border"
            >
              {Revision}
            </span>
          </Link>
        )}

        {can("View Hold Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 mb-2 ${isActive("project.status", "Hold")
              ? "active-status-hold"
              : "inactive-status"
              }`}
            href={route("project.status", { status: "Hold" })}
          >
            Hold
            <span
              style={{
                position: "absolute",
                top: -12,
                right: -4,
                color: "inherit",
                backgroundColor: "inherit",
              }}
              className="badge border"
            >
              {Hold}
            </span>
          </Link>
        )}

        {can("View Deliver Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 mb-2 ${isActive("project.status", "Deliver")
              ? "active-status-deliver"
              : "inactive-status"
              }`}
            href={route("project.status", { status: "Deliver" })}
          >
            Deliver
            <span
              style={{
                position: "absolute",
                top: -12,
                right: -4,
                color: "inherit",
                backgroundColor: "inherit",
              }}
              className="badge border"
            >
              {Deliver}
            </span>
          </Link>
        )}

        {can("View Cancelled Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 mb-2 ${isActive("project.status", "Cancelled")
              ? "active-status-hold"
              : "inactive-status"
              }`}
            href={route("project.status", { status: "Cancelled" })}
          >
            Cancelled
            <span
              style={{
                position: "absolute",
                top: -12,
                right: -4,
                color: "inherit",
                backgroundColor: "inherit",
              }}
              className="badge border"
            >
              {Cancelled}
            </span>
          </Link>
        )}

        <Dropdown overlay={selfMenu} placement="bottomLeft">
          <Button size="small" className="ms-2 mb-2">
            Self Projects <CaretDownOutlined />
          </Button>
        </Dropdown>
      </div>

      <div></div>
      {can("Create Project") && (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => showDrawer("add")}
        >
          Add Project
        </button>
      )}
    </>
  );
};
export default ProjectHeader;
