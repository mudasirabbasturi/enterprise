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
    PlusOutlined,
    Tag,
    Checkbox
} from "@shared/ui";
import { Form, Select, InputNumber, Button } from "antd";
import MainLayout from "@layout";
import LeaveBalanceForm from "@/Dashboard/Components/LeaveManagement/LeaveBalanceForm";

const LeaveBalances = ({ balances, users, leaveTypes, isPersonal = false }) => {
    const [api, contextHolder] = notification.useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingBalance, setEditingBalance] = useState(null);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState(null);
    const [loading, setLoading] = useState(false);
    const formRef = useRef();
    const [bulkForm] = Form.useForm();

    const [selectedRows, setSelectedRows] = useState([]);

    const onSelectionChanged = (params) => {
        setSelectedRows(params.api.getSelectedRows());
    };

    const handleBulkDelete = () => {
        const ids = selectedRows.map(row => row.id);
        router.delete(route('leave-balances.bulk-destroy'), {
            data: { ids },
            onSuccess: () => {
                api.success({ message: "Selected records removed successfully" });
                setSelectedRows([]);
            },
            onError: (errors) => {
                if (errors.error) {
                    api.error({ message: errors.error });
                }
            }
        });
    };

    const handleBulkAssign = (values) => {
        if (selectedUserIds.length === 0) {
            api.error({ message: 'Error', description: 'Please select at least one user' });
            return;
        }

        setLoading(true);
        router.post(route('leave-balances.bulk-store'), {
            ...values,
            user_ids: selectedUserIds
        }, {
            onSuccess: () => {
                setIsBulkModalOpen(false);
                setSelectedUserIds([]);
                bulkForm.resetFields();
                api.success({ message: 'Success', description: 'Balance assigned to selected users' });
            },
            onError: (errors) => {
                Object.values(errors).forEach(err => {
                    api.error({ message: 'Error', description: err });
                });
            },
            onFinish: () => setLoading(false)
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
                cellClass: "fw-bold",
                filter: "agTextColumnFilter"
            });
        }

        cols.push(
            {
                headerName: "Leave Type",
                field: "leave_type.name",
                flex: 1,
                cellRenderer: (params) => (
                    <Tag color={params.data.leave_type?.color}>{params.value}</Tag>
                )
            },
            {
                headerName: "Year",
                field: "year",
                flex: 0.8,
                cellClass: "text-center"
            },
            {
                headerName: "Allocated",
                field: "allocated",
                flex: 0.8,
                cellClass: "text-center text-primary fw-medium"
            },
            {
                headerName: "Used",
                field: "used",
                flex: 0.8,
                cellClass: "text-center text-danger"
            },
            {
                headerName: "Pending",
                field: "pending",
                flex: 0.8,
                cellClass: "text-center text-warning"
            },
            {
                headerName: "Remaining",
                field: "remaining",
                flex: 1,
                cellRenderer: (params) => {
                    const color = params.value > 0 ? "success" : "error";
                    return <Tag color={color} className="fw-bold fs-6">{params.value}</Tag>;
                }
            }
        );

        if (!isPersonal) {
            cols.push({
                headerName: "Actions",
                width: 120,
                pinned: "right",
                cellRenderer: (params) => (
                    <div className="d-flex gap-2 align-items-center h-100">
                        <Tooltip title="Adjust Balance">
                            <button
                                className="btn btn-outline-warning btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '28px', height: '28px' }}
                                onClick={() => {
                                    setEditingBalance(params.data);
                                    setIsModalOpen(true);
                                }}
                            >
                                <EditOutlined />
                            </button>
                        </Tooltip>
                        <Tooltip title="Delete Record">
                            <Popconfirm
                                title="Remove this balance record?"
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
            });
        }
        return cols;
    }, [isPersonal]);

    const handleDelete = (id) => {
        router.delete(route('leave-balances.destroy', id), {
            onSuccess: () => {
                api.success({ message: "Record removed successfully" });
            }
        });
    };

    return (
        <>
            {contextHolder}
            <Head title={isPersonal ? "My Leave Balances" : "Leave Balances"} />
            <div className="container-fluid p-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Breadcrumb
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Leave Management" },
                            { title: isPersonal ? "My Balances" : "Leave Balances" }
                        ]}
                    />
                    {!isPersonal && (
                        <div className="d-flex gap-2">
                            {selectedRows.length > 0 && (
                                <Popconfirm
                                    title={`Remove ${selectedRows.length} selected records?`}
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
                                className="btn btn-outline-primary btn-sm d-flex align-items-center"
                                onClick={() => {
                                    setSelectedUserIds([]);
                                    bulkForm.resetFields();
                                    bulkForm.setFieldsValue({ year: new Date().getFullYear() });
                                    setIsBulkModalOpen(true);
                                }}
                            >
                                <PlusOutlined className="me-1" /> Bulk Add
                            </button>
                            <button
                                className="btn btn-primary btn-sm d-flex align-items-center"
                                onClick={() => {
                                    setEditingBalance(null);
                                    setIsModalOpen(true);
                                }}
                            >
                                New Balance Record
                            </button>
                        </div>
                    )}
                </div>

                <div className="ag-grid-wrapper" style={{ height: '70vh' }}>
                    <AgGridReact
                        rowData={balances}
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
                title={editingBalance ? "Adjust Balance" : "New Balance Record"}
                open={isModalOpen}
                onOk={() => formRef.current?.submitForm()}
                onCancel={() => setIsModalOpen(false)}
                width={700}
                centered
            >
                <div className="mt-3">
                    <LeaveBalanceForm
                        ref={formRef}
                        initialValues={editingBalance}
                        mode={editingBalance ? "edit" : "add"}
                        onClose={() => setIsModalOpen(false)}
                        users={users}
                        leaveTypes={leaveTypes}
                        notificationApi={api}
                    />
                </div>
            </Modal>

            <Modal
                title="Bulk Assign Leave Balance"
                open={isBulkModalOpen}
                onCancel={() => setIsBulkModalOpen(false)}
                footer={null}
                width={800}
                centered
            >
                <Form form={bulkForm} layout="vertical" onFinish={handleBulkAssign} initialValues={{ year: new Date().getFullYear() }}>
                    <div className="row">
                        <div className="col-md-4">
                            <Form.Item name="leave_type_id" label="Leave Type" rules={[{ required: true }]}>
                                <Select
                                    placeholder="Select Leave Type"
                                    onChange={setSelectedLeaveTypeId}
                                    options={leaveTypes.map(t => ({ label: t.name, value: t.id }))}
                                />
                            </Form.Item>
                        </div>
                        <div className="col-md-4">
                            <Form.Item name="year" label="Year" rules={[{ required: true }]}>
                                <InputNumber className="w-100" />
                            </Form.Item>
                        </div>
                        <div className="col-md-4">
                            <Form.Item
                                name="allocated"
                                label="Allocated Days"
                                rules={[
                                    { required: true },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const typeId = getFieldValue('leave_type_id');
                                            const type = leaveTypes.find(t => t.id === typeId);
                                            if (!value || !type || value <= type.max_per_year) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error(`Maximum allowed: ${type.max_per_year} days`));
                                        },
                                    }),
                                ]}
                                help={selectedLeaveTypeId ? `Max allowed: ${leaveTypes.find(t => t.id === selectedLeaveTypeId)?.max_per_year} days` : null}
                            >
                                <InputNumber className="w-100" min={0} />
                            </Form.Item>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <label className="fw-bold fs-5">Select Employees</label>
                            <Checkbox
                                checked={selectedUserIds.length > 0 && selectedUserIds.length === users.length}
                                indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < users.length}
                                onChange={(e) => {
                                    setSelectedUserIds(e.target.checked ? users.map(u => u.id) : []);
                                }}
                            >
                                Select All Employees
                            </Checkbox>
                        </div>

                        <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '10px' }}>
                            {Object.entries(
                                users.reduce((acc, user) => {
                                    const status = user.status || 'Active';
                                    if (!acc[status]) acc[status] = [];
                                    acc[status].push(user);
                                    return acc;
                                }, {})
                            ).map(([status, statusUsers]) => (
                                <div key={status} className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1 bg-light p-2 rounded">
                                        <span className="fw-bold text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
                                            {status} ({statusUsers.length})
                                        </span>
                                        <Checkbox
                                            className="fw-medium"
                                            checked={statusUsers.every(u => selectedUserIds.includes(u.id))}
                                            indeterminate={statusUsers.some(u => selectedUserIds.includes(u.id)) && !statusUsers.every(u => selectedUserIds.includes(u.id))}
                                            onChange={(e) => {
                                                const groupIds = statusUsers.map(u => u.id);
                                                if (e.target.checked) {
                                                    setSelectedUserIds(prev => [...new Set([...prev, ...groupIds])]);
                                                } else {
                                                    setSelectedUserIds(prev => prev.filter(id => !groupIds.includes(id)));
                                                }
                                            }}
                                        >
                                            Select All {status}
                                        </Checkbox>
                                    </div>
                                    <div className="row g-2">
                                        {statusUsers.map(user => {
                                            const currentYear = bulkForm.getFieldValue('year');
                                            const existingBalance = balances.find(b =>
                                                b.user_id === user.id &&
                                                b.leave_type_id === selectedLeaveTypeId &&
                                                b.year === currentYear
                                            );

                                            return (
                                                <div key={user.id} className="col-md-4 col-sm-6">
                                                    <div
                                                        className={`p-2 border rounded d-flex align-items-center gap-2 transition-all ${selectedUserIds.includes(user.id) ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                                                        onClick={() => {
                                                            setSelectedUserIds(prev =>
                                                                prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
                                                            );
                                                        }}
                                                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
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
                                                        <div className="d-flex flex-column overflow-hidden" style={{ lineHeight: '1.2' }}>
                                                            <span className="text-truncate fw-medium" style={{ fontSize: '0.85rem' }}>{user.name}</span>
                                                            {existingBalance && (
                                                                <small className="text-warning text-truncate fw-bold" style={{ fontSize: '9px' }}>
                                                                    {existingBalance.allocated} Days Existing
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            disabled={selectedUserIds.length === 0}
                        >
                            Bulk Assign {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
};

LeaveBalances.layout = (page) => <MainLayout children={page} />;

export default LeaveBalances;
