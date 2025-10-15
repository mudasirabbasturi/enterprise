import { useRoute, Link, Breadcrumb, usePage, Input } from "@shared/ui";
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

  return (
    <>
      <Breadcrumb
        className="breadCrumb"
        items={[{ title: <Link href="/">Home</Link> }, { title: "Projects" }]}
      />
      <div>
        {can("View All Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 ${
              isActive("project.index") ? "active-status" : "inactive-status"
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
            className={`btn btn-sm position-relative me-1 ${
              isActive("project.status", "Pending") ||
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
            className={`btn btn-sm position-relative me-1 ${
              isActive("project.status", "Takeoff On Progress")
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
            className={`btn btn-sm position-relative me-1 ${
              isActive("project.status", "Pricing On Progress")
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

        {/* Completed */}
        {can("View Completed Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 ${
              isActive("project.status", "Completed")
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

        {/* Revision */}
        {can("View Revision Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 ${
              isActive("project.status", "Revision")
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

        {/* Hold */}
        {can("View Hold Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 ${
              isActive("project.status", "Hold")
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

        {/* Deliver */}
        {can("View Deliver Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 ${
              isActive("project.status", "Deliver")
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

        {/* Cancelled */}
        {can("View Cancelled Projects") && (
          <Link
            className={`btn btn-sm position-relative me-1 ${
              isActive("project.status", "Cancelled")
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
        {/* <Input size="large" className="mt-1" /> */}
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
