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
    Card
} from "@shared/ui";
import axios from "axios";
import MainLayout from "@layout";

const UserAttendance =
    ({ attendances, users, selectedMonth, selectedYear, leaveRequests }) => {
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

        const calculateHours = (start, end) => {
            if (!start || !end) return 0;
            const s = dayjs(`2000-01-01 ${start}`);
            const e = dayjs(`2000-01-01 ${end}`);
            let diff = e.diff(s, 'hour', true);
            if (diff < 0) diff += 24; // Handle night shifts
            return diff;
        };

        const getShiftHoursForDay = (userId, date) => {
            const user = users.find(u => u.id === userId);
            if (!user || !user.user_shift_schedules) return null;

            const dayName = dayjs(date).format('dddd');
            const schedule = user.user_shift_schedules.find(s => s.day === dayName);

            if (!schedule || !schedule.shift) return null;

            // Convert duration from minutes to hours
            return schedule.shift.duration ? parseFloat(schedule.shift.duration) / 60 : calculateHours(schedule.shift.start_time, schedule.shift.end_time);
        };

        // Main Grid Columns
        const masterColumnDefs = useMemo(() => [
            {
                headerName: "User",
                field: "name",
                flex: 2,
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
                width: 90,
                cellClass: "text-success fw-bold text-center",
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
                width: 90,
                cellClass: "text-danger fw-bold text-center",
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
                headerName: "Total Hours",
                field: "id",
                width: 120,
                cellClass: "fw-bold text-center",
                valueGetter: (params) => {
                    const userId = params.data.id;
                    const monthStr = (filterDate.month + 1).toString().padStart(2, '0');
                    const userRecs = attendances.filter(a =>
                        a.user_id === userId &&
                        a.date.startsWith(`${filterDate.year}-${monthStr}`)
                    );
                    const total = userRecs.reduce((acc, curr) => acc + calculateHours(curr.check_in, curr.check_out), 0);
                    return `${total.toFixed(1)} hrs`;
                }
            },
            {
                headerName: "OT Hours",
                field: "id",
                width: 110,
                cellClass: "text-primary fw-bold text-center",
                valueGetter: (params) => {
                    const userId = params.data.id;
                    const monthStr = (filterDate.month + 1).toString().padStart(2, '0');
                    const userRecs = attendances.filter(a =>
                        a.user_id === userId &&
                        a.date.startsWith(`${filterDate.year}-${monthStr}`)
                    );
                    const total = userRecs.reduce((acc, curr) => acc + (parseFloat(curr.overtime_hours) || 0), 0);
                    return `${total.toFixed(1)} hrs`;
                }
            },
            {
                headerName: "UT Hours",
                field: "id",
                width: 110,
                cellClass: "text-warning fw-bold text-center",
                valueGetter: (params) => {
                    const userId = params.data.id;
                    const monthStr = (filterDate.month + 1).toString().padStart(2, '0');
                    const userRecs = attendances.filter(a =>
                        a.user_id === userId &&
                        a.date.startsWith(`${filterDate.year}-${monthStr}`)
                    );
                    const total = userRecs.reduce((acc, curr) => acc + (parseFloat(curr.undertime_hours) || 0), 0);
                    return `${total.toFixed(1)} hrs`;
                }
            },
            {
                headerName: "Actions",
                width: 150,
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
                        'no action': 'default',
                        'Not Marked': 'processing'
                    };
                    return <Tag color={colors[params.value] || 'default'}>{params.value.toUpperCase()}</Tag>;
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
                headerName: "Worked",
                field: "id",
                width: 100,
                valueGetter: (params) => {
                    const hrs = calculateHours(params.data.check_in, params.data.check_out);
                    return hrs > 0 ? `${hrs.toFixed(1)} hrs` : "-";
                }
            },
            {
                headerName: "OT",
                field: "overtime_hours",
                width: 90,
                cellRenderer: (params) => params.value > 0 ? <Tag color="purple">{params.value} hrs</Tag> : "-"
            },
            {
                headerName: "UT",
                field: "undertime_hours",
                width: 90,
                cellRenderer: (params) => params.value > 0 ? <Tag color="orange">{params.value} hrs</Tag> : "-"
            },
            {
                headerName: "IP Used",
                field: "check_in_ip",
                flex: 1.2,
                cellRenderer: (params) => params.value ? <small className="font-monospace text-muted">{params.value}</small> : "-"
            },
            {
                headerName: "Leave",
                field: "leave_status",
                width: 90,
                cellRenderer: (params) => {
                    if (!params.value) return "-";
                    return <Tag color="blue">{params.value}</Tag>;
                }
            },
            {
                headerName: "Actions",
                width: 200,
                sortable: false,
                filter: false,
                pinned: "right",
                cellRenderer: (params) => (
                    <div className="d-flex gap-2 align-items-center h-100">
                        {params.data.isPlaceholder && (
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
                        )}
                        <Tooltip title={params.data.isPlaceholder ? "Mark Attendance" : "Edit Record"}>
                            <button
                                className={`btn btn-outline-${params.data.isPlaceholder ? 'primary' : 'warning'} btn-sm rounded-circle d-flex align-items-center justify-content-center`}
                                style={{ width: '28px', height: '28px' }}
                                onClick={() => handleEdit(params.data)}
                            >
                                <EditOutlined />
                            </button>
                        </Tooltip>
                        {!params.data.isPlaceholder && (
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
                        )}
                    </div>
                )
            }
        ], []);

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

                // Check if this date falls within an approved leave
                const onLeave = userLeaves.find(leave => {
                    const leaveStart = dayjs(leave.start_date);
                    const leaveEnd = dayjs(leave.end_date);
                    const currentDate = dayjs(d);
                    return currentDate.isSameOrAfter(leaveStart, 'day') && currentDate.isSameOrBefore(leaveEnd, 'day');
                });

                if (existing) {
                    return {
                        ...existing,
                        leave_status: onLeave ? onLeave.leave_type?.name || 'On Leave' : null
                    };
                }

                return {
                    user_id: selectedUserForAttendance.id,
                    date: d,
                    status: onLeave ? 'On Leave' : 'Not Marked',
                    leave_status: onLeave ? onLeave.leave_type?.name || 'On Leave' : null,
                    isPlaceholder: true
                };
            }).sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
        }, [selectedUserForAttendance, attendances, filterDate, getDaysInMonth, leaveRequests]);

        const handleValuesChange = (changedValues, allValues) => {
            if (changedValues.check_in || changedValues.check_out || changedValues.date || changedValues.user_id) {
                const { check_in, check_out, date, user_id } = allValues;

                if (check_in && check_out && date && user_id) {
                    const user = users.find(u => u.id == user_id);
                    if (!user) return;

                    const dayName = date.format('dddd');
                    const schedule = user.user_shift_schedules?.find(s => s.day === dayName);

                    if (schedule && schedule.shift) {
                        const worked = calculateHours(check_in.format('HH:mm:ss'), check_out.format('HH:mm:ss'));
                        // Convert duration from minutes to hours
                        const expectedHours = schedule.shift.duration ? parseFloat(schedule.shift.duration) / 60 : calculateHours(schedule.shift.start_time, schedule.shift.end_time);

                        const ot = Math.max(0, worked - expectedHours);
                        const ut = Math.max(0, expectedHours - worked);

                        form.setFieldsValue({
                            overtime_hours: parseFloat(ot.toFixed(2)),
                            undertime_hours: parseFloat(ut.toFixed(2))
                        });
                    }
                }
            }
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
                    overtime_hours: 0,
                    undertime_hours: 0
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
                overtime_hours: rec.overtime_hours || 0,
                notes: rec.notes || ''
            });
            setIsModalOpen(true);
        };

        const handleDelete = (id) => {
            router.delete(route('users-attendance.destroy', id), {
                onSuccess: () => {
                    api.success({ message: "Record deleted", placement: "topRight" });
                }
            });
        };

        const handleAddNew = () => {
            setEditingAttendance(null);
            form.resetFields();
            form.setFieldsValue({ date: dayjs(), status: 'present' });
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
                                defaultColDef={defaultColDef}
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
                            defaultColDef={defaultColDef}
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
                                <Form.Item name="overtime_hours" label="OT Hours"><InputNumber className="w-100" min={0} step={0.1} /></Form.Item>
                            </div>
                            <div className="col-md-4">
                                <Form.Item name="undertime_hours" label="UT Hours"><InputNumber className="w-100" min={0} step={0.1} /></Form.Item>
                            </div>
                        </div>
                        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                            <Select options={[
                                { label: 'Present', value: 'present' },
                                { label: 'Late', value: 'late' },
                                { label: 'Absent', value: 'absent' },
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
