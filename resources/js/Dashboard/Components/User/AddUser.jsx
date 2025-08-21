import React, { useState, useImperativeHandle, forwardRef } from "react";
import {
  router,
  useRoute, // ziggy routing
  Input,
  Select,
  DatePicker,
  dayjs,
  PhoneInput,
} from "@shared/ui";
const { TextArea } = Input;

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
const AddUser = forwardRef(
  (
    { onClose, roles, branches, departments, designations, setParentLoading },
    ref
  ) => {
    const route = useRoute();
    const defaultValues = {
      name: "",
      email: "",
      password: "",
      phone: "",
      country: "",
      state: "",
      city: "",
      postal_or_zip_code: "",
      permanent_address: "",
      current_address: "",
      picture_path: "",
      dob: "",
      joining_date: "",
      hiring_date: "",
      leaving_date: "",
      notes: "",
      notes_private: "",
      status: "active",
      branch_id: "",
      department_id: "",
      designation_id: "",
      role_id: "",
    };
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState(defaultValues);

    // Filter departments when a branch is selected
    const filteredDepartments = values.branch_id
      ? departments.filter((dep) => dep.branch_id === values.branch_id)
      : departments;

    // Filter designations when a branch is selected
    const filteredDesignations = values.department_id
      ? designations.filter((des) => des.department_id === values.department_id)
      : designations;

    const onChangeValue = (key, value) => {
      setValues((prev) => {
        const updated = { ...prev, [key]: value };
        if (key === "branch_id") {
          updated.department_id = null;
          updated.designation_id = null;
        }
        if (key === "department_id") {
          updated.designation_id = null;
        }

        return updated;
      });
    };

    const handleSubmit = () => {
      setLoading(true);
      setParentLoading?.(true);
      router.post(route("user.store"), values, {
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
              {/* Name, Eamil, Password, Phone */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Name \ Email \ Password \ Phone
                </h6>
                <hr className="mt-2 mb-2"></hr>
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
                    placeholder="User Full Name"
                    allowClear
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
                    User Email:
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                  </label>
                  <Input
                    className="me-1"
                    placeholder="User Email"
                    allowClear
                    value={values.email}
                    onChange={(e) => onChangeValue("email", e.target.value)}
                    disabled={loading}
                  />
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                    htmlFor="name"
                  >
                    Password:
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                  </label>
                  <Input.Password
                    placeholder="User Password"
                    allowClear
                    value={values.password}
                    onChange={(e) => onChangeValue("password", e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                <div className="d-flex align-items-center mb-3">
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                    htmlFor="phone"
                  >
                    User Phone:
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                  </label>
                  <Input
                    className="me-1"
                    placeholder="User Phone"
                    allowClear
                    value={values.phone}
                    onChange={(e) => onChangeValue("phone", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Branch, Department, Designation */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Branch \ Department \ Designation
                </h6>
                <hr className="mt-2 mb-2"></hr>
                {/* Branch */}
                <div className="d-flex align-items-center mb-2">
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                    htmlFor="designation"
                  >
                    Branch:
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                  </label>
                  <Select
                    className="me-1 w-100"
                    placeholder="Select Branch"
                    allowClear
                    showSearch
                    options={branches.map((branch) => ({
                      value: branch.id,
                      label: branch.name,
                    }))}
                    optionFilterProp="label"
                    value={values.branch_id || null}
                    onChange={(id) => onChangeValue("branch_id", id ?? null)}
                    disabled={loading}
                  />
                  {/* <span className="btn border btn-sm">➕</span> */}
                </div>
                {/* Departments */}
                <div className="d-flex align-items-center mb-2">
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                    htmlFor="department"
                  >
                    Department:<hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                  </label>
                  {values.branch_id ? (
                    <Select
                      className="me-1 w-100"
                      placeholder="Select Department"
                      allowClear
                      showSearch
                      options={filteredDepartments.map((dep) => ({
                        value: dep.id,
                        label: dep.name,
                      }))}
                      optionFilterProp="label"
                      value={values.department_id ?? null}
                      onChange={(id) =>
                        onChangeValue("department_id", id ?? null)
                      }
                      disabled={loading}
                    />
                  ) : (
                    <Select
                      className="me-1 w-100"
                      placeholder="Select Branch First"
                      disabled
                    />
                  )}
                </div>
                {/* Designation */}
                <div className="d-flex align-items-center mb-2">
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                    htmlFor="designation"
                  >
                    Designation:
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                  </label>
                  {values.department_id ? (
                    <Select
                      className="me-1 w-100"
                      placeholder="Select Designation"
                      allowClear
                      showSearch
                      options={filteredDesignations.map((desig) => ({
                        value: desig.id,
                        label: desig.name,
                      }))}
                      optionFilterProp="label"
                      value={values.designation_id ?? null}
                      onChange={(id) =>
                        onChangeValue("designation_id", id ?? null)
                      }
                      disabled={loading}
                    />
                  ) : (
                    <Select
                      className="me-1 w-100"
                      placeholder="Select Department First"
                      disabled
                    />
                  )}
                </div>
              </div>
              {/* Country, State, City */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Country \ State \ City:
                </h6>
                <hr className="mt-2 mb-2"></hr>
                <div className="d-flex flex-column mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <div>
                      <label
                        className="me-1"
                        htmlFor=""
                        style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                      >
                        Country:
                        <hr className="mb-1 mt-0"></hr>
                        <hr className="mb-1 mt-0"></hr>
                        <hr className="mb-1 mt-0"></hr>
                        <hr className="mb-0 mt-0"></hr>
                      </label>
                    </div>
                    <div className="w-100 me-1">
                      <Input
                        className="me-1"
                        placeholder="User Country"
                        allowClear
                        value={values.country}
                        onChange={(e) =>
                          onChangeValue("country", e.target.value)
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <div>
                      <label
                        className="me-1"
                        htmlFor=""
                        style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                      >
                        State:
                        <hr className="mb-1 mt-0"></hr>
                        <hr className="mb-1 mt-0"></hr>
                        <hr className="mb-1 mt-0"></hr>
                        <hr className="mb-0 mt-0"></hr>
                      </label>
                    </div>
                    <div className="me-1 w-100">
                      <Input
                        className="me-1"
                        placeholder="User State"
                        allowClear
                        value={values.state}
                        onChange={(e) => onChangeValue("state", e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <div>
                      <label
                        className="me-1"
                        htmlFor=""
                        style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                      >
                        City:
                        <hr className="mb-1 mt-0"></hr>
                        <hr className="mb-1 mt-0"></hr>
                        <hr className="mb-1 mt-0"></hr>
                        <hr className="mb-0 mt-0"></hr>
                      </label>
                    </div>
                    <div className="me-1 w-100">
                      <Input
                        className="me-1"
                        placeholder="User City"
                        allowClear
                        value={values.city}
                        onChange={(e) => onChangeValue("city", e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Country, State, City End */}

              {/* Postal/Zip & Addresses Start */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Postal/Zip & Addresses:
                </h6>
                <hr className="mt-2 mb-2"></hr>
                <div className="d-flex align-items-center mb-2">
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                    htmlFor="postal_or_zip_code"
                  >
                    Postal/Zip Code:
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                  </label>
                  <Input
                    placeholder="Postal Or Zip Code"
                    allowClear
                    value={values.postal_or_zip_code}
                    onChange={(e) =>
                      onChangeValue("postal_or_zip_code", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="d-flex align-items-center mb-2">
                  <label
                    className="me-1"
                    htmlFor="permanent_address"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                  >
                    Permanent Address:
                    <hr className="m-1 mt-0"></hr>
                    <hr className="m-1 mt-0"></hr>
                    <hr className="m-1 mt-0"></hr>
                    <hr className="m-1 mt-0"></hr>
                    <hr className="m-1 mt-0"></hr>
                  </label>
                  <TextArea
                    placeholder="Auto-sizing text area"
                    allowClear
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    value={values.permanent_address}
                    onChange={(e) =>
                      onChangeValue("permanent_address", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="d-flex align-items-center mb-2">
                  <label
                    className="me-1"
                    htmlFor="current_address"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                  >
                    Current Address:
                    <hr className="m-1 mt-0"></hr>
                    <hr className="m-1 mt-0"></hr>
                    <hr className="m-1 mt-0"></hr>
                    <hr className="m-1 mt-0"></hr>
                    <hr className="m-1 mt-0"></hr>
                  </label>
                  <TextArea
                    placeholder="Auto-sizing text area"
                    allowClear
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    value={values.current_address}
                    onChange={(e) =>
                      onChangeValue("current_address", e.target.value)
                    }
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
                  Notes \ Private Notes \ DOB \ Status:
                </h6>
                <hr className="mt-2 mb-2"></hr>
                <div className="mb-3">
                  <label
                    htmlFor="notes"
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                  >
                    Notes:<hr className="m-0"></hr>
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
                <div className="mb-3">
                  <label
                    htmlFor="notes_private"
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                  >
                    Private Notes:<hr className="m-0"></hr>
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
                    value={values.notes_private}
                    onEditorChange={(content, editor) => {
                      onChangeValue("notes_private", content);
                    }}
                  />
                </div>
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <label
                      htmlFor="dob"
                      className="me-1"
                      style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                    >
                      DOB:
                      <hr className="mb-1 mt-0"></hr>
                      <hr className="mb-1 mt-0"></hr>
                      <hr className="mb-1 mt-0"></hr>
                    </label>
                    <DatePicker
                      className="me-1 w-100"
                      placeholder="User Date Of Birth"
                      allowClear
                      value={values.dob ? dayjs(values.dob) : null}
                      onChange={(date, dateString) =>
                        onChangeValue("dob", dateString)
                      }
                      disabled={loading}
                    />
                    <label
                      htmlFor="project_final_link"
                      className="me-1"
                      style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                    >
                      User Status:
                      <hr className="mb-1 mt-0"></hr>
                      <hr className="mb-1 mt-0"></hr>
                      <hr className="mb-1 mt-0"></hr>
                    </label>
                    <Select
                      className="me-1 w-100"
                      placeholder="Select User Status"
                      allowClear={values.status !== "active"}
                      showSearch
                      options={[
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "In Active" },
                        { value: "suspended", label: "Suspended" },
                      ]}
                      optionFilterProp="label"
                      value={values.status || "active"}
                      onChange={(status) =>
                        onChangeValue("status", status ?? "active")
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              {/* Joining, Hiring, Leavging Date */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Joining \ hiring \ Leaving Date:
                </h6>
                <hr className="mt-2 mb-2"></hr>
                <div className="d-flex align-items-center mb-2">
                  <label
                    htmlFor="dob"
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                  >
                    Joining Date:
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                  </label>
                  <DatePicker
                    className="me-1 w-100"
                    placeholder="User Joining Date"
                    allowClear
                    value={
                      values.joining_date ? dayjs(values.joining_date) : null
                    }
                    onChange={(date, dateString) =>
                      onChangeValue("joining_date", dateString)
                    }
                    disabled={loading}
                  />
                  <label
                    htmlFor="dob"
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                  >
                    Hiring Date:
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                  </label>
                  <DatePicker
                    className="me-1 w-100"
                    placeholder="User Hiring Date"
                    allowClear
                    value={
                      values.hiring_date ? dayjs(values.hiring_date) : null
                    }
                    onChange={(date, dateString) =>
                      onChangeValue("hiring_date", dateString)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="d-flex align-items-center mb-2">
                  <label
                    htmlFor="dob"
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                  >
                    Leaving Date:
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                  </label>
                  <DatePicker
                    className="me-1 w-100"
                    placeholder="User Leaving Date"
                    allowClear
                    value={
                      values.leaving_date ? dayjs(values.leaving_date) : null
                    }
                    onChange={(date, dateString) =>
                      onChangeValue("leaving_date", dateString)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="d-flex align-items-center mb-2">
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                    htmlFor="role"
                  >
                    Role:
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                    <hr className="mb-1 mt-0"></hr>
                  </label>
                  <Select
                    className="me-1 w-100"
                    placeholder="Select Role"
                    allowClear
                    showSearch
                    options={roles.map((role) => ({
                      value: role.id,
                      label: role.name,
                    }))}
                    optionFilterProp="label"
                    value={values.role_id || null}
                    onChange={(id) => onChangeValue("role_id", id ?? null)}
                    disabled={loading}
                  />
                  {/* <span className="btn border btn-sm">➕</span> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);
export default AddUser;
