import React, { useState, useImperativeHandle, forwardRef } from "react";
import {
  router,
  useRoute, // ziggy routing
  Input,
  InputNumber,
  Select,
  DatePicker,
  dayjs,
  usePage,
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
import NProgress from "nprogress";
import axios from "axios";
const EditProject = forwardRef(
  (
    {
      project: selectedProject,
      onClose,
      clients,
      setParentLoading,
      api,
      setRowData,
    },
    ref
  ) => {
    const hasPermission = (userpermission, permName) =>
      userpermission?.some((p) => p.name === permName);
    const { auth } = usePage().props;

    const { props } = usePage();
    const userPermissions = props?.auth?.user?.role?.permissions ?? [];
    const can = (perm) => hasPermission(userPermissions, perm);

    const user = props?.auth?.user ?? {};
    const permissions = props?.permissions ?? []; // master list
    // 🔐 Project column permissions (Add)
    const hasUpdateProjectTitlePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Project Title");

    const hasUpdateProjectAddressPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Project Address");

    const hasUpdateProjectClientAdminName =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Client Admin");

    const hasUpdateProjectClientPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Project Client");

    const hasUpdateProjectPricingPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Project Pricing");

    const hasUpdateProjectAreaPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Project Area");

    const hasUpdateConstructionTypePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Construction Type");

    const hasUpdateLineItemsPricingPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update LineItems Pricing");

    const hasUpdateFloorNumberPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Floor Number");

    const hasUpdateMainScopePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Main Scope");

    const hasUpdateScopeDetailsPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Scope Details");

    const hasUpdateProjectTemplatePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Project Template");

    const hasUpdateInitialLinkPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Initial Link");

    const hasUpdateFinalLinkPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Final Link");

    const hasUpdateAdminNotesPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Admin Notes");

    const hasUpdateEstimatorNotesPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Estimator Notes");

    const hasUpdateClientAdminNotesPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update ClientAdmin Notes");

    const hasUpdateBudgetPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Budget");

    const hasUpdateDeductionPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Deduction");

    const hasUpdateDueDatePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Due Date");

    const hasUpdateProjectPointsPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Project Points");

    const hasUpdateProjectStatusPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Project Status");

    const hasUpdateProjectSourcePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Project Source");

    const hasUpdatePreviewStatusPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Update Preview Status");
    const route = useRoute();
    const defaultValues = {
      id: selectedProject.id,
      project_title: selectedProject.project_title,
      project_address: selectedProject.project_address,
      client_name_for_admin: selectedProject.client_name_for_admin,
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
      project_admin_notes: selectedProject.project_admin_notes,
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

    const handleSubmit = async () => {
      try {
        NProgress.start();
        setLoading(true);
        setParentLoading?.(true);

        const { data } = await axios.put(
          route("project.update", values.id),
          values
        );

        setValues(defaultValues);
        onClose();

        if (data.project) {
          api.success({
            message: "Success",
            description: data.message || "Project updated successfully",
            placement: "topRight",
          });
          setRowData?.((prev) =>
            prev.map((row) => (row.id === data.project.id ? data.project : row))
          );
        }
      } catch (error) {
        console.error(error.response?.data);
        api.error({
          message: "Error",
          description:
            error.response?.data?.message || "Failed to update project",
          placement: "topRight",
        });
      } finally {
        NProgress.done();
        setLoading(false);
        setParentLoading?.(false);
      }
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
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Project Title, Client, Address
                </h6>
                <hr className="mt-2 mb-2" />
                <div className="d-flex align-items-center mb-3">
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                    htmlFor="project_title"
                  >
                    Project Title:
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    placeholder="Add Project Title"
                    value={values.project_title}
                    onChange={(e) =>
                      onChangeValue("project_title", e.target.value)
                    }
                    disabled={loading || !hasUpdateProjectTitlePermission}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="project_address">Project Address:</label>
                  <Editor
                    disabled={loading || !hasUpdateProjectAddressPermission}
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
                    onEditorChange={(content) =>
                      onChangeValue("project_address", content)
                    }
                  />
                </div>
              </div>
              {/* <div className="d-flex align-items-center mb-3">
                <label
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                  htmlFor="client_name_for_admin"
                >
                  Client Admin Name:
                  <hr className="mb-1 m-0" />
                </label>
                <Input
                  placeholder="Update Project Client Admin Name"
                  value={values.client_name_for_admin}
                  onChange={(e) =>
                    onChangeValue("client_name_for_admin", e.target.value)
                  }
                  disabled={loading || !hasUpdateProjectClientAdminName}
                />
              </div> */}
              {hasUpdateProjectClientAdminName && (
                <div className="d-flex align-items-center mb-3">
                  <label
                    className="me-1"
                    style={{ whiteSpace: "nowrap" }}
                    htmlFor="client_name_for_admin"
                  >
                    Client Admin Name:
                    <hr className="mb-1 m-0" />
                  </label>
                  <Input
                    placeholder="Update Project Client Admin Name"
                    value={values.client_name_for_admin}
                    onChange={(e) =>
                      onChangeValue("client_name_for_admin", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
              )}

              {/* Client */}
              <div className="d-flex flex-column mb-3">
                <label
                  className="mb-1"
                  style={{ whiteSpace: "nowrap" }}
                  htmlFor="client_id"
                >
                  Select Client:
                  <hr className="m-0" />
                </label>
                <div className="d-flex flex-column">
                  <Select
                    className="w-100"
                    placeholder="Select Client"
                    allowClear
                    showSearch
                    options={clients.map((c) => ({
                      label: c.name,
                      value: c.id,
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
                    disabled={loading || !hasUpdateProjectClientPermission}
                  />
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
                    />
                  )}
                </div>
              </div>

              {/* Pricing, Area, Construction Type, Template, Floor, LineItems */}
              <div>
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Project Metrics & Configuration:
                </h6>
                <hr className="mt-2 mb-2" />

                <div className="d-flex align-items-center mb-3">
                  <label className="me-1" style={{ whiteSpace: "nowrap" }}>
                    Pricing:
                  </label>
                  <Input
                    className="me-1"
                    placeholder="Add Project Pricing"
                    value={values.project_pricing}
                    onChange={(e) =>
                      onChangeValue("project_pricing", e.target.value)
                    }
                    disabled={loading || !hasUpdateProjectPricingPermission}
                  />

                  <label className="me-1" style={{ whiteSpace: "nowrap" }}>
                    Area:
                  </label>
                  <Input
                    placeholder="Add Project Area"
                    value={values.project_area}
                    onChange={(e) =>
                      onChangeValue("project_area", e.target.value)
                    }
                    disabled={loading || !hasUpdateProjectAreaPermission}
                  />
                </div>

                <div className="d-flex align-items-center mb-3">
                  <label className="me-1">Construction Type:</label>
                  <Select
                    className="me-1 w-100"
                    placeholder="Select Construction Type"
                    allowClear
                    showSearch
                    options={[
                      { value: "commercial", label: "Commercial" },
                      { value: "residential", label: "Residential" },
                    ]}
                    value={values.project_construction_type || null}
                    onChange={(val) =>
                      onChangeValue("project_construction_type", val ?? null)
                    }
                    disabled={loading || !hasUpdateConstructionTypePermission}
                  />
                  <label className="me-1">Project Template:</label>
                  <Input
                    placeholder="Project Template"
                    value={values.project_template}
                    onChange={(e) =>
                      onChangeValue("project_template", e.target.value)
                    }
                    disabled={loading || !hasUpdateProjectTemplatePermission}
                  />
                </div>

                <div className="d-flex align-items-center mb-3">
                  <label className="me-1">Line Items Pricing:</label>
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
                    disabled={loading || !hasUpdateLineItemsPricingPermission}
                  />
                  <label className="me-1">Floor Number:</label>
                  <Input
                    placeholder="Add Project Floor Number"
                    value={values.project_floor_number}
                    onChange={(e) =>
                      onChangeValue("project_floor_number", e.target.value)
                    }
                    disabled={loading || !hasUpdateFloorNumberPermission}
                  />
                </div>
              </div>

              {/* Links */}
              <div>
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Initial & Final Project Links:
                </h6>
                <hr className="mt-2 mb-2" />
                <div className="d-flex align-items-center mb-3">
                  <label className="me-1">Initial Link:</label>
                  <Input
                    className="me-1"
                    placeholder="Project Initial link"
                    value={values.project_init_link}
                    onChange={(e) =>
                      onChangeValue("project_init_link", e.target.value)
                    }
                    disabled={loading || !hasUpdateInitialLinkPermission}
                  />
                  <label className="me-1">Final Link:</label>
                  <Input
                    placeholder="Project Final Link"
                    value={values.project_final_link}
                    onChange={(e) =>
                      onChangeValue("project_final_link", e.target.value)
                    }
                    disabled={loading || !hasUpdateFinalLinkPermission}
                  />
                </div>
              </div>

              {/* Due Date & Points */}
              <div>
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Due Date & Points
                </h6>
                <hr className="mt-2 mb-2" />
                <div className="d-flex align-items-center mb-3">
                  <label className="me-1">Due Date:</label>
                  <DatePicker
                    className="me-1 w-100"
                    placeholder="Project Due Date"
                    value={
                      values.project_due_date
                        ? dayjs(values.project_due_date)
                        : null
                    }
                    onChange={(date, dateString) =>
                      onChangeValue("project_due_date", dateString)
                    }
                    disabled={loading || !hasUpdateDueDatePermission}
                  />
                  <label className="me-1">Project Points:</label>
                  <InputNumber
                    placeholder="Number Of Points Of The Project"
                    value={values.project_points}
                    onChange={(e) =>
                      onChangeValue("project_points", e.target.value)
                    }
                    disabled={loading || !hasUpdateProjectPointsPermission}
                  />
                </div>
              </div>

              {/* Budgeting */}
              <div>
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Budgeting, Status and Visibility:
                </h6>
                <hr className="mt-2 mb-2" />
                <div className="d-flex align-items-center mb-3">
                  <label className="me-1">Project Budget:</label>
                  <InputNumber
                    className="me-1 w-100"
                    min={1}
                    value={values.budget_total}
                    onChange={(v) => onChangeValue("budget_total", v ?? null)}
                    disabled={loading || !hasUpdateBudgetPermission}
                  />
                  <label className="me-1">Deduction:</label>
                  <InputNumber
                    className="w-100"
                    min={1}
                    value={values.deduction_amount}
                    onChange={(v) =>
                      onChangeValue("deduction_amount", v ?? null)
                    }
                    disabled={loading || !hasUpdateDeductionPermission}
                  />
                </div>
                <div className="d-flex align-items-center mb-3">
                  <label className="me-1">Final Price:</label>
                  <Input
                    className="me-1"
                    value={values.budget_total - values.deduction_amount}
                    disabled
                  />
                  <label className="me-1">Project Status:</label>
                  <Select
                    className="me-1 w-100"
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
                    value={values.project_status || "Pending"}
                    onChange={(v) =>
                      onChangeValue("project_status", v ?? "Pending")
                    }
                    disabled={loading || !hasUpdateProjectStatusPermission}
                  />
                </div>
                <div className="d-flex align-items-center mb-3">
                  <label className="me-1">Preview Status:</label>
                  <Select
                    className="me-1 w-100"
                    options={[
                      { value: "active", label: "Active" },
                      { value: "draft", label: "Draft" },
                    ]}
                    value={values.preview_status || "active"}
                    onChange={(v) =>
                      onChangeValue("preview_status", v ?? "active")
                    }
                    disabled={loading || !hasUpdatePreviewStatusPermission}
                  />
                  <label className="me-1">Project Source:</label>
                  <Select
                    className="me-1 w-100"
                    options={[
                      { value: "InSource", label: "In Source" },
                      { value: "OutSource", label: "Out Source" },
                    ]}
                    value={values.project_source || "InSource"}
                    onChange={(v) =>
                      onChangeValue("project_source", v ?? "InSource")
                    }
                    disabled={loading || !hasUpdateProjectSourcePermission}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE (Scopes & Notes) */}
            <div className="col-6">
              {/* Main Scope */}
              <div>
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Main Scope & Scope Details:
                </h6>
                <hr className="mt-2 mb-2" />
                <div className="mb-3">
                  <label>Project Main Scope:</label>
                  <Editor
                    disabled={loading || !hasUpdateMainScopePermission}
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
                    onEditorChange={(content) =>
                      onChangeValue("project_main_scope", content)
                    }
                  />
                </div>
                <div className="mb-3">
                  <label>Project Scope Details:</label>
                  <Editor
                    disabled={loading || !hasUpdateScopeDetailsPermission}
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
                    onEditorChange={(content) =>
                      onChangeValue("project_scope_details", content)
                    }
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Admin, Estimator & Private Notes:
                </h6>
                <hr className="mt-2 mb-2" />
                <div className="mb-3">
                  <label>Admin Notes:</label>
                  <Editor
                    disabled={loading || !hasUpdateAdminNotesPermission}
                    init={{
                      height: 150,
                      menubar: false,
                      plugins: "table code lists link",
                      toolbar:
                        "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                      skin: false,
                      content_css: false,
                    }}
                    value={values.project_admin_notes}
                    onEditorChange={(c) =>
                      onChangeValue("project_admin_notes", c)
                    }
                  />
                </div>
                <div className="mb-3">
                  <label>Estimator Notes:</label>
                  <Editor
                    disabled={loading || !hasUpdateEstimatorNotesPermission}
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
                    onEditorChange={(c) =>
                      onChangeValue("project_notes_estimator", c)
                    }
                  />
                </div>
                {hasUpdateClientAdminNotesPermission && (
                  <div>
                    <label>Client Notes Admin Only:</label>
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
                      onEditorChange={(c) => onChangeValue("notes_private", c)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

export default EditProject;
