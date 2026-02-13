import { Form, Input, DatePicker, Select, notification } from "antd";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import { router, dayjs } from "@shared/ui";

const HolidayForm = forwardRef(({ initialValues, mode, onClose, branches, notificationApi }, ref) => {
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
                date: dayjs(initialValues.date),
                branch_id: initialValues.branch_id,
            });
        } else {
            form.resetFields();
        }
    }, [initialValues, form]);

    const onFinish = (values) => {
        const submissionData = {
            ...values,
            date: values.date.format('YYYY-MM-DD'),
        };

        const handleResponse = {
            onSuccess: (page) => {
                const errors = page.props?.errors || {};
                if (Object.keys(errors).length > 0) {
                    Object.values(errors).forEach(err => {
                        notificationApi?.error({ message: err });
                    });
                } else {
                    notificationApi?.success({
                        message: mode === 'edit' ? "Holiday updated successfully" : "Holiday created successfully"
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
            router.put(route("holidays.update", initialValues.id), submissionData, handleResponse);
        } else {
            router.post(route("holidays.store"), submissionData, handleResponse);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
        >
            <div className="row">
                <div className="col-md-12">
                    <Form.Item
                        name="title"
                        label="Holiday Title"
                        rules={[{ required: true, message: "Please enter holiday title" }]}
                    >
                        <Input placeholder="e.g. Independence Day" />
                    </Form.Item>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <Form.Item
                        name="date"
                        label="Date"
                        rules={[{ required: true, message: "Please select date" }]}
                    >
                        <DatePicker className="w-100" />
                    </Form.Item>
                </div>
                <div className="col-md-6">
                    <Form.Item name="branch_id" label="Branch (Optional)">
                        <Select
                            allowClear
                            placeholder="All Branches"
                            options={branches.map(b => ({ label: b.name, value: b.id }))}
                        />
                    </Form.Item>
                </div>
            </div>
        </Form>
    );
});

export default HolidayForm;
