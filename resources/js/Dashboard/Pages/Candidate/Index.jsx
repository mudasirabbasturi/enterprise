import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link, Breadcrumb, notification, usePage, Drawer } from "@shared/ui";

// Lazy-load Application Component
const CandidatesTable = lazy(() =>
  import("@component/Candidate/CandidatesTable")
);
const EditCandidate = lazy(() => import("@component/Candidate/EditCandidate"));
const GenerateJobLetter = lazy(() =>
  import("@component/Candidate/GenerateJobLetter")
);

const Index = ({ candidates }) => {
  const [open, setOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("EditView");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const showDrawer = (mode, data = null) => {
    setDrawerMode(mode);
    setSelectedCandidate(data);
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
          <Breadcrumb
            className="breadCrumb"
            items={[
              { title: <Link href="/">Home</Link> },
              { title: "Job Application" },
            ]}
          />
        </div>
        <div className="ag-grid-wrapper">
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
            <CandidatesTable candidates={candidates} showDrawer={showDrawer} />
          </Suspense>
        </div>
      </div>

      <Drawer
        title={
          drawerMode === "EditView"
            ? "Application Details..."
            : "Edit Job Letter,"
        }
        closable={false}
        placement="left"
        width={drawerMode === "EditView" ? "88%" : "100%"}
        onClose={onClose}
        open={open}
        maskClosable={false}
        extra={
          <>
            <button
              className="btn btn-outline-primary btn-sm me-2"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleParentSubmit}
              disabled={loading}
            >
              {drawerMode === "EditView"
                ? "Save Changes"
                : "Generate Job Letter"}
            </button>
          </>
        }
      >
        {open && (
          <Suspense fallback={<div>Loading...</div>}>
            {drawerMode === "EditView" ? (
              <EditCandidate
                setParentLoading={setLoading}
                ref={childRef}
                data={selectedCandidate}
                onClose={onClose}
              />
            ) : drawerMode === "GenerateJobLetter" ? (
              <GenerateJobLetter
                setParentLoading={setLoading}
                ref={childRef}
                data={selectedCandidate}
                onClose={onClose}
              />
            ) : (
              "null"
            )}
          </Suspense>
        )}
      </Drawer>
    </>
  );
};
export default Index;
