import { useState, useMemo, useCallback, useEffect } from "react";
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
    ApartmentOutlined
} from "@shared/ui";
import axios from "axios";
import MainLayout from "@layout";

const UserAttendance =
    ({ attendances, users, selectedMonth, selectedYear, leaveRequests, holidays }) => {
        const [api, contextHolder] = notification.useNotification();
        const [loading, setLoading] = useState(false);
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [isAttendanceGridModalOpen, setIsAttendanceGridModalOpen] = useState(false);
        const [selectedUserForAttendance, setSelectedUserForAttendance] = useState(null);
        const [editingAttendance, setEditingAttendance] = useState(null);
        const [form] = Form.useForm();

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
            const { check_in, check_out, break_start, break_end } = record;
            if (!check_in || !check_out) return 0;
            const s = dayjs(`2000-01-01 ${check_in}`);
            const e = dayjs(`2000-01-01 ${check_out}`);
            let diff = e.diff(s, 'minute');
            if (diff < 0) diff += 1440; // Handle night shifts

            if (break_start && break_end) {
                const bs = dayjs(`2000-01-01 ${break_start}`);
                const be = dayjs(`2000-01-01 ${break_end}`);
                let bDiff = be.diff(bs, 'minute');
                if (bDiff < 0) bDiff += 1440;
                diff -= bDiff;
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
                headerName: "Present",
                field: "id",
                cellClass: "text-success fw-bold text-center text-nowrap",
                valueGetter: (params) => {
                    const userId = params.data.id;
                    const monthStr = (filterDate.month + 1).toString().padStart(2, '0');
                    return attendances.filter(a =>
                        a.user_id === userId &&
                        a.date.startsWith(`${filterDate.year}-${monthStr}`) &&
                        ['present', 'late'].includes(a.status)
                    ).length;
                }
            },
            {
                headerName: "Absent",
                field: "id",
                cellClass: "text-danger fw-bold text-center text-nowrap",
                valueGetter: (params) => {
                    const userId = params.data.id;
                    const monthStr = (filterDate.month + 1).toString().padStart(2, '0');
                    return attendances.filter(a =>
                        a.user_id === userId &&
                        a.date.startsWith(`${filterDate.year}-${monthStr}`) &&
                        a.status === 'absent'
                    ).length;
                }
            },
            {
                headerName: "Regular Hours",
                field: "id",
                cellClass: "fw-bold text-center text-nowrap",
                valueGetter: (params) => {
                    const userId = params.data.id;
                    const monthStr = (filterDate.month + 1).toString().padStart(2, '0');
                    const userRecs = attendances.filter(a =>
                        a.user_id === userId &&
                        a.date.startsWith(`${filterDate.year}-${monthStr}`)
                    );
                    const totalMins = userRecs.reduce((acc, curr) => {
                        const regMins = curr.total_regular_hours ? timeStringToMins(curr.total_regular_hours) : calculateHoursMins(curr);
                        return acc + regMins;
                    }, 0);
                    return formatMins(totalMins);
                }
            },
            {
                headerName: "Outside Hours",
                field: "id",
                cellClass: "fw-bold text-center text-nowrap",
                valueGetter: (params) => {
                    const userId = params.data.id;
                    const monthStr = (filterDate.month + 1).toString().padStart(2, '0');
                    const userRecs = attendances.filter(a =>
                        a.user_id === userId &&
                        a.date.startsWith(`${filterDate.year}-${monthStr}`)
                    );
                    const totalMins = userRecs.reduce((acc, curr) => {
                        return acc + sumOutsideHoursMins(curr.total_outside_hours);
                    }, 0);
                    return formatMins(totalMins);
                }
            },
            {
                headerName: "Total Hours",
                field: "id",
                cellClass: "fw-bold text-center text-nowrap",
                valueGetter: (params) => {
                    const userId = params.data.id;
                    const monthStr = (filterDate.month + 1).toString().padStart(2, '0');
                    const userRecs = attendances.filter(a =>
                        a.user_id === userId &&
                        a.date.startsWith(`${filterDate.year}-${monthStr}`)
                    );

                    const totalMins = userRecs.reduce((acc, curr) => {
                        const regMins = curr.total_regular_hours ? timeStringToMins(curr.total_regular_hours) : calculateHoursMins(curr);
                        const outMins = sumOutsideHoursMins(curr.total_outside_hours);
                        return acc + regMins + outMins;
                    }, 0);

                    return formatMins(totalMins);
                }
            },
            {
                headerName: "Actions",
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
        ], [attendances, filterDate]);

        // Detail Grid Columns
        const detailColumnDefs = useMemo(() => [
            {
                headerName: "Date",
                field: "date",
                cellClass: "fw-medium text-nowrap"
            },
            {
                headerName: "Status",
                field: "status",
                cellClass: "text-nowrap",
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
                    const color = colors[params.value] || 'default';
                    return <Tag color={color}>{label.toUpperCase()}</Tag>;
                }
            },
            {
                headerName: "Check In",
                field: "check_in",
                cellClass: "text-nowrap",
                cellRenderer: (params) => params.value ? <Tag color="cyan">{params.value}</Tag> : "-"
            },
            {
                headerName: "Break Start",
                field: "break_start",
                cellClass: "text-nowrap",
                cellRenderer: (params) => params.value ? <Tag color="orange">{params.value}</Tag> : "-"
            },
            {
                headerName: "Break End",
                field: "break_end",
                cellClass: "text-nowrap",
                cellRenderer: (params) => params.value ? <Tag color="orange">{params.value}</Tag> : "-"
            },
            {
                headerName: "Regular Hours",
                field: "total_regular_hours",
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
                                    {idx < entries.length - 1 && <span className="text-muted">/</span>}
                                </span>
                            ))}
                        </div>
                    );
                }
            },
            {
                headerName: "Worked From",
                field: "worked_from",
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
                cellClass: "text-nowrap",
                cellRenderer: (params) => params.value ? <small className="font-monospace text-muted" style={{ fontSize: '10px' }}>{params.value}</small> : "-"
            },
            {
                headerName: "Check Out IP",
                field: "check_out_ip",
                cellClass: "text-nowrap",
                cellRenderer: (params) => params.value ? <small className="font-monospace text-muted" style={{ fontSize: '10px' }}>{params.value}</small> : "-"
            },
            {
                headerName: "Leave",
                field: "leave_status",
                cellClass: "text-nowrap",
                cellRenderer: (params) => {
                    if (!params.value) return "-";
                    return <Tag color="blue">{params.value}</Tag>;
                }
            },
            {
                headerName: "Actions",
                width: 150,
                pinned: "right",
                sortable: false,
                filter: false,
                cellRenderer: (params) => {
                    if (params.data.status === 'On Leave') return <Tag color="blue">ON LEAVE</Tag>;
                    if (params.data.status === 'Weekend') return <Tag>WEEKEND</Tag>;
                    if (params.data.status === 'Holiday') return <Tag color="magenta">HOLIDAY</Tag>;

                    return (
                        <div className="d-flex gap-2 align-items-center h-100">
                            {params.data.isPlaceholder ? (
                                <>
                                    <button
                                        className="btn btn-success btn-sm"
                                        style={{ fontSize: '11px', padding: '2px 8px' }}
                                        onClick={() => handleQuickMark(params.data, 'present')}
                                    >
                                        ✓ Present
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        style={{ fontSize: '11px', padding: '2px 8px' }}
                                        onClick={() => handleQuickMark(params.data, 'absent')}
                                    >
                                        ✗ Absent
                                    </button>
                                </>
                            ) : (
                                <>
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
                                </>
                            )}
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

                if (existing) {
                    return {
                        ...existing,
                        status: onLeave ? 'On Leave' : existing.status,
                        leave_status: onLeave ? onLeave.leave_type?.name || 'On Leave' : null
                    };
                }

                let status = 'Not Marked';
                if (onLeave) status = 'On Leave';
                else if (holiday) status = 'Holiday';
                else if (!hasShift) status = 'Weekend';

                return {
                    user_id: selectedUserForAttendance.id,
                    date: d,
                    status: status,
                    leave_status: onLeave ? onLeave.leave_type?.name || 'On Leave' : (holiday ? holiday.title : null),
                    isPlaceholder: true
                };
            }).sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
        }, [selectedUserForAttendance, attendances, filterDate, getDaysInMonth, leaveRequests, holidays]);

        const handleValuesChange = (changedValues, allValues) => {
            // Logic for automatic calculation can be added here if needed in the future
        };

        const handleQuickMark = async (rec, status) => {
            const user = users.find(u => u.id == rec.user_id);
            const dayName = dayjs(rec.date).format('dddd');
            const hasShift = user?.user_shift_schedules?.some(s => s.day === dayName);

            if (!hasShift) {
                api.error({
                    message: "Shift Not Scheduled",
                    description: `${user?.name || 'User'} is not scheduled to work on ${dayName}.`,
                    placement: "topRight"
                });
                return;
            }

            setLoading(true);
            try {
                const response = await axios.post(route('users-attendance.store'), {
                    user_id: rec.user_id,
                    date: rec.date,
                    status: status,
                    check_in: null,
                    check_out: null,
                    worked_from: 'office'
                });

                api.success({
                    message: "Success",
                    description: `Marked as ${status}`,
                    placement: "topRight"
                });
                router.reload({ only: ['attendances'] });
            } catch (error) {
                api.error({
                    message: "Error",
                    description: error.response?.data?.message || "Failed to mark attendance",
                    placement: "topRight"
                });
            } finally {
                setLoading(false);
            }
        };

        const handleEdit = (rec) => {
            const user = users.find(u => u.id == rec.user_id);
            const dayName = dayjs(rec.date).format('dddd');
            const hasShift = user?.user_shift_schedules?.some(s => s.day === dayName);

            if (!hasShift) {
                api.error({
                    message: "Shift Not Scheduled",
                    description: `${user?.name || 'User'} is not scheduled to work on ${dayName}.`,
                    placement: "topRight"
                });
                return;
            }

            setEditingAttendance(rec);
            form.setFieldsValue({
                user_id: rec.user_id,
                date: dayjs(rec.date),
                check_in: rec.check_in ? dayjs(rec.check_in, 'HH:mm:ss') : null,
                check_out: rec.check_out ? dayjs(rec.check_out, 'HH:mm:ss') : null,
                status: rec.isPlaceholder ? 'present' : rec.status,
                worked_from: rec.worked_from || 'office',
                total_regular_hours: rec.total_regular_hours,
                total_outside_hours: Array.isArray(rec.total_outside_hours) ? rec.total_outside_hours.map(h => ({
                    ...h,
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
                const user = users.find(u => u.id == values.user_id);
                const dayName = values.date.format('dddd');
                const hasShift = user?.user_shift_schedules?.some(s => s.day === dayName);

                if (!hasShift) {
                    api.error({
                        message: "Shift Not Scheduled",
                        description: `${user?.name || 'User'} is not scheduled to work on ${dayName}.`,
                        placement: "topRight"
                    });
                    return;
                }

                setLoading(true);
                const submissionData = {
                    ...values,
                    date: values.date.format('YYYY-MM-DD'),
                    check_in: values.check_in ? values.check_in.format('HH:mm:ss') : null,
                    check_out: values.check_out ? values.check_out.format('HH:mm:ss') : null,
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
                        </div>
                    </div>

                    <Card className="border-0 shadow-sm" bodyStyle={{ padding: 0, borderRadius: '12px', overflow: 'hidden' }}>
                        <div className="ag-grid-wrapper" style={{ height: '75vh' }}>
                            <AgGridReact
                                rowData={users}
                                columnDefs={masterColumnDefs}
                                defaultColDef={{
                                    ...defaultColDef,
                                    suppressMovable: true,
                                    cellClass: 'text-nowrap',
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
                    <div style={{ height: '80vh' }} className="ag-theme-alpine">
                        <AgGridReact
                            rowData={userAttendanceRowData}
                            columnDefs={detailColumnDefs}
                            defaultColDef={{
                                ...defaultColDef,
                                suppressMovable: true,
                                cellClass: 'text-nowrap',
                            }}
                            autoSizeStrategy={{
                                type: "fitCellContents",
                                skipHeader: false,
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
                            <div className="col-md-4">
                                <Form.Item name="check_in" label="Check In">
                                    <TimePicker className="w-100" format="HH:mm" />
                                </Form.Item>
                            </div>
                            <div className="col-md-4">
                                <Form.Item name="check_out" label="Check Out">
                                    <TimePicker className="w-100" format="HH:mm" />
                                </Form.Item>
                            </div>
                            <div className="col-md-4">
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
                                    <div className="d-flex align-items-center gap-2">
                                        <Select
                                            showSearch
                                            placeholder="HH"
                                            style={{ width: '80px' }}
                                            value={form.getFieldValue('total_regular_hours')?.split(':')[0]}
                                            onChange={(val) => {
                                                const current = form.getFieldValue('total_regular_hours') || '00:00';
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
                                            value={form.getFieldValue('total_regular_hours')?.split(':')[1]}
                                            onChange={(val) => {
                                                const current = form.getFieldValue('total_regular_hours') || '00:00';
                                                const hrs = current.split(':')[0] || '00';
                                                form.setFieldsValue({ total_regular_hours: `${hrs}:${val}` });
                                            }}
                                            options={Array.from({ length: 60 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i.toString().padStart(2, '0') }))}
                                        />
                                    </div>
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
                                                        onClick={() => add({ manual_hours: '01:00', work_from: 'office' })}
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

                        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                            <Select options={[
                                { label: 'Present', value: 'present' },
                                { label: 'Absent', value: 'absent' },
                                { label: 'Leave', value: 'leave' },
                                { label: 'No Action', value: 'no action' }
                            ]} />
                        </Form.Item>
                        <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
                    </Form>
                </Modal>
            </>
        );
    };

UserAttendance.layout = (page) => <MainLayout children={page} />;

export default UserAttendance;
