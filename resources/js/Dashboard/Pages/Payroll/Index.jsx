import { useState, useEffect } from 'react';
import { Breadcrumb } from 'antd';
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
const Index = ({ payRoles }) => {
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([
        {
            headerName: "Name",
            headerTooltip: "PayGrade Name",
            field: "name",
            cellEditor: "agLargeTextCellEditor",
            cellEditorPopup: true,
            pinned: "left",
        },
        {
            headerName: "Basic Salary",
            headerTooltip: "Basic Salary In Dollars",
            field: "basic_salary",
            cellEditor: "agLargeTextCellEditor",
            cellEditorPopup: true,
        },
        {
            headerName: "Applied Taxes",
            headerTooltip: "Applied Taxes On PayGrade",
            field: "taxes",
            valueGetter: params => {
                return (params.data.taxes || []).map(t => t.name).join(', ');
            },
            cellEditor: "agLargeTextCellEditor",
            cellEditorPopup: true,
        },
        {
            headerName: "Applied Allowances",
            headerTooltip: "Applied Allowances On PayGrade",
            field: "allowances",
            valueGetter: params => {
                return (params.data.allowances || []).map(t => t.name).join(', ');
            },
            cellEditor: "agLargeTextCellEditor",
            cellEditorPopup: true,
        },
        {
            headerName: "Notes",
            headerTooltip: "PayGrade Notes",
            field: "notes",
            cellEditor: "agLargeTextCellEditor",
            cellEditorPopup: true,
            pinned: 'right',
        },
        {
            headerName: "Action",
            filter: false,
            editable: false,
            sortable: false,
            pinned: "right",
            cellRenderer: (params) => (
                <>
                    <div class="btn-group btn-group-sm">
                        <a href="" className='btn btn-outline-info btn-sm'><EyeOutlined /></a>
                        <a href="" className='btn btn-outline-warning btn-sm'><EditOutlined /></a>
                        <a href="" className='btn btn-outline-danger btn-sm'><DeleteOutlined /></a>
                    </div>
                </>
            )
        },
    ]);

    useEffect(() => {
        setRowData(payRoles);
    }, [payRoles]);

    return (
        <>
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className='breadCrumb'
                        items={[{ title: 'Home' }, { title: 'Pay Roll' }]}
                    />
                    <a href="" className="btn btn-primary btn-sm">Add Pay Roll</a>
                </div>
                <div className='ag-grid-wrapper'>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={colDefs}
                        defaultColDef={defaultColDef}
                        theme={gridTheme} pagination={true} paginationAutoPageSize={true}
                    />
                </div>
            </div>
        </>
    )
}
export default Index;