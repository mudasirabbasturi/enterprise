import { useState, useMemo } from 'react';
import { Head, Link, Breadcrumb, DeleteOutlined, EditOutlined, PlusOutlined, router, notification } from "@shared/ui";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import { Modal, Form, Input, InputNumber, Select, Button, Space, Divider, Tag } from 'antd';
import MainLayout from "@layout";

const SalaryPackages = ({ packages, taxRules }) => {
    const [api, contextHolder] = notification.useNotification();
    const [selectedRows, setSelectedRows] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const columnDefs = useMemo(() => [
        {
            headerName: "Package Name",
            field: "name",
            flex: 2,
            checkboxSelection: true,
            headerCheckboxSelection: true
        },
        {
            headerName: "Base Salary",
            field: "base_salary",
            flex: 1,
            valueFormatter: params => {
                const val = parseFloat(params.value || 0);
                return `${params.data.currency} ${val.toLocaleString()}`;
            }
        },
        {
            headerName: "Allowances",
            field: "allowances",
            flex: 2,
            valueGetter: params => (params.data.allowances || []).map(a => `${a.label}: ${a.amount}`).join(', ')
        },
        {
            headerName: "Linked Taxes",
            flex: 2,
            valueGetter: params => {
                const rules = params.data.tax_rules || params.data.taxRules || [];
                return rules.map(t => t.name).join(', ');
            },
            cellRenderer: params => (
                <div className="d-flex flex-wrap gap-1">
                    {(params.data.tax_rules || params.data.taxRules || []).map(t => (
                        <Tag key={t.id} color="blue">{t.name}</Tag>
                    ))}
                </div>
            )
        },
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

    const handleEdit = (pkg) => {
        setEditingPackage(pkg);
        form.setFieldsValue({
            ...pkg,
            tax_ids: pkg.tax_rules ? pkg.tax_rules.map(t => t.id) : pkg.taxRules ? pkg.taxRules.map(t => t.id) : []
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this package?')) {
            setLoading(true);
            router.delete(route('salary-packages.destroy', id), {
                onSuccess: () => api.success({ message: 'Success', description: 'Package deleted successfully' }),
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
        if (confirm(`Delete ${selectedRows.length} selected packages?`)) {
            setLoading(true);
            router.delete(route('salary-packages.bulk-destroy'), {
                data: { ids: selectedRows.map(r => r.id) },
                onSuccess: () => {
                    api.success({ message: 'Success', description: 'Selected packages deleted' });
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
        if (editingPackage) {
            router.put(route('salary-packages.update', editingPackage.id), values, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({ message: 'Success', description: 'Package updated successfully' });
                },
                onError: (errors) => {
                    Object.values(errors).forEach(err => {
                        api.error({ message: 'Error', description: err });
                    });
                },
                onFinish: () => setLoading(false)
            });
        } else {
            router.post(route('salary-packages.store'), values, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({ message: 'Success', description: 'Package created successfully' });
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
            <Head title="Salary Packages" />
            {contextHolder}
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className='breadCrumb'
                        items={[{ title: <Link href="/">Home</Link> }, { title: 'Payroll' }, { title: 'Salary Packages' }]}
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
                            onClick={() => { setEditingPackage(null); form.resetFields(); setIsModalOpen(true); }}
                        >
                            Create Package
                        </Button>
                    </div>
                </div>

                <div className="card mt-4 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="ag-grid-wrapper">
                            <AgGridReact
                                rowData={packages}
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
                title={editingPackage ? "Edit Salary Package" : "Create Salary Package"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ currency: 'PKR', allowances: [] }}>
                    <Form.Item name="name" label="Package Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Senior Developer" />
                    </Form.Item>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item name="base_salary" label="Base Salary" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item label="Allowances">
                        <Form.List name="allowances">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'label']}
                                                rules={[{ required: true, message: 'Missing label' }]}
                                            >
                                                <Input placeholder="Allowance Label" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'amount']}
                                                rules={[{ required: true, message: 'Missing amount' }]}
                                            >
                                                <InputNumber placeholder="Amount" min={0} />
                                            </Form.Item>
                                            <DeleteOutlined className="text-danger" onClick={() => remove(name)} />
                                        </Space>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            Add Allowance
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </Form.Item>

                    <Form.Item name="tax_ids" label="Linked Taxes">
                        <Select mode="multiple" placeholder="Select taxes to apply">
                            {taxRules.map(tax => (
                                <Select.Option key={tax.id} value={tax.id}>{tax.name} ({tax.value}{tax.type === 'percentage' ? '%' : ' fixed'})</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {editingPackage ? "Update Package" : "Create Package"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
};

SalaryPackages.layout = (page) => <MainLayout children={page} />;
export default SalaryPackages;
