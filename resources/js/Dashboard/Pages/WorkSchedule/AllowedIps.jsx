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
    Tag
} from "@shared/ui";
import MainLayout from "@layout";

const AllowedIps = ({ allowedIps, users }) => {
    const [api, contextHolder] = notification.useNotification();
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIp, setEditingIp] = useState(null);
    const [form] = Form.useForm();

    const columns = useMemo(() => [
        {
            headerName: "User",
            field: "user.name",
            flex: 2,
            cellRenderer: (params) => (
                <span className="fw-bold">{params.value || "N/A"}</span>
            )
        },
        {
            headerName: "IP Address",
            field: "ip_address",
            flex: 2,
            cellRenderer: (params) => (
                <Tag color="geekblue" className="font-monospace px-2 py-1" style={{ fontSize: '13px' }}>
                    <i className="bi bi-shield-check me-1"></i>
                    {params.value}
                </Tag>
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
            headerName: "Created At",
            field: "created_at",
            flex: 1.5,
            valueFormatter: (params) => new Date(params.value).toLocaleString()
        },
        {
            headerName: "Actions",
            width: 120,
            sortable: false,
            filter: false,
            pinned: "right",
            cellRenderer: (params) => (
                <div className="d-flex gap-2 align-items-center h-100">
                    <Tooltip title="Edit IP">
                        <button
                            className="btn btn-outline-warning btn-sm rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => handleEdit(params.data)}
                        >
                            <EditOutlined />
                        </button>
                    </Tooltip>
                    <Tooltip title="Delete IP">
                        <Popconfirm
                            title="Are you sure you want to delete this IP entry?"
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

    const handleEdit = (ipEntry) => {
        setEditingIp(ipEntry);
        form.setFieldsValue({
            user_id: ipEntry.user_id,
            ip_address: ipEntry.ip_address,
            notes: ipEntry.notes
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        router.delete(route('allowed-ips.destroy', id), {
            onSuccess: () => {
                api.success({
                    message: "Success",
                    description: "Allowed IP deleted successfully",
                    placement: "topRight"
                });
            }
        });
    };

    const handleAddNew = () => {
        setEditingIp(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleModalSubmit = () => {
        form.validateFields().then(values => {
            setLoading(true);
            const url = editingIp ? route('allowed-ips.update', editingIp.id) : route('allowed-ips.store');
            const method = editingIp ? 'put' : 'post';

            router[method](url, values, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({
                        message: "Success",
                        description: `IP entry ${editingIp ? 'updated' : 'created'} successfully`,
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
            <Head title="Work Schedule - Allowed IPs" />
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className="breadCrumb"
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Work Schedule" },
                            { title: "Allowed IPs" }
                        ]}
                    />
                    <button
                        className="btn btn-primary btn-sm d-flex align-items-center"
                        onClick={handleAddNew}
                    >
                        <PlusOutlined className="me-1" />
                        Add Allowed IP
                    </button>
                </div>

                <div className="card mt-4 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="ag-grid-wrapper">
                            <AgGridReact
                                rowData={allowedIps}
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
                title={editingIp ? "Edit Allowed IP" : "Add Allowed IP"}
                open={isModalOpen}
                onOk={handleModalSubmit}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={loading}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-3"
                >
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

                    <Form.Item
                        name="ip_address"
                        label="IP Address"
                        rules={[
                            { required: true, message: 'Please enter IP address' },
                            { pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, message: 'Please enter a valid IPv4 address' }
                        ]}
                    >
                        <Input placeholder="e.g. 192.168.1.100" />
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Notes (Owner/Location)"
                    >
                        <Input.TextArea rows={3} placeholder="e.g. Office IP, Home Office" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

AllowedIps.layout = (page) => <MainLayout children={page} />;

export default AllowedIps;
