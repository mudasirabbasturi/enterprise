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
                        {selectedProject.project_address && (
                          <li>
                            Project Address:
                            <b>
                              {" "}
                              {selectedProject.project_address.replace(
                                /<[^>]+>/g,
                                ""
                              )}
                            </b>
                          </li>
                        )}
                        {selectedProject.project_main_scope && (
                          <li>
                            Main Scope:
                            <b>
                              {" "}
                              {selectedProject.project_main_scope.replace(
                                /<[^>]+>/g,
                                ""
                              )}
                            </b>
                          </li>
                        )}
                        {selectedProject.project_scope_details && (
                          <li>
                            Scope Details:
                            <b>
                              {" "}
                              {selectedProject.project_scope_details.replace(
                                /<[^>]+>/g,
                                ""
                              )}
                            </b>
                          </li>
                        )}
                        {selectedProject.project_admin_notes && (
                          <li>
                            Admin Notes:
                            <b>
                              {" "}
                              {selectedProject.project_admin_notes.replace(
                                /<[^>]+>/g,
                                ""
                              )}
                            </b>
                          </li>
                        )}
                        {selectedProject.project_admin_notes && (
                          <li>
                            Admin Notes:
                            <b>
                              {" "}
                              {selectedProject.project_admin_notes.replace(
                                /<[^>]+>/g,
                                ""
                              )}
                            </b>
                          </li>
                        )}
                        {selectedProject.project_template && (
                          <li>
                            Template:
                            <b>
                              {" "}
                              {selectedProject.project_template.replace(
                                /<[^>]+>/g,
                                ""
                              )}
                            </b>
                          </li>
                        )}
                        {selectedProject.project_pricing && (
                          <li>
                            Project Pricing:
                            <b>
                              {" "}
                              {selectedProject.project_pricing.replace(
                                /<[^>]+>/g,
                                ""
                              )}
                            </b>
                          </li>
                        )}
                        {selectedProject.project_init_link && (
                          <li>
                            OnSIDE link:
                            <b>
                              {" "}
                              <a href={selectedProject.project_init_link}>
                                Link
                              </a>
                            </b>
                          </li>
                        )}
                        {selectedProject.project_final_link && (
                          <li>
                            OffSide link:
                            <b>
                              {" "}
                              <a href={selectedProject.project_final_link}>
                                Link
                              </a>
                            </b>
                          </li>
                        )}
                        {selectedProject.project_notes_estimator && (
                          <li>
                            Estimator Notes:
                            <b>
                              {" "}
                              {selectedProject.project_notes_estimator.replace(
                                /<[^>]+>/g,
                                ""
                              )}
                            </b>
                          </li>
                        )}
                      </ul>
                    </>
                  ),
                },
              ]}
              size="small"
              defaultActiveKey={["1"]}
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
                  key: "1",
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
              defaultActiveKey={["1"]}
            />
          </div>
          {/* <div className="col-12 col-md-6">
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
          </div> */}
        </div>
      </div>
    </>
  );
};
export default ViewProject;
