import { useState, useMemo, useEffect } from "react";
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
    SyncOutlined,
    router,
    notification,
    Modal,
    Form,
    Input,
    Switch,
    Tag
} from "@shared/ui";
import MainLayout from "@layout";

const Shifts = ({ shifts }) => {
    const [api, contextHolder] = notification.useNotification();
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [form] = Form.useForm();

    const columns = useMemo(() => [
        {
            headerName: "Shift Name",
            field: "name",
            flex: 2,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center h-100">
                    <div className="avatar-xs me-2 bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '24px', height: '24px', backgroundColor: '#e7f1ff', fontSize: '10px', fontWeight: 'bold' }}>
                        {params.value ? params.value.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="fw-bold">{params.value}</span>
                </div>
            )
        },
        {
            headerName: "Notes",
            field: "notes",
            flex: 3,
            cellRenderer: (params) => (
                <span className="text-muted">{params.value || "No notes"}</span>
            )
        },
        {
            headerName: "Status",
            field: "is_active",
            flex: 1,
            cellRenderer: (params) => (
                <Tag color={params.value ? "success" : "error"}>
                    {params.value ? "Active" : "Inactive"}
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
                    <Tooltip title="Edit Shift">
                        <button
                            className="btn btn-outline-warning btn-sm rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => handleEdit(params.data)}
                        >
                            <EditOutlined />
                        </button>
                    </Tooltip>
                    <Tooltip title="Delete Shift">
                        <Popconfirm
                            title="Are you sure you want to delete this shift?"
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

    const handleEdit = (shift) => {
        setEditingShift(shift);
        form.setFieldsValue({
            name: shift.name,
            notes: shift.notes,
            is_active: !!shift.is_active
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        router.delete(route('shifts.destroy', id), {
            onSuccess: () => {
                api.success({
                    message: "Success",
                    description: "Shift deleted successfully",
                    placement: "topRight"
                });
            }
        });
    };

    const handleAddNew = () => {
        setEditingShift(null);
        form.resetFields();
        form.setFieldsValue({ is_active: true });
        setIsModalOpen(true);
    };

    const handleModalSubmit = () => {
        form.validateFields().then(values => {
            setLoading(true);
            const url = editingShift ? route('shifts.update', editingShift.id) : route('shifts.store');
            const method = editingShift ? 'put' : 'post';

            router[method](url, values, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({
                        message: "Success",
                        description: `Shift ${editingShift ? 'updated' : 'created'} successfully`,
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
            <Head title="Work Schedule - Shifts" />
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className="breadCrumb"
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Work Schedule" },
                            { title: "Shifts" }
                        ]}
                    />
                    <button
                        className="btn btn-primary btn-sm d-flex align-items-center"
                        onClick={handleAddNew}
                    >
                        <PlusOutlined className="me-1" />
                        Add New Shift
                    </button>
                </div>

                <div className="card mt-4 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="ag-grid-wrapper">
                            <AgGridReact
                                rowData={shifts}
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
                title={editingShift ? "Edit Shift" : "Add New Shift"}
                open={isModalOpen}
                onOk={handleModalSubmit}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={loading}
                okText={editingShift ? "Save Changes" : "Create Shift"}
                centered
            >
                <Form
                    form={form}
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
                        <Input.TextArea rows={4} placeholder="Additional details..." />
                    </Form.Item>

                    <Form.Item
                        name="is_active"
                        label="Active Status"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

Shifts.layout = (page) => <MainLayout children={page} />;

export default Shifts;
