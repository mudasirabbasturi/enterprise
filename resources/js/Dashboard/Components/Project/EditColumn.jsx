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
import "tinymce/skins/ui/oxide/skin.css";

const EditColumn = forwardRef(
  ({ clients, onClose, setParentLoading, field, value, id }, ref) => {
    const route = useRoute();
    const [loading, setLoading] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    const handleSubmit = () => {
      setLoading(true);
      setParentLoading?.(true);

      const updateData = {
        id,
        field,
        [field]: currentValue,
      };
      router.put(route("project.column.update", id), updateData, {
        preserveScroll: true,
        onSuccess: () => onClose(),
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
                      disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
                    formatter={(value) =>
                      `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                );
              }

              // Default Text Input (for textInputFields and any unspecified fields)
              return (
                <Input
                  value={currentValue || ""}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  disabled={loading}
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
