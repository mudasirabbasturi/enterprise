import { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  Link,
  usePage, // InertiaJS
  useRoute, // ziggy routing
  Breadcrumb,
  notification,
  Drawer,
} from "@shared/ui";

// Lazy-load the Client, View component
const ClientsTable = lazy(() => import("@component/Client/ClientsTable"));
const AddClient = lazy(() => import("@component/Client/AddClient"));
const EditClient = lazy(() => import("@component/Client/EditClient"));
const ViewClient = lazy(() => import("@component/Client/ViewClient"));

const Index = ({ clients }) => {
  const route = useRoute();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add"); // "add" | "view" | "edit"
  const [selectedClient, setSelectedClient] = useState(null);
  const showDrawer = (mode, data = null) => {
    setDrawerMode(mode);
    setSelectedClient(data); // Set selected Client data
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
    setSelectedClient(null);
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
            items={[{ title: <Link href="/">Home</Link> }, { title: "Client" }]}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => showDrawer("add")}
          >
            Add Client
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
            <ClientsTable clients={clients} showDrawer={showDrawer} />
          </Suspense>
        </div>
      </div>

      <Drawer
        title={
          drawerMode === "add"
            ? "Add Client"
            : drawerMode === "edit"
            ? "Edit Client"
            : "View Client"
        }
        closable={{ "aria-label": "Close Button" }}
        placement="left"
        width={"90%"}
        onClose={onClose}
        open={open}
        extra={
          drawerMode === "view" ? (
            <button
              className="btn btn-outline-primary btn-sm me-2"
              onClick={onClose}
            >
              Close
            </button>
          ) : (
            <>
              <button
                className="btn btn-outline-primary btn-sm me-2"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleParentSubmit}
                disabled={loading}
              >
                {drawerMode === "add"
                  ? "Add Client"
                  : drawerMode === "edit"
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
              <AddClient
                onClose={onClose}
                setParentLoading={setLoading}
                ref={childRef}
              />
            ) : drawerMode === "edit" ? (
              <EditClient
                onClose={onClose}
                data={selectedClient}
                setParentLoading={setLoading}
                ref={childRef}
              />
            ) : (
              <ViewClient onClose={onClose} data={selectedClient} />
            ))}
        </Suspense>
      </Drawer>
    </>
  );
};
export default Index;
