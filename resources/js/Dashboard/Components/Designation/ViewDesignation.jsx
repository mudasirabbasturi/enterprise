import {
  Collapse,
  PhoneOutlined,
  MailOutlined,
  EditOutlined,
} from "@shared/ui";

const ViewDesignation = ({ data }) => {
  return (
    <>
      <div className="container-fluid">
        <div className="row m-0">
          <div className="col-12">
            <div className="mt-3 mb-3">
              <div className="d-flex">
                <h5 style={{ textDecoration: "underline" }} className="me-2">
                  Designation:
                </h5>
                <h5 style={{ fontWeight: "normal", color: "#1890ff" }}>
                  {data.name}
                </h5>
              </div>
            </div>
          </div>
          <hr></hr>
          <div className="col-12 col-md-6">
            <hr className="mb-0 mt-0"></hr>
            <div className="mt-1 mb-1">
              <div className="d-flex bg-light p-2 rounded">
                <h6
                  style={{ textDecoration: "underline" }}
                  className="me-2 mb-0"
                >
                  Department:
                </h6>
                <h6
                  style={{ fontWeight: "normal", color: "#1890ff" }}
                  className="mb-0"
                >
                  {data.department.name}
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
                        Contact details & Notes:
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        <li>
                          <PhoneOutlined />
                          &nbsp;&nbsp; Phone:&nbsp;&nbsp;&nbsp;
                          {data.department.phone ? (
                            <a href={`tel:${data.department.phone}`}>
                              {data.department.phone}
                            </a>
                          ) : (
                            "Use Branch Phone Or Add New.."
                          )}
                        </li>
                        <li>
                          <PhoneOutlined />
                          &nbsp;&nbsp; Fax:&nbsp;&nbsp;&nbsp;
                          {data.department.fax ? (
                            <a href={`tel:${data.department.fax}`}>
                              {data.department.fax}
                            </a>
                          ) : (
                            "Use Branch Fax Or Add New.."
                          )}
                        </li>
                        <li>
                          <MailOutlined />
                          &nbsp;&nbsp; Email:&nbsp;&nbsp;&nbsp;
                          {data.department.email ? (
                            <a href={`mailto:${data.department.email}`}>
                              {data.department.email}
                            </a>
                          ) : (
                            "Use Branch Email Or Add New.."
                          )}
                        </li>
                        <hr />
                        <li>
                          Notes:{" "}
                          {data.department.notes ? (
                            <span
                              className="text-muted"
                              style={{ lineHeight: "1.2" }}
                              dangerouslySetInnerHTML={{
                                __html: data.department.notes,
                              }}
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
            <div className="mt-1 mb-1">
              <div className="d-flex bg-light p-2 rounded">
                <h6
                  style={{ textDecoration: "underline" }}
                  className="me-2 mb-0"
                >
                  Branch:
                </h6>
                <h6
                  style={{ fontWeight: "normal", color: "#1890ff" }}
                  className="mb-0"
                >
                  {data.department.branch.name}
                </h6>
              </div>
            </div>
            <hr className="mb-0 mt-0"></hr>
            <Collapse
              className="mb-3 mt-3"
              items={[
                {
                  key: "1",
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Contact details & Notes:
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        <li>
                          <PhoneOutlined />
                          &nbsp;&nbsp; Phone:&nbsp;&nbsp;&nbsp;
                          {data.department.branch.phone ? (
                            <a href={`tel:${data.department.branch.phone}`}>
                              {data.department.branch.phone}
                            </a>
                          ) : (
                            "Not Added! Please Add New.."
                          )}
                        </li>
                        <li>
                          <PhoneOutlined />
                          &nbsp;&nbsp; Fax:&nbsp;&nbsp;&nbsp;
                          {data.department.branch.fax ? (
                            <a href={`tel:${data.department.branch.fax}`}>
                              {data.department.branch.fax}
                            </a>
                          ) : (
                            "Not Added! Please Add New.."
                          )}
                        </li>
                        <li>
                          <MailOutlined />
                          &nbsp;&nbsp; Email:&nbsp;&nbsp;&nbsp;
                          {data.department.branch.email ? (
                            <a href={`mailto:${data.department.branch.email}`}>
                              {data.department.branch.email}
                            </a>
                          ) : (
                            "Not Added! Please Add New.."
                          )}
                        </li>
                        <hr />
                        <li>
                          Notes:{" "}
                          {data.department.branch.notes ? (
                            <>
                              <span
                                className="text-muted"
                                style={{ lineHeight: "1.2" }}
                                dangerouslySetInnerHTML={{
                                  __html: data.department.branch.notes,
                                }}
                              />
                            </>
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
            <Collapse
              className="mb-3"
              contentPadding="5"
              items={[
                {
                  key: "1",
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Addresses details:
                      </h6>
                    </>
                  ),
                  children: (
                    <ul style={{ listStyleType: "circle" }}>
                      <li>
                        <b>Country</b>:&nbsp;
                        {data.department.branch.country ? (
                          <span>{data.department.branch.country}</span>
                        ) : (
                          "Not Added.."
                        )}
                      </li>
                      <li>
                        <b>State</b>:&nbsp;
                        {data.department.branch.state ? (
                          <span>{data.department.branch.state}</span>
                        ) : (
                          "Not Added.."
                        )}
                      </li>
                      <li>
                        <b>City</b>:&nbsp;
                        {data.department.branch.city ? (
                          <>{data.department.branch.city}</>
                        ) : (
                          "Not Added.."
                        )}
                      </li>
                      <li>
                        <b>Address</b>:&nbsp;
                        {data.department.branch.address ? (
                          <a
                            href={`http://maps.google.com/?q=${data.department.branch.address}`}
                            target="_blank"
                          >
                            {data.department.branch.address}
                          </a>
                        ) : (
                          "Not Added.."
                        )}
                      </li>
                      <li>
                        <b>Postal / Zip Code</b>:&nbsp;
                        {data.department.branch.postal_zip_code ? (
                          <span>{data.department.branch.postal_zip_code}</span>
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
          </div>
        </div>
      </div>
    </>
  );
};
export default ViewDesignation;
