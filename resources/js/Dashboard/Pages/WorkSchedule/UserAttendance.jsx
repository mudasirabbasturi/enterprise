import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
    AgGridReact,
    gridTheme,
    defaultColDef,
    sideBarConfig,
} from "@agConfig/AgGridConfig";
import {
    Link,
    Head,
    Breadcrumb,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    Tooltip,
    Popconfirm,
    router,
    notification,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    TimePicker,
    InputNumber,
    Tag,
    dayjs,
    Card,
    PlusCircleOutlined,
    HomeOutlined,
    ApartmentOutlined,
    SettingOutlined, Button, Space, CheckOutlined, CloseCircleFilled
} from "@shared/ui";
import axios from "axios";
import MainLayout from "@layout";

const UserAttendance =
    ({ attendances, users, selectedMonth, selectedYear, leaveRequests, holidays, config }) => {
        const [api, contextHolder] = notification.useNotification();
        const [loading, setLoading] = useState(false);
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [isAttendanceGridModalOpen, setIsAttendanceGridModalOpen] = useState(false);
        const [selectedUserForAttendance, setSelectedUserForAttendance] = useState(null);
        const [editingAttendance, setEditingAttendance] = useState(null);
        const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
        const detailGridRef = useRef(null);
        const [allowedIPs, setAllowedIPs] = useState([]);
        const [newIp, setNewIp] = useState("");

        useEffect(() => {
            if (config && config.user_attendace_allowed_ips) {
                const ips = config.user_attendace_allowed_ips;
                setAllowedIPs(Array.isArray(ips) ? ips : (typeof ips === 'string' ? JSON.parse(ips) : []));
            }
        }, [config]);

        useEffect(() => {
            if (detailGridRef.current && isAttendanceGridModalOpen) {
                const timer = setTimeout(() => {
                    detailGridRef.current.api.sizeColumnsToFit();
                }, 300);
                return () => clearTimeout(timer);
            }
        }, [isModalOpen, isAttendanceGridModalOpen]);
        const [form] = Form.useForm();
        const [configForm] = Form.useForm();

        const [filterDate, setFilterDate] = useState({
            month: selectedMonth - 1, // 0-indexed for JS/AntD
            year: selectedYear
        });

        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const years = Array.from({ length: 11 }, (_, i) => 2024 + i);

        const handleDateFilterChange = (key, value) => {
            const newFilters = { ...filterDate, [key]: value };
            setFilterDate(newFilters);
            router.get(route('users-attendance.index'), {
                month: newFilters.month + 1,
                year: newFilters.year
            }, { preserveState: true });
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

        const calculateHoursMins = (record) => {
            if (Array.isArray(record.clock) && record.clock.length > 0) {
                return record.clock.reduce((total, c) => {
                    if (!c.check_in || !c.check_out) return total;
                    const s = dayjs(`2000-01-01 ${c.check_in}`);
                    const e = dayjs(`2000-01-01 ${c.check_out}`);
                    let diff = e.diff(s, 'minute');
                    if (diff < 0) diff += 1440; // Handle night shifts

                    if (c.break) {
                        diff -= getBreakMinsForSegment(c.break);
                    }
                    return total + (diff > 0 ? diff : 0);
                }, 0);
            }

            const { check_in, check_out, break: breakObj } = record;
            if (!check_in || !check_out) return 0;
            const s = dayjs(`2000-01-01 ${check_in}`);
            const e = dayjs(`2000-01-01 ${check_out}`);
            let diff = e.diff(s, 'minute');
            if (diff < 0) diff += 1440; // Handle night shifts

            if (breakObj) {
                diff -= getBreakMinsForSegment(breakObj);
            }
            return diff > 0 ? diff : 0;
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

        const formatMins = (totalMins) => {
            if (!totalMins || totalMins <= 0) return "0h 0m";
            const hrs = Math.floor(totalMins / 60);
            const mins = Math.round(totalMins % 60);
            return `${hrs}h ${mins}m`;
        };

        const timeStringToMins = (timeStr) => {
            if (!timeStr) return 0;
            const [h, m] = timeStr.split(':').map(Number);
            return (h * 60) + m;
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
            return formatMins(mins);
        };

        const getRowStyle = (params) => {
            if (params.data.date === dayjs().format('YYYY-MM-DD')) {
                return { backgroundColor: '#e6f7ff' }; // Light blue highlight
            }
            return null;
        };

        const getShiftHoursForDay = (userId, date) => {
            const user = users.find(u => u.id === userId);
            if (!user || !user.user_shift_schedules) return null;

            const dayName = dayjs(date).format('dddd');
            const schedule = user.user_shift_schedules.find(s => s.day === dayName);

            if (!schedule || !schedule.shift) return null;

            // Convert duration from minutes to hours
            if (schedule.shift.duration) return parseFloat(schedule.shift.duration) / 60;
            const s = dayjs(`2000-01-01 ${schedule.shift.start_time}`);
            const e = dayjs(`2000-01-01 ${schedule.shift.end_time}`);
            let d = e.diff(s, 'hour', true);
            return d < 0 ? d + 24 : d;
        };

        // Main Grid Columns
        const masterColumnDefs = useMemo(() => [
            {
                headerName: "User",
                field: "name",
                cellClass: "text-nowrap",
                pinned: 'left',
                cellRenderer: (params) => (
                    <div className="d-flex align-items-center">
                        <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32 }}>
                            {params.value?.charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-bold">{params.value}</span>
                    </div>
                )
            },
            {
                headerName: "IP Restriction",
                field: "ip_restriction",
                minWidth: 150,
                cellRenderer: (params) => (
                    <div className="d-flex align-items-center h-100">
                        <div className="form-check form-switch cursor-pointer">
                            <input
                                className="form-check-input shadow-none"
                                type="checkbox"
                                checked={!!params.value}
                                onChange={(e) => handleToggleIpRestriction(params.data, e.target.checked)}
                                style={{ cursor: 'pointer', width: '28px', height: '15px' }}
                            />
                        </div>
                        <span className={`ms-1 small fw-bold ${params.value ? 'text-danger' : 'text-muted'}`}>
                            {params.value ? 'RESTRICTED' : 'NONE'}
                        </span>
                    </div>
                ),
            },
            {
                headerName: "Marked",
                field: "markedCount",
                minWidth: 90,
                cellClass: "text-success fw-bold text-center text-nowrap",
            },
            {
                headerName: "UnMarked",
                field: "unmarkedCount",
                minWidth: 90,
                cellClass: "text-danger fw-bold text-center text-nowrap",
            },
            {
                headerName: "Leave",
                field: "leaveCount",
                minWidth: 90,
                cellClass: "text-info fw-bold text-center text-nowrap",
                cellRenderer: (params) => <Tag color="blue">{params.value}</Tag>
            },
            // {
            //     headerName: "Required Regular Hours",
            //     field: "totalRequiredHours",
            //     minWidth: 120,
            //     cellClass: "text-center text-nowrap",
            //     cellRenderer: (params) => <Tag color="orange">{params.value}</Tag>
            // },
            {
                headerName: "Recorded Hours",
                field: "totalHours",
                minWidth: 110,
                cellClass: "fw-bold text-center text-nowrap",
            },
            {
                headerName: "Actions",
                pinned: "right",
                minWidth: 150,
                sortable: false,
                filter: false,
                cellRenderer: (params) => (
                    <button
                        className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center"
                        onClick={() => {
                            setSelectedUserForAttendance(params.data);
                            setIsAttendanceGridModalOpen(true);
                        }}
                    >
                        <PlusOutlined className="me-1" /> View Logs
                    </button>
                )
            }
        ], [filterDate]);

        const masterRowData = useMemo(() => {
            return users.map(user => {
                const userId = user.id;
                const monthStr = (filterDate.month + 1).toString().padStart(2, '0');
                const userRecs = attendances.filter(a =>
                    a.user_id === userId &&
                    a.date.startsWith(`${filterDate.year}-${monthStr}`)
                );

                // Consolidated Month Iteration
                let markedCount = 0;
                let unmarkedCount = 0;
                let leaveCount = 0;
                let totalRequiredMinutes = 0;

                const daysInMonth = getDaysInMonth(filterDate.year, filterDate.month);
                const userLeaves = (leaveRequests || []).filter(l => l.user_id === userId && l.status === 'approved');

                daysInMonth.forEach(d => {
                    const dateDayjs = dayjs(d);
                    const dateStr = dateDayjs.format('YYYY-MM-DD');
                    const dayName = dateDayjs.format('dddd');

                    // 1. Is it marked? (Check-in on this date)
                    const isMarked = userRecs.some(a => a.date === dateStr && Array.isArray(a.clock) && a.clock.length > 0);
                    if (isMarked) {
                        markedCount++;
                    }

                    // 2. Is it a leave?
                    const isLeave = userLeaves.some(l =>
                        dateDayjs.isSameOrAfter(dayjs(l.start_date), 'day') &&
                        dateDayjs.isSameOrBefore(dayjs(l.end_date), 'day')
                    );
                    if (isLeave) leaveCount++;

                    // 3. Is it a holiday?
                    const isHoliday = (holidays || []).some(h => dayjs(h.date).isSame(dateDayjs, 'day'));

                    // 4. Required Hours & UnMarked Logic
                    const schedule = (user.user_shift_schedules || []).find(s => s.day === dayName);
                    const hasShift = !!(schedule && schedule.shift);

                    if (hasShift) {
                        // Calculate Required Minutes
                        if (schedule.shift.duration) {
                            totalRequiredMinutes += parseInt(schedule.shift.duration);
                        } else if (schedule.shift.start_time && schedule.shift.end_time) {
                            const start = dayjs(`2000-01-01 ${schedule.shift.start_time}`);
                            const end = dayjs(`2000-01-01 ${schedule.shift.end_time}`);
                            let diff = end.diff(start, 'minute');
                            if (diff < 0) diff += 1440;
                            totalRequiredMinutes += diff;
                        }

                        // UnMarked: Shift exists, but NOT marked, NOT holiday, and NOT leave
                        if (!isMarked && !isHoliday && !isLeave) {
                            unmarkedCount++;
                        }
                    }
                });


                const totalRegMins = userRecs.reduce((acc, curr) => {
                    return acc + calculateHoursMins(curr);
                }, 0);

                return {
                    ...user,
                    markedCount,
                    unmarkedCount,
                    leaveCount,
                    totalRequiredHours: formatMins(totalRequiredMinutes),
                    regularHours: formatMins(totalRegMins),
                    totalHours: formatMins(totalRegMins)
                };
            });
        }, [users, attendances, filterDate, leaveRequests, getDaysInMonth]);

        // Detail Grid Columns
        const detailColumnDefs = useMemo(() => [
            {
                headerName: "Date",
                field: "date",
                minWidth: 100,
                cellClass: "fw-medium text-nowrap"
            },
            {
                headerName: "Day",
                field: "day",
                minWidth: 100,
                cellClass: "text-nowrap",
                cellRenderer: (params) => <span className="text-muted small">{params.value}</span>
            },
            {
                headerName: "Office Status",
                field: "office_status",
                minWidth: 130,
                cellRenderer: (params) => {
                    const isClosed = params.value === 'Closed';
                    return <Tag color={isClosed ? 'default' : 'success'} className="fw-bold">
                        {isClosed ? 'Office Closed' : 'Office Open'}
                    </Tag>;
                }
            },
            {
                headerName: "Status",
                minWidth: 200,
                cellRenderer: (params) => {
                    const { status, clock, isOffDay, offDayType } = params.data;
                    const isMarked = status === 'present' || status === 'late' || status === 'absent' || (Array.isArray(clock) && clock.length > 0);
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
            //         const userId = params.data.user_id || selectedUserForAttendance?.id;
            //         const date = params.data.date;
            //         const shiftHrs = getShiftHoursForDay(userId, date);
            //         if (shiftHrs === null) return "-";

            //         const totalMins = Math.round(shiftHrs * 60);
            //         return <Tag color="orange">{formatMins(totalMins)}</Tag>;
            //     }
            // },
            {
                headerName: "Recorded Hours",
                field: "clock",
                minWidth: 120,
                cellRenderer: (params) => {
                    const calculated = calculateHoursMins(params.data);
                    return <Tag color="geekblue">{formatMins(calculated) || "-"}</Tag>;
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
                minWidth: 150,
                pinned: "right",
                sortable: false,
                filter: false,
                cellRenderer: (params) => {
                    if (params.data.status === 'On Leave' && !params.data.id) return <Tag color="blue">ON LEAVE</Tag>;

                    if (params.data.isPlaceholder) {
                        return (
                            <div className="d-flex align-items-center h-100">
                                <button
                                    className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center"
                                    onClick={() => handleEdit(params.data)}
                                >
                                    <PlusCircleOutlined className="me-1" /> Mark Attendance
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div className="d-flex gap-2 align-items-center h-100">
                            <Tooltip title="Edit Record">
                                <button
                                    className="btn btn-outline-warning btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '28px', height: '28px' }}
                                    onClick={() => handleEdit(params.data)}
                                >
                                    <EditOutlined />
                                </button>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <Popconfirm
                                    title="Are you sure?"
                                    onConfirm={() => handleDelete(params.data.id)}
                                >
                                    <button
                                        className="btn btn-outline-danger btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: '28px', height: '28px' }}
                                    >
                                        <DeleteOutlined />
                                    </button>
                                </Popconfirm>
                            </Tooltip>
                        </div>
                    );
                }
            }
        ], [attendances, filterDate, leaveRequests, holidays]);

        const userAttendanceRowData = useMemo(() => {
            if (!selectedUserForAttendance) return [];
            const days = getDaysInMonth(filterDate.year, filterDate.month);
            const userRecs = attendances.filter(a => a.user_id === selectedUserForAttendance.id);
            const userLeaves = (leaveRequests || []).filter(l =>
                l.user_id === selectedUserForAttendance.id &&
                l.status === 'approved'
            );

            return days.map(d => {
                const existing = userRecs.find(a => a.date === d);
                const dayName = dayjs(d).format('dddd');
                const hasShift = selectedUserForAttendance.user_shift_schedules?.some(s => s.day === dayName);

                // Check if this date falls within an approved leave
                const onLeave = userLeaves.find(leave => {
                    const leaveStart = dayjs(leave.start_date);
                    const leaveEnd = dayjs(leave.end_date);
                    const currentDate = dayjs(d);
                    return currentDate.isSameOrAfter(leaveStart, 'day') && currentDate.isSameOrBefore(leaveEnd, 'day');
                });

                // Check if this date is a holiday
                const holiday = (holidays || []).find(h => dayjs(h.date).isSame(dayjs(d), 'day'));

                let status = existing ? existing.status : 'Not Marked';
                if (onLeave) status = 'On Leave';
                else if (holiday) status = 'Holiday';
                else if (!hasShift && !existing) status = 'Weekend';
                else if (!hasShift && existing) {
                    // if it's weekend BUT user has record, it should show 'present' or whatever the record has
                    status = existing.status;
                }

                const isOffDay = !!holiday || !hasShift;
                const offDayType = holiday ? 'Holiday' : (!hasShift ? 'Weekend' : null);

                return {
                    ...(existing || {}),
                    user_id: selectedUserForAttendance.id,
                    date: d,
                    day: dayName,
                    office_status: isOffDay ? 'Closed' : 'Open',
                    isOffDay,
                    offDayType,
                    status: status,
                    leave_status: onLeave ? onLeave.leave_type?.name || 'On Leave' : (holiday ? holiday.title : null),
                    isPlaceholder: !existing
                };
            }).sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
        }, [selectedUserForAttendance, attendances, filterDate, getDaysInMonth, leaveRequests, holidays]);

        const handleValuesChange = (changedValues, allValues) => {
            if (allValues.clock) {
                const totalMins = allValues.clock.reduce((total, c) => {
                    if (!c && !c.check_in || !c.check_out) return total;
                    const s = dayjs(c.check_in);
                    const e = dayjs(c.check_out);
                    let diff = e.diff(s, 'minute');
                    if (diff < 0) diff += 1440; // Handle night shifts

                    if (Array.isArray(c.breaks)) {
                        c.breaks.forEach(b => {
                            if (b.start && b.end) {
                                let bDiff = dayjs(b.end).diff(dayjs(b.start), 'minute');
                                if (bDiff < 0) bDiff += 1440;
                                diff -= bDiff;
                            }
                        });
                    }
                    return total + (diff > 0 ? diff : 0);
                }, 0);

                const hrs = Math.floor(totalMins / 60).toString().padStart(2, '0');
                const mins = (totalMins % 60).toString().padStart(2, '0');
                form.setFieldsValue({ total_regular_hours: `${hrs}:${mins}` });
            }
        };


        const handleEdit = (rec) => {
            setEditingAttendance(rec);
            form.setFieldsValue({
                user_id: rec.user_id,
                date: dayjs(rec.date),
                clock: Array.isArray(rec.clock) ? rec.clock.map(c => {
                    const breaksArray = [];
                    if (c.break) {
                        if (c.break.break_start) {
                            breaksArray.push({
                                start: dayjs(c.break.break_start, 'HH:mm:ss'),
                                end: c.break.break_end ? dayjs(c.break.break_end, 'HH:mm:ss') : null
                            });
                        }
                        let i = 2;
                        while (c.break[`break_start_${i}`]) {
                            breaksArray.push({
                                start: dayjs(c.break[`break_start_${i}`], 'HH:mm:ss'),
                                end: c.break[`break_end_${i}`] ? dayjs(c.break[`break_end_${i}`], 'HH:mm:ss') : null
                            });
                            i++;
                        }
                    }
                    return {
                        ...c,
                        check_in: c.check_in ? dayjs(c.check_in, 'HH:mm:ss') : null,
                        check_out: c.check_out ? dayjs(c.check_out, 'HH:mm:ss') : null,
                        breaks: breaksArray,
                        status: c.status || 'approved'
                    };
                }) : [],
                notes: rec.notes || ''
            });
            setIsModalOpen(true);
        };

        const handleDelete = async (id) => {
            setLoading(true);
            try {
                await axios.delete(route('users-attendance.destroy', id));
                api.success({ message: "Record deleted", placement: "topRight" });
                router.reload({ only: ['attendances'] });
            } catch (error) {
                api.error({ message: "Delete failed", description: error.response?.data?.message });
            } finally {
                setLoading(false);
            }
        };

        const handleAddNew = () => {
            setEditingAttendance(null);
            form.resetFields();
            form.setFieldsValue({ date: dayjs(), status: 'present', worked_from: 'office' });
            setIsModalOpen(true);
        };

        const handleModalSubmit = () => {
            form.validateFields().then(async values => {

                setLoading(true);
                let finalStatus = editingAttendance?.status || 'Marked';
                if (finalStatus === 'Not Marked' || finalStatus === 'Weekend' || finalStatus === 'Holiday') {
                    finalStatus = 'Marked';
                }

                const submissionData = {
                    ...values,
                    status: finalStatus,
                    date: values.date.format('YYYY-MM-DD'),
                    clock: Array.isArray(values.clock) ? values.clock.map(c => {
                        const breakObj = {};
                        if (Array.isArray(c.breaks)) {
                            c.breaks.forEach((b, idx) => {
                                const keySuffix = idx === 0 ? '' : `_${idx + 1}`;
                                breakObj[`break_start${keySuffix}`] = b.start ? b.start.format('HH:mm:ss') : null;
                                breakObj[`break_end${keySuffix}`] = b.end ? b.end.format('HH:mm:ss') : null;
                            });
                        }
                        return {
                            ...c,
                            check_in: c.check_in ? c.check_in.format('HH:mm:ss') : null,
                            break: breakObj,
                            check_out: c.check_out ? c.check_out.format('HH:mm:ss') : null,
                        };
                    }) : [],
                    is_admin_action: true,
                };

                const url = editingAttendance && !editingAttendance.isPlaceholder
                    ? route('users-attendance.update', editingAttendance.id)
                    : route('users-attendance.store');
                const method = editingAttendance && !editingAttendance.isPlaceholder ? 'put' : 'post';

                try {
                    const response = await axios[method](url, submissionData);
                    setIsModalOpen(false);
                    api.success({
                        message: "Success",
                        description: response.data.message || `Attendance ${editingAttendance && !editingAttendance.isPlaceholder ? 'updated' : 'created'}`,
                        placement: "topRight"
                    });
                    router.reload({ only: ['attendances'] });
                } catch (error) {
                    const firstError = error.response?.data?.errors ? Object.values(error.response.data.errors)[0] : error.response?.data?.message;
                    api.error({
                        message: "Submission Failed",
                        description: firstError || "Could not save attendance.",
                        placement: "topRight"
                    });
                } finally {
                    setLoading(false);
                }
            });
        };

        const handleToggleIpRestriction = async (user, restricted) => {
            try {
                await axios.post(route('users-attendance.toggle-ip-restriction'), {
                    user_id: user.id,
                    ip_restriction: restricted
                });
                api.success({
                    message: "Permission Updated",
                    description: `IP restriction for ${user.name} set to ${restricted ? 'ON' : 'OFF'}`,
                    placement: "topRight"
                });
                router.reload({ only: ['users'] });
            } catch (error) {
                api.error({
                    message: "Error",
                    description: "Failed to update IP restriction",
                    placement: "topRight"
                });
            }
        };

        const handleConfigSubmit = (values) => {
            setLoading(true);
            const submissionData = {
                ...values,
                user_attendace_allowed_ips: allowedIPs
            };
            router.post(route('payroll.config.update'), { settings: submissionData }, {
                onSuccess: () => {
                    setIsConfigModalOpen(false);
                    api.success({ message: 'Success', description: 'Attendance settings updated successfully' });
                },
                onFinish: () => setLoading(false)
            });
        };

        return (
            <>
                {contextHolder}
                <Head title="Work Schedule - User Attendance" />
                <div className="container-fluid p-3">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <Breadcrumb
                            items={[
                                { title: <Link href="/">Home</Link> },
                                { title: "Work Schedule" },
                                { title: "User Attendance Logs" }
                            ]}
                        />
                        <div className="d-flex gap-2">
                            <Select
                                value={filterDate.month}
                                onChange={(v) => handleDateFilterChange('month', v)}
                                style={{ width: 130 }}
                                options={months.map((m, i) => ({ label: m, value: i }))}
                            />
                            <Select
                                value={filterDate.year}
                                onChange={(v) => handleDateFilterChange('year', v)}
                                style={{ width: 100 }}
                                options={years.map(y => ({ label: y, value: y }))}
                            />
                            <Button
                                icon={<SettingOutlined />}
                                onClick={() => {
                                    configForm.setFieldsValue(config);
                                    setIsConfigModalOpen(true);
                                }}
                            >
                                Settings
                            </Button>
                        </div>
                    </div>

                    <Card className="border-0 shadow-sm" bodyStyle={{ padding: 0, borderRadius: '12px', overflow: 'hidden' }}>
                        <div className="ag-grid-wrapper" style={{ height: '75vh' }}>
                            <AgGridReact
                                rowData={masterRowData}
                                columnDefs={masterColumnDefs}
                                defaultColDef={{
                                    ...defaultColDef,
                                    suppressMovable: true,
                                    cellClass: 'text-nowrap',
                                    wrapHeaderText: true,
                                    autoHeaderHeight: true,
                                }}
                                autoSizeStrategy={{
                                    type: "fitCellContents",
                                    skipHeader: false,
                                }}
                                theme={gridTheme}
                                pagination={true}
                                paginationPageSize={20}
                                sideBar={sideBarConfig}
                            />
                        </div>
                    </Card>
                </div>

                <Modal
                    title={`Attendance for ${selectedUserForAttendance?.name} (${months[filterDate.month]} ${filterDate.year})`}
                    open={isAttendanceGridModalOpen}
                    onCancel={() => setIsAttendanceGridModalOpen(false)}
                    footer={null}
                    width="90%"
                    style={{ top: 0 }}
                    centered
                >
                    <div style={{ height: '80vh', width: '100%' }} className="ag-theme-alpine">
                        <AgGridReact
                            rowData={userAttendanceRowData}
                            columnDefs={detailColumnDefs}
                            onGridReady={(params) => {
                                detailGridRef.current = params;
                                params.api.sizeColumnsToFit();
                            }}
                            getRowStyle={getRowStyle}
                            onFirstDataRendered={(params) => {
                                setTimeout(() => {
                                    const today = dayjs().format('YYYY-MM-DD');
                                    const rowIndex = userAttendanceRowData.findIndex(row => row.date === today);
                                    if (rowIndex !== -1) {
                                        params.api.ensureIndexVisible(rowIndex, 'middle');
                                        const displayedRow = params.api.getDisplayedRowAtIndex(rowIndex);
                                        if (displayedRow) {
                                            const rowNode = params.api.getRowNode(displayedRow.id);
                                            if (rowNode) {
                                                params.api.flashCells({ rowNodes: [rowNode] });
                                            }
                                        }
                                    }
                                }, 100);
                            }}
                            defaultColDef={{
                                ...defaultColDef,
                                suppressMovable: true,
                                cellClass: 'text-nowrap',
                                wrapText: true,
                                autoHeight: true,
                                wrapHeaderText: true,
                                autoHeaderHeight: true,
                            }}
                            theme={gridTheme}
                            pagination={false}
                        />
                    </div>
                </Modal>

                <Modal
                    title={editingAttendance && !editingAttendance.isPlaceholder ? "Edit Attendance" : "Mark Attendance"}
                    open={isModalOpen}
                    onOk={handleModalSubmit}
                    onCancel={() => setIsModalOpen(false)}
                    confirmLoading={loading}
                    width={700}
                    centered
                >
                    <Form form={form} layout="vertical" className="mt-3" onValuesChange={handleValuesChange}>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Item name="user_id" label="User" rules={[{ required: true }]}>
                                    <Select
                                        showSearch
                                        options={users.map(u => ({ label: u.name, value: u.id }))}
                                        disabled={!!editingAttendance}
                                    />
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                                    <DatePicker className="w-100" disabled={!!editingAttendance} />
                                </Form.Item>
                            </div>
                        </div>
                        <Card size="small" title="Work Records (Clock Segments)" className="mb-4 bg-light border-0">
                            <Form.List name="clock">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} className="bg-white p-3 rounded border mb-3 shadow-sm position-relative">
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => remove(name)}
                                                    className="position-absolute"
                                                    style={{ top: '8px', right: '8px', zIndex: 10 }}
                                                />
                                                <div className="row g-2 mb-3">
                                                    <div className="col-md-3">
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'work_from']}
                                                            label="Mode"
                                                            rules={[{ required: true }]}
                                                            initialValue="office"
                                                        >
                                                            <Select options={[{ label: 'Office', value: 'office' }, { label: 'Home', value: 'home' }]} />
                                                        </Form.Item>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'check_in']}
                                                            label="Check In"
                                                            rules={[{ required: true }]}
                                                        >
                                                            <TimePicker format="HH:mm" className="w-100" />
                                                        </Form.Item>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'check_out']}
                                                            label="Check Out"
                                                        >
                                                            <TimePicker format="HH:mm" className="w-100" />
                                                        </Form.Item>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'status']}
                                                            label="Status"
                                                            rules={[{ required: true }]}
                                                            initialValue="approved"
                                                        >
                                                            <Select options={[{ label: 'Pending', value: 'pending' }, { label: 'Approved', value: 'approved' }]} />
                                                        </Form.Item>
                                                    </div>
                                                </div>

                                                <div className="bg-light p-2 rounded">
                                                    <Form.List name={[name, 'breaks']}>
                                                        {(breakFields, { add: addBreak, remove: removeBreak }) => (
                                                            <>
                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                    <span className="small fw-bold text-muted px-1">BREAKS</span>
                                                                    <Button type="link" size="small" onClick={() => addBreak()} icon={<PlusOutlined />}>Add Break</Button>
                                                                </div>
                                                                {breakFields.map((breakField, bIdx) => (
                                                                    <div key={breakField.key} className="row g-2 mb-2 align-items-end">
                                                                        <div className="col-md-5">
                                                                            <Form.Item
                                                                                {...breakField}
                                                                                name={[breakField.name, 'start']}
                                                                                label={bIdx === 0 ? "Start" : ""}
                                                                                className="mb-0"
                                                                            >
                                                                                <TimePicker format="HH:mm" className="w-100" size="small" />
                                                                            </Form.Item>
                                                                        </div>
                                                                        <div className="col-md-5">
                                                                            <Form.Item
                                                                                {...breakField}
                                                                                name={[breakField.name, 'end']}
                                                                                label={bIdx === 0 ? "End" : ""}
                                                                                className="mb-0"
                                                                            >
                                                                                <TimePicker format="HH:mm" className="w-100" size="small" />
                                                                            </Form.Item>
                                                                        </div>
                                                                        <div className="col-md-2">
                                                                            <Button
                                                                                type="text"
                                                                                danger
                                                                                icon={<DeleteOutlined />}
                                                                                onClick={() => removeBreak(breakField.name)}
                                                                                size="small"
                                                                                className="w-100"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </>
                                                        )}
                                                    </Form.List>
                                                </div>
                                            </div>
                                        ))}
                                        <Button type="dashed" onClick={() => add({ work_from: 'office', status: 'approved' })} block icon={<PlusOutlined />}>
                                            Add Work Segment
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        </Card>

                        <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title={<Space><SettingOutlined /> Attendance Settings</Space>}
                    open={isConfigModalOpen}
                    onOk={() => configForm.submit()}
                    onCancel={() => setIsConfigModalOpen(false)}
                    confirmLoading={loading}
                    width={500}
                    centered
                    okText="Apply To All"
                >
                    <Form
                        form={configForm}
                        layout="vertical"
                        onFinish={handleConfigSubmit}
                        className="mt-3"
                    >
                        <Card size="small" className="bg-light border-0">
                            <Form.Item
                                name="attendance_early_checkin_max_hours"
                                label="Early Check-in Buffer (Hours)"
                                tooltip="Number of hours before shift start that a user is allowed to check in."
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <InputNumber style={{ width: '100%' }} min={0} max={24} precision={1} placeholder="System default: 2 hours" />
                            </Form.Item>

                            <Form.Item
                                name="attendance_late_checkout_max_hours"
                                label="Late Check-out Buffer (Hours)"
                                tooltip="Number of hours after shift end that a user is allowed to check out."
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <InputNumber style={{ width: '100%' }} min={0} max={24} precision={1} placeholder="System default: 4 hours" />
                            </Form.Item>

                            <div className="border-top pt-3 mt-3">
                                <label className="form-label text-muted small fw-bold mb-2">ALLOWED OFFICE IPs</label>
                                <div className="d-flex gap-2 mb-3">
                                    <Input
                                        placeholder="Enter IP Address"
                                        value={newIp}
                                        onChange={(e) => setNewIp(e.target.value)}
                                        onPressEnter={(e) => {
                                            e.preventDefault();
                                            if (newIp && !allowedIPs.includes(newIp)) {
                                                setAllowedIPs([...allowedIPs, newIp]);
                                                setNewIp("");
                                            }
                                        }}
                                    />
                                    <Button
                                        type="primary"
                                        onClick={() => {
                                            if (newIp && !allowedIPs.includes(newIp)) {
                                                setAllowedIPs([...allowedIPs, newIp]);
                                                setNewIp("");
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {allowedIPs.length > 0 ? allowedIPs.map((ip, idx) => (
                                        <Tag
                                            key={idx}
                                            closable
                                            onClose={() => setAllowedIPs(allowedIPs.filter((_, i) => i !== idx))}
                                            className="px-2 py-1"
                                        >
                                            {ip}
                                        </Tag>
                                    )) : (
                                        <span className="text-muted small">No IPs added. IP restriction will block all if enabled for user.</span>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <div className="mt-3 text-muted" style={{ fontSize: '11px' }}>
                            <p className="mb-1"><strong>Note:</strong> Buffers control the check-in/out window. Allowed IPs restrict attendance marking to specific locations for users with IP restriction enabled.</p>
                        </div>
                    </Form>
                </Modal>
            </>
        );
    };

UserAttendance.layout = (page) => <MainLayout children={page} />;

export default UserAttendance;
