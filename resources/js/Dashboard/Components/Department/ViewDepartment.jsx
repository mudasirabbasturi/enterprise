import {
  Collapse,
  PhoneOutlined,
  MailOutlined,
  EditOutlined,
} from "@shared/ui";

const ViewDepartment = ({ data }) => {
  return (
    <>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex">
              <h5 style={{ textDecoration: "underline" }} className="me-2">
                Department:
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
                        Contact Details & Notes:
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
                          "Not Added. Add New Or Use Branch Phone,"
                        )}
                      </li>
                      <li>
                        <PhoneOutlined />
                        &nbsp;&nbsp; Fax:&nbsp;&nbsp;&nbsp;
                        {data.fax ? (
                          <a href={`tel:${data.fax}`}>{data.fax}</a>
                        ) : (
                          "Not Added. Add New Or Use Branch Fax"
                        )}
                      </li>
                      <li>
                        <MailOutlined />
                        &nbsp;&nbsp; Email:&nbsp;&nbsp;&nbsp;
                        {data.email ? (
                          <a href={`mailto:${data.email}`}>{data.email}</a>
                        ) : (
                          "Not Added. Add New Or Use Branch Email"
                        )}
                      </li>
                      <hr />
                      <li>
                        <span
                          className="text-muted"
                          style={{ lineHeight: "1.2" }}
                          dangerouslySetInnerHTML={{ __html: data.notes }}
                        />
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
                        Designations & Notes:
                      </h6>
                    </>
                  ),
                  children:
                    data.designations && data.designations.length > 0 ? (
                      <ul
                        style={{
                          listStyleType: "circle",
                          paddingLeft: "1.5rem",
                        }}
                      >
                        <li>
                          <h6
                            style={{
                              textDecoration: "underline",
                              color: "#1890ff",
                            }}
                          >
                            Designations List:
                          </h6>
                        </li>
                        {data.designations.map((designation) => (
                          <li key={designation.id}>
                            <span>{designation.name}</span>
                            <br />
                            {designation.notes && (
                              <span
                                className="text-muted"
                                style={{ lineHeight: "1.2" }}
                                dangerouslySetInnerHTML={{
                                  __html: `Notes: -` + designation.notes,
                                }}
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="ms-2 mb-0 text-muted">
                        No designations found for this department.
                      </p>
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
                Branch Name & Contact Details:
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
              className="mt-3 mb-3"
              items={[
                {
                  key: "1",
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        {data.branch.name}
                      </h6>
                    </>
                  ),
                  children: (
                    <ul style={{ listStyleType: "circle" }}>
                      <li>
                        <PhoneOutlined />
                        &nbsp;&nbsp; Phone:&nbsp;&nbsp;&nbsp;
                        {data.branch.phone ? (
                          <a href={`tel:${data.branch.phone}`}>
                            {data.branch.phone}
                          </a>
                        ) : (
                          "Not Added.."
                        )}
                      </li>
                      <li>
                        <PhoneOutlined />
                        &nbsp;&nbsp; Fax:&nbsp;&nbsp;&nbsp;
                        {data.branch.fax ? (
                          <a href={`tel:${data.branch.fax}`}>
                            {data.branch.fax}
                          </a>
                        ) : (
                          "Not Added.."
                        )}
                      </li>
                      <li>
                        <MailOutlined />
                        &nbsp;&nbsp; Email:&nbsp;&nbsp;&nbsp;
                        {data.branch.email ? (
                          <a href={`mailto:${data.branch.email}`}>
                            {data.branch.email}
                          </a>
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
export default ViewDepartment;
