import {
  Link,
  useRoute, // ziggy routing
  Tooltip,
  Collapse,
  Avatar,
  UserOutlined, // ant icon
} from "@shared/ui";
const ViewClient = (props) => {
  const { data: selectedClient, onClose } = props;
  const route = useRoute();
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
                  {selectedClient.title ? selectedClient.title : "Null"}
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
                  Client Details:&nbsp;&nbsp;&nbsp;
                </h6>
                <h6
                  style={{ fontWeight: "normal", color: "#18c9ffff" }}
                  className="mb-0"
                ></h6>
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
                        {selectedClient.title ? selectedClient.title : "Title"}
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        <li>
                          <b>Full Name</b>:&nbsp;&nbsp;&nbsp;
                          {selectedClient.name
                            ? selectedClient.name
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>Client Email</b>:&nbsp;&nbsp;&nbsp;
                          {selectedClient.email
                            ? selectedClient.email
                            : "Not Added, Add New.."}
                        </li>
                        <li>
                          <b>Client Phone</b>:&nbsp;&nbsp;&nbsp;
                          {selectedClient.phone
                            ? selectedClient.phone
                            : "Not Added, Add New.."}
                        </li>
                        <hr />
                        <li>
                          <b>Notes:</b>: <br></br>
                          <span className="text-muted">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedClient.notes
                                  ? selectedClient.notes
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
export default ViewClient;
