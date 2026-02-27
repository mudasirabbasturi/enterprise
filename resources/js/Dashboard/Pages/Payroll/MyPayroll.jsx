import React, { useMemo, useState, useRef } from 'react';
import { Head, Link, Breadcrumb, EyeOutlined, router, dayjs } from "@shared/ui";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import { Select, Button, Modal, Card, Typography, Divider, Tag, Space } from 'antd';
import MainLayout from "@layout";
import { WalletOutlined } from '@ant-design/icons';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Text, Title } = Typography;

const MyPayroll = ({
    users,
    attendances,
    penalties,
    payments,
    adjustments,
    config,
    leaveRequests,
    projectPoints,
    selectedYear,
    shifts,
    monthlyShiftAssignments,
    holidays
}) => {
    const gridRef = useRef();
    const [year, setYear] = useState(selectedYear);
    const [selectedMonthData, setSelectedMonthData] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const user = users[0];

    const getDuration = (start, end) => {
        if (!start || !end) return 0;
        const s = dayjs(`2000-01-01 ${start}`);
        const e = dayjs(`2000-01-01 ${end}`);
        return e.diff(s, 'minute');
    };

    const getMinutes = (time) => {
        if (!time) return 0;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const rowData = useMemo(() => {
        if (!user) return [];
        const monthRows = [];
        const pointRate = parseFloat(config?.project_point_rate) || 0;

        for (let m = 1; m <= 12; m++) {
            const startOfMonth = dayjs(`${year}-${String(m).padStart(2, '0')}-01`);
            const lastDayOfMonth = startOfMonth.endOf('month').date();
            const monthName = startOfMonth.format('MMMM');

            const pkg = user.salary?.package;
            if (!pkg) continue;

            const baseSalary = parseFloat(user.salary.custom_salary || pkg.base_salary || 0);
            const totalAllowances = (pkg.allowances || []).reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
            const grossSalary = baseSalary + totalAllowances;

            const userAttendances = attendances.filter(a => dayjs(a.date).month() === (m - 1));
            const userLeaves = (leaveRequests || []).filter(l => {
                const leaveStart = dayjs(l.start_date);
                const leaveEnd = dayjs(l.end_date);
                return (leaveStart.year() === year && leaveStart.month() === (m - 1)) ||
                    (leaveEnd.year() === year && leaveEnd.month() === (m - 1));
            });

            let totalRequiredMinutes = 0;
            let totalActualWorkedMinutes = 0;
            let totalLateDays = 0;
            let totalMissingAttendanceDays = 0;
            let presentDays = 0;
            let absentHours = 0;
            let undertimeHours = 0;
            let overtimeHours = 0;
            let approvedLeaveDays = 0;
            let absentDays = 0;
            let requiredDays = 0;

            const appliedShifts = monthlyShiftAssignments.filter(s => s.month === m && s.year === year);

            for (let d = 1; d <= lastDayOfMonth; d++) {
                const dateObj = startOfMonth.date(d);
                const dateStr = dateObj.format('YYYY-MM-DD');
                const dayName = dateObj.format('dddd');

                if (dayName === 'Saturday' || dayName === 'Sunday') continue;
                const isHoliday = (holidays || []).some(h => dayjs(h.date).isSame(dateObj, 'day'));
                if (isHoliday) continue;

                const onLeave = userLeaves.find(leave => {
                    const leaveStart = dayjs(leave.start_date);
                    const leaveEnd = dayjs(leave.end_date);
                    return dateObj.isSameOrAfter(leaveStart, 'day') && dateObj.isSameOrBefore(leaveEnd, 'day');
                });

                const shiftRange = appliedShifts.find(s => d >= s.start_day && d <= s.end_day);
                let shift = null;
                if (shiftRange) {
                    shift = shifts.find(s => s.id === shiftRange.shift_id);
                } else {
                    const weeklyShift = user.user_shift_schedules?.find(s => s.day === dayName);
                    shift = weeklyShift?.shift;
                }

                if (onLeave) {
                    approvedLeaveDays++;
                }

                if (shift && !onLeave) {
                    requiredDays++;
                    const shiftDur = getDuration(shift.start_time, shift.end_time) - (shift.total_break_minutes || 0);
                    totalRequiredMinutes += shiftDur;

                    const att = userAttendances.find(a => a.date === dateStr);
                    if (att && att.status === 'present') {
                        presentDays++;
                        if (!att.check_in || !att.check_out) {
                            totalMissingAttendanceDays++;
                        }
                        const workedDur = getDuration(att.check_in, att.check_out);
                        const breakDur = getDuration(att.break_start, att.break_end);
                        const actualBreak = (breakDur > 0) ? breakDur : (shift.total_break_minutes || 0);
                        const netWorked = workedDur - actualBreak;
                        totalActualWorkedMinutes += netWorked;

                        if (netWorked < shiftDur) {
                            undertimeHours += (shiftDur - netWorked) / 60;
                        } else if (netWorked > shiftDur) {
                            overtimeHours += (netWorked - shiftDur) / 60;
                        }

                        if (att.check_in) {
                            const sTotal = getMinutes(shift.start_time);
                            const aTotal = getMinutes(att.check_in);
                            if (aTotal > (sTotal + 15)) {
                                totalLateDays++;
                            }
                        }
                    } else {
                        absentDays++;
                        absentHours += shiftDur / 60;
                    }
                }
            }

            const totalRequiredHours = totalRequiredMinutes / 60;
            const hourlyRate = grossSalary / (Math.max(1, totalRequiredHours));
            const undertimeRate = parseFloat(config?.undertime_penalty_per_hour) || hourlyRate;
            const absentRate = parseFloat(config?.absent_penalty_rate) || hourlyRate;
            const overtimeRate = parseFloat(config?.overtime_bonus_per_hour) || 0;

            const absentDeduction = absentHours * absentRate;
            const undertimeDeduction = undertimeHours * undertimeRate;
            const overtimeBonus = overtimeHours * overtimeRate;

            const lateGraceCount = Math.max(0, parseInt(config?.late_grace_count || 0));
            const latePenaltyPerDay = parseFloat(config?.late_penalty_per_day || 0);
            const taxableLateDays = Math.max(0, totalLateDays - lateGraceCount);
            const latePenaltyDeduction = taxableLateDays * latePenaltyPerDay;

            const missingAttendanceGraceCount = Math.max(0, parseInt(config?.missing_attendance_grace_count || 0));
            const missingAttendancePenaltyPerDay = parseFloat(config?.missing_attendance_penalty_per_day || 0);
            const taxableMissingAttendanceDays = Math.max(0, totalMissingAttendanceDays - missingAttendanceGraceCount);
            const missingAttendancePenaltyDeduction = taxableMissingAttendanceDays * missingAttendancePenaltyPerDay;

            const userPenalties = penalties.filter(p => dayjs(p.date).month() === (m - 1));
            const totalManualPenalty = userPenalties.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

            const taxesBreakdown = [];
            (pkg.tax_rules || pkg.taxRules || []).forEach(rule => {
                const ruleVal = parseFloat(rule.value || 0);
                const amount = rule.type === 'percentage' ? (grossSalary * ruleVal) / 100 : ruleVal;
                taxesBreakdown.push({ name: rule.name || 'Tax', amount: amount });
            });
            const totalTax = taxesBreakdown.reduce((acc, curr) => acc + curr.amount, 0);

            const userAdjustments = adjustments?.filter(a => a.month === m) || [];
            const bonusTotal = userAdjustments.filter(a => a.type === 'bonus').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            const projectPointsForMonth = parseFloat(projectPoints[m] || 0);
            const projectPointsAmount = projectPointsForMonth * pointRate;
            const deductionTotal = userAdjustments.filter(a => a.type === 'deduction').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

            const totalDeductions = absentDeduction + undertimeDeduction + latePenaltyDeduction + missingAttendancePenaltyDeduction + totalManualPenalty + totalTax + deductionTotal;
            const netPay = Math.max(0, grossSalary + overtimeBonus + bonusTotal + projectPointsAmount - totalDeductions);

            const payment = payments.find(p => p.month === m);

            monthRows.push({
                key: m,
                month: monthName,
                gross_salary: grossSalary,
                total_deductions: totalDeductions,
                net_pay: netPay,
                status: payment ? 'Paid' : 'Pending',
                payment_date: payment ? payment.payment_date : null,
                breakdown: {
                    benefits: [
                        { label: 'Overtime Bonus', amount: overtimeBonus },
                        { label: 'Project Points', count: projectPointsForMonth, amount: projectPointsAmount },
                        ...userAdjustments.filter(a => a.type === 'bonus').map(a => ({ label: a.label, amount: parseFloat(a.amount) }))
                    ].filter(b => b.amount > 0),
                    penalties: [
                        { label: 'Absence Penalty', amount: absentDeduction },
                        { label: 'Undertime Penalty', amount: undertimeDeduction },
                        { label: 'Late Arrival Penalty', amount: latePenaltyDeduction },
                        { label: 'Missing Check-in/out Penalty', amount: missingAttendancePenaltyDeduction },
                        ...userPenalties.map(p => ({ label: `Manual Penalty: ${p.type}`, amount: parseFloat(p.amount) })),
                        ...userAdjustments.filter(a => a.type === 'deduction').map(a => ({ label: a.label, amount: parseFloat(a.amount) }))
                    ].filter(p => p.amount > 0),
                    taxes: taxesBreakdown
                }
            });
        }
        return monthRows;
    }, [user, attendances, penalties, payments, adjustments, config, leaveRequests, projectPoints, year, shifts, monthlyShiftAssignments, holidays]);

    const columnDefs = useMemo(() => [
        {
            headerName: 'Month',
            field: 'month',
            flex: 1,
            cellRenderer: (p) => <Text strong>{p.value}</Text>
        },
        {
            headerName: 'Gross Salary',
            field: 'gross_salary',
            flex: 1,
            valueFormatter: (p) => `Rs. ${Math.round(p.value).toLocaleString()}`
        },
        {
            headerName: 'Deductions',
            field: 'total_deductions',
            flex: 1,
            cellRenderer: (p) => <Text type="danger">Rs. {Math.round(p.value).toLocaleString()}</Text>
        },
        {
            headerName: 'Net Payable',
            field: 'net_pay',
            flex: 1,
            cellRenderer: (p) => <Text type="success" strong>Rs. {Math.round(p.value).toLocaleString()}</Text>
        },
        {
            headerName: 'Status',
            field: 'status',
            flex: 1,
            cellRenderer: (p) => (
                <Tag color={p.value === 'Paid' ? 'green' : 'orange'}>
                    {p.value.toUpperCase()}
                </Tag>
            )
        },
        {
            headerName: 'Payment Date',
            field: 'payment_date',
            flex: 1,
            valueFormatter: (p) => p.value ? dayjs(p.value).format('DD MMM YYYY') : '-'
        },
        {
            headerName: 'Action',
            field: 'actions',
            flex: 1,
            cellRenderer: (p) => (
                <Button
                    type="primary"
                    ghost
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => {
                        setSelectedMonthData(p.data);
                        setIsDetailModalOpen(true);
                    }}
                >
                    View Details
                </Button>
            ),
            sortable: false,
            filter: false
        }
    ], []);

    const handleFilter = () => {
        router.get(route('my-payroll.index'), { year }, { preserveState: true });
    };

    const yearOptions = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: y }));

    return (
        <>
            <Head title="My Payroll" />
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                    <Breadcrumb
                        className='breadCrumb'
                        items={[{ title: <Link href="/">Home</Link> }, { title: 'Payroll' }, { title: 'My Payroll' }]}
                    />
                    <div className="d-flex gap-2">
                        <Select value={year} onChange={setYear} options={yearOptions} style={{ width: 100 }} />
                        <Button type="primary" onClick={handleFilter}>Filter</Button>
                    </div>
                </div>

                <div className="p-2">
                    <Card className="shadow-sm border-0">
                        <div className={`${gridTheme} w-100`} style={{ height: 'calc(100vh - 180px)' }}>
                            <AgGridReact
                                ref={gridRef}
                                rowData={rowData}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                animateRows={true}
                                rowSelection="single"
                            />
                        </div>
                    </Card>
                </div>

                <Modal
                    title={`Payroll Details - ${selectedMonthData?.month} ${year}`}
                    open={isDetailModalOpen}
                    onCancel={() => setIsDetailModalOpen(false)}
                    footer={[
                        <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
                            Close
                        </Button>
                    ]}
                    width={700}
                >
                    {selectedMonthData && (
                        <div className="p-2">
                            <Descriptions bordered column={2} size="small">
                                <Descriptions.Item label="Gross Salary">Rs. {Math.round(selectedMonthData.gross_salary).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label="Net Payable">Rs. {Math.round(selectedMonthData.net_pay).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label="Total Deductions">Rs. {Math.round(selectedMonthData.total_deductions).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    <Tag color={selectedMonthData.status === 'Paid' ? 'green' : 'orange'}>
                                        {selectedMonthData.status}
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>

                            <Divider orientation="left">Earnings & Benefits</Divider>
                            <Table
                                size="small"
                                pagination={false}
                                dataSource={selectedMonthData.breakdown.benefits.map((b, i) => ({ ...b, key: i }))}
                                columns={[
                                    { title: 'Item', dataIndex: 'label', key: 'label' },
                                    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a) => `Rs. ${Math.round(a).toLocaleString()}` }
                                ]}
                            />

                            <Divider orientation="left">Penalties & Deductions</Divider>
                            <Table
                                size="small"
                                pagination={false}
                                dataSource={selectedMonthData.breakdown.penalties.map((p, i) => ({ ...p, key: i }))}
                                columns={[
                                    { title: 'Item', dataIndex: 'label', key: 'label' },
                                    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a) => `Rs. ${Math.round(a).toLocaleString()}` }
                                ]}
                            />

                            <Divider orientation="left">Taxes</Divider>
                            <Table
                                size="small"
                                pagination={false}
                                dataSource={selectedMonthData.breakdown.taxes.map((t, i) => ({ ...t, key: i }))}
                                columns={[
                                    { title: 'Item', dataIndex: 'name', key: 'name' },
                                    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a) => `Rs. ${Math.round(a).toLocaleString()}` }
                                ]}
                            />
                        </div>
                    )}
                </Modal>
            </div>

            <style>{`
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

// Re-using bits of main table structure for modal
const Table = ({ dataSource, columns, size, pagination }) => {
    return (
        <table className={`table table-bordered table-${size} mb-0`} style={{ fontSize: '13px' }}>
            <thead>
                <tr>
                    {columns.map(col => <th key={col.key}>{col.title}</th>)}
                </tr>
            </thead>
            <tbody>
                {dataSource.length === 0 ? (
                    <tr><td colSpan={columns.length} className="text-center text-muted">No records</td></tr>
                ) : (
                    dataSource.map(row => (
                        <tr key={row.key}>
                            {columns.map(col => <td key={col.key}>{col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}</td>)}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
};

const Descriptions = ({ children, bordered, column, size }) => {
    return (
        <div className={`descriptions-container ${bordered ? 'border' : ''} p-2 rounded bg-light mb-3`}>
            <div className="row g-2">
                {children}
            </div>
        </div>
    );
};

Descriptions.Item = ({ label, children }) => (
    <div className="col-md-6">
        <div className="p-2 border rounded bg-white">
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>{label}</Text>
            <Text strong>{children}</Text>
        </div>
    </div>
);
