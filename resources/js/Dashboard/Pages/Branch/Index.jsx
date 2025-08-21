import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";

import {
  Link,
  router,
  usePage, // InertiaJS
  useRoute, // ziggy routing
  Breadcrumb,
  notification,
  Tooltip,
  Popconfirm,
  Drawer,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  CloseOutlined,
  SyncOutlined, // ant icon
} from "@shared/ui";
import MyRichTextEditor from "@component/Shared/MyRichTextEditor";
// Lazy-load the Branch components
const AddBranch = lazy(() => import("@component/Branch/AddBranch"));
const EditBranch = lazy(() => import("@component/Branch/EditBranch"));
const ViewBranch = lazy(() => import("@component/Branch/ViewBranch"));

const Index = ({ branches }) => {
  const route = useRoute();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([
    {
      headerName: "Branch Name",
      headerTooltip: "Branch Name",
      field: "name",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      pinned: "left",
    },
    {
      headerName: "Main/Sub",
      headerTooltip: "Is Main Branch Or Sub Branch",
      field: "is_main",
      editable: false,
      cellRenderer: (params) => {
        return params.data.is_main === true ? "Main Branch" : "Sub Branch";
      },
    },
    {
      headerName: "Email",
      headerTooltip: "Branch Email",
      field: "email",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      cellRenderer: (params) => {
        return params.data.email ? params.data.email : "Not Added";
      },
    },
    {
      headerName: "Phone",
      headerTooltip: "Branch Phone",
      field: "phone",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      cellRenderer: (params) => {
        return params.data.phone ? params.data.phone : "Not Added";
      },
    },
    {
      headerName: "Fax",
      headerTooltip: "Branch Fax",
      field: "fax",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      cellRenderer: (params) => {
        return params.data.fax ? params.data.fax : "Not Added";
      },
    },
    {
      headerName: "Notes",
      headerTooltip: "PayGrade Notes",
      field: "notes",
      cellEditor: MyRichTextEditor,
      cellEditorPopup: true,
      cellRenderer: (params) => {
        const div = document.createElement("div");
        div.innerHTML = params.value || "<i>No Notes</i>";
        const text = div.textContent || div.innerText || "";
        return text.length > 100 ? text.substring(0, 100) + "..." : text;
      },
    },
    {
      headerName: "Action",
      filter: false,
      editable: false,
      sortable: false,
      pinned: "right",
      cellRenderer: (params) => (
        <>
          <div className="btn-group btn-group-sm">
            <Tooltip
              title={`View Branch With Full Record`}
              color="green"
              placement="leftTop"
            >
              <button
                className="btn btn-success btn-sm me-1"
                onClick={() => showDrawer("view", params.data)}
              >
                <EyeOutlined />
              </button>
            </Tooltip>
            <Tooltip title={`Edit Branch`} color="orange" placement="leftTop">
              <button
                className="btn btn-warning btn-sm me-1"
                onClick={() => showDrawer("edit", params.data)}
              >
                <EditOutlined />
              </button>
            </Tooltip>
            <Tooltip title={`Delete Branch`} color="red" placement="leftTop">
              <Popconfirm
                title={`Are you sure you want to delete "${params.data.name}"?`}
                onConfirm={() => confirmDelBranch(params.data.id)}
                okText="Yes"
                cancelText="No"
              >
                <DeleteOutlined className="btn btn-danger btn-sm" />
              </Popconfirm>
            </Tooltip>
          </div>
        </>
      ),
    },
  ]);

  useEffect(() => {
    setRowData(branches);
  }, [branches]);

  // Add \ View \ Edit Branch
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add"); // "add" | "view" | "edit"
  const [data, setData] = useState(null);
  const showDrawer = (mode, data = null) => {
    setOpen(true);
    setDrawerMode(mode);
    setData(data);
  };
  const onClose = () => {
    setOpen(false);
    setData(null);
  };

  const childRef = useRef();
  const handleParentSubmit = () => {
    if (childRef.current) {
      childRef.current.submitForm();
    }
  };

  // Popconfirm Branch Delete
  const confirmDelBranch = (id) =>
    new Promise((resolve) => {
      const url = route("branch.destroy", id);
      router.delete(url, {
        preserveScroll: true,
        onSuccess: () => {
          resolve();
        },
        onError: () => {
          message.error("Failed to delete department");
        },
      });
    });

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
            items={[{ title: <Link href="/">Home</Link> }, { title: "Branch" }]}
          />
          <button
            icon={loading ? <SyncOutlined spin /> : null}
            className="btn btn-primary btn-sm"
            onClick={() => {
              setLoading(true);
              showDrawer("add");
              setTimeout(() => {
                setLoading(false);
              }, 300);
            }}
          >
            Add Branch
          </button>
        </div>
        <div className="ag-grid-wrapper">
          <AgGridReact
            rowData={rowData}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            theme={gridTheme}
            pagination={true}
            paginationAutoPageSize={true}
          />
        </div>
      </div>
      {/* Open Drawer With Add \ View \ Edit Mode. */}
      <Drawer
        title={
          drawerMode === "add"
            ? "Add Branch"
            : drawerMode === "edit"
            ? "Edit Branch"
            : "View Branch Full Detail: "
        }
        closable={{ "aria-label": "Close Button" }}
        placement="left"
        width={"90%"}
        onClose={onClose}
        open={open}
        maskClosable={false}
        extra={
          drawerMode === "view" ? (
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
                  ? "Add Branch"
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
              <AddBranch
                setParentLoading={setLoading}
                ref={childRef}
                onClose={onClose}
              />
            ) : drawerMode === "edit" ? (
              <EditBranch
                data={data}
                setParentLoading={setLoading}
                ref={childRef}
                onClose={onClose}
              />
            ) : (
              <ViewBranch data={data} />
            ))}
        </Suspense>
      </Drawer>
    </>
  );
};
export default Index;
