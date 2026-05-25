import React, { useState, useEffect, useRef } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import * as Ably from 'ably';

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
  /**
   * Ziggy
   */
  useRoute,
} from "@shared/ui";
import { Layout, Button, Dropdown, Avatar, notification, Menu } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { BiPhone, BiVideo, BiX, BiMicrophone } from "react-icons/bi";
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
    // Logic for other unread counts if any
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

  // WebRTC Global State
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('audio');
  const [incomingCall, setIncomingCall] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

  // Main Menu Items (separate dropdown for Activity, Projects, Self Service)
  const mainMenuItems = [
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

  const refreshUnreadCount = async () => {
    try {
      const res = await axios.get('/api/chat/unread-count');
      setUnreadCounts(prev => ({ ...prev, chat: res.data }));
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

    // Ably Real-time Connection
    const ably = new Ably.Realtime({ authUrl: '/api/ably/auth' });
    ablyRef.current = ably;
    const presenceChannel = ably.channels.get('presence:global');
    const userChannel = ably.channels.get(`user.${user.id}`);

    // Presence
    presenceChannel.presence.subscribe('enter', (member) => setOnlineUsers(prev => new Set([...prev, member.clientId])));
    presenceChannel.presence.subscribe('leave', (member) => setOnlineUsers(prev => {
      const next = new Set(prev);
      next.delete(member.clientId);
      return next;
    }));
    presenceChannel.presence.enter();

    // Chat Notifications
    userChannel.subscribe('notification', (msgEvent) => {
      const msg = msgEvent.data.message;
      const chatType = msgEvent.data.chat_type || 'direct';

      if (window.activeChatId !== msg.chat_id) {
        chatSound.current.play().catch(() => { });
        setUnreadCounts(prev => {
          const newChat = { ...(prev.chat || { total: 0, direct: 0, group: 0 }) };
          newChat.total = (newChat.total || 0) + 1;
          if (chatType === 'group') {
            newChat.group = (newChat.group || 0) + 1;
          } else {
            newChat.direct = (newChat.direct || 0) + 1;
          }
          return { ...prev, chat: newChat };
        });
      }
    });

    // WebRTC Signaling
    userChannel.subscribe('call-signaling', async (msgEvent) => {
      const { type, from, signal, fromName, callType: incomingType, chatId: incomingChatId } = msgEvent.data;
      if (from === user.id) return;

      if (incomingChatId) window.activeChatId = incomingChatId;

      if (type === 'offer') {
        setIncomingCall({ from, fromName, signal });
        setCallType(incomingType || 'audio');
        setCallState('ringing');

        const ringtone = new Audio(`/uploads/media/sound_effect/chat/chat_message_notification.mp3`);
        ringtone.loop = true;
        ringtone.play().catch(() => { });
        window.ringtone = ringtone;
      } else if (type === 'answer') {
        if (window.ringtone) {
          window.ringtone.pause();
          window.ringtone.currentTime = 0;
          window.ringtone = null;
        }
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
          setCallState('connected');
        }
      } else if (type === 'ice-candidate') {
        if (peerConnection.current && signal) {
          try { await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal)); } catch (e) { console.error('Error adding ice candidate', e); }
        }
      } else if (type === 'reject' || type === 'hangup') {
        let status = type === 'reject' ? 'rejected' : (callState === 'connected' ? 'completed' : 'missed');
        endCallLocal(status);
      }
    });

    return () => {
      window.removeEventListener('chat-unread-count-changed', refreshUnreadCount);
      window.Echo.leave('project-channel');
      window.Echo.leave('tracker-status');
      try {
        presenceChannel.presence.leave();
        userChannel.unsubscribe();
        if (ably.connection.state !== 'closed') ably.close();
      } catch (e) { }
      endCallLocal();
    };
  }, [user.id]);

  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [callState]);

  // WebRTC Helper Functions
  const sendSignal = (to, data) => {
    const ably = new Ably.Realtime({ authUrl: '/api/ably/auth' });
    const channel = ably.channels.get(`user.${to}`);
    channel.publish('call-signaling', { ...data, from: user.id, fromName: user.name, callType, chatId: window.activeChatId });
  };

  const initPeerConnection = (remoteUserId) => {
    const pc = new RTCPeerConnection(iceServers);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(remoteUserId, { type: 'ice-candidate', signal: event.candidate });
      }
    };
    pc.ontrack = (event) => { setRemoteStream(event.streams[0]); };
    peerConnection.current = pc;
    return pc;
  };

  const endCallLocal = (status = null) => {
    if (status && window.activeChatId) {
      saveCallLog(status, callDuration, window.activeChatId);
    }

    if (window.ringtone) {
      window.ringtone.pause();
      window.ringtone.currentTime = 0;
      window.ringtone = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setRemoteStream(null);
    setLocalStream(null);
    setCallState('idle');
    setIncomingCall(null);
    setCallDuration(0);
    window.activeChatId = null;
  };

  const saveCallLog = async (status, duration, chatId) => {
    if (!chatId) return;
    const logMsg = `[CALL_LOG]:${callType}|${status}|${duration}`;
    try {
      await axios.post(`/api/chats/${chatId}/messages`, { message: logMsg });
    } catch (e) { console.error('Error saving call log', e); }
  };

  const hangupCall = () => {
    const targetId = incomingCall?.from || window.lastTargetId;
    if (targetId) {
      sendSignal(targetId, { type: 'hangup' });
    }

    let status = 'completed';
    if (callState === 'calling') status = 'missed';

    endCallLocal(status);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    if (window.ringtone) {
      window.ringtone.pause();
      window.ringtone.currentTime = 0;
      window.ringtone = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === 'video'
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      const pc = initPeerConnection(incomingCall.from);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(incomingCall.from, { type: 'answer', signal: answer });
      setCallState('connected');
      setIncomingCall(null);
    } catch (err) {
      console.error('Accept call error:', err);
      endCallLocal();
    }
  };

  const rejectCall = () => {
    if (incomingCall) sendSignal(incomingCall.from, { type: 'reject' });
    endCallLocal('rejected');
  };

  window.startCall = async (type, otherUserId, chatId) => {
    window.lastTargetId = otherUserId;
    window.activeChatId = chatId;
    setCallType('audio');
    setCallState('calling');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      const pc = initPeerConnection(otherUserId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal(otherUserId, { type: 'offer', signal: offer });
    } catch (err) {
      console.error('Call media error:', err);
      let errorMsg = "Could not access microphone.";
      if (err.name === 'NotAllowedError') errorMsg = "Microphone access denied. Please enable permissions in your browser.";
      if (err.name === 'NotFoundError') errorMsg = "No microphone found on this device.";
      if (err.name === 'NotReadableError') errorMsg = "Microphone is already in use by another app.";

      api.error({ message: errorMsg });
      endCallLocal();
    }
  };

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
                {/* Main Menu Dropdown (Activity, Projects, Self Service) */}
                <div className="me-3">
                  <Dropdown
                    menu={{
                      items: mainMenuItems,
                    }}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <button className="btn btn-sm btn-outline-primary">
                      <AppstoreOutlined /> Chat
                    </button>
                  </Dropdown>
                </div>
                {/* Main Menu Dropdown (Activity, Projects, Self Service) */}
                <div className="me-3">
                  <Dropdown
                    menu={{
                      items: mainMenuItems,
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

      {/* Global Call Overlay */}
      <AnimatePresence>
        {callState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              width: callType === 'video' && callState === 'connected' ? '600px' : '320px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              padding: '20px',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <>
              {callState === 'connected' && (
                <audio
                  ref={el => { if (el && remoteStream) el.srcObject = remoteStream; }}
                  autoPlay
                  playsInline
                />
              )}
              <Avatar size={80} icon={<UserOutlined />} style={{ marginBottom: '15px', background: '#1890ff' }} />
              <h3 style={{ margin: '0 0 5px' }}>{incomingCall?.fromName || 'Voice Call'}</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                {callState === 'calling' && 'Calling...'}
                {callState === 'ringing' && `Incoming Voice Call`}
                {callState === 'connected' && `Connected • ${formatTime(callDuration)}`}
              </p>
              <div style={{ display: 'flex', gap: '15px' }}>
                {callState === 'ringing' ? (
                  <>
                    <Button shape="circle" type="primary" icon={<BiPhone />} onClick={acceptCall} style={{ width: '50px', height: '50px', background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                    <Button shape="circle" danger icon={<BiX />} onClick={rejectCall} style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                  </>
                ) : (
                  <Button shape="circle" danger icon={<BiX />} onClick={hangupCall} style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                )}
              </div>
            </>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardLayout;