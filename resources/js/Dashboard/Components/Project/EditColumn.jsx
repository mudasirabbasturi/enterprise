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
import "tinymce/skins/ui/oxide/skin.css";
import NProgress from "nprogress";
import axios from "axios";
const EditColumn = forwardRef(
  (
    { clients, onClose, setParentLoading, field, value, id, api, setRowData },
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
    const route = useRoute();
    const [loading, setLoading] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const handleSubmit = async () => {
      if (!canEditField) {
        setLoading(false);
        setParentLoading?.(false);
        api.warning({
          message: "Permission Denied",
          description: "You do not have permission to update this field.",
          placement: "topRight",
        });
        return;
      }
      try {
        NProgress.start();
        setLoading(true);
        setParentLoading?.(true);

        const updateData = {
          id,
          field,
          [field]: currentValue,
        };

        const { data } = await axios.put(
          route("project.column.update", id),
          updateData
        );

        api.success({
          message: "Success",
          description: data.message || "Field updated successfully",
          placement: "topRight",
        });

        // Update table row data if needed
        setRowData?.((prev) =>
          prev.map((row) => (row.id === data.project.id ? data.project : row))
        );

        onClose();
      } catch (error) {
        console.error(error.response?.data);
        api.error({
          message: "Error",
          description:
            error.response?.data?.message || "Failed to update field",
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
    const fieldPermissionMap = {
      project_title: hasUpdateProjectTitlePermission,
      project_address: hasUpdateProjectAddressPermission,
      client_name_for_admin: hasUpdateProjectClientAdminName,
      client_id: hasUpdateProjectClientPermission,
      project_pricing: hasUpdateProjectPricingPermission,
      project_area: hasUpdateProjectAreaPermission,
      project_construction_type: hasUpdateConstructionTypePermission,
      project_line_items_pricing: hasUpdateLineItemsPricingPermission,
      project_floor_number: hasUpdateFloorNumberPermission,
      project_main_scope: hasUpdateMainScopePermission,
      project_scope_details: hasUpdateScopeDetailsPermission,
      project_template: hasUpdateProjectTemplatePermission,
      project_init_link: hasUpdateInitialLinkPermission,
      project_final_link: hasUpdateFinalLinkPermission,
      project_admin_notes: hasUpdateAdminNotesPermission,
      project_notes_estimator: hasUpdateEstimatorNotesPermission,
      client_admin_notes: hasUpdateClientAdminNotesPermission,
      budget_total: hasUpdateBudgetPermission,
      deduction_amount: hasUpdateDeductionPermission,
      project_due_date: hasUpdateDueDatePermission,
      project_points: hasUpdateProjectPointsPermission,
      project_status: hasUpdateProjectStatusPermission,
      project_source: hasUpdateProjectSourcePermission,
      preview_status: hasUpdatePreviewStatusPermission,
    };

    // Determine if the current field is editable
    const canEditField = fieldPermissionMap[field] ?? false;

    return (
      <div className="container ">
        <div className="row">
          <div className="col-12 col-md-2"></div>
          <div className="col-12 col-md-8">
            <h6
              className="m-0"
              style={{ color: "blue", textTransform: "capitalize" }}
            >
              <hr className="mt-2 mb-2" />
              Edit: {field.replace(/_/g, " ")}
              <hr className="mt-2 mb-2" />
            </h6>
            {(() => {
              // Rich Text Editor Fields
              const richTextFields = [
                "project_address",
                "project_main_scope",
                "project_scope_details",
                "project_admin_notes",
                "project_notes_estimator",
                "notes_private",
              ];

              // Select Fields
              const selectFields = [
                "client_id",
                "project_construction_type",
                "project_status",
                "project_source",
                "preview_status",
              ];

              // Number Fields
              const numberFields = [
                "budget_total",
                "deduction_amount",
                "project_points",
              ];

              // TextArea Fields (regular, not rich text)
              const textAreaFields = [
                // Add any other textarea fields here
              ];

              // Date Fields
              const dateFields = ["project_due_date"];

              // Simple Text Inputs
              const textInputFields = [
                "project_title",
                "project_init_link",
                "project_final_link",
                "project_pricing",
                "project_area",
              ];

              // Rich Text Editor
              if (richTextFields.includes(field)) {
                return (
                  <div style={{ width: "100%" }}>
                    <Editor
                      value={currentValue || ""}
                      onEditorChange={setCurrentValue}
                      disabled={loading || !canEditField}
                      init={{
                        height: 300,
                        menubar: false,
                        plugins: "table code lists link",
                        toolbar:
                          "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                        skin: false,
                        content_css: false,
                      }}
                    />
                  </div>
                );
              }

              // Select Input
              if (selectFields.includes(field)) {
                return (
                  <Select
                    style={{ width: "100%" }}
                    value={currentValue}
                    onChange={setCurrentValue}
                    disabled={loading || !canEditField}
                    optionFilterProp="label"
                    options={
                      field === "client_id"
                        ? clients.map((c) => ({ value: c.id, label: c.title }))
                        : field === "project_construction_type"
                        ? [
                            { value: "commercial", label: "Commercial" },
                            { value: "residential", label: "Residential" },
                          ]
                        : field === "project_status"
                        ? [
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
                          ]
                        : field === "preview_status"
                        ? [
                            { value: "active", label: "Active" },
                            { value: "draft", label: "Draft" },
                          ]
                        : field === "project_source"
                        ? [
                            { value: "InSource", label: "In Source" },
                            { value: "OutSource", label: "Out Source" },
                          ]
                        : []
                    }
                  />
                );
              }

              // Number Input
              if (numberFields.includes(field)) {
                return (
                  <InputNumber
                    style={{ width: "100%" }}
                    value={currentValue}
                    onChange={setCurrentValue}
                    disabled={loading || !canEditField}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                  />
                );
              }

              // Date Picker
              if (dateFields.includes(field)) {
                return (
                  <DatePicker
                    style={{ width: "100%" }}
                    value={currentValue ? dayjs(currentValue) : null}
                    onChange={(date, dateString) => setCurrentValue(dateString)}
                    disabled={loading || !canEditField}
                  />
                );
              }

              // TextArea Input
              if (textAreaFields.includes(field)) {
                return (
                  <Input.TextArea
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    value={currentValue || ""}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    disabled={loading || !canEditField}
                  />
                );
              }

              // Default Text Input (for textInputFields and any unspecified fields)
              return (
                <Input
                  value={currentValue || ""}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  disabled={loading || !canEditField}
                  className="flex-grow-1"
                />
              );
            })()}
          </div>
          <div className="col-12 col-md-2"></div>
        </div>
      </div>
    );
  }
);

export default EditColumn;
