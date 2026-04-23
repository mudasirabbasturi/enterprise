import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, List, Avatar, Spin, message, Upload, Image, Popconfirm } from 'antd';
import { SendOutlined, UserOutlined, PaperClipOutlined, FileOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const ProjectChatModal = ({ visible, onClose, project, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (visible && project) {
            fetchChatHistory();
            
            const channelName = `project-chat-${project.id}`;
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
    }, [visible, project]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const fetchChatHistory = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/projects/${project.id}/chat`);
            setMessages(response.data);
        } catch (err) {
            console.error("Failed to fetch chat history:", err);
            message.error("Could not load chat history");
        } finally {
            setLoading(false);
        }
    };

    const [sending, setSending] = useState(false);

    const handleSendMessage = async () => {
        if (!inputValue.trim() && !selectedFile) return;
        if (sending) return;

        try {
            setSending(true);
            const formData = new FormData();
            if (inputValue.trim()) formData.append('message', inputValue);
            if (replyingTo) formData.append('reply_to_id', replyingTo.id);
            if (selectedFile) formData.append('file', selectedFile);

            await axios.post(`/api/projects/${project.id}/chat`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
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
            await axios.delete(`/api/projects/${project.id}/chat/${messageId}`);
            message.success("Message deleted");
        } catch (err) {
            console.error("Failed to delete message:", err);
            message.error("Failed to delete message");
        }
    };

    return (
        <Modal
            title={`Project Group Chat: ${project?.project_title || 'Chat'}`}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            style={{ top: '2.5vh' }}
            styles={{ body: { padding: 0 } }}
        >
            <div style={{ height: 'calc(95vh - 55px)', display: 'flex', flexDirection: 'column' }}>
                {/* Chat History */}
                <div 
                    ref={scrollRef}
                    style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        padding: '20px', 
                        backgroundColor: '#f5f5f5' 
                    }}
                >
                    {loading ? (
                        <div style={{ textAlign: 'center', marginTop: '50px' }}>
                            <Spin tip="Loading history..." />
                        </div>
                    ) : (
                        <List
                            itemLayout="horizontal"
                            dataSource={messages}
                            renderItem={(item) => {
                                const isMe = item.user_id === currentUser.id;
                                return (
                                    <div 
                                        id={`msg-${item.id}`}
                                        style={{ 
                                            display: 'flex', 
                                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                                            marginBottom: '15px'
                                        }}
                                    >
                                        <div style={{ 
                                            maxWidth: '70%', 
                                            display: 'flex', 
                                            flexDirection: isMe ? 'row-reverse' : 'row',
                                            alignItems: 'flex-start'
                                        }}>
                                            <Avatar 
                                                src={item.avatar} 
                                                icon={<UserOutlined />} 
                                                style={{ flexShrink: 0 }}
                                            />
                                            <div style={{ 
                                                margin: isMe ? '0 10px 0 0' : '0 0 0 10px',
                                                backgroundColor: isMe ? '#1890ff' : '#fff',
                                                color: isMe ? '#fff' : '#000',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                position: 'relative'
                                            }}>
                                                {!isMe && <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#888' }}>{item.user_name}</div>}
                                                
                                                {/* Quoted Reply Block */}
                                                {item.reply_to_id && (
                                                    <div 
                                                        onClick={() => {
                                                            const el = document.getElementById(`msg-${item.reply_to_id}`);
                                                            if (el) {
                                                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                el.style.backgroundColor = 'rgba(24, 144, 255, 0.2)';
                                                                setTimeout(() => el.style.backgroundColor = 'transparent', 2000);
                                                            }
                                                        }}
                                                        style={{
                                                            backgroundColor: isMe ? 'rgba(255, 255, 255, 0.2)' : '#f0f0f0',
                                                            padding: '6px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            marginBottom: '6px',
                                                            borderLeft: `4px solid ${isMe ? '#fff' : '#1890ff'}`,
                                                            cursor: 'pointer',
                                                            opacity: 0.9
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 'bold', fontSize: '11px', color: isMe ? '#e6f7ff' : '#1890ff' }}>
                                                            {item.reply_to_user_name}
                                                        </div>
                                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                                            {item.reply_to_message}
                                                        </div>
                                                    </div>
                                                )}

                                                {item.message && <div>{item.message}</div>}

                                                {/* File Attachment Output */}
                                                {item.file && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        {item.file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                                            <Image 
                                                                src={item.file.url} 
                                                                alt={item.file.name}
                                                                style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '4px' }}
                                                            />
                                                        ) : (
                                                            <a 
                                                                href={item.file.url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    color: isMe ? '#fff' : '#1890ff',
                                                                    textDecoration: 'underline'
                                                                }}
                                                            >
                                                                <FileOutlined /> {item.file.name}
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <span 
                                                            style={{ fontSize: '11px', cursor: 'pointer', color: isMe ? '#e6f7ff' : '#1890ff', opacity: 0.8 }}
                                                            onClick={() => setReplyingTo(item)}
                                                        >
                                                            Reply
                                                        </span>
                                                        {isMe && (
                                                            <Popconfirm
                                                                title="Delete message?"
                                                                onConfirm={() => handleDeleteMessage(item.id)}
                                                                okText="Yes"
                                                                cancelText="No"
                                                            >
                                                                <DeleteOutlined style={{ fontSize: '11px', color: '#ff4d4f', cursor: 'pointer' }} />
                                                            </Popconfirm>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '10px', textAlign: 'right', opacity: 0.7, marginLeft: '15px' }}>
                                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    )}
                </div>

                {/* Reply Indicator */}
                {replyingTo && (
                    <div style={{ 
                        padding: '10px 15px', 
                        backgroundColor: '#f0f2f5', 
                        borderTop: '1px solid #e8e8e8',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ borderLeft: '3px solid #1890ff', paddingLeft: '10px', overflow: 'hidden' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1890ff' }}>
                                Replying to {replyingTo.user_name}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {replyingTo.message}
                            </div>
                        </div>
                        <Button type="text" size="small" onClick={() => setReplyingTo(null)}>X</Button>
                    </div>
                )}

                {/* Selected File Indicator */}
                {selectedFile && (
                    <div style={{ 
                        padding: '10px 15px', 
                        backgroundColor: '#e6f7ff', 
                        borderTop: '1px solid #91d5ff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PaperClipOutlined style={{ color: '#1890ff' }} />
                            <span style={{ fontSize: '13px', color: '#1890ff' }}>{selectedFile.name}</span>
                        </div>
                        <Button type="text" size="small" onClick={() => setSelectedFile(null)}>X</Button>
                    </div>
                )}

                {/* Input Area */}
                <div style={{ padding: '15px', borderTop: '1px solid #e8e8e8', backgroundColor: '#fff', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <Upload
                        beforeUpload={(file) => {
                            setSelectedFile(file);
                            return false; // Prevent automatic upload
                        }}
                        showUploadList={false}
                    >
                        <Button shape="circle" icon={<PaperClipOutlined />} />
                    </Upload>
                    <Input.TextArea 
                        rows={1}
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onPressEnter={(e) => {
                            if (!e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Type a message..."
                        style={{ flex: 1 }}
                    />
                    <Button 
                        type="primary" 
                        shape="circle" 
                        icon={<SendOutlined />} 
                        onClick={handleSendMessage}
                        loading={sending}
                        disabled={(!inputValue.trim() && !selectedFile) || sending}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default ProjectChatModal;
