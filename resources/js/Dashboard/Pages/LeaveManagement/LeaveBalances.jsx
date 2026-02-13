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
    Tag
} from "@shared/ui";
import MainLayout from "@layout";
import LeaveBalanceForm from "@/Dashboard/Components/LeaveManagement/LeaveBalanceForm";

const LeaveBalances = ({ balances, users, leaveTypes, isPersonal = false }) => {
    const [api, contextHolder] = notification.useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBalance, setEditingBalance] = useState(null);
    const formRef = useRef();

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
        </>
    );
};

LeaveBalances.layout = (page) => <MainLayout children={page} />;

export default LeaveBalances;
