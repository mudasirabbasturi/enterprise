import { Form, Select, InputNumber, Modal, Button } from "antd";
import { useEffect, forwardRef, useImperativeHandle, useState, useRef } from "react";
import { router, PlusCircleOutlined } from "@shared/ui";
import LeaveTypeForm from "./LeaveTypeForm";

const LeaveBalanceForm = forwardRef(({ initialValues, mode, onClose, users, leaveTypes, notificationApi }, ref) => {
    const [form] = Form.useForm();
    const [isLeaveTypeModalOpen, setIsLeaveTypeModalOpen] = useState(false);
    const leaveTypeFormRef = useRef();

    useImperativeHandle(ref, () => ({
        submitForm: () => {
            form.submit();
        },
    }));

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        } else {
            form.resetFields();
            form.setFieldsValue({
                year: new Date().getFullYear(),
                allocated: 0,
                used: 0,
                pending: 0,
                remaining: 0
            });
        }
    }, [initialValues, form]);

    const calculateRemaining = () => {
        const allocated = form.getFieldValue('allocated') || 0;
        const used = form.getFieldValue('used') || 0;
        const pending = form.getFieldValue('pending') || 0;
        form.setFieldsValue({ remaining: allocated - used - pending });
    };

    const onFinish = (values) => {
        const handleResponse = {
            onSuccess: (page) => {
                const errors = page.props?.errors || {};
                if (Object.keys(errors).length > 0) {
                    Object.values(errors).forEach(err => {
                        notificationApi?.error({ message: err });
                    });
                } else {
                    notificationApi?.success({
                        message: mode === 'edit' ? "Leave balance updated successfully" : "Leave balance record created successfully"
                    });
                    onClose();
                    if (mode === "add") form.resetFields();
                }
            },
            onError: (errors) => {
                Object.values(errors).forEach(err => {
                    notificationApi?.error({ message: err });
                });
            }
        };

        if (mode === "edit") {
            router.put(route("leave-balances.update", initialValues.id), values, handleResponse);
        } else {
            router.post(route("leave-balances.store"), values, handleResponse);
        }
    };

    return (
        <>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={calculateRemaining}
            >
                {mode === "add" && (
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item
                                name="user_id"
                                label="User"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    showSearch
                                    options={users.map(u => ({ label: u.name, value: u.id }))}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item
                                label="Leave Type"
                                required
                            >
                                <div className="d-flex gap-2">
                                    <Form.Item
                                        name="leave_type_id"
                                        rules={[{ required: true, message: "Please select leave type" }]}
                                        noStyle
                                    >
                                        <Select
                                            className="flex-grow-1"
                                            options={leaveTypes.map(t => ({ label: t.name, value: t.id }))}
                                            placeholder="Select Leave Type"
                                        />
                                    </Form.Item>
                                    <Button
                                        icon={<PlusCircleOutlined />}
                                        onClick={() => setIsLeaveTypeModalOpen(true)}
                                    />
                                </div>
                            </Form.Item>
                        </div>
                    </div>
                )}

                <div className="row">
                    <div className="col-md-4">
                        <Form.Item name="year" label="Year" rules={[{ required: true }]}>
                            <InputNumber className="w-100" />
                        </Form.Item>
                    </div>
                    <div className="col-md-4">
                        <Form.Item name="allocated" label="Allocated" rules={[{ required: true }]}>
                            <InputNumber className="w-100" min={0} />
                        </Form.Item>
                    </div>
                    <div className="col-md-4">
                        <Form.Item name="used" label="Used">
                            <InputNumber className="w-100" min={0} disabled />
                        </Form.Item>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6">
                        <Form.Item name="pending" label="Pending">
                            <InputNumber className="w-100" min={0} disabled />
                        </Form.Item>
                    </div>
                    <div className="col-md-6">
                        <Form.Item name="remaining" label="Remaining Balance">
                            <InputNumber className="w-100" disabled />
                        </Form.Item>
                    </div>
                </div>
            </Form>

            <Modal
                title="Add New Leave Type"
                open={isLeaveTypeModalOpen}
                onOk={() => leaveTypeFormRef.current?.submitForm()}
                onCancel={() => setIsLeaveTypeModalOpen(false)}
                width={600}
                centered
                destroyOnClose
            >
                <div className="mt-3">
                    <LeaveTypeForm
                        ref={leaveTypeFormRef}
                        mode="add"
                        onClose={() => setIsLeaveTypeModalOpen(false)}
                        notificationApi={notificationApi}
                        submitOptions={{
                            preserveState: true,
                            preserveScroll: true
                        }}
                    />
                </div>
            </Modal>
        </>
    );
});

export default LeaveBalanceForm;
