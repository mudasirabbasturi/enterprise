import { useState } from "react";
import { Input, Select, Button } from "@shared/ui";
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
import "react-international-phone/style.css";
const { TextArea } = Input;
const AddProject = () => {
  const [loading, setLoading] = useState(false);
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
                  <hr className="m-0"></hr>
                </label>
                <Input placeholder="Add Project Title" />
              </div>
              <div className="mb-3">
                <label htmlFor="project_address">Project Address:</label>
                <Editor
                  init={{
                    height: 150,
                    menubar: false,
                    plugins: "table code lists link",
                    toolbar:
                      "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                    skin: false,
                    content_css: false,
                  }}
                />
              </div>
            </div>

            <div className="d-flex align-items-center mb-3">
              <label
                className="me-1"
                style={{ whiteSpace: "nowrap" }}
                htmlFor="client_id"
              >
                Select Client:<hr className="m-0"></hr>
              </label>
              <Select
                // value={values.branch_id || null}
                // onChange={(data) => onChangeDepartmentValue("branch_id", data)}
                placeholder="Select Client"
                allowClear
                showSearch
                // options={branches.map((branch) => ({
                //     value: branch.id,
                //     label: branch.name,
                // }))}
                // disabled={loading}
                options={[
                  { value: "Label 1", label: "value 1" },
                  { value: "Label 2", label: "value 2" },
                  { value: "Label 3", label: "value 3" },
                  { value: "Label 4", label: "value 4" },
                ]}
              />
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
                  Pricing:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="Add Project Pricing" />
                <label
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                  htmlFor="project_area"
                >
                  Area:<hr className="m-0"></hr>
                </label>
                <Input placeholder="Add Project Area" />
              </div>
              <div className="d-flex align-items-center mb-3">
                <label
                  htmlFor="project_construction_type"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Construction Type:<hr className="m-0"></hr>
                </label>
                <Select
                  // value={values.branch_id || null}
                  // onChange={(data) => onChangeDepartmentValue("branch_id", data)}
                  className="me-1"
                  placeholder="Select Construction Type"
                  allowClear
                  showSearch
                  // options={branches.map((branch) => ({
                  //     value: branch.id,
                  //     label: branch.name,
                  // }))}
                  // disabled={loading}
                  options={[
                    { value: "commercial", label: "Commercial" },
                    { value: "residential", label: "Residential" },
                  ]}
                />
                <label
                  htmlFor="project_template"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Project Template:<hr className="m-0"></hr>
                </label>
                <Input placeholder="project_template" />
              </div>
              <div className="d-flex align-items-center mb-3">
                <label
                  htmlFor="project_line_items_pricing"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Line Items Pricing:<hr className="m-0"></hr>
                </label>
                <Input
                  className="me-1"
                  placeholder="Add Project Line Items Pricing"
                />
                <label
                  htmlFor="project_floor_number"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Floor Number:<hr className="m-0"></hr>
                </label>
                <Input placeholder="Add Project Floor Number" />
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
                  Initial Link:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="project_init_link" />
                <label
                  htmlFor="project_final_link"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Final Link:<hr className="m-0"></hr>
                </label>
                <Input placeholder="project_final_link" />
              </div>
            </div>
            {/* Projects Links End */}

            {/* Project Duration, Timings Start .... */}
            <div>
              <hr className="mt-2 mb-2"></hr>
              <h6 className="m-0" style={{ color: "blue" }}>
                Project Duration, Timings
              </h6>
              <hr className="mt-2 mb-2"></hr>
              <div className="d-flex align-items-center mb-3">
                <label
                  htmlFor="project_start_date"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Started Date:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="project_start_date" />
                <label
                  htmlFor="actual_start_date"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Start At:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="actual_start_date" />
              </div>
              <div className="d-flex align-items-center mb-3">
                <label
                  htmlFor="project_duration"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Duration:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="project_duration" />
                <label
                  htmlFor="actual_duration"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Total Duration Taken:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="actual_duration" />
              </div>
              <div className="d-flex align-items-center mb-3">
                <label
                  htmlFor="project_due_date"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Due Date:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="project_due_date" />
                <label
                  htmlFor="actual_end_date"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  End At:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="actual_end_date" />
              </div>
            </div>
            {/* Project Duration, Timings End .... */}

            {/* Financials & Budgeting Start */}
            <div>
              <hr className="mt-2 mb-2"></hr>
              <h6 className="m-0" style={{ color: "blue" }}>
                Financials & Budget:
              </h6>
              <hr className="mt-2 mb-2"></hr>
              <div className="d-flex align-items-center mb-3">
                <label
                  htmlFor="budget_total"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Total Budget:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="budget_total" />
                <label
                  htmlFor="tax_amount"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Tax Amount:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="tax_amount" />
              </div>
              <div className="d-flex align-items-center mb-3">
                <label
                  htmlFor="discount_amount"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Discount Amount:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="discount_amount" />
                <label
                  htmlFor="deduction_amount"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Deduction Amount:<hr className="m-0"></hr>
                </label>
                <Input placeholder="deduction_amount" />
              </div>
              <div className="d-flex align-items-center mb-3">
                <label
                  htmlFor="price_final"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Final Price:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="price_final" />
                <label
                  htmlFor="amount_paid"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Amount Paid:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="amount_paid" />
              </div>
              <div className="d-flex align-items-center mb-3">
                <label
                  htmlFor="amount_due"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Amount Due:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="amount_due" />
                <label
                  htmlFor="amount_received"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Amount Received:<hr className="m-0"></hr>
                </label>
                <Input placeholder="amount_received" />
              </div>
            </div>
            {/* Financials & Budgeting End */}

            {/* Points & Status Start */}
            <div>
              <hr className="mt-2 mb-2"></hr>
              <h6 className="m-0" style={{ color: "blue" }}>
                Project Points, Status & Preview Status:
              </h6>
              <hr className="mt-2 mb-2"></hr>
              <div className="d-flex align-items-center mb-3">
                <label
                  htmlFor="project_points"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Project Points:<hr className="m-0"></hr>
                </label>
                <Input placeholder="project_points" />
              </div>
              <div className="d-flex align-items-center mb-3">
                <label
                  htmlFor="project_status"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Project Status:<hr className="m-0"></hr>
                </label>
                <Input className="me-1" placeholder="project_status" />
                <label
                  htmlFor="preview_status"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Preview Status:<hr className="m-0"></hr>
                </label>
                <Input placeholder="preview_status" />
              </div>
            </div>
            {/* Points & Status End */}
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
                <label htmlFor="project_main_scope">Project Main Scope:</label>
                <Editor
                  init={{
                    height: 150,
                    menubar: false,
                    plugins: "table code lists link",
                    toolbar:
                      "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                    skin: false,
                    content_css: false,
                  }}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="project_scope_details">
                  Project Scope Details:
                </label>
                <Editor
                  init={{
                    height: 150,
                    menubar: false,
                    plugins: "table code lists link",
                    toolbar:
                      "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                    skin: false,
                    content_css: false,
                  }}
                />
              </div>
            </div>
            {/* Main Scope & Scope Details End */}

            {/* Notes Start */}
            <div>
              <hr className="mt-2 mb-2"></hr>
              <h6 className="m-0" style={{ color: "blue" }}>
                Admin Or Supervisor, Estimator ,General ,Private Notes:
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
                  init={{
                    height: 150,
                    menubar: false,
                    plugins: "table code lists link",
                    toolbar:
                      "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                    skin: false,
                    content_css: false,
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
                  init={{
                    height: 150,
                    menubar: false,
                    plugins: "table code lists link",
                    toolbar:
                      "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                    skin: false,
                    content_css: false,
                  }}
                />
              </div>
              <div className="mb-3">
                <label
                  htmlFor="general_notes"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  General Notes:<hr className="m-0"></hr>
                </label>
                <Editor
                  init={{
                    height: 150,
                    menubar: false,
                    plugins: "table code lists link",
                    toolbar:
                      "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                    skin: false,
                    content_css: false,
                  }}
                />
              </div>
              <div className="mb-3">
                <label
                  htmlFor="notes_private"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Private Notes:<hr className="m-0"></hr>
                </label>
                <Editor
                  init={{
                    height: 150,
                    menubar: false,
                    plugins: "table code lists link",
                    toolbar:
                      "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                    skin: false,
                    content_css: false,
                  }}
                />
              </div>
            </div>
            {/* Notes End */}
          </div>
        </div>
      </div>
      ;
    </>
  );
};
export default AddProject;
