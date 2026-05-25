import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Layout,
    Input,
    List,
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
    Modal,
    Divider,
    Tag,
    Tabs
} from "antd";
import {
    SearchOutlined,
    MessageOutlined,
    UserOutlined,
    SendOutlined,
    PaperClipOutlined,
    FileOutlined,
    DeleteOutlined,
    PlusOutlined,
    EllipsisOutlined,
    CheckOutlined,
    TeamOutlined,
    PhoneOutlined,
    VideoCameraOutlined,
    EditOutlined,
    ProjectOutlined
} from "@ant-design/icons";
import { BiMicrophone, BiSquare, BiX } from "react-icons/bi";
import { Head, Link } from "@shared/ui";
import MainLayout from "@layout";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Ably from 'ably';

dayjs.extend(relativeTime);

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const Chat = () => {
    const { auth, initialChatType, initialChatId, projects: initialProjects } = usePage().props;
    const currentUser = auth.user;
    const can = (perm) => (auth.userpermission || auth.user?.role?.permissions || []).some(p => p.name === perm);

    const [chats, setChats] = useState([]);
    const [projects, setProjects] = useState(initialProjects || []);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [replyingTo, setReplyingTo] = useState(null);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [activeTab, setActiveTab] = useState("direct");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [userSearchTerm, setUserSearchTerm] = useState("");

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunksRef = useRef([]);

    // Ably State
    const ablyRef = useRef(null);
    const chatChannelRef = useRef(null);
    const userChannelRef = useRef(null);
    const scrollRef = useRef(null);
    const activeChatIdRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    const shouldSendRecordingRef = useRef(true);

    // Initialize Ably (Same logic as Layout.jsx)
    useEffect(() => {
        const ably = new Ably.Realtime({ authUrl: '/api/ably/auth' });
        ablyRef.current = ably;

        const userChannel = ably.channels.get(`user.${currentUser.id}`);
        userChannelRef.current = userChannel;

        userChannel.subscribe('notification', (msgEvent) => {
            const incomingMsg = msgEvent.data.message;
            moveChatToTop(incomingMsg, true);
        });

        userChannel.subscribe('project-notification', (msgEvent) => {
            const { project_id, message: incomingMsg } = msgEvent.data;
            if (incomingMsg.user_id !== currentUser.id) {
                if (String(activeChatIdRef.current) !== String(project_id)) {
                    setProjects(prev => prev.map(p => p.id === project_id ? { ...p, unread_count: (parseInt(p.unread_count) || 0) + 1 } : p));
                }
            }
        });

        fetchChats();
        fetchAvailableUsers();

        return () => {
            userChannel.unsubscribe();
            ably.close();
        };
    }, [currentUser.id]);

    const moveChatToTop = (message, isIncoming = false) => {
        setChats(prev => {
            // Find by chat_id first (use string comparison for safety)
            let chatIndex = prev.findIndex(c => String(c.id) === String(message.chat_id));

            // Fallback for new direct chats
            if (chatIndex === -1 && message.chat?.type === 'direct') {
                chatIndex = prev.findIndex(c => c.type === 'direct' && String(c.user_id) === String(message.sender_id));
            }

            if (chatIndex !== -1) {
                const updatedChat = {
                    ...prev[chatIndex],
                    id: message.chat_id,
                    is_existing: true,
                    latest_message: message.message || "Sent a file",
                    latest_message_time: message.created_at,
                    unread_count: isIncoming && String(activeChatIdRef.current) !== String(message.chat_id)
                        ? (Number(prev[chatIndex].unread_count) || 0) + 1
                        : (Number(prev[chatIndex].unread_count) || 0)
                };
                const rest = prev.filter((_, i) => i !== chatIndex);
                return [updatedChat, ...rest];
            }
            return prev;
        });
    };

    useEffect(() => {
        if (editingGroup) {
            setGroupName(editingGroup.name || "");
            setSelectedUserIds(editingGroup.participants?.map(p => p.user_id) || []);
        }
    }, [editingGroup]);

    useEffect(() => {
        activeChatIdRef.current = selectedChat?.id;
        window.activeChatId = selectedChat?.id; // Set globally for Layout.jsx sound logic

        if (chatChannelRef.current) chatChannelRef.current.unsubscribe();

        if (selectedChat) {
            if (selectedChat.is_existing) {
                fetchMessages(selectedChat.id);
                markAsRead(selectedChat.id);

                if (selectedChat.type === 'project') {
                    const channel = ablyRef.current.channels.get(`project-chat.${selectedChat.id}`);
                    chatChannelRef.current = channel;
                    channel.subscribe('message.sent', (msgEvent) => {
                        const rawMsg = msgEvent.data.message;
                        const msg = {
                            id: rawMsg.id,
                            chat_id: selectedChat.id,
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
                            // Optimistic update replacement for projects
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
                } else {
                    const channel = ablyRef.current.channels.get(`chat.${selectedChat.id}`);
                    chatChannelRef.current = channel;
                    channel.subscribe('message.sent', (msgEvent) => {
                        const msg = msgEvent.data.message;
                        setMessages(prev => {
                            if (prev.some(m => m.id === msg.id)) return prev;
                            // If it's from me, try to find and replace the optimistic message
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
                        moveChatToTop(msg, false);
                    });
                    channel.subscribe('message.deleted', (event) => {
                        const { messageId } = event.data;
                        setMessages(prev => prev.filter(m => Number(m.id) !== Number(messageId)));
                    });
                }
            } else {
                setMessages([]);
            }
        }

        return () => {
            window.activeChatId = null; // Clear when leaving
        };
    }, [selectedChat?.id, selectedChat?.user_id]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    // Update browser URL dynamically based on selectedChat
    useEffect(() => {
        if (selectedChat) {
            const type = selectedChat.type;
            const id = selectedChat.id;
            const newUrl = `/chat/${type}/${id}`;
            if (window.location.pathname !== newUrl) {
                window.history.replaceState(null, '', newUrl);
            }
        } else {
            const newUrl = '/chat';
            if (window.location.pathname !== newUrl) {
                window.history.replaceState(null, '', newUrl);
            }
        }
    }, [selectedChat?.id, selectedChat?.type]);

    const fetchChats = async (showLoading = true) => {
        if (showLoading) setLoadingChats(true);
        try {
            const response = await axios.get("/api/chats");
            setChats(response.data);

            const projResponse = await axios.get("/api/project-chats");
            setProjects(projResponse.data);

            // Select active chat from URL parameters on initial load
            if (initialChatType && initialChatId) {
                if (initialChatType === 'project') {
                    const matchingProject = projResponse.data.find(p => String(p.id) === String(initialChatId));
                    if (matchingProject) {
                        const standardProject = {
                            id: matchingProject.id,
                            name: matchingProject.project_title,
                            type: 'project',
                            is_existing: true,
                            participants: matchingProject.project_team_members || []
                        };
                        setSelectedChat(standardProject);
                        setActiveTab('projects');
                    }
                } else {
                    const matchingChat = response.data.find(c =>
                        String(c.type) === String(initialChatType) &&
                        String(c.id) === String(initialChatId)
                    );
                    if (matchingChat) {
                        setSelectedChat(matchingChat);
                        if (initialChatType === 'group') {
                            setActiveTab('groups');
                        } else {
                            setActiveTab('direct');
                        }
                    }
                }
            }
        } catch (e) { } finally {
            if (showLoading) setLoadingChats(false);
        }
    };

    const fetchAvailableUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await axios.get("/api/chat-visibility-users");
            setAvailableUsers(response.data);
        } catch (e) { } finally {
            setLoadingUsers(false);
        }
    };

    const fetchMessages = async (chatId) => {
        if (!chatId || String(chatId).startsWith('new-')) return;
        setLoadingMessages(true);
        try {
            let url = `/api/chats/${chatId}/messages`;
            let isProject = false;
            if (selectedChat?.type === 'project') {
                url = `/api/projects/${chatId}/chat`;
                isProject = true;
            }
            const response = await axios.get(url);
            if (isProject) {
                const normalized = response.data.map(msg => ({
                    id: msg.id,
                    chat_id: chatId,
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
            } else {
                setMessages(response.data);
            }
        } catch (e) { } finally {
            setLoadingMessages(false);
        }
    };

    const markAsRead = async (chatId) => {
        if (!chatId || String(chatId).startsWith('new-')) return;
        try {
            if (selectedChat?.type === 'project') {
                setProjects(prev => prev.map(p => p.id === chatId ? { ...p, unread_count: 0 } : p));
                window.dispatchEvent(new CustomEvent('refresh-unread-counts'));
            } else {
                await axios.post(`/api/chats/${chatId}/read`);
                setChats(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c));
                window.dispatchEvent(new CustomEvent('chat-unread-count-changed'));
            }
        } catch (e) { }
    };

    const handleSendMessage = async (audioFile = null) => {
        if (!selectedChat || (!newMessage.trim() && !selectedFile && !audioFile)) return;

        let chatId = selectedChat.id;
        const messageText = newMessage;
        const fileToUpload = selectedFile || audioFile;
        const replyId = replyingTo?.id;
        const currentReplyTo = replyingTo;

        // Optimistic Update for existing chats
        let tempId = null;
        if (selectedChat.is_existing) {
            tempId = `temp-${Date.now()}`;
            const optimisticMsg = {
                id: tempId,
                sender_id: currentUser.id,
                chat_id: chatId,
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
            if (selectedChat.type !== 'project') {
                moveChatToTop(optimisticMsg, false);
            }
        }

        // If it's a new chat, we need to create it first
        if (!selectedChat.is_existing) {
            try {
                setSending(true);
                const chatRes = await axios.post("/api/chats", {
                    user_ids: [selectedChat.user_id],
                    type: 'direct'
                });
                chatId = chatRes.data.id;
                const realChat = { ...selectedChat, id: chatId, is_existing: true };
                setSelectedChat(realChat);
                setChats(prev => prev.map(c => c.user_id === selectedChat.user_id ? realChat : c));
            } catch (e) {
                antMessage.error("Failed to initialize chat");
                setSending(false);
                return;
            }
        }

        const formData = new FormData();
        if (messageText.trim()) formData.append("message", messageText);
        if (selectedFile) formData.append("file", selectedFile);
        if (audioFile) formData.append("file", audioFile);
        if (replyId) formData.append("reply_to_id", replyId);

        try {
            setSending(true);
            let url = `/api/chats/${chatId}/messages`;
            if (selectedChat?.type === 'project') {
                url = `/api/projects/${chatId}/chat`;
            }
            const response = await axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            // Update the optimistic message with real data from server
            let realMsg = response.data;
            if (selectedChat?.type === 'project') {
                const d = response.data.data;
                realMsg = {
                    id: d.id,
                    chat_id: chatId,
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
            }
            if (tempId) {
                setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
            } else {
                // For new chats where we didn't do optimistic update yet
                setMessages(prev => [...prev, realMsg]);
                setNewMessage("");
                setSelectedFile(null);
                setReplyingTo(null);
            }
        } catch (e) {
            antMessage.error("Failed to send");
            // If optimistic message was added, remove it and restore the text
            if (tempId) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setNewMessage(messageText);
            }
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            let url = `/api/chats/${selectedChat.id}/messages/${messageId}`;
            if (selectedChat?.type === 'project') {
                url = `/api/projects/${selectedChat.id}/chat/${messageId}`;
            }
            await axios.delete(url);
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (e) { antMessage.error("Failed to delete"); }
    };

    // Voice Recording Logic
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

            recorder.start(1000); // 1-second chunks
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

    // Filter chats based on search term
    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Separate direct and group chats after applying global search
    const directChats = useMemo(() => chats.filter(c => c.type === 'direct' && c.name.toLowerCase().includes(searchTerm.toLowerCase())), [chats, searchTerm]);
    const groupChats = useMemo(() => chats.filter(c => c.type === 'group' && c.name.toLowerCase().includes(searchTerm.toLowerCase())), [chats, searchTerm]);

    // Calculate total unread counts for each tab
    const totalDirectUnread = useMemo(() =>
        chats.filter(c => c.type === 'direct').reduce((sum, c) => sum + (c.unread_count || 0), 0),
        [chats]
    );
    const totalGroupsUnread = useMemo(() =>
        chats.filter(c => c.type === 'group').reduce((sum, c) => sum + (c.unread_count || 0), 0),
        [chats]
    );

    const projectChats = useMemo(() => {
        return projects.map(p => ({
            id: p.id,
            name: p.project_title,
            type: 'project',
            is_existing: true,
            unread_count: p.unread_count || 0,
            participants: p.project_team_members || [],
            description: p.project_team_members?.length > 0
                ? `Joined by ${p.project_team_members.length} members`
                : 'Joined by 0 members'
        })).filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [projects, searchTerm]);

    const totalProjectsUnread = useMemo(() =>
        projects.reduce((sum, p) => sum + (Number(p.unread_count) || 0), 0),
        [projects]
    );

    const memoizedMessageList = useMemo(() => {
        if (!selectedChat) return null;
        return (
            <>
                {loadingMessages ? (
                    <div className="text-center p-5"><Spin tip="Loading chat..." /></div>
                ) : messages.map((msg, i) => {
                    const isMe = msg.sender_id === currentUser.id;

                    // Handle Call Logs
                    if (msg.message?.startsWith('[CALL_LOG]:')) {
                        const [_, data] = msg.message.split(':');
                        const [type, status, duration] = data.split('|');
                        const isMissed = status === 'missed' || status === 'rejected';

                        const formatDuration = (s) => {
                            const mins = Math.floor(s / 60);
                            const secs = s % 60;
                            return `${mins}:${secs.toString().padStart(2, '0')}`;
                        };

                        return (
                            <div key={msg.id} style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
                                <div style={{ background: "#f0f2f5", padding: "8px 20px", borderRadius: "20px", border: "1px solid #e8e8e8", display: "flex", alignItems: "center", gap: "10px" }}>
                                    {type === 'video' ? <VideoCameraOutlined style={{ color: isMissed ? "#ff4d4f" : "#1890ff" }} /> : <PhoneOutlined style={{ color: isMissed ? "#ff4d4f" : "#1890ff" }} />}
                                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#595959" }}>
                                        {isMissed ? (isMe ? `Unanswered ${type} call` : `Missed ${type} call`) : `${type.charAt(0).toUpperCase() + type.slice(1)} call (${formatDuration(duration)})`}
                                    </span>
                                    <small style={{ fontSize: "10px", opacity: 0.6 }}>{dayjs(msg.created_at).format('H:mm')}</small>
                                    {isMe && (
                                        <Popconfirm title="Delete call log?" onConfirm={() => handleDeleteMessage(msg.id)}>
                                            <DeleteOutlined style={{ fontSize: "11px", cursor: "pointer", opacity: 0.4, marginLeft: "5px" }} />
                                        </Popconfirm>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%", transition: "all 0.5s", opacity: msg.isOptimistic ? 0.7 : 1 }}>
                            <div id={`msg-bubble-${msg.id}`} style={{ background: isMe ? "#1890ff" : "#fff", color: isMe ? "#fff" : "#333", padding: "10px 15px", borderRadius: isMe ? "18px 18px 0 18px" : "18px 18px 18px 0", boxShadow: "0 2px 5px rgba(0,0,0,0.05)", transition: "all 0.3s ease" }}>

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
                                        <div style={{ maxHeight: "40px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.reply_to.message || "File/Media"}</div>
                                    </div>
                                )}

                                <div style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{msg.message}</div>
                                {msg.file_path && (
                                    <div style={{ marginTop: "8px" }}>
                                        {msg.file_type?.startsWith('image/') ? <Image src={msg.file_path.startsWith('blob:') ? msg.file_path : `/${msg.file_path}`} style={{ maxWidth: "250px", borderRadius: "8px" }} /> : msg.file_type?.startsWith('audio/') ? (
                                            <audio
                                                controls
                                                preload="metadata"
                                                style={{ width: "220px", height: "40px" }}
                                                onError={(e) => {
                                                    console.error('Audio playback error:', e);
                                                    antMessage.error('Failed to load audio');
                                                }}
                                            >
                                                <source src={msg.file_path.startsWith('blob:') ? msg.file_path : `/${msg.file_path}`} type={msg.file_type} />
                                            </audio>
                                        ) : <a href={msg.file_path.startsWith('blob:') ? msg.file_path : `/${msg.file_path}`} target="_blank" rel="noreferrer" style={{ color: isMe ? "#fff" : "#1890ff", display: "flex", alignItems: "center", gap: "5px" }}><FileOutlined /> {msg.file_path.split('/').pop()}</a>}
                                    </div>
                                )}
                                <div className="d-flex justify-content-between align-items-center mt-1" style={{ gap: "15px" }}>
                                    <small style={{ fontSize: "9px", opacity: 0.6 }}>{msg.isOptimistic ? "Sending..." : dayjs(msg.created_at).format('H:mm')}</small>
                                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                        {!msg.isOptimistic && <Tooltip title="Reply"><span onClick={() => setReplyingTo(msg)} style={{ cursor: "pointer", opacity: 0.6, fontSize: "11px" }}>Reply</span></Tooltip>}
                                        {isMe && !msg.isOptimistic && <Popconfirm title="Delete message?" onConfirm={() => handleDeleteMessage(msg.id)}><DeleteOutlined style={{ fontSize: "11px", cursor: "pointer", opacity: 0.6 }} /></Popconfirm>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {messages.length === 0 && !loadingMessages && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.5, paddingBottom: "100px" }}>
                        <MessageOutlined style={{ fontSize: "60px", marginBottom: "20px", color: "#1890ff" }} />
                        <div style={{ textAlign: "center" }}>
                            <Title level={4} style={{ margin: 0, color: "#8c8c8c" }}>No conversation history yet.</Title>
                            <Text type="secondary">Send a message below to start chatting!</Text>
                        </div>
                    </div>
                )}
            </>
        );
    }, [messages, loadingMessages, currentUser.id, selectedChat?.id]);

    const memoizedSidebar = useMemo(() => (
        <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ padding: '0 16px' }}
            items={[
                {
                    key: 'direct',
                    label: <span><UserOutlined /> Direct {totalDirectUnread > 0 && <Badge count={totalDirectUnread} size="small" style={{ marginLeft: 5, backgroundColor: '#52c41a' }} />}</span>,
                    children: (
                        <List
                            dataSource={directChats}
                            locale={{ emptyText: <Empty description="No direct chats" /> }}
                            renderItem={chat => (
                                <List.Item
                                    onClick={() => setSelectedChat(chat)}
                                    style={{
                                        padding: "15px 20px", cursor: "pointer",
                                        background: selectedChat?.id === chat.id && selectedChat?.type === 'direct' ? "#f0f7ff" : "transparent",
                                        borderLeft: selectedChat?.id === chat.id && selectedChat?.type === 'direct' ? "4px solid #1890ff" : "4px solid transparent"
                                    }}
                                    className="chat-item"
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Badge count={chat.unread_count} offset={[-2, 35]}>
                                                <Badge dot status={chat.is_online ? "success" : "default"} offset={[-6, 32]}>
                                                    <Avatar size={45} src={chat.avatar ? `/${chat.avatar}` : null} icon={<UserOutlined />} style={{ background: '#1890ff' }} />
                                                </Badge>
                                            </Badge>
                                        }
                                        title={<div className="d-flex justify-content-between"><b>{chat.name}</b> <small style={{ opacity: 0.5 }}>{chat.latest_message_time ? dayjs(chat.latest_message_time).fromNow(true) : ""}</small></div>}
                                        description={
                                            <Text type="secondary" ellipsis style={{ maxWidth: "200px" }}>
                                                {chat.latest_message ? chat.latest_message : (chat.last_active_at ? `Last seen ${dayjs(chat.last_active_at).fromNow()}` : "No messages yet")}
                                            </Text>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    )
                },
                {
                    key: 'groups',
                    label: <span><TeamOutlined /> Groups {totalGroupsUnread > 0 && <Badge count={totalGroupsUnread} size="small" style={{ marginLeft: 5, backgroundColor: '#52c41a' }} />}</span>,
                    children: (
                        <List
                            dataSource={groupChats}
                            locale={{ emptyText: <Empty description="No groups found" /> }}
                            renderItem={chat => (
                                <List.Item
                                    onClick={() => setSelectedChat(chat)}
                                    style={{
                                        padding: "15px 20px", cursor: "pointer",
                                        background: selectedChat?.id === chat.id && selectedChat?.type === 'group' ? "#f0f7ff" : "transparent",
                                        borderLeft: selectedChat?.id === chat.id && selectedChat?.type === 'group' ? "4px solid #1890ff" : "4px solid transparent"
                                    }}
                                    className="chat-item"
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Badge count={chat.unread_count}>
                                                <Avatar size={45} icon={<TeamOutlined />} style={{ background: '#52c41a' }} />
                                            </Badge>
                                        }
                                        title={<div className="d-flex justify-content-between"><b>{chat.name}</b> <small style={{ opacity: 0.5 }}>{chat.latest_message_time ? dayjs(chat.latest_message_time).fromNow(true) : ""}</small></div>}
                                        description={<Text type="secondary" ellipsis style={{ maxWidth: "200px" }}>{chat.latest_message || "No messages yet"}</Text>}
                                    />
                                </List.Item>
                            )}
                        />
                    )
                },
                {
                    key: 'projects',
                    label: <span><ProjectOutlined /> Projects {totalProjectsUnread > 0 && <Badge count={totalProjectsUnread} size="small" style={{ marginLeft: 5, backgroundColor: '#52c41a' }} />}</span>,
                    children: (
                        <List
                            dataSource={projectChats}
                            locale={{ emptyText: <Empty description="No projects found" /> }}
                            renderItem={chat => (
                                <List.Item
                                    onClick={() => setSelectedChat(chat)}
                                    style={{
                                        padding: "15px 20px", cursor: "pointer",
                                        background: selectedChat?.id === chat.id && selectedChat?.type === 'project' ? "#f0f7ff" : "transparent",
                                        borderLeft: selectedChat?.id === chat.id && selectedChat?.type === 'project' ? "4px solid #1890ff" : "4px solid transparent"
                                    }}
                                    className="chat-item"
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Badge count={chat.unread_count}>
                                                <Avatar size={45} icon={<ProjectOutlined />} style={{ background: '#1890ff' }} />
                                            </Badge>
                                        }
                                        title={<div className="d-flex justify-content-between"><b>{chat.name}</b></div>}
                                        description={<Text type="secondary" ellipsis style={{ maxWidth: "200px" }}>{chat.description}</Text>}
                                    />
                                </List.Item>
                            )}
                        />
                    )
                }
            ]}
        />
    ), [activeTab, directChats, groupChats, projectChats, totalDirectUnread, totalGroupsUnread, totalProjectsUnread, selectedChat?.id, selectedChat?.type]);

    // Filter users in the modal
    const filteredUsers = availableUsers.filter(user =>
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase())
    );

    const handleCreateGroup = async () => {
        if (selectedUserIds.length === 0) return;

        // If only 1 user and no group name, treat as direct chat
        const isGroup = selectedUserIds.length > 1 || groupName.trim() !== "";

        try {
            setSending(true);
            const res = await axios.post("/api/chats", {
                user_ids: selectedUserIds,
                name: isGroup ? (groupName || "New Group") : null,
                type: isGroup ? 'group' : 'direct'
            });

            const newChat = {
                ...res.data,
                name: res.data.name || availableUsers.find(u => u.id === selectedUserIds[0])?.name,
                is_existing: true,
                user_id: isGroup ? null : selectedUserIds[0],
                unread_count: 0,
                latest_message: null
            };

            setChats(prev => [newChat, ...prev.filter(c => c.id !== newChat.id)]);
            setSelectedChat(newChat);
            setIsNewChatModalOpen(false);
            setSelectedUserIds([]);
            setGroupName("");
            antMessage.success(isGroup ? "Group created" : "Chat started");
        } catch (e) {
            antMessage.error("Failed to create chat");
        } finally {
            setSending(false);
        }
    };

    const handleUpdateGroup = async () => {
        if (!editingGroup || selectedUserIds.length === 0) return;
        try {
            setSending(true);
            const res = await axios.put(`/api/chats/${editingGroup.id}`, {
                name: groupName,
                user_ids: selectedUserIds
            });

            setChats(prev => prev.map(c => c.id === editingGroup.id ? { ...c, ...res.data } : c));
            setSelectedChat(prev => ({ ...prev, ...res.data }));
            setIsEditModalOpen(false);
            setEditingGroup(null);
            setSelectedUserIds([]);
            setGroupName("");
            antMessage.success("Group updated successfully");
        } catch (e) {
            antMessage.error("Failed to update group");
        } finally {
            setSending(false);
        }
    };

    const handleDeleteGroup = async (chatId) => {
        try {
            await axios.delete(`/api/chats/${chatId}`);
            setChats(prev => prev.filter(c => c.id !== chatId));
            if (selectedChat?.id === chatId) setSelectedChat(null);
            antMessage.success("Group deleted successfully");
        } catch (e) {
            antMessage.error("Failed to delete group");
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    return (
        <>
            <Head title="Chat" />
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
            `}</style>
            <Layout style={{ height: "calc(100vh - 64px)", background: "#fff", overflow: "hidden" }}>
                <Sider width={350} theme="light" style={{ borderRight: "1px solid #f0f0f0", height: "100%" }}>
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {/* Header Section with Search */}
                        <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                                <Title level={4} style={{ margin: 0 }}>Messages</Title>
                                {can("Add Chat Group") && (
                                    <Button
                                        type="primary"
                                        shape="circle"
                                        icon={<PlusOutlined />}
                                        onClick={() => setIsNewChatModalOpen(true)}
                                        style={{ marginLeft: "auto" }}
                                    />
                                )}

                            </div>
                            <Input
                                placeholder="Search conversations..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                allowClear
                                style={{ borderRadius: '20px' }}
                            />
                        </div>

                        {/* Tabs aligned to the left (start) with filter above user list - removed centered prop */}
                        <div style={{ flex: 1, overflowY: "auto", height: "100%" }} className="custom-scroll">
                            {memoizedSidebar}
                        </div>
                    </div>
                </Sider>

                <Content style={{ display: "flex", flexDirection: "column" }}>
                    {selectedChat ? (
                        <>
                            <div style={{ padding: "15px 25px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                                <div className="d-flex align-items-center gap-3" style={{ minHeight: "40px" }}>
                                    {selectedChat.type === 'project' ? (
                                        // Keep the header empty for project chats
                                        <div style={{ height: "40px" }} />
                                    ) : (
                                        <>
                                            {selectedChat.type === 'group' ? (
                                                <Avatar.Group maxCount={4} size={40} maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}>
                                                    {selectedChat.participants?.map(p => (
                                                        <Tooltip title={p.user?.name} key={p.id}>
                                                            <Avatar
                                                                src={p.user?.media?.[0]?.file_path ? `/${p.user.media[0].file_path}` : null}
                                                                icon={<UserOutlined />}
                                                            />
                                                        </Tooltip>
                                                    ))}
                                                </Avatar.Group>
                                            ) : (
                                                <Avatar size={40} src={selectedChat.avatar ? `/${selectedChat.avatar}` : null} icon={<UserOutlined />} style={{ background: '#1890ff' }} />
                                            )}
                                            <div>
                                                <Title level={5} style={{ margin: 0 }}>{selectedChat.name}</Title>
                                                <Text type="secondary" style={{ fontSize: "11px" }}>
                                                    {selectedChat.type === 'group' ? (
                                                        `${selectedChat.participants?.length || 0} Members`
                                                    ) : (
                                                        selectedChat.is_online ? (
                                                            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>● Online</span>
                                                        ) : (
                                                            selectedChat.last_active_at ? `Last seen ${dayjs(selectedChat.last_active_at).fromNow()}` : 'Direct Message'
                                                        )
                                                    )}
                                                </Text>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="d-flex gap-3">
                                    {selectedChat.type === 'group' && (
                                        <>
                                            {can("Edit Chat Group") && (
                                                <Tooltip title="Edit Group">
                                                    <Button
                                                        shape="circle"
                                                        icon={<EditOutlined style={{ fontSize: '18px' }} />}
                                                        onClick={() => { setEditingGroup(selectedChat); setIsEditModalOpen(true); }}
                                                        style={{
                                                            width: '42px',
                                                            height: '42px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            background: '#fff7e6',
                                                            border: '1px solid #ffe7ba',
                                                            color: '#fa8c16'
                                                        }}
                                                        className="premium-call-btn"
                                                    />
                                                </Tooltip>
                                            )}
                                            {can("Delete Chat Group") && (
                                                <Tooltip title="Delete Group">
                                                    <Popconfirm title="Are you sure you want to delete this group?" onConfirm={() => handleDeleteGroup(selectedChat.id)}>
                                                        <Button
                                                            shape="circle"
                                                            icon={<DeleteOutlined style={{ fontSize: '18px' }} />}
                                                            style={{
                                                                width: '42px',
                                                                height: '42px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                background: '#fff1f0',
                                                                border: '1px solid #ffa39e',
                                                                color: '#f5222d'
                                                            }}
                                                            className="premium-call-btn"
                                                        />
                                                    </Popconfirm>
                                                </Tooltip>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div ref={scrollRef} className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#f4f7f6", display: "flex", flexDirection: "column", gap: "12px" }}>
                                {memoizedMessageList}
                            </div>

                            <div style={{ padding: "20px", borderTop: "1px solid #f0f0f0", background: "#fff" }}>
                                {replyingTo && (
                                    <div style={{ background: "#f0f2f5", padding: "10px 15px", borderRadius: "12px 12px 0 0", borderLeft: "4px solid #1890ff", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "-1px" }}>
                                        <div style={{ overflow: "hidden" }}>
                                            <div style={{ fontWeight: "bold", fontSize: "12px", color: "#1890ff" }}>Replying to {replyingTo.sender?.name}</div>
                                            <div style={{ fontSize: "12px", opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{replyingTo.message || "File/Media"}</div>
                                        </div>
                                        <Button type="text" size="small" icon={<BiX />} onClick={() => setReplyingTo(null)} />
                                    </div>
                                )}
                                {selectedFile && <Tag closable onClose={() => setSelectedFile(null)} color="blue" icon={<PaperClipOutlined />} style={{ marginBottom: "10px" }}>{selectedFile.name}</Tag>}
                                <div className="d-flex gap-2 align-items-end">
                                    {!isRecording && <Upload beforeUpload={f => { setSelectedFile(f); return false; }} showUploadList={false}><Button size="large" shape="circle" icon={<PlusOutlined />} /></Upload>}

                                    {isRecording ? (
                                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "15px", background: "#fef2f2", borderRadius: "20px", padding: "8px 20px", border: "1px solid #fee2e2" }}>
                                            <div className="pulse-dot" style={{ width: "10px", height: "10px", background: "#ff4d4f", borderRadius: "50%" }} />
                                            <span style={{ fontWeight: "bold", minWidth: "45px", color: "#434343", fontSize: "14px" }}>{formatTime(recordingTime)}</span>
                                            <span style={{ color: "#ff4d4f", flex: 1, fontSize: "14px" }}>Recording Audio...</span>
                                            <Button type="text" danger icon={<DeleteOutlined />} onClick={cancelRecording} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cancel</Button>
                                        </div>
                                    ) : (
                                        <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} placeholder={`Message ${selectedChat.name}...`} value={newMessage} onChange={e => setNewMessage(e.target.value)} onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} style={{ borderRadius: "20px", border: "none", background: "#f0f2f5", padding: "10px 20px" }} />
                                    )}

                                    {isRecording ? (
                                        <Button type="primary" shape="circle" size="large" icon={<SendOutlined />} onClick={stopRecording} style={{ background: '#52c41a', border: 'none' }} />
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
                                <Avatar size={100} icon={<MessageOutlined />} style={{ background: "#e6f7ff", color: "#1890ff", marginBottom: "20px" }} />
                                <Title level={3} style={{ color: "#434343" }}>Select a Contact</Title>
                                <Text type="secondary">Choose someone from the list to start a secure conversation.</Text>
                            </div>
                        </div>
                    )}
                </Content>
            </Layout>

            {/* New Chat Modal - Added search bar above users */}
            <Modal
                title="Create New Conversation"
                open={isNewChatModalOpen}
                onCancel={() => { setIsNewChatModalOpen(false); setSelectedUserIds([]); setGroupName(""); setUserSearchTerm(""); }}
                onOk={handleCreateGroup}
                okText={selectedUserIds.length > 1 ? "Create Group" : "Start Chat"}
                okButtonProps={{ disabled: selectedUserIds.length === 0, loading: sending }}
                centered
                width={500}
            >
                <div style={{ marginBottom: "20px" }}>
                    <Text strong style={{ display: "block", marginBottom: "8px" }}>Group Name (Optional)</Text>
                    <Input
                        placeholder="Enter group name if creating a group..."
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        prefix={<TeamOutlined style={{ color: '#bfbfbf' }} />}
                        style={{ borderRadius: '8px' }}
                    />
                </div>

                {/* Search bar placed above the user list */}
                <div style={{ marginBottom: "15px" }}>
                    <Text strong style={{ display: "block", marginBottom: "8px" }}>Select Team Members ({selectedUserIds.length} selected)</Text>
                    <Input
                        placeholder="Search team members..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={userSearchTerm}
                        onChange={e => setUserSearchTerm(e.target.value)}
                        style={{ borderRadius: '8px' }}
                    />
                </div>

                <div style={{ maxHeight: "350px", overflowY: "auto", border: '1px solid #f0f0f0', borderRadius: '8px', padding: '10px' }} className="custom-scroll">
                    <List
                        loading={loadingUsers}
                        dataSource={filteredUsers}
                        renderItem={user => {
                            const isSelected = selectedUserIds.includes(user.id);
                            return (
                                <List.Item
                                    onClick={() => toggleUserSelection(user.id)}
                                    style={{
                                        cursor: "pointer",
                                        padding: "12px",
                                        borderRadius: "10px",
                                        background: isSelected ? '#f0f7ff' : 'transparent',
                                        transition: 'all 0.2s'
                                    }}
                                    className="user-row"
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar src={user.media?.[0]?.file_path ? `/${user.media[0].file_path}` : null} icon={<UserOutlined />} />}
                                        title={<b>{user.name}</b>}
                                        description={user.role?.name || "Team Member"}
                                    />
                                    <Badge status={isSelected ? "processing" : "default"} />
                                </List.Item>
                            );
                        }}
                    />
                </div>
            </Modal>

            {/* Edit Group Modal - Also has search bar above users */}
            <Modal
                title="Edit Group Settings"
                open={isEditModalOpen}
                onCancel={() => { setIsEditModalOpen(false); setEditingGroup(null); setSelectedUserIds([]); setGroupName(""); setUserSearchTerm(""); }}
                onOk={handleUpdateGroup}
                okText="Save Changes"
                okButtonProps={{ loading: sending }}
                centered
                width={500}
            >
                <div style={{ marginBottom: "20px" }}>
                    <Text strong style={{ display: "block", marginBottom: "8px" }}>Group Name</Text>
                    <Input
                        placeholder="Enter group name..."
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        prefix={<TeamOutlined style={{ color: '#bfbfbf' }} />}
                        style={{ borderRadius: '8px' }}
                    />
                </div>

                {/* Search bar placed above the user list */}
                <div style={{ marginBottom: "15px" }}>
                    <Text strong style={{ display: "block", marginBottom: "8px" }}>Group Members ({selectedUserIds.length})</Text>
                    <Input
                        placeholder="Search team members..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={userSearchTerm}
                        onChange={e => setUserSearchTerm(e.target.value)}
                        style={{ borderRadius: '8px' }}
                    />
                </div>

                <div style={{ maxHeight: "350px", overflowY: "auto", border: '1px solid #f0f0f0', borderRadius: '8px', padding: '10px' }} className="custom-scroll">
                    <List
                        loading={loadingUsers}
                        dataSource={filteredUsers}
                        renderItem={user => {
                            const isSelected = selectedUserIds.includes(user.id);
                            return (
                                <List.Item
                                    onClick={() => toggleUserSelection(user.id)}
                                    style={{
                                        cursor: "pointer",
                                        padding: "12px",
                                        borderRadius: "10px",
                                        background: isSelected ? '#f0f7ff' : 'transparent',
                                        transition: 'all 0.2s'
                                    }}
                                    className="user-row"
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar src={user.media?.[0]?.file_path ? `/${user.media[0].file_path}` : null} icon={<UserOutlined />} />}
                                        title={<b>{user.name}</b>}
                                        description={user.role?.name || "Team Member"}
                                    />
                                    <Badge status={isSelected ? "processing" : "default"} />
                                </List.Item>
                            );
                        }}
                    />
                </div>
            </Modal>

            <style>{`
                .chat-item:hover, .user-row:hover { background: #f0f7ff !important; }
                .custom-scroll::-webkit-scrollbar { width: 5px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .pulse-animation {
                    animation: pulse-red 1.5s infinite;
                }
                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(255, 77, 79, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0); }
                }
                .pulse-dot {
                    animation: dot-pulse 1.2s infinite;
                }
                @keyframes dot-pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .premium-call-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                    transition: all 0.3s ease;
                }
                /* Prevent Scrollbar Shifting during Modals/Popovers */
                html, body {
                    scrollbar-gutter: stable;
                    overflow-x: hidden !important;
                    width: 100% !important;
                }
                body {
                    padding-right: 0 !important; /* Force kill Ant Design padding compensation */
                }
                body.ant-scrolling-effect {
                    width: 100% !important;
                    overflow: hidden !important;
                    position: relative;
                }
                .ant-modal-open {
                    overflow: hidden !important;
                    width: 100% !important;
                }
                .ant-popover {
                    z-index: 10000 !important;
                }
            `}</style>
        </>
    );
};

Chat.layout = (page) => <MainLayout children={page} />;

export default Chat;