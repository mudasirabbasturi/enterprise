import React, { useState, useImperativeHandle, forwardRef } from "react";
import {
  router,
  useRoute, // ziggy routing
  Input,
  InputNumber,
  Select,
  DatePicker,
  dayjs,
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
import "tinymce/skins/ui/oxide/skin.css"; // important!

const EditProject = forwardRef(
  ({ project: selectedProject, onClose, clients, setParentLoading }, ref) => {
    const route = useRoute();
    const defaultValues = {
      id: selectedProject.id,
      project_title: selectedProject.project_title,
      project_address: selectedProject.project_address,
      client_id: selectedProject.client_id,
      project_pricing: selectedProject.project_pricing,
      project_area: selectedProject.project_area,
      project_construction_type: selectedProject.project_construction_type,
      project_line_items_pricing: selectedProject.project_line_items_pricing,
      project_floor_number: selectedProject.project_floor_number,
      project_main_scope: selectedProject.project_main_scope,
      project_scope_details: selectedProject.project_scope_details,
      project_template: selectedProject.project_template,
      project_init_link: selectedProject.project_init_link,
      project_final_link: selectedProject.project_final_link,
      project_notes_owner_or_supervisor:
        selectedProject.project_notes_owner_or_supervisor,
      project_notes_estimator: selectedProject.project_notes_estimator,
      notes_private: selectedProject.notes_private,
      notes: selectedProject.notes || "",
      budget_total: selectedProject.budget_total || null,
      deduction_amount: selectedProject.deduction_amount || null,
      project_due_date: selectedProject.project_due_date || null,
      project_points: selectedProject.project_points || "",
      project_source: selectedProject.project_source || "InSource",
      project_status: selectedProject.project_status || "Pending",
      preview_status: selectedProject.preview_status || "active",
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
      router.put(route("project.update", values.id), values, {
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
        <div className="container m-0">
          <div className="row">
            <div className="col-6">
              {/* Project Title, Client, Address */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Project Title, Client, Address
                </h6>
                <hr className="mt-2 mb-2"></hr>
                <div className="d-flex align-items-center mb-3">
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                    htmlFor="project_title"
                  >
                    Project Title:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    placeholder="Add Project Title"
                    value={values.project_title}
                    onChange={(e) =>
                      onChangeValue("project_title", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="project_address">Project Address:</label>
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
                    value={values.project_address}
                    onEditorChange={(content, editor) => {
                      onChangeValue("project_address", content);
                    }}
                  />
                </div>
              </div>

              <div className="d-flex flex-column mb-3">
                <label
                  className="mb-1"
                  style={{ whiteSpace: "nowrap" }}
                  htmlFor="client_id"
                >
                  Select Client:<hr className="m-0"></hr>
                </label>
                <div className="d-flex flex-column">
                  <Select
                    className="w-100"
                    placeholder="Select Client"
                    allowClear
                    showSearch
                    options={clients.map((client) => ({
                      label: client.name,
                      value: client.id,
                    }))}
                    optionFilterProp="label"
                    value={values.client_id || null}
                    onChange={(id) => {
                      const selectedClient = clients.find(
                        (client) => client.id === id
                      );
                      onChangeValue("client_id", id ?? null);
                      onChangeValue("notes", selectedClient?.notes ?? "");
                    }}
                    disabled={loading}
                  />

                  {/* Editor only shows if a client is selected */}
                  {values.client_id && (
                    <Editor
                      disabled={true}
                      init={{
                        readonly: true,
                        height: 150,
                        menubar: false,
                        plugins: "table code lists link",
                        toolbar:
                          "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                        skin: false,
                        content_css: false,
                      }}
                      value={values.notes}
                      onEditorChange={(content) => {
                        onChangeValue("notes", content);
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Pricing, Area, Construction Type, Project Template, Line Items Pricing, Floor Number Start */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Project Metrics & Configuration:
                </h6>
                <hr className="mt-2 mb-2"></hr>
                <div className="d-flex align-items-center mb-3">
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                    htmlFor="project_pricing"
                  >
                    Pricing:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    className="me-1"
                    placeholder="Add Project Pricing"
                    value={values.project_pricing}
                    onChange={(e) =>
                      onChangeValue("project_pricing", e.target.value)
                    }
                    disabled={loading}
                  />
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                    htmlFor="project_area"
                  >
                    Area:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    placeholder="Add Project Area"
                    value={values.project_area}
                    onChange={(e) =>
                      onChangeValue("project_area", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="d-flex align-items-center mb-3">
                  <label
                    htmlFor="project_construction_type"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Construction Type:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Select
                    className="me-1 w-100"
                    placeholder="Select Construction Type"
                    allowClear
                    showSearch
                    options={[
                      { value: "commercial", label: "Commercial" },
                      { value: "residential", label: "Residential" },
                    ]}
                    optionFilterProp="label"
                    value={values.project_construction_type || null}
                    onChange={(project_construction_type) =>
                      onChangeValue(
                        "project_construction_type",
                        project_construction_type ?? null
                      )
                    }
                    disabled={loading}
                  />
                  <label
                    htmlFor="project_template"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Project Template:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    placeholder="Project Template"
                    value={values.project_template}
                    onChange={(e) =>
                      onChangeValue("project_template", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="d-flex align-items-center mb-3">
                  <label
                    htmlFor="project_line_items_pricing"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Line Items Pricing:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    className="me-1"
                    placeholder="Add Project Line Items Pricing"
                    value={values.project_line_items_pricing}
                    onChange={(e) =>
                      onChangeValue(
                        "project_line_items_pricing",
                        e.target.value
                      )
                    }
                    disabled={loading}
                  />
                  <label
                    htmlFor="project_floor_number"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Floor Number:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    placeholder="Add Project Floor Number"
                    value={values.project_floor_number}
                    onChange={(e) =>
                      onChangeValue("project_floor_number", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
              </div>
              {/* Pricing, Area, Construction Type, Project Template, Line Items Pricing, Floor Number End */}

              {/* Projects Links Start */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Initial & Final Project Links:
                </h6>
                <hr className="mt-2 mb-2"></hr>
                <div className="d-flex align-items-center mb-3">
                  <label
                    htmlFor="project_init_link"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Initial Link:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    className="me-1"
                    placeholder="Project Initial link( By Admin or Supervisor )"
                    value={values.project_init_link}
                    onChange={(e) =>
                      onChangeValue("project_init_link", e.target.value)
                    }
                    disabled={loading}
                  />
                  <label
                    htmlFor="project_final_link"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Final Link:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    placeholder="Project Final Link, When Project Completed"
                    value={values.project_final_link}
                    onChange={(e) =>
                      onChangeValue("project_final_link", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
              </div>
              {/* Projects Links End */}

              {/* Due Dates, Points, Start.... */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Due Date & Points
                </h6>
                <hr className="mt-2 mb-2"></hr>
                <div className="d-flex align-items-center mb-3">
                  <label
                    htmlFor="project_due_date"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Due Date:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <DatePicker
                    className="me-1 w-100"
                    placeholder="Project Due Date"
                    allowClear
                    value={
                      values.project_due_date
                        ? dayjs(values.project_due_date)
                        : null
                    }
                    onChange={(date, dateString) =>
                      onChangeValue("project_due_date", dateString)
                    }
                    disabled={loading}
                  />
                  <label
                    htmlFor="project_points"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Project Points:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    placeholder="Number Of Points Of The Project"
                    value={values.project_points}
                    onChange={(e) =>
                      onChangeValue("project_points", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
              </div>
              {/*  Due Dates, Points End */}

              {/* Budgeting, Status and Visibility Start */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Budgeting, Status and Visibility:
                </h6>
                <hr className="mt-2 mb-2"></hr>
                <div className="d-flex align-items-center mb-3">
                  <label
                    htmlFor="project_init_link"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Project Budget:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <InputNumber
                    className="me-1 w-100"
                    min={1}
                    placeholder="Project Budget"
                    value={values.budget_total}
                    onChange={(value) =>
                      onChangeValue("budget_total", value ?? null)
                    }
                    disabled={loading}
                  />
                  <label
                    htmlFor="project_final_link"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Deduction Amount:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <InputNumber
                    className="w-100"
                    min={1}
                    placeholder="Deduction"
                    value={values.deduction_amount}
                    onChange={(value) =>
                      onChangeValue("deduction_amount", value ?? null)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="d-flex align-items-center mb-3">
                  <label
                    htmlFor="project_init_link"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Final Price:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    className="me-1"
                    placeholder="Project Budget"
                    value={values.budget_total - values.deduction_amount}
                    disabled={true}
                  />
                  <label
                    htmlFor="project_final_link"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Project Status:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Select
                    className="me-1 w-100"
                    placeholder="Select Project Status"
                    allowClear={values.project_status !== "Pending"}
                    showSearch
                    options={[
                      { value: "Planned", label: "Planned" },
                      { value: "Pending", label: "Pending" },
                      {
                        value: "Takeoff On Progress",
                        label: "Takeoff On Progress",
                      },
                      {
                        value: "Pricing On Progress",
                        label: "Pricing On Progress",
                      },
                      { value: "Completed", label: "Completed" },
                      { value: "Hold", label: "Hold" },
                      { value: "Revision", label: "Revision" },
                      { value: "Cancelled", label: "Cancelled" },
                      { value: "Deliver", label: "Deliver" },
                    ]}
                    optionFilterProp="label"
                    value={values.project_status || "Pending"}
                    onChange={(project_status) =>
                      onChangeValue(
                        "project_status",
                        project_status ?? "Pending"
                      )
                    }
                    disabled={loading}
                  />
                </div>
                <div className="d-flex align-items-center mb-3">
                  <label
                    htmlFor="project_final_link"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Preview Status:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Select
                    className="me-1 w-100"
                    placeholder="Select Project Preview Status"
                    allowClear={values.preview_status !== "active"}
                    showSearch
                    options={[
                      { value: "active", label: "Active" },
                      { value: "draft", label: "Draft" },
                    ]}
                    optionFilterProp="label"
                    value={values.preview_status || "active"}
                    onChange={
                      (preview_status) =>
                        onChangeValue(
                          "preview_status",
                          preview_status ?? "active"
                        ) // fallback to active
                    }
                    disabled={loading}
                  />
                  <label
                    htmlFor="project_final_link"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Project Source:
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                    <hr className="mb-1 m-0" />
                  </label>
                  <Select
                    className="me-1 w-100"
                    placeholder="Select Project Source"
                    allowClear={values.project_source !== "InSource"}
                    showSearch
                    options={[
                      { value: "InSource", label: "In Source" },
                      { value: "OutSource", label: "Out Source" },
                    ]}
                    optionFilterProp="label"
                    value={values.project_source || "InSource"} // fallback to active
                    onChange={(project_source) =>
                      onChangeValue(
                        "project_source",
                        project_source ?? "InSource"
                      )
                    }
                    disabled={loading}
                  />
                </div>
              </div>
              {/* Budgeting, Status and Visibility End */}
            </div>
            <div className="col-6">
              {/* Main Scope & Scope Details Start */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Main Scope & Scope Details:
                </h6>
                <hr className="mt-2 mb-2"></hr>
                <div className="mb-3">
                  <label htmlFor="project_main_scope">
                    Project Main Scope:
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
                    value={values.project_main_scope}
                    onEditorChange={(content, editor) => {
                      onChangeValue("project_main_scope", content);
                    }}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="project_scope_details">
                    Project Scope Details:
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
                    value={values.project_scope_details}
                    onEditorChange={(content, editor) => {
                      onChangeValue("project_scope_details", content);
                    }}
                  />
                </div>
              </div>
              {/* Main Scope & Scope Details End */}

              {/* Notes Start */}
              <div>
                <hr className="mt-2 mb-2"></hr>
                <h6 className="m-0" style={{ color: "blue" }}>
                  Admin Or Supervisor, Estimator & Private Notes:
                </h6>
                <hr className="mt-2 mb-2"></hr>
                <div className="mb-3">
                  <label
                    htmlFor="project_notes_owner_or_supervisor"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Admin Or Supervisor Notes:<hr className="m-0"></hr>
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
                    value={values.project_notes_owner_or_supervisor}
                    onEditorChange={(content, editor) => {
                      onChangeValue(
                        "project_notes_owner_or_supervisor",
                        content
                      );
                    }}
                  />
                </div>
                <div className="mb-3">
                  <label
                    htmlFor="project_notes_estimator"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Estimator Notes:<hr className="m-0"></hr>
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
                    value={values.project_notes_estimator}
                    onEditorChange={(content, editor) => {
                      onChangeValue("project_notes_estimator", content);
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="notes_private"
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
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
              </div>
              {/* Notes End */}
            </div>
          </div>
        </div>
      </>
    );
  }
);

export default EditProject;
