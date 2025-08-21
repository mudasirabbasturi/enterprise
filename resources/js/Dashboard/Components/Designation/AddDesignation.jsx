import { useState, useImperativeHandle, forwardRef } from "react";
import {
  router,
  useRoute, // ziggy routing
  Input,
  Select,
} from "@shared/ui";

import { Editor } from "@tinymce/tinymce-react";
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/plugins/table";
import "tinymce/plugins/code";
import "tinymce/plugins/lists";
import "tinymce/plugins/link";
import "tinymce/skins/ui/oxide/skin.css";

const AddDesignation = forwardRef(
  ({ onClose, setParentLoading, departments }, ref) => {
    const route = useRoute();

    const defaultValues = {
      name: "",
      department_id: "",
      notes: "",
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
      router.post(route("designation.store"), values, {
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
                  allowClear
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
                  allowClear
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
                <Editor
                  disabled={loading}
                  init={{
                    height: 180,
                    menubar: false,
                    plugins: "table code lists link",
                    toolbar:
                      "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                    skin: false,
                    content_css: false,
                  }}
                  value={values.notes}
                  onEditorChange={(content, editor) => {
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
export default AddDesignation;
