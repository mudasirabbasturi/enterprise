import { Form, Select, InputNumber, Switch, notification } from "antd";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import { router } from "@shared/ui";

const LeavePolicyForm = forwardRef(({ initialValues, mode, onClose, leaveTypes, branches, departments, designations, notificationApi }, ref) => {
    const [form] = Form.useForm();

    useImperativeHandle(ref, () => ({
        submitForm: () => {
            form.submit();
        },
    }));

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                ...initialValues,
                leave_type_id: initialValues.leave_type_id,
                branch_id: initialValues.branch_id,
                department_id: initialValues.department_id,
                designation_id: initialValues.designation_id,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                requires_approval: true,
                allow_half_day: true,
            });
        }
    }, [initialValues, form]);

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
                        message: mode === 'edit' ? "Leave policy updated successfully" : "Leave policy created successfully"
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
            router.put(route("leave-policies.update", initialValues.id), values, handleResponse);
        } else {
            router.post(route("leave-policies.store"), values, handleResponse);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
                requires_approval: true,
                allow_half_day: true,
            }}
        >
            <div className="row">
                <div className="col-md-12">
                    <Form.Item
                        name="leave_type_id"
                        label="Leave Type"
                        rules={[{ required: true, message: "Please select leave type" }]}
                    >
                        <Select
                            placeholder="Select Leave Type"
                            options={leaveTypes.map(t => ({ label: t.name, value: t.id }))}
                        />
                    </Form.Item>
                </div>
            </div>

            <div className="row">
                <div className="col-md-4">
                    <Form.Item name="branch_id" label="Branch (Optional)">
                        <Select
                            allowClear
                            placeholder="All Branches"
                            options={branches.map(b => ({ label: b.name, value: b.id }))}
                        />
                    </Form.Item>
                </div>
                <div className="col-md-4">
                    <Form.Item name="department_id" label="Department (Optional)">
                        <Select
                            allowClear
                            placeholder="All Departments"
                            options={departments.map(d => ({ label: d.name, value: d.id }))}
                        />
                    </Form.Item>
                </div>
                <div className="col-md-4">
                    <Form.Item name="designation_id" label="Designation (Optional)">
                        <Select
                            allowClear
                            placeholder="All Designations"
                            options={designations.map(d => ({ label: d.name, value: d.id }))}
                        />
                    </Form.Item>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <Form.Item
                        name="days_per_year"
                        label="Days per Year"
                        rules={[{ required: true, message: "Please enter days" }]}
                    >
                        <InputNumber className="w-100" min={0} />
                    </Form.Item>
                </div>
                <div className="col-md-6">
                    <Form.Item name="max_per_month" label="Max per Month (Optional)">
                        <InputNumber className="w-100" min={0} />
                    </Form.Item>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <Form.Item name="requires_approval" label="Requires Approval" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </div>
                <div className="col-md-6">
                    <Form.Item name="allow_half_day" label="Allow Half Day" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </div>
            </div>
        </Form>
    );
});

export default LeavePolicyForm;
