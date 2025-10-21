import { Tooltip, Collapse, Avatar, usePage } from "@shared/ui";
const ViewProject = (props) => {
  const { project: selectedProject, onClose } = props;
  const { auth } = usePage().props;
  const user = auth?.user ?? {};
  const members = selectedProject.project_team_members || [];

  return (
    <>
      <div className="container-fluid p-0">
        <div className="row m-0">
          <div className="col-12">
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
          <hr></hr>
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
                        {/* <li>
                          Project Address:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_address
                            ? selectedProject.project_address.replace(
                                /<[^>]+>/g,
                                ""
                              )
                            : "N/A"}
                        </li> */}
                        {selectedProject.project_address && (
                          <li>
                            Project Address:&nbsp;&nbsp;&nbsp;
                            {selectedProject.project_address.replace(
                              /<[^>]+>/g,
                              ""
                            )}
                          </li>
                        )}

                        <li>
                          Project Pricing:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_pricing ? (
                            <b>{selectedProject.project_pricing}</b>
                          ) : (
                            "N/A"
                          )}
                        </li>
                        <li>
                          Project Area:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_area
                            ? selectedProject.project_area
                            : "N/A"}
                        </li>
                        <li>
                          Construction Type:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_construction_type
                            ? selectedProject.project_construction_type
                            : "N/A"}
                        </li>
                        <li>
                          Line Items Pricing:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_line_items_pricing
                            ? selectedProject.project_line_items_pricing
                            : "N/A"}
                        </li>
                        <li>
                          Floor Number:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_floor_number
                            ? selectedProject.project_floor_number
                            : "N/A"}
                        </li>
                        <hr />
                        <li>
                          Private Notes: ?<br></br>
                          <span className="text-muted">
                            {selectedProject.notes_private
                              ? selectedProject.notes_private
                              : "N/A"}
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
                  key: "2",
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
                          Main Scope:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_main_scope
                            ? selectedProject.project_main_scope.replace(
                                /<[^>]+>/g,
                                ""
                              )
                            : "N/A"}
                        </li>
                        <li>
                          Scope Details:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_scope_details
                            ? selectedProject.project_scope_details.replace(
                                /<[^>]+>/g,
                                ""
                              )
                            : "N/A"}
                        </li>
                        <li>
                          Template:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_template
                            ? selectedProject.project_template
                            : "N/A"}
                        </li>
                        <hr />
                      </ul>
                    </>
                  ),
                },
              ]}
              size="small"
              defaultActiveKey={["2"]}
            />
            <Collapse
              className="mt-3 mb-3"
              items={[
                {
                  key: "3",
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
                          {selectedProject.project_init_link ? (
                            <a
                              href={selectedProject.project_init_link}
                              target="_blank"
                            >
                              Admin Link
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </li>
                        <li>
                          Final Link:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_final_link ? (
                            <a
                              href={selectedProject.project_final_link}
                              target="_blank"
                            >
                              Estimator Link
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </li>
                        <li>
                          Admin, Supervisor Notes:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_admin_notes
                            ? selectedProject.project_admin_notes.replace(
                                /<[^>]+>/g,
                                ""
                              )
                            : "N/A"}
                        </li>
                        <li>
                          Estimator Notes:&nbsp;&nbsp;&nbsp;
                          {selectedProject.project_notes_estimator
                            ? selectedProject.project_notes_estimator
                            : "N/A"}
                        </li>
                        <li>
                          Priviate Note:&nbsp;&nbsp;&nbsp;
                          {selectedProject.notes_private
                            ? selectedProject.notes_private.replace(
                                /<[^>]+>/g,
                                ""
                              )
                            : "N/A"}
                        </li>
                        <hr />
                      </ul>
                    </>
                  ),
                },
              ]}
              size="small"
              defaultActiveKey={["3"]}
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
                        title={per.user?.name || "N/A"}
                        placement="top"
                        key={index}
                      >
                        {per.user?.media?.[0]?.file_path ? (
                          <Avatar
                            style={{
                              marginLeft: index > 0 ? 1 : 0,
                            }}
                            src={`/${per.user.media[0].file_path}`}
                            alt={per.user.name}
                          />
                        ) : (
                          <Avatar
                            style={{
                              backgroundColor: "#1890ff",
                              marginLeft: index > 0 ? 1 : 0,
                            }}
                          >
                            {per.user?.name
                              ? per.user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                              : "U"}
                          </Avatar>
                        )}
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
                      {(() => {
                        const isSuperAdmin = user.role_id === 1;
                        const isJoined = members.some(
                          (m) => m.user_id === user.id
                        );

                        // 🔒 Permission check
                        if (!isSuperAdmin && !isJoined) {
                          return (
                            <p
                              style={{
                                color: "#999",
                                fontStyle: "italic",
                                marginLeft: "10px",
                              }}
                            >
                              N/A (You’re not part of this project’s estimator
                              team)
                            </p>
                          );
                        }
                        return (
                          <>
                            <ul style={{ listStyleType: "circle" }}>
                              {members.map((per, index) => {
                                const name = per.user?.name || "Unknown";
                                const steps = per.steps || [];

                                return (
                                  <li key={index}>
                                    <li>
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
                                        {Array.isArray(steps) &&
                                        steps.length > 0 ? (
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
                                        <li>
                                          Started At:{" "}
                                          {per.started_at
                                            ? new Date(
                                                per.started_at
                                              ).toLocaleDateString()
                                            : "—"}
                                        </li>
                                        <li>
                                          Completed At:{" "}
                                          {per.completed_at
                                            ? new Date(
                                                per.completed_at
                                              ).toLocaleDateString()
                                            : "—"}
                                        </li>
                                        <li>
                                          Duration:{" "}
                                          {per.completed_at && per.started_at
                                            ? `${Math.round(
                                                (new Date(per.completed_at) -
                                                  new Date(per.started_at)) /
                                                  (1000 * 60 * 60 * 24)
                                              )} days`
                                            : "Not completed yet"}
                                        </li>
                                        <li>
                                          Points Gained:{" "}
                                          {per.points_gain ?? "—"}
                                        </li>
                                        <li>Notes: {per.notes ?? "—"}</li>
                                      </ul>
                                    </li>
                                    <hr />
                                  </li>
                                );
                              })}
                            </ul>
                            <hr />
                          </>
                        );
                      })()}
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
                        {selectedProject.client ? (
                          <>
                            <li>
                              Client Title:&nbsp;&nbsp;&nbsp;
                              {selectedProject.client.title || "N/A"}
                            </li>
                            <li>
                              Client:&nbsp;&nbsp;&nbsp;
                              {selectedProject.client.name || "N/A"}
                            </li>
                            <li>
                              Client Email:&nbsp;&nbsp;&nbsp;
                              {selectedProject.client.email || "N/A"}
                            </li>
                            <li>
                              Estimator Notes:&nbsp;&nbsp;&nbsp;
                              {selectedProject.client.phone || "N/A"}
                            </li>
                            <li>
                              Client Notes:&nbsp;&nbsp;&nbsp;
                              {selectedProject.client.notes || "N/A"}
                            </li>
                            <hr />
                            <li>
                              Details ?:
                              <br />
                              <span className="text-muted">
                                Place Holder: ....
                              </span>
                            </li>
                          </>
                        ) : (
                          <li>
                            <strong>No client information available.</strong>
                          </li>
                        )}
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
                        Total Budget \ Deduction \ Final Price
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
                            : "N/A"}
                        </li>
                        <li>
                          Deduction:&nbsp;&nbsp;&nbsp;
                          {selectedProject.deduction_amount
                            ? selectedProject.deduction_amount
                            : "N/A"}
                        </li>
                        <li>
                          Final Price:&nbsp;&nbsp;&nbsp;{" "}
                          {selectedProject.budget_total -
                            selectedProject.deduction_amount}
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
