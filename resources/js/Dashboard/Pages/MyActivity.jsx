import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from "@layout";
import { 
    DatePicker, 
    Card, 
    Row, 
    Col, 
    Statistic, 
    Table, 
    Progress, 
    Tag, 
    Spin, 
    notification,
    Empty,
    Typography,
    Divider,
    Button,
    Modal,
    Image,
    Checkbox,
    Tooltip 
} from 'antd';
import { 
    LineChartOutlined, 
    ClockCircleOutlined,
    SyncOutlined,
    ArrowLeftOutlined,
    GlobalOutlined,
    PictureOutlined,
    DeleteOutlined,
    EyeOutlined,
    QuestionCircleOutlined,
    InfoCircleOutlined,
    LinkOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { Breadcrumb } from "@shared/ui";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Filler,
  Legend as ChartLegend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Filler,
  ChartLegend
);

import {
  AgGridReact,
  gridTheme,
  defaultColDef as globalDefaultColDef,
} from "@agConfig/AgGridConfig";

const { Title, Text } = Typography;

const MyActivity = ({ targetUser }) => {
    const [loading, setLoading] = useState(false);
    const [activityStats, setActivityStats] = useState(null);
    const [fromDate, setFromDate] = useState(dayjs());
    const [toDate, setToDate] = useState(null);
    
    // Screenshot states
    const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
    const [screenshots, setScreenshots] = useState([]);
    const [screenshotLoading, setScreenshotLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [screenshotFrom, setScreenshotFrom] = useState(dayjs());
    const [screenshotTo, setScreenshotTo] = useState(null);
    
    // Pagination states
    const [screenshotsPage, setScreenshotsPage] = useState(1);
    const [hasMoreScreenshots, setHasMoreScreenshots] = useState(false);
    const [totalScreenshots, setTotalScreenshots] = useState(0);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const observer = useRef();
    const lastScreenshotElementRef = useCallback(node => {
        if (screenshotLoading || isFetchingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreScreenshots) {
                loadMoreScreenshots();
            }
        });
        if (node) observer.current.observe(node);
    }, [screenshotLoading, isFetchingMore, hasMoreScreenshots]);
    
    const [api, contextHolder] = notification.useNotification();

    const fetchActivityStats = useCallback(async (start, end) => {
        setLoading(true);
        try {
            const params = {
                user_id: targetUser.id,
                date: start.format('YYYY-MM-DD'), // Default for single day
                start_date: start.format('YYYY-MM-DD'),
                end_date: end ? end.format('YYYY-MM-DD') : start.format('YYYY-MM-DD')
            };
            const response = await axios.get("/api/track/activity/stats", { params });
            setActivityStats(response.data);
        } catch (error) {
            console.error("Error fetching activity stats:", error);
            api.error({
                message: "Error",
                description: "Failed to fetch activity statistics",
                placement: "topRight"
            });
        } finally {
            setLoading(false);
        }
    }, [targetUser.id, api]);

    const fetchScreenshots = useCallback(async (start, end) => {
        setScreenshotLoading(true);
        setScreenshotsPage(1);
        setSelectedIds([]);
        try {
            const params = {
                user_id: targetUser.id,
                start_date: start.format('YYYY-MM-DD'),
                end_date: end ? end.format('YYYY-MM-DD') : start.format('YYYY-MM-DD'),
                page: 1,
                per_page: 24
            };
            const response = await axios.get("/api/track/screenshots", { params });
            setScreenshots(response.data.data);
            setHasMoreScreenshots(!!response.data.next_page_url);
            setTotalScreenshots(response.data.total || 0);
        } catch (error) {
            console.error("Error fetching screenshots:", error);
        } finally {
            setScreenshotLoading(false);
        }
    }, [targetUser.id]);

    const loadMoreScreenshots = async () => {
        if (!hasMoreScreenshots || isFetchingMore) return;
        
        setIsFetchingMore(true);
        const nextPage = screenshotsPage + 1;
        try {
            const params = {
                user_id: targetUser.id,
                start_date: screenshotFrom.format('YYYY-MM-DD'),
                end_date: screenshotTo ? screenshotTo.format('YYYY-MM-DD') : screenshotFrom.format('YYYY-MM-DD'),
                page: nextPage,
                per_page: 24
            };
            const response = await axios.get("/api/track/screenshots", { params });
            const newData = response.data.data || [];
            if (newData.length > 0) {
                setScreenshots(prev => [...prev, ...newData]);
                setScreenshotsPage(nextPage);
            }
            setHasMoreScreenshots(!!response.data.next_page_url);
            setTotalScreenshots(response.data.total || 0);
        } catch (error) {
            console.error("Error loading more screenshots:", error);
        } finally {
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        fetchActivityStats(fromDate, toDate);
    }, [fromDate, toDate, fetchActivityStats]);

    useEffect(() => {
        if (isScreenshotModalOpen) {
            fetchScreenshots(screenshotFrom, screenshotTo);
        }
    }, [isScreenshotModalOpen, screenshotFrom, screenshotTo, fetchScreenshots]);

    const handleDeleteScreenshots = async () => {
        if (selectedIds.length === 0) return;
        try {
            await axios.post("/api/track/screenshots/delete", { ids: selectedIds });
            setScreenshots(prev => prev.filter(s => !selectedIds.includes(s.id)));
            setSelectedIds([]);
            api.success({ message: "Deleted", description: "Screenshots removed successfully" });
        } catch (e) {
            api.error({ message: "Error", description: "Failed to delete screenshots" });
        }
    };

    const formatDuration = (mins) => {
        if (!mins || mins === 0) return '0m';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const columns = [
        {
            headerName: 'Application / Detail',
            field: 'title',
            flex: 2,
            minWidth: 400,
            cellRenderer: (params) => {
                const record = params.data;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
                        <div style={{ padding: '6px', backgroundColor: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px' }}>
                            <GlobalOutlined style={{ color: '#3b82f6' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.4', overflow: 'hidden' }}>
                            <Text strong style={{ fontSize: '13px' }} ellipsis>{record.title}</Text>
                            <div className="d-flex align-items-center gap-2">
                                <Text type="secondary" style={{ fontSize: '10px' }}>{record.app}</Text>
                                {record.url && (
                                    <a href={record.url.startsWith('http') ? record.url : `https://${record.url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: '#3b82f6' }} className="text-truncate">
                                        <LinkOutlined style={{ fontSize: '9px' }} /> {record.url}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            headerName: 'Duration',
            field: 'minutes',
            width: 150,
            sortable: true,
            cellRenderer: (params) => <Tag color="blue" className="rounded-pill px-2">{params.value} mins</Tag>
        },
        {
            headerName: 'Activity Level',
            field: 'total_actions',
            width: 200,
            sortable: true,
            cellRenderer: (params) => {
                const record = params.data;
                const totalActions = record.clicks + record.keystrokes;
                const percentage = Math.min(100, (totalActions / 100) * 100);
                return (
                    <div style={{ width: '100%', padding: '0 10px' }}>
                        <Progress 
                            percent={Math.round(percentage)} 
                            size="small" 
                            showInfo={false}
                            strokeColor={percentage > 70 ? '#10b981' : percentage > 30 ? '#3b82f6' : '#f59e0b'}
                        />
                    </div>
                );
            }
        },
        {
            headerName: 'Idle',
            field: 'idle',
            width: 120,
            sortable: true,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center h-100">
                    <Tag color={params.value > 0 ? "orange" : "default"} className="rounded-pill px-2 border-0" style={{ backgroundColor: params.value > 0 ? '#fff7e6' : '#f5f5f5', color: params.value > 0 ? '#fa8c16' : '#bfbfbf' }}>
                        {formatDuration(params.value)}
                    </Tag>
                </div>
            )
        },
        {
            headerName: 'Clicks',
            field: 'clicks',
            width: 100,
            sortable: true,
            cellClass: 'text-center'
        },
        {
            headerName: 'Keys',
            field: 'keystrokes',
            width: 100,
            sortable: true,
            cellClass: 'text-center'
        }
    ];


    const tableData = activityStats ? activityStats.app_usage.map((item, idx) => ({
        key: idx,
        ...item
    })) : [];

    return (
        <>
            {contextHolder}
            <Head title={`Activity Log - ${targetUser.name}`} />
            <div className="container-fluid p-0">
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2"
                style={{
                    position: "sticky",
                    top: "64px",
                    background: "#fff",
                    zIndex: "1"
                }}>
                    <Breadcrumb
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "My Activity" }
                        ]}
                    />
                    <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center gap-1 bg-light border rounded-pill px-3 py-1 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
                            <span className="text-muted small fw-bold">Range:</span>
                            <DatePicker 
                                value={fromDate}
                                onChange={(date) => setFromDate(date)}
                                allowClear={false}
                                format="DD MMM"
                                className="border-0 shadow-none bg-transparent fw-bold"
                                style={{ width: '85px' }}
                            />
                            <span className="text-muted small">→</span>
                            <DatePicker 
                                value={toDate}
                                onChange={(date) => setToDate(date)}
                                placeholder="Select"
                                format="DD MMM"
                                className="border-0 shadow-none bg-transparent fw-bold"
                                style={{ width: '85px' }}
                            />
                        </div>
                        
                        <button 
                            className="btn btn-outline-info btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-1"
                            onClick={() => setIsScreenshotModalOpen(true)}
                        >
                            <PictureOutlined /> Screenshots
                        </button>

                        <button 
                            className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm"
                            onClick={() => fetchActivityStats(fromDate, toDate)}
                            disabled={loading}
                        >
                            {loading ? <SyncOutlined spin /> : <SyncOutlined />} Refresh
                        </button>
                    </div>
                </div>

                <div className="mx-3 mt-4">
                    {/* Side-by-Side: Summary & Productivity Pulse */}
                    <Row gutter={[24, 24]}>
                        {/* Left Column: Compact Summary Cards */}
                        <Col xs={24} lg={8}>
                            <div className="d-flex flex-column gap-3 h-100">
                                <Card className="border-0 shadow-sm overflow-hidden position-relative flex-fill" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', minHeight: '100px' }}>
                                    <div className="position-absolute opacity-10" style={{ right: '-10px', bottom: '-10px', fontSize: '60px' }}><ClockCircleOutlined /></div>
                                    <Statistic 
                                        title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: 'bold' }}>TOTAL ACTIVE TIME</Text>}
                                        value={activityStats ? `${Math.floor(activityStats.total_minutes / 60)}h ${activityStats.total_minutes % 60}m` : '0h 0m'}
                                        valueStyle={{ color: '#fff', fontWeight: '800', fontSize: '24px' }}
                                    />
                                </Card>
                                <Card className="border-0 shadow-sm overflow-hidden position-relative flex-fill" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', minHeight: '100px' }}>
                                    <div className="position-absolute opacity-10" style={{ right: '-10px', bottom: '-10px', fontSize: '60px' }}>
                                        <img src="/uploads/icons/selection.png" alt="Mouse" style={{ width: '60px', filter: 'brightness(0) invert(1)' }} />
                                    </div>
                                    <Statistic 
                                        title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: 'bold' }}>TOTAL MOUSE CLICKS</Text>}
                                        value={activityStats ? activityStats.total_clicks : 0}
                                        valueStyle={{ color: '#fff', fontWeight: '800', fontSize: '24px' }}
                                    />
                                </Card>
                                <Card className="border-0 shadow-sm overflow-hidden position-relative flex-fill" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)', minHeight: '100px' }}>
                                    <div className="position-absolute opacity-10" style={{ right: '-10px', bottom: '-10px', fontSize: '60px' }}>
                                        <img src="/uploads/icons/keyboard.png" alt="Keyboard" style={{ width: '60px', filter: 'brightness(0) invert(1)' }} />
                                    </div>
                                    <Statistic 
                                        title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: 'bold' }}>KEYBOARD STROKES</Text>}
                                        value={activityStats ? activityStats.total_keystrokes : 0}
                                        valueStyle={{ color: '#fff', fontWeight: '800', fontSize: '24px' }}
                                    />
                                </Card>
                                <Card className="border-0 shadow-sm overflow-hidden position-relative flex-fill" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)', minHeight: '100px' }}>
                                    <div className="position-absolute opacity-10" style={{ right: '-10px', bottom: '-10px', fontSize: '60px' }}><ClockCircleOutlined /></div>
                                    <Statistic 
                                        title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: 'bold' }}>TOTAL IDLE TIME</Text>}
                                        value={activityStats ? formatDuration(activityStats.total_idle_minutes) : '0m'}
                                        valueStyle={{ color: '#fff', fontWeight: '800', fontSize: '24px' }}
                                    />
                                </Card>
                            </div>
                        </Col>

                        {/* Right Column: Activity Pulse Chart */}
                        <Col xs={24} lg={16}>
                            <Card 
                                title={
                                    <div className="d-flex align-items-center justify-content-between">
                                        <Title level={5} style={{ margin: 0 }}>
                                            <LineChartOutlined className="text-primary me-2" /> 24-Hour Productivity Pulse
                                        </Title>
                                        <Tag color="blue" className="rounded-pill px-3 border-0" style={{ backgroundColor: '#e6f7ff' }}>Real-time</Tag>
                                    </div>
                                } 
                                className="border-0 shadow-sm overflow-hidden h-100" 
                                style={{ borderRadius: '16px' }}
                            >
                                <div style={{ height: '280px', width: '100%' }}>
                                    {activityStats && activityStats.timeline && Object.keys(activityStats.timeline).length > 0 ? (
                                        <Line 
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { display: false },
                                                    tooltip: {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        titleColor: '#1e293b',
                                                        bodyColor: '#64748b',
                                                        borderColor: '#e2e8f0',
                                                        borderWidth: 1,
                                                        padding: 12,
                                                        cornerRadius: 12,
                                                        displayColors: true,
                                                        callbacks: {
                                                            title: (items) => `${items[0].label}:00 - ${items[0].label}:59`,
                                                            label: (item) => {
                                                                const hour = item.label;
                                                                const stats = activityStats.timeline[hour];
                                                                return [
                                                                    ` Total Actions: ${item.formattedValue}`,
                                                                    ` Clicks: ${stats ? stats.clicks : 0}`,
                                                                    ` Keystrokes: ${stats ? stats.keys : 0}`
                                                                ];
                                                            }
                                                        }
                                                    }
                                                },
                                                scales: {
                                                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                                                    y: { beginAtZero: true, grid: { color: '#f1f5f9', drawBorder: false }, ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 5 } }
                                                },
                                                interaction: { intersect: false, mode: 'index' },
                                                elements: { line: { tension: 0.4 }, point: { radius: 0, hoverRadius: 6, backgroundColor: '#1890ff' } }
                                            }}
                                            data={{
                                                labels: Array.from({ length: 24 }).map((_, i) => String(i).padStart(2, '0')),
                                                datasets: [
                                                    {
                                                        fill: true,
                                                        label: 'Activity Intensity',
                                                        data: Array.from({ length: 24 }).map((_, i) => {
                                                            const hour = String(i).padStart(2, '0');
                                                            const stats = activityStats.timeline[hour];
                                                            return stats ? (stats.clicks + stats.keys) : 0;
                                                        }),
                                                        borderColor: '#1890ff',
                                                        borderWidth: 3,
                                                        backgroundColor: (context) => {
                                                            const chart = context.chart;
                                                            const { ctx, chartArea } = chart;
                                                            if (!chartArea) return null;
                                                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                                            gradient.addColorStop(0, 'rgba(24, 144, 255, 0.2)');
                                                            gradient.addColorStop(1, 'rgba(24, 144, 255, 0)');
                                                            return gradient;
                                                        },
                                                    },
                                                ],
                                            }}
                                        />
                                    ) : (
                                        <div className="h-100 d-flex align-items-center justify-content-center">
                                            <Empty description="No timeline data available" />
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Activity Guide Alert */}
                    <div className="alert alert-info border-0 shadow-sm mt-4 d-flex align-items-center gap-3" style={{ borderRadius: '12px', backgroundColor: '#f0f9ff' }}>
                        <InfoCircleOutlined className="fs-4 text-primary" />
                        <div>
                            <div className="fw-bold text-primary">Understanding Your Activity Metrics</div>
                            <div className="small text-muted">
                                <b>Activity Level:</b> Intensity score based on interactions per minute. 
                                <b> Idle Time:</b> Time when no mouse/keyboard movement is detected for 5 minutes.
                            </div>
                        </div>
                    </div>

                    {/* Content Section - AG Grid Analytics */}
                    <div className="row mt-4 mb-5">
                        <Col span={24}>
                            <Card 
                                title={
                                    <div className="d-flex align-items-center justify-content-between">
                                        <Title level={4} style={{ margin: 0 }}>
                                            <LineChartOutlined className="text-primary me-2" /> Application Usage Analytics
                                        </Title>
                                        <div className="text-muted small">
                                            Total Apps Tracked: <b>{tableData.length}</b>
                                        </div>
                                    </div>
                                }
                                className="border-0 shadow-sm overflow-hidden" 
                                style={{ borderRadius: '16px' }}
                                bodyStyle={{ padding: 0 }}
                            >
                                {loading ? (
                                    <div className="text-center py-5">
                                        <Spin size="large" />
                                        <p className="mt-3 text-muted">Analyzing activity logs...</p>
                                    </div>
                                ) : activityStats && activityStats.total_minutes > 0 ? (
                                    <div className="ag-theme-alpine w-100" style={{ height: '500px' }}>
                                        <AgGridReact
                                            rowData={tableData}
                                            columnDefs={columns}
                                            theme={gridTheme}
                                            defaultColDef={{
                                                ...globalDefaultColDef,
                                                filter: true,
                                                resizable: true,
                                            }}
                                            animateRows={true}
                                            pagination={true}
                                            paginationPageSize={20}
                                            rowHeight={60}
                                        />
                                    </div>
                                ) : (
                                    <div className="py-5 text-center">
                                        <Empty description={<span>No activity data found for the selected period.</span>} />
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </div>



                </div>
            </div>
            
            <style>{`
                .ant-statistic-title {
                    margin-bottom: 8px !important;
                }
                .ant-card {
                    transition: transform 0.3s ease;
                }
                .ant-card:hover {
                    transform: translateY(-2px);
                }
            `}</style>
            {/* Screenshots Modal */}
            <Modal
                title={
                    <div className="d-flex align-items-center justify-content-between pe-4 w-100">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-info bg-opacity-10 p-2 rounded-3">
                                <PictureOutlined className="text-info fs-4" />
                            </div>
                            <div className="d-flex flex-column">
                                <span className="text-dark fw-bold fs-5">Employee Screenshots</span>
                                {totalScreenshots > 0 && (
                                    <span className="text-muted small fw-normal">
                                        Showing {screenshots.length} of {totalScreenshots} images
                                    </span>
                                )}
                            </div>
                            {/* Selection and deletion disabled for now */}
                            {/* {screenshots.length > 0 && (
                                <div className="d-flex gap-2 ms-3">
                                    <button className="btn btn-light btn-sm rounded-pill px-3 border shadow-sm fw-bold" onClick={() => {
                                        setSelectedIds(selectedIds.length === screenshots.length ? [] : screenshots.map(s => s.id));
                                    }}>
                                        {selectedIds.length === screenshots.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    {selectedIds.length > 0 && (
                                        <button className="btn btn-danger btn-sm rounded-pill px-3 shadow-sm fw-bold" onClick={handleDeleteScreenshots}>
                                            <DeleteOutlined className="me-1" /> Delete ({selectedIds.length})
                                        </button>
                                    )}
                                </div>
                            )} */}
                        </div>
                        <div className="d-flex align-items-center gap-1 bg-light border rounded-pill px-2 py-1" style={{ height: '42px' }}>
                            <span className="text-muted small ps-2 fw-bold">From:</span>
                            <DatePicker 
                                value={screenshotFrom}
                                onChange={(date) => setScreenshotFrom(date || dayjs())}
                                allowClear={false}
                                format="DD MMM"
                                className="border-0 shadow-none bg-transparent fw-bold"
                                style={{ width: '85px' }}
                            />
                            <span className="text-muted small fw-bold">To:</span>
                            <DatePicker 
                                value={screenshotTo}
                                onChange={(date) => setScreenshotTo(date)}
                                placeholder="Select"
                                format="DD MMM"
                                className="border-0 shadow-none bg-transparent fw-bold"
                                style={{ width: '85px' }}
                            />
                        </div>
                    </div>
                }
                open={isScreenshotModalOpen}
                onCancel={() => setIsScreenshotModalOpen(false)}
                footer={null}
                width="95%"
                centered
                styles={{
                    body: {
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        height: '75vh',
                        overflowY: 'auto'
                    },
                    content: {
                        height: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '16px',
                        overflow: 'hidden'
                    },
                    mask: {
                        backdropFilter: 'blur(4px)'
                    }
                }}
            >
                {screenshotLoading && screenshots.length === 0 ? (
                    <div className="text-center py-5 h-100 d-flex align-items-center justify-content-center">
                        <SyncOutlined spin className="fs-1 text-primary" />
                    </div>
                ) : (
                    <Image.PreviewGroup
                        preview={{
                            toolbarRender: (_, { transform: { scale }, actions: { onZoomOut, onZoomIn, onRotateLeft, onRotateRight } }) => null,
                            countRender: (current, total) => `${current} / ${total}`,
                        }}
                    >
                        <div className="row g-4">
                            {screenshots.length > 0 ? (
                                screenshots.map((s, idx) => (
                                    <div 
                                        key={`${s.id}-${idx}`} 
                                        className="col-6 col-sm-4 col-md-3 col-lg-2"
                                        ref={screenshots.length === idx + 1 ? lastScreenshotElementRef : null}
                                    >
                                        <div 
                                            className={`card border-0 shadow-sm overflow-hidden h-100 screenshot-card position-relative ${selectedIds.includes(s.id) ? 'border border-primary border-2 shadow' : ''}`} 
                                            style={{ borderRadius: '12px', transition: 'all 0.2s', cursor: 'default', outline: selectedIds.includes(s.id) ? '2px solid #0d6efd' : 'none' }}
                                            /* onClick={() => setSelectedIds(prev => 
                                                prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id]
                                            )} */
                                        >
                                            {/* Selection disabled */}
                                            {/* <div className="position-absolute top-0 start-0 p-2 z-3" style={{ opacity: selectedIds.includes(s.id) ? 1 : 0.7 }}>
                                                <input 
                                                    type="checkbox"
                                                    className="form-check-input shadow-none border-primary border-2"
                                                    checked={selectedIds.includes(s.id)}
                                                    readOnly
                                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                />
                                            </div> */}
                                            <div className="position-relative overflow-hidden" style={{ height: '160px' }}>
                                                <Image 
                                                    src={s.url} 
                                                    className="w-100 h-100" 
                                                    style={{ objectFit: 'cover' }}
                                                    preview={{
                                                        mask: <div className="d-flex align-items-center gap-1"><EyeOutlined /> Zoom</div>
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="position-absolute bottom-0 end-0 bg-dark text-white px-2 py-1 small opacity-75 m-1 rounded" style={{ fontSize: '11px' }}>
                                                    {s.time}
                                                </div>
                                            </div>
                                            <div className="p-2 text-center bg-white border-top">
                                                <div className="text-muted fw-bold" style={{ fontSize: '11px' }}>{s.date}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 py-5 text-center">
                                    <Empty description="No screenshots found for this period" />
                                    <Button type="link" onClick={() => fetchScreenshots(screenshotFrom, screenshotTo)}>Retry Search</Button>
                                </div>
                            )}
                            {isFetchingMore && (
                                <div className="col-12 text-center py-3">
                                    <SyncOutlined spin className="text-primary fs-4" />
                                </div>
                            )}
                        </div>
                    </Image.PreviewGroup>
                )}
            </Modal>
        </>
    );
};

MyActivity.layout = page => <MainLayout children={page} />;

export default MyActivity;
