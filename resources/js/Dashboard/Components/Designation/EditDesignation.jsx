import { useState, useImperativeHandle, forwardRef } from "react";
import {
  router,
  useRoute, // ziggy routing
  Input,
  Select,
} from "@shared/ui";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const EditDesignation = forwardRef(
  ({ data, departments, onClose, setParentLoading }, ref) => {
    const route = useRoute();

    const defaultValues = {
      id: data.id,
      name: data.name,
      department_id: data.department_id,
      notes: data.notes,
    };
    const [values, setValues] = useState(defaultValues);
    const [loading, setLoading] = useState(false);

    const onChangeValue = (key, value) => {
      setValues((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

    const handleSubmit = () => {
      setLoading(true);
      setParentLoading?.(true);
      router.put(route("designation.update", values.id), values, {
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
        <div className="container-fluid">
          <div className="row">
            <div className="col-6">
              <div className="d-flex align-items-center mb-2">
                <label className="me-1 w-auto" style={{ whiteSpace: "nowrap" }}>
                  Select Department:
                  <hr className="m-0 mb-1" />
                  <hr className="m-0 mb-1" />
                  <hr className="m-0 mb-1" />
                </label>
                <Select
                  style={{ width: "100%" }}
                  value={values.department_id || null}
                  onChange={(data) => onChangeValue("department_id", data)}
                  placeholder="Select Branch"
                  showSearch
                  options={departments.map((dep) => ({
                    value: dep.id,
                    label: dep.name,
                  }))}
                  disabled={loading}
                />
              </div>
              <div className="d-flex align-items-center mb-2">
                <label
                  className="me-1 w-auto"
                  style={{ whiteSpace: "nowrap" }}
                  for="name"
                >
                  Name:
                  <hr className="m-0 mb-1" />
                  <hr className="m-0 mb-1" />
                  <hr className="m-0 mb-1" />
                </label>
                <Input
                  className="w-100"
                  placeholder="Designation Name"
                  value={values.name}
                  onChange={(e) => onChangeValue("name", e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="mb-2">
                <label
                  className="w-auto"
                  style={{ whiteSpace: "nowrap" }}
                  for="notes"
                >
                  Notes:
                </label>
                <ReactQuill
                    theme="snow"
                  readOnly={loading}
                    value={values.notes}
                  onChange={(content, editor) => {
                    onChangeValue("notes", content);
                  }}
                />
              </div>
            </div>
            <div className="col-6"></div>
          </div>
        </div>
      </>
    );
  }
);
export default EditDesignation;
