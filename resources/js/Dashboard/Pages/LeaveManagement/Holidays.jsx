import { useState, useRef } from "react";
import {
    Link,
    Head,
    Breadcrumb,
    router,
    notification,
    Modal,
    Tooltip,
    Popconfirm,
    EditOutlined,
    DeleteOutlined,
    dayjs,
    Calendar,
    Badge
} from "@shared/ui";
import MainLayout from "@layout";
import HolidayForm from "@/Dashboard/Components/LeaveManagement/HolidayForm";

const Holidays = ({ holidays }) => {
    const [api, contextHolder] = notification.useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const formRef = useRef();

    const handleDelete = (id) => {
        router.delete(route('holidays.destroy', id), {
            onSuccess: () => {
                api.success({ message: "Holiday deleted successfully" });
                setIsModalOpen(false);
            },
            onError: (errors) => {
                if (errors.error) {
                    api.error({ message: errors.error });
                }
            }
        });
    };

    const dateCellRender = (value) => {
        const dateStr = value.format('YYYY-MM-DD');
        const dayHolidays = holidays.filter(h => dayjs(h.date).format('YYYY-MM-DD') === dateStr);

        return (
            <ul className="list-unstyled m-0 p-0">
                {dayHolidays.map(item => (
                    <li key={item.id} onClick={(e) => {
                        e.stopPropagation();
                        setEditingHoliday(item);
                        setIsModalOpen(true);
                    }}>
                        <Badge status="warning" text={item.title} className="small-badge" />
                    </li>
                ))}
            </ul>
        );
    };

    const onSelectDay = (newValue) => {
        setSelectedDate(newValue);
        // Only open modal if it's not a change in month/year panel
        // But for simplicity, we can let user click any date
        setEditingHoliday(null);
        setIsModalOpen(true);
    };

    return (
        <>
            {contextHolder}
            <Head title="Holidays Calendar" />
            <div className="container-fluid p-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Breadcrumb
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Leave Management" },
                            { title: "Holidays" }
                        ]}
                    />
                    <button
                        className="btn btn-primary btn-sm d-flex align-items-center"
                        onClick={() => {
                            setEditingHoliday(null);
                            setSelectedDate(dayjs());
                            setIsModalOpen(true);
                        }}
                    >
                        Add Holiday
                    </button>
                </div>

                <div className="bg-white p-4 rounded shadow-sm border">
                    <Calendar
                        cellRender={dateCellRender}
                        onSelect={(date, { source }) => {
                            if (source === 'date') {
                                setEditingHoliday(null);
                                setSelectedDate(date);
                                setIsModalOpen(true);
                            }
                        }}
                    />
                </div>
            </div>

            <Modal
                title={editingHoliday ? "Edit Holiday" : "Add Holiday"}
                open={isModalOpen}
                onOk={() => formRef.current?.submitForm()}
                onCancel={() => setIsModalOpen(false)}
                width={500}
                centered
                footer={[
                    editingHoliday && (
                        <Popconfirm
                            key="delete"
                            title="Delete this holiday?"
                            onConfirm={() => handleDelete(editingHoliday.id)}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{ danger: true }}
                        >
                            <button className="btn btn-danger btn-sm float-start">Delete</button>
                        </Popconfirm>
                    ),
                    <button key="back" className="btn btn-light btn-sm me-2" onClick={() => setIsModalOpen(false)}>Cancel</button>,
                    <button key="submit" className="btn btn-primary btn-sm" onClick={() => formRef.current?.submitForm()}>
                        {editingHoliday ? "Update" : "Save"}
                    </button>
                ]}
            >
                <div className="mt-3">
                    <HolidayForm
                        ref={formRef}
                        initialValues={editingHoliday || { date: selectedDate }}
                        mode={editingHoliday ? "edit" : "add"}
                        onClose={() => setIsModalOpen(false)}
                        notificationApi={api}
                    />
                </div>
            </Modal>

            <style>{`
                .small-badge .ant-badge-status-text {
                    font-size: 11px;
                    font-weight: 600;
                    color: #d46b08;
                }
                .ant-picker-calendar-date-content {
                    height: 80px !important;
                    overflow-y: auto;
                }
                .ant-picker-calendar-date-content li {
                    background: #fffbe6;
                    border: 1px solid #ffe58f;
                    border-radius: 4px;
                    padding: 2px 4px;
                    margin-bottom: 2px;
                    cursor: pointer;
                }
                .ant-picker-calendar-date-content li:hover {
                    background: #fff1b8;
                }
            `}</style>
        </>
    );
};

Holidays.layout = (page) => <MainLayout children={page} />;

export default Holidays;
