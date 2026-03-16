import { useState, useMemo } from 'react';
import { Head, Link, Breadcrumb, DeleteOutlined, EditOutlined, PlusOutlined, Divider, UnorderedListOutlined, Checkbox, router, notification } from "@shared/ui";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import { Modal, Form, InputNumber, Select, Button, Tag, Space, Card, Typography } from 'antd';
import MainLayout from "@layout";

const { Text, Title } = Typography;

const SalarySetup = ({ assignments, users, packages, taxRules }) => {
    const [api, contextHolder] = notification.useNotification();
    const [selectedRows, setSelectedRows] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [selectedPackageId, setSelectedPackageId] = useState(null);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [bulkForm] = Form.useForm();

    const columnDefs = useMemo(() => [
        {
            headerName: "Employee",
            field: "user.name",
            flex: 1.5,
            checkboxSelection: true,
            headerCheckboxSelection: true,
            cellRenderer: params => <div className="fw-bold">{params.value}</div>
        },
        {
            headerName: "Package",
            field: "package.name",
            flex: 1,
            cellRenderer: params => <Tag color="blue">{params.value}</Tag>
        },
        {
            headerName: "Base Salary",
            field: "package.base_salary",
            flex: 1,
            valueFormatter: params => `Rs. ${params.value?.toLocaleString()}`
        },
        {
            headerName: "Allowances",
            field: "package.allowances",
            flex: 1.5,
            editable: false,
            valueGetter: (params) => {
                const allowances = (params.data.package.allowances || []);
                const sum = allowances.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
                const labels = allowances.map(a => a.label).join(', ');
                return { sum, labels };
            },
            cellRenderer: params => (
                <div title={params.value.labels}>
                    <span className="fw-medium">+ Rs. {params.value.sum.toLocaleString()}</span>
                    <br />
                    <small className="text-muted" style={{ fontSize: '10px' }}>{params.value.labels}</small>
                </div>
            )
        },
        {
            headerName: "Gross Salary",
            flex: 1,
            headerClass: 'fw-bold',
            valueGetter: params => {
                const base = parseFloat(params.data.package.base_salary || 0);
                const allowances = (params.data.package.allowances || []).reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
                return base + allowances;
            },
            valueFormatter: params => `Rs. ${params.value?.toLocaleString()}`,
            cellStyle: { fontWeight: 'bold' }
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

    const handleEdit = (assignment) => {
        setEditingAssignment(assignment);
        setSelectedPackageId(assignment.package_id);
        form.setFieldsValue({
            user_id: assignment.user_id,
            package_id: assignment.package_id,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Unlink package from this employee?')) {
            setLoading(true);
            router.delete(route('salary-setup.destroy', id), {
                onSuccess: () => api.success({ message: 'Success', description: 'Salary assignment removed' }),
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
        if (confirm(`Unlink package from ${selectedRows.length} selected employees?`)) {
            setLoading(true);
            router.delete(route('salary-setup.bulk-destroy'), {
                data: { ids: selectedRows.map(r => r.id) },
                onSuccess: () => {
                    api.success({ message: 'Success', description: 'Selected salary assignments removed' });
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
        if (editingAssignment) {
            router.put(route('salary-setup.update', editingAssignment.id), values, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({ message: 'Success', description: 'Assignment updated' });
                },
                onError: (errors) => {
                    Object.values(errors).forEach(err => {
                        api.error({ message: 'Error', description: err });
                    });
                },
                onFinish: () => setLoading(false)
            });
        } else {
            router.post(route('salary-setup.store'), values, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({ message: 'Success', description: 'Package assigned to user' });
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

    const handleBulkAssign = (values) => {
        if (selectedUserIds.length === 0) {
            api.error({ message: 'Error', description: 'Please select at least one user' });
            return;
        }

        setLoading(true);
        router.post(route('salary-setup.bulk-store'), {
            ...values,
            user_ids: selectedUserIds
        }, {
            onSuccess: () => {
                setIsBulkModalOpen(false);
                setSelectedUserIds([]);
                api.success({ message: 'Success', description: 'Package assigned to selected users' });
            },
            onError: (errors) => {
                Object.values(errors).forEach(err => {
                    api.error({ message: 'Error', description: err });
                });
            },
            onFinish: () => setLoading(false)
        });
    };

    const currentPackage = useMemo(() =>
        packages.find(p => p.id === selectedPackageId),
        [selectedPackageId, packages]);

    const calculationPreview = useMemo(() => {
        if (!currentPackage) return null;
        const base = parseFloat(currentPackage.base_salary || 0);
        const allowanceItems = (currentPackage.allowances || []).map(a => ({
            ...a,
            amount: parseFloat(a.amount || 0)
        }));
        const totalAllowances = allowanceItems.reduce((acc, curr) => acc + curr.amount, 0);
        const gross = base + totalAllowances;

        let totalTax = 0;
        const taxes = (currentPackage.tax_rules || currentPackage.taxRules || []).map(rule => {
            const ruleValue = parseFloat(rule.value || 0);
            const amount = rule.type === 'percentage' ? (gross * ruleValue) / 100 : ruleValue;
            totalTax += amount;
            return { ...rule, calculated_amount: amount };
        });

        return { base, allowanceItems, totalAllowances, gross, taxes, totalTax, net: gross - totalTax };
    }, [currentPackage]);

    return (
        <>
            <Head title="Salary Setup" />
            {contextHolder}
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className='breadCrumb'
                        items={[{ title: <Link href="/">Home</Link> }, { title: 'Payroll' }, { title: 'Salary Setup' }]}
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
                            type="default"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setSelectedPackageId(null);
                                bulkForm.resetFields();
                                setSelectedUserIds([]);
                                setIsBulkModalOpen(true);
                            }}
                        >
                            Bulk Assign
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingAssignment(null);
                                setSelectedPackageId(null);
                                form.resetFields();
                                setIsModalOpen(true);
                            }}
                        >
                            Assign Package
                        </Button>
                    </div>
                </div>

                <div className="card mt-4 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="ag-grid-wrapper">
                            <AgGridReact
                                rowData={assignments}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                theme={gridTheme}
                                pagination={true}
                                paginationAutoPageSize={false}
                                paginationPageSize={20}
                                rowSelection="multiple"
                                onSelectionChanged={(params) => setSelectedRows(params.api.getSelectedRows())}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title={editingAssignment ? `Edit Salary: ${editingAssignment.user.name}` : "Assign Salary Package"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    {!editingAssignment && (
                        <Form.Item name="user_id" label="Employee" rules={[{ required: true }]}>
                            <Select showSearch optionFilterProp="children" placeholder="Select employee">
                                {users.map(u => <Select.Option key={u.id} value={u.id}>{u.name} ({u.email})</Select.Option>)}
                            </Select>
                        </Form.Item>
                    )}

                    <div className="row">
                        <div className="col-md-12">
                            <Form.Item name="package_id" label="Salary Package" rules={[{ required: true }]}>
                                <Select
                                    placeholder="Select package"
                                    onChange={(val) => {
                                        setSelectedPackageId(val);
                                    }}
                                >
                                    {packages.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
                                </Select>
                            </Form.Item>
                        </div>
                    </div>

                    {calculationPreview && (
                        <Card className="bg-light border-0 mt-3" style={{ borderRadius: '12px' }}>
                            <Title level={5}>Calculation Preview (Monthly)</Title>
                            <Divider style={{ margin: '12px 0' }} />
                            <div className="d-flex justify-content-between mb-2">
                                <Text>Base Salary:</Text>
                                <Text strong>Rs. {calculationPreview.base.toLocaleString()}</Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Allowances</Text>
                            {calculationPreview.allowanceItems.map((item, idx) => (
                                <div key={idx} className="d-flex justify-content-between mb-1">
                                    <Text size="small">{item.label}:</Text>
                                    <Text>+ Rs. {item.amount.toLocaleString()}</Text>
                                </div>
                            ))}
                            <Divider style={{ margin: '8px 0' }} />
                            <div className="d-flex justify-content-between mb-2">
                                <Text strong>Gross Income:</Text>
                                <Text strong>Rs. {calculationPreview.gross.toLocaleString()}</Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Deductions</Text>
                            {calculationPreview.taxes.map(tax => (
                                <div key={tax.id} className="d-flex justify-content-between mb-1">
                                    <Text>{tax.name}:</Text>
                                    <Text type="danger">- Rs. {tax.calculated_amount.toLocaleString()}</Text>
                                </div>
                            ))}
                            <Divider style={{ margin: '12px 0' }} />
                            <div className="d-flex justify-content-between align-items-center">
                                <Text strong>Estimated Net Pay:</Text>
                                <Title level={4} className="m-0 text-success">Rs. {Math.round(calculationPreview.net).toLocaleString()}</Title>
                            </div>
                        </Card>
                    )}

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {editingAssignment ? "Update Assignment" : "Assign Package"}
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Bulk Assign Modal */}
            <Modal
                title="Bulk Assign Salary Package"
                open={isBulkModalOpen}
                onCancel={() => setIsBulkModalOpen(false)}
                footer={null}
                width={800}
            >
                <Form form={bulkForm} layout="vertical" onFinish={handleBulkAssign}>
                    <div className="row">
                        <div className="col-md-12">
                            <Form.Item name="package_id" label="Salary Package" rules={[{ required: true }]}>
                                <Select
                                    placeholder="Select package"
                                    onChange={(val) => {
                                        setSelectedPackageId(val);
                                    }}
                                >
                                    {packages.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
                                </Select>
                            </Form.Item>
                        </div>
                    </div>

                    <div className="mt-4">
                        {users.filter(u => !assignments.some(a => a.user_id === u.id)).length > 0 ? (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="fw-bold fs-6">Select Employees to Assign</label>
                                    <Checkbox
                                        checked={selectedUserIds.length > 0 && selectedUserIds.length === users.filter(u => !assignments.some(a => a.user_id === u.id)).length}
                                        indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < users.filter(u => !assignments.some(a => a.user_id === u.id)).length}
                                        onChange={(e) => {
                                            const unassignedIds = users.filter(u => !assignments.some(a => a.user_id === u.id)).map(u => u.id);
                                            setSelectedUserIds(e.target.checked ? unassignedIds : []);
                                        }}
                                    >
                                        Select All Unassigned
                                    </Checkbox>
                                </div>

                                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                                    <div className="row g-2">
                                        {users.map(user => {
                                            const assignment = assignments.find(a => a.user_id === user.id);
                                            const isAssigned = !!assignment;
                                            return (
                                                <div key={user.id} className="col-md-4 col-sm-6">
                                                    <div
                                                        className={`p-2 border rounded d-flex align-items-center gap-2 transition-all ${selectedUserIds.includes(user.id) ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                                                        onClick={() => {
                                                            if (!isAssigned) {
                                                                setSelectedUserIds(prev =>
                                                                    prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
                                                                );
                                                            }
                                                        }}
                                                        style={{ cursor: isAssigned ? 'default' : 'pointer', transition: 'all 0.2s' }}
                                                    >
                                                        {!isAssigned ? (
                                                            <Checkbox
                                                                checked={selectedUserIds.includes(user.id)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    setSelectedUserIds(prev =>
                                                                        e.target.checked ? [...prev, user.id] : prev.filter(id => id !== user.id)
                                                                    );
                                                                }}
                                                            />
                                                        ) : (
                                                            <div style={{ width: '16px' }} /> // Placeholder for alignment
                                                        )}
                                                        <div className="d-flex flex-column overflow-hidden" style={{ lineHeight: '1.2' }}>
                                                            <span className="text-truncate fw-medium" style={{ fontSize: '0.85rem' }}>{user.name}</span>
                                                            {isAssigned && (
                                                                <small className="text-danger text-truncate fw-bold" style={{ fontSize: '9px' }}>
                                                                    {assignment.package?.name} Assigned
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-4 bg-light rounded" style={{ border: '1px dashed #d9d9d9' }}>
                                <Title level={5} type="secondary" className="mb-1">All Caught Up!</Title>
                                <Text type="secondary">All employees have already been assigned a salary package.</Text>
                            </div>
                        )}
                    </div>

                    {calculationPreview && (
                        <Card className="bg-light border-0 mt-3" style={{ borderRadius: '12px' }}>
                            <Title level={5}>Calculation Preview (Monthly)</Title>
                            <Divider style={{ margin: '12px 0' }} />
                            <div className="d-flex justify-content-between mb-2">
                                <Text>Base Salary:</Text>
                                <Text strong>Rs. {calculationPreview.base.toLocaleString()}</Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Allowances</Text>
                            {calculationPreview.allowanceItems.map((item, idx) => (
                                <div key={idx} className="d-flex justify-content-between mb-1">
                                    <Text size="small">{item.label}:</Text>
                                    <Text>+ Rs. {item.amount.toLocaleString()}</Text>
                                </div>
                            ))}
                            <Divider style={{ margin: '8px 0' }} />
                            <div className="d-flex justify-content-between mb-2">
                                <Text strong>Gross Income:</Text>
                                <Text strong>Rs. {calculationPreview.gross.toLocaleString()}</Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Deductions</Text>
                            {calculationPreview.taxes.map(tax => (
                                <div key={tax.id} className="d-flex justify-content-between mb-1">
                                    <Text>{tax.name}:</Text>
                                    <Text type="danger">- Rs. {tax.calculated_amount.toLocaleString()}</Text>
                                </div>
                            ))}
                            <Divider style={{ margin: '12px 0' }} />
                            <div className="d-flex justify-content-between align-items-center">
                                <Text strong>Estimated Net Pay:</Text>
                                <Title level={4} className="m-0 text-success">Rs. {Math.round(calculationPreview.net).toLocaleString()}</Title>
                            </div>
                        </Card>
                    )}

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            disabled={selectedUserIds.length === 0}
                        >
                            Bulk Assign Package {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
};

SalarySetup.layout = (page) => <MainLayout children={page} />;
export default SalarySetup;
