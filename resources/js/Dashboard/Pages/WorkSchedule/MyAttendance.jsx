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
    Select,
    LoginOutlined,
    LogoutOutlined
} from "@shared/ui";
import MainLayout from "@layout";

const MyAttendance = ({ attendances, selectedYear, auth, leaveRequests, userShiftSchedules, holidays }) => {
    const [api, contextHolder] = notification.useNotification();
    const [loading, setLoading] = useState(false);
    const [isAttendanceGridModalOpen, setIsAttendanceGridModalOpen] = useState(false);
    const [selectedMonthForAttendance, setSelectedMonthForAttendance] = useState(null);

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

    const handleCheckIn = (date) => {
        setLoading(true);
        router.post(route('users-attendance.store'), {
            user_id: user.id,
            date: date,
            status: 'present',
            check_in: dayjs().format('HH:mm:ss'),
            worked_from: 'office' // Default to office for quick check-in
        }, {
            onSuccess: () => api.success({ message: "Checked In Successfully" }),
            onError: (err) => api.error({ message: "Check In Failed", description: Object.values(err)[0] }),
            onFinish: () => setLoading(false)
        });
    };

    const handleCheckOut = (record) => {
        setLoading(true);
        router.put(route('users-attendance.update', record.id), {
            ...record,
            check_out: dayjs().format('HH:mm:ss')
        }, {
            onSuccess: () => api.success({ message: "Checked Out Successfully" }),
            onError: (err) => api.error({ message: "Check Out Failed", description: Object.values(err)[0] }),
            onFinish: () => setLoading(false)
        });
    };

    // Main Grid Columns (Months)
    const columnDefs = useMemo(() => [
        {
            headerName: "Month",
            field: "monthName",
            flex: 1,
            cellClass: "fw-bold text-primary"
        },
        {
            headerName: "Present",
            field: "present",
            flex: 1,
            cellClass: "text-success fw-bold text-center",
        },
        {
            headerName: "Absent",
            field: "absent",
            flex: 1,
            cellClass: "text-danger fw-bold text-center",
        },
        {
            headerName: "Actions",
            width: 200,
            cellRenderer: (params) => {
                const now = dayjs();
                const currentMonth = now.month();
                const currentYear = now.year();

                const isCurrentMonth = params.data.monthIndex === currentMonth && filterYear === currentYear;
                const isPast = filterYear < currentYear || (filterYear === currentYear && params.data.monthIndex < currentMonth);

                let buttonText = "View & Mark Attendance";
                if (!isCurrentMonth) {
                    buttonText = isPast ? "Closed" : "Upcoming";
                }

                return (
                    <button
                        className={`btn btn-sm w-100 d-flex align-items-center justify-content-center ${isCurrentMonth ? 'btn-primary' : 'btn-outline-secondary'}`}
                        disabled={!isCurrentMonth}
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
            return { monthName: m, monthIndex: i, present, absent };
        });
    }, [attendances, filterYear]);

    // Detail Grid Columns
    const detailColumnDefs = useMemo(() => [
        {
            headerName: "Date",
            field: "date",
            flex: 1,
            cellClass: "fw-medium"
        },
        {
            headerName: "Status",
            field: "status",
            flex: 1,
            cellRenderer: (params) => {
                const colors = {
                    'present': 'success',
                    'late': 'warning',
                    'absent': 'error',
                    'leave': 'blue',
                    'On Leave': 'blue',
                    'no action': 'default',
                    'Not Marked': 'processing',
                    'Weekend': 'default',
                    'Holiday': 'magenta'
                };
                const label = params.value === 'On Leave' ? 'LEAVE' : params.value;
                return <Tag color={colors[params.value] || 'default'}>{label.toUpperCase()}</Tag>;
            }
        },
        {
            headerName: "Check In",
            field: "check_in",
            flex: 1,
            cellRenderer: (params) => params.value ? <Tag color="cyan">{params.value}</Tag> : "-"
        },
        {
            headerName: "Check Out",
            field: "check_out",
            flex: 1,
            cellRenderer: (params) => params.value ? <Tag color="blue">{params.value}</Tag> : "-"
        },
        {
            headerName: "Worked From",
            field: "worked_from",
            flex: 1,
            cellRenderer: (params) => (
                <Tag color={params.value === 'home' ? 'blue' : 'orange'}>
                    {params.value ? params.value.toUpperCase() : 'OFFICE'}
                </Tag>
            )
        },
        {
            headerName: "Check In IP",
            field: "check_in_ip",
            flex: 1,
            cellRenderer: (params) => params.value ? <small className="font-monospace text-muted" style={{ fontSize: '10px' }}>{params.value}</small> : "-"
        },
        {
            headerName: "Check Out IP",
            field: "check_out_ip",
            flex: 1,
            cellRenderer: (params) => params.value ? <small className="font-monospace text-muted" style={{ fontSize: '10px' }}>{params.value}</small> : "-"
        },
        {
            headerName: "Actions",
            width: 250,
            sortable: false,
            filter: false,
            pinned: "right",
            cellRenderer: (params) => {
                if (params.data.status === 'On Leave') return <Tag color="blue">ON LEAVE</Tag>;
                if (params.data.status === 'Weekend') return <Tag>WEEKEND</Tag>;

                const isToday = params.data.date === dayjs().format('YYYY-MM-DD');
                const hasCheckIn = !!params.data.check_in;
                const hasCheckOut = !!params.data.check_out;

                if (!isToday) return <small className="text-muted italic">Only current day allowed</small>;

                return (
                    <div className="d-flex gap-2 align-items-center h-100">
                        <button
                            className="btn btn-success btn-sm d-flex align-items-center"
                            disabled={hasCheckIn || loading}
                            onClick={() => handleCheckIn(params.data.date)}
                        >
                            <LoginOutlined className="me-1" /> Check In
                        </button>
                        <button
                            className="btn btn-danger btn-sm d-flex align-items-center"
                            disabled={!hasCheckIn || hasCheckOut || loading}
                            onClick={() => handleCheckOut(params.data)}
                        >
                            <LogoutOutlined className="me-1" /> Check Out
                        </button>
                    </div>
                );
            }
        }
    ], [loading]);

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

                <Card className="border-0 shadow-sm" bodyStyle={{ padding: 0, borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="ag-grid-wrapper" style={{ height: '75vh' }}>
                        <AgGridReact
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            theme={gridTheme}
                            pagination={false}
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
                        defaultColDef={defaultColDef}
                        theme={gridTheme}
                        pagination={false}
                        onFirstDataRendered={(params) => {
                            const today = dayjs().format('YYYY-MM-DD');
                            const rowIndex = userAttendanceRowData.findIndex(row => row.date === today);
                            if (rowIndex !== -1) {
                                params.api.ensureIndexVisible(rowIndex, 'middle');
                                // Highlight the current day row briefly
                                params.api.flashCells({ rowNodes: [params.api.getRowNode(params.api.getDisplayedRowAtIndex(rowIndex).id)] });
                            }
                        }}
                    />
                </div>
            </Modal>
        </>
    );
};

MyAttendance.layout = (page) => <MainLayout children={page} />;

export default MyAttendance;
