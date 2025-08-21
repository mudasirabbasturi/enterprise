import { useState, useEffect } from 'react';
import { Breadcrumb } from 'antd';
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
const Index = ({ payTaxes }) => {
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
            headerName: "Amount",
            headerTooltip: "Amount of percent or value",
            field: "amount",
            cellEditor: "agLargeTextCellEditor",
            cellEditorPopup: true,
        },
        {
            headerName: "% || Value",
            headerTooltip: "Status Of Amount % or fixed",
            field: "status",
            cellEditor: "agLargeTextCellEditor",
            cellEditorPopup: true,
        },
        {
            headerName: "Notes",
            headerTooltip: "Notes of Pay Tax",
            field: "notes",
            cellEditor: "agLargeTextCellEditor",
            cellEditorPopup: true,
            pinned: 'right'
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
        setRowData(payTaxes);
    }, [payTaxes]);

    return (
        <>
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className='breadCrumb'
                        items={[{ title: 'Home' }, { title: 'PayRoll' }, { title: 'Pay Tax' }]}
                    />
                    <a href="" className="btn btn-primary btn-sm">Add Pay Tax</a>
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