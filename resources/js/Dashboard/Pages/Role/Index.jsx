import { useState, useRef, useEffect, lazy, Suspense } from "react";
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

// Lazy-load the AddProject, View component
const AddRole = lazy(() => import("@component/Role/AddRole"));
const EditRole = lazy(() => import("@component/Role/EditRole"));
const ViewRole = lazy(() => import("@component/Role/ViewRole"));

const Index = ({ roles, permissions }) => {
  const { auth } = usePage().props;
  const currentUserRole = auth.user?.role?.name;
  const isCurrentUserSuperAdmin = currentUserRole === "Super Admin";

  const route = useRoute();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([
    {
      headerName: "Role",
      headerTooltip: "Role Name",
      field: "name",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      pinned: "left",
    },
    {
      headerName: "Notes",
      headerTooltip: "Role Notes",
      field: "notes",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      cellRenderer: (params) => {
        return params.data.notes ? params.data.notes : "None";
      },
    },
    // {
    //   headerName: "Action",
    //   filter: false,
    //   editable: false,
    //   sortable: false,
    //   pinned: "right",
    //   cellRenderer: (params) => (
    //     <>
    //       <div className="btn-group btn-group-sm">
    //         <Tooltip
    //           title={`View Role With Full Record`}
    //           color="green"
    //           placement="leftTop"
    //         >
    //           <button
    //             className="btn btn-success btn-sm me-1"
    //             onClick={() => showDrawer("view", params.data)}
    //           >
    //             <EyeOutlined />
    //           </button>
    //         </Tooltip>
    //         <Tooltip title={`Edit Role`} color="orange" placement="leftTop">
    //           <button
    //             className={`btn btn-warning btn-sm me-1 ${
    //               params.data.name === "Super Admin" ? "disabled" : ""
    //             }`}
    //             style={{
    //               cursor:
    //                 params.data.name === "Super Admin"
    //                   ? "not-allowed"
    //                   : "pointer",
    //             }}
    //             onClick={() => showDrawer("edit", params.data)}
    //             disabled={params.data.name === "Super Admin"}
    //           >
    //             <EditOutlined />
    //           </button>
    //         </Tooltip>
    //         <Tooltip
    //           title={
    //             params.data.name === "Super Admin"
    //               ? "Not Allowed"
    //               : "Delete Role"
    //           }
    //           color="red"
    //           placement="leftTop"
    //         >
    //           <Popconfirm
    //             title={`Are you sure you want to delete "${params.data.name}"?`}
    //             onConfirm={() => confirmDelRole(params.data.id)}
    //             okText="Yes"
    //             cancelText="No"
    //             disabled={params.data.name === "Super Admin"}
    //           >
    //             <DeleteOutlined
    //               className={`btn btn-danger btn-sm ${
    //                 params.data.name === "Super Admin" ? "disabled" : ""
    //               }`}
    //               style={{
    //                 cursor:
    //                   params.data.name === "Super Admin"
    //                     ? "not-allowed"
    //                     : "pointer",
    //               }}
    //               disabled={params.data.name === "Super Admin"}
    //             />
    //           </Popconfirm>
    //         </Tooltip>
    //       </div>
    //     </>
    //   ),
    // },
    {
      headerName: "Action",
      filter: false,
      editable: false,
      sortable: false,
      pinned: "right",
      cellRenderer: (params) => {
        const isRowSuperAdmin = params.data.name === "Super Admin";

        // If row is Super Admin and current user is NOT Super Admin, hide edit/delete buttons
        if (isRowSuperAdmin && !isCurrentUserSuperAdmin) {
          return (
            <div className="btn-group btn-group-sm">
              <Tooltip
                title={`View Role With Full Record`}
                color="green"
                placement="leftTop"
              >
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => showDrawer("view", params.data)}
                >
                  <EyeOutlined />
                </button>
              </Tooltip>
            </div>
          );
        }

        // Normal buttons for all other cases
        return (
          <div className="btn-group btn-group-sm">
            <Tooltip
              title={`View Role With Full Record`}
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
            <Tooltip title={`Edit Role`} color="orange" placement="leftTop">
              <button
                className="btn btn-warning btn-sm me-1"
                onClick={() => showDrawer("edit", params.data)}
              >
                <EditOutlined />
              </button>
            </Tooltip>
            <Tooltip title="Delete Role" color="red" placement="leftTop">
              <Popconfirm
                title={`Are you sure you want to delete "${params.data.name}"?`}
                onConfirm={() => confirmDelRole(params.data.id)}
                okText="Yes"
                cancelText="No"
              >
                <DeleteOutlined className="btn btn-danger btn-sm" />
              </Popconfirm>
            </Tooltip>
          </div>
        );
      },
    },
  ]);

  useEffect(() => {
    setRowData(roles);
  }, [roles]);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add");
  const [data, setData] = useState(null);
  const showDrawer = (mode, data = null) => {
    setDrawerMode(mode);
    setData(data);
    setOpen(true);
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
  // Popconfirm Role Delete
  const confirmDelRole = (id) =>
    new Promise((resolve) => {
      const url = route("role.destroy", id);
      router.delete(url, {
        preserveScroll: true,
        onSuccess: () => {
          resolve();
        },
        onError: () => {
          message.error("Failed to delete role");
        },
      });
    });

  {
    /** Flash Messages */
  }
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
            items={[{ title: <Link href="/">Home</Link> }, { title: "Role" }]}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => showDrawer("add")}
          >
            Add Role
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
      <Drawer
        title={
          drawerMode === "add"
            ? "Add Role"
            : drawerMode === "edit"
            ? "Edit Role"
            : "View Role"
        }
        closable={{ "aria-label": "Close Button" }}
        placement="left"
        width={"90%"}
        onClose={onClose}
        open={open}
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
                disabled={
                  loading ||
                  (!isCurrentUserSuperAdmin && data.name === "Super Admin")
                }
              >
                {drawerMode === "add"
                  ? "Add Role"
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
              <AddRole
                setParentLoading={setLoading}
                ref={childRef}
                onClose={onClose}
                data={data}
                permissions={permissions}
              />
            ) : drawerMode === "edit" ? (
              <EditRole
                setParentLoading={setLoading}
                ref={childRef}
                onClose={onClose}
                data={data}
                permissions={permissions}
              />
            ) : (
              <ViewRole data={data} permissions={permissions} />
            ))}
        </Suspense>
      </Drawer>
    </>
  );
};
export default Index;
