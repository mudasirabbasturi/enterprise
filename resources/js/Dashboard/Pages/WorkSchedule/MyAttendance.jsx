import { useState, useMemo, useCallback } from "react";
import {
    AgGridReact,
    gridTheme,
    defaultColDef,
} from "@agConfig/AgGridConfig";
import {
    Link,
    Head,
    Breadcrumb,
    router,
    notification,
    Modal,
    Tag,
    dayjs,
    Card,
    CheckOutlined, PlusCircleOutlined, CloseCircleFilled, InfoCircleOutlined,
    DeleteOutlined,
    HomeOutlined,
    ApartmentOutlined,
    Select, EditOutlined, LoginOutlined, LogoutOutlined,
    Badge,
    Calendar,
    Alert,
    Button,
    Typography,
    Divider,
    Space
} from "@shared/ui";

const { Text, Title } = Typography;
import MainLayout from "@layout";

const MyAttendance = ({ attendances, selectedYear, auth, leaveRequests, userShiftSchedules, holidays, config }) => {
    const [api, contextHolder] = notification.useNotification();
    const [loading, setLoading] = useState(false);
    const [isAttendanceGridModalOpen, setIsAttendanceGridModalOpen] = useState(false);
    const [selectedMonthForAttendance, setSelectedMonthForAttendance] = useState(null);
    const [workedFrom, setWorkedFrom] = useState('office');
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [currentActionRecord, setCurrentActionRecord] = useState(null);
    const [newOutsideEntry, setNewOutsideEntry] = useState({ hh: '01', mm: '00', work_from: 'office' });
    const [isPenaltyInfoModalOpen, setIsPenaltyInfoModalOpen] = useState(false);

    const user = auth.user;
    const [filterYear, setFilterYear] = useState(selectedYear);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = Array.from({ length: 11 }, (_, i) => 2024 + i);

    const handleYearChange = (year) => {
        setFilterYear(year);
        router.get(route('my-attendance.index'), { year }, { preserveState: true });
    };

    const getDaysInMonth = useCallback((year, month) => {
        const date = new Date(year, month, 1);
        const dates = [];
        while (date.getMonth() === month) {
            dates.push(dayjs(date).format('YYYY-MM-DD'));
            date.setDate(date.getDate() + 1);
        }
        return dates;
    }, []);

    const timeStringToMins = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
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

    const getBreakMinsForSegment = (breakObj) => {
        if (!breakObj) return 0;
        let total = 0;
        // First break
        if (breakObj.break_start && breakObj.break_end) {
            const s = dayjs(`2000-01-01 ${breakObj.break_start}`);
            const e = dayjs(`2000-01-01 ${breakObj.break_end}`);
            let diff = e.diff(s, 'minute');
            if (diff < 0) diff += 1440;
            total += diff;
        }
        // Subsequent breaks
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

    const formatManualTime = (timeStr) => {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(':').map(Number);
        return `${h}h ${m}m`;
    };

    const sumOutsideHoursMins = (entries) => {
        if (!entries || !Array.isArray(entries)) return 0;
        let totalMins = 0;
        entries.forEach(entry => {
            if (entry.manual_hours) {
                const [h, m] = entry.manual_hours.split(':').map(Number);
                totalMins += (h * 60) + m;
            }
        });
        return totalMins;
    };

    const formatMinsToHrs = (totalMins) => {
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return `${hrs}h ${mins}m`;
    };

    const sumOutsideHours = (entries) => {
        const totalMins = sumOutsideHoursMins(entries);
        return formatMinsToHrs(totalMins);
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
                description: "Could not verify your IP address. Please check your internet connection.",
                placement: "topRight"
            });
            return false;
        }
    };

    const handleAction = async (record, type) => {
        const isAllowed = await validateIpAccess();
        if (!isAllowed) return;

        setLoading(true);
        const url = (record.isPlaceholder && type === 'check_in') ? route('users-attendance.store') : route('users-attendance.update', record.id);
        const method = (record.isPlaceholder && type === 'check_in') ? 'post' : 'put';

        axios[method](url, {
            user_id: user.id,
            date: record.date,
            type: type,
            work_from: workedFrom,
            status: (!record.status || ['Not Marked', 'Weekend', 'Holiday'].includes(record.status)) ? 'Marked' : record.status,
        }).then(() => {
            api.success({ message: `Success: ${type.replace('_', ' ').toUpperCase()}` });
            setIsActionModalOpen(false);
            router.reload({ only: ['attendances'] });
        }).catch(err => {
            api.error({ message: "Action Failed", description: err.response?.data?.message || "Internal Error" });
        }).finally(() => setLoading(false));
    };

    const handleCheckIn = (date) => handleAction({ date, isPlaceholder: true }, 'check_in');
    const handleCheckOut = (record) => handleAction(record, 'check_out');
    const handleBreakStart = (record) => handleAction(record, 'break_start');
    const handleBreakEnd = (record) => handleAction(record, 'break_end');

    // Main Grid Columns (Months)
    const columnDefs = useMemo(() => [
        {
            headerName: "Month",
            field: "monthName",
            cellClass: "fw-bold text-primary text-nowrap"
        },
        {
            headerName: "Marked",
            field: "present",
            cellClass: "text-success fw-bold text-center text-nowrap",
        },
        {
            headerName: "Leave",
            field: "leaveCount",
            minWidth: 90,
            cellClass: "text-info fw-bold text-center text-nowrap",
            cellRenderer: (params) => <Tag color="blue">{params.value}</Tag>
        },
        // {
        //     headerName: "Required Duration (Excl. Break)",
        //     field: "totalRequiredMinutes",
        //     minWidth: 150,
        //     cellClass: "text-center text-nowrap",
        //     cellRenderer: (params) => {
        //         return <Tag color="orange">{formatMinsToHrs(params.value)}</Tag>;
        //     }
        // },
        {
            headerName: "Recorded Duration",
            field: "totalRegularMinutes",
            cellRenderer: (params) => <Tag color="geekblue">{formatMinsToHrs(params.value)}</Tag>,
            cellClass: "text-center text-nowrap"
        },
        {
            headerName: "Mark & View Actions",
            minWidth: 150,
            pinned: "left",
            width: 200,
            cellRenderer: (params) => {
                const now = dayjs();
                const currentMonth = now.month();
                const currentYear = now.year();

                const isCurrentMonth = params.data.monthIndex === currentMonth && filterYear === currentYear;
                const isPast = filterYear < currentYear || (filterYear === currentYear && params.data.monthIndex < currentMonth);

                let buttonText = "View & Mark Attendance";
                if (!isCurrentMonth) {
                    buttonText = isPast ? "View Historical" : "Upcoming";
                }

                const canOpen = isCurrentMonth || isPast;

                return (
                    <button
                        className={`btn btn-sm w-100 d-flex align-items-center justify-content-center ${canOpen ? 'btn-primary' : 'btn-outline-secondary'}`}
                        disabled={!canOpen}
                        onClick={() => {
                            setSelectedMonthForAttendance(params.data.monthIndex);
                            setIsAttendanceGridModalOpen(true);
                        }}
                    >
                        {buttonText}
                    </button>
                )
            }
        }
    ], [filterYear]);

    const rowData = useMemo(() => {
        return months.map((m, i) => {
            const monthStr = (i + 1).toString().padStart(2, '0');
            const monthAttendances = attendances.filter(a =>
                a.date.startsWith(`${filterYear}-${monthStr}`)
            );
            const markedCount = monthAttendances.filter(a => a.status === 'Marked').length;
            const absent = monthAttendances.filter(a => a.status === 'absent').length;

            // Calculate total approved leave days in this month
            const monthLeaves = (leaveRequests || []).filter(l => {
                if (l.status !== 'approved') return false;
                const start = dayjs(l.start_date);
                const end = dayjs(l.end_date);
                const monthStart = dayjs(`${filterYear}-${monthStr}-01`);
                const monthEnd = monthStart.endOf('month');
                return (start.isSameOrBefore(monthEnd) && end.isSameOrAfter(monthStart));
            });

            let leaveCount = 0;
            const daysInMonth = getDaysInMonth(filterYear, i);
            daysInMonth.forEach(d => {
                const date = dayjs(d);
                const isLeave = monthLeaves.some(l =>
                    date.isSameOrAfter(dayjs(l.start_date), 'day') &&
                    date.isSameOrBefore(dayjs(l.end_date), 'day')
                );
                if (isLeave) leaveCount++;
            });

            // Calculate total required minutes based on shift duration
            let totalRequiredMinutes = 0;
            daysInMonth.forEach(d => {
                const dayName = dayjs(d).format('dddd');
                const schedule = (userShiftSchedules || []).find(s => s.day === dayName);
                if (schedule && schedule.shift) {
                    let dayReqMins = 0;
                    if (schedule.shift.start_time && schedule.shift.end_time) {
                        const start = dayjs(`2000-01-01 ${schedule.shift.start_time}`);
                        const end = dayjs(`2000-01-01 ${schedule.shift.end_time}`);
                        let diff = end.diff(start, 'minute');
                        if (diff < 0) diff += 1440;
                        dayReqMins = diff;
                    } else if (schedule.shift.duration) {
                        dayReqMins = parseInt(schedule.shift.duration);
                    }

                    // Subtract break time
                    const breakMins = parseInt(schedule.shift.total_break_minutes || 0);
                    totalRequiredMinutes += Math.max(0, dayReqMins - breakMins);
                }
            });

            const totalRegularMinutes = monthAttendances.reduce((acc, curr) => {
                return acc + getHoursMins(curr);
            }, 0);

            const totalBreakMinutes = monthAttendances.reduce((acc, curr) => {
                return acc + getBreakMins(curr);
            }, 0);

            return { monthName: m, monthIndex: i, present: markedCount, absent, leaveCount, totalRequiredMinutes, totalRegularMinutes, totalBreakMinutes };
        });
    }, [attendances, filterYear, leaveRequests, userShiftSchedules]);

    // Detail Grid Columns
    const detailColumnDefs = useMemo(() => [
        {
            headerName: "Date",
            field: "date",
            minWidth: 120,
            cellClass: "fw-medium",

        },
        {
            headerName: "Day",
            field: "date",
            minWidth: 100,
            cellRenderer: (params) => {
                return dayjs(params.value).format('dddd');
            }
        },
        {
            headerName: "Office Status",
            field: "isOffDay",
            minWidth: 130,
            cellRenderer: (params) => {
                const isOffDay = params.value;
                return <Tag color={isOffDay ? 'error' : 'success'}>
                    {isOffDay ? 'Office Closed' : 'Office Open'}
                </Tag>;
            }
        },
        {
            headerName: "Status",
            minWidth: 200,
            cellRenderer: (params) => {
                const { status, clock, isOffDay, offDayType } = params.data;
                const isMarked = status === 'Marked' || (Array.isArray(clock) && clock.length > 0);
                const isLeave = status === 'On Leave' || status === 'leave';

                if (isMarked) {
                    const markedText = isOffDay ? `${offDayType} / MARKED` : 'MARKED';
                    return <Tag color="success">{markedText}</Tag>;
                }
                if (isLeave) return <Tag color="blue">LEAVE</Tag>;
                if (isOffDay) return <Tag color="default">{offDayType.toUpperCase()}</Tag>;
                return <Tag color="processing">{status?.toUpperCase() || 'NOT MARKED'}</Tag>;
            }
        },
        // {
        //     headerName: "Required Duration (Excl. Break)",
        //     minWidth: 150,
        //     cellRenderer: (params) => {
        //         const dayName = dayjs(params.data.date).format('dddd');
        //         const schedule = (userShiftSchedules || []).find(s => s.day === dayName);
        //         if (schedule && schedule.shift) {
        //             let reqMins = 0;
        //             if (schedule.shift.start_time && schedule.shift.end_time) {
        //                 const start = dayjs(`2000-01-01 ${schedule.shift.start_time}`);
        //                 const end = dayjs(`2000-01-01 ${schedule.shift.end_time}`);
        //                 let diff = end.diff(start, 'minute');
        //                 if (diff < 0) diff += 1440;
        //                 reqMins = diff;
        //             } else if (schedule.shift.duration) {
        //                 reqMins = parseInt(schedule.shift.duration);
        //             }
        //             const breakMins = parseInt(schedule.shift.total_break_minutes || 0);
        //             return <Tag color="orange">{formatMinsToHrs(Math.max(0, reqMins - breakMins))}</Tag>;
        //         }
        //         return "-";
        //     }
        // },
        {
            headerName: "Late",
            field: "isLate",
            minWidth: 100,
            cellRenderer: (params) => {
                const { status, clock, isLate } = params.data;
                const sLower = status?.toLowerCase();
                const isMarked = sLower === 'marked' || sLower === 'present' || (Array.isArray(clock) && clock.length > 0);
                if (!isMarked) return "-";
                return <Tag color={isLate ? 'error' : 'success'}>{isLate ? 'LATE' : 'ON TIME'}</Tag>;
            }
        },
        {
            headerName: "Recorded Duration",
            field: "clock",
            minWidth: 120,
            cellRenderer: (params) => {
                const calculated = calculateHours(params.data);
                return <Tag color="geekblue">{calculated || "-"}</Tag>;
            }
        },
        {
            headerName: "Break Duration",
            field: "clock",
            minWidth: 120,
            cellRenderer: (params) => {
                const calculated = formatBreakDuration(params.data);
                return <Tag color="warning">{calculated || "-"}</Tag>;
            }
        },
        {
            headerName: "Details",
            field: "clock",
            minWidth: 300,
            maxWidth: 300,
            flex: 2,
            pinned: "right",
            cellRenderer: (params) => {
                const clock = params.value;
                if (!Array.isArray(clock) || clock.length === 0) return "-";
                return (
                    <div className="d-flex flex-column gap-1 py-1">
                        {clock.map((c, idx) => {
                            const breakTags = [];
                            if (c.break) {
                                if (c.break.break_start) {
                                    breakTags.push(<Tag color="warning" className="m-0" style={{ fontSize: '10px' }}>B: {c.break.break_start}</Tag>);
                                    if (c.break.break_end) {
                                        breakTags.push(<Tag color="warning" className="m-0" style={{ fontSize: '10px' }}>E: {c.break.break_end}</Tag>);
                                    }
                                }
                                let i = 2;
                                while (c.break[`break_start_${i}`]) {
                                    breakTags.push(<Tag color="warning" className="m-0" style={{ fontSize: '10px' }}>B{i}: {c.break[`break_start_${i}`]}</Tag>);
                                    if (c.break[`break_end_${i}`]) {
                                        breakTags.push(<Tag color="warning" className="m-0" style={{ fontSize: '10px' }}>E{i}: {c.break[`break_end_${i}`]}</Tag>);
                                    }
                                    i++;
                                }
                            }

                            return (
                                <div key={idx} className="d-flex align-items-center gap-1 flex-wrap">
                                    <Tag color={c.work_from === 'home' ? 'blue' : 'orange'} className="m-0" style={{ fontSize: '10px' }}>
                                        {c.work_from === 'home' ? <HomeOutlined /> : <ApartmentOutlined />} {c.work_from.toUpperCase()}
                                    </Tag>
                                    <Tag color="cyan" className="m-0" style={{ fontSize: '10px' }}>{c.check_in}</Tag>
                                    {breakTags}
                                    {c.check_out && <Tag color="blue" className="m-0" style={{ fontSize: '10px' }}>{c.check_out}</Tag>}
                                    {c.status === 'pending' && <Tag color="error" className="m-0" style={{ fontSize: '10px' }}>PENDING</Tag>}
                                </div>
                            );
                        })}
                    </div>
                );
            }
        },

        {
            headerName: "Actions",
            width: 150,
            minWidth: 150,
            sortable: false,
            filter: false,
            pinned: "right",
            cellRenderer: (params) => {
                const { status, date, clock } = params.data;
                if (status === 'On Leave') return <Tag color="blue">ON LEAVE</Tag>;

                const today = dayjs().format('YYYY-MM-DD');
                const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
                const isToday = date === today;
                const isYesterday = date === yesterday;
                const isFuture = dayjs(date).isAfter(today, 'day');

                if (isFuture) return <small className="text-muted italic">Upcoming</small>;

                const lastEntry = Array.isArray(clock) && clock.length > 0 ? clock[clock.length - 1] : null;
                const isRunning = lastEntry && !lastEntry.check_out;

                // User Rule: Only today and yesterday are marking-enabled.
                // Previous day (yesterday) is ONLY enabled if it has an open session (isRunning).
                // All days older than yesterday are CLOSED.
                const isOldPast = dayjs(date).isBefore(yesterday, 'day');

                let isClosed = false;
                if (isOldPast) {
                    isClosed = true;
                } else if (isYesterday) {
                    // Yesterday is closed UNLESS there is an open session to finish
                    if (!isRunning) {
                        isClosed = true;
                    }
                }
                // Today is never closed

                if (isClosed) {
                    return <Tag color="default">Attendance Closed</Tag>;
                }

                return (
                    <button
                        className={`btn btn-sm d-flex align-items-center justify-content-center w-100 ${isRunning ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => {
                            setCurrentActionRecord(params.data);
                            setWorkedFrom(lastEntry?.work_from || 'office');
                            setIsActionModalOpen(true);
                        }}
                    >
                        {isRunning ? <LogoutOutlined className="me-1" /> : (isToday ? <PlusCircleOutlined className="me-1" /> : <EditOutlined className="me-1" />)}
                        {isRunning ? "Running" : (isToday ? "Mark" : "Edit")}
                    </button>
                );
            }
        }
    ], [loading]);

    // Style today's row with a permanent highlight
    const getRowStyle = (params) => {
        if (params.data.date === dayjs().format('YYYY-MM-DD')) {
            return { backgroundColor: '#e6f7ff' }; // Light blue highlight
        }
        return null;
    };

    // Style the current month in the main grid
    const getMainRowStyle = (params) => {
        if (params.data.monthIndex === dayjs().month()) {
            return { backgroundColor: '#e6f7ff', fontWeight: 'bold' };
        }
        return null;
    };

    const onMainGridFirstDataRendered = (params) => {
        const currentMonthIndex = dayjs().month();
        let targetIndex = -1;
        params.api.forEachNode((node, index) => {
            if (node.data.monthIndex === currentMonthIndex) {
                targetIndex = index;
            }
        });
        if (targetIndex !== -1) {
            params.api.ensureIndexVisible(targetIndex, 'middle');
        }
    };

    const userAttendanceRowData = useMemo(() => {
        if (selectedMonthForAttendance === null) return [];
        const days = getDaysInMonth(filterYear, selectedMonthForAttendance);
        const monthStr = (selectedMonthForAttendance + 1).toString().padStart(2, '0');
        const userRecs = attendances.filter(a => a.date.startsWith(`${filterYear}-${monthStr}`));

        return days.map(d => {
            const existing = userRecs.find(a => a.date === d);
            const dayName = dayjs(d).format('dddd');
            const hasShift = (userShiftSchedules || []).some(s => s.day === dayName);

            // Check if this date falls within an approved leave
            const onLeave = (leaveRequests || []).find(leave => {
                const leaveStart = dayjs(leave.start_date);
                const leaveEnd = dayjs(leave.end_date);
                const currentDate = dayjs(d);
                return currentDate.isSameOrAfter(leaveStart, 'day') && currentDate.isSameOrBefore(leaveEnd, 'day');
            });

            // Check if this date is a holiday
            const holiday = (holidays || []).find(h => dayjs(h.date).isSame(dayjs(d), 'day'));

            const schedule = (userShiftSchedules || []).find(s => s.day === dayName);
            const shift = schedule?.shift;

            let status = existing ? existing.status : 'Not Marked';
            let isOffDay = !!holiday || !hasShift;
            let offDayType = holiday ? 'Holiday' : (!hasShift ? 'Weekend' : null);

            if (onLeave) {
                status = 'On Leave';
            }

            let isLate = false;
            if (shift && existing && (status?.toLowerCase() === 'marked' || status?.toLowerCase() === 'present' || (Array.isArray(existing.clock) && existing.clock.length > 0))) {
                const firstCheckIn = Array.isArray(existing.clock) && existing.clock.length > 0 ? existing.clock[0].check_in : existing.check_in;
                if (firstCheckIn && shift.start_time) {
                    const lateGraceMins = parseInt(config?.attendance_late_grace_minutes || 0);
                    const sTotal = timeStringToMins(shift.start_time);
                    const aTotal = timeStringToMins(firstCheckIn);
                    if (aTotal > (sTotal + lateGraceMins)) {
                        isLate = true;
                    }
                }
            }

            return {
                ...(existing || {}),
                user_id: user.id,
                date: d,
                status,
                isPlaceholder: !existing,
                isOffDay,
                offDayType,
                isLate
            };
        }).sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
    }, [selectedMonthForAttendance, attendances, filterYear, getDaysInMonth, user.id, holidays, userShiftSchedules, leaveRequests, config]);

    return (
        <>
            {contextHolder}
            <Head title="My Attendance Sheet" />
            <div className="container-fluid p-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Breadcrumb
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Personal" },
                            { title: "My Attendance" }
                        ]}
                    />
                    <div className="d-flex gap-2">
                        <Select
                            value={filterYear}
                            onChange={handleYearChange}
                            style={{ width: 120 }}
                            options={years.map(y => ({ label: y, value: y }))}
                        />
                        <Button
                            type="primary"
                            ghost
                            icon={<InfoCircleOutlined />}
                            onClick={() => setIsPenaltyInfoModalOpen(true)}
                            className="d-flex align-items-center"
                        >
                            Must Read Rules
                        </Button>
                    </div>
                </div>

                {(!userShiftSchedules || userShiftSchedules.length === 0) && (
                    <Alert
                        message="Shift Not Assigned"
                        description="Please contact admin to assign you shift."
                        type="warning"
                        showIcon
                        className="mb-4"
                    />
                )}

                <Card className="border-0 shadow-sm" bodyStyle={{ padding: 0, borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="ag-grid-wrapper" style={{ height: '75vh' }}>
                        <AgGridReact
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={{
                                ...defaultColDef,
                                cellClass: 'text-nowrap',
                                wrapHeaderText: true,
                                autoHeaderHeight: true,
                            }}
                            sideBar={{
                                toolPanels: ['columns', 'filters'],
                                defaultToolPanel: null
                            }}
                            autoSizeStrategy={{
                                type: "fitCellContents",
                                skipHeader: false,
                            }}
                            theme={gridTheme}
                            pagination={false}
                            getRowStyle={getMainRowStyle}
                            onFirstDataRendered={onMainGridFirstDataRendered}
                        />
                    </div>
                </Card>
            </div>

            <Modal
                title={`My Attendance - ${months[selectedMonthForAttendance]} ${filterYear}`}
                open={isAttendanceGridModalOpen}
                onCancel={() => setIsAttendanceGridModalOpen(false)}
                footer={null}
                width="100%"
                style={{ top: 0 }}
                centered
            >
                <div style={{ height: '80vh' }} className="ag-theme-alpine">
                    <AgGridReact
                        rowData={userAttendanceRowData}
                        columnDefs={detailColumnDefs}
                        defaultColDef={{
                            ...defaultColDef,
                            cellClass: 'text-nowrap',
                            wrapHeaderText: true,
                            autoHeaderHeight: true,
                            wrapText: true,
                            autoHeight: true,
                        }}
                        sideBar={{
                            toolPanels: ['columns', 'filters'],
                            defaultToolPanel: null
                        }}
                        autoSizeStrategy={{
                            type: "fitCellContents",
                            skipHeader: false,
                        }}
                        theme={gridTheme}
                        pagination={false}
                        getRowStyle={getRowStyle}
                        onFirstDataRendered={(params) => {
                            setTimeout(() => {
                                const today = dayjs().format('YYYY-MM-DD');
                                const rowIndex = userAttendanceRowData.findIndex(row => row.date === today);
                                if (rowIndex !== -1) {
                                    params.api.ensureIndexVisible(rowIndex, 'middle');
                                    // Highlight the current day row briefly
                                    const rowNode = params.api.getRowNode(params.api.getDisplayedRowAtIndex(rowIndex).id);
                                    if (rowNode) {
                                        params.api.flashCells({ rowNodes: [rowNode] });
                                    }
                                }
                            }, 100);
                        }}
                    />
                </div>
            </Modal>

            <Modal
                title={`Manage Attendance - ${currentActionRecord?.date}`}
                open={isActionModalOpen}
                onCancel={() => setIsActionModalOpen(false)}
                footer={null}
                centered
                width={450}
            >
                {currentActionRecord && (
                    <div className="p-2">
                        <div className="mb-4 text-center">
                            <Tag color="blue" className="px-3 py-1" style={{ fontSize: '14px' }}>
                                Status: {currentActionRecord.status.toUpperCase()}
                            </Tag>
                        </div>

                        <div className="d-grid gap-3">
                            <div className="mb-3">
                                <label className="fw-bold small text-muted d-block mb-1">Worked From</label>
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
                                {workedFrom === 'home' && <Alert type="info" message="Home-based work will be marked as PENDING by default." className="mt-2" showIcon />}
                            </div>

                            <div className="border rounded p-3 bg-light">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="m-0 fw-bold">Daily Activities</h6>
                                    <Tag color="cyan">{calculateHours(currentActionRecord)} total today</Tag>
                                </div>

                                <div className="d-grid gap-2">
                                    {(() => {
                                        const clock = Array.isArray(currentActionRecord.clock) ? currentActionRecord.clock : [];
                                        const lastEntry = clock.length > 0 ? clock[clock.length - 1] : null;
                                        const isRunning = lastEntry && !lastEntry.check_out;

                                        if (isRunning) {
                                            const hasBreak = (() => {
                                                const b = lastEntry.break;
                                                if (!b) return false;
                                                if (b.break_start && !b.break_end) return true;
                                                let i = 2;
                                                while (b[`break_start_${i}`]) {
                                                    if (!b[`break_end_${i}`]) return true;
                                                    i++;
                                                }
                                                return false;
                                            })();
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
                )}
            </Modal>

            <Modal
                title={<Space><InfoCircleOutlined className="text-primary" /> Attendance & Penalty Rules</Space>}
                open={isPenaltyInfoModalOpen}
                onCancel={() => setIsPenaltyInfoModalOpen(false)}
                footer={null}
                width={700}
                centered
                bodyStyle={{ padding: '24px' }}
            >
                <div className="penalty-rules-container">
                    <Alert
                        message="Please Read Carefully"
                        description="Understanding these rules will help you avoid unnecessary salary deductions. All penalties are calculated monthly based on the global payroll configuration."
                        type="info"
                        showIcon
                        className="mb-4"
                    />

                    <div className="row g-4">
                        <div className="col-md-6">
                            <Card size="small" title={<Text strong>Late Arrival Rules</Text>} className="h-100 border-0 shadow-sm bg-light">
                                <ul className="ps-3 mb-0 small">
                                    <li className="mb-2">
                                        <Text strong>15-Minute Grace:</Text> You have 15 minutes of grace after your shift start time. Arriving after this is marked as "Late".
                                    </li>
                                    <li className="mb-2">
                                        <Text strong>Late Grace (Monthly):</Text> {config?.late_grace_count || 0} late days are allowed without penalty each month.
                                    </li>
                                    <li>
                                        <Text strong>Late Penalty:</Text> After exceeding the grace, each late day will result in a deduction of PKR {parseFloat(config?.late_penalty_per_day || 0).toLocaleString()} from your salary.
                                    </li>
                                </ul>
                            </Card>
                        </div>

                        <div className="col-md-6">
                            <Card size="small" title={<Text strong>Check-in/out Window</Text>} className="h-100 border-0 shadow-sm bg-light">
                                <ul className="ps-3 mb-0 small">
                                    <li className="mb-2">
                                        <Text strong>Early Check-in:</Text> You can check in up to {config?.attendance_early_checkin_max_hours || 2} hours before your shift starts.
                                    </li>
                                    <li className="mb-2">
                                        <Text strong>Late Check-out:</Text> You must check out within {config?.attendance_late_checkout_max_hours || 4} hours after your shift ends.
                                    </li>
                                    <li className="mb-2">
                                        <Text strong>Missing Logs:</Text> If you forget to check in OR check out, the day is flagged as "Missing" and you will be marked as <Text type="danger" strong>Absent (0 Hours)</Text>.
                                    </li>
                                    <li>
                                        <Text strong>Break Rules:</Text> If you start a break but forget to "End Break", a penalty of <Text type="danger">PKR {parseFloat(config?.missing_attendance_penalty_per_day || 0).toLocaleString()}</Text> will apply. You have a monthly grace of <Text strong>{config?.missing_attendance_grace_count || 0}</Text> missing break-outs.
                                    </li>
                                </ul>
                            </Card>
                        </div>

                        <div className="col-md-6">
                            <Card size="small" title={<Text strong>Undertime & Absents</Text>} className="h-100 border-0 shadow-sm bg-light">
                                <ul className="ps-3 mb-0 small">
                                    <li className="mb-2">
                                        <Text strong>Working Hours:</Text> You must complete your required shift duration (net of breaks).
                                    </li>
                                    <li className="mb-2">
                                        <Text strong>Undertime Penalty:</Text> Missing hours are deducted at your hourly rate.
                                    </li>
                                    <li className="mb-2">
                                        <Text strong>Absence:</Text> Full days missed are deducted as per the "Absent Penalty" (PKR {parseFloat(config?.absent_penalty_rate || 0).toLocaleString()} or hourly rate).
                                    </li>
                                    <li>
                                        <Text strong>Rejected Leave:</Text> If your leave request is rejected, it will be treated as an unpaid day and will be automatically flagged as an <Text type="danger" strong>Absent Flag</Text>.
                                    </li>
                                </ul>
                            </Card>
                        </div>

                        <div className="col-md-6">
                            <Card size="small" title={<Text strong>IP Restriction & Locations</Text>} className="h-100 border-0 shadow-sm bg-light">
                                <ul className="ps-3 mb-0 small">
                                    <li className="mb-2">
                                        <Text strong>Office IP:</Text> Attendance must be marked from an authorized office IP address.
                                    </li>
                                    <li className="mb-2">
                                        <Text strong>Home Shifts:</Text> Home-based shifts bypass IP restrictions automatically.
                                    </li>
                                    <li>
                                        <Text strong>Allowed IPs:</Text> {(() => {
                                            try {
                                                const ips = typeof config?.user_attendace_allowed_ips === 'string'
                                                    ? JSON.parse(config.user_attendace_allowed_ips)
                                                    : (Array.isArray(config?.user_attendace_allowed_ips) ? config.user_attendace_allowed_ips : []);
                                                return ips.length > 0 ? ips.join(', ') : 'No specific IPs configured';
                                            } catch (e) { return 'N/A'; }
                                        })()}
                                    </li>
                                </ul>
                            </Card>
                        </div>

                        <div className="col-md-12">
                            <Card size="small" title={<Text strong>Salary Calculations</Text>} className="h-100 border-0 shadow-sm bg-light">
                                <ul className="ps-3 mb-0 small">
                                    <li className="mb-2">
                                        <Text strong>Hourly Rate (240 Divisor):</Text> Your base hourly rate is calculated dynamically as <Text code>Basic Salary / 30 / 8</Text>. All unconfigured deductions directly refer to this rate.
                                    </li>
                                    <li>
                                        <Text strong>Logged Time:</Text> Your salary is based on your completed required shift duration (net of breaks). Missing hours or undertime are deducted at your hourly rate.
                                    </li>
                                </ul>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-top text-end">
                        <Button type="primary" onClick={() => setIsPenaltyInfoModalOpen(false)}>
                            I Understand
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

MyAttendance.layout = (page) => <MainLayout children={page} />;

export default MyAttendance;
