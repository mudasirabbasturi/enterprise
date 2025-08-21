import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Drawer, notification, usePage } from "@shared/ui";

// Lazy-load Project Component
const ProjectHeader = lazy(() => import("@component/Project/ProjectHeader"));
const ProjectsTable = lazy(() => import("@component/Project/ProjectsTable"));
const AddProject = lazy(() => import("@component/Project/AddProject"));
const ViewProject = lazy(() => import("@component/Project/ViewProject"));
const EditProject = lazy(() => import("@component/Project/EditProject"));
const EditColumn = lazy(() => import("@component/Project/EditColumn"));
const JoinProject = lazy(() =>
  import("@component/Project/TeamMembers/JoinProject")
);
const ViewJoinProject = lazy(() =>
  import("@component/Project/TeamMembers/ViewJoinProject")
);
const EditJoinProject = lazy(() =>
  import("@component/Project/TeamMembers/EditJoinProject")
);
const AddEditPoint = lazy(() =>
  import("@component/Project/TeamMembers/AddEditPoint")
);

const Index = ({ projects, clients }) => {
  const [open, setOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add");
  const [selectedProject, setSelectedProject] = useState(null);

  const showDrawer = (mode, projectData = null) => {
    setDrawerMode(mode);
    setSelectedProject(projectData);
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
  };

  const [loading, setLoading] = useState(false);
  const childRef = useRef();
  const handleParentSubmit = () => {
    if (childRef.current) {
      childRef.current.submitForm();
    }
  };

  // Flash Messages
  const { flash, errors } = usePage().props;
  const [api, contextHolder] = notification.useNotification();
  useEffect(() => {
    if (flash.message) {
      api.success({
        message: "Success",
        description: flash.message,
        placement: "topRight",
      });
    }
  }, [flash]);
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, messages]) => {
        const errorText = Array.isArray(messages)
          ? messages.join(", ")
          : messages;
        api.error({
          message: "Validation Error",
          description: errorText,
          placement: "topRight",
        });
      });
    }
  }, [errors]);
  return (
    <>
      {contextHolder}
      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
          <Suspense
            fallback={
              <div
                style={{
                  width: "100%",
                  textAlign: "center",
                }}
              >
                Loading...
              </div>
            }
          >
            <ProjectHeader showDrawer={showDrawer} />
          </Suspense>
        </div>
        <div className="ag-grid-wrapper">
          <Suspense
            fallback={
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                Loading...
              </div>
            }
          >
            <ProjectsTable projects={projects} showDrawer={showDrawer} />
          </Suspense>
        </div>
      </div>

      <Drawer
        title={
          drawerMode === "add"
            ? "Add Project"
            : drawerMode === "edit"
            ? "Edi Project"
            : drawerMode === "view"
            ? "View Project"
            : drawerMode === "JoinProject"
            ? "Join Project Task"
            : drawerMode === "EditJoinProject"
            ? "Update Project Task"
            : drawerMode === "ViewJoinMemberDetail"
            ? "View Members Detail"
            : drawerMode === "EditColumn"
            ? "Edit Inline Column Value"
            : "Add / Edit Points"
        }
        closable={false}
        maskClosable={false}
        placement="left"
        width={"90%"}
        onClose={onClose}
        open={open}
        extra={
          [
            "view",
            "JoinProject",
            "EditJoinProject",
            "ViewJoinMemberDetail",
            "AddEditPoint",
          ].includes(drawerMode) ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
          ) : (
            <>
              <button
                className="btn btn-primary btn-sm me-2"
                disabled={loading}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleParentSubmit}
                disabled={loading}
              >
                {drawerMode === "add"
                  ? "Add Project"
                  : drawerMode === "edit"
                  ? "Save Changes"
                  : drawerMode === "EditColumn"
                  ? "Save Changes"
                  : "Close"}
              </button>
            </>
          )
        }
      >
        {open && (
          <Suspense fallback={<div>Loading...</div>}>
            {drawerMode === "add" ? (
              <AddProject
                setParentLoading={setLoading}
                ref={childRef}
                onClose={onClose}
                clients={clients}
              />
            ) : drawerMode === "edit" ? (
              <EditProject
                setParentLoading={setLoading}
                ref={childRef}
                onClose={onClose}
                project={selectedProject}
                clients={clients}
              />
            ) : drawerMode === "view" ? (
              <ViewProject onClose={onClose} project={selectedProject} />
            ) : drawerMode === "JoinProject" ? (
              <JoinProject
                setParentLoading={setLoading}
                ref={childRef}
                project={selectedProject}
                onClose={onClose}
              />
            ) : drawerMode === "EditJoinProject" ? (
              <EditJoinProject
                setParentLoading={setLoading}
                ref={childRef}
                project={selectedProject}
                onClose={onClose}
              />
            ) : drawerMode === "ViewJoinMemberDetail" ? (
              <ViewJoinProject onClose={onClose} project={selectedProject} />
            ) : drawerMode === "EditColumn" ? (
              <EditColumn
                setParentLoading={setLoading}
                ref={childRef}
                field={selectedProject?.field}
                value={selectedProject?.value}
                id={selectedProject?.id}
                clients={clients}
                onClose={onClose}
              />
            ) : drawerMode === "AddEditPoint" ? (
              <AddEditPoint
                member_id={selectedProject?.member_id}
                name={selectedProject?.name}
                points_gain={selectedProject?.points_gain}
                project={selectedProject}
                onClose={onClose}
                setParentLoading={setLoading}
                ref={childRef}
              />
            ) : null}
          </Suspense>
        )}
      </Drawer>
    </>
  );
};
export default Index;
