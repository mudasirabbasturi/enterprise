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
    CheckOutlined, PlusCircleOutlined, CloseCircleFilled,
    DeleteOutlined,
    HomeOutlined,
    ApartmentOutlined,
    Select, EditOutlined, LoginOutlined, LogoutOutlined,
    Badge,
    Calendar,
    Alert
} from "@shared/ui";
import MainLayout from "@layout";

const MyAttendance = ({ attendances, selectedYear, auth, leaveRequests, userShiftSchedules, holidays }) => {
    const [api, contextHolder] = notification.useNotification();
    const [loading, setLoading] = useState(false);
    const [isAttendanceGridModalOpen, setIsAttendanceGridModalOpen] = useState(false);
    const [selectedMonthForAttendance, setSelectedMonthForAttendance] = useState(null);
    const [workedFrom, setWorkedFrom] = useState('office');
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [currentActionRecord, setCurrentActionRecord] = useState(null);
    const [newOutsideEntry, setNewOutsideEntry] = useState({ hh: '01', mm: '00', work_from: 'office' });

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

    const handleCheckIn = (date) => {
        setLoading(true);
        axios.post(route('users-attendance.store'), {
            user_id: user.id,
            date: date,
            status: 'present',
            check_in: dayjs().format('HH:mm:ss'),
            worked_from: workedFrom,
        }).then(() => {
            api.success({ message: "Checked In Successfully" });
            setIsActionModalOpen(false);
            router.reload({ only: ['attendances'] });
        }).catch(err => {
            api.error({ message: "Check In Failed", description: err.response?.data?.message || "Internal Error" });
        }).finally(() => setLoading(false));
    };

    const handleCheckOut = (record) => {
        setLoading(true);
        axios.put(route('users-attendance.update', record.id), {
            ...record,
            check_out: dayjs().format('HH:mm:ss')
        }).then(() => {
            api.success({ message: "Checked Out Successfully" });
            setIsActionModalOpen(false);
            router.reload({ only: ['attendances'] });
        }).catch(err => {
            api.error({ message: "Check Out Failed", description: err.response?.data?.message || "Internal Error" });
        }).finally(() => setLoading(false));
    };

    const handleBreakStart = (record) => {
        setLoading(true);
        axios.put(route('users-attendance.update', record.id), {
            ...record,
            break_start: dayjs().format('HH:mm:ss')
        }).then(() => {
            api.success({ message: "Break Started" });
            setIsActionModalOpen(false);
            router.reload({ only: ['attendances'] });
        }).catch(err => {
            api.error({ message: "Failed", description: err.response?.data?.message });
        }).finally(() => setLoading(false));
    };

    const handleBreakEnd = (record) => {
        setLoading(true);
        axios.put(route('users-attendance.update', record.id), {
            ...record,
            break_end: dayjs().format('HH:mm:ss')
        }).then(() => {
            api.success({ message: "Break Ended" });
            setIsActionModalOpen(false);
            router.reload({ only: ['attendances'] });
        }).catch(err => {
            api.error({ message: "Failed", description: err.response?.data?.message });
        }).finally(() => setLoading(false));
    };

    // Main Grid Columns (Months)
    const columnDefs = useMemo(() => [
        {
            headerName: "Month",
            field: "monthName",
            cellClass: "fw-bold text-primary text-nowrap"
        },
        {
            headerName: "Present",
            field: "present",
            cellClass: "text-success fw-bold text-center text-nowrap",
        },
        {
            headerName: "Absent",
            field: "absent",
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
            field: "totalRequiredMinutes",
            minWidth: 120,
            cellClass: "text-center text-nowrap",
            cellRenderer: (params) => <Tag color="orange">{formatMinsToHrs(params.value)}</Tag>
        },
        {
            headerName: "Total Regular Hours",
            field: "totalRegularMinutes",
            cellRenderer: (params) => <Tag color="geekblue">{formatMinsToHrs(params.value)}</Tag>,
            cellClass: "text-center text-nowrap"
        },
        {
            headerName: "Total Outside Hours",
            field: "totalOutsideMinutes",
            cellRenderer: (params) => <Tag color="magenta">{formatMinsToHrs(params.value)}</Tag>,
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
            const present = monthAttendances.filter(a => ['present', 'late'].includes(a.status)).length;
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

            const totalRegularMinutes = monthAttendances.reduce((acc, curr) => {
                if (curr.total_regular_hours) {
                    const [h, m] = curr.total_regular_hours.split(':').map(Number);
                    return acc + (h * 60) + m;
                }
                return acc + getHoursMins(curr);
            }, 0);

            const totalOutsideMinutes = monthAttendances.reduce((acc, curr) => {
                return acc + sumOutsideHoursMins(curr.total_outside_hours);
            }, 0);

            return { monthName: m, monthIndex: i, present, absent, leaveCount, totalRequiredMinutes, totalRegularMinutes, totalOutsideMinutes };
        });
    }, [attendances, filterYear, leaveRequests, userShiftSchedules]);

    // Detail Grid Columns
    const detailColumnDefs = useMemo(() => [
        {
            headerName: "Date",
            field: "date",
            minWidth: 120,
            cellClass: "fw-medium"
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
            field: "status",
            minWidth: 130,
            cellRenderer: (params) => {
                const isClosed = params.value === 'Weekend' || params.value === 'Holiday';
                return <Tag color={isClosed ? 'error' : 'success'}>
                    {isClosed ? 'Office Closed' : 'Office Open'}
                </Tag>;
            }
        },
        {
            headerName: "Status",
            field: "status",
            minWidth: 200,
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
            cellRenderer: (params) => params.value ? <Tag color="cyan">{params.value}</Tag> : "-"
        },
        {
            headerName: "Break Start",
            field: "break_start",
            minWidth: 110,
            cellRenderer: (params) => params.value ? <Tag color="orange">{params.value}</Tag> : "-"
        },
        {
            headerName: "Break End",
            field: "break_end",
            minWidth: 110,
            cellRenderer: (params) => params.value ? <Tag color="orange">{params.value}</Tag> : "-"
        },
        {
            headerName: "Required Hours",
            field: "date",
            minWidth: 130,
            cellRenderer: (params) => {
                const dayName = dayjs(params.value).format('dddd');
                const schedule = (userShiftSchedules || []).find(s => s.day === dayName);
                if (schedule && schedule.shift) {
                    if (schedule.shift.duration) {
                        return <Tag color="orange">{formatMinsToHrs(parseInt(schedule.shift.duration))}</Tag>;
                    } else if (schedule.shift.start_time && schedule.shift.end_time) {
                        const start = dayjs(`2000-01-01 ${schedule.shift.start_time}`);
                        const end = dayjs(`2000-01-01 ${schedule.shift.end_time}`);
                        let diff = end.diff(start, 'minute');
                        if (diff < 0) diff += 1440;
                        return <Tag color="orange">{formatMinsToHrs(diff)}</Tag>;
                    }
                }
                return "-";
            }
        },
        {
            headerName: "Regular Hours",
            field: "total_regular_hours",
            minWidth: 120,
            cellRenderer: (params) => {
                const manual = params.value;
                const calculated = calculateHours(params.data);
                const display = (manual ? formatManualTime(manual) : null) || calculated || "-";
                return <Tag color="geekblue">{display}</Tag>;
            }
        },
        {
            headerName: "Outside Hours",
            field: "total_outside_hours",
            minWidth: 180,
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
            flex: 1,
            cellRenderer: (params) => params.value ? <Tag color="blue">{params.value}</Tag> : "-"
        },
        {
            headerName: "Worked From",
            field: "worked_from",
            minWidth: 120,
            cellRenderer: (params) => (
                <Tag color={params.value === 'home' ? 'blue' : 'orange'}>
                    {params.value ? params.value.toUpperCase() : 'OFFICE'}
                </Tag>
            )
        },
        {
            headerName: "Check In IP",
            field: "check_in_ip",
            minWidth: 100,
            cellRenderer: (params) => params.value ? <small className="font-monospace text-muted" style={{ fontSize: '10px' }}>{params.value}</small> : "-"
        },
        {
            headerName: "Check Out IP",
            field: "check_out_ip",
            minWidth: 100,
            cellRenderer: (params) => params.value ? <small className="font-monospace text-muted" style={{ fontSize: '10px' }}>{params.value}</small> : "-"
        },
        {
            headerName: "Actions",
            width: 150,
            minWidth: 180,
            sortable: false,
            filter: false,
            pinned: "right",
            cellRenderer: (params) => {
                const { status, date, isPlaceholder } = params.data;
                if (status === 'On Leave') return <Tag color="blue">ON LEAVE</Tag>;

                const today = dayjs().format('YYYY-MM-DD');
                const isToday = date === today;
                const isPast = dayjs(date).isBefore(today, 'day');
                const isFuture = dayjs(date).isAfter(today, 'day');
                const isMarked = !isPlaceholder && status !== 'Not Marked';
                const isWeekend = status === 'Weekend';
                const isHoliday = status === 'Holiday';
                const isOffDay = isWeekend || isHoliday;

                const needsCheckOut = params.data.check_in && !params.data.check_out;

                if (isMarked) {
                    if (isToday || needsCheckOut) {
                        return (
                            <button
                                className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center w-100"
                                onClick={() => {
                                    setCurrentActionRecord(params.data);
                                    setIsActionModalOpen(true);
                                }}
                            >
                                {needsCheckOut ? <LoginOutlined className="me-1" /> : <EditOutlined className="me-1" />}
                                {needsCheckOut ? "Action" : "Edit"}
                            </button>
                        );
                    }
                    return <Tag color="success">MARKED</Tag>;
                }

                if (isFuture) return <small className="text-muted italic">Upcoming</small>;

                if (isToday) {
                    return (
                        <button
                            className={`btn btn-sm d-flex align-items-center justify-content-center w-100 ${isOffDay ? 'btn-outline-warning' : 'btn-success'}`}
                            onClick={() => {
                                setCurrentActionRecord(params.data);
                                setIsActionModalOpen(true);
                            }}
                        >
                            <PlusCircleOutlined className="me-1" /> {isOffDay ? 'Log Hours' : 'Mark'}
                        </button>
                    );
                }

                return <small className="text-muted italic">Closed</small>;
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

            if (existing) {
                return {
                    ...existing,
                    status: onLeave ? 'On Leave' : existing.status
                };
            }

            let status = 'Not Marked';
            if (onLeave) status = 'On Leave';
            else if (holiday) status = 'Holiday';
            else if (!hasShift) status = 'Weekend';

            return {
                user_id: user.id,
                date: d,
                status: status,
                isPlaceholder: true
            };
        }).sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
    }, [selectedMonthForAttendance, attendances, filterYear, getDaysInMonth, user.id, holidays]);

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
                width="90%"
                style={{ top: 0 }}
                centered
            >
                <div style={{ height: '80vh' }} className="ag-theme-alpine">
                    <AgGridReact
                        rowData={userAttendanceRowData}
                        columnDefs={detailColumnDefs}
                        defaultColDef={{
                            ...defaultColDef,
                            suppressMovable: true,
                            cellClass: 'text-nowrap',
                            wrapHeaderText: true,
                            autoHeaderHeight: true,
                            wrapText: true,
                            autoHeight: true,
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
                width={400}
            >
                {currentActionRecord && (
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
                                        disabled={(currentActionRecord.status === 'Weekend' || currentActionRecord.status === 'Holiday') && !currentActionRecord.check_in}
                                    />
                                </div>
                            </div>

                            {/* Regular Attendance Section */}
                            <div className={`border rounded p-3 ${(currentActionRecord.status === 'Weekend' || currentActionRecord.status === 'Holiday') ? 'bg-secondary-subtle opacity-75' : 'bg-light'}`}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="fw-bold small text-muted">Regular Attendance (Shift)</label>
                                    {currentActionRecord.status === 'Weekend' && <Tag color="warning">Weekend – Read Only</Tag>}
                                    {currentActionRecord.status === 'Holiday' && <Tag color="magenta">Holiday – Read Only</Tag>}
                                </div>
                                {(currentActionRecord.status === 'Weekend' || currentActionRecord.status === 'Holiday') ? (
                                    <div className="d-flex flex-wrap gap-2">
                                        <div className="d-flex align-items-center gap-1">
                                            <small className="text-muted">Check In:</small>
                                            {currentActionRecord.check_in
                                                ? <Tag color="cyan">{currentActionRecord.check_in}</Tag>
                                                : <small className="text-muted fst-italic">—</small>}
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            <small className="text-muted">Break:</small>
                                            {currentActionRecord.break_start
                                                ? <Tag color="orange">{currentActionRecord.break_start} → {currentActionRecord.break_end || '…'}</Tag>
                                                : <small className="text-muted fst-italic">—</small>}
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            <small className="text-muted">Check Out:</small>
                                            {currentActionRecord.check_out
                                                ? <Tag color="blue">{currentActionRecord.check_out}</Tag>
                                                : <small className="text-muted fst-italic">—</small>}
                                        </div>
                                    </div>
                                ) : !currentActionRecord.check_in ? (
                                    <button
                                        className="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center"
                                        disabled={loading}
                                        onClick={() => {
                                            handleCheckIn(currentActionRecord.date);
                                        }}
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
                                                    onClick={() => {
                                                        handleBreakStart(currentActionRecord);
                                                    }}
                                                >
                                                    Break Start
                                                </button>
                                            </div>
                                            <div className="col-6">
                                                <button
                                                    className="btn btn-warning w-100 py-2"
                                                    disabled={!currentActionRecord.break_start || !!currentActionRecord.break_end || loading}
                                                    onClick={() => {
                                                        handleBreakEnd(currentActionRecord);
                                                    }}
                                                >
                                                    Break End
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-danger w-100 py-2 d-flex align-items-center justify-content-center"
                                            disabled={loading}
                                            onClick={() => {
                                                handleCheckOut(currentActionRecord);
                                            }}
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
                                                    options={Array.from({ length: 24 }, (_, i) => ({
                                                        label: i.toString().padStart(2, '0'),
                                                        value: i.toString().padStart(2, '0')
                                                    }))}
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
                                                    options={Array.from({ length: 60 }, (_, i) => ({
                                                        label: i.toString().padStart(2, '0'),
                                                        value: i.toString().padStart(2, '0')
                                                    }))}
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
                                                options={[
                                                    { label: 'Office', value: 'office' },
                                                    { label: 'Home', value: 'home' }
                                                ]}
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
                                            const entry = {
                                                manual_hours: "00:00",
                                                work_from: "office",
                                                status: "pending"
                                            };
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
                                    onClick={() => {
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
                                        }).then(response => {
                                            api.success({ message: "Outside Hours Saved" });
                                            setIsActionModalOpen(false);
                                            router.reload({ only: ['attendances'] });
                                        }).catch(err => {
                                            api.error({ message: "Failed", description: err.response?.data?.message || "Failed to save hours" });
                                        }).finally(() => setLoading(false));
                                    }}
                                >
                                    Save All Outside Hours
                                </button>
                            </div>

                            {/* Status Override for Edit Mode */}
                            {(currentActionRecord.check_out || !dayjs(currentActionRecord.date).isSame(dayjs(), 'day')) && (
                                <div className="border-top pt-3 mt-2">
                                    <div className="mb-3">
                                        <div className="mb-3">
                                            <label className="fw-bold small text-muted d-block mb-1">Total Regular Hours (Read-only)</label>
                                            <div className="bg-light border rounded px-3 py-2 fw-bold text-primary">
                                                {currentActionRecord.total_regular_hours
                                                    ? formatManualTime(currentActionRecord.total_regular_hours)
                                                    : (calculateHours(currentActionRecord) || "-")}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="fw-bold small text-muted d-block mb-1">Status (Read-only)</label>
                                        <Tag color={
                                            currentActionRecord.status === 'present' ? 'success' :
                                                currentActionRecord.status === 'absent' ? 'error' :
                                                    currentActionRecord.status === 'late' ? 'warning' : 'default'
                                        } className="px-3 py-1 fw-bold">
                                            {currentActionRecord.status.toUpperCase()}
                                        </Tag>
                                    </div>

                                    <button
                                        className="btn btn-primary w-100 mt-2"
                                        disabled={loading}
                                        onClick={() => {
                                            setLoading(true);
                                            axios.put(route('users-attendance.update', currentActionRecord.id), currentActionRecord)
                                                .then(response => {
                                                    api.success({ message: "Attendance Updated Successfully" });
                                                    setIsActionModalOpen(false);
                                                    router.reload({ only: ['attendances'] });
                                                })
                                                .catch(err => {
                                                    api.error({ message: "Update Failed", description: err.response?.data?.message });
                                                })
                                                .finally(() => setLoading(false));
                                        }}
                                    >
                                        Save All Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

MyAttendance.layout = (page) => <MainLayout children={page} />;

export default MyAttendance;
