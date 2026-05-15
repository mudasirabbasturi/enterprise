import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    AgGridReact,
    gridTheme,
    defaultColDef,
    sideBarConfig,
    gridOptionsConfig
} from "@agConfig/AgGridConfig";
import { Link, Head, Breadcrumb } from "@shared/ui";
import MainLayout from "@layout";
import axios from "axios";
import {
    notification,
    Modal,
    Tag,
    Image,
    Select,
    DatePicker,
    Badge,
    Progress,
    Switch,
    Card,
    Row,
    Col,
    Statistic,
    Typography,
    Empty,
    Spin,
    Tooltip,
    Popconfirm 
} from "antd";
import {
    LineChartOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    PictureOutlined,
    DeleteOutlined,
    EyeOutlined,
    QuestionCircleOutlined,
    InfoCircleOutlined,
    GlobalOutlined,
    LinkOutlined,
    CameraOutlined
} from '@ant-design/icons';
import { router } from "@inertiajs/react";
import dayjs from "dayjs";
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

const { Title, Text } = Typography;

const UserTracking = ({ users: initialUsers, selectedStatus: initialStatus }) => {
    const [api, contextHolder] = notification.useNotification();
    const [users, setUsers] = useState(initialUsers || []);
    const [selectedStatus, setSelectedStatus] = useState(initialStatus || 'active');
    const [loading, setLoading] = useState(false);

    // Sync users state when initialUsers props change (e.g., after filter)
    useEffect(() => {
        setUsers(initialUsers || []);
    }, [initialUsers]);

    // Screenshot Modal state
    const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [screenshots, setScreenshots] = useState([]);
    const [screenshotLoading, setScreenshotLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);

    // Filters
    const [day, setDay] = useState(new Date().getDate());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [screenshotFrom, setScreenshotFrom] = useState(dayjs());
    const [screenshotTo, setScreenshotTo] = useState(null);
    const [activityFrom, setActivityFrom] = useState(dayjs());
    const [activityTo, setActivityTo] = useState(null);

    // Global Settings
    const [screenshotInterval, setScreenshotInterval] = useState(120);
    const [apiBaseUrl, setApiBaseUrl] = useState("http://127.0.0.1:8000");
    const [syncInterval, setSyncInterval] = useState(5);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [adminPassword, setAdminPassword] = useState("bidwinners");
    const [allowedIPs, setAllowedIPs] = useState([]);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [ipInput, setIpInput] = useState("");

    // Activity state
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityStats, setActivityStats] = useState(null);
    const [takingScreenshotId, setTakingScreenshotId] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [activityLoading, setActivityLoading] = useState(false);
    const takingScreenshotIdRef = useRef(null);
    
    useEffect(() => {
        takingScreenshotIdRef.current = takingScreenshotId;
    }, [takingScreenshotId]);
    
    // Screenshot pagination
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
    const fetchUsers = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const response = await axios.get("/api/track/users", {
                params: { status: selectedStatus }
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            if (showLoading) {
                api.error({
                    message: "Error",
                    description: "Failed to refresh users list",
                    placement: "topRight"
                });
            }
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const resp = await axios.get("/api/track/settings");
            setScreenshotInterval(resp.data.tracker_screenshot_interval || 120);
            setApiBaseUrl(resp.data.tracker_api_url || "http://127.0.0.1:8000");
            setSyncInterval(resp.data.tracker_sync_interval || 5);
            setAdminPassword(resp.data.tracker_admin_password || "bidwinners");
            setAllowedIPs(resp.data.tracker_allowed_ips || []);
        } catch (error) {
            console.error("Error fetching tracker settings:", error);
        }
    };

    const saveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await axios.post("/api/track/settings/update", {
                tracker_screenshot_interval: screenshotInterval,
                tracker_api_url: apiBaseUrl,
                tracker_sync_interval: syncInterval,
                tracker_admin_password: adminPassword,
                tracker_allowed_ips: allowedIPs
            });
            api.success({
                message: "Settings Updated",
                description: `Global tracker settings saved successfully.`,
                placement: "topRight"
            });
        } catch (error) {
            api.error({
                message: "Update Failed",
                description: "Could not save tracker settings",
                placement: "topRight"
            });
        } finally {
            setIsSavingSettings(false);
        }
    };

    useEffect(() => {
        fetchSettings(); // Fetch on load
    }, [selectedStatus]);

    const handleStatusChange = (value) => {
        setSelectedStatus(value);
        router.get(route('user.tracking'), { status: value }, {
            preserveState: true,
            onSuccess: () => {
            }
        });
    };

    const fetchScreenshots = useCallback(async (userId, start, end) => {
        setScreenshotLoading(true);
        setScreenshotsPage(1);
        setSelectedIds([]); // Reset selection on fetch
        try {
            const params = {
                user_id: userId,
                start_date: start ? start.format('YYYY-MM-DD') : undefined,
                end_date: end ? end.format('YYYY-MM-DD') : (start ? start.format('YYYY-MM-DD') : undefined),
                page: 1,
                per_page: 24
            };
            const response = await axios.get("/api/track/screenshots", { params });
            setScreenshots(response.data.data);
            setHasMoreScreenshots(!!response.data.next_page_url);
            setTotalScreenshots(response.data.total || 0);
        } catch (error) {
            console.error("Error fetching screenshots:", error);
            api.error({
                message: "Error",
                description: "Failed to fetch screenshots",
                placement: "topRight"
            });
        } finally {
            setScreenshotLoading(false);
        }
    }, [api]);

    const loadMoreScreenshots = async () => {
        if (!selectedUser || !hasMoreScreenshots || isFetchingMore) return;
        
        setIsFetchingMore(true);
        const nextPage = screenshotsPage + 1;
        try {
            const params = {
                user_id: selectedUser.id,
                start_date: screenshotFrom ? screenshotFrom.format('YYYY-MM-DD') : undefined,
                end_date: screenshotTo ? screenshotTo.format('YYYY-MM-DD') : (screenshotFrom ? screenshotFrom.format('YYYY-MM-DD') : undefined),
                page: nextPage,
                per_page: 24
            };
            const response = await axios.get("/api/track/screenshots", { params });
            setScreenshots(prev => [...prev, ...response.data.data]);
            setScreenshotsPage(nextPage);
            setHasMoreScreenshots(!!response.data.next_page_url);
            setTotalScreenshots(response.data.total || 0);
        } catch (error) {
            console.error("Error loading more screenshots:", error);
        } finally {
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        if (isScreenshotModalOpen && selectedUser) {
            fetchScreenshots(selectedUser.id, screenshotFrom, screenshotTo);
        }
    }, [isScreenshotModalOpen, selectedUser, screenshotFrom, screenshotTo, fetchScreenshots]);

    const openScreenshotModal = (user) => {
        setSelectedUser(user);
        setIsScreenshotModalOpen(true);
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedIds.length === screenshots.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(screenshots.map(s => s.id));
        }
    };

    const deleteSelected = async () => {
        if (selectedIds.length === 0) return;
        setDeleting(true);
        try {
            await axios.post("/api/track/screenshots/delete", { ids: selectedIds });
            api.success({
                message: "Success",
                description: `${selectedIds.length} screenshots deleted successfully`,
                placement: "topRight"
            });
            fetchScreenshots(selectedUser.id, screenshotFrom, screenshotTo);
        } catch (error) {
            console.error("Error deleting screenshots:", error);
            api.error({
                message: "Error",
                description: "Failed to delete screenshots",
                placement: "topRight"
            });
        } finally {
            setDeleting(false);
        }
    };

    const triggerScreenshot = async (user) => {
        setTakingScreenshotId(user.id);
        
        try {
            // 0. Real-time Status Check: Verify if user is actually online right now
            const statusRes = await axios.get(`/api/track/active-status/${user.id}`);
            if (!statusRes.data.active) {
                api.warning({
                    message: "User is Offline",
                    description: `${user.name} has disconnected or shut down. Cannot capture screen.`,
                    placement: "topRight"
                });
                // Update UI to reflect they are now offline
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_online: false } : u));
                setTakingScreenshotId(null);
                return;
            }

            // Get current latest screenshot ID first to compare later (ignores timezone issues)
            let lastScreenshotId = null;
            try {
                const prevRes = await axios.get("/api/track/screenshots", {
                    params: { user_id: user.id, per_page: 1 }
                });
                if (prevRes.data.data && prevRes.data.data.length > 0) {
                    lastScreenshotId = prevRes.data.data[0].id;
                }
            } catch(e) {}

            api.info({
                message: "Capture Requested",
                description: `Sent capture signal to ${user.name}'s computer. Please wait...`,
                placement: "topRight"
            });

            // 1. Trigger the screenshot via API
            await axios.post("/api/track/screenshot/trigger", { user_id: user.id });
            
            // 2. Poll the server to check when the screenshot is uploaded.
            // We loop for a maximum of 7.5 seconds (5 checks).
            let found = false;
            for (let i = 0; i < 5; i++) {
                await new Promise(resolve => setTimeout(resolve, 1500));

                try {
                    const response = await axios.get("/api/track/screenshots", {
                        params: {
                            user_id: user.id,
                            per_page: 1
                        }
                    });
                    const latest = response.data.data ? response.data.data[0] : null;
                    
                    // If we found a new screenshot that has a different ID from the one we started with
                    if (latest && latest.id !== lastScreenshotId) {
                        found = true;
                        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, latest_screenshot: { file_path: latest.url } } : u));
                        setTakingScreenshotId(null);
                        
                        setPreviewImage(latest.url);
                        setIsPreviewVisible(true);
                        
                        api.success({
                            message: "Screenshot Uploaded",
                            description: "Successfully retrieved new screenshot.",
                            placement: "topRight"
                        });
                        break;
                    }
                } catch (e) {}
            }

            if (!found) {
                api.warning({
                    message: "Upload Delayed",
                    description: `The screenshot is taking longer than 7 seconds to upload. It will appear in the grid shortly if the user is online.`,
                    placement: "topRight"
                });
            }
        } catch (error) {
            console.error("Error triggering screenshot:", error);
            api.error({ message: "Error", description: "Failed to request screenshot" });
        } finally {
            // Ensure loading state is eventually cleared
            setTakingScreenshotId(null);
        }
    };

    const togglePermission = async (user, granted) => {
        try {
            await axios.post("/api/track/toggle-permission", {
                user_id: user.id,
                is_permission_granted: granted
            });
            api.success({
                message: "Permission Updated",
                description: `Tracking permission for ${user.name} set to ${granted ? 'ON' : 'OFF'}`,
                placement: "topRight"
            });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_permission_granted: granted } : u));
        } catch (error) {
            api.error({
                message: "Error",
                description: "Failed to update tracking permission",
                placement: "topRight"
            });
        }
    };

    const toggleLogoutRestriction = async (user, restricted) => {
        try {
            await axios.post("/api/track/toggle-logout-restriction", {
                user_id: user.id,
                logout_restriction: restricted
            });
            api.success({
                message: "Security Updated",
                description: `Logout restriction for ${user.name} set to ${restricted ? 'ON' : 'OFF'}`,
                placement: "topRight"
            });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, logout_restriction: restricted } : u));
        } catch (error) {
            api.error({
                message: "Error",
                description: "Failed to update logout restriction",
                placement: "topRight"
            });
        }
    };
    
    const fetchActivityStats = async (userId, start, end) => {
        setActivityLoading(true);
        try {
            const params = {
                user_id: userId,
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
            setActivityLoading(false);
        }
    };

    useEffect(() => {
        if (isActivityModalOpen && selectedUser) {
            fetchActivityStats(selectedUser.id, activityFrom, activityTo);
        }
    }, [isActivityModalOpen, selectedUser, activityFrom, activityTo]);

    const openActivityModal = (user) => {
        setSelectedUser(user);
        setIsActivityModalOpen(true);
    };

    const formatDuration = (mins) => {
        if (!mins || mins === 0) return '0m';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    // User Grid Column Definitions
    const userColDefs = useMemo(() => [
        {
            headerName: "User Name",
            field: "name",
            cellRenderer: (params) => (
                <div className="d-flex align-items-center h-100">
                    <div className="avatar-sm me-2 bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '28px', height: '28px', backgroundColor: '#e7f1ff', fontSize: '12px', fontWeight: 'bold' }}>
                        {params.value ? params.value.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="fw-bold text-dark">{params.value}</span>
                </div>
            ),
            flex: 2
        },
        {
            headerName: "Status",
            field: "is_online",
            cellRenderer: (params) => (
                <div className="d-flex align-items-center h-100">
                    {params.value ? (
                        <Tag color="success" className="rounded-pill px-3">
                            <span className="dot me-1" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#52c41a' }}></span>
                            RUNNING
                        </Tag>
                    ) : (
                        <Tag color="default" className="rounded-pill px-3">
                            <span className="dot me-1" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#bfbfbf' }}></span>
                            OFFLINE
                        </Tag>
                    )}
                </div>
            ),
            flex: 1
        },
        {
            headerName: "Email",
            field: "email",
            flex: 2
        },
        {
            headerName: "WFH Tracking",
            field: "is_permission_granted",
            cellRenderer: (params) => (
                <div className="d-flex align-items-center h-100">
                    <div className="form-check form-switch cursor-pointer">
                        <input
                            className="form-check-input shadow-none"
                            type="checkbox"
                            checked={!!params.value}
                            onChange={(e) => togglePermission(params.data, e.target.checked)}
                            style={{ cursor: 'pointer', width: '38px', height: '20px' }}
                        />
                    </div>
                    <span className={`ms-1 small fw-bold ${params.value ? 'text-primary' : 'text-muted'}`}>
                        {params.value ? 'ALLOWED' : 'OFFICE ONLY'}
                    </span>
                </div>
            ),
            flex: 1.5
        },
        {
            headerName: "Logout Protection",
            field: "logout_restriction",
            cellRenderer: (params) => (
                <div className="d-flex align-items-center h-100">
                    <div className="form-check form-switch cursor-pointer">
                        <input
                            className="form-check-input shadow-none"
                            type="checkbox"
                            checked={params.value !== undefined ? !!params.value : true} // Default to true if undefined
                            onChange={(e) => toggleLogoutRestriction(params.data, e.target.checked)}
                            style={{ cursor: 'pointer', width: '38px', height: '20px' }}
                        />
                    </div>
                    <span className={`ms-1 small fw-bold ${params.value !== false ? 'text-danger' : 'text-success'}`}>
                        {params.value !== false ? 'PROTECTED' : 'FREE'}
                    </span>
                </div>
            ),
            flex: 1.5
        },
        {
            headerName: "Action",
            minWidth: 250,
            pinned: 'right',
            cellRenderer: (params) => (
                <div className="d-flex justify-content-center align-items-center h-100 gap-2">
                    <Tooltip title="View Screenshots">
                        <button
                            className="btn btn-primary btn-sm rounded-pill px-2"
                            onClick={() => openScreenshotModal(params.data)}
                        >
                            <PictureOutlined />
                        </button>
                    </Tooltip>
                    <Tooltip title="View Activity">
                        <button
                            className="btn btn-info btn-sm rounded-pill px-2 text-white"
                            onClick={() => openActivityModal(params.data)}
                        >
                            <LineChartOutlined />
                        </button>
                    </Tooltip>
                    <Tooltip title={params.data.is_online ? "Trigger Remote Screenshot" : "User is Offline"}>
                        <button
                            className="btn btn-warning btn-sm rounded-pill px-3"
                            onClick={() => triggerScreenshot(params.data)}
                            disabled={takingScreenshotId === params.data.id || !params.data.is_online}
                        >
                            {takingScreenshotId === params.data.id ? (
                                <SyncOutlined spin className="me-1" />
                            ) : (
                                <CameraOutlined className="me-1" />
                            )}
                            {takingScreenshotId === params.data.id ? 'Capturing...' : params.data.is_online ? 'Capture' : 'Offline'}
                        </button>
                    </Tooltip>


                </div>
            ),
            flex: 2
        }
    ], [takingScreenshotId]);

    // Activity Grid Column Definitions
    const activityColumns = useMemo(() => [
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
    ], []);

    const activityTableData = activityStats ? activityStats.app_usage.map((item, idx) => ({
        key: idx,
        ...item
    })) : [];

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <>
            {contextHolder}
            <Head title="User Tracking" />
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className="breadCrumb"
                        items={[{ title: <Link href="/">Home</Link> }, { title: "User Tracking" }]}
                    />
                    <div className="d-flex align-items-center gap-3">
                        <Select
                            value={selectedStatus}
                            onChange={handleStatusChange}
                            style={{ width: 150 }}
                            placeholder="Select Status"
                            showSearch
                            options={[
                                { value: "active", label: "Active" },
                                { value: "inactive", label: "In Active" },
                                { value: "suspended", label: "Suspended" },
                                { value: "hold", label: "Hold" },
                                { value: "pending", label: "Pending" },
                            ]}
                            optionFilterProp="label"
                            className="status-select"
                        />
                        <Tooltip title="Refresh Live Status">
                            <button
                                className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center rounded-circle shadow-sm"
                                onClick={() => fetchUsers(true)}
                                style={{ width: '32px', height: '32px' }}
                                disabled={loading}
                            >
                                <SyncOutlined spin={loading} />
                            </button>
                        </Tooltip>
                        <button
                            className="btn btn-outline-primary btn-sm d-flex align-items-center rounded-pill px-3 shadow-sm"
                            onClick={() => setIsSettingsModalOpen(true)}
                        >
                            <i className="bi bi-gear-fill me-1"></i>
                            TRACKER SETTINGS
                        </button>
                        <button
                            className="btn btn-primary btn-sm d-flex align-items-center rounded-pill px-3 shadow-sm"
                            onClick={() => router.visit(route('user.last-screenshots'))}
                        >
                            <i className="bi bi-display me-1"></i>
                            INSTANT MONITOR
                        </button>

                    </div>
                </div>

                <div className="card mt-4 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="ag-grid-wrapper" >
                            <AgGridReact
                                rowData={users}
                                columnDefs={userColDefs}
                                getRowId={(params) => params.data.id.toString()}
                                animateRows={true}
                                defaultColDef={{
                                    ...defaultColDef,
                                    flex: 1,
                                    minWidth: 100,
                                }}
                                theme={gridTheme}
                                pagination={true}
                                paginationPageSize={20}
                                onGridReady={gridOptionsConfig.onGridReady}
                            />
                        </div>
                    </div>
                </div>
                {/* Global Loader for manual screenshot */}
                {takingScreenshotId && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 9999,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <SyncOutlined spin style={{ fontSize: '48px', color: '#1677ff' }} />
                        <div className="mt-3 fw-bold text-primary fs-5">Capturing Screen...</div>
                        <div className="text-muted">Waiting for user machine response</div>
                    </div>
                )}
                {/* Hidden Image for direct popup */}
                <div style={{ display: 'none' }}>
                    <Image
                        src={previewImage}
                        preview={{
                            visible: isPreviewVisible,
                            onVisibleChange: (vis) => setIsPreviewVisible(vis),
                            src: previewImage
                        }}
                    />
                </div>


            </div>

            {/* Screenshot Modal */}
            <Modal
                title={
                    <div className="d-flex align-items-center justify-content-between pe-4 w-100">
                        <div className="d-flex align-items-center gap-3">
                            <div className="d-flex flex-column">
                                <span className="text-primary fw-bold fs-5">Screenshots: {selectedUser?.name}</span>
                                {totalScreenshots > 0 && (
                                    <span className="text-muted small fw-bold">
                                        Showing {screenshots.length} of {totalScreenshots} images
                                    </span>
                                )}
                            </div>
                            {screenshots.length > 0 && (
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={selectAll}>
                                        {selectedIds.length === screenshots.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    {selectedIds.length > 0 && (
                                        <Popconfirm
                                            title="Delete Screenshots"
                                            description={`Are you sure you want to delete ${selectedIds.length} screenshots?`}
                                            onConfirm={deleteSelected}
                                            okText="Yes"
                                            cancelText="No"
                                        >
                                            <button className="btn btn-danger btn-sm d-flex align-items-center rounded-pill px-3" disabled={deleting}>
                                                {deleting ? <SyncOutlined spin className="me-1" /> : <DeleteOutlined className="me-1" />}
                                                Delete ({selectedIds.length})
                                            </button>
                                        </Popconfirm>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="d-flex align-items-center gap-1 bg-white border rounded-pill px-2 py-1 shadow-sm" style={{ height: '38px' }}>
                            <span className="text-muted small ps-2 fw-bold">From:</span>
                            <DatePicker 
                                value={screenshotFrom}
                                onChange={(date) => setScreenshotFrom(date || dayjs())}
                                allowClear={false}
                                format="DD MMM"
                                className="border-0 shadow-none bg-transparent"
                                style={{ width: '85px' }}
                            />
                            <span className="text-muted small fw-bold">To:</span>
                            <DatePicker 
                                value={screenshotTo}
                                onChange={(date) => setScreenshotTo(date)}
                                placeholder="Select"
                                format="DD MMM"
                                className="border-0 shadow-none bg-transparent"
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
                        flexDirection: 'column'
                    }
                }}
            >
                {screenshotLoading ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <SyncOutlined spin style={{ fontSize: '32px' }} />
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
                                        className="col-sm-6 col-md-4 col-lg-3 col-xl-2"
                                        ref={screenshots.length === idx + 1 ? lastScreenshotElementRef : null}
                                    >
                                        <div
                                            className={`card shadow-sm border-0 h-100 screenshot-card position-relative ${selectedIds.includes(s.id) ? 'border border-primary border-2' : ''}`}
                                            style={{ transition: 'all 0.2s', borderRadius: '12px', cursor: 'pointer', outline: selectedIds.includes(s.id) ? '2px solid #0d6efd' : 'none' }}
                                            onClick={() => toggleSelect(s.id)}
                                        >
                                            {/* Selection Checkbox Overlay */}
                                            <div className="position-absolute top-0 start-0 p-2 z-3" style={{ opacity: selectedIds.includes(s.id) ? 1 : 0.7 }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input border-2 border-primary"
                                                    checked={selectedIds.includes(s.id)}
                                                    readOnly
                                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                />
                                            </div>

                                            <div className="position-relative overflow-hidden" style={{ borderRadius: '12px 12px 0 0' }}>
                                                {/* Hidden Ant Design Image for preview group */}
                                                <Image
                                                    src={s.url}
                                                    alt={`Screenshot at ${s.time}`}
                                                    style={{ display: 'none' }}
                                                    preview={{ src: s.url }}
                                                />
                                                {/* Visible thumbnail with click handler to open lightbox */}
                                                <img
                                                    src={s.url}
                                                    alt={`Screenshot at ${s.time}`}
                                                    className="img-fluid w-100"
                                                    style={{ height: '160px', objectFit: 'cover', display: 'block' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Trigger the hidden Ant Design Image preview
                                                        const hiddenImg = e.currentTarget.previousSibling?.querySelector('.ant-image-img, img');
                                                        e.currentTarget.previousSibling?.click();
                                                    }}
                                                />
                                                {/* Hover overlay with zoom icon */}
                                                <div
                                                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center screenshot-hover-overlay"
                                                    style={{ background: 'rgba(0,0,0,0)', transition: 'background 0.2s', borderRadius: '12px 12px 0 0', pointerEvents: 'none' }}
                                                >
                                                    <span style={{ color: 'white', fontSize: '28px', opacity: 0, transition: 'opacity 0.2s' }} className="screenshot-zoom-icon">🔍</span>
                                                </div>
                                                <div
                                                    className="position-absolute bottom-0 end-0 bg-dark text-white px-2 py-1 small opacity-75 m-1 rounded"
                                                    style={{ fontSize: '11px' }}
                                                >
                                                    {s.time}
                                                </div>

                                                {/* Lightbox trigger overlay shown on hover */}
                                                <div
                                                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center screenshot-preview-overlay"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Click the hidden ant-design image to open lightbox
                                                        const antImg = e.currentTarget.parentNode?.querySelector('.ant-image');
                                                        if (antImg) antImg.click();
                                                    }}
                                                    style={{ borderRadius: '12px 12px 0 0' }}
                                                >
                                                    <EyeOutlined style={{ color: 'white', fontSize: '28px' }} className="preview-eye-icon" />
                                                </div>
                                            </div>
                                            <div className="card-body p-2 text-center bg-white" style={{ borderRadius: '0 0 12px 12px' }}>
                                                <span className="text-muted small fw-medium">{s.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-center py-5">
                                    <i className="bi bi-camera-video-off fs-1 text-muted d-block mb-3"></i>
                                    <div className="text-muted fs-5">No screenshots found for this date.</div>
                                    <p className="text-secondary small">Try selecting a different date or check if the tracker app is running.</p>
                                </div>
                            )}
                        </div>
                    </Image.PreviewGroup>
                )}
            </Modal>
            
            {/* Activity Stats Modal */}
            <Modal
                title={
                    <div className="d-flex align-items-center justify-content-between pe-4 w-100">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                                <LineChartOutlined className="text-primary fs-4" />
                            </div>
                            <div className="d-flex flex-column">
                                <span className="text-dark fw-bold fs-5">Activity Dashboard</span>
                                <span className="text-muted small fw-normal">{selectedUser?.name}</span>
                            </div>
                        </div>
                        <div className="d-flex gap-2 align-items-center bg-light border rounded-pill px-3 py-1">
                            <span className="text-muted small fw-bold">From:</span>
                            <DatePicker 
                                value={activityFrom}
                                onChange={(date) => setActivityFrom(date || dayjs())}
                                allowClear={false}
                                format="DD MMM"
                                className="border-0 shadow-none bg-transparent fw-bold"
                                style={{ width: '90px' }}
                            />
                            <span className="text-muted small">→</span>
                            <DatePicker 
                                value={activityTo}
                                onChange={(date) => setActivityTo(date)}
                                allowClear={true}
                                placeholder="End"
                                format="DD MMM"
                                className="border-0 shadow-none bg-transparent fw-bold"
                                style={{ width: '90px' }}
                            />
                        </div>
                    </div>
                }
                open={isActivityModalOpen}
                onCancel={() => setIsActivityModalOpen(false)}
                footer={null}
                width="95%"
                centered
                styles={{
                    body: { padding: '20px', backgroundColor: '#f8f9fa', maxHeight: '85vh', overflowY: 'auto' },
                    content: { borderRadius: '16px', overflow: 'hidden' },
                    mask: { backdropFilter: 'blur(4px)' }
                }}
            >
                {activityLoading ? (
                    <div className="d-flex justify-content-center align-items-center py-5">
                        <div className="text-center">
                            <SyncOutlined spin style={{ fontSize: '40px' }} className="text-primary" />
                            <p className="mt-3 text-muted">Loading activity data...</p>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Side-by-Side: Summary Cards + Chart */}
                        <Row gutter={[16, 16]}>
                            {/* Left: Compact Summary Cards */}
                            <Col xs={24} lg={8}>
                                <div className="d-flex flex-column gap-3 h-100">
                                    <Card className="border-0 shadow-sm overflow-hidden position-relative flex-fill" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', minHeight: '90px' }}>
                                        <div className="position-absolute opacity-10" style={{ right: '-10px', bottom: '-10px', fontSize: '55px' }}><ClockCircleOutlined /></div>
                                        <Statistic
                                            title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 'bold' }}>TOTAL ACTIVE TIME</Text>}
                                            value={activityStats ? `${Math.floor(activityStats.total_minutes / 60)}h ${activityStats.total_minutes % 60}m` : '0h 0m'}
                                            valueStyle={{ color: '#fff', fontWeight: '800', fontSize: '22px' }}
                                        />
                                    </Card>
                                    <Card className="border-0 shadow-sm overflow-hidden position-relative flex-fill" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', minHeight: '90px' }}>
                                        <div className="position-absolute opacity-10" style={{ right: '-10px', bottom: '-10px', fontSize: '55px' }}>
                                            <img src="/uploads/icons/selection.png" alt="Mouse" style={{ width: '55px', filter: 'brightness(0) invert(1)' }} />
                                        </div>
                                        <Statistic
                                            title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 'bold' }}>TOTAL MOUSE CLICKS</Text>}
                                            value={activityStats ? activityStats.total_clicks : 0}
                                            valueStyle={{ color: '#fff', fontWeight: '800', fontSize: '22px' }}
                                        />
                                    </Card>
                                    <Card className="border-0 shadow-sm overflow-hidden position-relative flex-fill" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)', minHeight: '90px' }}>
                                        <div className="position-absolute opacity-10" style={{ right: '-10px', bottom: '-10px', fontSize: '55px' }}>
                                            <img src="/uploads/icons/keyboard.png" alt="Keyboard" style={{ width: '55px', filter: 'brightness(0) invert(1)' }} />
                                        </div>
                                        <Statistic
                                            title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 'bold' }}>KEYBOARD STROKES</Text>}
                                            value={activityStats ? activityStats.total_keystrokes : 0}
                                            valueStyle={{ color: '#fff', fontWeight: '800', fontSize: '22px' }}
                                        />
                                    </Card>
                                    <Card className="border-0 shadow-sm overflow-hidden position-relative flex-fill" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)', minHeight: '90px' }}>
                                        <div className="position-absolute opacity-10" style={{ right: '-10px', bottom: '-10px', fontSize: '55px' }}><ClockCircleOutlined /></div>
                                        <Statistic
                                            title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 'bold' }}>TOTAL IDLE TIME</Text>}
                                            value={activityStats ? formatDuration(activityStats.total_idle_minutes) : '0m'}
                                            valueStyle={{ color: '#fff', fontWeight: '800', fontSize: '22px' }}
                                        />
                                    </Card>
                                </div>
                            </Col>

                            {/* Right: 24h Productivity Pulse Chart */}
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
                                    <div style={{ height: '260px', width: '100%' }}>
                                        {activityStats && activityStats.timeline && Object.keys(activityStats.timeline).length > 0 ? (
                                            <Line
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: { display: false },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(255,255,255,0.95)',
                                                            titleColor: '#1e293b',
                                                            bodyColor: '#64748b',
                                                            borderColor: '#e2e8f0',
                                                            borderWidth: 1,
                                                            padding: 12,
                                                            cornerRadius: 12,
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
                                                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 5 } }
                                                    },
                                                    interaction: { intersect: false, mode: 'index' },
                                                    elements: { line: { tension: 0.4 }, point: { radius: 0, hoverRadius: 6, backgroundColor: '#1890ff' } }
                                                }}
                                                data={{
                                                    labels: Array.from({ length: 24 }).map((_, i) => String(i).padStart(2, '0')),
                                                    datasets: [{
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
                                                            gradient.addColorStop(0, 'rgba(24,144,255,0.2)');
                                                            gradient.addColorStop(1, 'rgba(24,144,255,0)');
                                                            return gradient;
                                                        }
                                                    }]
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

                        {/* Info Alert */}
                        <div className="alert alert-info border-0 shadow-sm mt-3 d-flex align-items-center gap-3" style={{ borderRadius: '12px', backgroundColor: '#f0f9ff' }}>
                            <InfoCircleOutlined className="fs-5 text-primary" />
                            <div className="small text-muted">
                                <b>Activity Level:</b> Intensity score based on interactions per minute.
                                <b className="ms-3">Idle Time:</b> No mouse/keyboard movement detected for 5+ minutes.
                            </div>
                        </div>

                        {/* AG Grid: Application Usage Analytics */}
                        <Card
                            title={
                                <div className="d-flex align-items-center justify-content-between">
                                    <Title level={5} style={{ margin: 0 }}>
                                        <LineChartOutlined className="text-primary me-2" /> Application Usage Analytics
                                    </Title>
                                    <div className="text-muted small">
                                        Total Apps: <b>{activityTableData.length}</b>
                                    </div>
                                </div>
                            }
                            className="border-0 shadow-sm overflow-hidden mt-3"
                            style={{ borderRadius: '16px' }}
                            bodyStyle={{ padding: 0 }}
                        >
                            {activityStats && activityStats.total_minutes > 0 ? (
                                <div className="ag-theme-alpine w-100" style={{ height: '420px' }}>
                                    <AgGridReact
                                        rowData={activityTableData}
                                        columnDefs={activityColumns}
                                        theme={gridTheme}
                                        defaultColDef={{
                                            ...defaultColDef,
                                            filter: true,
                                            resizable: true,
                                        }}
                                        animateRows={true}
                                        pagination={true}
                                        paginationPageSize={15}
                                        rowHeight={60}
                                    />
                                </div>
                            ) : (
                                <div className="py-5 text-center">
                                    <Empty description={<span>No activity data found for the selected period.</span>} />
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </Modal>
            
            {/* Tracker Settings Modal */}
            <Modal
                title={
                    <div className="d-flex align-items-center gap-2 border-bottom pb-3">
                        <i className="bi bi-gear-fill text-primary"></i>
                        <span className="fw-bold">Tracker Global Settings</span>
                    </div>
                }
                open={isSettingsModalOpen}
                onCancel={() => setIsSettingsModalOpen(false)}
                footer={[
                    <button
                        key="cancel"
                        className="btn btn-link text-muted me-2 text-decoration-none"
                        onClick={() => setIsSettingsModalOpen(false)}
                    >
                        Cancel
                    </button>,
                    <button
                        key="save"
                        className="btn btn-primary px-4 rounded-pill shadow-sm"
                        onClick={() => {
                            saveSettings();
                            setIsSettingsModalOpen(false);
                        }}
                        disabled={isSavingSettings}
                    >
                        {isSavingSettings ? <SyncOutlined spin /> : 'Apply To All'}
                    </button>
                ]}
                centered
                width={500}
            >
                <div className="py-3">
                    <div className="row g-3 mb-4">
                        <div className="col-md-6">
                            <label className="form-label text-muted small fw-bold mb-1">SCREENSHOT INTERVAL (SEC)</label>
                            <input
                                type="number"
                                className="form-control border shadow-sm"
                                value={screenshotInterval}
                                onChange={(e) => setScreenshotInterval(parseInt(e.target.value) || 0)}
                                min={10}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label text-muted small fw-bold mb-1">SYNC INTERVAL (SEC)</label>
                            <input
                                type="number"
                                className="form-control border shadow-sm"
                                value={syncInterval}
                                onChange={(e) => setSyncInterval(parseInt(e.target.value) || 0)}
                                min={1}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label text-muted small fw-bold mb-1">API BASE URL</label>
                        <input
                            type="text"
                            className="form-control border shadow-sm"
                            value={apiBaseUrl}
                            onChange={(e) => setApiBaseUrl(e.target.value)}
                            placeholder="http://..."
                            disabled={true}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label text-muted small fw-bold mb-1">APP ADMIN PASSWORD</label>
                        <input
                            type="text"
                            className="form-control border shadow-sm"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>
                    
                    <div className="border-top pt-4 mt-4">
                        <label className="form-label text-muted small fw-bold mb-2">ALLOWED OFFICE IPs</label>
                        <div className="d-flex gap-2 mb-3">
                            <input
                                type="text"
                                className="form-control border shadow-sm"
                                placeholder="Enter IP (e.g. 192.168.1.1)"
                                value={ipInput}
                                onChange={(e) => setIpInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        if (ipInput.trim() && !allowedIPs.includes(ipInput.trim())) {
                                            setAllowedIPs([...allowedIPs, ipInput.trim()]);
                                            setIpInput("");
                                        }
                                        e.preventDefault();
                                    }
                                }}
                            />
                            <button 
                                className="btn btn-primary px-3 shadow-sm"
                                onClick={() => {
                                    if (ipInput.trim() && !allowedIPs.includes(ipInput.trim())) {
                                        setAllowedIPs([...allowedIPs, ipInput.trim()]);
                                        setIpInput("");
                                    }
                                }}
                            >
                                Add
                            </button>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {allowedIPs.map((ip, idx) => (
                                <Tag key={idx} closable onClose={() => setAllowedIPs(allowedIPs.filter((_, i) => i !== idx))} color="blue">
                                    {ip}
                                </Tag>
                            ))}
                            {allowedIPs.length === 0 && <span className="text-muted small italic">No IPs restricted. Tracking allowed everywhere.</span>}
                        </div>
                    </div>
                </div>
            </Modal>
            <style>{`
                .hover-opacity-100:hover {
                    opacity: 1 !important;
                }
                .screenshot-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 15px rgba(0,0,0,0.1) !important;
                }
                .screenshot-card:hover .screenshot-preview-overlay {
                    background: rgba(0, 0, 0, 0.45);
                    cursor: zoom-in;
                }
                .screenshot-preview-overlay {
                    background: rgba(0, 0, 0, 0);
                    transition: background 0.2s ease;
                }
                .preview-eye-icon {
                    opacity: 0;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                    transform: scale(0.8);
                }
                .screenshot-card:hover .preview-eye-icon {
                    opacity: 1;
                    transform: scale(1);
                }
            `}</style>
        </>
    );
};

UserTracking.layout = (page) => <MainLayout children={page} />;

export default UserTracking;