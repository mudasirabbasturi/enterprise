import React, { useState, useEffect, useRef } from "react";
import {
    Layout,
    Input,
    Avatar,
    Typography,
    Badge,
    Spin,
    message as antMessage,
    Empty,
    Button,
    Upload,
    Image,
    Popconfirm,
    Tooltip,
    Tag,
    List,
    Dropdown,
    Menu
} from "antd";
import {
    SendOutlined,
    PaperClipOutlined,
    FileOutlined,
    DeleteOutlined,
    PlusOutlined,
    UserOutlined,
    MessageOutlined,
    ProjectOutlined,
    SearchOutlined,
    DownOutlined,
    WechatWorkOutlined
} from "@ant-design/icons";

import { BiMicrophone, BiX } from "react-icons/bi";
import { Head, Link, useRoute, router, usePage } from "@shared/ui";
import MainLayout from "@layout";
import axios from "axios";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Ably from 'ably';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const ProjectChat = () => {
    const route = useRoute();
    const { auth, projects: initialProjects, currentStatus, projectCounts } = usePage().props;
    const currentUser = auth.user;

    const [selectedProject, setSelectedProject] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [projects, setProjects] = useState(initialProjects);
    const [loadingProjects, setLoadingProjects] = useState(false);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunksRef = useRef([]);

    // Ably State
    const ablyRef = useRef(null);
    const projectChannelRef = useRef(null);
    const scrollRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    const shouldSendRecordingRef = useRef(true);

    // Status Menu
    const statusMenu = (
        <Menu
            onClick={({ key }) => {
                setLoadingProjects(true);
                router.visit('/project-chat', {  // Use visit instead of get
                    data: { status: key },
                    preserveState: false,  // Set to false to force refresh
                    preserveScroll: true,
                    replace: true,
                    onSuccess: () => setLoadingProjects(false),
                    onError: () => setLoadingProjects(false)
                });
            }}
        >
            <Menu.Item key="All">
                <span>All ({projectCounts?.Total || 0})</span>
            </Menu.Item>
            <Menu.Item key="Takeoff On Progress">
                <span>Takeoff In Progress ({projectCounts?.TakeoffOnProgress || 0})</span>
            </Menu.Item>
            <Menu.Item key="Pricing On Progress">
                <span>Pricing In Progress ({projectCounts?.PricingOnProgress || 0})</span>
            </Menu.Item>
            <Menu.Item key="Completed">
                <span>Completed ({projectCounts?.Completed || 0})</span>
            </Menu.Item>
            <Menu.Item key="Revision">
                <span>Revision ({projectCounts?.Revision || 0})</span>
            </Menu.Item>
            <Menu.Item key="Hold">
                <span>Hold ({projectCounts?.Hold || 0})</span>
            </Menu.Item>
            <Menu.Item key="Deliver">
                <span>Deliver ({projectCounts?.Deliver || 0})</span>
            </Menu.Item>
            <Menu.Item key="Cancelled">
                <span>Cancelled ({projectCounts?.Cancelled || 0})</span>
            </Menu.Item>
        </Menu>
    );

    // Initialize Ably
    useEffect(() => {
        const ably = new Ably.Realtime({ authUrl: '/api/ably/auth' });
        ablyRef.current = ably;

        return () => {
            if (ablyRef.current) {
                ablyRef.current.close();
            }
        };
    }, []);

    // Subscribe to project chat channel
    useEffect(() => {
        if (selectedProject && ablyRef.current) {
            fetchMessages();
            markAsRead();

            const channel = ablyRef.current.channels.get(`project-chat.${selectedProject.id}`);
            projectChannelRef.current = channel;

            channel.subscribe('message.sent', (msgEvent) => {
                const rawMsg = msgEvent.data.message;
                const msg = {
                    id: rawMsg.id,
                    chat_id: selectedProject.id,
                    sender_id: rawMsg.user_id,
                    message: rawMsg.message,
                    created_at: rawMsg.created_at,
                    sender: {
                        name: rawMsg.user_name,
                        media: rawMsg.avatar ? [{ file_path: rawMsg.avatar.replace(/^\//, '') }] : []
                    },
                    reply_to_id: rawMsg.reply_to_id,
                    reply_to: rawMsg.reply_to_message ? {
                        id: rawMsg.reply_to_id,
                        message: rawMsg.reply_to_message,
                        sender: {
                            name: rawMsg.reply_to_user_name
                        }
                    } : null,
                    file_path: rawMsg.file ? rawMsg.file.url.replace(/^\//, '') : null,
                    file_type: rawMsg.file ? (
                        rawMsg.file.name.match(/\.(webm|wav|mp3|ogg)$/i) ? 'audio/webm' :
                            rawMsg.file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? 'image/png' :
                                'application/octet-stream'
                    ) : null,
                };
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    if (msg.sender_id === currentUser.id) {
                        const optIndex = prev.findIndex(m => m.isOptimistic);
                        if (optIndex !== -1) {
                            const newMsgs = [...prev];
                            newMsgs[optIndex] = msg;
                            return newMsgs;
                        }
                    }
                    return [...prev, msg];
                });
            });

            channel.subscribe('message.deleted', (event) => {
                const { messageId } = event.data;
                setMessages(prev => prev.filter(m => Number(m.id) !== Number(messageId)));
            });
        }

        return () => {
            if (projectChannelRef.current) {
                projectChannelRef.current.unsubscribe();
                projectChannelRef.current = null;
            }
        };
    }, [selectedProject?.id]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchMessages = async () => {
        if (!selectedProject?.id) return;
        setLoadingMessages(true);
        try {
            const response = await axios.get(`/projects/${selectedProject.id}/chat`);
            const normalized = response.data.map(msg => ({
                id: msg.id,
                chat_id: selectedProject.id,
                sender_id: msg.user_id,
                message: msg.message,
                created_at: msg.created_at,
                sender: {
                    name: msg.user_name,
                    media: msg.avatar ? [{ file_path: msg.avatar.replace(/^\//, '') }] : []
                },
                reply_to_id: msg.reply_to_id,
                reply_to: msg.reply_to_message ? {
                    id: msg.reply_to_id,
                    message: msg.reply_to_message,
                    sender: {
                        name: msg.reply_to_user_name
                    }
                } : null,
                file_path: msg.file ? msg.file.url.replace(/^\//, '') : null,
                file_type: msg.file ? (
                    msg.file.name.match(/\.(webm|wav|mp3|ogg)$/i) ? 'audio/webm' :
                        msg.file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? 'image/png' :
                            'application/octet-stream'
                ) : null,
            }));
            setMessages(normalized);
        } catch (e) {
            console.error('Failed to fetch messages:', e);
        } finally {
            setLoadingMessages(false);
        }
    };

    const markAsRead = async () => {
        if (!selectedProject?.id) return;
        try {
            await axios.post(`/projects/${selectedProject.id}/chat/read`);
        } catch (e) { }
    };

    const handleSendMessage = async (audioFile = null) => {
        if (!selectedProject || (!newMessage.trim() && !selectedFile && !audioFile)) return;

        const messageText = newMessage;
        const fileToUpload = selectedFile || audioFile;
        const replyId = replyingTo?.id;
        const currentReplyTo = replyingTo;

        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            sender_id: currentUser.id,
            chat_id: selectedProject.id,
            message: messageText,
            created_at: new Date().toISOString(),
            isOptimistic: true,
            reply_to: currentReplyTo,
            file_path: fileToUpload ? URL.createObjectURL(fileToUpload) : null,
            file_type: fileToUpload ? fileToUpload.type : null,
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage("");
        setSelectedFile(null);
        setReplyingTo(null);

        const formData = new FormData();
        if (messageText.trim()) formData.append("message", messageText);
        if (selectedFile) formData.append("file", selectedFile);
        if (audioFile) formData.append("file", audioFile);
        if (replyId) formData.append("reply_to_id", replyId);

        try {
            setSending(true);
            const response = await axios.post(`/projects/${selectedProject.id}/chat`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const d = response.data.data;
            const realMsg = {
                id: d.id,
                chat_id: selectedProject.id,
                sender_id: d.user_id,
                message: d.message,
                created_at: d.created_at,
                sender: {
                    name: d.user_name,
                    media: d.avatar ? [{ file_path: d.avatar.replace(/^\//, '') }] : []
                },
                reply_to_id: d.reply_to_id,
                reply_to: d.reply_to_message ? {
                    id: d.reply_to_id,
                    message: d.reply_to_message,
                    sender: {
                        name: d.reply_to_user_name
                    }
                } : null,
                file_path: d.file ? d.file.url.replace(/^\//, '') : null,
                file_type: d.file ? (
                    d.file.name.match(/\.(webm|wav|mp3|ogg)$/i) ? 'audio/webm' :
                        d.file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? 'image/png' :
                            'application/octet-stream'
                ) : null,
            };

            setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
        } catch (e) {
            antMessage.error("Failed to send message");
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setNewMessage(messageText);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await axios.delete(`/projects/${selectedProject.id}/chat/${messageId}`);
            setMessages(prev => prev.filter(m => m.id !== messageId));
            antMessage.success("Message deleted");
        } catch (e) {
            antMessage.error("Failed to delete message");
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 44100,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            const mimeTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/ogg',
                'audio/wav'
            ];

            let selectedMimeType = '';
            for (const type of mimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedMimeType = type;
                    break;
                }
            }

            const recorder = new MediaRecorder(stream, {
                mimeType: selectedMimeType,
                audioBitsPerSecond: 128000
            });

            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                if (shouldSendRecordingRef.current) {
                    const mimeType = selectedMimeType || 'audio/webm';
                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

                    let extension = 'webm';
                    if (mimeType.includes('mp4')) extension = 'mp4';
                    if (mimeType.includes('ogg')) extension = 'ogg';
                    if (mimeType.includes('wav')) extension = 'wav';

                    const audioFile = new File([audioBlob], `voice-message-${Date.now()}.${extension}`, { type: mimeType });
                    handleSendMessage(audioFile);
                }
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start(1000);
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);
            shouldSendRecordingRef.current = true;
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            antMessage.success('Recording started');
        } catch (err) {
            antMessage.error("Microphone access denied: " + err.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            shouldSendRecordingRef.current = true;
            mediaRecorder.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorder && isRecording) {
            shouldSendRecordingRef.current = false;
            mediaRecorder.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
            antMessage.info('Recording cancelled');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const scrollToMessage = (msgId) => {
        const el = document.getElementById(`msg-bubble-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('message-focused');
            setTimeout(() => el.classList.remove('message-focused'), 2000);
        }
    };

    // Filter projects by search
    const filteredProjects = projects.filter(p =>
        p.project_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get display status name
    const getStatusDisplayName = () => {
        if (currentStatus === 'All') return 'All Projects';
        if (currentStatus === 'Takeoff On Progress') return 'Takeoff In Progress';
        if (currentStatus === 'Pricing On Progress') return 'Pricing In Progress';
        return currentStatus;
    };

    return (
        <>
            <Head title="Project Chat" />
            <style>{`
                .message-focused {
                    animation: highlightPulse 2s ease-out;
                }
                @keyframes highlightPulse {
                    0% { background-color: #ffe58f !important; transform: scale(1.02); }
                    50% { background-color: #fffbe6 !important; transform: scale(1); }
                    100% { background-color: inherit; }
                }
                .reply-preview-box {
                    transition: all 0.2s ease;
                }
                .reply-preview-box:hover {
                    filter: contrast(1.1) brightness(0.95);
                    opacity: 1 !important;
                }
                .project-item:hover {
                    background: #f0f7ff !important;
                }
                .custom-scroll::-webkit-scrollbar { width: 5px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .pulse-dot {
                    animation: dot-pulse 1.2s infinite;
                }
                @keyframes dot-pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>

            <div style={{ display: "flex", height: "calc(100vh - 64px)", background: "#fff" }}>
                {/* Left Sidebar - Projects */}
                <div style={{ width: 320, borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
                        <Title level={4} style={{ marginBottom: "5px" }}>Project Chats</Title>
                        <Input
                            placeholder="Search projects..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            allowClear
                            style={{ borderRadius: '20px', marginBottom: "12px" }}
                        />
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                            <Dropdown overlay={statusMenu} trigger={['click']} className="me-1">
                                <Button size="medium" icon={<ProjectOutlined />}>
                                    {getStatusDisplayName()} <DownOutlined />
                                </Button>
                            </Dropdown>
                            <Button size="medium" icon={<WechatWorkOutlined />}>
                                <Link href={route("chat.index")}>Direct Chat</Link>
                            </Button>
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto" }} className="custom-scroll">
                        <Spin spinning={loadingProjects}>
                            <List
                                dataSource={filteredProjects}
                                locale={{ emptyText: <Empty description="No projects found" /> }}
                                renderItem={project => (
                                    <List.Item
                                        onClick={() => setSelectedProject(project)}
                                        style={{
                                            padding: "15px 20px",
                                            cursor: "pointer",
                                            background: selectedProject?.id === project.id ? "#f0f7ff" : "transparent",
                                            borderLeft: selectedProject?.id === project.id ? "4px solid #1890ff" : "4px solid transparent"
                                        }}
                                        className="project-item"
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Badge count={project.unread_count}>
                                                    <Avatar size={45} icon={<ProjectOutlined />} style={{ background: '#1890ff' }} />
                                                </Badge>
                                            }
                                            title={<b>{project.project_title}</b>}
                                            description={
                                                <div>
                                                    <Text type="secondary" ellipsis style={{ fontSize: "11px", display: "block" }}>
                                                        {project.project_team_members?.length || 0} members
                                                    </Text>
                                                    {project.project_status && (
                                                        <Badge
                                                            status={project.project_status === 'Completed' ? 'success' : 'processing'}
                                                            text={project.project_status}
                                                            style={{ fontSize: "10px" }}
                                                        />
                                                    )}
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </Spin>
                    </div>
                </div>

                {/* Right Side - Chat */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    {selectedProject ? (
                        <>
                            {/* Header */}
                            <div style={{
                                padding: "15px 25px",
                                borderBottom: "1px solid #f0f0f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: "#fff"
                            }}>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <Avatar size={40} icon={<ProjectOutlined />} style={{ background: '#1890ff', marginRight: 12 }} />
                                    <div>
                                        <Title level={5} style={{ margin: 0 }}>{selectedProject.project_title}</Title>
                                        <Text type="secondary" style={{ fontSize: "12px" }}>
                                            {selectedProject.project_team_members?.length || 0} Team Members •
                                            <Badge
                                                status={selectedProject.project_status === 'Completed' ? 'success' : 'processing'}
                                                text={selectedProject.project_status}
                                                style={{ marginLeft: 5 }}
                                            />
                                        </Text>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                ref={scrollRef}
                                className="custom-scroll"
                                style={{
                                    flex: 1,
                                    overflowY: "auto",
                                    padding: "20px",
                                    background: "#f4f7f6",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px"
                                }}
                            >
                                {loadingMessages ? (
                                    <div className="text-center p-5"><Spin tip="Loading..." /></div>
                                ) : messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUser.id;

                                    return (
                                        <div
                                            key={msg.id}
                                            style={{
                                                alignSelf: isMe ? "flex-end" : "flex-start",
                                                maxWidth: "75%",
                                                transition: "all 0.5s",
                                                opacity: msg.isOptimistic ? 0.7 : 1
                                            }}
                                        >
                                            <div
                                                id={`msg-bubble-${msg.id}`}
                                                style={{
                                                    background: isMe ? "#1890ff" : "#fff",
                                                    color: isMe ? "#fff" : "#333",
                                                    padding: "10px 15px",
                                                    borderRadius: isMe ? "18px 18px 0 18px" : "18px 18px 18px 0",
                                                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                                                }}
                                            >
                                                {!isMe && (
                                                    <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#1890ff" }}>
                                                        {msg.sender?.name}
                                                    </div>
                                                )}

                                                {msg.reply_to && (
                                                    <div
                                                        onClick={() => scrollToMessage(msg.reply_to_id)}
                                                        className="reply-preview-box"
                                                        style={{
                                                            background: isMe ? "rgba(255,255,255,0.15)" : "#f0f2f5",
                                                            padding: "5px 10px",
                                                            borderRadius: "8px",
                                                            fontSize: "12px",
                                                            marginBottom: "8px",
                                                            borderLeft: "3px solid " + (isMe ? "#fff" : "#1890ff"),
                                                            cursor: "pointer",
                                                            opacity: 0.8
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: "bold", fontSize: "11px" }}>{msg.reply_to.sender?.name}</div>
                                                        <div style={{ maxHeight: "40px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {msg.reply_to.message || "File/Media"}
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{msg.message}</div>

                                                {msg.file_path && (
                                                    <div style={{ marginTop: "8px" }}>
                                                        {msg.file_type?.startsWith('image/') ?
                                                            <Image src={msg.file_path} style={{ maxWidth: "250px", borderRadius: "8px" }} /> :
                                                            msg.file_type?.startsWith('audio/') ? (
                                                                <audio controls style={{ width: "220px", height: "40px" }}>
                                                                    <source src={msg.file_path} type={msg.file_type} />
                                                                </audio>
                                                            ) :
                                                                <a href={msg.file_path} target="_blank" rel="noreferrer" style={{ color: isMe ? "#fff" : "#1890ff" }}>
                                                                    <FileOutlined /> {msg.file_path.split('/').pop()}
                                                                </a>
                                                        }
                                                    </div>
                                                )}

                                                <div className="d-flex justify-content-between align-items-center mt-1" style={{ gap: "15px" }}>
                                                    <small style={{ fontSize: "9px", opacity: 0.6 }}>
                                                        {msg.isOptimistic ? "Sending..." : dayjs(msg.created_at).format('H:mm')}
                                                    </small>
                                                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                        {!msg.isOptimistic && (
                                                            <Tooltip title="Reply">
                                                                <span onClick={() => setReplyingTo(msg)} style={{ cursor: "pointer", opacity: 0.6, fontSize: "11px" }}>
                                                                    Reply
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                        {isMe && !msg.isOptimistic && (
                                                            <Popconfirm title="Delete message?" onConfirm={() => handleDeleteMessage(msg.id)}>
                                                                <DeleteOutlined style={{ fontSize: "11px", cursor: "pointer", opacity: 0.6 }} />
                                                            </Popconfirm>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {messages.length === 0 && !loadingMessages && (
                                    <div style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}>
                                        <MessageOutlined style={{ fontSize: "60px", color: "#1890ff" }} />
                                        <Title level={4}>No messages yet</Title>
                                        <Text type="secondary">Start the conversation!</Text>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div style={{ padding: "20px", borderTop: "1px solid #f0f0f0", background: "#fff" }}>
                                {replyingTo && (
                                    <div style={{
                                        background: "#f0f2f5",
                                        padding: "10px 15px",
                                        borderRadius: "12px 12px 0 0",
                                        borderLeft: "4px solid #1890ff",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "-1px"
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: "bold", fontSize: "12px", color: "#1890ff" }}>
                                                Replying to {replyingTo.sender?.name}
                                            </div>
                                            <div style={{ fontSize: "12px", opacity: 0.7 }}>
                                                {replyingTo.message || "File/Media"}
                                            </div>
                                        </div>
                                        <Button type="text" size="small" icon={<BiX />} onClick={() => setReplyingTo(null)} />
                                    </div>
                                )}

                                {selectedFile && (
                                    <Tag closable onClose={() => setSelectedFile(null)} color="blue" style={{ marginBottom: "10px" }}>
                                        {selectedFile.name}
                                    </Tag>
                                )}

                                <div className="d-flex gap-2 align-items-end">
                                    {!isRecording && (
                                        <Upload beforeUpload={f => { setSelectedFile(f); return false; }} showUploadList={false}>
                                            <Button size="large" shape="circle" icon={<PlusOutlined />} />
                                        </Upload>
                                    )}

                                    {isRecording ? (
                                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "15px", background: "#fef2f2", borderRadius: "20px", padding: "8px 20px" }}>
                                            <div className="pulse-dot" style={{ width: "10px", height: "10px", background: "#ff4d4f", borderRadius: "50%" }} />
                                            <span style={{ fontWeight: "bold" }}>{formatTime(recordingTime)}</span>
                                            <span style={{ color: "#ff4d4f", flex: 1 }}>Recording...</span>
                                            <Button type="text" danger icon={<DeleteOutlined />} onClick={cancelRecording}>Cancel</Button>
                                        </div>
                                    ) : (
                                        <Input.TextArea
                                            autoSize={{ minRows: 1, maxRows: 4 }}
                                            placeholder={`Message ${selectedProject.project_title}...`}
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onPressEnter={e => {
                                                if (!e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            style={{ borderRadius: "20px", border: "none", background: "#f0f2f5", padding: "10px 20px" }}
                                        />
                                    )}

                                    {isRecording ? (
                                        <Button type="primary" shape="circle" size="large" icon={<SendOutlined />} onClick={stopRecording} style={{ background: '#52c41a' }} />
                                    ) : (
                                        <>
                                            {(!newMessage.trim() && !selectedFile) ? (
                                                <Button shape="circle" size="large" icon={<BiMicrophone />} onClick={startRecording} />
                                            ) : (
                                                <Button type="primary" shape="circle" size="large" icon={<SendOutlined />} onClick={() => handleSendMessage()} loading={sending} />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f7f6" }}>
                            <div className="text-center">
                                <Avatar size={100} icon={<ProjectOutlined />} style={{ background: "#e6f7ff", color: "#1890ff", marginBottom: "20px" }} />
                                <Title level={3}>Select a Project</Title>
                                <Text type="secondary">Choose a project from the list to start chatting</Text>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

ProjectChat.layout = (page) => <MainLayout children={page} />;

export default ProjectChat;