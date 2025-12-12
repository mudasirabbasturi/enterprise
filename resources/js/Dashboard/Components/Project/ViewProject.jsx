import {  Collapse, usePage } from "@shared/ui";
const ViewProject = ({selectedProject}) => {

  const { props } = usePage();
  const hasPermission = (userpermission, permName) => userpermission?.some((p) => p.name === permName);
  const userPermissions = props?.auth?.user?.role?.permissions ?? [];
  const can = (perm) => hasPermission(userPermissions, perm);

  const { auth } = usePage().props;
  const user = auth?.user ?? {};


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
                        Quick Details
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        {selectedProject.project_address && (
                          <li>
                            <b>Project Address: </b>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedProject.project_address,
                              }}
                            />
                          </li>
                        )}
                        {selectedProject.project_template && (
                          <li>
                            <b>Template: </b>
                            {selectedProject.project_template.replace(
                              /<[^>]+>/g,
                              ""
                            )}
                          </li>
                        )}
                        {/* {selectedProject.client_name_for_admin && (
                          <li>
                            <b>Client Name Admin: </b>
                            {selectedProject.client_name_for_admin.replace(
                              /<[^>]+>/g,
                              ""
                            )}
                          </li>
                        )} */}
                        {user?.role?.name === "Super Admin" ||
                        user?.role_id === 1
                          ? selectedProject.client_name_for_admin && (
                              <li>
                                <b>Client Name Admin: </b>
                                {selectedProject.client_name_for_admin.replace(
                                  /<[^>]+>/g,
                                  ""
                                )}
                              </li>
                            )
                          : null}

                        {selectedProject.project_main_scope && (
                          <li>
                            <b>Main Scope: </b>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedProject.project_main_scope,
                              }}
                            />
                          </li>
                        )}
                        {selectedProject.project_scope_details && (
                          <li>
                            <b>Scope Details: </b>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedProject.project_scope_details,
                              }}
                            />
                          </li>
                        )}
                        {selectedProject.project_admin_notes && (
                          <li>
                            <b>Admin Notes: </b>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedProject.project_admin_notes,
                              }}
                            />
                          </li>
                        )}
                        {selectedProject.project_pricing && (
                          <li>
                            <b>Project Pricing: </b>

                            {selectedProject.project_pricing.replace(
                              /<[^>]+>/g,
                              ""
                            )}
                          </li>
                        )}
                        {selectedProject.project_init_link && (
                          <li>
                            <b>Admin link: </b>
                            <a
                              href={selectedProject.project_init_link}
                              target="_blanck"
                            >
                              Link
                            </a>
                          </li>
                        )}
                        {selectedProject.project_final_link && (
                          <li>
                            <b>Estimator link: </b>
                            <a
                              href={selectedProject.project_final_link}
                              target="_blanck"
                            >
                              Link
                            </a>
                          </li>
                        )}

                        {selectedProject.project_notes_estimator && (
                          <li>
                            <b>Estimator Notes: </b>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedProject.project_notes_estimator,
                              }}
                            />
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
                  key: "2",
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
                            {can("View Title") && (
                              <li>
                                <b>Client Title: </b>
                                {selectedProject.client.title || "N/A"}
                              </li>
                            )}
                            {can("View Name") && (
                              <li>
                                <b>Client Name: </b>
                                {selectedProject.client.name || "N/A"}
                              </li>
                            )}
                            {can("View Email") && (
                              <li>
                                <b>Client Email: </b>
                                {selectedProject.client.email || "N/A"}
                              </li>
                            )}
                            {can("View Phone") && (
                              <li>
                                <b>Estimator Phone: </b>
                                {selectedProject.client.phone || "N/A"}
                              </li>
                            )}
                            {can("View Notes") && (
                              <li>
                                <b>Client Notes: </b>{" "}
                                <hr className="mb-1 mt-1"></hr>
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: selectedProject.client.notes,
                                  }}
                                />
                              </li>
                            )}
                            <hr />
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
              defaultActiveKey={["2"]}
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
                  Project More Details:&nbsp;
                </h6>
              </div>
            </div>
            <hr className="mb-0 mt-0"></hr>
            <Collapse
              className="mt-3 mb-3"
              items={[
                {
                  key: "3",
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        More Details
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        <li>
                          <b>Construction Type: </b>
                          {selectedProject.project_construction_type
                            ? selectedProject.project_construction_type
                            : "N/A"}
                        </li>

                        <li>
                          <b>Line Items Pricing: </b>
                          {selectedProject.project_line_items_pricing
                            ? selectedProject.project_line_items_pricing
                            : "N/A"}
                        </li>
                        <li>
                          <b>Floor Number:&nbsp;</b>
                          {selectedProject.project_floor_number
                            ? selectedProject.project_floor_number
                            : "N/A"}
                        </li>
                        <li>
                          <b>Project Area:&nbsp;</b>
                          {selectedProject.project_area
                            ? selectedProject.project_area
                            : "N/A"}
                        </li>
                      </ul>
                    </>
                  ),
                },
              ]}
              size="small"
              defaultActiveKey={["3"]}
            />
          </div>
        </div>
      </div>
    </>
  );
};
export default ViewProject;
