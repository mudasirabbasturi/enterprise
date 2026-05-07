import React, { useState, useEffect, useRef } from "react";
/*
import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

window.Echo = new Echo({
  broadcaster: "pusher",
  key: "5158315c26b8f6732773",
  cluster: "ap2",
  forceTLS: true,
});
*/

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
  /**
   * Ziggy
   */
  useRoute,
} from "@shared/ui";
import { Layout, Button, Dropdown, Avatar, notification } from "antd";

import Sidebar from "@component/Sidebar/Sidebar";
import QuickAttendanceModal from "@component/Attendance/QuickAttendanceModal";
const { Header, Content } = Layout;

const DashboardLayout = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();
  const route = useRoute();
  const { props } = usePage();
  const user = props.auth.user;
  const [isQuickAttendanceModalOpen, setIsQuickAttendanceModalOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({ project: 0, global: 0, direct: 0, groups: 0 });

  // Chat unread counts logic removed (404)

  const fetchUnreadCounts = async () => {
    try {
      const response = await axios.get(route('global-chat.unread-counts'));
      setUnreadCounts(response.data);
    } catch (err) {
      console.error("Failed to fetch unread counts", err);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
    
    const handleRefresh = () => fetchUnreadCounts();
    window.addEventListener('refresh-unread-counts', handleRefresh);
    return () => window.removeEventListener('refresh-unread-counts', handleRefresh);
  }, []);

  const hasPermission = (userpermission, permName) =>
    userpermission?.some((p) => p.name === permName);
  const userPermissions = props.auth.user?.role?.permissions || [];
  const can = (perm) => hasPermission(userPermissions, perm);
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [savedOpenKeys, setSavedOpenKeys] = useState([]);
  const projectSound = useRef(new Audio('/uploads/media/sound_effect/project/project_notification.wav'));
  const chatSound = useRef(new Audio('/uploads/media/sound_effect/chat/chat_message_notification.mp3'));

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
      key: "my-activity",
      icon: <LineChartOutlined />,
      label: <Link href={route("my-activity", user.id)}>My Activity</Link>,
    },
    {
      key: "my-shedule",
      icon: <FieldTimeOutlined />,
      label: <Link href={route("my-schedule.index")}>My Shedule</Link>,
    },
    {
      key: "my-attendance",
      icon: <BarChartOutlined />,
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
      icon: <WalletOutlined />,
      label: <Link href={route("my-payroll.index")}>My Payroll</Link>,
    },
    {
      type: "divider",
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
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: () => router.post("/logout"),
    },
  ];

  // Centralized WebSocket Connection
  useEffect(() => {
    if (!user.id) return;

    let ws = null;
    const userNotificationChannel = `user-notifications-${user.id}`;
    const globalUserChannel = `global-chat.user.${user.id}`;
    const projectMasterChannel = "project-channel";
    const trackerChannel = "tracker-status";

    const handleProjectCRUD = (payload) => {
      const eventMap = {
        'event-project-created': 'created',
        'event-project-updated': 'updated',
        'event-project-update-coloumn': 'updated',
        'event-project-delete': 'deleted',
        'event-project-joined': 'updated',
        'event-project-leave': 'updated',
        'event-project-bulk-updated': 'updated'
      };

      const type = eventMap[payload.event];
      if (type) {
        projectSound.current.play().catch(() => {});
        if (user.email !== payload.data.userEmail) {
          api.success({ description: payload.data.message });
        }
        window.dispatchEvent(new CustomEvent('project-data-changed', { 
          detail: { type, project: payload.data.project } 
        }));
      }
    };

    const connect = () => {
      try {
        ws = new WebSocket('wss://demo.bidwinners.net');
        
        ws.onopen = () => {
          console.log("WebSocket Connected: Centralized Layout Hub");
          // Subscriptions
          ws.send(JSON.stringify({ action: 'subscribe', channel: projectMasterChannel }));
          // ws.send(JSON.stringify({ action: 'subscribe', channel: userNotificationChannel }));
          ws.send(JSON.stringify({ action: 'subscribe', channel: globalUserChannel }));
          ws.send(JSON.stringify({ action: 'subscribe', channel: trackerChannel }));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data);
          
          // Route 1: Project CRUD
          if (response.channel === projectMasterChannel && response.data) {
            handleProjectCRUD(response.data);
          }

          // Route 2: Project Chat Notifications (Phasing out)
          /*
          if (response.channel === userNotificationChannel) {
            const payload = response.data;
            if (payload && payload.data && payload.data.message) {
              const incomingMsg = payload.data.message;
              if (incomingMsg.user_id !== user.id) {
                chatSound.current.play().catch(() => {});
                setUnreadCounts(prev => ({ ...prev, project: (prev.project || 0) + 1 }));
              }
            }
            window.dispatchEvent(new CustomEvent('project-chat-notification', { detail: response.data }));
          }
          */

          // Route 3: Global Chat Notifications
          if (response.channel === globalUserChannel) {
            const payload = response.data;
            if (payload && payload.event === 'message.sent') {
                const msg = payload.data.message;
                const senderType = msg.group_id ? 'group' : 'user';
                const targetId = msg.group_id ? msg.group_id : msg.sender_id;
                
                // Mute sound if the user already has this chat open
                const isActive = window.activeGlobalChat && 
                                 window.activeGlobalChat.type === senderType && 
                                 window.activeGlobalChat.id == targetId;
                
                if (!isActive && msg.sender_id != user.id) {
                    chatSound.current.play().catch(() => {});
                    setUnreadCounts(prev => {
                        const newDirect = senderType === 'user' ? (prev.direct || 0) + 1 : (prev.direct || 0);
                        const newGroups = senderType === 'group' ? (prev.groups || 0) + 1 : (prev.groups || 0);
                        return { 
                            ...prev, 
                            direct: newDirect,
                            groups: newGroups,
                            global: newDirect + newGroups
                        };
                    });
                }
            }
            window.dispatchEvent(new CustomEvent('global-chat-notification', { detail: response }));
          }

          // Route 4: Tracker Status (Screenshots / Online Status)
          if (response.channel === trackerChannel) {
            // Unify structure for sub-components
            const payload = response.data; // This is {event: '...', data: {...}}
            if (payload && payload.event) {
              window.dispatchEvent(new CustomEvent('tracker-status-notification', { detail: response }));
            }
          }
        };

        ws.onclose = () => setTimeout(connect, 3000);
        ws.onerror = (err) => console.error("Layout Socket Error:", err);
      } catch (e) {
        console.error("Could not connect to layout socket:", e);
        setTimeout(connect, 3000);
      }
    };

    connect();
    return () => { if (ws) ws.close(); };
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
            </div>{" "}
            <div className="right">
              <div className="d-flex">
                <div>
                  <button
                    className="btn btn-sm btn-outline-info me-3"
                    onClick={() => setIsQuickAttendanceModalOpen(true)}
                  >
                    Quick Attendance
                  </button>
                </div>
                {can("View Project Chart") && (
                  <>
                    <div>
                      <button
                        className="btn btn-sm btn-outline-danger me-3"
                        onClick={handleBulkUpdate}
                      >
                        Bulk Completed To Deliver
                      </button>

                      <button
                        className="btn btn-sm btn-outline-primary me-3"
                        onClick={() =>
                          router.visit(route("project.count.chart"))
                        }
                      >
                        <BarChartOutlined />
                      </button>
                    </div>
                  </>
                )}
                {can("View Tracking") && (
                  <div>
                    <button
                      className="btn btn-sm btn-outline-primary me-3"
                      onClick={() =>
                        router.visit(route("user.tracking"))
                      }
                    >
                      User Activity
                    </button>
                  </div>
                )}
                <div>
                  <Link
                  className="btn btn-sm btn-outline-primary me-3"
                  href={route("my-activity", user.id)}
                  >
                    My Activity
                  </Link>
                </div>
                {can("View Report") && (
                  <div>
                    <button
                      className="btn btn-sm btn-primary me-3"
                      onClick={() => router.visit(route("project.report"))}
                    >
                      Project Report
                    </button>
                  </div>
                )}

                <div>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={() =>
                      router.visit(route("project.report"), {
                        method: "get",
                        data: { email: user.email },
                      })
                    }
                  >
                    Self Report
                  </button>
                  <button
                    className="btn btn-sm btn-primary me-3"
                    onClick={() =>
                      router.visit(
                        route("project.self.status", {
                          status: "Takeoff On Progress",
                        })
                      )
                    }
                  >
                    Self Project
                  </button>
                </div>
                <div>
                  {/* <button
                    className="btn btn-sm btn-outline-primary me-3"
                    onClick={() => router.visit(route("project.report.chart"))}
                  >
                    Report <BarChartOutlined />
                  </button> */}
                </div>
                <div>
                  <Dropdown
                    menu={{
                      items: userMenuItems,
                    }}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <div
                      className="user-dropdown"
                      style={{ cursor: "pointer" }}
                    >
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
