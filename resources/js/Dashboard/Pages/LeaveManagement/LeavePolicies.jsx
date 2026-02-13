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
import LeavePolicyForm from "@/Dashboard/Components/LeaveManagement/LeavePolicyForm";

const LeavePolicies = ({ policies, leaveTypes, branches, departments, designations }) => {
    const [api, contextHolder] = notification.useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const formRef = useRef();

    const [selectedRows, setSelectedRows] = useState([]);

    const onSelectionChanged = (params) => {
        setSelectedRows(params.api.getSelectedRows());
    };

    const handleBulkDelete = () => {
        const ids = selectedRows.map(row => row.id);
        router.delete(route('leave-policies.bulk-destroy'), {
            data: { ids },
            onSuccess: () => {
                api.success({ message: "Selected leave policies deleted successfully" });
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
            headerName: "Leave Type",
            field: "leave_type.name",
            flex: 1.5,
            cellClass: "fw-bold"
        },
        {
            headerName: "Branch",
            field: "branch.name",
            flex: 1,
            valueFormatter: (params) => params.value || "All"
        },
        {
            headerName: "Department",
            field: "department.name",
            flex: 1,
            valueFormatter: (params) => params.value || "All"
        },
        {
            headerName: "Designation",
            field: "designation.name",
            flex: 1,
            valueFormatter: (params) => params.value || "All"
        },
        {
            headerName: "Days/Year",
            field: "days_per_year",
            flex: 0.8,
            cellClass: "text-center fw-bold"
        },
        {
            headerName: "Approval",
            field: "requires_approval",
            flex: 0.8,
            cellRenderer: (params) => (
                <Tag color={params.value ? "warning" : "success"}>
                    {params.value ? "REQUIRED" : "AUTO"}
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
                                setEditingPolicy(params.data);
                                setIsModalOpen(true);
                            }}
                        >
                            <EditOutlined />
                        </button>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm
                            title="Delete this leave policy?"
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
        router.delete(route('leave-policies.destroy', id), {
            onSuccess: () => {
                api.success({ message: "Leave policy deleted successfully" });
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
            <Head title="Leave Policies" />
            <div className="container-fluid p-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Breadcrumb
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Leave Management" },
                            { title: "Leave Policies" }
                        ]}
                    />
                    <div className="d-flex gap-2">
                        {selectedRows.length > 0 && (
                            <Popconfirm
                                title={`Delete ${selectedRows.length} selected leave policies?`}
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
                                setEditingPolicy(null);
                                setIsModalOpen(true);
                            }}
                        >
                            Add Leave Policy
                        </button>
                    </div>
                </div>

                <div className="ag-grid-wrapper" style={{ height: '70vh' }}>
                    <AgGridReact
                        rowData={policies}
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
                title={editingPolicy ? "Edit Leave Policy" : "Add Leave Policy"}
                open={isModalOpen}
                onOk={() => formRef.current?.submitForm()}
                onCancel={() => setIsModalOpen(false)}
                width={800}
                centered
            >
                <div className="mt-3">
                    <LeavePolicyForm
                        ref={formRef}
                        initialValues={editingPolicy}
                        mode={editingPolicy ? "edit" : "add"}
                        onClose={() => setIsModalOpen(false)}
                        leaveTypes={leaveTypes}
                        branches={branches}
                        departments={departments}
                        designations={designations}
                        notificationApi={api}
                    />
                </div>
            </Modal>
        </>
    );
};

LeavePolicies.layout = (page) => <MainLayout children={page} />;

export default LeavePolicies;
