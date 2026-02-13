import { Form, Select, DatePicker, Input, Switch } from "antd";
import { useEffect, forwardRef, useImperativeHandle, useState, useRef } from "react";
import { router, dayjs, Modal, Tooltip, PlusOutlined } from "@shared/ui";
import LeaveTypeForm from "./LeaveTypeForm";

const LeaveRequestForm = forwardRef(({ initialValues, mode, onClose, leaveTypes, users, notificationApi, isPersonal = false }, ref) => {
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
            form.setFieldsValue({
                ...initialValues,
                start_date: dayjs(initialValues.start_date),
                end_date: dayjs(initialValues.end_date),
            });
        } else {
            form.resetFields();
            const defaultValues = {
                is_half_day: false,
                total_days: 1,
            };
            if (isPersonal && users?.length > 0) {
                defaultValues.user_id = users[0].id;
            }
            form.setFieldsValue(defaultValues);
        }
    }, [initialValues, form, isPersonal, users]);

    // ... calculateDays ...
    const calculateDays = () => {
        const start = form.getFieldValue('start_date');
        const end = form.getFieldValue('end_date');
        const isHalf = form.getFieldValue('is_half_day');

        if (isHalf) {
            form.setFieldsValue({ total_days: 0.5 });
            return;
        }

        if (start && end) {
            const days = end.diff(start, 'day') + 1;
            if (days > 0) {
                form.setFieldsValue({ total_days: days });
            }
        }
    };

    const onFinish = (values) => {
        // ... (Existing onFinish logic) ...
        const submissionData = {
            ...values,
            start_date: values.start_date.format('YYYY-MM-DD'),
            end_date: values.end_date.format('YYYY-MM-DD'),
        };

        const handleResponse = {
            onSuccess: (page) => {
                if (page.props.errors && Object.keys(page.props.errors).length > 0) {
                    Object.values(page.props.errors).forEach(err => {
                        notificationApi?.error({ message: err });
                    });
                } else {
                    notificationApi?.success({
                        message: mode === 'edit' ? "Leave request updated successfully" : "Leave request submitted successfully"
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
            router.put(route("leave-requests.update", initialValues.id), submissionData, handleResponse);
        } else {
            router.post(route("leave-requests.store"), submissionData, handleResponse);
        }
    };

    return (
        <>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={calculateDays}
            >
                <div className="row">
                    {!isPersonal ? (
                        <div className="col-md-6">
                            <Form.Item
                                name="user_id"
                                label="User"
                                rules={[{ required: true, message: "Please select user" }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Search User"
                                    options={users.map(u => ({ label: u.name, value: u.id }))}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>
                        </div>
                    ) : (
                        <Form.Item name="user_id" hidden />
                    )}
                    <div className="col-md-6 d-flex justify-content-between align-items-center">
                        <Form.Item
                            name="leave_type_id"
                            label="Leave Type"
                            className="w-100"
                            rules={[{ required: true, message: "Please select leave type" }]}
                        >
                            <Select
                                placeholder="Select Leave Type"
                                options={leaveTypes.map(t => ({ label: t.name, value: t.id }))}
                            />
                        </Form.Item>
                        {!isPersonal && (
                            // Only show "Add Leave Type" button for admins (not personal requests)
                            <Tooltip title="Add New Leave Type">
                                <PlusOutlined
                                    className="text-primary cursor-pointer ms-1 mt-1 p-1 border border-info rounded"
                                    onClick={() => setIsLeaveTypeModalOpen(true)}
                                />
                            </Tooltip>
                        )}
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-4">
                        <Form.Item
                            name="start_date"
                            label="Start Date"
                            rules={[{ required: true, message: "Select start date" }]}
                        >
                            <DatePicker className="w-100" />
                        </Form.Item>
                    </div>
                    <div className="col-md-4">
                        <Form.Item
                            name="end_date"
                            label="End Date"
                            rules={[{ required: true, message: "Select end date" }]}
                        >
                            <DatePicker className="w-100" />
                        </Form.Item>
                    </div>
                    <div className="col-md-4">
                        <Form.Item
                            name="total_days"
                            label="Total Days"
                        >
                            <Input disabled className="fw-bold text-primary" />
                        </Form.Item>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6">
                        <Form.Item name="is_half_day" label="Half Day?" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </div>
                    {form.getFieldValue('is_half_day') && (
                        <div className="col-md-6">
                            <Form.Item name="half_day_type" label="Half Day Type">
                                <Select
                                    options={[
                                        { label: 'First Half', value: 'first_half' },
                                        { label: 'Second Half', value: 'second_half' },
                                    ]}
                                />
                            </Form.Item>
                        </div>
                    )}
                </div>

                <Form.Item
                    name="reason"
                    label="Reason"
                    rules={[{ required: true, message: "Please enter reason" }]}
                >
                    <Input.TextArea rows={4} placeholder="Reason for leave..." />
                </Form.Item>
            </Form>

            {/* Nested Modal for Adding New Leave Type */}
            <Modal
                title="Quick Add Leave Type"
                open={isLeaveTypeModalOpen}
                onOk={() => leaveTypeFormRef.current?.submitForm()}
                onCancel={() => setIsLeaveTypeModalOpen(false)}
                centered
                zIndex={1051} // Ensure it appears above the parent modal
                width={600}
            >
                <div className="mt-3">
                    <LeaveTypeForm
                        ref={leaveTypeFormRef}
                        initialValues={null}
                        mode="add"
                        onClose={() => setIsLeaveTypeModalOpen(false)}
                    />
                </div>
            </Modal>
        </>
    );
});

export default LeaveRequestForm;

