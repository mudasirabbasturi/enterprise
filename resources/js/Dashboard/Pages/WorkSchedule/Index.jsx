import { Head, Link } from "@shared/ui";
import MainLayout from "@layout";
import {
    FieldTimeOutlined,
    CheckCircleOutlined,
    SafetyOutlined,
    CalendarOutlined,
    RightOutlined
} from "@ant-design/icons";
import { Card, Breadcrumb } from "antd";

const WorkScheduleIndex = () => {
    const menuItems = [
        {
            title: "Shifts Management",
            description: "Define and manage company work shifts (Morning, Night, etc.)",
            icon: <FieldTimeOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
            link: route('shifts.index'),
            bgColor: '#e6f7ff'
        },
        {
            title: "Users Schedules",
            description: "Assign shifts and specific working hours to team members",
            icon: <CalendarOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
            link: route('users-schedules.index'),
            bgColor: '#f6ffed'
        },
        {
            title: "Allowed IPs",
            description: "Restrict attendance marking to specific office or home IP addresses",
            icon: <SafetyOutlined style={{ fontSize: '32px', color: '#722ed1' }} />,
            link: route('allowed-ips.index'),
            bgColor: '#f9f0ff'
        },
        {
            title: "Users Attendance",
            description: "Monitor and manage employee daily check-ins and check-outs",
            icon: <CheckCircleOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />,
            link: route('users-attendance.index'),
            bgColor: '#fff7e6'
        }
    ];

    return (
        <>
            <Head title="Work Schedule Management" />
            <div className="container-fluid p-4">
                <div className="mb-4">
                    <Breadcrumb
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Work Schedule Management" }
                        ]}
                    />
                    <h2 className="mt-3 fw-bold text-dark">Work Schedule Management</h2>
                    <p className="text-muted">Configure shifts, rosters, and monitor real-time attendance across your organization.</p>
                </div>

                <div className="row g-4">
                    {menuItems.map((item, index) => (
                        <div className="col-md-6 col-lg-3" key={index}>
                            <Link href={item.link}>
                                <Card
                                    hoverable
                                    className="h-100 border-0 shadow-sm transition-all"
                                    style={{ borderRadius: '16px' }}
                                    bodyStyle={{ padding: '24px' }}
                                >
                                    <div
                                        className="mb-4 d-flex align-items-center justify-content-center"
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            backgroundColor: item.bgColor,
                                            borderRadius: '12px'
                                        }}
                                    >
                                        {item.icon}
                                    </div>
                                    <h4 className="fw-bold mb-2">{item.title}</h4>
                                    <p className="text-muted mb-4" style={{ fontSize: '14px', minHeight: '42px' }}>
                                        {item.description}
                                    </p>
                                    <div className="d-flex align-items-center text-primary fw-medium">
                                        Open Management <RightOutlined className="ms-2" style={{ fontSize: '12px' }} />
                                    </div>
                                </Card>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Optional: Add a summary widget or shortcuts here later */}
                <div className="mt-5 pt-4 border-top">
                    <div className="row">
                        <div className="col-lg-8">
                            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-primary-soft p-3 rounded-circle">
                                        <FieldTimeOutlined className="text-primary fs-3" />
                                    </div>
                                    <div>
                                        <h5 className="mb-1">Quick Tip</h5>
                                        <p className="text-muted mb-0">You can add new shifts directly while creating a user schedule using the plus button.</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .transition-all {
                    transition: all 0.3s ease;
                }
                .transition-all:hover {
                    transform: translateY(-5px);
                }
                .bg-primary-soft {
                    background-color: #e6f7ff;
                }
            `}</style>
        </>
    );
};

WorkScheduleIndex.layout = (page) => <MainLayout children={page} />;

export default WorkScheduleIndex;
