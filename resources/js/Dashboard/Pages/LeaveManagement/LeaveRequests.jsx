import { useState, useMemo, useRef } from "react";
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
    Tooltip,
    Popconfirm,
    EditOutlined,
    DeleteOutlined,
    Tag,
    dayjs,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined
} from "@shared/ui";
import MainLayout from "@layout";
import LeaveRequestForm from "@/Dashboard/Components/LeaveManagement/LeaveRequestForm";
import { Input, Form, Select } from "antd";

const LeaveRequests = ({ requests, leaveTypes, users, isPersonal = false, selectedMonth, selectedYear }) => {
    const [api, contextHolder] = notification.useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [statusAction, setStatusAction] = useState({ type: '', id: null });
    const formRef = useRef();
    const [statusForm] = Form.useForm();

    const [selectedRows, setSelectedRows] = useState([]);
    const [filterDate, setFilterDate] = useState({
        month: (selectedMonth || dayjs().month() + 1) - 1,
        year: selectedYear || dayjs().year()
    });

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i);

    const handleDateFilterChange = (key, value) => {
        const newFilters = { ...filterDate, [key]: value };
        setFilterDate(newFilters);
        router.get(isPersonal ? route('my-leave-requests.index') : route('leave-requests.index'), {
            month: newFilters.month + 1,
            year: newFilters.year
        }, { preserveState: true });
    };

    const onSelectionChanged = (params) => {
        setSelectedRows(params.api.getSelectedRows());
    };

    const handleBulkDelete = () => {
        const ids = selectedRows.map(row => row.id);
        router.delete(route('leave-requests.bulk-destroy'), {
            data: { ids },
            onSuccess: () => {
                api.success({ message: "Selected requests deleted successfully" });
                setSelectedRows([]);
            },
            onError: (errors) => {
                if (errors.error) {
                    api.error({ message: errors.error });
                }
            }
        });
    };

    const columnDefs = useMemo(() => {
        const cols = [];

        if (!isPersonal) {
            cols.push({
                headerCheckboxSelection: true,
                checkboxSelection: true,
                width: 50,
                pinned: "left",
                lockPosition: true,
                filter: false,
            });
            cols.push({
                headerName: "User",
                field: "user.name",
                flex: 1.5,
                cellClass: "fw-bold"
            });
        }

        cols.push(
            {
                headerName: "Leave Type",
                field: "leave_type.name",
                flex: 1.2,
                cellRenderer: (params) => (
                    <Tag color={params.data.leave_type?.color}>{params.value}</Tag>
                )
            },
            {
                headerName: "Dates",
                flex: 2,
                valueGetter: (params) => `${dayjs(params.data.start_date).format('DD MMM')} - ${dayjs(params.data.end_date).format('DD MMM YYYY')}`,
                cellClass: "font-monospace"
            },
            {
                headerName: "Days",
                field: "total_days",
                flex: 0.8,
                cellClass: "text-center fw-bold"
            },
            {
                headerName: "Status",
                field: "status",
                flex: 1,
                cellRenderer: (params) => {
                    const colors = {
                        pending: 'warning',
                        approved: 'success',
                        rejected: 'error',
                        cancelled: 'default'
                    };
                    return <Tag color={colors[params.value]}>{params.value.toUpperCase()}</Tag>;
                }
            },
            {
                headerName: "Actions",
                width: 180,
                pinned: "right",
                cellRenderer: (params) => (
                    <div className="d-flex gap-2 align-items-center h-100">
                        {!isPersonal && (
                            <Tooltip title="View Status">
                                <button
                                    className="btn btn-outline-primary btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '28px', height: '28px' }}
                                    onClick={() => {
                                        setStatusAction({ type: params.data.status, id: params.data.id, record: params.data });
                                        statusForm.setFieldsValue({ rejection_reason: params.data.rejection_reason });
                                        setIsStatusModalOpen(true);
                                    }}
                                >
                                    <EyeOutlined />
                                </button>
                            </Tooltip>
                        )}
                        {params.data.status === 'pending' && (
                            <Tooltip title="Edit">
                                <button
                                    className="btn btn-outline-warning btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '28px', height: '28px' }}
                                    onClick={() => {
                                        setEditingRequest(params.data);
                                        setIsModalOpen(true);
                                    }}
                                >
                                    <EditOutlined />
                                </button>
                            </Tooltip>
                        )}
                        {!isPersonal && (
                            <Tooltip title="Delete">
                                <Popconfirm
                                    title="Delete this request?"
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
                        )}
                    </div>
                )
            }
        );
        return cols;
    }, [isPersonal, statusForm]);

    const handleDelete = (id) => {
        router.delete(route('leave-requests.destroy', id), {
            onSuccess: () => {
                api.success({ message: "Request deleted successfully" });
            }
        });
    };

    const handleStatusUpdate = (status) => {
        const values = statusForm.getFieldsValue();
        router.post(route('leave-requests.status', statusAction.id), {
            status,
            rejection_reason: values.rejection_reason
        }, {
            onSuccess: () => {
                api.success({ message: `Request ${status} successfully` });
                setIsStatusModalOpen(false);
                statusForm.resetFields();
            },
            onError: (errors) => {
                if (errors.error) {
                    api.error({ message: errors.error });
                }
            }
        });
    };

    return (
        <>
            {contextHolder}
            <Head title={isPersonal ? "My Leave Requests" : "Leave Requests"} />
            <div className="container-fluid p-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Breadcrumb
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Leave Management" },
                            { title: isPersonal ? "My Requests" : "Leave Requests" }
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
                        {!isPersonal && selectedRows.length > 0 && (
                            <Popconfirm
                                title={`Delete ${selectedRows.length} selected requests?`}
                                description="This action cannot be undone."
                                onConfirm={handleBulkDelete}
                                okText="Yes"
                                cancelText="No"
                                okButtonProps={{ danger: true }}
                            >
                                <button className="btn btn-danger btn-sm d-flex align-items-center">
                                    <DeleteOutlined className="me-1" /> Delete Selected ({selectedRows.length})
                                </button>
                            </Popconfirm>
                        )}
                        <button
                            className="btn btn-primary btn-sm d-flex align-items-center"
                            onClick={() => {
                                setEditingRequest(null);
                                setIsModalOpen(true);
                            }}
                        >
                            New Leave Request
                        </button>
                    </div>
                </div>

                <div className="ag-grid-wrapper" style={{ height: '70vh' }}>
                    <AgGridReact
                        rowData={requests}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        theme={gridTheme}
                        pagination={true}
                        rowSelection={!isPersonal ? "multiple" : undefined}
                        onSelectionChanged={!isPersonal ? onSelectionChanged : undefined}
                    />
                </div>
            </div>

            <Modal
                title={editingRequest ? "Edit Leave Request" : "New Leave Request"}
                open={isModalOpen}
                onOk={() => formRef.current?.submitForm()}
                onCancel={() => setIsModalOpen(false)}
                width={800}
                centered
            >
                <div className="mt-3">
                    <LeaveRequestForm
                        ref={formRef}
                        initialValues={editingRequest}
                        mode={editingRequest ? "edit" : "add"}
                        onClose={() => setIsModalOpen(false)}
                        leaveTypes={leaveTypes}
                        users={users}
                        notificationApi={api}
                        isPersonal={isPersonal}
                    />
                </div>
            </Modal>

            <Modal
                title="Leave Request Details"
                open={isStatusModalOpen}
                onCancel={() => setIsStatusModalOpen(false)}
                footer={null}
                centered
            >
                {statusAction.record && (
                    <div className="py-2">
                        <div className="mb-4">
                            <p className="mb-1 text-muted">Reason:</p>
                            <p className="fw-medium p-2 bg-light rounded">{statusAction.record.reason}</p>
                        </div>

                        {!isPersonal ? (
                            <Form form={statusForm} layout="vertical">
                                <Form.Item name="rejection_reason" label="Rejection Reason (if rejecting)">
                                    <Input.TextArea placeholder="Enter reason if rejecting..." />
                                </Form.Item>
                                <div className="d-flex gap-2 justify-content-end mt-3">
                                    {statusAction.record.status !== 'rejected' && (
                                        <button
                                            className="btn btn-danger d-flex align-items-center"
                                            onClick={() => handleStatusUpdate('rejected')}
                                        >
                                            <CloseCircleOutlined className="me-1" /> Reject
                                        </button>
                                    )}
                                    {statusAction.record.status !== 'approved' && (
                                        <button
                                            className="btn btn-success d-flex align-items-center"
                                            onClick={() => handleStatusUpdate('approved')}
                                        >
                                            <CheckCircleOutlined className="me-1" /> Approve
                                        </button>
                                    )}
                                    {statusAction.record.status !== 'pending' && (
                                        <button
                                            className="btn btn-warning d-flex align-items-center"
                                            onClick={() => handleStatusUpdate('pending')}
                                        >
                                            <SyncOutlined className="me-1" /> Reset to Pending
                                        </button>
                                    )}
                                </div>
                            </Form>
                        ) : (
                            statusAction.record.status === 'pending' ? (
                                <div className="alert alert-info">
                                    <p className="mb-0">This request is currently <strong>Pending</strong>. Please wait for approval.</p>
                                </div>
                            ) : (
                                <div className="mt-3 p-3 border rounded">
                                    <p className="mb-1"><strong>Final Status:</strong> <Tag color={statusAction.record.status === 'approved' ? 'success' : 'error'}>{statusAction.record.status.toUpperCase()}</Tag></p>
                                    {statusAction.record.rejection_reason && (
                                        <p className="mb-1"><strong>Note:</strong> {statusAction.record.rejection_reason}</p>
                                    )}
                                    <p className="mb-0 text-muted small">Processed on {dayjs(statusAction.record.approved_at).format('DD MMM YYYY HH:mm')}</p>
                                </div>
                            )
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
};

LeaveRequests.layout = (page) => <MainLayout children={page} />;

export default LeaveRequests;
