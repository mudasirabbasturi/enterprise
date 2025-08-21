import { useRoute, Link, Breadcrumb, usePage } from "@shared/ui";
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
  return (
    <>
      <Breadcrumb
        className="breadCrumb"
        items={[{ title: <Link href="/">Home</Link> }, { title: "Projects" }]}
      />
      <div>
        {/* All Projects */}
        {can("View All Projects") && (
          <Link
            className={`btn btn-sm me-1 ${
              isActive("project.index") ? "active-status" : "inactive-status"
            }`}
            href={route("project.index")}
          >
            All
          </Link>
        )}
        {/* Pending */}
        {can("View Pending") && (
          <Link
            className={`btn btn-sm me-1 ${
              isActive("project.status", "Pending") ||
              currentRouteName === "home.index"
                ? "active-status-pending"
                : "inactive-status"
            }`}
            href={route("project.status", { status: "Pending" })}
          >
            Pending
          </Link>
        )}
        {/* Takeoff On Progress */}
        {can("View Takeoff On Progress") && (
          <Link
            className={`btn btn-sm me-1 ${
              isActive("project.status", "Takeoff On Progress")
                ? "active-status-progress"
                : "inactive-status"
            }`}
            href={route("project.status", { status: "Takeoff On Progress" })}
          >
            Takeoff In Progress
          </Link>
        )}
        {/* Pricing On Progress */}
        {can("View Pricing On Progress") && (
          <Link
            className={`btn btn-sm me-1 ${
              isActive("project.status", "Pricing On Progress")
                ? "active-status-pricing"
                : "inactive-status"
            }`}
            href={route("project.status", { status: "Pricing On Progress" })}
          >
            Pricing In Progress
          </Link>
        )}
        {/* Completed */}
        {can("View Completed") && (
          <Link
            className={`btn btn-sm me-1 ${
              isActive("project.status", "Completed")
                ? "active-status-completed"
                : "inactive-status"
            }`}
            href={route("project.status", { status: "Completed" })}
          >
            Completed
          </Link>
        )}
        {/* Revision */}
        {can("View Revision") && (
          <Link
            className={`btn btn-sm me-1 ${
              isActive("project.status", "Revision")
                ? "active-status-revision"
                : "inactive-status"
            }`}
            href={route("project.status", { status: "Revision" })}
          >
            Revision
          </Link>
        )}
        {/* Hold */}
        {can("View Hold") && (
          <Link
            className={`btn btn-sm me-1 ${
              isActive("project.status", "Hold")
                ? "active-status-hold"
                : "inactive-status"
            }`}
            href={route("project.status", { status: "Hold" })}
          >
            Hold
          </Link>
        )}
        {/* Deliver */}
        {can("View Deliver") && (
          <Link
            className={`btn btn-sm me-1 ${
              isActive("project.status", "Deliver")
                ? "active-status-deliver"
                : "inactive-status"
            }`}
            href={route("project.status", { status: "Deliver" })}
          >
            Deliver
          </Link>
        )}
        {/* Canceled */}
        {can("View Cancelled") && (
          <Link
            className={`btn btn-sm me-1 ${
              isActive("project.status", "Cancelled")
                ? "active-status-hold"
                : "inactive-status"
            }`}
            href={route("project.status", { status: "Cancelled" })}
          >
            Cancelled
          </Link>
        )}
      </div>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => showDrawer("add")}
      >
        Add Project
      </button>
    </>
  );
};
export default ProjectHeader;
