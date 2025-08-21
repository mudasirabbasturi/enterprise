import {
  Link,
  useRoute, // ziggy routing
  Tooltip,
  Collapse,
  Avatar,
  UserOutlined, // ant icon
} from "@shared/ui";
const ViewUser = (props) => {
  const { data: selectedUser, onClose } = props;
  const route = useRoute();
  return (
    <>
      <div className="container-fluid p-0">
        <div className="row m-0">
          <div className="col-12">
            <div className="">
              <div className="d-flex align-items-center">
                <h5 style={{ textDecoration: "underline" }} className="me-2">
                  Full Name:
                </h5>
                <h5 style={{ fontWeight: "normal", color: "#1890ff" }}>
                  {selectedUser.name}
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
                  User Details:&nbsp;&nbsp;&nbsp;
                </h6>
                <h6
                  style={{ fontWeight: "normal", color: "#18c9ffff" }}
                  className="mb-0"
                >
                  (Status: {selectedUser.status})
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
                        User Details:
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        <li>
                          <b>Full Name</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.name
                            ? selectedUser.name
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>User Email</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.email
                            ? selectedUser.email
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>User Phone</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.phone
                            ? selectedUser.phone
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>Date Of Birth</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.dob
                            ? selectedUser.dob
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>Country</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.country
                            ? selectedUser.country
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>State</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.state
                            ? selectedUser.state
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>City</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.city
                            ? selectedUser.city
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>Joining Date</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.joining_date
                            ? selectedUser.joining_date
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>Hiring Date</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.hiring_date
                            ? selectedUser.hiring_date
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>Leaving Date</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.leaving_date
                            ? selectedUser.leaving_date
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>Branch</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.branch?.name ?? "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>Department</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.department?.name ??
                            "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>Designation</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.designation?.name ??
                            "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>Postal Or Zip Code</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.postal_or_zip_code
                            ? selectedUser.postal_or_zip_code
                            : "Not Added, Add New.."}
                        </li>
                        <hr />
                        <li>
                          <b>Current Address</b>: <br></br>
                          <span className="text-muted">
                            {selectedUser.current_address
                              ? selectedUser.current_address
                              : "Not Added, Add New.."}
                          </span>
                        </li>
                        <li>
                          <b>Permanent Address</b>: <br></br>
                          <span className="text-muted">
                            {selectedUser.permanent_address
                              ? selectedUser.permanent_address
                              : "Not Added, Add New.."}
                          </span>
                        </li>
                        <li>
                          <b>Notes:</b>: <br></br>
                          <span className="text-muted">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedUser.notes
                                  ? selectedUser.notes
                                  : "Not Added, Add New..",
                              }}
                            />
                          </span>
                        </li>
                        <li>
                          <b>Private Notes</b>: <br></br>
                          <span className="text-muted">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedUser.notes_private
                                  ? selectedUser.notes_private
                                  : "Not Added, Add New..",
                              }}
                            />
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
          </div>
          <div className="col-12 col-md-6">
            <hr className="mb-0 mt-0"></hr>
            <div className="mt-1 mb-1">
              <div className="d-flex justify-content-between bg-light p-2 rounded">
                <h6
                  style={{ textDecoration: "underline" }}
                  className="me-2 mb-0"
                >
                  User Details:&nbsp;&nbsp;&nbsp;
                </h6>
                <h6
                  style={{ fontWeight: "normal", color: "#18c9ffff" }}
                  className="mb-0"
                >
                  (Status: {selectedUser.status})
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
                        User Role:
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        <li>
                          <b>Role</b>:&nbsp;&nbsp;&nbsp;
                          {selectedUser.role?.name
                            ? selectedUser.role.name
                            : "Not Added, Add New.."}
                          {selectedUser.role && (
                            <ul
                              style={{
                                listStyleType: "circle",
                              }}
                            >
                              {selectedUser.role.permissions?.length > 0 ? (
                                /* Display grouped permissions if they exist */
                                Object.entries(
                                  selectedUser.role.permissions.reduce(
                                    (acc, permission) => {
                                      if (!acc[permission.model]) {
                                        acc[permission.model] = [];
                                      }
                                      acc[permission.model].push(permission);
                                      return acc;
                                    },
                                    {}
                                  )
                                ).map(([model, permissions]) => (
                                  <li key={model}>
                                    <b>{model}</b>
                                    <ul
                                      style={{
                                        listStyleType: "circle",
                                      }}
                                    >
                                      {permissions.map((permission, index) => (
                                        <li key={`${model}-${index}`}>
                                          {permission.name} ({permission.type})
                                        </li>
                                      ))}
                                    </ul>
                                  </li>
                                ))
                              ) : (
                                /* Show message if no permissions */
                                <li
                                  style={{
                                    color: "#f44336",
                                    fontStyle: "italic",
                                  }}
                                >
                                  No permissions assigned to this role. Please
                                  assign permissions.
                                </li>
                              )}
                            </ul>
                          )}
                        </li>
                        <hr />
                        <li>
                          <b>Private Notes</b>: <br></br>
                          <span className="text-muted">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedUser.role?.notes
                                  ? selectedUser.role.notes
                                  : "Not Added, Add New..",
                              }}
                            />
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
          </div>
        </div>
      </div>
    </>
  );
};
export default ViewUser;
