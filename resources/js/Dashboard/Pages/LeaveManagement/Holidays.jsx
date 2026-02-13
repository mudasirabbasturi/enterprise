import { useState, useMemo, useRef } from "react";
import {
    AgGridReact,
    gridTheme,
    defaultColDef,
} from "@agConfig/AgGridConfig";
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
    Tag,
    dayjs
} from "@shared/ui";
import MainLayout from "@layout";
import HolidayForm from "@/Dashboard/Components/LeaveManagement/HolidayForm";

const Holidays = ({ holidays, branches }) => {
    const [api, contextHolder] = notification.useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const formRef = useRef();

    const [selectedRows, setSelectedRows] = useState([]);

    const onSelectionChanged = (params) => {
        setSelectedRows(params.api.getSelectedRows());
    };

    const handleBulkDelete = () => {
        const ids = selectedRows.map(row => row.id);
        router.delete(route('holidays.bulk-destroy'), {
            data: { ids },
            onSuccess: () => {
                api.success({ message: "Selected holidays deleted successfully" });
                setSelectedRows([]);
            },
            onError: (errors) => {
                if (errors.error) {
                    api.error({ message: errors.error });
                }
            }
        });
    };

    const columnDefs = useMemo(() => [
        {
            headerCheckboxSelection: true,
            checkboxSelection: true,
            width: 50,
            pinned: "left",
            lockPosition: true,
            filter: false,
        },
        {
            headerName: "Title",
            field: "title",
            flex: 2,
            cellClass: "fw-bold"
        },
        {
            headerName: "Date",
            field: "date",
            flex: 1,
            valueFormatter: (params) => dayjs(params.value).format('DD MMM YYYY'),
            cellClass: "font-monospace"
        },
        {
            headerName: "Day",
            flex: 1,
            valueGetter: (params) => dayjs(params.data.date).format('dddd'),
            cellClass: "text-muted"
        },
        {
            headerName: "Branch",
            field: "branch.name",
            flex: 1,
            valueFormatter: (params) => params.value || "All Branches"
        },
        {
            headerName: "Actions",
            width: 120,
            pinned: "right",
            cellRenderer: (params) => (
                <div className="d-flex gap-2 align-items-center h-100">
                    <Tooltip title="Edit">
                        <button
                            className="btn btn-outline-warning btn-sm rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => {
                                setEditingHoliday(params.data);
                                setIsModalOpen(true);
                            }}
                        >
                            <EditOutlined />
                        </button>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm
                            title="Delete this holiday?"
                            onConfirm={() => handleDelete(params.data.id)}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{ danger: true }}
                        >
                            <button
                                className="btn btn-outline-danger btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '28px', height: '28px' }}
                            >
                                <DeleteOutlined />
                            </button>
                        </Popconfirm>
                    </Tooltip>
                </div>
            )
        }
    ], []);

    const handleDelete = (id) => {
        router.delete(route('holidays.destroy', id), {
            onSuccess: () => {
                api.success({ message: "Holiday deleted successfully" });
            },
            onError: (errors) => {
                if (errors.error) {
                    api.error({ message: errors.error });
                }
            }
        });
    };

    return (
        <>
            {contextHolder}
            <Head title="Holidays" />
            <div className="container-fluid p-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Breadcrumb
                        items={[
                            { title: <Link href="/">Home</Link> },
                            { title: "Leave Management" },
                            { title: "Holidays" }
                        ]}
                    />
                    <div className="d-flex gap-2">
                        {selectedRows.length > 0 && (
                            <Popconfirm
                                title={`Delete ${selectedRows.length} selected holidays?`}
                                description="This action cannot be undone."
                                onConfirm={handleBulkDelete}
                                okText="Yes"
                                cancelText="No"
                                okButtonProps={{ danger: true }}
                            >
                                <button className="btn btn-danger btn-sm d-flex align-items-center">
                                    <DeleteOutlined className="me-1" /> Delete Selected ({selectedRows.length})
                                </button>
                            </Popconfirm>
                        )}
                        <button
                            className="btn btn-primary btn-sm d-flex align-items-center"
                            onClick={() => {
                                setEditingHoliday(null);
                                setIsModalOpen(true);
                            }}
                        >
                            Add Holiday
                        </button>
                    </div>
                </div>

                <div className="ag-grid-wrapper" style={{ height: '70vh' }}>
                    <AgGridReact
                        rowData={holidays}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        theme={gridTheme}
                        pagination={true}
                        rowSelection="multiple"
                        onSelectionChanged={onSelectionChanged}
                    />
                </div>
            </div>

            <Modal
                title={editingHoliday ? "Edit Holiday" : "Add Holiday"}
                open={isModalOpen}
                onOk={() => formRef.current?.submitForm()}
                onCancel={() => setIsModalOpen(false)}
                width={600}
                centered
            >
                <div className="mt-3">
                    <HolidayForm
                        ref={formRef}
                        initialValues={editingHoliday}
                        mode={editingHoliday ? "edit" : "add"}
                        onClose={() => setIsModalOpen(false)}
                        branches={branches}
                        notificationApi={api}
                    />
                </div>
            </Modal>
        </>
    );
};

Holidays.layout = (page) => <MainLayout children={page} />;

export default Holidays;
