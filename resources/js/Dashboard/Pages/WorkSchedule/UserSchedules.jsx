import { useState, useMemo } from "react";
import {
    AgGridReact,
    gridTheme,
    defaultColDef,
    sideBarConfig,
    gridOptionsConfig
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
    TimePicker,
    Switch,
    Tag,
    InputNumber,
    dayjs
} from "@shared/ui";
import MainLayout from "@layout";

const UserSchedules = ({ schedules, users, shifts }) => {
    const [api, contextHolder] = notification.useNotification();
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [form] = Form.useForm();

    const columns = useMemo(() => [
        {
            headerName: "User",
            field: "user.name",
            flex: 2,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center h-100">
                    <span className="fw-bold">{params.value || "N/A"}</span>
                </div>
            )
        },
        {
            headerName: "Shift",
            field: "shift.name",
            flex: 1.5,
            cellRenderer: (params) => (
                <Tag color="blue">{params.value || "No Shift"}</Tag>
            )
        },
        {
            headerName: "Day",
            field: "day",
            flex: 1,
            cellClass: "fw-medium"
        },
        {
            headerName: "Time Slots",
            flex: 2,
            valueGetter: (params) => `${params.data.start_time} - ${params.data.end_time}`,
            cellClass: "font-monospace"
        },
        {
            headerName: "Duration",
            field: "duration",
            flex: 1,
            valueFormatter: (params) => `${params.value} mins`
        },
        {
            headerName: "Available",
            field: "is_available",
            flex: 1,
            cellRenderer: (params) => (
                <Tag color={params.value ? "success" : "default"}>
                    {params.value ? "YES" : "NO"}
                </Tag>
            )
        },
        {
            headerName: "Actions",
            width: 120,
            sortable: false,
            filter: false,
            pinned: "right",
            cellRenderer: (params) => (
                <div className="d-flex gap-2 align-items-center h-100">
                    <Tooltip title="Edit Schedule">
                        <button
                            className="btn btn-outline-warning btn-sm rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => handleEdit(params.data)}
                        >
                            <EditOutlined />
                        </button>
                    </Tooltip>
                    <Tooltip title="Delete Schedule">
                        <Popconfirm
                            title="Are you sure you want to delete this schedule?"
                            onConfirm={() => handleDelete(params.data.id)}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{ danger: true }}
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
            )
        }
    ], []);

    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [shiftLoading, setShiftLoading] = useState(false);
    const [shiftForm] = Form.useForm();

    const handleEdit = (schedule) => {
        setEditingSchedule(schedule);
        form.setFieldsValue({
            ...schedule,
            start_time: dayjs(schedule.start_time, 'HH:mm:ss'),
            end_time: dayjs(schedule.end_time, 'HH:mm:ss'),
            is_available: !!schedule.is_available
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        router.delete(route('users-schedules.destroy', id), {
            onSuccess: () => {
                api.success({
                    message: "Success",
                    description: "Schedule deleted successfully",
                    placement: "topRight"
                });
            }
        });
    };

    const handleAddNew = () => {
        setEditingSchedule(null);
        form.resetFields();
        form.setFieldsValue({ is_available: true, duration: 30 });
        setIsModalOpen(true);
    };

    const handleModalSubmit = () => {
        form.validateFields().then(values => {
            setLoading(true);
            const submissionData = {
                ...values,
                start_time: values.start_time.format('HH:mm:ss'),
                end_time: values.end_time.format('HH:mm:ss'),
            };

            const url = editingSchedule ? route('users-schedules.update', editingSchedule.id) : route('users-schedules.store');
            const method = editingSchedule ? 'put' : 'post';

            router[method](url, submissionData, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({
                        message: "Success",
                        description: `Schedule ${editingSchedule ? 'updated' : 'created'} successfully`,
                        placement: "topRight"
                    });
                },
                onFinish: () => setLoading(false)
            });
        });
    };

    const handleAddShiftSubmit = () => {
        shiftForm.validateFields().then(values => {
            setShiftLoading(true);
            router.post(route('shifts.store'), values, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsShiftModalOpen(false);
                    shiftForm.resetFields();
                    api.success({
                        message: "Success",
                        description: "New shift added successfully",
                        placement: "topRight"
                    });
                },
                onFinish: () => setShiftLoading(false)
            });
        });
    };

    return (
        <>
            {contextHolder}
            <Head title="Work Schedule - User Schedules" />
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className="breadCrumb"
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Work Schedule" },
                            { title: "User Schedules" }
                        ]}
                    />
                    <button
                        className="btn btn-primary btn-sm d-flex align-items-center"
                        onClick={handleAddNew}
                    >
                        <PlusOutlined className="me-1" />
                        Add New Schedule
                    </button>
                </div>

                <div className="card mt-4 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="ag-grid-wrapper">
                            <AgGridReact
                                rowData={schedules}
                                columnDefs={columns}
                                defaultColDef={defaultColDef}
                                theme={gridTheme}
                                pagination={true}
                                paginationPageSize={20}
                                sideBar={sideBarConfig}
                                onGridReady={gridOptionsConfig.onGridReady}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title={editingSchedule ? "Edit User Schedule" : "Add New User Schedule"}
                open={isModalOpen}
                onOk={handleModalSubmit}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={loading}
                width={700}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-3"
                >
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item
                                name="user_id"
                                label="Select User"
                                rules={[{ required: true, message: 'Please select a user' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Search user..."
                                    optionFilterProp="children"
                                    options={users.map(u => ({ label: u.name, value: u.id }))}
                                />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item
                                name="shift_id"
                                label={
                                    <div className="d-flex justify-content-between align-items-center w-100">
                                        <span>Select Shift</span>
                                        <Tooltip title="Add New Shift">
                                            <PlusOutlined
                                                className="text-primary cursor-pointer"
                                                onClick={() => setIsShiftModalOpen(true)}
                                            />
                                        </Tooltip>
                                    </div>
                                }
                                rules={[{ required: true, message: 'Please select a shift' }]}
                            >
                                <Select
                                    placeholder="Select a shift"
                                    options={shifts.map(s => ({ label: s.name, value: s.id }))}
                                />
                            </Form.Item>
                        </div>
                    </div>


                    <div className="row">
                        <div className="col-md-4">
                            <Form.Item
                                name="day"
                                label="Day of Week"
                                rules={[{ required: true }]}
                            >
                                <Select placeholder="Select day">
                                    <Select.Option value="Sunday">Sunday</Select.Option>
                                    <Select.Option value="Monday">Monday</Select.Option>
                                    <Select.Option value="Tuesday">Tuesday</Select.Option>
                                    <Select.Option value="Wednesday">Wednesday</Select.Option>
                                    <Select.Option value="Thursday">Thursday</Select.Option>
                                    <Select.Option value="Friday">Friday</Select.Option>
                                    <Select.Option value="Saturday">Saturday</Select.Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <div className="col-md-4">
                            <Form.Item
                                name="start_time"
                                label="Start Time"
                                rules={[{ required: true }]}
                            >
                                <TimePicker className="w-100" />
                            </Form.Item>
                        </div>
                        <div className="col-md-4">
                            <Form.Item
                                name="end_time"
                                label="End Time"
                                rules={[{ required: true }]}
                            >
                                <TimePicker className="w-100" />
                            </Form.Item>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item
                                name="duration"
                                label="Duration (Minutes)"
                            >
                                <InputNumber className="w-100" min={1} />
                            </Form.Item>
                        </div>
                        <div className="col-md-6 d-flex align-items-center pt-3">
                            <Form.Item
                                name="is_available"
                                label="Is Available"
                                valuePropName="checked"
                                className="mb-0"
                            >
                                <Switch checkedChildren="Available" unCheckedChildren="Unavailable" />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item
                        name="notes"
                        label="Notes"
                    >
                        <Input.TextArea rows={3} placeholder="Additional info..." />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Nested Modal for Adding New Shift */}
            <Modal
                title="Quick Add New Shift"
                open={isShiftModalOpen}
                onOk={handleAddShiftSubmit}
                onCancel={() => setIsShiftModalOpen(false)}
                confirmLoading={shiftLoading}
                centered
                zIndex={1051} // Ensure it appears above the parent modal
            >
                <Form
                    form={shiftForm}
                    layout="vertical"
                    className="mt-3"
                >
                    <Form.Item
                        name="name"
                        label="Shift Name"
                        rules={[{ required: true, message: 'Please enter shift name' }]}
                    >
                        <Input placeholder="e.g. Morning Shift, Night Shift" />
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Notes"
                    >
                        <Input.TextArea rows={3} placeholder="Additional details..." />
                    </Form.Item>

                    <Form.Item
                        name="is_active"
                        label="Active Status"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

UserSchedules.layout = (page) => <MainLayout children={page} />;

export default UserSchedules;
