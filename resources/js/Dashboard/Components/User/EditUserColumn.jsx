import React, { useState, useImperativeHandle, forwardRef } from "react";
import {
  router,
  useRoute, // ziggy routing
  Input,
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

const EditUserColumn = forwardRef(
  (
    {
      branches,
      departments,
      designations,
      roles,
      onClose,
      setParentLoading,
      field,
      value,
      id,
    },
    ref
  ) => {
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
      router.put(route("user.column.update", id), updateData, {
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
              const richTextFields = ["notes", "notes_private"];
              const selectFields = [
                "branch_id",
                "department_id",
                "designation_id",
                "role_id",
                "status",
              ];

              // TextArea Fields (regular, not rich text)
              const textAreaFields = ["permanent_address", "current_address"];

              // Date Fields
              const dateFields = [
                "dob",
                "joining_date",
                "hiring_date",
                "leaving_date",
              ];

              const passwordInputFields = ["password"];

              // Simple Text Inputs
              const textInputFields = [
                "name",
                "email",
                "password",
                "phone",
                "country",
                "state",
                "city",
                "postal_or_zip_code",
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
                      field === "branch_id"
                        ? branches.map((branch) => ({
                            value: branch.id,
                            label: branch.name,
                          }))
                        : field === "department_id"
                        ? departments.map((dep) => ({
                            value: dep.id,
                            label: dep.name,
                          }))
                        : field === "designation_id"
                        ? designations.map((des) => ({
                            value: des.id,
                            label: des.name,
                          }))
                        : field === "role_id"
                        ? roles.map((role) => ({
                            value: role.id,
                            label: role.name,
                          }))
                        : field === "status"
                        ? [
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "In Active" },
                            { value: "suspended", label: "Suspended" },
                          ]
                        : []
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

              // Password Input
              if (passwordInputFields.includes(field)) {
                return (
                  <Input.Password
                    placeholder="Update Password"
                    allowClear
                    value={currentValue || ""}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
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

export default EditUserColumn;
