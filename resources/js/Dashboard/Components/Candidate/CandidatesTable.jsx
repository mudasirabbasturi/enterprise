import { useState, useEffect } from "react";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import {
  router,
  useRoute, // ziggy routing
  Tooltip,
  Popconfirm,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@shared/ui";

const CandidatesTable = ({ candidates, showDrawer }) => {
  const route = useRoute();
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([
    {
      headerName: "Name",
      headerTooltip: "Candiate Name",
      field: "name",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      pinned: "left",
      cellRenderer: (params) => {
        if (params.data?.name) {
          return params.data?.name;
        }
        return "⭕❌❌🚫";
      },
    },
    {
      headerName: "CV/Resume",
      field: "media",
      width: 200,
      filter: false,
      sortable: false,
      editable: false,
      cellRenderer: (params) => {
        const cvFiles =
          params.data.media
            ?.filter((m) => m.category === "cv")
            ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) ||
          [];
        const latestCV = cvFiles[0];
        if (!latestCV) return <>No CV</>;
        return (
          <a
            href={`/storage/${latestCV.file_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="d-inline-block"
          >
            Download CV
          </a>
        );
      },
    },
    {
      headerName: "Job Letter",
      field: "media",
      filter: false,
      sortable: false,
      editable: false,
      cellRenderer: (params) => {
        const jobLetterFiles =
          params.data.media
            ?.filter((m) => m.category === "job_letter")
            ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) ||
          [];
        const jobLetter = jobLetterFiles[0];
        if (!jobLetter)
          return (
            <>
              ❌❌{" "}
              <button
                className="btn btn-sm btn-primary"
                onClick={() => showDrawer("GenerateJobLetter", params.data)}
              >
                Generate
              </button>
            </>
          );
        return (
          <div className="d-flex">
            <a
              href={`/storage/${jobLetter.file_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-info me-1 text-white"
            >
              View Letter
            </a>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => showDrawer("GenerateJobLetter", params.data)}
            >
              Re Generate
            </button>
          </div>
        );
      },
    },
    {
      headerName: "Email",
      headerTooltip: "Candiate Email",
      field: "email",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      cellRenderer: (params) => {
        if (params.data?.email) {
          return params.data?.email;
        }
        return "⭕❌❌🚫";
      },
    },
    {
      headerName: "Phone",
      headerTooltip: "Candiate Phone",
      field: "phone",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      cellRenderer: (params) => {
        if (params.data?.phone) {
          return params.data?.phone;
        }
        return "⭕❌❌🚫";
      },
    },
    {
      headerName: "Position Applied",
      headerTooltip: "Candiate To Position Applied",
      field: "position_applied",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      cellRenderer: (params) => {
        if (params.data?.position_applied) {
          return params.data?.position_applied;
        }
        return "⭕❌❌🚫";
      },
    },
    {
      headerName: "Cover Letter",
      headerTooltip: "Candiate Cover Letter",
      field: "cover_letters",
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
      cellRenderer: (params) => {
        if (params.data?.cover_letters) {
          return params.data?.cover_letters;
        }
        return "⭕❌❌🚫";
      },
    },
    {
      headerName: "Application Status",
      field: "status",
      headerTooltip: "Candidate Application Status",
      pinned: "right",
      editable: false,
      width: "150",
      cellRenderer: (params) => {
        const status = params.data.status;
        const statusClasses = {
          pending: "status-pending",
          under_review: "status-under-review",
          on_hold: "status-on-hold",
          active: "status-active",
          accepted: "status-accepted",
          declined: "status-declined",
          draft: "status-draft",
          future_consideration: "status-future-consideration",
        };

        const statusClass = statusClasses[status] || "status-default";

        return (
          <button className={`btn btn-sm status-badge ${statusClass}`}>
            {status.replace(/_/g, " ")}
          </button>
        );
      },
    },
    {
      headerName: "Job Letter Status",
      field: "job_letter",
      headerTooltip: "Job Offer Letter Status",
      pinned: "right",
      editable: false,
      width: "150",
      cellRenderer: (params) => {
        const jobLetter = params.data.job_letter;
        const jobLetterClasses = {
          draft: "job-letter-draft",
          sent: "job-letter-sent",
          accepted: "job-letter-accepted",
          declined: "job-letter-declined",
          pending: "job-letter-pending",
        };

        const jobLetterClass =
          jobLetterClasses[jobLetter] || "job-letter-default";

        return (
          <button className={`btn btn-sm job-letter-badge ${jobLetterClass}`}>
            {jobLetter.replace(/_/g, " ")}
          </button>
        );
      },
    },
    {
      headerName: "Issue Date",
      headerTooltip: "Job Letter Status",
      field: "job_letter_issue_date",
      pinned: "right",
      floatingFilter: false,
      filter: "agDateColumnFilter",
      width: "100",
      cellRenderer: (params) => {
        if (params.data?.job_letter_issue_date) {
          return params.data?.job_letter_issue_date;
        }
        return "Not Issued.";
      },
    },
    {
      headerName: "Action",
      filter: false,
      editable: false,
      sortable: false,
      pinned: "right",
      width: 150,
      cellRenderer: (params) => (
        <>
          <div className="btn-group btn-group-sm">
            <Tooltip
              title={`View And Change Status`}
              color="orange"
              placement="leftTop"
            >
              <button
                className="btn btn-sm me-1 text-white"
                style={{ background: "#fc5b11b4" }}
                onClick={() => showDrawer("EditView", params.data)}
              >
                <EyeOutlined /> /
                <EditOutlined />
              </button>
            </Tooltip>
            <Tooltip
              title={`Delete Jop Applicant`}
              color="red"
              placement="leftTop"
            >
              <Popconfirm
                title={`Are you sure you want to delete "${params.data.name}"?`}
                onConfirm={() => confirmDelJobApplicant(params.data.id)}
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
    setRowData(candidates);
  }, [candidates]);

  const confirmDelJobApplicant = (id) =>
    new Promise((resolve) => {
      const url = route("user.destroy", id);
      router.delete(url, {
        preserveScroll: true,
        onSuccess: () => {
          resolve();
        },
        onError: () => {
          message.error("Failed to delete user");
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
        theme={gridTheme}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </>
  );
};
export default CandidatesTable;
