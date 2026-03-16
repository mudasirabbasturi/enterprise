import { useState, useMemo, useRef } from 'react';
import { Head, Link, Breadcrumb, EyeOutlined, CheckCircleFilled, dayjs, HomeOutlined, WalletOutlined, PrinterOutlined, DollarOutlined, CalendarOutlined, router, notification } from "@shared/ui";
import { Card, Typography, Space, Button, Tag, Divider, Modal, Select } from 'antd';
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import MainLayout from "@layout";

const { Text, Title } = Typography;

const MyPayroll = ({ snapshots, selectedMonth, selectedYear }) => {
    const [selectedSnapshot, setSelectedSnapshot] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [month, setMonth] = useState(selectedMonth || dayjs().month() + 1);
    const [year, setYear] = useState(selectedYear || dayjs().year());
    const [api, contextHolder] = notification.useNotification();
    const gridRef = useRef();

    const monthNames = [
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const monthOptions = monthNames.slice(1).map((name, index) => ({ value: index + 1, label: name }));
    const yearOptions = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: y }));

    const handleFilter = (m, y) => {
        router.get(route('my-payroll.index'), { month: m, year: y }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const columnDefs = useMemo(() => [
        {
            headerName: 'Period',
            valueGetter: (params) => `${monthNames[params.data.month]} ${params.data.year}`,
            filter: true,
            flex: 1,
            sort: 'desc'
        },
        {
            headerName: 'Net Pay',
            field: 'net_pay',
            cellRenderer: (params) => (
                <Text strong className="text-success">
                    Rs. {Math.round(params.value || 0).toLocaleString()}
                </Text>
            ),
            filter: 'agNumberColumnFilter',
            flex: 1
        },
        {
            headerName: 'Status',
            field: 'status',
            cellRenderer: (params) => {
                const status = params.value?.toLowerCase();
                const colorMap = {
                    'paid': 'success',
                    'processed': 'processing',
                    'pending': 'warning',
                    'failed': 'error'
                };
                return (
                    <Tag color={colorMap[status] || 'default'} icon={status === 'paid' ? <CheckCircleFilled /> : null}>
                        {params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : 'Pending'}
                    </Tag>
                );
            },
            filter: true,
            flex: 1
        },
        {
            headerName: 'Payment Date',
            field: 'snapshot_data.payment_date',
            valueFormatter: (params) => params.value ? dayjs(params.value).format('DD MMM YYYY') : '-',
            filter: 'agDateColumnFilter',
            flex: 1
        },
        {
            headerName: 'Actions',
            field: 'id',
            cellRenderer: (params) => (
                <Button
                    type="primary"
                    ghost
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => {
                        setSelectedSnapshot(params.data);
                        setIsModalOpen(true);
                    }}
                >
                    View Details
                </Button>
            ),
            sortable: false,
            filter: false,
            width: 150,
            suppressSizeToFit: true
        }
    ], [monthNames]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title="My Payroll" />
            {contextHolder}
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2 no-print">
                    <Breadcrumb
                        className='breadCrumb'
                        items={[
                            { title: <Link href="/"><HomeOutlined /></Link> },
                            { title: 'Payroll' },
                            { title: 'My Payroll' }
                        ]}
                    />

                    <div className="d-flex align-items-center gap-3">
                        <Space size="middle">
                            <Space flex="auto">
                                <Select
                                    value={month}
                                    style={{ width: 140 }}
                                    onChange={(val) => {
                                        setMonth(val);
                                        handleFilter(val, year);
                                    }}
                                    options={monthOptions}
                                />
                                <Select
                                    value={year}
                                    style={{ width: 100 }}
                                    onChange={(val) => {
                                        setYear(val);
                                        handleFilter(month, val);
                                    }}
                                    options={yearOptions}
                                />
                            </Space>
                            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>Print List</Button>
                        </Space>
                    </div>
                </div>

                <div className="mx-2 mt-3 no-print">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                        <div className="card-body p-0">
                            <div className="ag-grid-wrapper" style={{ height: 'calc(100vh - 150px)' }}>
                                <AgGridReact
                                    ref={gridRef}
                                    rowData={snapshots}
                                    columnDefs={columnDefs}
                                    defaultColDef={defaultColDef}
                                    theme={gridTheme}
                                    pagination={true}
                                    paginationPageSize={50}
                                    autoSizeStrategy={{
                                        type: 'fitGridWidth',
                                        defaultMinWidth: 100
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="print-only d-none">
                    <div className="text-center mb-4">
                        <Title level={2}>My Payroll Report</Title>
                        <Text type="secondary">Generated on {dayjs().format('MMMM DD, YYYY')}</Text>
                    </div>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Net Pay</th>
                                <th>Status</th>
                                <th>Payment Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {snapshots.map(s => (
                                <tr key={s.id}>
                                    <td>{monthNames[s.month]} {s.year}</td>
                                    <td>Rs. {Math.round(s.net_pay || 0).toLocaleString()}</td>
                                    <td>{s.status}</td>
                                    <td>{s.snapshot_data?.payment_date ? dayjs(s.snapshot_data.payment_date).format('DD-MM-YYYY') : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                title={<Space><WalletOutlined /> Payroll Detail: {monthNames[selectedSnapshot?.month]} {selectedSnapshot?.year}</Space>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalOpen(false)}>Close</Button>,
                    <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>Print Slip</Button>
                ]}
                width={850}
                centered
                bodyStyle={{ padding: '24px' }}
                className="modern-payroll-modal"
            >
                {selectedSnapshot && (
                    <div className="snapshot-detail-content">
                        <div className="mb-4 no-print">
                            <Card size="small" className="border-0 shadow-sm" style={{ background: '#f0f7ff', borderRadius: '12px' }}>
                                <div className="row g-3 text-center">
                                    <div className="col-md-3">
                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Status</Text>
                                        <Tag 
                                            color={
                                                selectedSnapshot.status?.toLowerCase() === 'paid' ? 'success' : 
                                                selectedSnapshot.status?.toLowerCase() === 'processed' ? 'processing' :
                                                selectedSnapshot.status?.toLowerCase() === 'failed' ? 'error' : 'warning'
                                            } 
                                            style={{ marginTop: '4px' }}
                                        >
                                            {selectedSnapshot.status?.toUpperCase() || 'PENDING'}
                                        </Tag>
                                    </div>
                                    <div className="col-md-3">
                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Method</Text>
                                        <Text strong style={{ display: 'block', marginTop: '4px' }}>
                                            {selectedSnapshot.snapshot_data?.payment_method?.replace('_', ' ').toUpperCase() || 'N/A'}
                                        </Text>
                                    </div>
                                    <div className="col-md-3">
                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Payment Date</Text>
                                        <Text strong style={{ display: 'block', marginTop: '4px' }}>
                                            {selectedSnapshot.snapshot_data?.payment_date ? dayjs(selectedSnapshot.snapshot_data.payment_date).format('DD-MM-YYYY') : 'N/A'}
                                        </Text>
                                    </div>
                                    <div className="col-md-3">
                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Reference</Text>
                                        <Text strong style={{ display: 'block', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {selectedSnapshot.snapshot_data?.reference || 'N/A'}
                                        </Text>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="print-header mb-4 text-center" style={{ display: 'none' }}>
                            <Title level={2} style={{ margin: 0 }}>PAYROLL SLIP</Title>
                            <Text strong style={{ fontSize: '18px' }}>{selectedSnapshot.name}</Text>
                            <br />
                            <Text type="secondary">{monthNames[selectedSnapshot.month]} {selectedSnapshot.year}</Text>
                            <Divider style={{ margin: '15px 0' }} />
                        </div>

                        <div className="row g-4">
                            <div className="col-12">
                                <Card size="small" className="border-0 bg-light shadow-sm" bodyStyle={{ padding: '20px' }} style={{ borderRadius: '12px' }}>
                                    <Divider orientation="left" style={{ margin: '0 0 20px 0' }}>
                                        <Text type="secondary" strong style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <CalendarOutlined className="me-2" /> Attendance & Hours Breakdown
                                        </Text>
                                    </Divider>
                                    <div className="row g-3 text-center">
                                        <div className="col-md-3 border-end">
                                            <div className="p-2">
                                                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Required Days</Text>
                                                <Title level={4} className="m-0 text-secondary" style={{ fontWeight: 600 }}>{selectedSnapshot.snapshot_data?.required_days || 0} Days</Title>
                                            </div>
                                        </div>
                                        <div className="col-md-3 border-end">
                                            <div className="p-2">
                                                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Present / Leaves</Text>
                                                <Title level={4} className="m-0 text-primary" style={{ fontWeight: 600 }}>
                                                    {selectedSnapshot.snapshot_data?.present_days || 0} / {selectedSnapshot.snapshot_data?.leave_days || 0} d
                                                </Title>
                                            </div>
                                        </div>
                                        <div className="col-md-3 border-end">
                                            <div className="p-2">
                                                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Deficit Hours</Text>
                                                <Title level={4} className="m-0 text-danger" style={{ fontWeight: 600 }}>{selectedSnapshot.snapshot_data?.undertime_hours?.toFixed(1) || 0} Hrs</Title>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="p-2">
                                                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Overtime</Text>
                                                <Title level={4} className="m-0 text-success" style={{ fontWeight: 600 }}>{selectedSnapshot.snapshot_data?.overtime_hours?.toFixed(1) || 0} Hrs</Title>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 px-3 py-2 bg-white rounded border border-dashed">
                                        <div className="row text-center" style={{ fontSize: '12px' }}>
                                            <div className="col-4 border-end">
                                                <Text type="secondary">Required Hrs: </Text>
                                                <Text strong>{selectedSnapshot.snapshot_data?.total_required_hours?.toFixed(1) || 0}</Text>
                                            </div>
                                            <div className="col-4 border-end">
                                                <Text type="secondary">Recorded Hrs: </Text>
                                                <Text strong className="text-primary">{selectedSnapshot.snapshot_data?.total_worked_hours?.toFixed(1) || 0}</Text>
                                            </div>
                                            <div className="col-4">
                                                <Text type="secondary">Shift: </Text>
                                                <Text strong style={{ fontSize: '11px' }}>{selectedSnapshot.snapshot_data?.assigned_shift}</Text>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <div className="col-md-7">
                                <Card size="small" className="h-100 border-0 shadow-sm" headStyle={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }} style={{ borderRadius: '12px', overflow: 'hidden' }} title={<Space><DollarOutlined className="text-success" /> Earnings & Bonuses</Space>}>
                                    <div className="p-2">
                                        <div className="d-flex justify-content-between mb-3 px-1">
                                            <Text strong>Basic Gross Salary</Text>
                                            <Text strong style={{ fontSize: '15px' }}>Rs. {Math.round(selectedSnapshot.snapshot_data?.gross_salary || 0).toLocaleString()}</Text>
                                        </div>
                                        <div className="d-flex flex-column gap-2">
                                            {(selectedSnapshot.snapshot_data?.breakdown?.benefits || []).map((b, i) => (
                                                <div key={`b-${i}`} className="d-flex justify-content-between align-items-center px-3 py-2 rounded-pill bg-success-subtle" style={{ minHeight: '38px' }}>
                                                    <Text style={{ fontSize: '13px' }}><CheckCircleFilled className="text-success me-2" />{b.label} {b.count > 0 && <small className="text-secondary">({b.count} {b.unit})</small>}</Text>
                                                    <Text strong className="text-success">+ Rs. {Math.round(b.amount || 0).toLocaleString()}</Text>
                                                </div>
                                            ))}
                                            {selectedSnapshot.snapshot_data?.project_points_amount > 0 && (
                                                <div className="d-flex justify-content-between align-items-center px-3 py-2 rounded-pill bg-success-subtle" style={{ minHeight: '38px' }}>
                                                    <Text style={{ fontSize: '13px' }}><CheckCircleFilled className="text-success me-2" />Project Points Bonus</Text>
                                                    <Text strong className="text-success">+ Rs. {Math.round(selectedSnapshot.snapshot_data.project_points_amount).toLocaleString()}</Text>
                                                </div>
                                            )}
                                            {selectedSnapshot.snapshot_data?.overtime_bonus > 0 && (
                                                <div className="d-flex justify-content-between align-items-center px-3 py-2 rounded-pill bg-success-subtle" style={{ minHeight: '38px' }}>
                                                    <Text style={{ fontSize: '13px' }}><CheckCircleFilled className="text-success me-2" />Overtime Bonus</Text>
                                                    <Text strong className="text-success">+ Rs. {Math.round(selectedSnapshot.snapshot_data.overtime_bonus).toLocaleString()}</Text>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <div className="col-md-5">
                                <Card size="small" className="h-100 border-0 shadow-sm" headStyle={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }} style={{ borderRadius: '12px', overflow: 'hidden' }} title={<Space><WalletOutlined className="text-danger" /> Deductions</Space>}>
                                    <div className="p-2">
                                        <div className="d-flex flex-column gap-2">
                                            {(selectedSnapshot.snapshot_data?.breakdown?.penalties || []).map((p, i) => (
                                                <div key={`p-${i}`} className="d-flex justify-content-between align-items-center px-3 py-2 rounded-pill bg-danger-subtle" style={{ minHeight: '38px' }}>
                                                    <Text style={{ fontSize: '12px' }}><CheckCircleFilled className="text-danger me-2" />{p.label}</Text>
                                                    <Text strong className="text-danger">- Rs. {Math.round(p.amount || 0).toLocaleString()}</Text>
                                                </div>
                                            ))}
                                            {(selectedSnapshot.snapshot_data?.breakdown?.taxes || []).map((t, i) => (
                                                <div key={`t-${i}`} className="d-flex justify-content-between align-items-center px-3 py-2 rounded-pill bg-danger-subtle" style={{ minHeight: '38px' }}>
                                                    <Text style={{ fontSize: '12px' }}><CheckCircleFilled className="text-danger me-2" />{t.name} <small className="text-secondary">({t.rate})</small></Text>
                                                    <Text strong className="text-danger">- Rs. {Math.round(t.amount || 0).toLocaleString()}</Text>
                                                </div>
                                            ))}
                                            {selectedSnapshot.snapshot_data?.manual_penalty > 0 && (
                                                <div className="d-flex justify-content-between align-items-center px-3 py-2 rounded-pill bg-danger-subtle" style={{ minHeight: '38px' }}>
                                                    <Text style={{ fontSize: '12px' }}><CheckCircleFilled className="text-danger me-2" />Adjustment Deductions</Text>
                                                    <Text strong className="text-danger">- Rs. {Math.round(selectedSnapshot.snapshot_data.manual_penalty).toLocaleString()}</Text>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <div className="col-12">
                                <Card className="border-0 shadow-sm" style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '12px' }}>
                                    <div className="row align-items-center">
                                        <div className="col-md-7">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                                    <DollarOutlined style={{ fontSize: '24px' }} />
                                                </div>
                                                <div>
                                                    <Text strong style={{ fontSize: '16px', display: 'block' }}>Net Payable Amount</Text>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>Total payout for {monthNames[selectedSnapshot.month]} {selectedSnapshot.year}</Text>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-5 text-end text-center-mobile mt-3 mt-md-0">
                                            <Text type="secondary" className="text-uppercase" style={{ fontSize: '10px', letterSpacing: '2px', fontWeight: 600 }}>Total Payout</Text>
                                            <Title level={2} className="m-0 text-success" style={{ fontWeight: '800', lineHeight: 1.2 }}>
                                                Rs. {Math.round(selectedSnapshot.net_pay || 0).toLocaleString()}
                                            </Title>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-top print-footer text-center" style={{ display: 'none' }}>
                            <Text type="secondary" italic style={{ fontSize: '11px' }}>This is a computer-generated salary slip and does not require a physical signature.</Text>
                        </div>
                    </div>
                )}
            </Modal>

            <style>{`
                .ag-theme-alpine, .ag-theme-alpine-dark {
                    --ag-header-foreground-color: #444;
                    --ag-header-background-color: #f8f9fa;
                    --ag-font-size: 13px;
                }
                .ag-header-cell-text {
                    white-space: normal !important;
                    overflow: visible !important;
                    line-height: 1.2 !important;
                    font-weight: 600 !important;
                }
                .ag-cell {
                    display: flex;
                    align-items: center;
                    white-space: normal !important;
                    line-height: 1.4 !important;
                    padding-top: 4px !important;
                    padding-bottom: 4px !important;
                }
                .ag-grid-wrapper .ag-root-wrapper {
                    border-radius: 12px !important;
                    border: none !important;
                }

                .ag-grid-wrapper {
                    width: 100%;
                }
                .text-success { color: #52c41a !important; }
                .text-danger { color: #f5222d !important; }
                .bg-light { background-color: #fafafa !important; }
                
                @media (max-width: 768px) {
                    .text-center-mobile { text-align: center !important; }
                }

                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .ant-modal-mask, .ant-modal-wrap { position: static !important; }
                    .ant-modal { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
                    .ant-modal-content { box-shadow: none !important; }
                    .ant-modal-header, .ant-modal-footer, .ant-modal-close { display: none !important; }
                    
                    .snapshot-detail-content {
                        display: block !important;
                    }
                    .print-header { display: block !important; }
                    .print-footer { display: block !important; }
                    
                    body { background: white !important; }
                    .container-fluid { padding: 0 !important; }
                    
                    /* If modal is open, only print modal content */
                    body:has(.ant-modal-open) .container-fluid { display: none !important; }
                }

                .breadCrumb {
                    font-size: 14px;
                    margin-bottom: 0;
                }
                .shadow-sm {
                    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
                }
            `}</style>
        </>
    );
};

MyPayroll.layout = (page) => <MainLayout children={page} />;

export default MyPayroll;
