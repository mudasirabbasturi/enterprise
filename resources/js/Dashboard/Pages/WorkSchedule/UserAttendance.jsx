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
import MainLayout from "@layout";

const UserAttendance = ({ attendances, users, selectedMonth, selectedYear }) => {
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
            flex: 1,
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
            flex: 1,
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
            headerName: "Actions",
            width: 180,
            cellRenderer: (params) => (
                <button
                    className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center"
                    onClick={() => {
                        setSelectedUserForAttendance(params.data);
                        setIsAttendanceGridModalOpen(true);
                    }}
                >
                    <PlusOutlined className="me-1" /> Mark Attendance
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
            headerName: "IP Used",
            field: "check_in_ip",
            flex: 1.2,
            cellRenderer: (params) => params.value ? <small className="font-monospace text-muted">{params.value}</small> : "-"
        },
        {
            headerName: "Actions",
            width: 120,
            sortable: false,
            filter: false,
            pinned: "right",
            cellRenderer: (params) => (
                <div className="d-flex gap-2 align-items-center h-100">
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

        return days.map(d => {
            const existing = userRecs.find(a => a.date === d);
            return existing || {
                user_id: selectedUserForAttendance.id,
                date: d,
                status: 'Not Marked',
                isPlaceholder: true
            };
        }).sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
    }, [selectedUserForAttendance, attendances, filterDate, getDaysInMonth]);

    const handleEdit = (rec) => {
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
        form.validateFields().then(values => {
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

            router[method](url, submissionData, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({
                        message: `Attendance ${editingAttendance && !editingAttendance.isPlaceholder ? 'updated' : 'created'}`,
                        placement: "topRight"
                    });
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    api.error({
                        message: "Submission Failed",
                        description: firstError || "Could not save attendance.",
                        placement: "topRight"
                    });
                },
                onFinish: () => setLoading(false)
            });
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
                <Form form={form} layout="vertical" className="mt-3">
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
                            <Form.Item name="check_in" label="Check In"><TimePicker className="w-100" /></Form.Item>
                        </div>
                        <div className="col-md-4">
                            <Form.Item name="check_out" label="Check Out"><TimePicker className="w-100" /></Form.Item>
                        </div>
                        <div className="col-md-4">
                            <Form.Item name="overtime_hours" label="OT Hours"><InputNumber className="w-100" min={0} /></Form.Item>
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
