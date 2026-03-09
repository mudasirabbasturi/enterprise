import { useMemo } from "react";
import {
    AgGridReact,
    gridTheme,
    defaultColDef,
} from "@agConfig/AgGridConfig";
import {
    Link,
    Head,
    Breadcrumb,
    Tag,
    dayjs,
    Card,
    CalendarOutlined,
    ClockCircleOutlined,
    Alert,
    Empty,
    Typography
} from "@shared/ui";
import MainLayout from "@layout";

const { Text } = Typography;

const MySchedule = ({ schedules, user }) => {

    const columnDefs = useMemo(() => [
        {
            headerName: "Day",
            field: "day",
            minWidth: 150,
            cellClass: "fw-bold",
            render: (params) => <Text strong>{params.value}</Text>
        },
        {
            headerName: "Shift",
            field: "shift.name",
            minWidth: 150,
            cellRenderer: (params) => <Tag color="blue">{params.value}</Tag>
        },
        {
            headerName: "Time Schedule",
            minWidth: 250,
            cellRenderer: (params) => {
                const shift = params.data.shift;
                return (
                    <div className="d-flex align-items-center">
                        <ClockCircleOutlined className="me-2 text-primary" />
                        <span>
                            {shift.start_time} - {shift.end_time}
                            {shift.duration && (
                                <Tag className="ms-2" color="orange">
                                    {Math.floor(shift.duration / 60)}h {shift.duration % 60}m
                                </Tag>
                            )}
                        </span>
                    </div>
                );
            }
        },
        {
            headerName: "Break Allowed Time",
            field: "shift.total_break_minutes",
            minWidth: 150,
            cellRenderer: (params) => {
                const mins = parseInt(params.value || 0);
                return <Tag color="default">{formatMinsToHrs(mins)}</Tag>;
            }
        },
        {
            headerName: "Notes",
            field: "notes",
            minWidth: 200,
            flex: 1,
            cellRenderer: (params) => params.value ? <span>{params.value}</span> : <Text type="secondary" italic>No notes</Text>
        }
    ], []);

    const formatMinsToHrs = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    return (
        <>
            <Head title="My Work Schedule" />
            <div className="container-fluid p-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Breadcrumb
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Personal" },
                            { title: "My Schedule" }
                        ]}
                    />
                </div>

                {(!schedules || schedules.length === 0) ? (
                    <Card className="border-0 shadow-sm text-center py-5">
                        <Empty
                            description={
                                <span>
                                    No work schedule assigned to you yet.<br />
                                    <Text type="secondary">Please contact your administrator to assign your shifts.</Text>
                                </span>
                            }
                        >
                            <Alert
                                message="Action Required"
                                description="You must have an assigned shift to mark attendance correctly."
                                type="info"
                                showIcon
                                className="mt-4 text-start"
                            />
                        </Empty>
                    </Card>
                ) : (
                    <Card className="border-0 shadow-sm rounded-lg" bodyStyle={{ padding: '0', overflow: 'hidden' }}>
                        <div className="ag-grid-wrapper" style={{ height: '70vh' }}>
                            <AgGridReact
                                rowData={schedules}
                                columnDefs={columnDefs}
                                defaultColDef={{
                                    ...defaultColDef,
                                    suppressMovable: true,
                                    cellClass: 'text-nowrap',
                                    wrapHeaderText: true,
                                    autoHeaderHeight: true,
                                }}
                                autoSizeStrategy={{
                                    type: "fitCellContents",
                                    skipHeader: false,
                                }}
                                theme={gridTheme}
                                pagination={false}
                            />
                        </div>
                    </Card>
                )}
            </div>
        </>
    );
};

export default MySchedule;
