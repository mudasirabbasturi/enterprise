import React, { useState, useImperativeHandle, forwardRef } from "react";
import {
  router,
  useRoute, // ziggy routing
  Input,
  PhoneInput,
} from "@shared/ui";
const { TextArea } = Input;

import "react-international-phone/style.css";

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

const EditClient = forwardRef(({ onClose, setParentLoading, data }, ref) => {
  const route = useRoute();
  const defaultValues = {
    id: data.id,
    title: data.title,
    name: data.name,
    email: data.email,
    phone: data.phone,
    notes: data.notes,
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
    router.put(route("client.update", values.id), values, {
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
      <div className="container m-0 mb-4">
        <div className="row">
          <div className="col-6">
            {/* Name, Eamil, Phone */}
            <div>
              <hr className="mt-2 mb-2"></hr>
              <h6 className="m-0" style={{ color: "blue" }}>
                Title \ Name \ Email \ Phone
              </h6>
              <hr className="mt-2 mb-2"></hr>
              <div className="d-flex align-items-center mb-3">
                <label
                  className="me-1"
                  style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                  htmlFor="name"
                >
                  Title:
                  <hr className="mb-1 mt-0"></hr>
                  <hr className="mb-1 mt-0"></hr>
                  <hr className="mb-1 mt-0"></hr>
                </label>
                <Input
                  placeholder="Client Title"
                  value={values.title}
                  onChange={(e) => onChangeValue("title", e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="d-flex align-items-center mb-3">
                <label
                  className="me-1"
                  style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                  htmlFor="name"
                >
                  Full Name:
                  <hr className="mb-1 mt-0"></hr>
                  <hr className="mb-1 mt-0"></hr>
                  <hr className="mb-1 mt-0"></hr>
                </label>
                <Input
                  placeholder="Client Full Name"
                  value={values.name}
                  onChange={(e) => onChangeValue("name", e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="d-flex align-items-center mb-3">
                <label
                  className="me-1"
                  style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                  htmlFor="email"
                >
                  Client Email:
                  <hr className="mb-1 mt-0"></hr>
                  <hr className="mb-1 mt-0"></hr>
                  <hr className="mb-1 mt-0"></hr>
                </label>
                <Input
                  className="me-1"
                  placeholder="Client Email"
                  value={values.email}
                  onChange={(e) => onChangeValue("email", e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="d-flex align-items-center mb-3">
                <label
                  className="me-1"
                  style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                  htmlFor="phone"
                >
                  Client Phone:
                  <hr className="mb-1 mt-0"></hr>
                  <hr className="mb-1 mt-0"></hr>
                  <hr className="mb-1 mt-0"></hr>
                </label>
                <Input
                  className="me-1"
                  placeholder="Client Phone"
                  value={values.phone}
                  onChange={(e) => onChangeValue("phone", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          <div className="col-6">
            {/* Notes, Private Notes DOB & Status */}
            <div>
              <hr className="mt-2 mb-2"></hr>
              <h6 className="m-0" style={{ color: "blue" }}>
                Notes \ Private Notes:
              </h6>
              <hr className="mt-2 mb-2"></hr>
              <div className="mb-3">
                <label
                  htmlFor="notes"
                  className="me-1"
                  style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                >
                  Client Notes:<hr className="m-0"></hr>
                </label>
                <Editor
                  disabled={loading}
                  init={{
                    height: 150,
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
      </div>
    </>
  );
});
export default EditClient;
