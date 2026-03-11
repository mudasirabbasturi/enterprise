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
            const { check_in, check_out, break: breaks } = record;
            if (!check_in || !check_out) return 0;
            const s = dayjs(`2000-01-01 ${check_in}`);
            const e = dayjs(`2000-01-01 ${check_out}`);
            let diff = e.diff(s, 'minute');
            if (diff < 0) diff += 1440; // Handle night shifts

            if (Array.isArray(breaks)) {
                breaks.forEach(b => {
                    if (b.break_start && b.break_end) {
                        const bs = dayjs(`2000-01-01 ${b.break_start}`);
                        const be = dayjs(`2000-01-01 ${b.break_end}`);
                        let bDiff = be.diff(bs, 'minute');
                        if (bDiff < 0) bDiff += 1440;
                        diff -= bDiff;
                    }
                });
            }
            return diff > 0 ? diff : 0;
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

        const sumOutsideHoursMins = (entries) => {
            if (!entries || !Array.isArray(entries)) return 0;
            return entries.reduce((acc, entry) => {
                if (entry.manual_hours) {
                    return acc + timeStringToMins(entry.manual_hours);
                }
                return acc;
            }, 0);
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
                headerName: "Present",
                field: "present",
                minWidth: 90,
                cellClass: "text-success fw-bold text-center text-nowrap",
            },
            {
                headerName: "Absent",
                field: "absent",
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
            {
                headerName: "Required Regular Hours",
                field: "totalRequiredHours",
                minWidth: 120,
                cellClass: "text-center text-nowrap",
                cellRenderer: (params) => <Tag color="orange">{params.value}</Tag>
            },
            {
                headerName: "Regular Hours",
                field: "regularHours",
                minWidth: 110,
                cellClass: "fw-bold text-center text-nowrap",
                cellRenderer: (params) => <Tag color="geekblue">{params.value}</Tag>
            },
            {
                headerName: "Outside Hours",
                field: "outsideHours",
                minWidth: 110,
                cellClass: "fw-bold text-center text-nowrap",
                cellRenderer: (params) => <Tag color="magenta">{params.value}</Tag>
            },
            {
                headerName: "Total Hours",
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

                const present = userRecs.filter(a => ['present', 'late'].includes(a.status)).length;
                const absent = userRecs.filter(a => a.status === 'absent').length;

                // Leave calculation
                const userLeaves = (leaveRequests || []).filter(l => l.user_id === userId && l.status === 'approved');
                let leaveCount = 0;
                const daysInMonth = getDaysInMonth(filterDate.year, filterDate.month);
                daysInMonth.forEach(d => {
                    const date = dayjs(d);
                    const isLeave = userLeaves.some(l =>
                        date.isSameOrAfter(dayjs(l.start_date), 'day') &&
                        date.isSameOrBefore(dayjs(l.end_date), 'day')
                    );
                    if (isLeave) leaveCount++;
                });

                // Required Hours
                let totalRequiredMinutes = 0;
                daysInMonth.forEach(d => {
                    const dayName = dayjs(d).format('dddd');
                    const schedule = (user.user_shift_schedules || []).find(s => s.day === dayName);
                    if (schedule && schedule.shift) {
                        if (schedule.shift.duration) {
                            totalRequiredMinutes += parseInt(schedule.shift.duration);
                        } else if (schedule.shift.start_time && schedule.shift.end_time) {
                            const start = dayjs(`2000-01-01 ${schedule.shift.start_time}`);
                            const end = dayjs(`2000-01-01 ${schedule.shift.end_time}`);
                            let diff = end.diff(start, 'minute');
                            if (diff < 0) diff += 1440;
                            totalRequiredMinutes += diff;
                        }
                    }
                });

                const totalRegMins = userRecs.reduce((acc, curr) => {
                    return acc + (curr.total_regular_hours ? timeStringToMins(curr.total_regular_hours) : calculateHoursMins(curr));
                }, 0);

                const totalOutMins = userRecs.reduce((acc, curr) => {
                    return acc + sumOutsideHoursMins(curr.total_outside_hours);
                }, 0);

                return {
                    ...user,
                    present,
                    absent,
                    leaveCount,
                    totalRequiredHours: formatMins(totalRequiredMinutes),
                    regularHours: formatMins(totalRegMins),
                    outsideHours: formatMins(totalOutMins),
                    totalHours: formatMins(totalRegMins + totalOutMins)
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
                field: "status",
                minWidth: 200,
                cellClass: "text-nowrap",
                cellRenderer: (params) => {
                    const { status, check_in, total_outside_hours } = params.data;

                    const isMarked = status === 'present' || status === 'late' || status === 'absent';
                    const isClosed = status === 'Weekend' || status === 'Holiday';
                    const isLeave = status === 'On Leave' || status === 'leave';

                    if (isMarked) {
                        const hasRegular = !!check_in;
                        const hasManual = Array.isArray(total_outside_hours) && total_outside_hours.length > 0;

                        return (
                            <div className="d-flex align-items-center gap-2">
                                <Tag color="success" className="m-0">MARKED</Tag>
                                <div className="d-flex align-items-center gap-1 border-start ps-2" style={{ fontSize: '11px' }}>
                                    <span className="d-flex align-items-center gap-1">
                                        {hasRegular ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseCircleFilled style={{ color: '#ff4d4f' }} />}
                                        <span className="text-muted">Reg</span>
                                    </span>
                                    <span className="text-muted mx-1">/</span>
                                    <span className="d-flex align-items-center gap-1">
                                        {hasManual ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseCircleFilled style={{ color: '#ff4d4f' }} />}
                                        <span className="text-muted">Man</span>
                                    </span>
                                </div>
                            </div>
                        );
                    }

                    if (isLeave) return <Tag color="blue">LEAVE</Tag>;
                    if (isClosed) return <Tag color="default">{status.toUpperCase()}</Tag>;
                    if (status === 'Not Marked') return <Tag color="processing">NOT MARKED</Tag>;

                    return <Tag>{status?.toUpperCase() || '-'}</Tag>;
                }
            },
            {
                headerName: "Check In",
                field: "check_in",
                minWidth: 100,
                cellClass: "text-nowrap",
                cellRenderer: (params) => params.value ? <Tag color="cyan">{params.value}</Tag> : "-"
            },
            {
                headerName: "Breaks",
                field: "break",
                minWidth: 150,
                cellClass: "text-nowrap",
                cellRenderer: (params) => {
                    const breaks = params.value;
                    if (!Array.isArray(breaks) || breaks.length === 0) return "-";

                    return (
                        <div className="d-flex align-items-center gap-1 flex-wrap">
                            {breaks.map((b, idx) => (
                                <Tag color="orange" key={idx} className="m-0 text-nowrap">
                                    {b.break_start || '...'} to {b.break_end || '...'}
                                </Tag>
                            ))}
                        </div>
                    );
                }
            },
            {
                headerName: "Required Hours",
                minWidth: 120,
                cellClass: "text-center text-nowrap",
                cellRenderer: (params) => {
                    const userId = params.data.user_id || selectedUserForAttendance?.id;
                    const date = params.data.date;
                    const shiftHrs = getShiftHoursForDay(userId, date);
                    if (shiftHrs === null) return "-";

                    const totalMins = Math.round(shiftHrs * 60);
                    return <Tag color="orange">{formatMins(totalMins)}</Tag>;
                }
            },
            {
                headerName: "Regular Hours",
                field: "total_regular_hours",
                minWidth: 110,
                cellClass: "text-nowrap",
                cellRenderer: (params) => {
                    const manual = params.value;
                    const calculated = calculateHoursMins(params.data);
                    const display = manual ? formatMins(timeStringToMins(manual)) : (calculated > 0 ? formatMins(calculated) : "-");
                    return <Tag color="geekblue">{display}</Tag>;
                }
            },
            {
                headerName: "Outside Hours",
                field: "total_outside_hours",
                minWidth: 200,
                flex: 1,
                cellClass: "text-nowrap",
                cellRenderer: (params) => {
                    const entries = params.value;
                    if (!Array.isArray(entries) || entries.length === 0) return "-";

                    return (
                        <div className="d-flex align-items-center gap-1">
                            {entries.map((entry, idx) => (
                                <span key={idx} className="d-flex align-items-center gap-1">
                                    <Tag color={entry.work_from === 'home' ? 'blue' : 'orange'} style={{ margin: 0 }} className="d-flex align-items-center gap-1">
                                        {entry.work_from === 'home' ? <HomeOutlined style={{ fontSize: '12px' }} /> : <ApartmentOutlined style={{ fontSize: '12px' }} />}
                                        {entry.manual_hours}
                                    </Tag>
                                    <Tag color={entry.status === 'approved' ? 'success' : 'warning'} style={{ fontSize: '10px', margin: 0 }}>
                                        {entry.status === 'approved' ? 'App' : 'Pend'}
                                    </Tag>
                                    {idx < entries.length - 1 && <span className="text-muted">/</span>}
                                </span>
                            ))}
                        </div>
                    );
                }
            },
            {
                headerName: "Check Out",
                field: "check_out",
                minWidth: 100,
                cellClass: "text-nowrap",
                cellRenderer: (params) => params.value ? <Tag color="blue">{params.value}</Tag> : "-"
            },
            {
                headerName: "Worked From",
                field: "worked_from",
                minWidth: 120,
                cellClass: "text-nowrap",
                cellRenderer: (params) => (
                    <Tag color={params.value === 'home' ? 'blue' : 'orange'}>
                        {params.value ? params.value.toUpperCase() : 'OFFICE'}
                    </Tag>
                )
            },
            {
                headerName: "Check In IP",
                field: "check_in_ip",
                minWidth: 120,
                cellClass: "text-nowrap",
                cellRenderer: (params) => params.value ? <small className="font-monospace text-muted" style={{ fontSize: '10px' }}>{params.value}</small> : "-"
            },
            {
                headerName: "Check Out IP",
                field: "check_out_ip",
                minWidth: 120,
                cellClass: "text-nowrap",
                cellRenderer: (params) => params.value ? <small className="font-monospace text-muted" style={{ fontSize: '10px' }}>{params.value}</small> : "-"
            },
            {
                headerName: "Leave Status",
                field: "leave_status",
                minWidth: 130,
                cellClass: "text-nowrap",
                cellRenderer: (params) => {
                    if (!params.value) return "-";
                    return <Tag color="blue">{params.value}</Tag>;
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

                return {
                    ...(existing || {}),
                    user_id: selectedUserForAttendance.id,
                    date: d,
                    day: dayName,
                    office_status: (holiday || !hasShift) ? 'Closed' : 'Open',
                    status: status,
                    leave_status: onLeave ? onLeave.leave_type?.name || 'On Leave' : (holiday ? holiday.title : null),
                    isPlaceholder: !existing
                };
            }).sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
        }, [selectedUserForAttendance, attendances, filterDate, getDaysInMonth, leaveRequests, holidays]);

        const handleValuesChange = (changedValues, allValues) => {
            if (changedValues.check_in || changedValues.check_out || changedValues.break) {
                const { check_in, check_out, break: breaks } = allValues;
                if (check_in && check_out) {
                    const s = dayjs(check_in);
                    const e = dayjs(check_out);
                    let diff = e.diff(s, 'minute');
                    if (diff < 0) diff += 1440; // Handle night shifts

                    if (Array.isArray(breaks)) {
                        breaks.forEach(b => {
                            if (b && b.break_start && b.break_end) {
                                const bs = dayjs(b.break_start);
                                const be = dayjs(b.break_end);
                                let bDiff = be.diff(bs, 'minute');
                                if (bDiff < 0) bDiff += 1440;
                                diff -= bDiff;
                            }
                        });
                    }

                    if (diff < 0) diff = 0;

                    const hrs = Math.floor(diff / 60).toString().padStart(2, '0');
                    const mins = (diff % 60).toString().padStart(2, '0');
                    form.setFieldsValue({ total_regular_hours: `${hrs}:${mins}` });
                }
            }
        };


        const handleEdit = (rec) => {

            setEditingAttendance(rec);
            form.setFieldsValue({
                user_id: rec.user_id,
                date: dayjs(rec.date),
                check_in: rec.check_in ? dayjs(rec.check_in, 'HH:mm:ss') : null,
                check_out: rec.check_out ? dayjs(rec.check_out, 'HH:mm:ss') : null,
                break: Array.isArray(rec.break) ? rec.break.map(b => ({
                    break_start: b.break_start ? dayjs(b.break_start, 'HH:mm:ss') : null,
                    break_end: b.break_end ? dayjs(b.break_end, 'HH:mm:ss') : null,
                })) : [],
                status: rec.status === 'Not Marked' || rec.status === 'Weekend' || rec.status === 'Holiday' ? 'present' : rec.status,
                worked_from: rec.worked_from || 'office',
                total_regular_hours: rec.total_regular_hours,
                total_outside_hours: Array.isArray(rec.total_outside_hours) ? rec.total_outside_hours.map(h => ({
                    ...h,
                    status: h.status || 'pending',
                    hh: h.manual_hours?.split(':')[0] || '00',
                    mm: h.manual_hours?.split(':')[1] || '00'
                })) : [],
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
                let finalStatus = values.status || (editingAttendance?.status || 'present');
                if (finalStatus === 'Not Marked' || finalStatus === 'Weekend' || finalStatus === 'Holiday') {
                    finalStatus = 'present';
                }

                const submissionData = {
                    ...values,
                    status: finalStatus,
                    date: values.date.format('YYYY-MM-DD'),
                    check_in: values.check_in ? values.check_in.format('HH:mm:ss') : null,
                    check_out: values.check_out ? values.check_out.format('HH:mm:ss') : null,
                    break: Array.isArray(values.break) ? values.break.map(b => ({
                        break_start: b && b.break_start ? b.break_start.format('HH:mm:ss') : null,
                        break_end: b && b.break_end ? b.break_end.format('HH:mm:ss') : null,
                    })) : [],
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
                            pagination={true}
                            paginationPageSize={20}
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
                        <div className="row">
                            <div className="col-md-3">
                                <Form.Item name="check_in" label="Check In">
                                    <TimePicker className="w-100" format="HH:mm" />
                                </Form.Item>
                            </div>
                            <div className="col-md-3">
                                <Form.Item name="check_out" label="Check Out">
                                    <TimePicker className="w-100" format="HH:mm" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12">
                                <Card size="small" title="Breaks" className="mb-4 bg-light border-0">
                                    <Form.List name="break">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }) => (
                                                    <div key={key} className="d-flex align-items-center gap-2 mb-2 p-2 bg-white rounded border">
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'break_start']}
                                                            className="mb-0 flex-grow-1"
                                                            label="Break Start"
                                                            rules={[{ required: true, message: 'Required' }]}
                                                        >
                                                            <TimePicker format="HH:mm" className="w-100" />
                                                        </Form.Item>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'break_end']}
                                                            className="mb-0 flex-grow-1"
                                                            label="Break End"
                                                        >
                                                            <TimePicker format="HH:mm" className="w-100" />
                                                        </Form.Item>
                                                        <button
                                                            className="btn btn-outline-danger btn-sm mt-4 p-1 border-0"
                                                            onClick={(e) => { e.preventDefault(); remove(name); }}
                                                        >
                                                            <DeleteOutlined />
                                                        </button>
                                                    </div>
                                                ))}
                                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                    Add Break
                                                </Button>
                                            </>
                                        )}
                                    </Form.List>
                                </Card>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Item name="worked_from" label="Worked From" rules={[{ required: true }]}>
                                    <Select options={[
                                        { label: 'Office', value: 'office' },
                                        { label: 'Home', value: 'home' }
                                    ]} />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Item label="Total Regular Hours">
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prevValues, currentValues) => prevValues.total_regular_hours !== currentValues.total_regular_hours}
                                    >
                                        {({ getFieldValue }) => {
                                            const currentValue = getFieldValue('total_regular_hours') || '00:00';
                                            const [hh, mm] = currentValue.split(':');
                                            return (
                                                <div className="d-flex align-items-center gap-2">
                                                    <Select
                                                        showSearch
                                                        placeholder="HH"
                                                        style={{ width: '80px' }}
                                                        value={hh || '00'}
                                                        onChange={(val) => {
                                                            const current = getFieldValue('total_regular_hours') || '00:00';
                                                            const mins = current.split(':')[1] || '00';
                                                            form.setFieldsValue({ total_regular_hours: `${val}:${mins}` });
                                                        }}
                                                        options={Array.from({ length: 24 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i.toString().padStart(2, '0') }))}
                                                    />
                                                    <span>:</span>
                                                    <Select
                                                        showSearch
                                                        placeholder="mm"
                                                        style={{ width: '80px' }}
                                                        value={mm || '00'}
                                                        onChange={(val) => {
                                                            const current = getFieldValue('total_regular_hours') || '00:00';
                                                            const hrs = current.split(':')[0] || '00';
                                                            form.setFieldsValue({ total_regular_hours: `${hrs}:${val}` });
                                                        }}
                                                        options={Array.from({ length: 60 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i.toString().padStart(2, '0') }))}
                                                    />
                                                </div>
                                            );
                                        }}
                                    </Form.Item>
                                    <Form.Item name="total_regular_hours" noStyle><Input type="hidden" /></Form.Item>
                                </Form.Item>
                            </div>
                            <div className="row">
                                <div className="col-12">
                                    <Card size="small" title="Manual Outside Hours Entries" className="mb-4 bg-light border-0">
                                        <Form.List name="total_outside_hours">
                                            {(fields, { add, remove }) => (
                                                <>
                                                    {fields.map(({ key, name, ...restField }) => (
                                                        <div key={key} className="d-flex align-items-end gap-2 mb-3 bg-white p-2 rounded shadow-sm border">
                                                            <div className="d-flex align-items-center gap-1">
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'hh']}
                                                                    noStyle
                                                                    initialValue={form.getFieldValue(['total_outside_hours', name, 'manual_hours'])?.split(':')[0] || '00'}
                                                                >
                                                                    <Select
                                                                        showSearch
                                                                        placeholder="HH"
                                                                        style={{ width: '70px' }}
                                                                        options={Array.from({ length: 24 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i.toString().padStart(2, '0') }))}
                                                                        onChange={(val) => {
                                                                            const current = form.getFieldValue(['total_outside_hours', name]);
                                                                            const mm = current.mm || '00';
                                                                            const updated = [...form.getFieldValue('total_outside_hours')];
                                                                            updated[name] = { ...current, manual_hours: `${val}:${mm}`, hh: val };
                                                                            form.setFieldsValue({ total_outside_hours: updated });
                                                                        }}
                                                                    />
                                                                </Form.Item>
                                                                <span>:</span>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'mm']}
                                                                    noStyle
                                                                    initialValue={form.getFieldValue(['total_outside_hours', name, 'manual_hours'])?.split(':')[1] || '00'}
                                                                >
                                                                    <Select
                                                                        showSearch
                                                                        placeholder="mm"
                                                                        style={{ width: '70px' }}
                                                                        options={Array.from({ length: 60 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i.toString().padStart(2, '0') }))}
                                                                        onChange={(val) => {
                                                                            const current = form.getFieldValue(['total_outside_hours', name]);
                                                                            const hh = current.hh || '00';
                                                                            const updated = [...form.getFieldValue('total_outside_hours')];
                                                                            updated[name] = { ...current, manual_hours: `${hh}:${val}`, mm: val };
                                                                            form.setFieldsValue({ total_outside_hours: updated });
                                                                        }}
                                                                    />
                                                                </Form.Item>
                                                            </div>
                                                            <Form.Item name={[name, 'manual_hours']} noStyle><Input type="hidden" /></Form.Item>
                                                            <div className="flex-grow-1">
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'work_from']}
                                                                    label="Work From"
                                                                    rules={[{ required: true, message: 'Required' }]}
                                                                    className="mb-0"
                                                                >
                                                                    <Select options={[{ label: 'Office', value: 'office' }, { label: 'Home', value: 'home' }]} />
                                                                </Form.Item>
                                                            </div>
                                                            <div style={{ width: '100px' }}>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'status']}
                                                                    label="Status"
                                                                    rules={[{ required: true }]}
                                                                    className="mb-0"
                                                                    initialValue={form.getFieldValue(['total_outside_hours', name, 'status']) || 'pending'}
                                                                >
                                                                    <Select options={[
                                                                        { label: 'Pending', value: 'pending' },
                                                                        { label: 'Approved', value: 'approved' }
                                                                    ]} />
                                                                </Form.Item>
                                                            </div>
                                                            <button
                                                                className="btn btn-outline-danger btn-sm p-2"
                                                                onClick={() => remove(name)}
                                                                style={{ height: '32px', display: 'flex', alignItems: 'center' }}
                                                            >
                                                                <DeleteOutlined />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        className="btn btn-outline-primary btn-sm w-100 mt-2"
                                                        onClick={() => add({ manual_hours: '01:00', work_from: 'office', status: 'approved' })}
                                                    >
                                                        <PlusCircleOutlined className="me-1" /> Add Manual Entry
                                                    </button>
                                                </>
                                            )}
                                        </Form.List>
                                    </Card>
                                </div>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="fw-bold small text-muted d-block mb-1">Status</label>
                            <Tag color={
                                editingAttendance?.status === 'present' || editingAttendance?.status === 'late' || editingAttendance?.status === 'absent' ? 'success' :
                                    editingAttendance?.status === 'On Leave' || editingAttendance?.status === 'leave' ? 'blue' :
                                        editingAttendance?.status === 'Weekend' || editingAttendance?.status === 'Holiday' ? 'default' :
                                            editingAttendance?.status === 'Not Marked' ? 'processing' : 'default'
                            } className="px-3 py-1 fw-bold">
                                {(editingAttendance?.status || 'Not Marked').toUpperCase()}
                            </Tag>
                        </div>
                        <Form.Item name="status" noStyle><Input type="hidden" /></Form.Item>
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
