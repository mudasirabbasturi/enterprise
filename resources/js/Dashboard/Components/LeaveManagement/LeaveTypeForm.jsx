import { Form, Input, Switch, InputNumber } from "antd";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import { router } from "@shared/ui";

const LeaveTypeForm = forwardRef(({ initialValues, mode, onClose, notificationApi, submitOptions = {} }, ref) => {
    const [form] = Form.useForm();

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
                requires_approval: true,
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
                        message: mode === 'edit' ? "Leave type updated successfully" : "Leave type created successfully"
                    });
                    onClose();
                    if (mode === "add") form.resetFields();
                }
            },
            onError: (errors) => {
                Object.values(errors).forEach(err => {
                    notificationApi?.error({ message: err });
                });
            },
            ...submitOptions
        };

        if (mode === "edit") {
            router.put(route("leave-types.update", initialValues.id), values, handleResponse);
        } else {
            router.post(route("leave-types.store"), values, handleResponse);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
                requires_approval: true,
            }}
        >
            <div className="row">
                <div className="col-md-12">
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: "Please enter leave type name" }]}
                    >
                        <Input placeholder="e.g. Annual Leave" />
                    </Form.Item>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <Form.Item name="color" label="Color">
                        <Input type="color" className="w-100" />
                    </Form.Item>
                </div>
                <div className="col-md-6">
                    <Form.Item name="max_per_year" label="Max Days per Year">
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
            </div>
        </Form>
    );
});

export default LeaveTypeForm;
