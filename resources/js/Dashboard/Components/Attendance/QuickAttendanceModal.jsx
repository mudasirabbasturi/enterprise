import { useState, useEffect, useCallback } from "react";
import {
    Modal,
    Tag,
    Select,
    notification,
    dayjs,
    LoginOutlined,
    LogoutOutlined,
    EditOutlined,
    Space,
    usePage
} from "@shared/ui";

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
            const clientDate = dayjs().format('YYYY-MM-DD');
            const response = await axios.get(route('get-today-attendance', { client_date: clientDate }));
            const { attendance, userShiftSchedules, config, date_context } = response.data;

            setConfig(config);
            setUserShiftSchedules(userShiftSchedules);

            if (attendance) {
                setCurrentActionRecord(attendance);
                const clock = Array.isArray(attendance.clock) ? attendance.clock : [];
                const lastEntry = clock.length > 0 ? clock[clock.length - 1] : null;
                setWorkedFrom(lastEntry?.work_from || 'office');
            } else {
                const dayName = dayjs(date_context).format('dddd');
                const hasShift = (userShiftSchedules || []).some(s => s.day === dayName);

                let status = 'Not Marked';
                if (!hasShift) status = 'Weekend';

                setCurrentActionRecord({
                    date: date_context,
                    status: status,
                    isPlaceholder: true,
                    clock: []
                });
                setWorkedFrom('office');
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
            fetchTodayAttendance();
        }
    }, [open, fetchTodayAttendance]);

    const formatManualTime = (timeStr) => {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(':').map(Number);
        return `${h}h ${m}m`;
    };

    const getBreakMinsForSegment = (breakObj) => {
        if (!breakObj) return 0;
        let total = 0;
        if (breakObj.break_start && breakObj.break_end) {
            const s = dayjs(`2000-01-01 ${breakObj.break_start}`);
            const e = dayjs(`2000-01-01 ${breakObj.break_end}`);
            let diff = e.diff(s, 'minute');
            if (diff < 0) diff += 1440;
            total += diff;
        }
        let i = 2;
        while (breakObj[`break_start_${i}`]) {
            if (breakObj[`break_end_${i}`]) {
                const s = dayjs(`2000-01-01 ${breakObj[`break_start_${i}`]}`);
                const e = dayjs(`2000-01-01 ${breakObj[`break_end_${i}`]}`);
                let diff = e.diff(s, 'minute');
                if (diff < 0) diff += 1440;
                total += diff;
            }
            i++;
        }
        return total;
    };

    const getHoursMins = (record) => {
        if (!record.clock || !Array.isArray(record.clock)) return 0;
        let totalMins = 0;

        record.clock.forEach(entry => {
            const { check_in, check_out, break: breakObj } = entry;
            if (!check_in || !check_out) return;

            const start = dayjs(`2000-01-01 ${check_in}`);
            const end = dayjs(`2000-01-01 ${check_out}`);

            let workMins = end.diff(start, 'minute');
            if (workMins < 0) workMins += 1440;

            if (breakObj) {
                workMins -= getBreakMinsForSegment(breakObj);
            }
            totalMins += Math.max(0, workMins);
        });
        return totalMins;
    };

    const calculateHours = (record) => {
        const workMins = getHoursMins(record);
        if (workMins <= 0) return "0h 0m";
        const hrs = Math.floor(workMins / 60);
        const mins = Math.round(workMins % 60);
        return `${hrs}h ${mins}m`;
    };

    const getBreakMins = (record) => {
        if (!record.clock || !Array.isArray(record.clock)) return 0;
        let totalBreakMins = 0;
        record.clock.forEach(entry => {
            if (entry.break) {
                totalBreakMins += getBreakMinsForSegment(entry.break);
            }
        });
        return totalBreakMins;
    };

    const formatBreakDuration = (record) => {
        const mins = getBreakMins(record);
        if (mins <= 0) return "0h 0m";
        const hrs = Math.floor(mins / 60);
        const rem = Math.round(mins % 60);
        return `${hrs}h ${rem}m`;
    };

    const formatMinsToHrs = (totalMins) => {
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return `${hrs}h ${mins}m`;
    };

    const validateIpAccess = async () => {
        if (!user.ip_restriction || workedFrom === 'home') return true;

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
                    description: `Your current IP (${currentIp}) is not authorized for office attendance.`,
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
            type: 'check_in',
            check_in: dayjs().format('HH:mm:ss'),
            work_from: workedFrom,
        }).then(() => {
            api.success({ message: "Checked In Successfully" });
            fetchTodayAttendance();
            if (onSuccess) onSuccess();
        }).catch(err => {
            api.error({ message: "Check In Failed", description: err.response?.data?.message || "Internal Error" });
        }).finally(() => setLoading(false));
    };

    const handleCheckOut = async (record) => {
        const isAllowed = await validateIpAccess();
        if (!isAllowed) return;

        setLoading(true);
        axios.put(route('users-attendance.update', record.id), {
            user_id: user.id,
            date: record.date,
            type: 'check_out',
            check_out: dayjs().format('HH:mm:ss'),
            work_from: workedFrom,
        }).then(() => {
            api.success({ message: "Checked Out Successfully" });
            fetchTodayAttendance();
            if (onSuccess) onSuccess();
        }).catch(err => {
            api.error({ message: "Check Out Failed", description: err.response?.data?.message || "Internal Error" });
        }).finally(() => setLoading(false));
    };

    const handleBreakStart = async (record) => {
        const isAllowed = await validateIpAccess();
        if (!isAllowed) return;

        setLoading(true);
        axios.put(route('users-attendance.update', record.id), {
            user_id: user.id,
            date: record.date,
            type: 'break_start',
            break_start: dayjs().format('HH:mm:ss'),
            work_from: workedFrom,
        }).then(() => {
            api.success({ message: "Break Started" });
            fetchTodayAttendance();
            if (onSuccess) onSuccess();
        }).catch(err => {
            api.error({ message: "Failed", description: err.response?.data?.message });
        }).finally(() => setLoading(false));
    };

    const handleBreakEnd = async (record) => {
        const isAllowed = await validateIpAccess();
        if (!isAllowed) return;

        setLoading(true);
        axios.put(route('users-attendance.update', record.id), {
            user_id: user.id,
            date: record.date,
            type: 'break_end',
            break_end: dayjs().format('HH:mm:ss'),
            work_from: workedFrom,
        }).then(() => {
            api.success({ message: "Break Ended" });
            fetchTodayAttendance();
            if (onSuccess) onSuccess();
        }).catch(err => {
            api.error({ message: "Failed", description: err.response?.data?.message });
        }).finally(() => setLoading(false));
    };

    return (
        <Modal
            title={<Space><EditOutlined /> Quick Attendance - {currentActionRecord?.date}</Space>}
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
                                    style={{ width: '100%' }}
                                    value={workedFrom}
                                    disabled={currentActionRecord?.date === dayjs().subtract(1, 'day').format('YYYY-MM-DD') || (currentActionRecord && (() => {
                                        const clock = Array.isArray(currentActionRecord.clock) ? currentActionRecord.clock : [];
                                        const lastEntry = clock.length > 0 ? clock[clock.length - 1] : null;
                                        return lastEntry && !lastEntry.check_out;
                                    })())}
                                    onChange={(val) => setWorkedFrom(val)}
                                    options={[
                                        { label: 'Office', value: 'office' },
                                        { label: 'Home', value: 'home' }
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="border rounded p-3 bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="m-0 fw-bold">Daily Activities</h6>
                                <Tag color="cyan">{calculateHours(currentActionRecord)} total</Tag>
                            </div>

                            <div className="d-grid gap-2">
                                {(() => {
                                    const clock = Array.isArray(currentActionRecord.clock) ? currentActionRecord.clock : [];
                                    const lastEntry = clock.length > 0 ? clock[clock.length - 1] : null;
                                    let isRunning = lastEntry && !lastEntry.check_out;

                                    if (isRunning && lastEntry.check_in) {
                                        const bufferHours = parseFloat(config?.attendance_late_checkout_max_hours || 0.5);
                                        const maxMinutes = (8.5 + bufferHours) * 60;
                                        const checkInTime = dayjs(`${currentActionRecord.date} ${lastEntry.check_in}`);
                                        const elapsedMinutes = dayjs().diff(checkInTime, 'minute');
                                        if (elapsedMinutes > maxMinutes) {
                                            isRunning = false; // Treaty as not running if expired
                                        }
                                    }

                                    if (isRunning) {
                                        let hasBreak = false;
                                        if (lastEntry.break) {
                                            if (lastEntry.break.break_start && !lastEntry.break.break_end) {
                                                hasBreak = true;
                                            } else {
                                                let i = 2;
                                                while (lastEntry.break[`break_start_${i}`]) {
                                                    if (!lastEntry.break[`break_end_${i}`]) {
                                                        hasBreak = true;
                                                        break;
                                                    }
                                                    i++;
                                                }
                                            }
                                        }

                                        return (
                                            <>
                                                <div className="alert alert-primary py-2 px-3 small d-flex justify-content-between align-items-center mb-2">
                                                    <span>Ongoing: <strong>{lastEntry.check_in}</strong> ({lastEntry.work_from})</span>
                                                    {lastEntry.status === 'pending' && <Tag color="error">PENDING</Tag>}
                                                </div>

                                                {hasBreak ? (
                                                    <button className="btn btn-warning w-100 py-2 d-flex align-items-center justify-content-center" disabled={loading} onClick={() => handleBreakEnd(currentActionRecord)}>
                                                        <LogoutOutlined className="me-2" /> End Break
                                                    </button>
                                                ) : (
                                                    <div className="row g-2">
                                                        <div className="col-6">
                                                            <button className="btn btn-outline-warning w-100 py-2 d-flex align-items-center justify-content-center" disabled={loading} onClick={() => handleBreakStart(currentActionRecord)}>
                                                                <LoginOutlined className="me-2" /> Start Break
                                                            </button>
                                                        </div>
                                                        <div className="col-6">
                                                            <button className="btn btn-danger w-100 py-2 d-flex align-items-center justify-content-center" disabled={loading} onClick={() => handleCheckOut(currentActionRecord)}>
                                                                <LogoutOutlined className="me-2" /> Check Out
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    }

                                    return (
                                        <button className="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center" disabled={loading} onClick={() => handleCheckIn(currentActionRecord.date)}>
                                            <LoginOutlined className="me-2" /> New Check In
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center p-4">No record found.</div>
            )}
        </Modal>
    );
};

export default QuickAttendanceModal;
