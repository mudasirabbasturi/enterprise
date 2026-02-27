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
    dayjs,
    Table,
    Checkbox
} from "@shared/ui";
import axios from "axios";
import MainLayout from "@layout";

const UserSchedules = ({ schedules, users, shifts }) => {
    const [api, contextHolder] = notification.useNotification();
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [bulkForm] = Form.useForm();
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [selectedGridRows, setSelectedGridRows] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isShiftSelected, setIsShiftSelected] = useState(false);

    const groupedUsers = useMemo(() => {
        const usersToGroup = availableUsers.length > 0 ? availableUsers : [];
        return usersToGroup.reduce((acc, user) => {
            const status = user.status || 'Unknown';
            if (!acc[status]) acc[status] = [];
            acc[status].push(user);
            return acc;
        }, {});
    }, [availableUsers]);

    const fetchAvailableUsers = () => {
        setLoading(true);
        setIsShiftSelected(true);
        axios.get(route('users-schedules.available'))
            .then(response => {
                setAvailableUsers(response.data);
            })
            .catch(error => {
                api.error({
                    message: "Error",
                    description: "Failed to fetch available users",
                    placement: "topRight"
                });
            })
            .finally(() => setLoading(false));
    };

    const columns = useMemo(() => [
        {
            headerCheckboxSelection: true,
            checkboxSelection: true,
            width: 50,

            filter: false,
            sortable: false,
        },
        {
            headerName: "Status",
            field: "user.status",
            flex: 2,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center h-100">
                    <span className="fw-bold">{params.value || "N/A"}</span>
                </div>
            )
        },
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
            headerName: "Time Slots",
            flex: 2,
            valueGetter: (params) => {
                if (params.data.shift) {
                    return `${params.data.shift.start_time} - ${params.data.shift.end_time}`;
                }
                return "N/A";
            },
            cellClass: "font-monospace"
        },
        {
            headerName: "Duration",
            field: "shift.duration",
            flex: 1,
            valueFormatter: (params) => {
                const duration = params.value;
                if (!duration) return "0m";
                const h = Math.floor(duration / 60);
                const m = duration % 60;
                return h > 0 ? `${h}h ${m}m` : `${m}m`;
            }
        },
        {
            headerName: "Break Allowed",
            field: "shift.total_break_minutes",
            flex: 1,
            valueFormatter: (params) => {
                const duration = params.value;
                if (!duration) return "0m";
                return `${duration}m`;
            },
            cellClass: "text-info fw-bold"
        },
        {
            headerName: "Actions",
            width: 120,
            sortable: false,
            filter: false,
            pinned: "right",
            cellRenderer: (params) => (
                <div className="d-flex gap-2 align-items-center h-100">
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

    const handleBulkDelete = () => {
        const ids = selectedGridRows.map(row => row.id);
        router.delete(route('users-schedules.bulk-destroy'), {
            data: { ids },
            onSuccess: () => {
                api.success({
                    message: "Success",
                    description: "Selected schedules deleted successfully",
                    placement: "topRight"
                });
                setSelectedGridRows([]);
            }
        });
    };

    // Duration calculation function
    const calculateDuration = (startTime, endTime) => {
        if (dayjs.isDayjs(startTime) && dayjs.isDayjs(endTime)) {
            const diffInMinutes = endTime.diff(startTime, 'minute');
            if (diffInMinutes >= 0) {
                return diffInMinutes;
            } else {
                // Handle wrap-around to next day (e.g. 22:00 to 06:00)
                return 1440 + diffInMinutes;
            }
        }
        return null;
    };

    const handleAddNew = () => {
        form.resetFields();
        form.setFieldsValue({ is_available: true, duration: 30 });
        setIsModalOpen(true);
    };

    const handleBulkAdd = () => {
        bulkForm.resetFields();
        bulkForm.setFieldsValue({ is_available: true });
        setSelectedUserIds([]);
        setAvailableUsers([]); // Reset available users
        setIsShiftSelected(false);
        setIsBulkModalOpen(true);
    };

    const handleBulkModalSubmit = () => {
        bulkForm.validateFields().then(values => {
            if (selectedUserIds.length === 0) {
                api.error({
                    message: "Selection Required",
                    description: "Please select at least one user for bulk assignment.",
                    placement: "topRight"
                });
                return;
            }

            setLoading(true);
            const submissionData = {
                ...values,
                user_ids: selectedUserIds,
            };

            axios.post(route('users-schedules.bulk-store'), submissionData)
                .then(response => {
                    setIsBulkModalOpen(false);
                    api.success({
                        message: "Success",
                        description: response.data.message || "Bulk schedules created successfully",
                        placement: "topRight"
                    });
                    router.reload();
                })
                .catch(error => {
                    api.error({
                        message: "Error",
                        description: error.response?.data?.message || "Something went wrong",
                        placement: "topRight"
                    });
                })
                .finally(() => setLoading(false));
        });
    };

    const handleModalSubmit = () => {
        form.validateFields().then(values => {
            setLoading(true);
            const submissionData = {
                ...values,
            };

            const url = route('users-schedules.store');
            const method = 'post';

            router[method](url, submissionData, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({
                        message: "Success",
                        description: `Schedule created successfully`,
                        placement: "topRight"
                    });
                },
                onError: (errors) => {
                    if (errors.user_id) {
                        api.error({
                            message: "Error",
                            description: errors.user_id,
                            placement: "topRight"
                        });
                    }
                },
                onFinish: () => setLoading(false)
            });
        });
    };

    const handleAddShiftSubmit = () => {
        shiftForm.validateFields().then(values => {
            setShiftLoading(true);
            const submissionData = {
                ...values,
                start_time: values.start_time.format('HH:mm:ss'),
                end_time: values.end_time.format('HH:mm:ss'),
            };
            router.post(route('shifts.store'), submissionData, {
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
                    <div className="d-flex gap-2">
                        {selectedGridRows.length > 0 && (
                            <Popconfirm
                                title={`Delete ${selectedGridRows.length} selected schedules?`}
                                onConfirm={handleBulkDelete}
                                okText="Yes"
                                cancelText="No"
                                okButtonProps={{ danger: true }}
                            >
                                <button className="btn btn-danger btn-sm d-flex align-items-center">
                                    <DeleteOutlined className="me-1" />
                                    Delete Selected ({selectedGridRows.length})
                                </button>
                            </Popconfirm>
                        )}
                        <button
                            className="btn btn-outline-primary btn-sm d-flex align-items-center"
                            onClick={handleBulkAdd}
                        >
                            <PlusOutlined className="me-1" />
                            Bulk Add
                        </button>
                        <button
                            className="btn btn-primary btn-sm d-flex align-items-center"
                            onClick={handleAddNew}
                        >
                            <PlusOutlined className="me-1" />
                            Add New Schedule
                        </button>
                    </div>
                </div>

                <div className="card mt-4 mx-2 border-0 shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-0">
                        <div className="ag-grid-wrapper" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
                            <AgGridReact
                                rowData={schedules}
                                columnDefs={columns}
                                defaultColDef={defaultColDef}
                                theme={gridTheme}
                                pagination={true}
                                paginationPageSize={20}
                                sideBar={sideBarConfig}
                                rowSelection="multiple"
                                onSelectionChanged={(event) => {
                                    setSelectedGridRows(event.api.getSelectedRows());
                                }}
                                autoSizeStrategy={{
                                    type: 'fitGridWidth',
                                    defaultMinWidth: 100
                                }}
                                onGridReady={gridOptionsConfig.onGridReady}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title="Add New User Schedule"
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
                        <div className="col-md-6 d-flex justify-content-between align-items-center">
                            <Form.Item
                                name="shift_id"
                                className="w-100"
                                label={
                                    <div className="d-flex justify-content-between align-items-center w-100">
                                        <span>Select Shift</span>
                                    </div>
                                }
                                rules={[{ required: true, message: 'Please select a shift' }]}
                            >
                                <Select
                                    placeholder="Select a shift"
                                    options={shifts.map(s => ({ label: s.name, value: s.id }))}
                                />
                            </Form.Item>
                            <Tooltip title="Add New Shift" style={{ cursor: 'pointer' }}>
                                <PlusOutlined
                                    className="text-primary cursor-pointer ms-1 mt-1 p-1 border border-info rounded"
                                    onClick={() => setIsShiftModalOpen(true)}
                                />
                            </Tooltip>
                        </div>
                    </div>


                    <div className="row">
                        <div className="col-md-12">
                            <Form.Item
                                name="days"
                                label="Days of Week"
                                rules={[{ required: true, message: 'Please select at least one day' }]}
                            >
                                <Select mode="multiple" placeholder="Select days" maxTagCount="responsive">
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
                    </div>

                    <div className="row">
                        <div className="col-md-12">
                            <Form.Item
                                name="notes"
                                label="Notes"
                            >
                                <Input.TextArea rows={3} placeholder="Additional info..." />
                            </Form.Item>
                        </div>
                    </div>
                </Form>
            </Modal>

            {/* Bulk Add Modal */}
            <Modal
                title="Bulk Add User Schedules"
                open={isBulkModalOpen}
                onOk={handleBulkModalSubmit}
                onCancel={() => setIsBulkModalOpen(false)}
                confirmLoading={loading}
                width={800}
                centered
            >
                <Form
                    form={bulkForm}
                    layout="vertical"
                    className="mt-3"
                >
                    <div className="row">
                        <div className="col-md-12 d-flex justify-content-between align-items-center">
                            <Form.Item
                                name="shift_id"
                                className="w-100"
                                label={
                                    <div className="d-flex justify-content-between align-items-center w-100">
                                        <span>Select Shift</span>
                                    </div>
                                }
                                rules={[{ required: true, message: 'Please select a shift' }]}
                            >
                                <Select
                                    placeholder="Select a shift"
                                    options={shifts.map(s => ({ label: s.name, value: s.id }))}
                                    onChange={() => fetchAvailableUsers()}
                                />
                            </Form.Item>
                            <Tooltip title="Add New Shift" style={{ cursor: 'pointer' }}>
                                <PlusOutlined
                                    className="text-primary cursor-pointer ms-1 mt-1 p-1 border border-info rounded"
                                    onClick={() => setIsShiftModalOpen(true)}
                                />
                            </Tooltip>
                        </div>
                    </div>

                    {isShiftSelected ? (
                        availableUsers.length > 0 ? (
                            <>
                                <div className="row">
                                    <div className="col-md-12">
                                        <Form.Item
                                            name="days"
                                            label="Days of Week"
                                            rules={[{ required: true, message: 'Please select at least one day' }]}
                                        >
                                            <Select mode="multiple" placeholder="Select days" maxTagCount="responsive">
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
                                </div>

                                <div className="row">
                                    <div className="col-md-12">
                                        <Form.Item
                                            name="notes"
                                            label="Notes"
                                        >
                                            <Input.TextArea rows={2} placeholder="Additional info..." />
                                        </Form.Item>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <label className="fw-bold fs-6">Select Users to Apply Schedule</label>
                                        <Checkbox
                                            checked={selectedUserIds.length === availableUsers.length && availableUsers.length > 0}
                                            indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < availableUsers.length}
                                            onChange={(e) => setSelectedUserIds(e.target.checked ? availableUsers.map(u => u.id) : [])}
                                        >
                                            Select All Users
                                        </Checkbox>
                                    </div>

                                    <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                                        {Object.entries(groupedUsers).map(([status, statusUsers]) => {
                                            const statusUserIds = statusUsers.map(u => u.id);
                                            const isAllStatusSelected = statusUserIds.every(id => selectedUserIds.includes(id));
                                            const isSomeStatusSelected = statusUserIds.some(id => selectedUserIds.includes(id)) && !isAllStatusSelected;

                                            return (
                                                <div key={status} className="mb-4 p-3 border rounded shadow-sm bg-light bg-opacity-10">
                                                    <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                                                        <h6 className="text-uppercase fw-bold mb-0 d-flex align-items-center">
                                                            <Tag color={
                                                                status.toLowerCase() === 'active' ? 'success' :
                                                                    status.toLowerCase() === 'pending' ? 'warning' : 'default'
                                                            }>
                                                                {status}
                                                            </Tag>
                                                            <span className="ms-2 text-muted" style={{ fontSize: '0.8rem' }}>
                                                                ({statusUsers.length} Users)
                                                            </span>
                                                        </h6>
                                                        <Checkbox
                                                            checked={isAllStatusSelected}
                                                            indeterminate={isSomeStatusSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedUserIds(prev => Array.from(new Set([...prev, ...statusUserIds])));
                                                                } else {
                                                                    setSelectedUserIds(prev => prev.filter(id => !statusUserIds.includes(id)));
                                                                }
                                                            }}
                                                        >
                                                            Select All {status}
                                                        </Checkbox>
                                                    </div>
                                                    <div className="row g-2">
                                                        {statusUsers.map(user => (
                                                            <div key={user.id} className="col-md-4 col-sm-6">
                                                                <div
                                                                    className={`p-2 border rounded d-flex align-items-center gap-2 cursor-pointer transition-all ${selectedUserIds.includes(user.id) ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                                                                    onClick={() => {
                                                                        setSelectedUserIds(prev =>
                                                                            prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
                                                                        );
                                                                    }}
                                                                    style={{ transition: 'all 0.2s' }}
                                                                >
                                                                    <Checkbox
                                                                        checked={selectedUserIds.includes(user.id)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onChange={(e) => {
                                                                            setSelectedUserIds(prev =>
                                                                                e.target.checked ? [...prev, user.id] : prev.filter(id => id !== user.id)
                                                                            );
                                                                        }}
                                                                    />
                                                                    <span className="text-truncate" style={{ fontSize: '0.9rem' }}>{user.name}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-5 border rounded bg-light mt-3">
                                <i className="ri-error-warning-line fs-1 text-warning d-block mb-2"></i>
                                <p className="mb-0 text-muted">All users are assigned to shifts. Unassign users to add a new shift.</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center p-5 border rounded bg-light mt-3">
                            <p className="mb-0 text-muted">Please select a shift above to see eligible users for assignment.</p>
                        </div>
                    )}
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
                    <div className="row">
                        <div className="col-md-4">
                            <Form.Item
                                name="name"
                                label="Shift Name"
                                rules={[{ required: true, message: 'Please enter shift name' }]}
                            >
                                <Input placeholder="e.g. Morning Shift, Night Shift" />
                            </Form.Item>
                        </div>
                        <div className="col-md-4">
                            <Form.Item
                                name="duration"
                                label="Duration (Minutes)"
                            >
                                <InputNumber className="w-100" min={1} readOnly disabled />
                            </Form.Item>
                        </div>
                        <div className="col-md-4">
                            <Form.Item
                                name="total_break_minutes"
                                label="Break Time (Min)"
                                initialValue={30}
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <InputNumber className="w-100" min={0} />
                            </Form.Item>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item
                                name="start_time"
                                label="Start Time"
                                rules={[{ required: true }]}
                            >
                                <TimePicker className="w-100" onChange={(time) => {
                                    const endTime = shiftForm.getFieldValue('end_time');
                                    const duration = calculateDuration(time, endTime);
                                    if (duration !== null) shiftForm.setFieldsValue({ duration });
                                }} />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item
                                name="end_time"
                                label="End Time"
                                rules={[{ required: true }]}
                            >
                                <TimePicker className="w-100" onChange={(time) => {
                                    const startTime = shiftForm.getFieldValue('start_time');
                                    const duration = calculateDuration(startTime, time);
                                    if (duration !== null) shiftForm.setFieldsValue({ duration });
                                }} />
                            </Form.Item>
                        </div>
                    </div>

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
