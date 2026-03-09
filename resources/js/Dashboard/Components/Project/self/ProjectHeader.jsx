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

  const Total = props.selfProjectCounts.Total;
  const All = props.selfProjectCounts.All;
  const TakeoffOnProgress = props.selfProjectCounts.TakeoffOnProgress;
  const PricingOnProgress = props.selfProjectCounts.PricingOnProgress;
  const Completed = props.selfProjectCounts.Completed;
  const Hold = props.selfProjectCounts.Hold;
  const Revision = props.selfProjectCounts.Revision;
  const Cancelled = props.selfProjectCounts.Cancelled;
  const Deliver = props.selfProjectCounts.Deliver;

  // Global counts for dropdown
  const gCounts = props.projectCounts;

  const globalMenu = (
    <Menu>
      {can("View All Projects") && (
        <Menu.Item key="all">
          <Link href={route("project.index")}>
            All Projects ({gCounts.All})
          </Link>
        </Menu.Item>
      )}
      {can("View Pending Projects") && (
        <Menu.Item key="pending">
          <Link href={route("project.status", { status: "Pending" })}>
            Pending ({gCounts.Pending})
          </Link>
        </Menu.Item>
      )}
      {can("View Takeoff On Progress Projects") && (
        <Menu.Item key="takeoff">
          <Link href={route("project.status", { status: "Takeoff On Progress" })}>
            Takeoff In Progress ({gCounts.TakeoffOnProgress})
          </Link>
        </Menu.Item>
      )}
      {can("View Pricing On Progress Projects") && (
        <Menu.Item key="pricing">
          <Link href={route("project.status", { status: "Pricing On Progress" })}>
            Pricing In Progress ({gCounts.PricingOnProgress})
          </Link>
        </Menu.Item>
      )}
      {can("View Completed Projects") && (
        <Menu.Item key="completed">
          <Link href={route("project.status", { status: "Completed" })}>
            Completed ({gCounts.Completed})
          </Link>
        </Menu.Item>
      )}
      {can("View Revision Projects") && (
        <Menu.Item key="revision">
          <Link href={route("project.status", { status: "Revision" })}>
            Revision ({gCounts.Revision})
          </Link>
        </Menu.Item>
      )}
      {can("View Hold Projects") && (
        <Menu.Item key="hold">
          <Link href={route("project.status", { status: "Hold" })}>
            Hold ({gCounts.Hold})
          </Link>
        </Menu.Item>
      )}
      {can("View Deliver Projects") && (
        <Menu.Item key="deliver">
          <Link href={route("project.status", { status: "Deliver" })}>
            Deliver ({gCounts.Deliver})
          </Link>
        </Menu.Item>
      )}
      {can("View Cancelled Projects") && (
        <Menu.Item key="cancelled">
          <Link href={route("project.status", { status: "Cancelled" })}>
            Cancelled ({gCounts.Cancelled})
          </Link>
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <>
      <Breadcrumb
        className="breadCrumb"
        items={[{ title: <Link href="/">Home</Link> }, { title: "Projects" }]}
      />
      <div className="d-flex align-items-center">
        <Dropdown overlay={globalMenu} placement="bottomLeft">
          <Button size="small" className="me-3">
            Global Projects <CaretDownOutlined />
          </Button>
        </Dropdown>

        <span>Self: </span>
        <Link
          className={`btn btn-sm position-relative me-1 ${isActive("project.index") ? "active-status" : "inactive-status"
            }`}
          href={route("project.self.status", { status: "Recent" })}
        >
          Recent All
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
        <Link
          className={`btn btn-sm position-relative me-1 ${isActive("project.self.status", "Takeoff On Progress")
              ? "active-status-progress"
              : "inactive-status"
            }`}
          href={route("project.self.status", { status: "Takeoff On Progress" })}
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
        <Link
          className={`btn btn-sm position-relative me-1 ${isActive("project.self.status", "Pricing On Progress")
              ? "active-status-pricing"
              : "inactive-status"
            }`}
          href={route("project.self.status", { status: "Pricing On Progress" })}
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
        <Link
          className={`btn btn-sm position-relative me-1 ${isActive("project.self.status", "Completed")
              ? "active-status-completed"
              : "inactive-status"
            }`}
          href={route("project.self.status", { status: "Completed" })}
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
        <Link
          className={`btn btn-sm position-relative me-1 ${isActive("project.self.status", "Revision")
              ? "active-status-revision"
              : "inactive-status"
            }`}
          href={route("project.self.status", { status: "Revision" })}
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
        <Link
          className={`btn btn-sm position-relative me-1 ${isActive("project.self.status", "Hold")
              ? "active-status-hold"
              : "inactive-status"
            }`}
          href={route("project.self.status", { status: "Hold" })}
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
        <Link
          className={`btn btn-sm position-relative me-1 ${isActive("project.self.status", "Deliver")
              ? "active-status-deliver"
              : "inactive-status"
            }`}
          href={route("project.self.status", { status: "Deliver" })}
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
        <Link
          className={`btn btn-sm position-relative me-1 ${isActive("project.self.status", "Cancelled")
              ? "active-status-hold"
              : "inactive-status"
            }`}
          href={route("project.self.status", { status: "Cancelled" })}
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
        <Link
          className={`btn btn-sm position-relative me-1 ${isActive("project.index") ? "active-status" : "inactive-status"
            }`}
          href={route("project.self.status", { status: "All" })}
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
            {Total}
          </span>
        </Link>
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
