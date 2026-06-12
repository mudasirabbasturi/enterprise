import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  Input,
  Avatar,
  Button,
  Upload,
  Spin,
  Empty,
  Tooltip,
  Popconfirm,
  message as antMessage,
  Image,
} from "antd";
import {
  SendOutlined,
  PaperClipOutlined,
  DeleteOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { BiMicrophone, BiX } from "react-icons/bi";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Ably from "ably";

dayjs.extend(relativeTime);

const ProjectChatModal = ({ 
  isOpen, 
  onClose, 
  project, 
  auth 
}) => {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const messagesContainerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const shouldSendRecordingRef = useRef(true);
  const ablyRef = useRef(null);
  const projectChannelRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  const currentUser = auth?.user;

  // Disable background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const normalizeMessage = useCallback((msg) => {
    return {
      id: msg.id,
      chat_id: msg.chat_id,
      sender_id: msg.user_id || msg.sender_id,
      message: msg.message,
      created_at: msg.created_at,
      sender: {
        name: msg.user_name || msg.sender?.name,
        media: msg.avatar
          ? [{ file_path: msg.avatar.replace(/^\//, "") }]
          : msg.sender?.media || [],
      },
      reply_to_id: msg.reply_to_id,
      reply_to: msg.reply_to_message
        ? {
            id: msg.reply_to_id,
            message: msg.reply_to_message,
            sender: {
              name: msg.reply_to_user_name,
            },
          }
        : msg.reply_to || null,
      file_path: msg.file ? msg.file.url.replace(/^\//, "") : null,
      file_type: msg.file
        ? msg.file.name.match(/\.(webm|wav|mp3|ogg)$/i)
          ? "audio/webm"
          : msg.file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
          ? "image/png"
          : "application/octet-stream"
        : null,
    };
  }, []);

  // Initialize Ably
  useEffect(() => {
    if (!isOpen || !project?.id) return;

    const initAbly = async () => {
      try {
        ablyRef.current = new Ably.Realtime({ authUrl: "/api/ably/auth" });

        projectChannelRef.current = ablyRef.current.channels.get(
          `project-chat.${project.id}`
        );

        projectChannelRef.current.subscribe("message.sent", (msg) => {
          const newMsg = msg.data?.message || msg.data;
          if (newMsg) {
            const senderId = newMsg.sender_id || newMsg.user_id;
            if (Number(senderId) !== Number(currentUser.id)) {
              const normalizedNewMsg = normalizeMessage(newMsg);
              setMessages((prev) => {
                if (prev.some((m) => m.id === normalizedNewMsg.id)) return prev;
                return [...prev, normalizedNewMsg];
              });
              // Automatically mark as read if the modal is open
              axios.post(`/projects/${project.id}/chat/read`).catch(() => {});
            }
          }
        });

        projectChannelRef.current.subscribe("message.deleted", (msg) => {
          const deletedMessageId = msg.data?.id || msg.data?.messageId;
          setMessages((prev) => prev.filter((m) => m.id !== deletedMessageId));
        });
      } catch (error) {
        console.error("Failed to initialize Ably:", error);
      }
    };

    initAbly();

    return () => {
      if (projectChannelRef.current) {
        projectChannelRef.current.unsubscribe();
      }
    };
  }, [isOpen, project?.id, currentUser?.id]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!project?.id) return;
    setLoadingMessages(true);
    try {
      const response = await axios.get(`/projects/${project.id}/chat`);
      const normalized = response.data.map((msg) => ({
        id: msg.id,
        chat_id: project.id,
        sender_id: msg.user_id,
        message: msg.message,
        created_at: msg.created_at,
        sender: {
          name: msg.user_name,
          media: msg.avatar
            ? [{ file_path: msg.avatar.replace(/^\//, "") }]
            : [],
        },
        reply_to_id: msg.reply_to_id,
        reply_to: msg.reply_to_message
          ? {
              id: msg.reply_to_id,
              message: msg.reply_to_message,
              sender: {
                name: msg.reply_to_user_name,
              },
            }
          : null,
        file_path: msg.file ? msg.file.url.replace(/^\//, "") : null,
        file_type: msg.file
          ? msg.file.name.match(/\.(webm|wav|mp3|ogg)$/i)
            ? "audio/webm"
            : msg.file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
            ? "image/png"
            : "application/octet-stream"
          : null,
      }));
      setMessages(normalized);
      if (normalized.length > 0) {
        lastMessageIdRef.current = normalized[normalized.length - 1].id;
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      setLoadingMessages(false);
    }
  }, [project?.id]);

  // Fetch messages when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, fetchMessages]);

  // Track active project chat ID for real-time tracking
  useEffect(() => {
    if (isOpen && project?.id) {
      window.activeProjectChatId = project.id;
    } else {
      window.activeProjectChatId = null;
    }
    return () => {
      window.activeProjectChatId = null;
    };
  }, [isOpen, project?.id]);

  // Mark as read
  useEffect(() => {
    if (isOpen && project?.id) {
      axios.post(`/projects/${project.id}/chat/read`).then(() => {
        window.dispatchEvent(new CustomEvent('chat-unread-count-changed'));
      }).catch(() => {});
    }
  }, [isOpen, project?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }, 0);
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (audioFile = null) => {
    if (!project) return;

    const filesToUpload = audioFile ? [audioFile] : selectedFiles;
    if (!newMessage.trim() && filesToUpload.length === 0) return;

    const messageText = newMessage;
    const replyId = replyingTo?.id;
    const currentReplyTo = replyingTo;

    // Reset input fields immediately for optimistic feedback
    setNewMessage("");
    setSelectedFiles([]);
    setReplyingTo(null);
    setSending(true);
    scrollToBottom();

    try {
      if (filesToUpload.length > 0) {
        // Send files
        for (let i = 0; i < filesToUpload.length; i++) {
          const fileToUpload = filesToUpload[i];
          const tempId = `temp-${Date.now()}-${i}`;
          
          // Generate optimistic message for local display
          const optimisticMsg = {
            id: tempId,
            sender_id: currentUser.id,
            message: i === 0 ? messageText : "", // only attach text message to first file upload
            created_at: new Date().toISOString(),
            sender: {
              name: currentUser.name,
              media: currentUser.media || [],
            },
            reply_to: i === 0 ? (currentReplyTo || null) : null,
            file_path: URL.createObjectURL(fileToUpload),
            file_type: fileToUpload.type.match(/\.(webm|wav|mp3|ogg)$/i) || fileToUpload.type.match(/audio\//)
              ? "audio/webm"
              : fileToUpload.type.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || fileToUpload.type.match(/image\//)
              ? "image/png"
              : "application/octet-stream",
          };

          setMessages((prev) => [...prev, optimisticMsg]);
          scrollToBottom();

          const formData = new FormData();
          if (i === 0 && messageText.trim()) formData.append("message", messageText);
          formData.append("file", fileToUpload);
          if (i === 0 && replyId) formData.append("reply_to_id", replyId);

          const { data: responseData } = await axios.post(
            `/projects/${project.id}/chat`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          const serverMsg = responseData.data;
          const normalizedMsg = {
            id: serverMsg.id,
            chat_id: project.id,
            sender_id: serverMsg.user_id || serverMsg.sender_id || currentUser.id,
            message: serverMsg.message,
            created_at: serverMsg.created_at,
            sender: {
              name: serverMsg.user_name || serverMsg.sender?.name || currentUser.name,
              media: serverMsg.avatar
                ? [{ file_path: serverMsg.avatar.replace(/^\//, "") }]
                : serverMsg.sender?.media || [],
            },
            reply_to_id: serverMsg.reply_to_id,
            reply_to: serverMsg.reply_to_message
              ? {
                  id: serverMsg.reply_to_id,
                  message: serverMsg.reply_to_message,
                  sender: {
                    name: serverMsg.reply_to_user_name,
                  },
                }
              : null,
            file_path: serverMsg.file ? serverMsg.file.url.replace(/^\//, "") : null,
            file_type: serverMsg.file
              ? serverMsg.file.name.match(/\.(webm|wav|mp3|ogg)$/i)
                ? "audio/webm"
                : serverMsg.file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
                ? "image/png"
                : "application/octet-stream"
              : null,
          };

          // Replace optimistic message with actual server message
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? normalizedMsg : m))
          );
        }
      } else {
        // Send pure text message
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
          id: tempId,
          sender_id: currentUser.id,
          message: messageText,
          created_at: new Date().toISOString(),
          sender: {
            name: currentUser.name,
            media: currentUser.media || [],
          },
          reply_to: currentReplyTo || null,
          file_path: null,
          file_type: null,
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        scrollToBottom();

        const formData = new FormData();
        formData.append("message", messageText);
        if (replyId) formData.append("reply_to_id", replyId);

        const { data: responseData } = await axios.post(
          `/projects/${project.id}/chat`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        const serverMsg = responseData.data;
        const normalizedMsg = {
          id: serverMsg.id,
          chat_id: project.id,
          sender_id: serverMsg.user_id || serverMsg.sender_id || currentUser.id,
          message: serverMsg.message,
          created_at: serverMsg.created_at,
          sender: {
            name: serverMsg.user_name || serverMsg.sender?.name || currentUser.name,
            media: serverMsg.avatar
              ? [{ file_path: serverMsg.avatar.replace(/^\//, "") }]
              : serverMsg.sender?.media || [],
          },
          reply_to_id: serverMsg.reply_to_id,
          reply_to: serverMsg.reply_to_message
            ? {
                id: serverMsg.reply_to_id,
                message: serverMsg.reply_to_message,
                sender: {
                  name: serverMsg.reply_to_user_name,
                },
              }
            : null,
          file_path: null,
          file_type: null,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? normalizedMsg : m))
        );
      }
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
      antMessage.error("Failed to send message");
      fetchMessages();
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`/projects/${project.id}/chat/${messageId}`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error("Failed to delete message:", error);
      antMessage.error("Failed to delete message");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mr.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mr.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        handleSendMessage(audioFile);
        shouldSendRecordingRef.current = true;
      };

      mr.start();
      setMediaRecorder(mr);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      antMessage.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      shouldSendRecordingRef.current = true;
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setMediaRecorder(null);
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder) {
      shouldSendRecordingRef.current = false;
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setMediaRecorder(null);
      setIsRecording(false);
      audioChunksRef.current = [];
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFileUpload = (file) => {
    setSelectedFiles((prev) => [...prev, file]);
    return false;
  };

  const renderMessage = (msg, index) => {
    const isOwn = msg.sender_id === currentUser.id;
    const profileMedia = msg.sender?.media?.[0];

    return (
      <div
        key={msg.id || index}
        className={`d-flex mb-3 ${isOwn ? "justify-content-end" : ""}`}
      >
        <div className={`d-flex ${isOwn ? "flex-row-reverse" : ""}`} style={{ maxWidth: "70%", gap: "8px" }}>
          <Avatar
            src={profileMedia ? `/${profileMedia.file_path}` : undefined}
            icon={!profileMedia ? <UserOutlined /> : undefined}
            size={32}
            style={{ backgroundColor: "#87d068" }}
          />

          <div className={`d-flex flex-column ${isOwn ? "align-items-end" : ""}`}>
            <small className="mb-1 fw-semibold text-muted" style={{ fontSize: "0.85rem" }}>
              {msg.sender?.name}
            </small>

            {msg.reply_to && (
              <div
                className="mb-2 p-2 rounded"
                style={{
                  backgroundColor: isOwn ? "#e6f7ff" : "#f5f5f5",
                  borderLeft: "3px solid #1890ff",
                  fontSize: "0.85rem",
                  maxWidth: "100%",
                  wordBreak: "break-word",
                }}
              >
                <small className="fw-semibold">
                  {msg.reply_to.sender?.name}
                </small>
                <div className="text-muted">
                  {msg.reply_to.message?.substring(0, 50)}
                  {msg.reply_to.message?.length > 50 ? "..." : ""}
                </div>
              </div>
            )}

            <div
              className="p-2 rounded"
              style={{
                backgroundColor: isOwn ? "#1890ff" : "#f5f5f5",
                color: isOwn ? "white" : "inherit",
                wordBreak: "break-word",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {msg.file_path && msg.file_type?.includes("image") && (
                <div style={{ marginBottom: "8px" }}>
                  <Image 
                    src={`/${msg.file_path}`} 
                    alt="attachment" 
                    preview 
                    style={{ 
                      maxWidth: "250px", 
                      borderRadius: "8px",
                      display: "block"
                    }} 
                  />
                </div>
              )}
              {msg.file_path && msg.file_type?.includes("audio") && (
                <div style={{ marginBottom: "8px" }}>
                  <audio
                    controls
                    src={`/${msg.file_path}`}
                    style={{ width: "100%", maxWidth: "250px" }}
                  />
                </div>
              )}
              {msg.message && <p className="mb-0" style={{ fontSize: "0.95rem" }}>{msg.message}</p>}
            </div>

            <small className="mt-1 text-muted" style={{ fontSize: "0.8rem" }}>
              {dayjs(msg.created_at).format("HH:mm")}
            </small>

            {isOwn && (
              <Tooltip title="Delete">
                <Popconfirm
                  title="Delete message?"
                  onConfirm={() => handleDeleteMessage(msg.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <button
                    className="btn btn-sm btn-link p-0"
                    style={{ marginTop: "4px" }}
                  >
                    <DeleteOutlined style={{ color: "#ff4d4f", fontSize: "12px" }} />
                  </button>
                </Popconfirm>
              </Tooltip>
            )}

            {!isOwn && (
              <button
                className="btn btn-sm btn-link p-0"
                style={{ marginTop: "4px" }}
                onClick={() => setReplyingTo(msg)}
              >
                <ArrowUpOutlined style={{ color: "#1890ff", fontSize: "12px" }} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={
        <div className="d-flex align-items-center gap-2">
          <span>💬 Project Chat</span>
          <span className="text-muted" style={{ fontSize: "0.9rem" }}>
            {project?.project_title}
          </span>
        </div>
      }
      centered
      open={isOpen}
      onCancel={onClose}
      width={750}
      bodyStyle={{ 
        padding: 0, 
        display: "flex", 
        flexDirection: "column", 
        overflow: "hidden"
      }}
      footer={null}
      destroyOnClose
      wrapClassName="project-chat-modal-medium"
    >
      {/* Messages Container with Virtualization-like Behavior */}
      <div
        ref={messagesContainerRef}
        className="flex-grow-1"
        style={{
          padding: "16px",
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "#fafafa",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {loadingMessages ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <Spin />
          </div>
        ) : messages.length === 0 ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <Empty description="No messages yet" />
          </div>
        ) : (
          messages.map((msg, index) => renderMessage(msg, index))
        )}
      </div>

      {/* Fixed Bottom Section */}
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {replyingTo && (
          <div
            className="p-2"
            style={{
              backgroundColor: "#e6f7ff",
              borderTop: "1px solid #b3d8ff",
              borderLeft: "3px solid #1890ff",
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="fw-semibold d-block">{replyingTo.sender?.name}</small>
                <small className="text-muted">
                  {replyingTo.message?.substring(0, 60)}
                  {replyingTo.message?.length > 60 ? "..." : ""}
                </small>
              </div>
              <button
                className="btn btn-sm btn-link p-0"
                onClick={() => setReplyingTo(null)}
              >
                <BiX size={16} />
              </button>
            </div>
          </div>
        )}
        
        {/* Recording Indicator */}
        {isRecording && (
          <div
            className="p-2 d-flex align-items-center justify-content-between"
            style={{ backgroundColor: "#fff2f0", borderTop: "1px solid #ffccc7" }}
          >
            <div className="d-flex align-items-center gap-2">
              <span
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#ff4d4f",
                  animation: "pulse 1s infinite",
                }}
              />
              <span style={{ fontSize: "0.9rem" }}>Recording: {formatTime(recordingTime)}</span>
            </div>
            <div className="d-flex gap-1">
              <Button size="small" onClick={stopRecording}>
                Stop
              </Button>
              <Button size="small" danger onClick={cancelRecording}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div
            className="p-2 d-flex flex-wrap gap-2"
            style={{
              backgroundColor: "#f6ffed",
              borderTop: "1px solid #b7eb8f",
            }}
          >
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="badge bg-success d-flex align-items-center gap-1 p-2" style={{ color: 'white', borderRadius: '4px' }}>
                <span>📎 {file.name || file.type}</span>
                <button
                  className="btn btn-sm btn-link p-0 text-white"
                  onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <BiX size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div
          className="p-3"
          style={{
            borderTop: "1px solid #f0f0f0",
            backgroundColor: "white",
            display: "flex",
            gap: "8px",
            alignItems: "flex-end",
          }}
        >
          <Upload
            beforeUpload={handleFileUpload}
            showUploadList={false}
            multiple={true}
          >
            <Tooltip title="Attach files">
              <Button
                type="text"
                icon={<PaperClipOutlined style={{ fontSize: "16px" }} />}
              />
            </Tooltip>
          </Upload>

          {isRecording ? (
            <div style={{ flex: 1 }}>
              <Button type="primary" block onClick={stopRecording}>
                Stop Recording
              </Button>
            </div>
          ) : (
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onPressEnter={() => handleSendMessage()}
              disabled={sending}
              style={{ flex: 1 }}
            />
          )}

          {!isRecording && (
            <Tooltip title="Record message">
              <Button
                type="text"
                icon={<BiMicrophone style={{ fontSize: "16px" }} />}
                onClick={startRecording}
                disabled={sending}
              />
            </Tooltip>
          )}

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => handleSendMessage()}
            loading={sending}
            disabled={!newMessage.trim() && selectedFiles.length === 0 && !isRecording}
          />
        </div>
      </div>

      {/* Auto-scroll Button */}
      {messagesContainerRef.current &&
        messagesContainerRef.current.scrollTop <
          messagesContainerRef.current.scrollHeight - 500 && (
          <div
            style={{
              position: "fixed",
              bottom: "100px",
              right: "24px",
              zIndex: 1000,
            }}
          >
            <Button
              type="primary"
              shape="circle"
              icon={<ArrowDownOutlined />}
              onClick={scrollToBottom}
              size="large"
            />
          </div>
        )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .project-chat-modal-medium .ant-modal {
          height: 95vh !important;
          max-height: 95vh !important;
          top: 0 !important;
          padding-bottom: 0 !important;
          display: flex;
          align-items: center;
        }

        .project-chat-modal-medium .ant-modal-content {
          display: flex;
          flex-direction: column;
          height: 95vh !important;
          max-height: 95vh !important;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: 100%;
        }

        .project-chat-modal-medium .ant-modal-body {
          padding: 0;
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }

        /* Ensure proper scrolling in messages container */
        .project-chat-modal-medium [class*="flex-grow-1"] {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .project-chat-modal-medium [class*="flex-grow-1"]::-webkit-scrollbar {
          width: 6px;
        }

        .project-chat-modal-medium [class*="flex-grow-1"]::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .project-chat-modal-medium [class*="flex-grow-1"]::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .project-chat-modal-medium [class*="flex-grow-1"]::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </Modal>
  );
};

export default ProjectChatModal;
