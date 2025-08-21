import React, { useState, useEffect } from "react";
import {
  /**
   * @inertiajs/react
   */
  Link,
  router,
  usePage,
  /**
   * @ant-design/icons
   */
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  CaretDownOutlined,
  SettingOutlined,
  LogoutOutlined,

  /**
   * Ziggy
   */
  useRoute,
} from "@shared/ui";
import { Layout, Button, Dropdown, Avatar } from "antd";
import Sidebar from "@component/Sidebar/Sidebar";
const { Header, Content } = Layout;

const DashboardLayout = ({ children }) => {
  const route = useRoute();
  const { props } = usePage();
  const user = props.auth.user;
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [savedOpenKeys, setSavedOpenKeys] = useState([]);

  useEffect(() => {
    const storedKeys = localStorage.getItem("sidebar-open-keys");
    const storedCollapsed = localStorage.getItem("sidebar-collapsed");

    if (storedKeys) {
      const parsedKeys = JSON.parse(storedKeys);
      setOpenKeys(parsedKeys);
      setSavedOpenKeys(parsedKeys);
    }
    if (storedCollapsed) {
      setCollapsed(storedCollapsed === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-open-keys", JSON.stringify(openKeys));
  }, [openKeys]);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link href={route("user.profile", user.id)}>Profile</Link>,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: () => router.post("/logout"),
    },
  ];

  return (
    <Layout>
      <Header
        className="header w-100 ps-2 pe-2"
        style={{ background: "white" }}
      >
        <div className="header-content d-flex align-items-center justify-content-between">
          <div className="header-left d-flex align-items-center">
            <Link href="/" className="logo-link p-1">
              <div
                className="logo-collapsed"
                style={{
                  width: "64px",
                  padding: "4px",
                }}
              >
                <img
                  style={{
                    width: "60%",
                    height: "auto",
                  }}
                  src="/storage/uploads/images/logo-collapse.png"
                  alt="Logo Collapse"
                />
                {/* <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 700 150"
                  preserveAspectRatio="xMidYMid meet"
                  style={{
                    display: "block",
                    background: "transparent",
                  }}
                >
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
                    fontWeight="600"
                    fontSize="160"
                    fill="#0d70cc"
                  >
                    Enterprise
                  </text> 
                </svg>*/}
              </div>
              {/* <div className="logo-expanded"></div> */}
            </Link>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => {
                if (!collapsed) {
                  setSavedOpenKeys(openKeys);
                  setOpenKeys([]);
                } else {
                  setOpenKeys(savedOpenKeys);
                }
                setCollapsed(!collapsed);
              }}
              style={{
                fontSize: "16px",
                width: 64,
                height: 45,
              }}
            />
          </div>
          <div className="right">
            <Dropdown
              menu={{
                items: userMenuItems,
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div className="user-dropdown" style={{ cursor: "pointer" }}>
                <div className="d-flex justify-content-center align-items-center">
                  {user?.media.length > 0 ? (
                    <img
                      className="me-1"
                      src={`/storage/${user.media[0].file_path}`}
                      alt="Profile"
                      style={{
                        width: "35px",
                        height: "35px",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <Avatar
                      size="small"
                      icon={<UserOutlined />}
                      className="user-avatar me-1"
                    />
                  )}
                  <span className="user-name">{user.name}:</span>
                  <CaretDownOutlined className="dropdown-icon" />
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
      </Header>

      <Layout>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          openKeys={openKeys}
          setOpenKeys={setOpenKeys}
          savedOpenKeys={savedOpenKeys}
          setSavedOpenKeys={setSavedOpenKeys}
        />
        <Layout>
          <Content style={{ backgroundColor: "white" }}>{children}</Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
