import { useState, useImperativeHandle, forwardRef } from "react";
import {
  router,
  useRoute, // ziggy routing
  Input,
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

const { TextArea } = Input;
const EditBranch = forwardRef(({ data, onClose, setParentLoading }, ref) => {
  const route = useRoute();

  const defaultValues = {
    id: data.id,
    name: data.name,
    is_main: false,
    type: data.type,
    status: "active",
    email: data.email,
    phone: data.phone,
    fax: data.fax,
    country: data.country,
    state: data.state,
    city: data.city,
    address: data.address,
    postal_zip_code: data.postal_zip_code,
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
    router.put(route("branch.update", values.id), values, {
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
          <div className="col-12 col-md-6">
            <div className="mb-2">
              <div className="d-flex align-items-center">
                <label
                  className="me-1 w-auto"
                  style={{ whiteSpace: "nowrap" }}
                  for="name"
                >
                  Branch Name:
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                </label>
                <Input
                  className="me-1 w-100"
                  placeholder="Branch Name"
                  value={values.name}
                  onChange={(e) => onChangeValue("name", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mb-2">
              <div className="d-flex align-items-center">
                <label
                  className="me-1 w-auto"
                  style={{ whiteSpace: "nowrap" }}
                  for="email"
                >
                  Branch Email:
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                </label>
                <Input
                  className="me-1 w-100"
                  placeholder="Branch Email"
                  type="email"
                  value={values.email}
                  onChange={(e) => onChangeValue("email", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mb-2">
              <div className="d-flex align-items-center">
                <label
                  className="me-1 w-auto"
                  style={{ whiteSpace: "nowrap" }}
                  for="phone"
                >
                  Branch Phone:
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                </label>
                <Input
                  className="me-1 w-100"
                  placeholder="Branch Phone"
                  value={values.phone}
                  onChange={(e) => onChangeValue("phone", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mb-2">
              <div className="d-flex align-items-center">
                <label
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                  for="fax"
                >
                  Branch Fax:
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                </label>
                <Input
                  className="me-1 w-100"
                  placeholder="Branch Fax"
                  value={values.fax}
                  onChange={(e) => onChangeValue("fax", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mb-2">
              <div className="d-flex align-items-center">
                <label
                  className="me-1 w-auto"
                  style={{ whiteSpace: "nowrap" }}
                  for="country"
                >
                  Branch Country:
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                </label>
                <Input
                  className="me-1 w-100"
                  placeholder="Branch Country"
                  value={values.country}
                  onChange={(e) => onChangeValue("country", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mb-2">
              <div className="d-flex align-items-center">
                <label
                  className="me-1 w-auto"
                  style={{ whiteSpace: "nowrap" }}
                  for="state"
                >
                  Branch State:
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                </label>
                <Input
                  className="me-1 w-100"
                  placeholder="Branch State"
                  value={values.state}
                  onChange={(e) => onChangeValue("state", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mb-2">
              <div className="d-flex align-items-center">
                <label
                  className="me-1 w-auto"
                  style={{ whiteSpace: "nowrap" }}
                  for="city"
                >
                  Branch City:
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                </label>
                <Input
                  className="me-1 w-100"
                  placeholder="Branch City"
                  value={values.city}
                  onChange={(e) => onChangeValue("city", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mb-2">
              <label
                className="mb-1 w-auto"
                style={{ whiteSpace: "nowrap" }}
                for="postal_zip_code"
              >
                Zip/Postal Code:
              </label>
              <Input
                className="w-100"
                placeholder="Branch Zip/Postal Code"
                type="text"
                value={values.postal_zip_code}
                onChange={(e) =>
                  onChangeValue("postal_zip_code", e.target.value)
                }
                disabled={loading}
              />
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="mb-2">
              <label
                className="w-auto"
                style={{ whiteSpace: "nowrap" }}
                for="address"
              >
                Branch Address:
              </label>
              <TextArea
                className="mb-2"
                autoSize={{ minRows: 3 }}
                placeholder="456 Elm Street, Suite 3, Los Angeles, CA 90001, USA"
                value={values.address}
                onChange={(e) => onChangeValue("address", e.target.value)}
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
        </div>
      </div>
    </>
  );
});
export default EditBranch;
