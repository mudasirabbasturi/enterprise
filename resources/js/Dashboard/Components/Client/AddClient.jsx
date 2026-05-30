import React, { useState, useImperativeHandle, forwardRef } from "react";
import {
  router,
  useRoute, // ziggy routing
  Input,
  usePage,
} from "@shared/ui";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
const { TextArea } = Input;

const AddClient = forwardRef(({ onClose, setParentLoading }, ref) => {
  const hasPermission = (userpermission, permName) => userpermission?.some((p) => p.name === permName);
  const { props } = usePage();
  const userPermissions = props?.auth?.user?.role?.permissions ?? [];
  const can = (perm) => hasPermission(userPermissions, perm);
  const route = useRoute();
  const defaultValues = {
    name: "",
    title: "",
    email: "",
    phone: "",
    notes: "",
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
    router.post(route("client.store"), values, {
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
                {can("Add Title") && (
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
                        allowClear
                      />
                    </div>
                )}
                {can("Add Name") && (
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
                        allowClear
                      />
                    </div>
                )}
                {can("Add Email") && (
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
                        allowClear
                      />
                    </div>
                )}
                {can("Add Phone") && (
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
                        allowClear
                      />
                    </div>
                )}
              
            </div>
          </div>
          <div className="col-6">
            {/* Notes, Private Notes DOB & Status */}
            {can("Add Notes") && (
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
              )}
          </div>
        </div>
      </div>
    </>
  );
});
export default AddClient;
