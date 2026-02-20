import { useState, useMemo } from 'react';
import { Head, Link, Breadcrumb, DeleteOutlined, EditOutlined, PlusOutlined, router, notification } from "@shared/ui";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import { Modal, Form, Input, InputNumber, Select, Button, DatePicker } from 'antd';
import MainLayout from "@layout";
import dayjs from 'dayjs';

const PenaltyManagement = ({ penalties, users }) => {
    const [api, contextHolder] = notification.useNotification();
    const [selectedRows, setSelectedRows] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPenalty, setEditingPenalty] = useState(null);
    const [loading, setLoading] = useState(false);
    const [penaltyType, setPenaltyType] = useState(null);
    const [form] = Form.useForm();

    const columnDefs = useMemo(() => [
        {
            headerName: "Employee",
            field: "user.name",
            flex: 1.5,
            checkboxSelection: true,
            headerCheckboxSelection: true,
            cellRenderer: params => (
                <div className="fw-bold text-primary">{params.value}</div>
            )
        },
        {
            headerName: "Type",
            field: "type",
            flex: 1,
            cellRenderer: params => <div className="text-capitalize">{params.value}</div>
        },
        {
            headerName: "Amount",
            field: "amount",
            flex: 1,
            valueFormatter: params => `PKR ${params.value.toLocaleString()}`,
            cellClass: 'text-danger fw-bold'
        },
        { headerName: "Date", field: "date", flex: 1 },
        { headerName: "Reason", field: "reason", flex: 2 },
        { headerName: "Recorded By", field: "recorder.name", flex: 1 },
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

    const penaltyTypes = [
        'Late Arrival', 'Early Departure', 'Misconduct', 'Policy Violation'
    ];

    const handleEdit = (penalty) => {
        setEditingPenalty(penalty);
        const isStandard = penaltyTypes.includes(penalty.type);
        setPenaltyType(isStandard ? penalty.type : 'Other');

        form.setFieldsValue({
            ...penalty,
            type: isStandard ? penalty.type : 'Other',
            custom_type: isStandard ? null : penalty.type,
            date: dayjs(penalty.date)
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Delete this penalty record?')) {
            setLoading(true);
            router.delete(route('penalty-management.destroy', id), {
                onSuccess: () => api.success({ message: 'Success', description: 'Penalty removed' }),
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
        if (confirm(`Delete ${selectedRows.length} selected penalties?`)) {
            setLoading(true);
            router.delete(route('penalty-management.bulk-destroy'), {
                data: { ids: selectedRows.map(r => r.id) },
                onSuccess: () => {
                    api.success({ message: 'Success', description: 'Selected penalties removed' });
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
        // If 'Other' is selected, we use the custom_type value as the actual type
        const finalType = values.type === 'Other' ? values.custom_type : values.type;

        const payload = {
            ...values,
            type: finalType,
            date: values.date.format('YYYY-MM-DD')
        };

        // Remove custom_type from payload before sending to backend as it only expects 'type'
        delete payload.custom_type;

        if (editingPenalty) {
            router.put(route('penalty-management.update', editingPenalty.id), payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({ message: 'Success', description: 'Penalty updated' });
                },
                onError: (errors) => {
                    Object.values(errors).forEach(err => {
                        api.error({ message: 'Error', description: err });
                    });
                },
                onFinish: () => setLoading(false)
            });
        } else {
            router.post(route('penalty-management.store'), payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    api.success({ message: 'Success', description: 'Penalty recorded' });
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
            <Head title="Penalty Management" />
            {contextHolder}
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className='breadCrumb'
                        items={[{ title: <Link href="/">Home</Link> }, { title: 'Payroll' }, { title: 'Penalty Management' }]}
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
                            danger
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingPenalty(null);
                                setPenaltyType(null);
                                form.resetFields();
                                setIsModalOpen(true);
                            }}
                        >
                            Record Penalty
                        </Button>
                    </div>
                </div>

                <div className="card mt-4 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="ag-grid-wrapper">
                            <AgGridReact
                                rowData={penalties}
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
                title={editingPenalty ? "Edit Penalty" : "Record New Penalty"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="user_id" label="Employee" rules={[{ required: true }]}>
                        <Select
                            showSearch
                            optionFilterProp="children"
                            placeholder="Select employee"
                        >
                            {users.map(u => <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>)}
                        </Select>
                    </Form.Item>

                    <Form.Item name="type" label="Penalty Type" rules={[{ required: true }]}>
                        <Select placeholder="Pick a type" onChange={setPenaltyType}>
                            {penaltyTypes.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
                            <Select.Option value="Other">Other (Custom Name)</Select.Option>
                        </Select>
                    </Form.Item>

                    {penaltyType === 'Other' && (
                        <Form.Item
                            name="custom_type"
                            label="Custom Penalty Name"
                            rules={[{ required: true, message: 'Please specify the penalty type' }]}
                        >
                            <Input placeholder="e.g. Broken Equipment, Noise, etc." />
                        </Form.Item>
                    )}

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item name="amount" label="Amount (PKR)" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item name="reason" label="Reason / Remarks" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} placeholder="Describe the violation..." />
                    </Form.Item>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" danger htmlType="submit" loading={loading}>
                            {editingPenalty ? "Update Penalty" : "Record Penalty"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
};

PenaltyManagement.layout = (page) => <MainLayout children={page} />;
export default PenaltyManagement;
