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
import LeaveTypeForm from "@/Dashboard/Components/LeaveManagement/LeaveTypeForm";

const LeaveTypes = ({ leaveTypes }) => {
    const [api, contextHolder] = notification.useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const formRef = useRef();

    const [selectedRows, setSelectedRows] = useState([]);

    const onSelectionChanged = (params) => {
        setSelectedRows(params.api.getSelectedRows());
    };

    const handleBulkDelete = () => {
        const ids = selectedRows.map(row => row.id);
        router.delete(route('leave-types.bulk-destroy'), {
            data: { ids },
            onSuccess: () => {
                api.success({ message: "Selected leave types deleted successfully" });
                setSelectedRows([]);
            },
            onError: (errors) => {
                if (errors.error) {
                    api.error({ message: errors.error });
                }
            }
        });
    };

    const columnDefs = useMemo(() => [
        {
            headerCheckboxSelection: true,
            checkboxSelection: true,
            width: 50,
            pinned: "left",
            lockPosition: true,
            filter: false,
        },
        {
            headerName: "Name",
            field: "name",
            flex: 2,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center h-100">
                    <span
                        className="rounded-circle me-2"
                        style={{ width: '12px', height: '12px', backgroundColor: params.data.color || '#ccc' }}
                    ></span>
                    <span className="fw-bold">{params.value}</span>
                </div>
            )
        },
        {
            headerName: "Max/Year",
            field: "max_per_year",
            flex: 1,
            valueFormatter: (params) => params.value ? `${params.value} days` : "Unlimited"
        },
        {
            headerName: "Req. Approval",
            field: "requires_approval",
            flex: 1,
            cellRenderer: (params) => (
                <Tag color={params.value ? "error" : "success"}>
                    {params.value ? "YES" : "NO"}
                </Tag>
            )
        },
        {
            headerName: "Actions",
            width: 120,
            pinned: "right",
            cellRenderer: (params) => (
                <div className="d-flex gap-2 align-items-center h-100">
                    <Tooltip title="Edit">
                        <button
                            className="btn btn-outline-warning btn-sm rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => {
                                setEditingType(params.data);
                                setIsModalOpen(true);
                            }}
                        >
                            <EditOutlined />
                        </button>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm
                            title="Delete this leave type?"
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

    const handleDelete = (id) => {
        router.delete(route('leave-types.destroy', id), {
            onSuccess: () => {
                api.success({ message: "Leave type deleted successfully" });
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
            <Head title="Leave Types" />
            <div className="container-fluid p-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Breadcrumb
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Leave Management" },
                            { title: "Leave Types" }
                        ]}
                    />
                    <div className="d-flex gap-2">
                        {selectedRows.length > 0 && (
                            <Popconfirm
                                title={`Delete ${selectedRows.length} selected leave types?`}
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
                                setEditingType(null);
                                setIsModalOpen(true);
                            }}
                        >
                            Add Leave Type
                        </button>
                    </div>
                </div>

                <div className="ag-grid-wrapper" style={{ height: '70vh' }}>
                    <AgGridReact
                        rowData={leaveTypes}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        theme={gridTheme}
                        pagination={true}
                        rowSelection="multiple"
                        onSelectionChanged={onSelectionChanged}
                    />
                </div>
            </div>

            <Modal
                title={editingType ? "Edit Leave Type" : "Add Leave Type"}
                open={isModalOpen}
                onOk={() => formRef.current?.submitForm()}
                onCancel={() => setIsModalOpen(false)}
                width={600}
                centered
            >
                <div className="mt-3">
                    <LeaveTypeForm
                        ref={formRef}
                        initialValues={editingType}
                        mode={editingType ? "edit" : "add"}
                        onClose={() => setIsModalOpen(false)}
                        notificationApi={api}
                    />
                </div>
            </Modal>
        </>
    );
};

LeaveTypes.layout = (page) => <MainLayout children={page} />;

export default LeaveTypes;
