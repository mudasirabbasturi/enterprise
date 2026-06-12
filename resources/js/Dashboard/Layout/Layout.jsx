import React, { useState, useEffect, useRef } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

window.Echo = new Echo({
  broadcaster: "pusher",
  key: "d9306811d5a58be380be",
  cluster: "ap1",
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
  BarChartOutlined,
  WalletOutlined,
  ScheduleOutlined,
  CloudDownloadOutlined,
  FieldTimeOutlined,
  LineChartOutlined,
  TeamOutlined,
  ProjectOutlined,
  FileProtectOutlined,
  CalendarOutlined,
  MoneyCollectOutlined,
  AppstoreOutlined,
  MessageOutlined,
  /**
   * Ziggy
   */
  useRoute,
} from "@shared/ui";
import { Layout, Button, Dropdown, Avatar, notification, Badge } from "antd";

import axios from "axios";

import Sidebar from "@component/Sidebar/Sidebar";
import QuickAttendanceModal from "@component/Attendance/QuickAttendanceModal";
const { Header, Content } = Layout;

const DashboardLayout = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();
  const route = useRoute();
  const { props } = usePage();
  const user = props.auth.user;
  const [isQuickAttendanceModalOpen, setIsQuickAttendanceModalOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({
    project: 0,
    chat: props.unreadChatCount || { total: 0, direct: 0, group: 0 }
  });
  const ablyRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    refreshUnreadCount();
  }, []);

  const hasPermission = (userpermission, permName) =>
    userpermission?.some((p) => p.name === permName);
  const userPermissions = props.auth.user?.role?.permissions || [];
  const can = (perm) => hasPermission(userPermissions, perm);
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [savedOpenKeys, setSavedOpenKeys] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const projectSound = useRef(new Audio('/uploads/media/sound_effect/project/project_notification.wav'));
  const chatSound = useRef(new Audio("/uploads/media/sound_effect/chat/chat_message_notification.mp3"));

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

  // Activity Menu Items (My Activity + User Activity based on permission)
  const getActivityMenuItems = () => {
    const items = [];

    // My Activity - always show
    items.push({
      key: "my-activity",
      icon: <LineChartOutlined />,
      label: <Link href={route("my-activity", user.id)}>My Activity</Link>,
    });

    // User Activity/Tracking - only if has permission
    if (can("View Tracking")) {
      items.push({
        key: "user-tracking",
        icon: <TeamOutlined />,
        label: <Link href={route("user.tracking")}>User Activity</Link>,
      });
    }

    return items;
  };

  // Project Menu Items
  const getProjectMenuItems = () => {
    const items = [];

    if (can("View Project Chart")) {
      items.push({
        key: "project-chart",
        icon: <BarChartOutlined />,
        label: "Project Chart",
        onClick: () => router.visit(route("project.count.chart")),
      });
    }

    if (can("View Report")) {
      items.push({
        key: "project-report",
        icon: <FileProtectOutlined />,
        label: "Project Report",
        onClick: () => router.visit(route("project.report")),
      });
    }

    // Self Report - always show
    items.push({
      key: "self-report",
      icon: <LineChartOutlined />,
      label: "Self Report",
      onClick: () =>
        router.visit(route("project.report"), {
          method: "get",
          data: { email: user.email },
        }),
    });

    // Self Project - always show
    items.push({
      key: "self-project",
      icon: <ProjectOutlined />,
      label: "Self Project",
      onClick: () =>
        router.visit(
          route("project.self.status", {
            status: "Takeoff On Progress",
          })
        ),
    });

    return items;
  };

  // Employee Self Service Menu Items
  const getEmployeeSelfServiceItems = () => {
    return [
      {
        key: "my-schedule",
        icon: <ScheduleOutlined />,
        label: <Link href={route("my-schedule.index")}>My Schedule</Link>,
      },
      {
        key: "my-attendance",
        icon: <CalendarOutlined />,
        label: <Link href={route("my-attendance.index")}>My Attendance</Link>,
      },
      {
        key: "my-leave-balance",
        icon: <WalletOutlined />,
        label: <Link href={route("my-leave-balances.index")}>My Leave Balance</Link>,
      },
      {
        key: "request-leave",
        icon: <ScheduleOutlined />,
        label: <Link href={route("my-leave-requests.index")}>Request Leave</Link>,
      },
      {
        key: "my-payroll",
        icon: <MoneyCollectOutlined />,
        label: <Link href={route("my-payroll.index")}>My Payroll</Link>,
      },
    ];
  };

  // Chat Menu Items (Project Chat + Direct Chat)
  const getChatMenuItems = () => {
    const items = [];

    items.push({
      key: "project-chat",
      icon: <ProjectOutlined />,
      label: (
        <Link href={route("project-chat.index")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "12px" }}>
          <span>Project Chat</span>
          {unreadCounts.project > 0 && (
            <Badge count={unreadCounts.project} style={{ backgroundColor: '#52c41a' }} size="small" />
          )}
        </Link>
      ),
    });

    if (can("View Chat")) {
      items.push({
        key: "direct-chat",
        icon: <MessageOutlined />,
        label: (
          <Link href={route("chat.index")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "12px" }}>
            <span>Direct Chat</span>
            {unreadCounts.chat?.total > 0 && (
              <Badge count={unreadCounts.chat.total} style={{ backgroundColor: '#1890ff' }} size="small" />
            )}
          </Link>
        ),
      });
    }

    return items;
  };

  // Useful Menu Items (Activity, Projects, Employee Self Service)
  const getUsefulMenuItems = () => {
    return [
      // Activity Section
      {
        key: "activity-group",
        label: "Activity",
        icon: <LineChartOutlined />,
        children: getActivityMenuItems(),
      },
      // Projects Section
      {
        key: "projects-group",
        label: "Projects",
        icon: <ProjectOutlined />,
        children: getProjectMenuItems(),
      },
      // Employee Self Service Section
      {
        key: "self-service-group",
        label: "Employee Self Service",
        icon: <UserOutlined />,
        children: getEmployeeSelfServiceItems(),
      },
    ];
  };

  // User Profile Menu Items (under user name)
  const userProfileMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link href={route("user.profile", user.id)}>My Profile</Link>,
    },
    {
      key: "download",
      icon: <CloudDownloadOutlined />,
      label: "Download Tracker",
      onClick: () => {
        const link = document.createElement("a");
        link.href = "/uploads/documents/BidwinnersTrackerV2_Setup_v1.0.0.exe";
        link.download = "BidwinnersTrackerV2_Setup_v1.0.0.exe";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
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

  const refreshUnreadCount = async () => {
    try {
      const res = await axios.get('/chat/unread-counts');
      setUnreadCounts({
        project: res.data.project || 0,
        chat: {
          total: res.data.global || 0,
          direct: res.data.direct || 0,
          group: res.data.groups || 0
        }
      });
    } catch (e) { console.error(e); }
  };

  // Centralized Real-time Hub
  useEffect(() => {
    if (!user.id) return;

    window.addEventListener('chat-unread-count-changed', refreshUnreadCount);

    const handleProjectCRUD = (payload) => {
      const type = payload.event.split('-').pop();
      if (type && user.email !== payload.data.userEmail) {
        projectSound.current.play().catch(() => { });
        api.success({ description: payload.data.message });
        window.dispatchEvent(new CustomEvent('project-data-changed', {
          detail: { type, project: payload.data.project }
        }));
      }
    };

    const projectChannel = window.Echo.channel('project-channel');
    [
      'event-project-created', 'event-project-updated', 'event-project-update-coloumn',
      'event-project-delete', 'event-project-joined', 'event-project-leave', 'event-project-bulk-updated'
    ].forEach(event => {
      projectChannel.listen(`.${event}`, (data) => handleProjectCRUD({ event, data }));
    });

    const trackerChannel = window.Echo.channel('tracker-status');
    trackerChannel.listen('.tracker-status-notification', (data) => {
      window.dispatchEvent(new CustomEvent('tracker-status-notification', { detail: data }));
    });

    return () => {
      window.removeEventListener('chat-unread-count-changed', refreshUnreadCount);
      window.Echo.leave('project-channel');
      window.Echo.leave('tracker-status');
    };
  }, [user.id]);

  const handleBulkUpdate = () => {
    if (
      window.confirm(
        "Do you really want to mark all Completed projects as Delivered?"
      )
    ) {
      router.put(
        route("project.bulk.update"),
        {},
        {
          preserveScroll: true,
          onSuccess: () => {
            console.log("Bulk update done");
          },
        }
      );
    }
  };

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
                  className="d-flex align-items-center logo-collapsed p-1"
                  style={{
                    width: "64px",
                  }}
                >
                  <img
                    style={{
                      width: "100%",
                      height: "auto",
                    }}
                    src="/uploads/images/bid-winner.jpg"
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
              <div className="d-flex">
                {/* Useful Menu Button - Activity, Projects, Employee Self Service */}
                <div className="me-3">
                  <Dropdown
                    menu={{
                      items: getUsefulMenuItems(),
                    }}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <button className="btn btn-sm btn-outline-primary">
                      <AppstoreOutlined /> Useful Menu
                    </button>
                  </Dropdown>
                </div>

                {/* Quick Attendance Button */}
                <div>
                  <button
                    className="btn btn-sm btn-outline-info me-3"
                    onClick={() => setIsQuickAttendanceModalOpen(true)}
                  >
                    Quick Attendance
                  </button>
                </div>

                {/* Bulk Complete to Deliver Button - Only if has permission */}
                {can("View Project Chart") && (
                  <div>
                    <button
                      className="btn btn-sm btn-outline-danger me-3"
                      onClick={handleBulkUpdate}
                    >
                      Bulk Complete To Deliver
                    </button>
                  </div>
                )}

                {/* User Profile Dropdown (My Profile, Download, Logout) */}
                <div>
                  <Dropdown
                    menu={{
                      items: userProfileMenuItems,
                    }}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <div
                      className="user-dropdown"
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex justify-content-center align-items-center">
                        {user?.media?.length > 0 ? (
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
                        <span className="user-name">{user.name}</span>
                        <CaretDownOutlined className="dropdown-icon ms-1" />
                      </div>
                    </div>
                  </Dropdown>
                </div>
              </div>
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
            unreadCounts={unreadCounts}
          />
          <Layout>
            <Content style={{ backgroundColor: "white" }}>{children}</Content>
          </Layout>
        </Layout>
      </Layout>
      <QuickAttendanceModal
        open={isQuickAttendanceModalOpen}
        onCancel={() => setIsQuickAttendanceModalOpen(false)}
        onSuccess={() => {
          setIsQuickAttendanceModalOpen(false);
          router.reload();
        }}
      />
    </>
  );
};

export default DashboardLayout;