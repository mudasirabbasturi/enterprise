import { 
    Input, 
    List, 
    Avatar, 
    Typography, 
    Badge, 
    Spin, 
    message,
    Empty,
    Button,
    Upload,
    Image,
    Popconfirm,
    Tooltip,
    Modal,
    Checkbox,
    Select
} from 'antd';
import { 
    SearchOutlined, 
    UserOutlined, 
    SendOutlined, 
    PaperClipOutlined, 
    DeleteOutlined, 
    CloseOutlined, 
    PlusOutlined, 
    TeamOutlined, 
    AudioOutlined, 
    CheckOutlined,
    EditOutlined,
    RollbackOutlined
} from '@ant-design/icons';

import axios from 'axios';
import { usePage } from '@inertiajs/react';
import React, { useState, useEffect, useRef, memo } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

// Fast Input Component for Global Chat with Audio Recording
const GlobalChatInput = memo(({ onSendMessage, replyingTo, setReplyingTo, selectedFile, setSelectedFile, sending }) => {
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const handleSend = () => {
        if (!inputValue.trim() && !selectedFile) return;
        onSendMessage(inputValue, () => setInputValue(''));
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            const ext = mimeType.split('/')[1];
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const audioFile = new File([audioBlob], `voice-msg-${Date.now()}.${ext}`, { type: mimeType });
                setSelectedFile(audioFile);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start(1000); // 1-second timeslices
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) { message.error("Microphone access denied"); }
    };

    const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); clearInterval(timerRef.current); } };
    const cancelRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); clearInterval(timerRef.current); setTimeout(() => setSelectedFile(null), 100); } };
    const formatTime = (seconds) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}:${secs.toString().padStart(2, '0')}`; };

    return (
        <div style={{ padding: '20px 30px', borderTop: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
            {replyingTo && (
                <div style={{ padding: '10px 15px', backgroundColor: '#f8f9fa', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text size="small" italic>Replying to {replyingTo.sender?.name}</Text>
                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setReplyingTo(null)} />
                </div>
            )}
            {selectedFile && (
                <div style={{ padding: '10px 15px', backgroundColor: '#e6f7ff', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text size="small" strong>{selectedFile.type.startsWith('audio/') ? <AudioOutlined /> : <PaperClipOutlined />} {selectedFile.name}</Text>
                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setSelectedFile(null)} />
                </div>
            )}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {!isRecording ? (
                    <>
                        <Upload beforeUpload={file => { setSelectedFile(file); return false; }} showUploadList={false}><Button shape="circle" icon={<PaperClipOutlined />} size="large" /></Upload>
                        <Input.TextArea autoSize={{ minRows: 1, maxRows: 5 }} placeholder="Write a message..." value={inputValue} onChange={e => setInputValue(e.target.value)} onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }} style={{ borderRadius: '24px', padding: '10px 20px', fontSize: '14px', backgroundColor: '#f0f2f5', border: 'none', flex: 1 }} />
                        <Button shape="circle" icon={<AudioOutlined />} size="large" onClick={startRecording} style={{ color: '#ff4d4f' }} />
                        <Button type="primary" shape="circle" icon={<SendOutlined />} size="large" onClick={handleSend} loading={sending} disabled={(!inputValue.trim() && !selectedFile) || sending} />
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#fff1f0', padding: '10px 20px', borderRadius: '24px' }}>
                        <Badge status="processing" color="red" text={<Text strong style={{ color: '#ff4d4f' }}>REC {formatTime(recordingTime)}</Text>} />
                        <div style={{ flex: 1 }} />
                        <Button type="text" danger icon={<CloseOutlined />} onClick={cancelRecording}>Cancel</Button>
                        <Button type="primary" danger shape="round" icon={<CheckOutlined />} onClick={stopRecording}>Stop & Attach</Button>
                    </div>
                )}
            </div>
        </div>
    );
});

const GlobalChat = ({ users: initialUsers, groups: initialGroups }) => {
    const { props } = usePage();
    const auth = props?.auth ?? {};
    const currentUser = auth?.user ?? {};
    const userPermissions = auth?.user?.role?.permissions ?? [];
    
    const hasCreateGroupPermission = Array.isArray(userPermissions) && userPermissions.some((perm) => perm.name === "Create Chat Group");
    const hasUpdateGroupPermission = Array.isArray(userPermissions) && userPermissions.some((perm) => perm.name === "Update Chat Group");
    const hasDeleteGroupPermission = Array.isArray(userPermissions) && userPermissions.some((perm) => perm.name === "Delete Chat Group");
    
    // Get view from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view') || 'direct'; // Default to direct if not specified

    const [users, setUsers] = useState(initialUsers);
    const [groups, setGroups] = useState(initialGroups);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    
    const scrollRef = useRef(null);
    const chatSound = useRef(new Audio('/uploads/media/sound_effect/chat/chat_message_notification.mp3'));

    // Move chat to top of list
    const moveItemToTop = (id, type) => {
        if (type === 'user') {
            setUsers(prev => {
                const idx = prev.findIndex(u => u.id == id);
                if (idx > 0) {
                    const newArr = [...prev];
                    const [item] = newArr.splice(idx, 1);
                    return [item, ...newArr];
                }
                return prev;
            });
        } else if (type === 'group') {
            setGroups(prev => {
                const idx = prev.findIndex(g => g.id == id);
                if (idx > 0) {
                    const newArr = [...prev];
                    const [item] = newArr.splice(idx, 1);
                    return [item, ...newArr];
                }
                return prev;
            });
        }
    };

    // Initialize selected chat from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('id');
        const urlView = params.get('view');

        if (urlId) {
            if (urlView === 'groups') {
                const group = initialGroups.find(g => g.id == urlId);
                if (group) setSelectedChat({ type: 'group', data: group });
            } else {
                const user = initialUsers.find(u => u.id == urlId);
                if (user) setSelectedChat({ type: 'user', data: user });
            }
        }
    }, []);

    // Set active chat globally for Layout.jsx to know when to mute sounds
    useEffect(() => {
        window.activeGlobalChat = selectedChat ? { type: selectedChat.type, id: selectedChat.data.id } : null;
        return () => { window.activeGlobalChat = null; };
    }, [selectedChat]);

    // 1. Listen for global notifications (from Layout)
    useEffect(() => {
        const handleNotification = (event) => {
            const response = event.detail;
            if (!response || !response.data) return;
            
            const payload = response.data;
            if (payload.event === 'message.sent') {
                const incomingMsg = payload.data.message;
                const senderType = incomingMsg.group_id ? 'group' : 'user';
                const targetId = incomingMsg.group_id ? incomingMsg.group_id : (incomingMsg.sender_id == currentUser.id ? incomingMsg.receiver_id : incomingMsg.sender_id);
                
                moveItemToTop(targetId, senderType);
                
                // If not viewing this chat, update unread count
                if (!selectedChat || selectedChat.type !== senderType || selectedChat.data.id != targetId) {
                    if (senderType === 'user') {
                        setUsers(prev => prev.map(u => u.id == targetId ? { ...u, unread_count: (u.unread_count || 0) + 1 } : u));
                    } else if (senderType === 'group') {
                        setGroups(prev => prev.map(g => g.id == targetId ? { ...g, unread_count: (g.unread_count || 0) + 1 } : g));
                    }
                }
            } else if (payload.event === 'message.deleted') {
                const deletedId = payload.data.id;
                setMessages(prev => prev.filter(m => m.id !== deletedId));
            }
        };
        window.addEventListener('global-chat-notification', handleNotification);
        return () => window.removeEventListener('global-chat-notification', handleNotification);
    }, [selectedChat, currentUser.id]);

    // 2. WebSocket for Active Chat
    useEffect(() => {
        if (!selectedChat) return;
        let ws = null;
        const channelName = selectedChat.type === 'group' 
            ? `global-chat.group.${selectedChat.data.id}` 
            : `global-chat.user.${currentUser.id}`;

        const connect = () => {
            ws = new WebSocket('wss://demo.bidwinners.net');
            ws.onopen = () => ws.send(JSON.stringify({ action: 'subscribe', channel: channelName }));
            ws.onmessage = (event) => {
                const response = JSON.parse(event.data);
                if (response.channel === channelName && response.data) {
                    const payload = response.data;
                    if (payload.event === 'message.sent') {
                        const incomingMsg = payload.data.message;
                        
                        // Move to top
                        const senderType = incomingMsg.group_id ? 'group' : 'user';
                        const targetId = incomingMsg.group_id ? incomingMsg.group_id : (incomingMsg.sender_id == currentUser.id ? incomingMsg.receiver_id : incomingMsg.sender_id);
                        moveItemToTop(targetId, senderType);

                        // STRICT CHECK
                        let isMatch = false;
                        if (selectedChat.type === 'group') {
                            isMatch = incomingMsg.group_id == selectedChat.data.id;
                        } else {
                            isMatch = !incomingMsg.group_id && 
                                     (incomingMsg.sender_id == selectedChat.data.id || 
                                      incomingMsg.sender_id == currentUser.id);
                        }

                        if (isMatch) {
                            if (incomingMsg.sender_id === currentUser.id) return; // Prevent duplicates from optimistic UI
                            setMessages(prev => (prev.some(m => m.id === incomingMsg.id) ? prev : [...prev, incomingMsg]));
                        }
                    }
                    if (payload.event === 'message.deleted') {
                        const deletedId = payload.data.id;
                        setMessages(prev => prev.filter(m => m.id !== deletedId));
                    }
                }
            };
            ws.onclose = () => setTimeout(connect, 3000);
        };
        connect();
        return () => { if (ws) ws.close(); };
    }, [selectedChat?.data?.id, selectedChat?.type]);

    useEffect(() => {
        if (selectedChat) {
            // Update URL dynamically
            const url = new URL(window.location);
            url.searchParams.set('view', selectedChat.type === 'group' ? 'groups' : 'direct');
            url.searchParams.set('id', selectedChat.data.id);
            window.history.pushState({}, '', url);

            fetchChatHistory();
        }
    }, [selectedChat?.type, selectedChat?.data?.id]);

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

    const fetchChatHistory = async () => {
        if (!selectedChat) return;
        setLoadingHistory(true);
        try {
            const params = selectedChat.type === 'user' ? { user_id: selectedChat.data.id } : { group_id: selectedChat.data.id };
            const response = await axios.get('/api/global-chat/messages', { params });
            setMessages(response.data);
            
            // Update counts locally
            if (selectedChat.type === 'user') setUsers(prev => prev.map(u => u.id === selectedChat.data.id ? { ...u, unread_count: 0 } : u));
            else setGroups(prev => prev.map(g => g.id === selectedChat.data.id ? { ...g, unread_count: 0 } : g));
            
            window.dispatchEvent(new CustomEvent('refresh-unread-counts'));
        } catch (err) {} finally { setLoadingHistory(false); }
    };

    // Scroll to a message by ID and flash-highlight it
    const scrollToMessage = (msgId) => {
        const el = document.getElementById(`msg-${msgId}`);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('msg-highlight');
        setTimeout(() => el.classList.remove('msg-highlight'), 1800);
    };

    const handleSendMessage = async (text, clearInput) => {
        if (!selectedChat || (!text.trim() && !selectedFile)) return;
        
        // Optimistic UI Update: Show message instantly
        const tempId = 'temp-' + Date.now();
        const tempMsg = {
            id: tempId,
            sender_id: currentUser.id,
            receiver_id: selectedChat.type === 'user' ? selectedChat.data.id : null,
            group_id: selectedChat.type === 'group' ? selectedChat.data.id : null,
            message: text.trim() || null,
            file_path: selectedFile ? URL.createObjectURL(selectedFile) : null,
            created_at: new Date().toISOString(),
            sender: currentUser,
            isPending: true // Optional flag if we want to style pending messages later
        };
        
        setMessages(prev => [...prev, tempMsg]);
        moveItemToTop(selectedChat.data.id, selectedChat.type);
        clearInput();
        setReplyingTo(null);
        
        const fileToUpload = selectedFile;
        setSelectedFile(null); // Clear selected file instantly too

        try {
            setSending(true);
            const formData = new FormData();
            if (text.trim()) formData.append('message', text);
            if (replyingTo) formData.append('reply_to_id', replyingTo.id);
            if (fileToUpload) formData.append('file', fileToUpload);
            
            if (selectedChat.type === 'user') formData.append('receiver_id', selectedChat.data.id);
            else formData.append('group_id', selectedChat.data.id);
            
            const response = await axios.post('/api/global-chat/send', formData, { 
                headers: { 'Content-Type': 'multipart/form-data' } 
            });
            
            // Replace the temporary message with the real one from the server
            setMessages(prev => {
                // If websocket already added the real message, just remove the temp one.
                if (prev.some(m => m.id === response.data.id)) {
                    return prev.filter(m => m.id !== tempId);
                }
                return prev.map(m => m.id === tempId ? response.data : m);
            });
        } catch (err) { 
            message.error("Failed to send message"); 
            // Remove the temporary message if it failed
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally { 
            setSending(false); 
        }
    };

    const handleDeleteMessage = async (msgId) => {
        try {
            await axios.delete(`/api/global-chat/messages/${msgId}`);
            setMessages(prev => prev.filter(m => m.id !== msgId));
            message.success("Deleted");
        } catch (err) {}
    };

    const handleCreateOrUpdateGroup = async () => {
        if (!groupName.trim() || selectedUserIds.length === 0) return;
        try {
            setCreatingGroup(true);
            const url = editingGroup ? `/api/global-chat/groups/${editingGroup.id}` : '/api/global-chat/groups';
            const method = editingGroup ? 'put' : 'post';
            
            const response = await axios[method](url, { name: groupName, user_ids: selectedUserIds });
            
            if (editingGroup) {
                setGroups(prev => prev.map(g => g.id === editingGroup.id ? response.data : g));
                message.success("Group updated");
            } else {
                setGroups(prev => [response.data, ...prev]);
                message.success("Group created");
            }
            
            setIsGroupModalOpen(false);
            setGroupName(''); setSelectedUserIds([]); setEditingGroup(null);
        } catch (err) { message.error("Failed to save group"); } finally { setCreatingGroup(false); }
    };

    const handleDeleteGroup = async (groupId) => {
        try {
            await axios.delete(`/api/global-chat/groups/${groupId}`);
            setGroups(prev => prev.filter(g => g.id !== groupId));
            if (selectedChat?.type === 'group' && selectedChat.data.id === groupId) setSelectedChat(null);
            message.success("Group deleted");
        } catch (err) { message.error("Failed to delete group"); }
    };

    const openEditGroup = (e, group) => {
        e.stopPropagation();
        setEditingGroup(group);
        setGroupName(group.name);
        setSelectedUserIds(group.members.map(m => m.id));
        setIsGroupModalOpen(true);
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const ChatItem = ({ item, type }) => (
        <List.Item 
            onClick={() => setSelectedChat({ type, data: item })} 
            className={`chat-item group-hover-container ${selectedChat?.data?.id === item.id && selectedChat?.type === type ? 'active' : ''}`}
            style={{ 
                padding: '12px 20px', 
                cursor: 'pointer', 
                transition: 'all 0.3s',
                borderRadius: '12px',
                margin: '4px 8px',
                border: 'none',
                backgroundColor: selectedChat?.data?.id === item.id && selectedChat?.type === type ? '#e6f7ff' : 'transparent',
                position: 'relative'
            }}
        >
            <List.Item.Meta 
                avatar={
                    <Badge count={item.unread_count} overflowCount={99}>
                        <Avatar 
                            src={item.media?.[0]?.file_path ? `/${item.media[0].file_path}` : null} 
                            icon={type === 'user' ? <UserOutlined /> : <TeamOutlined />} 
                            style={{ backgroundColor: type === 'user' ? '#1890ff' : '#722ed1' }}
                        />
                    </Badge>
                } 
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ color: selectedChat?.data?.id === item.id && selectedChat?.type === type ? '#1890ff' : 'inherit' }}>{item.name}</Text>
                        {type === 'group' && (
                            <div className="hover-actions" style={{ display: 'flex', gap: '8px' }}>
                                {(hasUpdateGroupPermission || item.created_by === currentUser.id) && (
                                    <Tooltip title="Edit Group">
                                        <EditOutlined onClick={(e) => openEditGroup(e, item)} style={{ color: '#1890ff', fontSize: '14px' }} />
                                    </Tooltip>
                                )}
                                {(hasDeleteGroupPermission || item.created_by === currentUser.id) && (
                                    <Popconfirm title="Delete Group?" onConfirm={(e) => { e.stopPropagation(); handleDeleteGroup(item.id); }}>
                                        <DeleteOutlined onClick={e => e.stopPropagation()} style={{ color: '#ff4d4f', fontSize: '14px' }} />
                                    </Popconfirm>
                                )}
                            </div>
                        )}
                    </div>
                } 
                description={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Text type="secondary" ellipsis style={{ fontSize: '12px' }}>
                            {item.designation || (type === 'user' ? 'Team Member' : `${item.members?.length || 0} members`)}
                        </Text>
                        {type === 'group' && (
                            <Avatar.Group maxCount={3} size="small" maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}>
                                {item.members?.map(m => (
                                    <Avatar 
                                        key={m.id} 
                                        src={m.media?.[0]?.file_path ? `/${m.media[0].file_path}` : null} 
                                        icon={<UserOutlined />} 
                                    />
                                ))}
                            </Avatar.Group>
                        )}
                    </div>
                } 
            />
        </List.Item>
    );

    return (
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', backgroundColor: '#f0f2f5', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{ width: '350px', borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
                <div style={{ padding: '24px 20px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                            {view === 'groups' ? 'Groups' : 'Direct Messages'}
                        </Title>
                        {view === 'groups' && hasCreateGroupPermission && (
                            <Tooltip title="Create New Group">
                                <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={() => { setEditingGroup(null); setGroupName(''); setSelectedUserIds([]); setIsGroupModalOpen(true); }} />
                            </Tooltip>
                        )}
                    </div>
                    <Input 
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
                        placeholder={view === 'groups' ? "Search groups..." : "Search people..."} 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        allowClear 
                        style={{ borderRadius: '10px', backgroundColor: '#f5f5f5', border: 'none', padding: '8px 12px' }}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                    {view === 'groups' ? (
                        <>
                            {filteredGroups.length > 0 ? (
                                <List dataSource={filteredGroups} renderItem={g => <ChatItem item={g} type="group" />} />
                            ) : (
                                <Empty 
                                    style={{ marginTop: '50px' }} 
                                    description={searchTerm ? "No groups match your search" : "No groups found"} 
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            {filteredUsers.length > 0 ? (
                                <List dataSource={filteredUsers} renderItem={u => <ChatItem item={u} type="user" />} />
                            ) : (
                                <Empty 
                                    style={{ marginTop: '50px' }} 
                                    description={searchTerm ? "No people match your search" : "No conversations found"} 
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
                {selectedChat ? (
                    <>
                        <div style={{ padding: '15px 30px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', zIndex: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Avatar size={45} src={selectedChat.data.media?.[0]?.file_path ? `/${selectedChat.data.media[0].file_path}` : null} icon={selectedChat.type === 'user' ? <UserOutlined /> : <TeamOutlined />} style={{ backgroundColor: selectedChat.type === 'user' ? '#1890ff' : '#722ed1', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                                <div>
                                    <Title level={5} style={{ margin: 0, fontWeight: 600 }}>{selectedChat.data.name}</Title>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {selectedChat.type === 'user' ? 'Active now' : `${selectedChat.data.members?.length || 0} members`}
                                        </Text>
                                        {selectedChat.type === 'group' && (
                                            <Avatar.Group size="small" maxCount={5}>
                                                {selectedChat.data.members?.map(m => (
                                                    <Tooltip key={m.id} title={m.name}>
                                                        <Avatar src={m.media?.[0]?.file_path ? `/${m.media[0].file_path}` : null} icon={<UserOutlined />} />
                                                    </Tooltip>
                                                ))}
                                            </Avatar.Group>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '30px', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {loadingHistory ? (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}><Spin size="large" /></div>
                            ) : messages.length === 0 ? (
                                <Empty description="No messages yet. Say hello!" style={{ marginTop: '100px' }} />
                            ) : (
                                messages.map((item) => {
                                    const isMe = item.sender_id === currentUser.id;
                                    const senderAvatar = item.sender?.media?.[0]?.file_path ? `/${item.sender.media[0].file_path}` : null;
                                    
                                    return (
                                        <div
                                            key={item.id}
                                            id={`msg-${item.id}`}
                                            style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '12px' }}
                                            className="chat-message-row"
                                        >
                                            {!isMe && <Avatar src={senderAvatar} size="small" icon={<UserOutlined />} />}
                                            <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                                {!isMe && selectedChat.type === 'group' && <Text type="secondary" style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '4px' }}>{item.sender?.name}</Text>}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                                    {/* Reply button on hover */}
                                                    <Tooltip title="Reply">
                                                        <button
                                                            className="reply-btn"
                                                            onClick={() => setReplyingTo(item)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8c8c8c', fontSize: '14px', padding: '4px', borderRadius: '50%', opacity: 0, transition: 'opacity 0.2s' }}
                                                        >
                                                            <RollbackOutlined />
                                                        </button>
                                                    </Tooltip>
                                                    <div style={{ 
                                                        backgroundColor: isMe ? '#1890ff' : '#fff', 
                                                        color: isMe ? '#fff' : '#262626', 
                                                        padding: '12px 18px', 
                                                        borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                                        fontSize: '14px',
                                                        lineHeight: '1.5'
                                                    }}>
                                                        {/* Reply preview block — click to jump to original */}
                                                        {item.reply_to && (
                                                            <div
                                                                onClick={() => scrollToMessage(item.reply_to.id)}
                                                                style={{
                                                                    borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,0.5)' : '#1890ff'}`,
                                                                    paddingLeft: '10px',
                                                                    marginBottom: '8px',
                                                                    opacity: 0.8,
                                                                    fontSize: '12px',
                                                                    cursor: 'pointer',
                                                                    backgroundColor: isMe ? 'rgba(0,0,0,0.1)' : '#f0f2f5',
                                                                    borderRadius: '6px',
                                                                    padding: '6px 10px',
                                                                    transition: 'opacity 0.2s'
                                                                }}
                                                            >
                                                                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{item.reply_to?.sender?.name}</div>
                                                                <div style={{ opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                                                                    {item.reply_to?.message || '📎 Attachment'}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {item.message && <div>{item.message}</div>}
                                                        {item.file_path && (
                                                            <div style={{ marginTop: '8px' }}>
                                                                {item.file_path.match(/\.(webm|mp4|wav|mp3|ogg)$/i) ? (
                                                                    <audio controls src={item.file_path.startsWith('chat_files') ? `/storage/${item.file_path}` : `/${item.file_path}`} style={{ height: '35px', maxWidth: '240px' }} preload="metadata" />
                                                                ) : item.file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                                    <Image src={item.file_path.startsWith('chat_files') ? `/storage/${item.file_path}` : `/${item.file_path}`} style={{ maxWidth: '280px', borderRadius: '12px' }} />
                                                                ) : (
                                                                    <a 
                                                                        href={item.file_path.startsWith('chat_files') ? `/storage/${item.file_path}` : `/${item.file_path}`} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        style={{ 
                                                                            display: 'flex', 
                                                                            alignItems: 'center', 
                                                                            gap: '10px', 
                                                                            padding: '10px 15px', 
                                                                            backgroundColor: isMe ? 'rgba(0,0,0,0.1)' : '#f0f2f5', 
                                                                            borderRadius: '10px',
                                                                            color: isMe ? '#fff' : '#1890ff',
                                                                            textDecoration: 'none'
                                                                        }}
                                                                    >
                                                                        <PaperClipOutlined />
                                                                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                                                            <Text strong style={{ fontSize: '12px', color: 'inherit' }} ellipsis>
                                                                                {item.file_path.split('/').pop()}
                                                                            </Text>
                                                                            <Text style={{ fontSize: '10px', color: 'inherit', opacity: 0.7 }}>
                                                                                Click to view / download
                                                                            </Text>
                                                                        </div>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', gap: '8px' }}>
                                                            <Text style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.7)' : '#bfbfbf' }}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                                            {isMe && <Popconfirm title="Delete message?" onConfirm={() => handleDeleteMessage(item.id)}><DeleteOutlined style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }} /></Popconfirm>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Input Area */}
                        <GlobalChatInput onSendMessage={handleSendMessage} replyingTo={replyingTo} setReplyingTo={setReplyingTo} selectedFile={selectedFile} setSelectedFile={setSelectedFile} sending={sending} />
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
                        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <div style={{ fontSize: '60px', marginBottom: '20px' }}>💬</div>
                            <Title level={3} style={{ marginBottom: '8px' }}>Select a {view === 'groups' ? 'Group' : 'Conversation'}</Title>
                            <Text type="secondary">Choose from the list on the left to start chatting.</Text>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Group Modal */}
            <Modal 
                title={<Title level={4} style={{ margin: 0 }}>{editingGroup ? 'Edit Group' : 'Create New Group'}</Title>} 
                open={isGroupModalOpen} 
                onOk={handleCreateOrUpdateGroup} 
                onCancel={() => setIsGroupModalOpen(false)}
                okText={editingGroup ? "Update Group" : "Create Group"}
                confirmLoading={creatingGroup}
                width={480}
                style={{ borderRadius: '16px', overflow: 'hidden' }}
            >
                <div style={{ padding: '10px 0' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <Text strong>Group Name</Text>
                        <Input placeholder="Enter group name..." value={groupName} onChange={e => setGroupName(e.target.value)} style={{ marginTop: '8px', borderRadius: '8px', padding: '10px' }} />
                    </div>
                    
                    <div>
                        <Text strong>Add/Remove Members</Text>
                        <Select
                            mode="multiple"
                            showSearch
                            allowClear
                            style={{ width: '100%', marginTop: '8px' }}
                            placeholder="Search and select members..."
                            value={selectedUserIds}
                            onChange={setSelectedUserIds}
                            optionFilterProp="children"
                            filterOption={(input, option) => {
                                // Access the label text from our custom Option structure
                                const userName = option.label || '';
                                return userName.toLowerCase().includes(input.toLowerCase());
                            }}
                        >
                            {users.map(u => (
                                <Option key={u.id} value={u.id} label={u.name}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Avatar size="small" src={u.media?.[0]?.file_path ? `/${u.media[0].file_path}` : null} icon={<UserOutlined />} />
                                        <Text>{u.name}</Text>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </div>
                </div>
            </Modal>

            <style>{`
                .chat-item:hover { background-color: #f5f5f5 !important; }
                .chat-item.active { background-color: #e6f7ff !important; }
                .ant-list-item { border-block-end: none !important; }
                .hover-actions { opacity: 0; transition: opacity 0.3s; }
                .group-hover-container:hover .hover-actions { opacity: 1; }
                .chat-message-row:hover .reply-btn { opacity: 1 !important; }
                @keyframes msgFlash {
                    0%   { background-color: transparent; }
                    30%  { background-color: #fffbe6; }
                    70%  { background-color: #fffbe6; }
                    100% { background-color: transparent; }
                }
                .msg-highlight { animation: msgFlash 1.8s ease; border-radius: 12px; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #bfbfbf; }
            `}</style>
        </div>
    );
};

export default GlobalChat;
