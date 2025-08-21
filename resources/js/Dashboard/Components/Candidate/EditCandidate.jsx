import { useState, useImperativeHandle, forwardRef } from "react";
import {
  router,
  useRoute, // ziggy routing
  Input,
  Select,
  Card,
} from "@shared/ui";
const EditCandidate = forwardRef(({ data, onClose, setParentLoading }, ref) => {
  const route = useRoute();

  const latestCV = data.media
    ?.filter((m) => m.category === "cv")
    ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

  const defaultValues = {
    id: data.id,
    status: data.status,
    job_letter: data.job_letter,
  };
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState(defaultValues);

  const onChangeValue = (key, value) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    setLoading(true);
    setParentLoading?.(true);
    router.put(route("job_letter.stats", values.id), values, {
      preserveScroll: true,
      onSuccess: () => {
        setValues(defaultValues);
        onClose();
      },
      onError: () => {
        setParentLoading?.(false);
        setLoading(false);
      },
      onFinish: () => {
        setParentLoading?.(false);
        setLoading(false);
      },
    });
  };

  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit,
  }));

  return (
    <>
      <div className="container">
        <div className="row">
          <div className="col-md-6 col-12">
            <Card
              title={`Job Application Detail:`}
              variant="borderless"
              style={{ width: "auto" }}
            >
              <ul style={{ listStyle: "circle" }}>
                <li style={{ fontStyle: "italic" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      fontStyle: "italic",
                      color: "#141010dd",
                    }}
                  >
                    Name:{" "}
                  </span>
                  {data.name}
                </li>
                <li style={{ fontStyle: "italic" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      fontStyle: "italic",
                      color: "#141010dd",
                    }}
                  >
                    Email:{" "}
                  </span>
                  {data.email}
                </li>
                <li style={{ fontStyle: "italic" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      fontStyle: "italic",
                      color: "#141010dd",
                    }}
                  >
                    Phone:{" "}
                  </span>
                  {data.phone}
                </li>
                <li style={{ fontStyle: "italic" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      fontStyle: "italic",
                      color: "#141010dd",
                    }}
                  >
                    Position Applied:{" "}
                  </span>
                  {data.position_applied}
                </li>
                <li>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      fontStyle: "italic",
                      color: "#141010dd",
                      textDecoration: "underline",
                    }}
                  >
                    Application Status:{" "}
                  </span>
                  <span
                    style={{
                      fontStyle: "italic",
                      textTransform: "capitalize",
                      fontSize: "16px",
                      marginLeft: "10px",
                      color: "#e28b09dd",
                    }}
                  >
                    {data.status}
                  </span>
                </li>
                <li>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      fontStyle: "italic",
                      color: "#141010dd",
                      textDecoration: "underline",
                    }}
                  >
                    Job Letter Status:{" "}
                  </span>
                  <span
                    style={{
                      fontStyle: "italic",
                      textTransform: "capitalize",
                      fontSize: "16px",
                      marginLeft: "10px",
                      color: "#e28b09dd",
                    }}
                  >
                    {data.job_letter}
                  </span>
                </li>
                <li>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      fontStyle: "italic",
                      color: "#141010dd",
                      textDecoration: "underline",
                    }}
                  >
                    Job Letter Issue Date{" "}
                  </span>
                  <span
                    style={{
                      fontStyle: "italic",
                      textTransform: "capitalize",
                      fontSize: "16px",
                      marginLeft: "10px",
                      color: "#e28b09dd",
                    }}
                  >
                    {data.issue_date ? data.issue_date : "Not Issued Yet Now!."}
                  </span>
                </li>
                <li style={{ fontStyle: "italic" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      fontStyle: "italic",
                      color: "#141010dd",
                    }}
                  >
                    CV:{" "}
                  </span>
                  {latestCV ? (
                    <a
                      href={latestCV.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#1a73e8",
                        textDecoration: "underline",
                      }}
                    >
                      Download CV
                    </a>
                  ) : (
                    "No CV availabel"
                  )}
                </li>
                <hr className="mb-1 mt-1" />
                <li>
                  Cover Letter:
                  <hr className="mb-1 mt-1" />
                  {data.cover_letters ? data.cover_letters : "Not Added."}
                </li>
              </ul>
            </Card>
          </div>
          <div className="col-md-6 col-12">
            <Card
              title="Application Form Status"
              variant="borderless"
              style={{ width: "auto" }}
            >
              <div className="w-100">
                <label className="w-100" htmlFor="application_status">
                  Application Status
                </label>
                <Select
                  className="w-100"
                  optionFilterProp="label"
                  showSearch
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "under_review", label: "Under Review" },
                    { value: "on_hold", label: "On Hold" },
                    { value: "active", label: "Active" },
                    { value: "accepted", label: "Accepted" },
                    { value: "declined", label: "Declined" },
                    { value: "draft", label: "Draft" },
                    {
                      value: "future_consideration",
                      label: "Future Consideration",
                    },
                  ]}
                  value={values.status || "pending"}
                  onChange={(status) =>
                    onChangeValue("status", status ?? "pending")
                  }
                  disabled={loading}
                />
              </div>
              <div className="mt-2 mb-2">
                <label className="w-100" htmlFor="job_letter_status">
                  Job Letter Status
                </label>
                <Select
                  className="w-100"
                  optionFilterProp="label"
                  showSearch
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "sent", label: "Sent" },
                    { value: "accepted", label: "Accepted" },
                    { value: "declined", label: "Decline" },
                    { value: "pending", label: "Pending" },
                  ]}
                  value={values.job_letter || "pending"}
                  onChange={(job_letter) =>
                    onChangeValue("job_letter", job_letter ?? "pending")
                  }
                  disabled={loading}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
});
export default EditCandidate;
