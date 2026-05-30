import React, { useState, useImperativeHandle, forwardRef } from "react";
import {
  useRoute, // ziggy routing
  Input,
  Select,
  DatePicker,
  dayjs,
  InputNumber,
  usePage,
} from "@shared/ui";
import axios from "axios";
import NProgress from "nprogress";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const AddProject = forwardRef(
  ({ onClose, clients, setParentLoading, api, setRowData }, ref) => {
    const hasPermission = (userpermission, permName) =>
      userpermission?.some((p) => p.name === permName);
    const { auth } = usePage().props;

    const { props } = usePage();
    const userPermissions = props?.auth?.user?.role?.permissions ?? [];
    const can = (perm) => hasPermission(userPermissions, perm);

    const user = props?.auth?.user ?? {};
    const permissions = props?.permissions ?? []; // master list
    // 🔐 Project column permissions (Add)
    const hasAddProjectTitlePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Project Title");

    const hasAddProjectAddressPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Project Address");

    const hasAddProjectClientAdminName =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Client Admin");

    const hasAddProjectClientPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Project Client");

    const hasAddProjectPricingPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Project Pricing");

    const hasAddProjectAreaPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Project Area");

    const hasAddConstructionTypePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Construction Type");

    const hasAddLineItemsPricingPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add LineItems Pricing");

    const hasAddFloorNumberPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Floor Number");

    const hasAddMainScopePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Main Scope");

    const hasAddScopeDetailsPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Scope Details");

    const hasAddProjectTemplatePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Project Template");

    const hasAddInitialLinkPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Initial Link");

    const hasAddFinalLinkPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Final Link");

    const hasAddAdminNotesPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Admin Notes");

    const hasAddEstimatorNotesPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Estimator Notes");

    const hasAddClientAdminNotesPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add ClientAdmin Notes");

    const hasAddBudgetPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Budget");

    const hasAddDeductionPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Deduction");

    const hasAddDueDatePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Due Date");

    const hasAddProjectPointsPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Project Points");

    const hasAddProjectStatusPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Project Status");

    const hasAddProjectSourcePermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Project Source");

    const hasAddPreviewStatusPermission =
      Array.isArray(userPermissions) &&
      userPermissions.some((perm) => perm.name === "Add Preview Status");

    const route = useRoute();
    const defaultValues = {
      project_title: "",
      project_address: "",
      client_name_for_admin: "",
      client_id: "",
      project_pricing: "",
      project_area: "",
      project_construction_type: "",
      project_line_items_pricing: "",
      project_floor_number: "",
      project_main_scope: "",
      project_scope_details: "",
      project_template: "",
      project_init_link: "",
      project_final_link: "",
      project_admin_notes: "",
      project_notes_estimator: "",
      notes_private: "",
      notes: "", // Not in DB – assumed used elsewhere (e.g., updating clients)
      budget_total: null, // nullable decimal
      deduction_amount: null,
      project_due_date: null,
      project_points: null,
      project_source: "InSource",
      project_status: "Pending", // default in DB
      preview_status: "active", // default in DB
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
        const { data } = await axios.post(route("project.store"), values);
        setValues(defaultValues);
        onClose();
        if (data.project) {
          api.success({
            message: "success",
            description: data.message,
            placement: "topRight",
          });
          setRowData((prev) => [data.project, ...prev]);
        }
      } catch (error) {
        console.log(error.response?.data);
        api.error({
          message: "error",
          description: "Failed to create project",
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
                    disabled={loading || !hasAddProjectTitlePermission}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="project_address">Project Address:</label>
                  <ReactQuill
                    theme="snow"
                    readOnly={loading || !hasAddProjectAddressPermission}
                    value={values.project_address}
                    onChange={(content) =>
                      onChangeValue("project_address", content)
                    }
                  />
                </div>
              </div>
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
                  placeholder="Add Project Client Admin Name"
                  value={values.client_name_for_admin}
                  onChange={(e) =>
                    onChangeValue("client_name_for_admin", e.target.value)
                  }
                  disabled={loading || !hasAddProjectClientAdminName}
                />
              </div>
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
                    disabled={loading || !hasAddProjectClientPermission}
                  />

                  {values.client_id && (
                    <ReactQuill
                    theme="snow"
                      readOnly={true}
                    value={values.notes}
                    />
                  )}
                </div>
              </div>

              {/* Project Metrics */}
              <div>
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Project Metrics & Configuration:
                </h6>
                <hr className="mt-2 mb-2" />

                <div className="d-flex align-items-center mb-3">
                  <label className="me-1" htmlFor="project_pricing">
                    Pricing:
                  </label>
                  <Input
                    className="me-1"
                    placeholder="Add Project Pricing"
                    value={values.project_pricing}
                    onChange={(e) =>
                      onChangeValue("project_pricing", e.target.value)
                    }
                    disabled={loading || !hasAddProjectPricingPermission}
                  />

                  <label className="me-1" htmlFor="project_area">
                    Area:
                  </label>
                  <Input
                    placeholder="Add Project Area"
                    value={values.project_area}
                    onChange={(e) =>
                      onChangeValue("project_area", e.target.value)
                    }
                    disabled={loading || !hasAddProjectAreaPermission}
                  />
                </div>

                <div className="d-flex align-items-center mb-3">
                  <label className="me-1" htmlFor="project_construction_type">
                    Construction Type:
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
                    value={values.project_construction_type || null}
                    onChange={(val) =>
                      onChangeValue("project_construction_type", val ?? null)
                    }
                    disabled={loading || !hasAddConstructionTypePermission}
                  />

                  <label className="me-1" htmlFor="project_template">
                    Project Template:
                  </label>
                  <Input
                    placeholder="Project Template"
                    value={values.project_template}
                    onChange={(e) =>
                      onChangeValue("project_template", e.target.value)
                    }
                    disabled={loading || !hasAddProjectTemplatePermission}
                  />
                </div>

                <div className="d-flex align-items-center mb-3">
                  <label className="me-1" htmlFor="project_line_items_pricing">
                    Line Items Pricing:
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
                    disabled={loading || !hasAddLineItemsPricingPermission}
                  />

                  <label className="me-1" htmlFor="project_floor_number">
                    Floor Number:
                  </label>
                  <Input
                    placeholder="Add Project Floor Number"
                    value={values.project_floor_number}
                    onChange={(e) =>
                      onChangeValue("project_floor_number", e.target.value)
                    }
                    disabled={loading || !hasAddFloorNumberPermission}
                  />
                </div>
              </div>

              {/* Initial & Final Links */}
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
                    placeholder="Initial Link"
                    value={values.project_init_link}
                    onChange={(e) =>
                      onChangeValue("project_init_link", e.target.value)
                    }
                    disabled={loading || !hasAddInitialLinkPermission}
                  />
                  <label className="me-1">Final Link:</label>
                  <Input
                    placeholder="Final Link"
                    value={values.project_final_link}
                    onChange={(e) =>
                      onChangeValue("project_final_link", e.target.value)
                    }
                    disabled={loading || !hasAddFinalLinkPermission}
                  />
                </div>
              </div>

              {/* Due Dates & Points */}
              <div>
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Due Date & Points:
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
                    disabled={loading || !hasAddDueDatePermission}
                  />
                  <label className="me-1">Project Points:</label>
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="Project Points"
                    value={values.project_points}
                    // onChange={(e) =>
                    //   onChangeValue("project_points", e.target.value)
                    // }
                    onChange={(value) => onChangeValue("project_points", value)}
                    disabled={loading || !hasAddProjectPointsPermission}
                  />
                </div>
              </div>

              {/* Budgeting & Status */}
              <div>
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Budgeting, Status & Visibility:
                </h6>
                <hr className="mt-2 mb-2" />

                <div className="d-flex align-items-center mb-3">
                  <label className="me-1">Budget:</label>
                  <InputNumber
                    className="me-1 w-100"
                    min={1}
                    value={values.budget_total}
                    onChange={(v) => onChangeValue("budget_total", v ?? null)}
                    disabled={loading || !hasAddBudgetPermission}
                  />
                  <label className="me-1">Deduction:</label>
                  <InputNumber
                    className="w-100"
                    min={1}
                    value={values.deduction_amount}
                    onChange={(v) =>
                      onChangeValue("deduction_amount", v ?? null)
                    }
                    disabled={loading || !hasAddDeductionPermission}
                  />
                </div>

                <div className="d-flex align-items-center mb-3">
                  <label className="me-1">Final Price:</label>
                  <Input
                    value={values.budget_total - values.deduction_amount}
                    disabled={true}
                  />
                  <label className="me-1">Status:</label>
                  <Select
                    className="me-1 w-100"
                    placeholder="Project Status"
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
                    disabled={loading || !hasAddProjectStatusPermission}
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
                    disabled={loading || !hasAddPreviewStatusPermission}
                  />
                  <label className="me-1">Source:</label>
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
                    disabled={loading || !hasAddProjectSourcePermission}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-6">
              {/* Main Scope & Scope Details */}
              <div>
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Main Scope & Scope Details:
                </h6>
                <hr className="mt-2 mb-2" />

                <div className="mb-3">
                  <label>Project Main Scope:</label>
                  <ReactQuill
                    theme="snow"
                    readOnly={loading || !hasAddMainScopePermission}
                    value={values.project_main_scope}
                    onChange={(content) =>
                      onChangeValue("project_main_scope", content)
                    }
                  />
                </div>

                <div className="mb-3">
                  <label>Project Scope Details:</label>
                  <ReactQuill
                    theme="snow"
                    readOnly={loading || !hasAddScopeDetailsPermission}
                    value={values.project_scope_details}
                    onChange={(content) =>
                      onChangeValue("project_scope_details", content)
                    }
                  />
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <hr className="mt-2 mb-2" />
                <h6 className="m-0" style={{ color: "blue" }}>
                  Admin / Estimator / Private Notes:
                </h6>
                <hr className="mt-2 mb-2" />

                <div className="mb-3">
                  <label>Admin Notes:</label>
                  <ReactQuill
                    theme="snow"
                    readOnly={loading || !hasAddAdminNotesPermission}
                    value={values.project_admin_notes}
                    onChange={(content) =>
                      onChangeValue("project_admin_notes", content)
                    }
                  />
                </div>

                <div className="mb-3">
                  <label>Estimator Notes:</label>
                  <ReactQuill
                    theme="snow"
                    readOnly={loading || !hasAddEstimatorNotesPermission}
                    value={values.project_notes_estimator}
                    onChange={(content) =>
                      onChangeValue("project_notes_estimator", content)
                    }
                  />
                </div>
                {hasAddClientAdminNotesPermission && (
                  <div>
                    <label>Client Admin Notes:</label>
                    <ReactQuill
                    theme="snow"
                      readOnly={loading}
                    value={values.notes_private}
                      onChange={(content) =>
                        onChangeValue("notes_private", content)
                      }
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
export default AddProject;
