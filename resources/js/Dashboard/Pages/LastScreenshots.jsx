import { useState, useEffect } from "react";
import { Link, Head, Breadcrumb, SyncOutlined } from "@shared/ui";
import MainLayout from "@layout";
import axios from "axios";
import { Card, Tag, Empty, Image, Spin, Badge } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const LastScreenshots = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(10); // fallback

    const fetchData = async () => {
        try {
            const response = await axios.get("/api/track/screenshots/latest-all");
            setData(response.data);
        } catch (error) {
            console.error("Error fetching latest screenshots:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInterval = async () => {
        try {
            const resp = await axios.get("/api/track/settings");
            if (resp.data.screenshot_interval) {
                setRefreshInterval(resp.data.screenshot_interval);
            }
        } catch (e) {}
    };

    useEffect(() => {
        fetchData();
        fetchInterval();
        
        const handleUpdate = (e) => {
            setData(prev => prev.map(item => 
                item.user_id === e.userId 
                ? { ...item, screenshot: e.screenshot, is_online: true } 
                : item
            ));
        };

        const handleStatus = (e) => {
            setData(prev => prev.map(item => 
                item.user_id === e.userId 
                ? { ...item, is_online: e.isOnline } 
                : item
            ));
        };

        const handleNotification = (event) => {
            if (!event.detail) return;
            const response = event.detail;
            const payload = response.data;
            if (payload && payload.event === 'event-screenshot-captured') handleUpdate(payload.data);
            if (payload && payload.event === 'event-user-status-updated') handleStatus(payload.data);
        };

        window.addEventListener('tracker-status-notification', handleNotification);
        
        const interval = setInterval(fetchData, refreshInterval * 1000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('tracker-status-notification', handleNotification);
        };
    }, [refreshInterval]);

    return (
        <>
            <Head title="Instant Monitor" />
            <div className="container-fluid p-4">
                <div className="d-flex justify-content-between align-items-center mb-4"
                 style={{
                    position: "sticky",
                    top: "64px",
                    background: "#fff",
                    zIndex: "1"
                }}>
                    <Breadcrumb
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: <Link href="/user-tracking">User Tracking</Link> },
                            { title: "Instant Monitor" }
                        ]}
                    />
                    <div className="d-flex align-items-center gap-3">
                        {loading && <Spin size="small" />}
                        <Tag color="blue" className="rounded-pill px-3">
                            <i className="bi bi-lightning-fill me-1"></i>
                            Screenshots reflect instantly
                        </Tag>
                        <div className="d-flex flex-column align-items-end">
                            <span className="text-muted small">Auto-refreshing every {refreshInterval}s</span>
                            <span className="text-primary" style={{ fontSize: '10px', cursor: 'default' }}>
                                <i className="bi bi-info-circle me-1"></i>
                                Adjust frequency in Tracker Global Settings
                            </span>
                        </div>
                        <button className="btn btn-outline-primary btn-sm" onClick={fetchData}>
                            <SyncOutlined className="me-1" /> Refresh
                        </button>
                    </div>
                </div>

                {loading && data.length === 0 ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                        <Spin size="large" tip="Loading Live Feed..." />
                    </div>
                ) : data.length === 0 ? (
                    <Empty description="No screenshots found" />
                ) : (
                    <div className="row g-4">
                        {data.map((item) => (
                            <div key={item.user_id} className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                                <Badge.Ribbon 
                                    text={item.is_online ? "RUNNING" : "OFFLINE"} 
                                    color={item.is_online ? "green" : "gray"}
                                >
                                    <Card
                                        hoverable
                                        cover={
                                            item.screenshot ? (
                                                <Image
                                                    alt={item.user_name}
                                                    src={`/${item.screenshot.url}`}
                                                    style={{ height: '180px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="d-flex justify-content-center align-items-center bg-light" style={{ height: '180px' }}>
                                                    <span className="text-muted">No Screenshot</span>
                                                </div>
                                            )
                                        }
                                        bodyStyle={{ padding: '12px' }}
                                    >
                                        <Card.Meta
                                            title={item.user_name}
                                            description={
                                                <div className="small">
                                                    {item.screenshot ? (
                                                        <>
                                                            <div className="text-truncate">
                                                                <i className="bi bi-clock me-1"></i>
                                                                {dayjs(item.screenshot.full_date).fromNow()}
                                                            </div>
                                                            <div className="text-muted">
                                                                {item.screenshot.time}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span>Never captured</span>
                                                    )}
                                                </div>
                                            }
                                        />
                                    </Card>
                                </Badge.Ribbon>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

LastScreenshots.layout = (page) => <MainLayout children={page} />;

export default LastScreenshots;
