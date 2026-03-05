import { useState, useEffect, useMemo, useCallback } from "react";
import {
    AgGridReact,
    gridTheme,
    defaultColDef,
    sideBarConfig,
    gridOptionsConfig
} from "@agConfig/AgGridConfig";
import {
    Link,
    Head,
    Breadcrumb,
    DeleteOutlined,
    EyeOutlined,
    Tooltip,
    Popconfirm,
    SyncOutlined
} from "@shared/ui";
import MainLayout from "@layout";
import axios from "axios";
import { notification, Modal, Tag, Image, Select } from "antd";
import { router } from "@inertiajs/react";

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

    // Global Settings
    const [intervalMinutes, setIntervalMinutes] = useState(5);
    const [syncInterval, setSyncInterval] = useState(30);
    const [adminPassword, setAdminPassword] = useState("bidwinners#12");
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [allowedIPs, setAllowedIPs] = useState([]);
    const [newIp, setNewIp] = useState("");

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
            setIntervalMinutes(Math.round(resp.data.screenshot_interval / 60));
            setSyncInterval(resp.data.tracker_sync_interval || 30);
            setAdminPassword(resp.data.tracker_admin_password);
            setAllowedIPs(resp.data.tracker_allowed_ips || []);
        } catch (error) {
            console.error("Error fetching tracker settings:", error);
        }
    };

    const saveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await axios.post("/api/track/settings/update", {
                screenshot_interval: intervalMinutes * 60,
                tracker_sync_interval: syncInterval,
                tracker_admin_password: adminPassword,
                tracker_allowed_ips: allowedIPs
            });
            api.success({
                message: "Settings Updated",
                description: `Settings saved successfully.`,
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

    // Auto-refresh users every 30 seconds
    useEffect(() => {
        fetchSettings(); // Fetch on load
        const interval = setInterval(() => {
            fetchUsers(false);
        }, 30000);
        return () => clearInterval(interval);
    }, [selectedStatus]);

    const handleStatusChange = (value) => {
        setSelectedStatus(value);
        router.get(route('user.tracking'), { status: value }, {
            preserveState: true,
            onSuccess: () => {
            }
        });
    };

    const fetchScreenshots = useCallback(async (userId, d, m, y) => {
        setScreenshotLoading(true);
        setSelectedIds([]); // Reset selection on fetch
        try {
            const response = await axios.get("/api/track/screenshots", {
                params: {
                    user_id: userId,
                    day: d,
                    month: m,
                    year: y
                }
            });
            setScreenshots(response.data);
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

    useEffect(() => {
        if (isScreenshotModalOpen && selectedUser) {
            fetchScreenshots(selectedUser.id, day, month, year);
        }
    }, [isScreenshotModalOpen, selectedUser, day, month, year, fetchScreenshots]);

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
            fetchScreenshots(selectedUser.id, day, month, year);
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
        try {
            await axios.post("/api/track/screenshot/trigger", { user_id: user.id });
            api.success({
                message: "Screenshot Requested",
                description: `A screenshot will be captured from ${user.name}'s machine within 10 seconds. If nothing appears, their Tracker app may not be running.`,
                placement: "topRight",
                duration: 8
            });
        } catch (error) {
            console.error("Error triggering screenshot:", error);
            api.error({
                message: "Error",
                description: "Failed to request screenshot",
                placement: "topRight"
            });
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
                            Online
                        </Tag>
                    ) : (
                        <Tag color="default" className="rounded-pill px-3">
                            <span className="dot me-1" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#bfbfbf' }}></span>
                            Offline
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
            headerName: "Action",
            minWidth: 250,
            cellRenderer: (params) => (
                <div className="d-flex justify-content-center align-items-center h-100 gap-2">
                    <button
                        className="btn btn-primary btn-sm rounded-pill px-3"
                        onClick={() => openScreenshotModal(params.data)}
                    >
                        <EyeOutlined className="me-1" />
                        Screenshots
                    </button>
                    <Tooltip title="Capture screenshot now">
                        <button
                            className="btn btn-warning btn-sm rounded-pill px-2"
                            onClick={() => triggerScreenshot(params.data)}
                        >
                            <i className="bi bi-camera-fill me-1" />
                            Take
                        </button>
                    </Tooltip>
                </div>
            ),
            flex: 1.5
        }
    ], []);

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
                        <button
                            className="btn btn-outline-primary btn-sm d-flex align-items-center rounded-pill px-3 shadow-sm"
                            onClick={() => setIsSettingsModalOpen(true)}
                        >
                            <i className="bi bi-gear-fill me-1"></i>
                            TRACKER SETTINGS
                        </button>
                        <button
                            className="btn btn-primary btn-sm d-flex align-items-center"
                            onClick={() => fetchUsers(true)}
                            disabled={loading}
                        >
                            {loading ? <SyncOutlined spin className="me-1" /> : <i className="bi bi-arrow-clockwise me-1"></i>}
                            Refresh Users
                        </button>
                    </div>
                </div>

                <div className="card mt-4 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="ag-grid-wrapper" >
                            <AgGridReact
                                rowData={users}
                                columnDefs={userColDefs}
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
            </div>

            {/* Screenshot Modal */}
            <Modal
                title={
                    <div className="d-flex align-items-center justify-content-between pe-4 w-100">
                        <div className="d-flex align-items-center gap-3">
                            <span className="text-primary fw-bold fs-5">Screenshots for: {selectedUser?.name}</span>
                            {screenshots.length > 0 && (
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-secondary btn-sm" onClick={selectAll}>
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
                                            <button className="btn btn-danger btn-sm d-flex align-items-center" disabled={deleting}>
                                                {deleting ? <SyncOutlined spin className="me-1" /> : <DeleteOutlined className="me-1" />}
                                                Delete Selected ({selectedIds.length})
                                            </button>
                                        </Popconfirm>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                            <select className="form-select form-select-sm w-auto" value={day} onChange={(e) => setDay(e.target.value)}>
                                {days.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select className="form-select form-select-sm w-auto" value={month} onChange={(e) => setMonth(e.target.value)}>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select className="form-select form-select-sm w-auto" value={year} onChange={(e) => setYear(e.target.value)}>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
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
                                    <div key={s.id} className="col-sm-6 col-md-4 col-lg-3 col-xl-2">
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
                        className="btn btn-link text-muted me-2"
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
                <div className="py-4">
                    <div className="mb-4">
                        <label className="form-label text-muted small fw-bold mb-2">SCREENSHOT INTERVAL</label>
                        <select
                            className="form-select border shadow-sm"
                            value={intervalMinutes}
                            onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
                        >
                            <option value={1}>Every 1 Min</option>
                            <option value={2}>Every 2 Mins</option>
                            <option value={3}>Every 3 Mins</option>
                            <option value={5}>Every 5 Mins</option>
                            <option value={10}>Every 10 Mins</option>
                            <option value={15}>Every 15 Mins</option>
                            <option value={30}>Every 30 Mins</option>
                        </select>
                        <div className="form-text mt-1 small">Frequency of automated screen captures</div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label text-muted small fw-bold mb-2">SETTINGS SYNC FREQUENCY</label>
                        <select
                            className="form-select border shadow-sm"
                            value={syncInterval}
                            onChange={(e) => setSyncInterval(parseInt(e.target.value))}
                        >
                            <option value={10}>Every 10 Seconds</option>
                            <option value={30}>Every 30 Seconds</option>
                            <option value={60}>Every 1 Minute</option>
                            <option value={120}>Every 2 Minutes</option>
                            <option value={300}>Every 5 Minutes</option>
                        </select>
                        <div className="form-text mt-1 small">How often the tracker app checks for settings updates</div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label text-muted small fw-bold mb-2">APP ADMIN PASSWORD</label>
                        <input
                            type="text"
                            className="form-control border shadow-sm"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                        <div className="form-text mt-1 small">Password required for exiting or logging out of the app</div>
                    </div>

                    <div className="border-top pt-4 mt-4">
                        <label className="form-label text-muted small fw-bold mb-2">ALLOWED OFFICE IPs</label>
                        <div className="d-flex gap-2 mb-3">
                            <input
                                type="text"
                                className="form-control border shadow-sm"
                                placeholder="Enter IP Address (e.g. 192.168.1.1)"
                                value={newIp}
                                onChange={(e) => setNewIp(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), newIp && (setAllowedIPs([...allowedIPs, newIp]), setNewIp("")))}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (newIp) {
                                        setAllowedIPs([...allowedIPs, newIp]);
                                        setNewIp("");
                                    }
                                }}
                            >
                                Add
                            </button>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {allowedIPs.length > 0 ? allowedIPs.map((ip, idx) => (
                                <Tag
                                    key={idx}
                                    closable
                                    onClose={() => setAllowedIPs(allowedIPs.filter((_, i) => i !== idx))}
                                    className="px-3 py-1 rounded-pill bg-light border text-dark fw-bold"
                                    style={{ fontSize: '12px' }}
                                >
                                    {ip}
                                </Tag>
                            )) : (
                                <span className="text-muted small italic">No IPs added. Tracking will be disabled for all unless manually permitted.</span>
                            )}
                        </div>
                        <div className="form-text mt-2 small">Users on these IPs will be tracked automatically.</div>
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
