import {
  Collapse,
  PhoneOutlined,
  MailOutlined,
  EditOutlined,
} from "@shared/ui";

const ViewBranch = ({ data }) => {
  const items =
    data.departments?.length > 0
      ? data.departments.map((department) => ({
          key: department.id.toString(),
          label: department.name,
          children:
            department.designations && department.designations.length > 0 ? (
              <ul style={{ listStyleType: "circle", paddingLeft: "1.5rem" }}>
                <li>
                  <h6 style={{ textDecoration: "underline", color: "#1890ff" }}>
                    Designations List:
                  </h6>
                </li>
                {department.designations.map((designation) => (
                  <li key={designation.id}>
                    <span>{designation.name}</span>
                    <br />
                    {designation.notes && (
                      <span
                        className="text-muted"
                        dangerouslySetInnerHTML={{
                          __html: designation.notes,
                        }}
                      />
                    )}
                  </li>
                ))}
                <hr />
                <li>
                  Department Notes:{" "}
                  {department.notes ? (
                    <span
                      className="text-muted"
                      dangerouslySetInnerHTML={{ __html: department.notes }}
                    />
                  ) : (
                    "Not Added.."
                  )}
                </li>
              </ul>
            ) : (
              <p className="ms-2 mb-0 text-muted">No designations</p>
            ),
        }))
      : [
          {
            key: "0",
            label: "No departments found",
            children: <p>No data available</p>,
          },
        ];

  return (
    <>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex">
              <h5 style={{ textDecoration: "underline" }} className="me-2">
                Branch:
              </h5>
              <h5
                style={{
                  fontWeight: "normal",
                  color: "#1890ff",
                }}
              >
                {data.name}
              </h5>
            </div>
          </div>
          <hr></hr>
          <div className="col-12 col-md-6">
            <Collapse
              className="mb-3"
              items={[
                {
                  key: "1",
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Contact Details:
                      </h6>
                    </>
                  ),
                  children: (
                    <ul style={{ listStyleType: "circle" }}>
                      <li>
                        <PhoneOutlined />
                        &nbsp;&nbsp; Phone:&nbsp;&nbsp;&nbsp;
                        {data.phone ? (
                          <a href={`tel:${data.phone}`}>{data.phone}</a>
                        ) : (
                          "Not Added.."
                        )}
                      </li>
                      <li>
                        <PhoneOutlined />
                        &nbsp;&nbsp; Fax:&nbsp;&nbsp;&nbsp;
                        {data.fax ? (
                          <a href={`tel:${data.fax}`}>{data.fax}</a>
                        ) : (
                          "Not Added.."
                        )}
                      </li>
                      <li>
                        <MailOutlined />
                        &nbsp;&nbsp; Email:&nbsp;&nbsp;&nbsp;
                        {data.email ? (
                          <a href={`mailto:${data.email}`}>{data.email}</a>
                        ) : (
                          "Not Added.."
                        )}
                      </li>
                    </ul>
                  ),
                },
              ]}
              size="small"
              defaultActiveKey={["1"]}
            />
            <Collapse
              className="mb-3"
              items={[
                {
                  key: "1",
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Location Details & Notes:
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul
                        style={{
                          listStyleType: "circle",
                        }}
                      >
                        <li>
                          <b>Country</b>:&nbsp;
                          {data.country ? (
                            <span>{data.country}</span>
                          ) : (
                            "Not Added.."
                          )}
                        </li>
                        <li>
                          <b>State</b>:&nbsp;
                          {data.state ? (
                            <span>{data.state}</span>
                          ) : (
                            "Not Added.."
                          )}
                        </li>
                        <li>
                          <b>City</b>:&nbsp;
                          {data.city ? <>{data.city}</> : "Not Added.."}
                        </li>
                        <li>
                          <b>Address</b>:&nbsp;
                          {data.address ? (
                            <a
                              href={`http://maps.google.com/?q=${data.address}`}
                              target="_blank"
                            >
                              {data.address}
                            </a>
                          ) : (
                            "Not Added.."
                          )}
                        </li>
                        <li>
                          <b>Postal / Zip Code</b>
                          :&nbsp;
                          {data.postal_zip_code ? (
                            <span>{data.postal_zip_code}</span>
                          ) : (
                            "Not Added.."
                          )}
                        </li>
                        <hr />
                        <li>
                          Branch Notes:{" "}
                          {data.notes ? (
                            <span
                              className="text-muted"
                              dangerouslySetInnerHTML={{ __html: data.notes }}
                            />
                          ) : (
                            "Not Added.."
                          )}
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
            <div className="d-flex bg-light p-2 rounded">
              <h6 style={{ textDecoration: "underline" }} className="me-2 mb-0">
                Departments & Designations Lists:
              </h6>
              <h6
                style={{
                  fontWeight: "normal",
                  color: "#1890ff",
                }}
                className="mb-0"
              ></h6>
            </div>
            <hr className="mb-0 mt-0"></hr>
            <Collapse
              className="mb-3 mt-3"
              items={items}
              defaultActiveKey={[items[0]?.key]}
              size="small"
            />
          </div>
        </div>
      </div>
    </>
  );
};
export default ViewBranch;
