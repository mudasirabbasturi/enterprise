import React, { useState, useEffect, useRef, memo } from 'react';
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
    Select
} from 'antd';
import { 
    SearchOutlined, 
    MessageOutlined, 
    UserOutlined, 
    SendOutlined, 
    PaperClipOutlined, 
    FileOutlined,
    DeleteOutlined,
    CloseOutlined,
    ProjectOutlined,
    AudioOutlined,
    StopOutlined,
    CheckOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

const { Title, Text } = Typography;

// Isolated Fast Input Component to prevent typing lag
const ChatInput = memo(({ onSendMessage, replyingTo, setReplyingTo, selectedFile, setSelectedFile, sending }) => {
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
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
                setSelectedFile(audioFile);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) {
            message.error("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            setTimeout(() => setSelectedFile(null), 100);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ padding: '20px 25px', borderTop: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
            {replyingTo && (
                <div style={{ padding: '8px 15px', backgroundColor: '#f0f2f5', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text size="small" italic>Replying to {replyingTo.user_name}...</Text>
                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setReplyingTo(null)} />
                </div>
            )}
            {selectedFile && (
                <div style={{ padding: '8px 15px', backgroundColor: '#e6f7ff', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text size="small" strong>
                        {selectedFile.type.startsWith('audio/') ? <AudioOutlined /> : <PaperClipOutlined />} {selectedFile.name}
                    </Text>
                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setSelectedFile(null)} />
                </div>
            )}

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {!isRecording ? (
                    <>
                        <Upload beforeUpload={file => { setSelectedFile(file); return false; }} showUploadList={false}>
                            <Button shape="circle" icon={<PaperClipOutlined />} size="large" />
                        </Upload>
                        <Input.TextArea 
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            placeholder="Type your message..."
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onPressEnter={e => {
                                if (!e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            style={{ borderRadius: '24px', padding: '10px 20px', backgroundColor: '#f0f2f5', border: 'none', flex: 1 }}
                        />
                        <Button shape="circle" icon={<AudioOutlined />} size="large" onClick={startRecording} style={{ color: '#ff4d4f' }} />
                        <Button type="primary" shape="circle" icon={<SendOutlined />} size="large" onClick={handleSend} loading={sending} disabled={(!inputValue.trim() && !selectedFile) || sending} />
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#fff1f0', padding: '8px 20px', borderRadius: '24px' }}>
                        <Badge status="processing" color="red" text={<Text strong style={{ color: '#ff4d4f' }}>Recording {formatTime(recordingTime)}</Text>} />
                        <div style={{ flex: 1 }} />
                        <Button type="text" danger icon={<CloseOutlined />} onClick={cancelRecording}>Cancel</Button>
                        <Button type="primary" danger shape="round" icon={<CheckOutlined />} onClick={stopRecording}>Stop & Attach</Button>
                    </div>
                )}
            </div>
        </div>
    );
});

const ProjectChat = ({ projects: initialProjects }) => {
    const { auth } = usePage().props;
    const currentUser = auth.user;
    
    const [projects, setProjects] = useState(initialProjects);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedProject, setSelectedProject] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const scrollRef = useRef(null);
    const selectedProjectRef = useRef(null);
    const projectSound = useRef(new Audio('/uploads/media/sound_effect/project/project_notification.wav'));

    useEffect(() => {
        selectedProjectRef.current = selectedProject;
        if (selectedProject) {
            fetchChatHistory(selectedProject.id);
            // Clear unread count locally when selecting
            setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, unread_count: 0 } : p));
        }
    }, [selectedProject?.id]);

    // 1. Listen for global notifications from Layout.jsx (Badges/Unread Counts)
    useEffect(() => {
        const handleNotification = (event) => {
            if (!event.detail || !event.detail.data) return;
            const { project_id, message: incomingMsg } = event.detail.data;
            if (incomingMsg.user_id !== currentUser.id) {
                // Update sidebar badges for any project
                if (!selectedProjectRef.current || selectedProjectRef.current.id !== project_id) {
                    setProjects(prev => prev.map(p => p.id === project_id ? { ...p, unread_count: (parseInt(p.unread_count) || 0) + 1 } : p));
                    projectSound.current.play().catch(() => {});
                }
            }
        };
        window.addEventListener('project-chat-notification', handleNotification);
        return () => window.removeEventListener('project-chat-notification', handleNotification);
    }, [currentUser.id]);

    // 2. Active Chat WebSocket (ONLY for the selected project)
    useEffect(() => {
        if (!selectedProject?.id) return;

        let ws = null;
        const channelName = `project-chat-${selectedProject.id}`;

        const connect = () => {
            ws = new WebSocket('wss://demo.bidwinners.net');
            ws.onopen = () => {
                console.log(`Chat Socket: Joining ${channelName}`);
                ws.send(JSON.stringify({ action: 'subscribe', channel: channelName }));
            };
            ws.onmessage = (event) => {
                const response = JSON.parse(event.data);
                
                // Only handle messages for this specific channel
                if (response.channel === channelName && response.data) {
                    const payload = response.data;
                    
                    if (payload.event === 'event-new-message') {
                        const incomingMsg = payload.data;
                        setMessages(prev => (prev.some(m => m.id === incomingMsg.id) ? prev : [...prev, incomingMsg]));
                    }
                    
                    if (payload.event === 'event-delete-message') {
                        const deletedId = payload.data.id;
                        setMessages(prev => prev.filter(m => m.id !== deletedId));
                    }
                }
            };
            ws.onclose = () => setTimeout(connect, 3000);
            ws.onerror = (err) => console.error("Chat Socket Error:", err);
        };

        connect();
        return () => { if (ws) ws.close(); };
    }, [selectedProject?.id]);

    // Project CRUD Sync
    useEffect(() => {
        const handleProjectChange = (event) => {
            const { type, project } = event.detail;
            setProjects((prevData) => {
                if (type === 'created') return [{ ...project, unread_count: 0 }, ...prevData];
                if (type === 'updated') {
                    if (project.project_status === 'Deliver') return prevData.filter(p => p.id !== project.id);
                    return prevData.map(p => p.id === project.id ? { ...p, ...project } : p);
                }
                if (type === 'deleted') {
                    if (selectedProjectRef.current?.id === project.id) setSelectedProject(null);
                    return prevData.filter(p => p.id !== project.id);
                }
                return prevData;
            });
        };
        window.addEventListener('project-data-changed', handleProjectChange);
        return () => window.removeEventListener('project-data-changed', handleProjectChange);
    }, []);

    const filteredProjects = projects.filter(p => 
        p.project_title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        (selectedStatus === 'All' || p.project_status === selectedStatus)
    );

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

    const fetchChatHistory = async (projectId) => {
        setLoadingHistory(true);
        try {
            const response = await axios.get(`/api/projects/${projectId}/chat`);
            setMessages(response.data);
            window.dispatchEvent(new CustomEvent('refresh-unread-counts'));
        } catch (err) {} finally { setLoadingHistory(false); }
    };

    const handleSendMessage = async (text, clearInput) => {
        if (!selectedProject || (!text.trim() && !selectedFile)) return;
        try {
            setSending(true);
            const formData = new FormData();
            if (text.trim()) formData.append('message', text);
            if (replyingTo) formData.append('reply_to_id', replyingTo.id);
            if (selectedFile) formData.append('file', selectedFile);
            await axios.post(`/api/projects/${selectedProject.id}/chat`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            clearInput();
            setReplyingTo(null);
            setSelectedFile(null);
        } catch (err) { message.error("Failed to send"); } finally { setSending(false); }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await axios.delete(`/api/projects/${selectedProject.id}/chat/${messageId}`);
            setMessages(prev => prev.filter(m => m.id !== messageId));
            message.success("Deleted");
        } catch (err) {}
    };

    return (
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', backgroundColor: '#fff', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{ width: '350px', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #f0f0f0' }}>
                    <Title level={5} style={{ marginBottom: '12px' }}>Project Chats</Title>
                    <Input prefix={<SearchOutlined />} placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} allowClear style={{ marginBottom: '10px' }} />
                    <Select value={selectedStatus} onChange={setSelectedStatus} style={{ width: '100%' }} options={[{ value: 'All', label: 'All Statuses' }, { value: 'Pending', label: 'Pending' }, { value: 'Takeoff On Progress', label: 'Takeoff In Progress' }, { value: 'Pricing On Progress', label: 'Pricing In Progress' }, { value: 'Completed', label: 'Completed' }, { value: 'Revision', label: 'Revision' }, { value: 'Hold', label: 'Hold' }, { value: 'Cancelled', label: 'Cancelled' }]} />
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <List dataSource={filteredProjects} renderItem={p => {
                        const members = p.project_team_members || [];
                        return (
                            <List.Item onClick={() => setSelectedProject(p)} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: selectedProject?.id === p.id ? '#e6f7ff' : 'transparent', borderLeft: selectedProject?.id === p.id ? '4px solid #1890ff' : '4px solid transparent' }}>
                                <List.Item.Meta 
                                    avatar={<Badge count={p.unread_count} overflowCount={99}><Avatar icon={<ProjectOutlined />} style={{ backgroundColor: '#1890ff' }} /></Badge>} 
                                    title={<Text strong ellipsis>{p.project_title}</Text>} 
                                    description={
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {members.length > 0 ? `Joined by ${members.length} members` : 'Joined by 0 members'}
                                            </Text>
                                            <Avatar.Group maxCount={3} size="small">
                                                {members.map((m, i) => (
                                                    <Avatar 
                                                        key={i} 
                                                        src={m.user?.media?.[0]?.file_path ? `/${m.user.media[0].file_path}` : null} 
                                                        icon={<UserOutlined />} 
                                                    />
                                                ))}
                                            </Avatar.Group>
                                        </div>
                                    } 
                                />
                            </List.Item>
                        );
                    }} />
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedProject ? (
                    <>
                        <div style={{ padding: '15px 25px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Avatar size="large" icon={<ProjectOutlined />} style={{ backgroundColor: '#1890ff' }} />
                                <div><Title level={5} style={{ margin: 0 }}>{selectedProject.project_title}</Title><Text type="secondary">Group Chat</Text></div>
                            </div>
                            <Avatar.Group maxCount={4} size="small">
                                {(selectedProject.project_team_members || []).map((m, i) => (
                                    <Tooltip title={m.user?.name} key={i}><Avatar src={m.user?.media?.[0]?.file_path ? `/${m.user.media[0].file_path}` : null} icon={<UserOutlined />} /></Tooltip>
                                ))}
                            </Avatar.Group>
                        </div>
                        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '25px', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {loadingHistory ? <Spin tip="Loading..." style={{ marginTop: '50px' }} /> : messages.map((item) => {
                                const isMe = item.user_id === currentUser.id;
                                return (
                                    <div key={item.id} id={`msg-${item.id}`} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', maxWidth: '75%', gap: '10px' }}>
                                            <Avatar src={item.avatar} icon={<UserOutlined />} size="small" />
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                                {!isMe && <Text type="secondary" style={{ fontSize: '11px', marginBottom: '2px' }}>{item.user_name}</Text>}
                                                <div style={{ backgroundColor: isMe ? '#1890ff' : '#fff', color: isMe ? '#fff' : '#000', padding: '10px 15px', borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    {item.reply_to_message && <div style={{ fontSize: '11px', opacity: 0.7, borderLeft: '2px solid', paddingLeft: '5px', marginBottom: '5px' }}>{item.reply_to_message}</div>}
                                                    {item.message && <div>{item.message}</div>}
                                                    {item.file && (
                                                        <div style={{ marginTop: '8px' }}>
                                                            {item.file.name.match(/\.(webm|wav|mp3|ogg)$/i) ? <audio controls style={{ height: '35px', maxWidth: '240px' }}><source src={item.file.url} type="audio/webm" /></audio> : item.file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? <Image src={item.file.url} style={{ maxWidth: '250px', borderRadius: '8px' }} /> : <a href={item.file.url} target="_blank" rel="noreferrer" style={{ color: isMe ? '#fff' : '#1890ff', display: 'flex', alignItems: 'center', gap: '5px' }}><FileOutlined /> {item.file.name}</a>}
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', gap: '15px' }}>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <Text onClick={() => setReplyingTo(item)} style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.7)' : '#1890ff', cursor: 'pointer' }}>Reply</Text>
                                                            {isMe && <Popconfirm title="Delete?" onConfirm={() => handleDeleteMessage(item.id)}><DeleteOutlined style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.7)' : '#ff4d4f', cursor: 'pointer' }} /></Popconfirm>}
                                                        </div>
                                                        <Text style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.7)' : '#bfbfbf' }}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <ChatInput onSendMessage={handleSendMessage} replyingTo={replyingTo} setReplyingTo={setReplyingTo} selectedFile={selectedFile} setSelectedFile={setSelectedFile} sending={sending} />
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description="Select a project to start chatting" /></div>
                )}
            </div>
            <style>{`.project-list-item:hover { background-color: #f0f5ff !important; }`}</style>
        </div>
    );
};

export default ProjectChat;