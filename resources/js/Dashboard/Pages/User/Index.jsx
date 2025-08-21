import { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  Link,
  router,
  usePage, // InertiaJS
  useRoute, // ziggy routing
  Breadcrumb,
  notification,
  Drawer,
} from "@shared/ui";

// Lazy-load components
const UsersTable = lazy(() => import("@component/User/UsersTable"));
const AddUser = lazy(() => import("@component/User/AddUser"));
const EditUser = lazy(() => import("@component/User/EditUser"));
const ViewUser = lazy(() => import("@component/User/ViewUser"));
const Media = lazy(() => import("@component/Media/Index"));
const EditUserColumn = lazy(() => import("@component/User/EditUserColumn"));

const Index = ({ users, roles, branches, departments, designations }) => {
  const route = useRoute();
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState(null);
  const showDrawer = (mode, data = null) => {
    setDrawerMode(mode);
    setSelectedUser(data);
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const childRef = useRef();
  const handleParentSubmit = () => {
    if (childRef.current) {
      childRef.current.submitForm();
    }
  };
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
  {
    /** Flash Messages End */
  }
  return (
    <>
      {contextHolder}
      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
          <Breadcrumb
            className="breadCrumb"
            items={[{ title: <Link href="/">Home</Link> }, { title: "User" }]}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => showDrawer("add")}
          >
            Add User
          </button>
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
            <UsersTable users={users} showDrawer={showDrawer} />
          </Suspense>
        </div>
      </div>
      {/* Drawer */}
      <Drawer
        title={
          drawerMode === "add"
            ? "Add User"
            : drawerMode === "edit"
            ? "Edi User"
            : drawerMode === "view"
            ? "View User"
            : drawerMode === "EditUserColumn"
            ? "Edit Inline Column Value"
            : "Add | Edit Media"
        }
        closable={false}
        placement="left"
        width={"90%"}
        onClose={onClose}
        open={open}
        maskClosable={false}
        extra={
          ["view", "media"].includes(drawerMode) ? (
            <button className="btn btn-primary btn-sm" onClick={onClose}>
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
                  ? "Add User"
                  : ["edit", "EditUserColumn"].includes(drawerMode)
                  ? "Save Changes"
                  : "Close"}
              </button>
            </>
          )
        }
      >
        <Suspense fallback={<div>Loading form...</div>}>
          {open &&
            (drawerMode === "add" ? (
              <AddUser
                setParentLoading={setLoading}
                ref={childRef}
                onClose={onClose}
                roles={roles}
                branches={branches}
                departments={departments}
                designations={designations}
              />
            ) : drawerMode === "edit" ? (
              <EditUser
                onClose={onClose}
                data={selectedUser}
                setParentLoading={setLoading}
                ref={childRef}
                roles={roles}
                branches={branches}
                departments={departments}
                designations={designations}
              />
            ) : drawerMode === "view" ? (
              <ViewUser
                onClose={onClose}
                data={selectedUser}
                setParentLoading={setLoading}
                ref={childRef}
                branches={branches}
                departments={departments}
                designations={designations}
              />
            ) : drawerMode === "EditUserColumn" ? (
              <EditUserColumn
                setParentLoading={setLoading}
                ref={childRef}
                field={selectedUser?.field}
                value={selectedUser?.value}
                id={selectedUser?.id}
                roles={roles}
                branches={branches}
                departments={departments}
                designations={designations}
                onClose={onClose}
              />
            ) : (
              <Media
                onClose={onClose}
                data={selectedUser}
                ownerType="user"
                ownerId={selectedUser.id}
                setParentLoading={setLoading}
                ref={childRef}
              />
            ))}
        </Suspense>
      </Drawer>
    </>
  );
};
export default Index;
