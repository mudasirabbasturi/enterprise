import React, { useState, useEffect } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

window.Echo = new Echo({
  broadcaster: "pusher",
  key: "5158315c26b8f6732773",
  cluster: "ap2",
  forceTLS: true,
});

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
  LogoutOutlined,

  /**
   * Ziggy
   */
  useRoute,
} from "@shared/ui";
import { Layout, Button, Dropdown, Avatar, notification } from "antd";

import Sidebar from "@component/Sidebar/Sidebar";
const { Header, Content } = Layout;

const DashboardLayout = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();
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

  // Add Project
  useEffect(() => {
    const channel = window.Echo.channel("project-channel");
    const handler = (data) => {
      if (user.email !== data.userEmail) {
        api.success({
          description: data.message,
        });
      }
    };
    channel.listen(".event-project-created", handler);
    return () => {
      channel.stopListening(".event-project-created", handler);
    };
  }, []);

  // Update Project
  useEffect(() => {
    const channel = window.Echo.channel("project-channel");
    const handler = (data) => {
      if (user.email !== data.userEmail) {
        api.success({
          description: data.message,
        });
      }
    };
    channel.listen(".event-project-updated", handler);
    return () => {
      channel.stopListening(".event-project-updated", handler);
    };
  }, []);

  // Update Project column
  useEffect(() => {
    const channel = window.Echo.channel("project-channel");
    const handler = (data) => {
      if (user.email !== data.userEmail) {
        api.success({
          description: data.message,
        });
      }
    };
    channel.listen(".event-project-update-coloumn", handler);
    return () => {
      channel.stopListening(".event-project-update-coloumn", handler);
    };
  }, []);

  // Delete Project
  useEffect(() => {
    const channel = window.Echo.channel("project-channel");
    const handler = (data) => {
      if (user.email !== data.userEmail) {
        api.success({
          description: data.message,
        });
      }
    };
    channel.listen(".event-project-delete", handler);
    return () => {
      channel.stopListening(".event-project-delete", handler);
    };
  }, []);

  // Joint Project
  useEffect(() => {
    const channel = window.Echo.channel("project-channel");
    const handler = (data) => {
      if (user.email !== data.userEmail) {
        api.success({
          description: data.message,
        });
      }
    };
    channel.listen(".event-project-joined", handler);
    return () => {
      channel.stopListening(".event-project-joined", handler);
    };
  }, []);

  // leave Joint Project
  useEffect(() => {
    const channel = window.Echo.channel("project-channel");
    const handler = (data) => {
      if (user.email !== data.userEmail) {
        api.success({
          description: data.message,
        });
      }
    };
    channel.listen(".event-project-leave", handler);
    return () => {
      channel.stopListening(".event-project-leave", handler);
    };
  }, []);

  return (
    <>
      {contextHolder}
      <Layout>
        <Header
          className="header w-100 ps-2 pe-2"
          style={{ background: "white" }}
        >
          <div className="header-content d-flex align-items-center justify-content-between">
            <div className="header-left d-flex align-items-center">
              <Link href="/" className="logo-link">
                <div
                  className="d-flex align-items-center logo-collapsed"
                  style={{
                    width: "64px",
                  }}
                >
                  <img
                    style={{
                      width: "60%",
                      height: "auto",
                    }}
                    src="/uploads/images/logo-collapse.png"
                    alt="Logo Collapse"
                  />
                </div>
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
                        src={`/${user.media[0].file_path}`}
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
    </>
  );
};

export default DashboardLayout;
