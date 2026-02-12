import { useState, useEffect, useMemo, useCallback } from "react";
import {
    AgGridReact,
    gridTheme,
    defaultColDef,
    sideBarConfig,
    gridOptionsConfig
} from "@agConfig/AgGridConfig";
import {
    Link,
    Head,
    Breadcrumb,
    DeleteOutlined,
    EyeOutlined,
    Tooltip,
    Popconfirm,
    SyncOutlined
} from "@shared/ui";
import MainLayout from "@layout";
import axios from "axios";
import { notification, Modal, Tag } from "antd";

const UserTracking = ({ trackingData }) => {
    const [api, contextHolder] = notification.useNotification();
    const [flatData, setFlatData] = useState(trackingData || []);
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal state for app details
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAppName, setModalAppName] = useState("");
    const [modalData, setModalData] = useState([]);

    // Duration formatting helper
    const formatDuration = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return [h, m, s].map(v => String(v).padStart(2, '0')).join(":");
    };

    // Data processing logic: Group by User -> Group by App
    const processData = useCallback((data) => {
        if (!data || !Array.isArray(data)) return [];

        const groupedByUser = data.reduce((acc, curr) => {
            const userName = curr.user_name || "Unknown User";
            if (!acc[userName]) {
                acc[userName] = {
                    user_name: userName,
                    total_screen_time_seconds: 0,
                    appGroups: {} // Grouping apps inside user
                };
            }

            const appName = curr.application || "Hidden/System";
            if (!acc[userName].appGroups[appName]) {
                acc[userName].appGroups[appName] = {
                    application: appName,
                    userName: userName, // Keep track of user for filtering
                    total_time_seconds: 0,
                    activities: []
                };
            }

            acc[userName].appGroups[appName].activities.push(curr);

            // Sum up duration
            if (curr.duration) {
                const parts = curr.duration.split(':').map(Number);
                if (parts.length === 3) {
                    const seconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
                    acc[userName].appGroups[appName].total_time_seconds += seconds;
                    acc[userName].total_screen_time_seconds += seconds;
                }
            }
            return acc;
        }, {});

        const processed = Object.values(groupedByUser).map(user => ({
            ...user,
            total_screen_time: formatDuration(user.total_screen_time_seconds),
            sleep_time: "07:30:15",
            applications: Object.values(user.appGroups).map(app => ({
                ...app,
                total_duration: formatDuration(app.total_time_seconds)
            }))
        }));

        return processed;
    }, []);

    // Sync modal data if it's open and data changes
    useEffect(() => {
        if (isModalOpen && modalAppName) {
            const updatedRows = processData(flatData);
            // Find the current app's data again to refresh the modal view
            for (const user of updatedRows) {
                const app = user.applications.find(a => a.application === modalAppName && user.user_name === modalData[0]?.user_name);
                if (app) {
                    setModalData(app.activities);
                    return;
                }
            }
            // If app no longer exists (all records deleted), close modal
            setIsModalOpen(false);
        }
    }, [flatData, isModalOpen, modalAppName, processData]);

    const openAppDetails = (appName, activities) => {
        setModalAppName(appName);
        setModalData(activities);
        setIsModalOpen(true);
    };

    // Master Column Definitions (Users)
    const masterColDefs = useMemo(() => [
        {
            headerName: "User Name",
            field: "user_name",
            cellRenderer: "agGroupCellRenderer",
            cellRendererParams: {
                innerRenderer: (params) => (
                    <div className="d-flex align-items-center h-100">
                        <div className="avatar-sm me-2 bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '28px', height: '28px', backgroundColor: '#e7f1ff', fontSize: '12px', fontWeight: 'bold' }}>
                            {params.value ? params.value.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="fw-bold text-dark">{params.value}</span>
                    </div>
                )
            },
            flex: 2
        },
        {
            headerName: "Total Screen Time",
            field: "total_screen_time",
            cellClass: "text-center font-monospace fw-medium text-primary",
            flex: 1
        },
        {
            headerName: "Sleep Time",
            field: "sleep_time",
            cellClass: "text-center font-monospace text-muted",
            flex: 1
        }
    ], []);

    // Detail Grid Column Definitions (Applications)
    const detailColDefs = useMemo(() => [
        {
            headerName: "Application Name",
            field: "application",
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div className="bg-light p-1 rounded d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                        <i className={`bi bi-${params.value.toLowerCase().includes('chrome') ? 'browser-chrome' : params.value.toLowerCase().includes('vscode') ? 'code-slash' : 'app'}`}></i>
                    </div>
                    <span className="fw-medium">{params.value}</span>
                </div>
            ),
            flex: 2
        },
        {
            headerName: "Total Used Time",
            field: "total_duration",
            cellClass: "text-center font-monospace fw-bold text-success",
            flex: 1
        },
        {
            headerName: "Action",
            width: 100,
            cellRenderer: (params) => (
                <div className="d-flex justify-content-center align-items-center h-100 gap-2">
                    <Tooltip title="View Full Activity Log">
                        <button
                            className="btn btn-outline-primary btn-sm rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => openAppDetails(params.data.application, params.data.activities)}
                        >
                            <EyeOutlined />
                        </button>
                    </Tooltip>
                </div>
            ),
            flex: 0.5
        }
    ], []);

    // Selection state for bulk delete
    const [selectedRows, setSelectedRows] = useState([]);

    // Modal Grid Column Definitions (Granular Activities)
    const modalColDefs = useMemo(() => [
        {
            headerName: "",
            field: "checkbox",
            width: 50,
            checkboxSelection: true,
            headerCheckboxSelection: true,
            flex: 0.2,
            filter: false,
            sortable: false,
            floatingFilter: false,
            resizable: false,

        },
        {
            headerName: "Activity / Window Title",
            field: "activity",
            tooltipField: "activity",
            flex: 3,
            filter: false,
            sortable: false,
            floatingFilter: false,
        },
        {
            headerName: "Start Time",
            field: "start_time",
            flex: 1.5,
            filter: false,
            sortable: false,
            floatingFilter: false,
        },
        {
            headerName: "End Time",
            field: "end_time",
            flex: 1.5,
            filter: false,
            sortable: false,
            floatingFilter: false,
        },
        {
            headerName: "Duration",
            field: "duration",
            cellClass: "text-center font-monospace",
            flex: 1,
            filter: false,
            sortable: false,
            floatingFilter: false,
        },
        {
            headerName: "Delete",
            width: 80,
            filter: false,
            sortable: false,
            floatingFilter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center h-100 justify-content-center">
                    <Popconfirm
                        title="Delete this record?"
                        onConfirm={() => handleDelete(params.data.id)}
                    >
                        <button className="btn btn-link text-danger p-0 border-0">
                            <DeleteOutlined />
                        </button>
                    </Popconfirm>
                </div>
            ),
        }
    ], []);

    // Master-Detail configurations
    const detailCellRendererParams = useMemo(() => ({
        detailGridOptions: {
            columnDefs: detailColDefs,
            defaultColDef: {
                ...defaultColDef,
                sortable: true,
                filter: true,
            },
            theme: gridTheme,
        },
        getDetailRowData: (params) => {
            params.successCallback(params.data.applications);
        },
    }), [detailColDefs]);

    const fetchTrackingData = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/track/data");
            setFlatData(response.data);
        } catch (error) {
            console.error("Error fetching tracking data:", error);
            api.error({
                message: "Error",
                description: "Failed to refresh tracking data",
                placement: "topRight"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (ids) => {
        const idList = Array.isArray(ids) ? ids : [ids];
        if (idList.length === 0) return;

        try {
            await axios.post("/api/track/data/bulk-delete", { ids: idList });
            setFlatData((prev) => prev.filter((item) => !idList.includes(item.id)));
            setSelectedRows([]); // Clear selection
            api.success({
                message: "Success",
                description: `${idList.length} record(s) deleted successfully`,
                placement: "topRight"
            });
        } catch (error) {
            console.error("Error deleting record:", error);
            // Fallback to single delete if bulk endpoint doesn't exist yet
            if (idList.length === 1) {
                try {
                    await axios.delete(`/api/track/data/${idList[0]}`);
                    setFlatData((prev) => prev.filter((item) => item.id !== idList[0]));
                    api.success({
                        message: "Success",
                        description: "Record deleted successfully",
                        placement: "topRight"
                    });
                } catch (err) {
                    api.error({ message: "Error", description: "Failed to delete" });
                }
            } else {
                api.error({ message: "Error", description: "Failed to perform bulk delete" });
            }
        }
    };

    const handleSelectionChanged = (event) => {
        setSelectedRows(event.api.getSelectedRows());
    };

    useEffect(() => {
        setRowData(processData(flatData));
    }, [flatData, processData]);

    useEffect(() => {
        if (trackingData) {
            setFlatData(trackingData);
        }
    }, [trackingData]);

    return (
        <>
            {contextHolder}
            <Head title="User Tracking" />
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className="breadCrumb"
                        items={[{ title: <Link href="/">Home</Link> }, { title: "User Tracking" }]}
                    />
                    <button
                        className="btn btn-primary btn-sm d-flex align-items-center"
                        onClick={fetchTrackingData}
                        disabled={loading}
                    >
                        {loading ? <SyncOutlined spin className="me-1" /> : <i className="bi bi-arrow-clockwise me-1"></i>}
                        Refresh Data
                    </button>
                </div>

                <div className="card mt-4 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="ag-grid-wrapper" >
                            <AgGridReact
                                rowData={rowData}
                                columnDefs={masterColDefs}
                                defaultColDef={{
                                    ...defaultColDef,
                                    flex: 1,
                                    minWidth: 100,
                                }}
                                theme={gridTheme}
                                pagination={true}
                                paginationPageSize={20}
                                sideBar={sideBarConfig}
                                masterDetail={true}
                                detailCellRendererParams={detailCellRendererParams}
                                detailRowHeight={350}
                                isRowMaster={() => true}
                                onGridReady={gridOptionsConfig.onGridReady}
                                onColumnMoved={gridOptionsConfig.onColumnMoved}
                                onColumnPinned={gridOptionsConfig.onColumnPinned}
                                onColumnVisible={gridOptionsConfig.onColumnVisible}
                                onColumnResized={gridOptionsConfig.onColumnResized}
                                onSortChanged={gridOptionsConfig.onSortChanged}
                                maintainColumnOrder={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Modal for Full App History */}
            <Modal
                title={
                    <div className="d-flex align-items-center justify-content-between pe-4">
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-primary fw-bold">Detailed Activity Log:</span>
                            <Tag color="blue" className="fs-6 px-2 m-0">{modalAppName}</Tag>
                        </div>
                        {selectedRows.length > 0 && (
                            <Popconfirm
                                title={`Delete ${selectedRows.length} selected records?`}
                                onConfirm={() => handleDelete(selectedRows.map(r => r.id))}
                                okText="Yes"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                            >
                                <button className="btn btn-danger btn-sm shadow-sm animate__animated animate__fadeIn">
                                    <DeleteOutlined className="me-1" />
                                    Bulk Delete ({selectedRows.length})
                                </button>
                            </Popconfirm>
                        )}
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={1200}
                centered
                className="activity-modal"
                styles={{ body: { padding: '10px' } }}
            >
                <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
                    <AgGridReact
                        rowData={modalData}
                        columnDefs={modalColDefs}
                        rowSelection="multiple"
                        onSelectionChanged={handleSelectionChanged}
                        defaultColDef={{
                            ...defaultColDef,
                            flex: 1,
                        }}
                        theme={gridTheme}
                        pagination={true}
                        paginationPageSize={15}
                    />
                </div>
            </Modal>
        </>
    );
};

UserTracking.layout = (page) => <MainLayout children={page} />;

export default UserTracking;
