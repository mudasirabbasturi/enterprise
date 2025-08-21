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
} from "@shared/ui";

// const EditPermission = lazy(() =>import("@component/Permission/EditPermission"));
const ViewPermission = lazy(() =>
  import("@component/Permission/ViewPermission")
);

const Index = ({ permissions }) => {
  const route = useRoute();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([
    {
      headerName: "Module",
      headerTooltip: "Module Name",
      field: "model",
      pinned: "left",
    },
    {
      headerName: "Permission",
      headerTooltip: "Permission Name",
      field: "name",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
    },
    {
      headerName: "Per Assign To Role",
      headerTooltip: "Assign To Role",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      valueGetter: (params) => {
        const roles = params.data.roles;
        if (!Array.isArray(roles)) return "";

        return roles.map((role) => role.name).join(", ");
      },
    },
    {
      headerName: "Notes",
      headerTooltip: "Permission Notes",
      field: "notes",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      cellRenderer: (params) => {
        return params.data.notes ? params.data.notes : "None";
      },
    },
  ]);

  useEffect(() => {
    setRowData(permissions);
  }, [permissions]);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("view");
  const [selectedPermission, setSelectedPermission] = useState(null);
  const showDrawer = (mode, data = null) => {
    setDrawerMode(mode);
    setSelectedPermission(data);
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
    setSelectedPermission(null);
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

  return (
    <>
      {contextHolder}
      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
          <Breadcrumb
            className="breadCrumb"
            items={[
              { title: <Link href="/">Home</Link> },
              { title: "Permission" },
            ]}
          />
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

      <Drawer
        title={
          drawerMode === "add"
            ? "Add Permission"
            : drawerMode === "edit"
            ? "Edit Permission"
            : "View Permission"
        }
        closable={{ "aria-label": "Close Button" }}
        placement="left"
        width={"90%"}
        onClose={onClose}
        open={open}
        extra={
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        }
      >
        <Suspense fallback={<div>Loading form...</div>}>
          {open && (
            <ViewPermission onClose={onClose} data={selectedPermission} />
          )}
        </Suspense>
      </Drawer>
    </>
  );
};
export default Index;
