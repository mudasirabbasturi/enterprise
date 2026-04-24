import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../Layout/Layout';
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
    ProjectOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

const { Title, Text } = Typography;

const ProjectChat = ({ projects: initialProjects }) => {
    const { auth } = usePage().props;
    const currentUser = auth.user;
    
    const [projects, setProjects] = useState(initialProjects);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedProject, setSelectedProject] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const PROJECT_STATUSES = [
        { value: 'All', label: 'All Statuses' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Takeoff On Progress', label: 'Takeoff In Progress' },
        { value: 'Pricing On Progress', label: 'Pricing In Progress' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Revision', label: 'Revision' },
        { value: 'Hold', label: 'Hold' },
        { value: 'Cancelled', label: 'Cancelled' },
    ];
    
    const scrollRef = useRef(null);

    // Sync project list with global events
    useEffect(() => {
        const handleProjectChange = (event) => {
            const { type, project } = event.detail;
            
            setProjects((prevData) => {
                if (type === 'created') {
                    if (prevData.some(p => p.id === project.id)) return prevData;
                    if (project.project_status === 'Deliver') return prevData;
                    return [project, ...prevData];
                }
                
                if (type === 'updated') {
                    // If status changed to Deliver, remove it from list
                    if (project.project_status === 'Deliver') {
                        return prevData.filter(p => p.id !== project.id);
                    }
                    return prevData.map(p => p.id === project.id ? { ...p, ...project } : p);
                }
                
                if (type === 'deleted') {
                    if (selectedProject?.id === project.id) setSelectedProject(null);
                    return prevData.filter(p => p.id !== project.id);
                }
                
                return prevData;
            });
        };

        window.addEventListener('project-data-changed', handleProjectChange);
        return () => window.removeEventListener('project-data-changed', handleProjectChange);
    }, [selectedProject]);

    // Filter projects based on search and status
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.project_title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'All' || p.project_status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    // Fetch history when project changes
    useEffect(() => {
        if (selectedProject) {
            fetchChatHistory(selectedProject.id);
            
            // Set up Pusher/Echo
            const channelName = `project-chat-${selectedProject.id}`;
            const channel = window.Echo.channel(channelName);
            
            const handler = (payload) => {
                if (payload && payload.data) {
                    const incomingMsg = payload.data;
                    setMessages(prev => {
                        if (prev.some(m => m.id === incomingMsg.id)) return prev;
                        return [...prev, incomingMsg];
                    });
                }
            };

            const deleteHandler = (payload) => {
                if (payload && payload.data) {
                    const deletedId = payload.data.id;
                    setMessages(prev => prev.filter(m => m.id !== deletedId));
                }
            };
            
            channel.listen(".event-new-message", handler);
            channel.listen(".event-delete-message", deleteHandler);

            return () => {
                channel.stopListening(".event-new-message", handler);
                channel.stopListening(".event-delete-message", deleteHandler);
            };
        }
    }, [selectedProject]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const fetchChatHistory = async (projectId) => {
        setLoadingHistory(true);
        setMessages([]);
        try {
            const response = await axios.get(`/api/projects/${projectId}/chat`);
            setMessages(response.data);
        } catch (err) {
            console.error("Failed to fetch chat history:", err);
            message.error("Could not load chat history");
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedProject || (!inputValue.trim() && !selectedFile)) return;
        if (sending) return;

        try {
            setSending(true);
            const formData = new FormData();
            if (inputValue.trim()) formData.append('message', inputValue);
            if (replyingTo) formData.append('reply_to_id', replyingTo.id);
            if (selectedFile) formData.append('file', selectedFile);

            await axios.post(`/api/projects/${selectedProject.id}/chat`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setInputValue('');
            setReplyingTo(null);
            setSelectedFile(null);
        } catch (err) {
            console.error("Failed to send message:", err);
            message.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await axios.delete(`/api/projects/${selectedProject.id}/chat/${messageId}`);
            message.success("Message deleted");
        } catch (err) {
            console.error("Failed to delete message:", err);
            message.error("Failed to delete message");
        }
    };

    return (
        <div style={{ 
            height: 'calc(100vh - 64px)', 
            display: 'flex', 
            backgroundColor: '#fff', 
            borderRadius: '0', 
            overflow: 'hidden',
            boxShadow: 'none'
        }}>
            {/* Left Sidebar - Project List */}
            <div style={{ 
                width: '350px', 
                borderRight: '1px solid #f0f0f0', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: '#fafafa'
            }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #f0f0f0' }}>
                    <Title level={5} style={{ marginBottom: '12px' }}>Project Chats</Title>
                    <Input 
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        allowClear
                        style={{ marginBottom: '10px' }}
                    />
                    <Select
                        value={selectedStatus}
                        onChange={val => setSelectedStatus(val)}
                        style={{ width: '100%' }}
                        options={PROJECT_STATUSES}
                    />
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <List
                        dataSource={filteredProjects}
                        renderItem={project => (
                            <List.Item 
                                onClick={() => setSelectedProject(project)}
                                style={{ 
                                    padding: '15px 20px', 
                                    cursor: 'pointer',
                                    backgroundColor: selectedProject?.id === project.id ? '#e6f7ff' : 'transparent',
                                    transition: 'all 0.3s',
                                    borderLeft: selectedProject?.id === project.id ? '4px solid #1890ff' : '4px solid transparent'
                                }}
                                className="project-list-item"
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Badge dot={project.unread_count > 0}>
                                            <Avatar icon={<ProjectOutlined />} style={{ backgroundColor: '#1890ff' }} />
                                        </Badge>
                                    }
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text strong style={{ maxWidth: '180px' }} ellipsis>{project.project_title}</Text>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                                {project.project_status}
                                            </Text>
                                        </div>
                                    }
                                    description={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                                            <Avatar.Group maxCount={3} size="small">
                                                {(project.project_team_members || []).map((m, i) => (
                                                    <Tooltip title={m.user?.name} key={i}>
                                                        <Avatar 
                                                            src={m.user?.media?.[0] ? `/${m.user.media[0].file_path}` : null} 
                                                            icon={<UserOutlined />} 
                                                        />
                                                    </Tooltip>
                                                ))}
                                            </Avatar.Group>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {project.project_team_members?.length || 0} members
                                            </Text>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </div>
            </div>

            {/* Right Body - Chat Interface */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
                {selectedProject ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ 
                            padding: '15px 25px', 
                            borderBottom: '1px solid #f0f0f0', 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#fff'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Avatar size="large" icon={<ProjectOutlined />} style={{ backgroundColor: '#1890ff' }} />
                                <div>
                                    <Title level={5} style={{ margin: 0 }}>{selectedProject.project_title}</Title>
                                    <Text type="secondary" size="small">Group Chat</Text>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Avatar.Group maxCount={5}>
                                    {(selectedProject.project_team_members || []).map((m, i) => (
                                        <Tooltip title={m.user?.name} key={i}>
                                            <Avatar 
                                                src={m.user?.media?.[0] ? `/${m.user.media[0].file_path}` : null} 
                                                icon={<UserOutlined />} 
                                            />
                                        </Tooltip>
                                    ))}
                                </Avatar.Group>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                            ref={scrollRef}
                            style={{ 
                                flex: 1, 
                                overflowY: 'auto', 
                                padding: '25px', 
                                backgroundColor: '#f9f9f9',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px'
                            }}
                        >
                            {loadingHistory ? (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                                    <Spin tip="Loading chat history..." />
                                </div>
                            ) : messages.length > 0 ? (
                                messages.map((item) => {
                                    const isMe = item.user_id === currentUser.id;
                                    return (
                                        <div 
                                            key={item.id}
                                            id={`msg-${item.id}`}
                                            style={{ 
                                                display: 'flex', 
                                                justifyContent: isMe ? 'flex-end' : 'flex-start'
                                            }}
                                        >
                                            <div style={{ 
                                                display: 'flex', 
                                                flexDirection: isMe ? 'row-reverse' : 'row',
                                                alignItems: 'flex-end',
                                                maxWidth: '75%',
                                                gap: '10px'
                                            }}>
                                                <Avatar 
                                                    src={item.avatar} 
                                                    icon={<UserOutlined />} 
                                                    size="small"
                                                />
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                                    {!isMe && <Text type="secondary" style={{ fontSize: '11px', marginLeft: '5px', marginBottom: '2px' }}>{item.user_name}</Text>}
                                                    <div style={{ 
                                                        backgroundColor: isMe ? '#1890ff' : '#fff',
                                                        color: isMe ? '#fff' : '#000',
                                                        padding: '10px 15px',
                                                        borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                        position: 'relative'
                                                    }}>
                                                        {/* Reply Quoted block */}
                                                        {item.reply_to_id && (
                                                            <div 
                                                                onClick={() => {
                                                                    const el = document.getElementById(`msg-${item.reply_to_id}`);
                                                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                }}
                                                                style={{
                                                                    backgroundColor: isMe ? 'rgba(255, 255, 255, 0.15)' : '#f0f0f0',
                                                                    padding: '8px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '12px',
                                                                    marginBottom: '8px',
                                                                    borderLeft: `3px solid ${isMe ? '#fff' : '#1890ff'}`,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <div style={{ fontWeight: 'bold', color: isMe ? '#fff' : '#1890ff' }}>{item.reply_to_user_name}</div>
                                                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.reply_to_message}</div>
                                                            </div>
                                                        )}

                                                        {item.message && <div>{item.message}</div>}

                                                        {item.file && (
                                                            <div style={{ marginTop: '8px' }}>
                                                                {item.file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                                                    <Image 
                                                                        src={item.file.url} 
                                                                        style={{ maxWidth: '250px', borderRadius: '8px' }} 
                                                                    />
                                                                ) : (
                                                                    <a href={item.file.url} target="_blank" rel="noreferrer" style={{ color: isMe ? '#fff' : '#1890ff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                        <FileOutlined /> {item.file.name}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', gap: '15px' }}>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <Text 
                                                                    onClick={() => setReplyingTo(item)} 
                                                                    style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.7)' : '#1890ff', cursor: 'pointer' }}
                                                                >Reply</Text>
                                                                {isMe && (
                                                                    <Popconfirm title="Delete?" onConfirm={() => handleDeleteMessage(item.id)}>
                                                                        <DeleteOutlined style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.7)' : '#ff4d4f', cursor: 'pointer' }} />
                                                                    </Popconfirm>
                                                                )}
                                                            </div>
                                                            <Text style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.7)' : '#bfbfbf' }}>
                                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Empty description="No messages yet. Start the conversation!" />
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: '20px 25px', borderTop: '1px solid #f0f0f0' }}>
                            {/* Indicators */}
                            {replyingTo && (
                                <div style={{ padding: '8px 15px', backgroundColor: '#f0f2f5', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text size="small" italic>Replying to {replyingTo.user_name}: {replyingTo.message?.substring(0, 50)}...</Text>
                                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setReplyingTo(null)} />
                                </div>
                            )}
                            {selectedFile && (
                                <div style={{ padding: '8px 15px', backgroundColor: '#e6f7ff', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text size="small" strong><PaperClipOutlined /> {selectedFile.name}</Text>
                                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setSelectedFile(null)} />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                                <Upload 
                                    beforeUpload={file => { setSelectedFile(file); return false; }} 
                                    showUploadList={false}
                                >
                                    <Button shape="circle" icon={<PaperClipOutlined />} />
                                </Upload>
                                <Input.TextArea 
                                    autoSize={{ minRows: 1, maxRows: 4 }}
                                    placeholder="Type your message..."
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    onPressEnter={e => {
                                        if (!e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    style={{ borderRadius: '20px', padding: '8px 15px' }}
                                />
                                <Button 
                                    type="primary" 
                                    shape="circle" 
                                    icon={<SendOutlined />} 
                                    size="large"
                                    onClick={handleSendMessage}
                                    loading={sending}
                                    disabled={(!inputValue.trim() && !selectedFile) || sending}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' }}>
                        <div style={{ 
                            width: '100px', 
                            height: '100px', 
                            backgroundColor: '#f0f0f0', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            marginBottom: '20px'
                        }}>
                            <MessageOutlined style={{ fontSize: '40px', color: '#bfbfbf' }} />
                        </div>
                        <Title level={4} style={{ color: '#8c8c8c' }}>Select a project to start chatting</Title>
                        <Text type="secondary">Connect with your team members in real-time</Text>
                    </div>
                )}
            </div>

            <style>{`
                .project-list-item:hover {
                    background-color: #f0f5ff !important;
                }
            `}</style>
        </div>
    );
};

export default ProjectChat;