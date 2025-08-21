import React, { useState, useRef, lazy, Suspense } from "react";
import { usePage, Link, Breadcrumb } from "@shared/ui";
import {
  Card,
  Avatar,
  Typography,
  Divider,
  Button,
  Space,
  Tag,
  Drawer,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  EditOutlined,
  FlagOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const Media = lazy(() => import("@component/Media/Index"));
const EditUser = lazy(() => import("@component/User/EditUser"));
const ViewUser = lazy(() => import("@component/User/ViewUser"));
// Flash messages
import FlashMessages from "@component/FlashMessages/Messages";

const Profile = ({ user, roles, branches, departments, designations }) => {
  const { props } = usePage();
  // const user = props.auth.user;
  const ownerId = user.id;

  // State for loading and drawer visibility
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("EditUser");
  const [selectedUser, setSelectedUser] = useState(null);

  // Show drawer function
  const showDrawer = (mode, data = null) => {
    setDrawerMode(mode);
    setOpen(true);
    setSelectedUser(data);
  };

  // Close drawer function
  const closeEditDrawer = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  // Ref for child component
  const childRef = useRef();
  const handleParentSubmit = () => {
    if (childRef.current) {
      childRef.current.submitForm();
    }
  };

  return (
    <>
      <FlashMessages />
      <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
        <Breadcrumb
          className="breadCrumb"
          items={[{ title: <Link href="/">Home</Link> }, { title: "Profile" }]}
        />
        {/* <button className="btn btn-primary btn-sm">Add User</button> */}
      </div>
      <div style={{ padding: "24px" }}>
        <div className="row mb-4">
          <div className="col-12 col-md-5">
            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  height: "120px",
                  margin: "-24px -24px 24px -24px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: "-40px",
                    left: "24px",
                    border: "4px solid white",
                    borderRadius: "50%",
                    background: "white",
                  }}
                >
                  {user?.media.length > 0 ? (
                    <img
                      src={`/storage/${user.media[0].file_path}`}
                      alt="Profile"
                      style={{
                        width: "85px",
                        height: "85px",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <Avatar
                      size={80}
                      icon={<UserOutlined />}
                      className="user-avatar"
                    />
                  )}
                </div>
              </div>

              <div style={{ marginTop: "48px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <Title level={3} style={{ margin: 0 }}>
                      {user.name}
                    </Title>
                    <Text type="secondary">{user.email}</Text>
                  </div>
                  <div className="d-flex flex-column">
                    <button
                      className="btn btn-warning btn-sm mb-1"
                      type="primary"
                      onClick={() => showDrawer("EditUser", user)}
                    >
                      <EditOutlined /> Edit Profile
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      ghost
                      onClick={() => showDrawer("ViewUser", user)}
                    >
                      <EditOutlined /> View Profile
                    </button>
                  </div>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="middle"
                >
                  <div>
                    <ul style={{ listStyle: "circle" }}>
                      <li className="italic">
                        <MailOutlined
                          style={{ marginRight: "8px", color: "#1890ff" }}
                        />
                        <span className="text-muted">Email: </span>
                        {user.email}
                      </li>
                      <li className="italic">
                        <UserOutlined
                          style={{ marginRight: "8px", color: "#1890ff" }}
                        />
                        <span className="text-muted">Name: </span>
                        {user.name}
                      </li>
                      <li className="italic">
                        <PhoneOutlined
                          style={{ marginRight: "8px", color: "#52c41a" }}
                        />
                        <span className="text-muted">Phone: </span>
                        {user.phone}
                      </li>
                      <li className="italic">
                        <FlagOutlined
                          style={{
                            marginRight: "8px",
                            color: "#f5222d",
                          }}
                        />
                        <span className="text-muted">Country: </span>
                        {user.country}
                      </li>
                      <li className="italic">
                        <FlagOutlined
                          style={{
                            marginRight: "8px",
                            color: "#f5222d",
                          }}
                        />
                        <span className="text-muted">State: </span>
                        {user.state}
                      </li>
                      <li className="italic">
                        <FlagOutlined
                          style={{
                            marginRight: "8px",
                            color: "#f5222d",
                          }}
                        />
                        <span className="text-muted">City: </span>
                        {user.city}
                      </li>
                      <li className="italic">
                        <EnvironmentOutlined
                          style={{ marginRight: "8px", color: "#f5222d" }}
                        />
                        <span className="text-muted">Current Address: </span>
                        {user.current_address}
                      </li>
                      <li className="italic">
                        <EnvironmentOutlined
                          style={{ marginRight: "8px", color: "#f5222d" }}
                        />
                        <span className="text-muted">Permanent Address: </span>
                        {user.permanent_address}
                      </li>
                    </ul>
                  </div>
                </Space>

                <Divider style={{ margin: "16px 0" }} />

                <div>
                  <Text
                    strong
                    style={{ display: "block", marginBottom: "8px" }}
                  >
                    Skills
                  </Text>
                  <Space size={[0, 8]} wrap>
                    {/* <Tag color="blue">ReactJS</Tag>
                    <Tag color="green">Laravel</Tag>
                    <Tag color="orange">UI/UX Design</Tag>
                    <Tag color="purple">Inertia</Tag>
                    <Tag color="red">Ant Design</Tag> */}
                  </Space>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-12 col-md-7">
            <Suspense fallback={<div>Loading...</div>}>
              <Media ownerId={ownerId} />
            </Suspense>
          </div>
        </div>
        <Drawer
          title={drawerMode === "EditUser" ? "Edit User" : "View User"}
          placement="left"
          onClose={closeEditDrawer}
          open={open}
          width="90%"
          extra={
            drawerMode === "EditUser" ? (
              <>
                <button
                  className="btn btn-primary btn-sm me-2"
                  disabled={loading}
                  onClick={closeEditDrawer}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleParentSubmit}
                  disabled={loading}
                >
                  Save Changes
                </button>
              </>
            ) : drawerMode === "ViewUser" ? (
              <>
                <button
                  className="btn btn-primary btn-sm me-2"
                  disabled={loading}
                  onClick={closeEditDrawer}
                >
                  Close
                </button>
              </>
            ) : null
          }
        >
          <Suspense fallback={<div>Loading...</div>}>
            {selectedUser &&
              (drawerMode === "EditUser" ? (
                <EditUser
                  data={selectedUser}
                  onClose={closeEditDrawer}
                  setParentLoading={setLoading}
                  ref={childRef}
                  roles={roles}
                  branches={branches}
                  departments={departments}
                  designations={designations}
                />
              ) : (
                <ViewUser
                  data={selectedUser}
                  onClose={closeEditDrawer}
                  roles={roles}
                  branches={branches}
                  departments={departments}
                  designations={designations}
                />
              ))}
          </Suspense>
        </Drawer>
      </div>
    </>
  );
};

export default Profile;
