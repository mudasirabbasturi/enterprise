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

const AddDepartment = forwardRef(
  ({ onClose, setParentLoading, branches }, ref) => {
    const route = useRoute();

    const defaultValues = {
      name: "",
      branch_id: "",
      email: "",
      phone: "",
      fax: "",
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
      router.post(route("department.store"), values, {
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
                  Select Branch:
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                </label>
                <Select
                  style={{ width: "100%" }}
                  value={values.branch_id || null}
                  onChange={(data) => onChangeValue("branch_id", data)}
                  placeholder="Select Branch"
                  allowClear
                  showSearch
                  options={branches.map((branch) => ({
                    value: branch.id,
                    label: branch.name,
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
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                </label>
                <Input
                  className="w-100"
                  placeholder="Department Name"
                  allowClear
                  value={values.name}
                  onChange={(e) => onChangeValue("name", e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="d-flex align-items-center mb-2">
                <label
                  className="me-1 w-auto"
                  style={{ whiteSpace: "nowrap" }}
                  for="email"
                >
                  Email:<br></br>
                  Default Branch Email:
                </label>
                <Input
                  className="w-100"
                  placeholder="Department Email"
                  type="email"
                  allowClear
                  value={values.email}
                  onChange={(e) => onChangeValue("email", e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="d-flex align-items-center mb-2">
                <label
                  className="me-1 w-auto"
                  style={{ whiteSpace: "nowrap" }}
                  for="phone"
                >
                  Phone Number: <br></br>
                  Default Branch Phone:
                </label>
                <Input
                  placeholder="Department Phone"
                  allowClear
                  value={values.phone}
                  onChange={(e) => onChangeValue("phone", e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="d-flex align-items-center mb-2">
                <label
                  className="me-1 w-auto"
                  style={{ whiteSpace: "nowrap" }}
                  for="fax"
                >
                  Fax Number:<br></br>
                  Default Branch Fax:
                </label>
                <Input
                  placeholder="Department Fax"
                  allowClear
                  value={values.fax}
                  onChange={(e) => onChangeValue("fax", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="col-6">
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
          </div>
        </div>
      </>
    );
  }
);
export default AddDepartment;
