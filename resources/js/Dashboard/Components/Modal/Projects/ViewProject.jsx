import {
  Link,
  useRoute, // ziggy routing
  Tooltip,
  Collapse,
  Avatar,
  UserOutlined, // ant icon
} from "@shared/ui";
const ViewProject = (props) => {
  const { project: selectedProject, onClose } = props;
  const route = useRoute();
  const members = selectedProject.project_has_many_project_team_member || [];
  return (
    <>
      <div className="container-fluid p-0">
        <div className="row m-0">
          {/* <div className="col-12">
            <div className="">
              <div className="d-flex align-items-center">
                <h5 style={{ textDecoration: "underline" }} className="me-2">
                  Title:
                </h5>
                <h5 style={{ fontWeight: "normal", color: "#1890ff" }}>
                  {selectedProject.project_title}
                </h5>
              </div>
            </div>
          </div>
          <hr></hr> */}
          <div className="col-12 col-md-6">
            <hr className="mb-0 mt-0"></hr>
            <div className="mt-1 mb-1">
              <div className="d-flex justify-content-between bg-light p-2 rounded">
                <h6
                  style={{ textDecoration: "underline" }}
                  className="me-2 mb-0"
                >
                  Project Details:&nbsp;&nbsp;&nbsp;
                </h6>
                <h6
                  style={{ fontWeight: "normal", color: "#18c9ffff" }}
                  className="mb-0"
                >
                  (Status: {selectedProject.project_status})
                </h6>
              </div>
            </div>
            <hr className="mb-0 mt-0"></hr>
            <Collapse
              className="mt-3 mb-3"
              items={[
                {
                  key: "1",
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Address \ Pricing \ Area \ Construction Type \ Line
                        Items Pricing \ Floor Number \ Notes \ Private Notes:
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        <li>
                          Project Address:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_address
                            ? selectedProject.project_address
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Project Pricing:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_pricing
                            ? selectedProject.project_pricing
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Project Area:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_area
                            ? selectedProject.project_area
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Construction Type:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_construction_type
                            ? selectedProject.project_construction_type
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Line Items Pricing:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_line_items_pricing
                            ? selectedProject.project_line_items_pricing
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Floor Number:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_floor_number
                            ? selectedProject.project_floor_number
                            : "Not Added, Add New.."}
                        </li>
                        <hr />
                        <li>
                          General Notes: ?<br></br>
                          <span className="text-muted">
                            {selectedProject.general_notes
                              ? selectedProject.general_notes
                              : "Not Added, Add New.."}
                          </span>
                        </li>
                        <hr />
                        <li>
                          Private Notes: ?<br></br>
                          <span className="text-muted">
                            {selectedProject.notes_private
                              ? selectedProject.notes_private
                              : "Not Added, Add New.."}
                          </span>
                        </li>
                      </ul>
                    </>
                  ),
                },
              ]}
              size="small"
              defaultActiveKey={["1"]}
            />
            <Collapse
              className="mt-3 mb-3"
              items={[
                {
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Main Scope \ Scope Detail \ Template :
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        <li>
                          Project Main Scope:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_main_scope
                            ? selectedProject.project_main_scope
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Project Scope Details:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_scope_details
                            ? selectedProject.project_scope_details
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Project Template:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_template
                            ? selectedProject.project_template
                            : "Not Added, Add New.."}
                        </li>
                        <hr />
                        <li>
                          Details ?:<br></br>
                          <span className="text-muted">Place Holder: ....</span>
                        </li>
                      </ul>
                    </>
                  ),
                },
              ]}
              size="small"
            />
            <Collapse
              className="mt-3 mb-3"
              items={[
                {
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Initial Link \ Final Link \ Admin, Supervisor Notes \
                        Estimator Notes \ Priviate Note:
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        <li>
                          Initial Link:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_init_link
                            ? selectedProject.project_init_link
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Final Link:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_final_link
                            ? selectedProject.project_final_link
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Admin, Supervisor Notes:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_notes_owner_or_supervisor
                            ? selectedProject.project_notes_owner_or_supervisor
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Estimator Notes:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_notes_estimator
                            ? selectedProject.project_notes_estimator
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Priviate Note:&nbsp;&nbsp;&nbsp;
                          {selectedProject.notes_private
                            ? selectedProject.notes_private
                            : "Not Added, Add New.."}
                        </li>
                        <hr />
                        <li>
                          Details ?:<br></br>
                          <span className="text-muted">Place Holder: ....</span>
                        </li>
                      </ul>
                    </>
                  ),
                },
              ]}
              size="small"
            />
            <hr className="mb-0 mt-0"></hr>
            <div className="mt-1 mb-1">
              <div className="d-flex bg-light p-2 rounded">
                <h6
                  style={{ textDecoration: "underline" }}
                  className="me-2 mb-0"
                >
                  Project Rating:&nbsp;
                </h6>
              </div>
            </div>
            <hr className="mb-0 mt-0"></hr>
            <Collapse
              className="mt-3 mb-3"
              items={[
                {
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Rating \ Feedback \ Notes:
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        {selectedProject.project_has_many_project_rating?.map(
                          (rating, index) => {
                            const userName =
                              rating.project_rating_belongs_to_user?.name ||
                              "Unknown";
                            return (
                              <li key={index}>
                                <strong>{userName}</strong>

                                <ul
                                  style={{
                                    listStyleType: "square",
                                    paddingLeft: 20,
                                  }}
                                >
                                  <li>
                                    <strong
                                      style={{ textDecoration: "underline" }}
                                    >
                                      Project Rating:
                                    </strong>{" "}
                                    {rating.project_rating ?? "—"}
                                  </li>
                                  <li>
                                    <strong
                                      style={{ textDecoration: "underline" }}
                                    >
                                      Project Feedback:
                                    </strong>{" "}
                                    {rating.project_feedback ?? "—"}
                                  </li>
                                  <li>
                                    <strong
                                      style={{ textDecoration: "underline" }}
                                    >
                                      Notes:
                                    </strong>{" "}
                                    {rating.notes ?? "—"}
                                  </li>
                                </ul>

                                <hr />
                              </li>
                            );
                          }
                        )}
                      </ul>
                    </>
                  ),
                },
              ]}
              size="small"
            />
          </div>
          <div className="col-12 col-md-6">
            <hr className="mb-0 mt-0"></hr>
            <div className="mt-1 mb-1">
              <div className="d-flex bg-light p-2 rounded">
                <h6
                  style={{ textDecoration: "underline" }}
                  className="me-2 mb-0"
                >
                  Project Team Member:&nbsp;
                  <Avatar.Group>
                    {members.map((per, index) => (
                      <Tooltip
                        title={
                          per.project_team_member_belongs_to_user?.name || "N/A"
                        }
                        placement="top"
                        key={index}
                      >
                        <Avatar
                          style={{
                            backgroundColor: "#87d068",
                            marginLeft: index > 0 ? 1 : 0,
                          }}
                          icon={<UserOutlined />}
                        />
                      </Tooltip>
                    ))}
                  </Avatar.Group>
                </h6>
              </div>
            </div>
            <hr className="mb-0 mt-0"></hr>
            <Collapse
              className="mb-3 mt-3"
              items={[
                {
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Joined Member, Steps & Details:
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        {members.map((per, index) => {
                          const name =
                            per.project_team_member_belongs_to_user?.name ||
                            "Unknown";
                          const steps = per.steps || [];
                          return (
                            <>
                              <li key={index}>
                                <strong>{name}</strong>
                                <li
                                  style={{
                                    fontWeight: "600",
                                    textDecoration: "underline",
                                    listStyleType: "none",
                                  }}
                                >
                                  Project Steps:
                                </li>
                                <ul
                                  style={{
                                    listStyleType: "square",
                                    paddingLeft: 20,
                                  }}
                                >
                                  {Array.isArray(steps) && steps.length > 0 ? (
                                    steps.map((step, stepIndex) => (
                                      <li key={stepIndex}>{step}</li>
                                    ))
                                  ) : (
                                    <li>No steps</li>
                                  )}
                                </ul>
                                <li
                                  style={{
                                    fontWeight: "600",
                                    textDecoration: "underline",
                                    listStyleType: "none",
                                  }}
                                >
                                  More Details:
                                </li>
                                <ul
                                  style={{
                                    listStyleType: "square",
                                    paddingLeft: 20,
                                  }}
                                >
                                  <li>Started At: {per.started_at ?? "—"}</li>
                                  <li>
                                    Completed At: {per.completed_at ?? "—"}
                                  </li>
                                  <li>Duration: {per.duration ?? "—"}</li>
                                  <li>Status: {per.status ?? "—"}</li>
                                  <li>
                                    Points Gained: {per.points_gain ?? "—"}
                                  </li>
                                  <li>Notes: {per.notes ?? "—"}</li>
                                </ul>
                              </li>
                              <hr />
                            </>
                          );
                        })}
                      </ul>
                      <hr />
                      <li>
                        Details: ? <br></br>
                        Place holder .....
                      </li>
                    </>
                  ),
                },
              ]}
              size="small"
            />
            <hr className="mb-0 mt-0"></hr>
            <div className="mt-1 mb-1">
              <div className="d-flex bg-light p-2 rounded">
                <h6
                  style={{ textDecoration: "underline" }}
                  className="me-2 mb-0"
                >
                  Client Details:&nbsp;
                </h6>
              </div>
            </div>
            <hr className="mb-0 mt-0"></hr>
            <Collapse
              className="mt-3 mb-3"
              items={[
                {
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Title \ Name \ Email \ Phone \ Notes
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        <li>
                          Client Title:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_belongs_to_client.title
                            ? selectedProject.project_belongs_to_client.title
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Client:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_belongs_to_client.name
                            ? selectedProject.project_belongs_to_client.name
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Client Email:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_belongs_to_client.email
                            ? selectedProject.project_belongs_to_client.email
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Estimator Notes:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_belongs_to_client.phone
                            ? selectedProject.project_belongs_to_client.phone
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Client Notes:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_belongs_to_client.notes
                            ? selectedProject.project_belongs_to_client.notes
                            : "Not Added, Add New.."}
                        </li>
                        <hr />
                        <li>
                          Details ?:<br></br>
                          <span className="text-muted">Place Holder: ....</span>
                        </li>
                      </ul>
                    </>
                  ),
                },
              ]}
              size="small"
            />
            <hr className="mb-0 mt-0"></hr>
            <div className="mt-1 mb-1">
              <div className="d-flex bg-light p-2 rounded">
                <h6
                  style={{ textDecoration: "underline" }}
                  className="me-2 mb-0"
                >
                  Financials & Budgeting:&nbsp;
                </h6>
              </div>
            </div>
            <hr className="mb-0 mt-0"></hr>
            <Collapse
              className="mt-3 mb-3"
              items={[
                {
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Total Budget \ Tax Amount \ Discount \ Deduction \ Final
                        Price \ Amount Paid \ Amount Due \ Amount Received
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        <li>
                          Total Budget:&nbsp;&nbsp;&nbsp;
                          {selectedProject.budget_total
                            ? selectedProject.budget_total
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Project Pricing:&nbsp;&nbsp;&nbsp;
                          {selectedProject.tax_amount
                            ? selectedProject.tax_amount
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Discount:&nbsp;&nbsp;&nbsp;
                          {selectedProject.discount_amount
                            ? selectedProject.discount_amount
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Deduction:&nbsp;&nbsp;&nbsp;
                          {selectedProject.deduction_amount
                            ? selectedProject.deduction_amount
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Final Price:&nbsp;&nbsp;&nbsp;
                          {selectedProject.price_final
                            ? selectedProject.price_final
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Amount Paid:&nbsp;&nbsp;&nbsp;
                          {selectedProject.amount_paid
                            ? selectedProject.amount_paid
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Amount Due:&nbsp;&nbsp;&nbsp;
                          {selectedProject.amount_due
                            ? selectedProject.amount_due
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          Amount Received:&nbsp;&nbsp;&nbsp;
                          {selectedProject.amount_received
                            ? selectedProject.amount_received
                            : "Not Added, Add New.."}
                        </li>
                        <hr />
                        <li>
                          More: ?<br></br>
                          <span className="text-muted">
                            Detail: Place Holder...
                          </span>
                        </li>
                      </ul>
                    </>
                  ),
                },
              ]}
              size="small"
            />
          </div>
        </div>
      </div>
    </>
  );
};
export default ViewProject;
