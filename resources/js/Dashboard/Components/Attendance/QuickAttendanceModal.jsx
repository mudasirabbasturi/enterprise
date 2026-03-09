import { useState, useEffect, useCallback } from "react";
import {
    Modal,
    Tag,
    Select,
    Button,
    notification,
    dayjs,
    router,
    LoginOutlined,
    LogoutOutlined,
    PlusCircleOutlined,
    DeleteOutlined,
    HomeOutlined,
    ApartmentOutlined,
    EditOutlined,
    Typography,
    Space,
    usePage
} from "@shared/ui";

const { Text } = Typography;

const QuickAttendanceModal = ({ open, onCancel, initialRecord = null, initialConfig = null, initialSchedules = null, onSuccess }) => {
    const { props } = usePage();
    const user = props.auth.user;
    const [api, contextHolder] = notification.useNotification();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [currentActionRecord, setCurrentActionRecord] = useState(null);
    const [workedFrom, setWorkedFrom] = useState('office');
    const [config, setConfig] = useState(initialConfig);
    const [userShiftSchedules, setUserShiftSchedules] = useState(initialSchedules);

    const fetchTodayAttendance = useCallback(async () => {
        setFetching(true);
        try {
            const response = await axios.get(route('get-today-attendance'));
            const { attendance, userShiftSchedules, config, date_context } = response.data;

            setConfig(config);
            setUserShiftSchedules(userShiftSchedules);

            if (attendance) {
                setCurrentActionRecord(attendance);
                setWorkedFrom(attendance.worked_from || 'office');
            } else {
                const dayName = dayjs(date_context).format('dddd');
                const hasShift = (userShiftSchedules || []).some(s => s.day === dayName);

                let status = 'Not Marked';
                if (!hasShift) status = 'Weekend';

                setCurrentActionRecord({
                    date: date_context,
                    status: status,
                    isPlaceholder: true,
                    total_outside_hours: []
                });
            }
        } catch (error) {
            console.error(error);
            api.error({ message: "Failed to fetch attendance data" });
        } finally {
            setFetching(false);
        }
    }, [api]);

    useEffect(() => {
        if (open) {
            if (initialRecord) {
                setCurrentActionRecord(initialRecord);
                setWorkedFrom(initialRecord.worked_from || 'office');
                if (!config || !userShiftSchedules) {
                    axios.get(route('get-today-attendance')).then(res => {
                        if (!config) setConfig(res.data.config);
                        if (!userShiftSchedules) setUserShiftSchedules(res.data.userShiftSchedules);
                    });
                }
            } else {
                fetchTodayAttendance();
            }
        }
    }, [open, initialRecord, fetchTodayAttendance]);

    const formatManualTime = (timeStr) => {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(':').map(Number);
        return `${h}h ${m}m`;
    };

    const getHoursMins = (record) => {
        const { check_in, check_out, break_start, break_end } = record;
        if (!check_in || !check_out) return 0;

        const start = dayjs(`2000-01-01 ${check_in}`);
        const end = dayjs(`2000-01-01 ${check_out}`);

        let workMins = end.diff(start, 'minute');
        if (workMins < 0) workMins += 1440;

        if (break_start && break_end) {
            const bStart = dayjs(`2000-01-01 ${break_start}`);
            const bEnd = dayjs(`2000-01-01 ${break_end}`);
            let breakMins = bEnd.diff(bStart, 'minute');
            if (breakMins < 0) breakMins += 1440;
            workMins -= breakMins;
        }
        return workMins > 0 ? workMins : 0;
    };

    const calculateHours = (record) => {
        const workMins = getHoursMins(record);
        if (workMins <= 0) return "0h 0m";
        const hrs = Math.floor(workMins / 60);
        const mins = Math.round(workMins % 60);
        return `${hrs}h ${mins}m`;
    };

    const validateIpAccess = async (type = 'regular') => {
        let needsCheck = false;
        if (type === 'regular') {
            needsCheck = workedFrom === 'office';
        } else {
            const entries = currentActionRecord?.total_outside_hours || [];
            needsCheck = entries.some(e => (e.work_from || 'office') === 'office');
        }

        if (!user.ip_restriction || !needsCheck) return true;

        try {
            const response = await axios.get(route('get-current-ip'));
            const currentIp = response.data.ip;

            let allowedIps = config?.user_attendace_allowed_ips || [];
            if (typeof allowedIps === 'string') {
                try { allowedIps = JSON.parse(allowedIps); } catch (e) { allowedIps = []; }
            }
            if (!Array.isArray(allowedIps)) allowedIps = [];

            if (!allowedIps.includes(currentIp)) {
                api.error({
                    message: "Access Denied",
                    description: `Your current IP (${currentIp}) is not authorized for ${type === 'manual' ? 'manual' : 'regular'} office attendance.`,
                    placement: "topRight"
                });
                return false;
            }
            return true;
        } catch (error) {
            api.error({
                message: "IP Verification Failed",
                description: "Could not verify your IP address.",
                placement: "topRight"
            });
            return false;
        }
    };

    const handleCheckIn = async (date) => {
        const isAllowed = await validateIpAccess();
        if (!isAllowed) return;

        setLoading(true);
        axios.post(route('users-attendance.store'), {
            user_id: user.id,
            date: date,
            status: 'present',
            check_in: dayjs().format('HH:mm:ss'),
            worked_from: workedFrom,
        }).then(() => {
            api.success({ message: "Checked In Successfully" });
            if (onSuccess) onSuccess();
            else router.reload();
        }).catch(err => {
            api.error({ message: "Check In Failed", description: err.response?.data?.message || "Internal Error" });
        }).finally(() => setLoading(true)); // Keep loading true until success closes modal or reloads
    };

    const handleCheckOut = async (record) => {
        const isAllowed = await validateIpAccess();
        if (!isAllowed) return;

        setLoading(true);
        axios.put(route('users-attendance.update', record.id), {
            ...record,
            check_out: dayjs().format('HH:mm:ss'),
            worked_from: workedFrom,
        }).then(() => {
            api.success({ message: "Checked Out Successfully" });
            if (onSuccess) onSuccess();
            else router.reload();
        }).catch(err => {
            api.error({ message: "Check Out Failed", description: err.response?.data?.message || "Internal Error" });
        }).finally(() => setLoading(true));
    };

    const handleBreakStart = async (record) => {
        const isAllowed = await validateIpAccess();
        if (!isAllowed) return;

        setLoading(true);
        axios.put(route('users-attendance.update', record.id), {
            ...record,
            break_start: dayjs().format('HH:mm:ss'),
            worked_from: workedFrom,
        }).then(() => {
            api.success({ message: "Break Started" });
            if (onSuccess) onSuccess();
            else router.reload();
        }).catch(err => {
            api.error({ message: "Failed", description: err.response?.data?.message });
        }).finally(() => setLoading(true));
    };

    const handleBreakEnd = async (record) => {
        const isAllowed = await validateIpAccess();
        if (!isAllowed) return;

        setLoading(true);
        axios.put(route('users-attendance.update', record.id), {
            ...record,
            break_end: dayjs().format('HH:mm:ss'),
            worked_from: workedFrom,
        }).then(() => {
            api.success({ message: "Break Ended" });
            if (onSuccess) onSuccess();
            else router.reload();
        }).catch(err => {
            api.error({ message: "Failed", description: err.response?.data?.message });
        }).finally(() => setLoading(true));
    };

    const handleSaveManualHours = async () => {
        const isAllowed = await validateIpAccess('manual');
        if (!isAllowed) return;
        setLoading(true);
        const url = currentActionRecord.isPlaceholder ? route('users-attendance.store') : route('users-attendance.update', currentActionRecord.id);
        const method = currentActionRecord.isPlaceholder ? 'post' : 'put';

        let finalStatus = currentActionRecord.status;
        if (currentActionRecord.status === 'Not Marked' || currentActionRecord.status === 'Weekend' || currentActionRecord.status === 'Holiday') {
            finalStatus = 'present';
        }

        axios[method](url, {
            ...currentActionRecord,
            user_id: user.id,
            status: finalStatus,
            worked_from: workedFrom,
            manual_hours_save: true,
        }).then(response => {
            api.success({ message: "Outside Hours Saved" });
            if (onSuccess) onSuccess();
            else router.reload();
        }).catch(err => {
            api.error({ message: "Failed", description: err.response?.data?.message || "Failed to save hours" });
        }).finally(() => setLoading(true));
    };

    const handleSaveAllChanges = async () => {
        const isAllowed = await validateIpAccess('regular');
        if (!isAllowed) return;
        setLoading(true);
        axios.put(route('users-attendance.update', currentActionRecord.id), {
            ...currentActionRecord,
            worked_from: workedFrom
        })
            .then(response => {
                api.success({ message: "Attendance Updated Successfully" });
                if (onSuccess) onSuccess();
                else router.reload();
            })
            .catch(err => {
                api.error({ message: "Update Failed", description: err.response?.data?.message });
            })
            .finally(() => setLoading(true));
    };

    return (
        <Modal
            title={<Space><EditOutlined /> Manage Attendance - {currentActionRecord?.date}</Space>}
            open={open}
            onCancel={onCancel}
            footer={null}
            centered
            width={400}
        >
            {contextHolder}
            {fetching ? (
                <div className="text-center p-4">Loading Attendance Data...</div>
            ) : currentActionRecord ? (
                <div className="p-2">
                    <div className="mb-4 text-center">
                        <Tag color="blue" className="px-3 py-1 mb-2" style={{ fontSize: '14px' }}>
                            Status: {currentActionRecord.status.toUpperCase()}
                        </Tag>
                    </div>

                    <div className="d-grid gap-3">
                        <div className="row g-2">
                            <div className="col-12 mb-2">
                                <label className="fw-bold small text-muted">Worked From</label>
                                <Select
                                    defaultValue="office"
                                    style={{ width: '100%' }}
                                    value={workedFrom}
                                    onChange={(val) => setWorkedFrom(val)}
                                    options={[
                                        { label: 'Office', value: 'office' },
                                        { label: 'Home', value: 'home' }
                                    ]}
                                    disabled={['Weekend', 'Holiday'].includes(currentActionRecord.status) && !currentActionRecord.check_in}
                                />
                            </div>
                        </div>

                        {/* Regular Attendance Section */}
                        <div className={`border rounded p-3 ${['Weekend', 'Holiday'].includes(currentActionRecord.status) ? 'bg-secondary-subtle opacity-75' : 'bg-light'}`}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="fw-bold small text-muted">Regular Attendance (Shift)</label>
                                {currentActionRecord.status === 'Weekend' && <Tag color="warning">Weekend</Tag>}
                                {currentActionRecord.status === 'Holiday' && <Tag color="magenta">Holiday</Tag>}
                            </div>
                            {['Weekend', 'Holiday'].includes(currentActionRecord.status) ? (
                                <div className="d-flex flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-1">
                                        <small className="text-muted">Check In:</small>
                                        {currentActionRecord.check_in ? <Tag color="cyan">{currentActionRecord.check_in}</Tag> : <small className="text-muted fst-italic">—</small>}
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                        <small className="text-muted">Break:</small>
                                        {currentActionRecord.break_start ? <Tag color="orange">{currentActionRecord.break_start} → {currentActionRecord.break_end || '…'}</Tag> : <small className="text-muted fst-italic">—</small>}
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                        <small className="text-muted">Check Out:</small>
                                        {currentActionRecord.check_out ? <Tag color="blue">{currentActionRecord.check_out}</Tag> : <small className="text-muted fst-italic">—</small>}
                                    </div>
                                </div>
                            ) : !currentActionRecord.check_in ? (
                                <button
                                    className="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center"
                                    disabled={loading}
                                    onClick={() => handleCheckIn(currentActionRecord.date)}
                                >
                                    <LoginOutlined className="me-2" /> Check In
                                </button>
                            ) : !currentActionRecord.check_out ? (
                                <>
                                    <div className="row g-2 mb-2">
                                        <div className="col-6">
                                            <button
                                                className="btn btn-warning w-100 py-2"
                                                disabled={!!currentActionRecord.break_start || loading}
                                                onClick={() => handleBreakStart(currentActionRecord)}
                                            >
                                                Break Start
                                            </button>
                                        </div>
                                        <div className="col-6">
                                            <button
                                                className="btn btn-warning w-100 py-2"
                                                disabled={!currentActionRecord.break_start || !!currentActionRecord.break_end || loading}
                                                onClick={() => handleBreakEnd(currentActionRecord)}
                                            >
                                                Break End
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-danger w-100 py-2 d-flex align-items-center justify-content-center"
                                        disabled={loading}
                                        onClick={() => handleCheckOut(currentActionRecord)}
                                    >
                                        <LogoutOutlined className="me-2" /> Check Out
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-1">
                                    <Tag color="blue">Regular Shift Completed</Tag>
                                </div>
                            )}
                        </div>

                        {/* Outside Hours Section */}
                        <div className="border rounded p-3">
                            <label className="fw-bold small text-muted d-block mb-2">Manual Outside Hours</label>
                            {Array.isArray(currentActionRecord.total_outside_hours) && currentActionRecord.total_outside_hours.map((entry, idx) => (
                                <div key={idx} className="bg-light p-2 rounded mb-3 border position-relative">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <Tag color={entry.status === 'approved' ? 'success' : 'warning'} className="m-0 py-1 px-2 fw-bold" style={{ fontSize: '10px' }}>
                                            {entry.status === 'approved' ? 'APPROVED' : 'PENDING'}
                                        </Tag>
                                        <div className="d-flex align-items-center gap-2">
                                            <Select
                                                showSearch
                                                placeholder="HH"
                                                style={{ width: '70px' }}
                                                value={entry.manual_hours?.split(':')[0] || '00'}
                                                onChange={(val) => {
                                                    const updated = [...currentActionRecord.total_outside_hours];
                                                    const mm = entry.manual_hours?.split(':')[1] || '00';
                                                    updated[idx] = { ...entry, manual_hours: `${val}:${mm}` };
                                                    setCurrentActionRecord({ ...currentActionRecord, total_outside_hours: updated });
                                                }}
                                                options={Array.from({ length: 24 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i.toString().padStart(2, '0') }))}
                                                disabled={entry.status === 'approved'}
                                            />
                                            <span className="fw-bold">:</span>
                                            <Select
                                                showSearch
                                                placeholder="mm"
                                                style={{ width: '70px' }}
                                                value={entry.manual_hours?.split(':')[1] || '00'}
                                                onChange={(val) => {
                                                    const updated = [...currentActionRecord.total_outside_hours];
                                                    const hh = entry.manual_hours?.split(':')[0] || '00';
                                                    updated[idx] = { ...entry, manual_hours: `${hh}:${val}` };
                                                    setCurrentActionRecord({ ...currentActionRecord, total_outside_hours: updated });
                                                }}
                                                options={Array.from({ length: 60 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i.toString().padStart(2, '0') }))}
                                                disabled={entry.status === 'approved'}
                                            />
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Select
                                            style={{ flex: 1 }}
                                            value={entry.work_from || 'office'}
                                            onChange={(val) => {
                                                const updated = [...currentActionRecord.total_outside_hours];
                                                updated[idx] = { ...entry, work_from: val };
                                                setCurrentActionRecord({ ...currentActionRecord, total_outside_hours: updated });
                                            }}
                                            options={[{ label: 'Office', value: 'office' }, { label: 'Home', value: 'home' }]}
                                            disabled={entry.status === 'approved'}
                                        />
                                        <button
                                            className="btn btn-outline-danger btn-sm p-1 border-0"
                                            onClick={() => {
                                                const updated = currentActionRecord.total_outside_hours.filter((_, i) => i !== idx);
                                                setCurrentActionRecord({ ...currentActionRecord, total_outside_hours: updated });
                                            }}
                                            disabled={entry.status === 'approved'}
                                        >
                                            <DeleteOutlined />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="text-center mb-3">
                                <button
                                    className="btn btn-outline-primary btn-sm w-100"
                                    onClick={() => {
                                        const entry = { manual_hours: "00:00", work_from: "office", status: "pending" };
                                        const existing = Array.isArray(currentActionRecord.total_outside_hours) ? currentActionRecord.total_outside_hours : [];
                                        setCurrentActionRecord({ ...currentActionRecord, total_outside_hours: [...existing, entry] });
                                    }}
                                >
                                    <PlusCircleOutlined className="me-1" /> Add Manual Session
                                </button>
                            </div>
                            <button
                                className="btn btn-success w-100 py-2"
                                disabled={loading || !Array.isArray(currentActionRecord.total_outside_hours) || currentActionRecord.total_outside_hours.length === 0}
                                onClick={handleSaveManualHours}
                            >
                                Save All Outside Hours
                            </button>
                        </div>

                        {/* Status Override for Edit Mode */}
                        {(currentActionRecord.check_out || !dayjs(currentActionRecord.date).isSame(dayjs(), 'day')) && (
                            <div className="border-top pt-3 mt-2">
                                <div className="mb-3">
                                    <label className="fw-bold small text-muted d-block mb-1">Total Regular Hours (Read-only)</label>
                                    <div className="bg-light border rounded px-3 py-2 fw-bold text-primary">
                                        {currentActionRecord.total_regular_hours ? formatManualTime(currentActionRecord.total_regular_hours) : (calculateHours(currentActionRecord) || "-")}
                                    </div>
                                </div>
                                <button
                                    className="btn btn-primary w-100 mt-2"
                                    disabled={loading}
                                    onClick={handleSaveAllChanges}
                                >
                                    Save All Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center p-4">No record found.</div>
            )}
        </Modal>
    );
};

export default QuickAttendanceModal;
