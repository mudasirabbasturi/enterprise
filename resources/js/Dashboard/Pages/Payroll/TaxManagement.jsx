import { useState, useMemo } from 'react';
import { Head, Link, Breadcrumb, DeleteOutlined, EditOutlined, PlusOutlined, router, notification } from "@shared/ui";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import { Modal, Form, Input, InputNumber, Select, Button, Tag } from 'antd';
import MainLayout from "@layout";

const TaxManagement = ({ taxRules }) => {
    const [api, contextHolder] = notification.useNotification();
    const [selectedRows, setSelectedRows] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const columnDefs = useMemo(() => [
        {
            headerName: "Tax Name",
            field: "name",
            flex: 2,
            checkboxSelection: true,
            headerCheckboxSelection: true
        },
        {
            headerName: "Type",
            field: "type",
            flex: 1,
            cellRenderer: params => (
                <Tag color={params.value === 'percentage' ? 'cyan' : 'orange'}>
                    {params.value.toUpperCase()}
                </Tag>
            )
        },
        {
            headerName: "Value",
            field: "value",
            flex: 1,
            valueFormatter: params => params.data.type === 'percentage' ? `${params.value}%` : `Fixed: ${params.value.toLocaleString()}`
        },
        { headerName: "Description", field: "description", flex: 2 },
        {
            headerName: "Actions",
            width: 120,
            pinned: 'right',
            cellRenderer: params => (
                <div className="d-flex gap-2 align-items-center h-100">
                    <Button
                        type="text"
                        icon={<EditOutlined className="text-primary" />}
                        onClick={() => handleEdit(params.data)}
                    />
                    <Button
                        type="text"
                        icon={<DeleteOutlined className="text-danger" />}
                        onClick={() => handleDelete(params.data.id)}
                    />
                </div>
            )
        }
    ], []);

    const handleEdit = (tax) => {
        setEditingTax(tax);
        form.setFieldsValue(tax);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Delete this tax rule?')) {
            setLoading(true);
            router.delete(route('tax-management.destroy', id), {
                onSuccess: () => api.success({ message: 'Success', description: 'Tax rule deleted' }),
                onError: (errors) => {
                    Object.values(errors).forEach(err => {
                        api.error({ message: 'Error', description: err });
                    });
                },
                onFinish: () => setLoading(false)
            });
        }
    };

    const handleBulkDelete = () => {
        if (confirm(`Delete ${selectedRows.length} selected tax rules?`)) {
            setLoading(true);
            router.delete(route('tax-management.bulk-destroy'), {
                data: { ids: selectedRows.map(r => r.id) },
                onSuccess: () => {
                    api.success({ message: 'Success', description: 'Selected tax rules deleted' });
                    setSelectedRows([]);
                },
                onError: (errors) => {
                    Object.values(errors).forEach(err => {
                        api.error({ message: 'Error', description: err });
                    });
                },
                onFinish: () => setLoading(false)
            });
        }
    };

    const handleSubmit = (values) => {
        setLoading(true);
        if (editingTax) {
            router.put(route('tax-management.update', editingTax.id), values, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({ message: 'Success', description: 'Tax rule updated' });
                },
                onError: (errors) => {
                    Object.values(errors).forEach(err => {
                        api.error({ message: 'Error', description: err });
                    });
                },
                onFinish: () => setLoading(false)
            });
        } else {
            router.post(route('tax-management.store'), values, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({ message: 'Success', description: 'Tax rule created' });
                },
                onError: (errors) => {
                    Object.values(errors).forEach(err => {
                        api.error({ message: 'Error', description: err });
                    });
                },
                onFinish: () => setLoading(false)
            });
        }
    };

    return (
        <>
            <Head title="Tax Management" />
            {contextHolder}
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className='breadCrumb'
                        items={[{ title: <Link href="/">Home</Link> }, { title: 'Payroll' }, { title: 'Tax Management' }]}
                    />
                    <div className="d-flex gap-2">
                        {selectedRows.length > 0 && (
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={handleBulkDelete}
                            >
                                Delete Selected ({selectedRows.length})
                            </Button>
                        )}
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => { setEditingTax(null); form.resetFields(); setIsModalOpen(true); }}
                        >
                            Add Tax Rule
                        </Button>
                    </div>
                </div>

                <div className="card mt-4 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="ag-grid-wrapper">
                            <AgGridReact
                                rowData={taxRules}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                theme={gridTheme}
                                pagination={true}
                                paginationAutoPageSize={true}
                                rowSelection="multiple"
                                onSelectionChanged={(params) => setSelectedRows(params.api.getSelectedRows())}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title={editingTax ? "Edit Tax Rule" : "Add Tax Rule"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ type: 'percentage' }}>
                    <Form.Item name="name" label="Tax Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Income Tax" />
                    </Form.Item>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                                <Select>
                                    <Select.Option value="percentage">Percentage (%)</Select.Option>
                                    <Select.Option value="fixed">Fixed Amount</Select.Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item name="value" label="Value" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item name="description" label="Description">
                        <Input.TextArea placeholder="Internal notes..." rows={3} />
                    </Form.Item>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {editingTax ? "Update" : "Save"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
};

TaxManagement.layout = (page) => <MainLayout children={page} />;
export default TaxManagement;
