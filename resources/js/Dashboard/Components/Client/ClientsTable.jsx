import { useState, useEffect, useRef } from "react";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import {
  router,
  useRoute,
  Tooltip,
  Popconfirm,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@shared/ui";
import MyRichTextEditor from "@component/Shared/MyRichTextEditor";

const ClientsTable = ({ clients, showDrawer }) => {
  const route = useRoute();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([
    {
      headerName: "Title",
      headerTooltip: "Client Title",
      field: "title",
      pinned: "left",
      cellRenderer: (params) => {
        if (params.data?.title) {
          return params.data?.title;
        }
        return "⭕❌❌🚫";
      },
    },
    {
      headerName: "Client Name",
      headerTooltip: "Client Name",
      field: "name",
      cellRenderer: (params) => {
        if (params.data?.name) {
          return params.data?.name;
        }
        return "⭕❌❌🚫";
      },
    },
    {
      headerName: "Email",
      headerTooltip: "Client Email",
      field: "email",
      cellRenderer: (params) => {
        if (params.data?.email) {
          return params.data?.email;
        }
        return "⭕❌❌🚫";
      },
    },
    {
      headerName: "Phone",
      headerTooltip: "Client Phone",
      field: "phone",
      cellRenderer: (params) => {
        if (params.data?.phone) {
          return params.data?.phone;
        }
        return "⭕❌❌🚫";
      },
    },
    {
      headerName: "Notes",
      headerTooltip: "Client Notes",
      field: "notes",
      cellEditor: MyRichTextEditor,
      cellEditorPopup: true,
      cellRenderer: (params) => {
        if (params.data?.notes) {
          const div = document.createElement("div");
          div.innerHTML = params.value || "<i>No Notes</i>";
          const text = div.textContent || div.innerText || "";
          return text.length > 100 ? text.substring(0, 100) + "..." : text;
        }
        return "⭕❌❌🚫";
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
          <div class="btn-group btn-group-sm">
            <Tooltip
              title={`View Client With Full Record`}
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
            <Tooltip title={`Edit Client`} color="orange" placement="leftTop">
              <button
                className="btn btn-warning btn-sm me-1"
                onClick={() => showDrawer("edit", params.data)}
              >
                <EditOutlined />
              </button>
            </Tooltip>
            <Tooltip title={`Delete Client`} color="red" placement="leftTop">
              <Popconfirm
                title={`Are you sure you want to delete "${params.data.name}"?`}
                onConfirm={() => confirmDelClient(params.data.id)}
                okText="Yes"
                cancelText="No"
              >
                <DeleteOutlined
                  style={{ border: "1px dashed red" }}
                  className="btn btn-danger btn-sm"
                />
              </Popconfirm>
            </Tooltip>
          </div>
        </>
      ),
    },
  ]);

  useEffect(() => {
    setRowData(clients);
  }, [clients]);

  // Popconfirm Client Delete
  const confirmDelClient = (id) =>
    new Promise((resolve) => {
      const url = route("client.destroy", id);
      router.delete(url, {
        preserveScroll: true,
        onSuccess: () => {
          resolve();
        },
        onError: () => {
          message.error("Failed to delete Client");
        },
      });
    });

  return (
    <>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={{
          ...defaultColDef,
          flex: undefined,
        }}
        components={{ MyRichTextEditor }}
        theme={gridTheme}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </>
  );
};
export default ClientsTable;
