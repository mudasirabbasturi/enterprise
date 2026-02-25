import { useState, useMemo, useRef, useEffect } from 'react';
import { Head, Link, Breadcrumb, EyeOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, DownloadOutlined, DollarOutlined, SettingOutlined, CheckCircleFilled, router, notification, PlusCircleOutlined, PrinterOutlined, CalendarOutlined, dayjs } from "@shared/ui";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import { Select, Button, Modal, Form, Input, InputNumber, DatePicker, Card, Typography, Divider, Tag, Tooltip, Dropdown, Menu } from 'antd';
import MainLayout from "@layout";
import { calc } from 'antd/es/theme/internal';

const { Text, Title } = Typography;

const SalarySheet =
    ({ users, attendances, penalties, payments, config, selectedMonth, selectedYear, leaveRequests, adjustments, projectPoints, shifts, monthlyShiftAssignments }) => {
        const [api, contextHolder] = notification.useNotification();
        const [modal, modalContextHolder] = Modal.useModal();
        const gridRef = useRef();
        const [month, setMonth] = useState(selectedMonth);
        const [year, setYear] = useState(selectedYear);
        const [isPayModalOpen, setIsPayModalOpen] = useState(false);
        const [selectedUser, setSelectedUser] = useState(null);
        const [loading, setLoading] = useState(false);
        const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
        const [form] = Form.useForm();
        const [configForm] = Form.useForm();
        const [shiftForm] = Form.useForm();
        const [appliedShifts, setAppliedShifts] = useState(monthlyShiftAssignments || []);
        const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

        // Sync local state when prop changes (e.g. month change)
        useEffect(() => {
            setAppliedShifts(monthlyShiftAssignments || []);
            shiftForm.setFieldsValue({ shifts: monthlyShiftAssignments || [] });
        }, [monthlyShiftAssignments]);
        const watchedAdjustments = Form.useWatch('manual_adjustments', form);

        const monthOptions = [
            { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
            { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
            { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
            { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
        ];

        const months = monthOptions.map(m => m.label);

        const yearOptions = [2025, 2026, 2027].map(y => ({ value: y, label: y }));

        const getWorkingDays = (m, y) => {
            const startOfMonth = dayjs(`${y} -${m}-01`);
            const endOfMonth = startOfMonth.endOf('month');
            let count = 0;
            let current = startOfMonth;
            while (current.isSameOrBefore(endOfMonth)) {
                const dayOfWeek = current.day();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sat/Sun
                    count++;
                }
                current = current.add(1, 'day');
            }
            return count;
        };

        const calculatedWorkingDays = useMemo(() => getWorkingDays(month, year), [month, year]);

        const getMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        const getDuration = (start, end) => {
            if (!start || !end) return 0;
            let s = getMinutes(start);
            let e = getMinutes(end);
            if (e < s) e += 1440; // Midnight crossing
            return e - s;
        };

        const rowData = useMemo(() => {
            const pointRate = parseFloat(config?.project_point_rate) || 0;
            const startOfMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
            const lastDayOfMonth = startOfMonth.endOf('month').date();

            return users.map(user => {
                if (!user.salary) return null;

                const pkg = user.salary.package;
                const baseSalary = parseFloat(user.salary.custom_salary || pkg.base_salary || 0);
                const totalAllowances = (pkg.allowances || []).reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
                const grossSalary = baseSalary + totalAllowances;

                // Shift-aware Attendance Calculations
                const userAttendances = attendances.filter(a => a.user_id === user.id);
                const userLeaves = (leaveRequests || []).filter(l => l.user_id === user.id && l.status === 'approved');

                let totalRequiredMinutes = 0;
                let totalActualWorkedMinutes = 0;
                let totalLateDays = 0;
                let presentDays = 0;
                let absentHours = 0;
                let undertimeHours = 0;
                let overtimeHours = 0;
                let approvedLeaveDays = 0;
                let absentDays = 0;
                let requiredDays = 0;

                for (let d = 1; d <= lastDayOfMonth; d++) {
                    const dateObj = startOfMonth.date(d);
                    const dateStr = dateObj.format('YYYY-MM-DD');
                    const dayName = dateObj.format('dddd');

                    // Skip weekends entirely for payroll logic (Sat/Sun are off)
                    if (dayName === 'Saturday' || dayName === 'Sunday') continue;

                    // Check if on approved leave
                    const onLeave = userLeaves.find(leave => {
                        const leaveStart = dayjs(leave.start_date);
                        const leaveEnd = dayjs(leave.end_date);
                        return dateObj.isSameOrAfter(leaveStart, 'day') && dateObj.isSameOrBefore(leaveEnd, 'day');
                    });

                    // Match shift for the day
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

                    // Only require hours if a shift is defined AND user is NOT on leave
                    if (shift && !onLeave) {
                        requiredDays++;
                        const shiftDur = getDuration(shift.start_time, shift.end_time) - (shift.total_break_minutes || 0);
                        totalRequiredMinutes += shiftDur;

                        const att = userAttendances.find(a => a.date === dateStr);
                        if (att && att.status === 'present') {
                            presentDays++;
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

                            // Late calculation (15 min grace)
                            if (att.check_in) {
                                const sTotal = getMinutes(shift.start_time);
                                const aTotal = getMinutes(att.check_in);
                                if (aTotal > (sTotal + 15)) {
                                    totalLateDays++;
                                }
                            }
                        } else {
                            // Absent
                            absentDays++;
                            absentHours += shiftDur / 60;
                        }
                    }
                }

                // Fallback to standard 22 days/8 hours if no shifts assigned
                let finalRequiredMinutes = totalRequiredMinutes;
                let finalRequiredDays = requiredDays;
                if (finalRequiredMinutes === 0) {
                    finalRequiredDays = parseFloat(config?.working_days_override) || calculatedWorkingDays;
                    finalRequiredMinutes = finalRequiredDays * 8 * 60;
                }

                const totalRequiredHours = finalRequiredMinutes / 60;
                const totalWorkedHours = totalActualWorkedMinutes / 60;

                const hourlyRate = grossSalary / (Math.max(1, totalRequiredHours));
                const undertimeRate = parseFloat(config?.undertime_penalty_per_hour) || hourlyRate;
                const absentRate = parseFloat(config?.absent_penalty_rate) || hourlyRate;
                const overtimeRate = parseFloat(config?.overtime_bonus_per_hour) || 0;

                const absentDeduction = absentHours * absentRate;
                const undertimeDeduction = undertimeHours * undertimeRate;
                const overtimeBonus = overtimeHours * overtimeRate;

                // Manual Penalties
                const userPenalties = penalties.filter(p => p.user_id === user.id);
                const manualPenaltiesBreakdown = userPenalties.map(p => ({
                    type: p.type,
                    reason: p.reason,
                    amount: parseFloat(p.amount || 0)
                }));
                const totalManualPenalty = manualPenaltiesBreakdown.reduce((acc, curr) => acc + curr.amount, 0);

                // Taxes Breakdown
                const taxesBreakdown = [];
                (pkg.tax_rules || pkg.taxRules || []).forEach(rule => {
                    const ruleVal = parseFloat(rule.value || 0);
                    const amount = rule.type === 'percentage' ? (grossSalary * ruleVal) / 100 : ruleVal;
                    taxesBreakdown.push({
                        name: rule.name || 'Tax',
                        amount: amount,
                        rate: rule.type === 'percentage' ? `${ruleVal}%` : `Rs.${ruleVal}`
                    });
                });
                const totalTax = taxesBreakdown.reduce((acc, curr) => acc + curr.amount, 0);

                // Manual Adjustments
                const userAdjustments = adjustments?.filter(a => a.user_id === user.id) || [];
                const bonusTotal = userAdjustments.filter(a => a.type === 'bonus').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
                const manualPointsTotal = userAdjustments.filter(a => a.type === 'points').reduce((acc, curr) => acc + (parseFloat(curr.amount) * pointRate), 0);
                const userProjectPoints = parseFloat(projectPoints?.[user.id] || 0);
                const projectPointsAmount = userProjectPoints * pointRate;
                const deductionTotal = userAdjustments.filter(a => a.type === 'deduction').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

                const totalDeductions = absentDeduction + undertimeDeduction + totalManualPenalty + totalTax + deductionTotal;
                const netPay = Math.max(0, grossSalary + overtimeBonus + bonusTotal + manualPointsTotal + projectPointsAmount - totalDeductions);

                const payment = payments.find(p => p.user_id === user.id);

                return {
                    ...user,
                    gross_salary: grossSalary,
                    present_days: presentDays,
                    leave_days: approvedLeaveDays,
                    absent_days: absentDays,
                    required_days: finalRequiredDays,
                    absent_hours: absentHours,
                    undertime_hours: undertimeHours,
                    late_days: totalLateDays,
                    total_required_hours: totalRequiredHours,
                    total_worked_hours: totalWorkedHours,

                    // Detailed Breakdown for Modal
                    breakdown: {
                        benefits: [
                            { label: 'Approved Leaves', count: approvedLeaveDays, amount: 0, unit: 'd' },
                            { label: 'Overtime Bonus', count: overtimeHours.toFixed(2), rate: overtimeRate, amount: overtimeBonus, unit: 'hrs', status: 'Bonus' },
                            { label: 'Project Points', count: userProjectPoints, rate: pointRate, amount: projectPointsAmount, unit: 'pts', status: 'Bonus' },
                            ...userAdjustments.filter(a => a.type === 'bonus' || a.type === 'points').map((a, i) => ({
                                label: a.label,
                                amount: a.type === 'points' ? (parseFloat(a.amount) * pointRate) : parseFloat(a.amount),
                                status: 'Bonus',
                                count: a.type === 'points' ? parseFloat(a.amount) : undefined,
                                unit: a.type === 'points' ? 'pts' : undefined,
                                key: `adj-b-${i}`
                            }))
                        ].filter(b => (b.count > 0 || b.amount > 0)),
                        penalties: [
                            { label: 'Absence Penalty', count: absentHours.toFixed(2), rate: absentRate, amount: absentDeduction, unit: 'hrs' },
                            { label: 'Undertime Penalty', count: undertimeHours.toFixed(2), rate: undertimeRate, amount: undertimeDeduction, unit: 'hrs' },
                            ...manualPenaltiesBreakdown.map((p, i) => ({ label: `Manual Penalty: ${p.type}`, reason: p.reason, amount: p.amount, key: `manual-${i}` })),
                            ...userAdjustments.filter(a => a.type === 'deduction').map((a, i) => ({ label: a.label, reason: a.reason, amount: parseFloat(a.amount), key: `adj-d-${i}` }))
                        ].filter(p => p.amount > 0),
                        taxes: taxesBreakdown
                    },

                    absent_deduction: absentDeduction,
                    undertime_deduction: undertimeDeduction,
                    overtime_bonus: overtimeBonus,
                    manual_penalty: totalManualPenalty,
                    bonus_total: bonusTotal,
                    adjustment_deduction: deductionTotal,
                    total_tax: totalTax,
                    total_deductions: totalDeductions,
                    net_pay: netPay,
                    payment_status: payment ? 'Paid' : 'Pending',
                    payment_details: payment,
                    raw_adjustments: userAdjustments,
                    point_rate: pointRate,
                    project_points: userProjectPoints,
                    project_points_amount: projectPointsAmount
                };
            }).filter(Boolean);
        }, [users, attendances, penalties, payments, adjustments, config, leaveRequests, month, year, appliedShifts, shifts]);

        const columnDefs = useMemo(() => [
            { headerName: "Employee", field: "name", pinned: 'left', width: 200 },
            {
                headerName: "Required/Worked Hrs",
                valueGetter: params => `${params.data.total_required_hours?.toFixed(1)} / ${params.data.total_worked_hours?.toFixed(1)}`,
                cellRenderer: params => (
                    <div className="text-center">
                        <span className="text-primary">{params.data.total_required_hours?.toFixed(1)}</span>
                        <span className="mx-1">/</span>
                        <span className="text-success">{params.data.total_worked_hours?.toFixed(1)}</span>
                    </div>
                ),
                width: 160,
                filter: false,
                sortable: false,
                cellClass: 'fw-bold',
            },
            {
                headerName: "Gross Salary",
                field: "gross_salary",
                width: 120,
                valueFormatter: params => (params.value || 0).toLocaleString(),
                filter: false,
                sortable: false
            },
            {
                headerName: "Overtime",
                field: "overtime_bonus",
                width: 100,
                cellClass: 'text-success',
                valueFormatter: params => `+ ${Math.round(params.value || 0).toLocaleString()} `,
                filter: false,
                sortable: false
            },
            {
                headerName: "Points/Earn",
                valueGetter: params => `${params.data.project_points} / ${Math.round(params.data.project_points_amount || 0)}`,
                cellRenderer: params => (
                    <div className="text-success">
                        <span>{params.data.project_points}</span>
                        <span className="mx-1">/</span>
                        <span>{Math.round(params.data.project_points_amount || 0).toLocaleString()}</span>
                    </div>
                ),
                width: 110,
                filter: false,
                sortable: false,
                cellClass: 'fw-bold'
            },
            {
                headerName: "Deductions",
                children: [
                    { headerName: "Tax", field: "total_tax", width: 90, filter: false, sortable: false, cellClass: 'text-danger', valueFormatter: params => `-${Math.round(params.value || 0).toLocaleString()}` },
                    { headerName: "Undertime", field: "undertime_deduction", width: 100, filter: false, sortable: false, cellClass: 'text-danger', valueFormatter: params => `-${Math.round(params.value || 0).toLocaleString()}` },
                    { headerName: "Abs Pen", field: "absent_deduction", width: 100, filter: false, sortable: false, cellClass: 'text-danger', valueFormatter: params => `-${Math.round(params.value || 0).toLocaleString()}` },
                    { headerName: "Manual Pen", field: "manual_penalty", width: 110, filter: false, sortable: false, cellClass: 'text-danger', valueFormatter: params => `-${Math.round(params.value || 0).toLocaleString()}` },
                ]
            },
            {
                headerName: "Final Payout",
                children: [
                    {
                        headerName: "Net Pay",
                        field: "net_pay",
                        pinned: 'right',
                        cellClass: 'fw-bold text-success',
                        valueFormatter: params => `Rs. ${Math.round(params.value || 0).toLocaleString()}`,
                        width: 140,

                        filter: false,
                        sortable: false,
                    },
                    {
                        headerName: "Status",
                        field: "payment_status",
                        pinned: 'right',
                        width: 100,

                        filter: false,
                        sortable: false,
                        cellRenderer: params => (
                            <Tag color={params.value === 'Paid' ? 'success' : 'warning'}>{params.value}</Tag>
                        )
                    },
                    {
                        headerName: "Actions",
                        colId: 'actions',
                        pinned: 'right',
                        width: 80,

                        filter: false,
                        sortable: false,
                        cellRenderer: params => (
                            <div className="d-flex gap-2 align-items-center h-100">
                                {params.data.payment_status === 'Pending' ? (
                                    <Button
                                        type="text"
                                        className="text-success p-0"
                                        icon={<CheckCircleOutlined style={{ fontSize: '18px' }} />}
                                        onClick={() => handlePay(params.data)}
                                    />
                                ) : (
                                    <Tooltip title="View/Edit Payment">
                                        <Button
                                            type="text"
                                            className="text-primary p-0"
                                            icon={<EditOutlined style={{ fontSize: '18px' }} />}
                                            onClick={() => handlePay(params.data, params.data.payment_details)}
                                        />
                                    </Tooltip>
                                )}
                            </div>
                        )
                    }
                ]
            }
        ], []);

        const handlePay = (user, payment = null) => {
            setSelectedUser({ ...user, existing_payment: payment });

            // Map existing or prop adjustments to the expected form format
            const existingAdjustments = (payment?.adjustments || user.raw_adjustments || [])?.map(a => ({
                label: a.label,
                amount: parseFloat(a.amount),
                type: a.type,
                reason: a.reason
            })) || [];

            form.setFieldsValue({
                payment_method: payment ? payment.payment_method : 'bank_transfer',
                payment_date: payment ? dayjs(payment.payment_date) : dayjs(),
                manual_adjustments: existingAdjustments,
                reference: payment ? payment.reference : '',
                notes: payment ? payment.notes : ''
            });
            setIsPayModalOpen(true);
        };

        const handlePrint = () => {
            const originalTitle = document.title;
            const monthName = monthOptions.find(m => m.value === month)?.label || '';
            document.title = `Salary-Slip-${monthName}-${year}-${selectedUser?.name || 'Employee'}`;

            window.print();

            // Restore title after print (timeout to ensure print dialog captures it)
            setTimeout(() => {
                document.title = originalTitle;
            }, 1000);
        };

        const handleUnpay = (user) => {
            modal.confirm({
                title: 'Confirm Cancellation',
                content: `Are you sure you want to cancel the payment for ${user.name}? This will return the status to Pending and remove the payment record.`,
                okText: 'Yes, Cancel Payment',
                okType: 'danger',
                onOk: () => {
                    router.post(route('salary-sheets.unpay'), {
                        id: user.existing_payment?.id,
                        user_id: user.id,
                        month: month,
                        year: year
                    }, {
                        onSuccess: () => {
                            setIsPayModalOpen(false);
                            api.success({ message: 'Success', description: 'Payment cancelled successfully' });
                        }
                    });
                }
            });
        };

        const handleFilter = () => {
            router.get(route('salary-sheets.index'), { month, year }, {
                preserveState: true,
                preserveScroll: true
            });
        };

        const handleConfigSubmit = (values) => {
            setLoading(true);
            router.post(route('payroll.config.update'), { settings: values }, {
                onSuccess: () => {
                    setIsConfigModalOpen(false);
                    api.success({ message: 'Success', description: 'Payroll settings updated successfully' });
                },
                onFinish: () => setLoading(false)
            });
        };

        const submitPayment = (values) => {
            setLoading(true);

            const manualAdjs = values.manual_adjustments || [];
            const bonusTotal = manualAdjs.filter(a => a.type === 'bonus').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            const deductionTotal = manualAdjs.filter(a => a.type === 'deduction').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

            // Calculate final net pay: Base Net Pay (from rowData) + New Bonus Total - New Deduction Total
            // Note: selectedUser.net_pay already had the 'old' adjustments subtracted/added if any.
            // When editing, we replace the whole set of adjustments.
            // A safer way is to use (Gross Salary - Standard Deductions) + bonusTotal - deductionTotal
            const standardDeductions = selectedUser.absent_deduction + selectedUser.undertime_deduction + selectedUser.manual_penalty + selectedUser.total_tax;
            // manual_penalty here might already include existing deduction adjustments if we aren't careful.
            // Let's use the raw values if possible, or just be consistent.

            const netPayCalculated = selectedUser.gross_salary + selectedUser.overtime_bonus + selectedUser.project_points_amount + bonusTotal - (selectedUser.absent_deduction + selectedUser.undertime_deduction + selectedUser.total_tax + deductionTotal);

            const payload = {
                ...values,
                adjustments: manualAdjs,
                user_id: selectedUser.id,
                month: month,
                year: year,
                gross_salary: selectedUser.gross_salary,
                overtime_bonus: selectedUser.overtime_bonus,
                total_deductions: (selectedUser.absent_deduction + selectedUser.undertime_deduction + selectedUser.total_tax + deductionTotal),
                net_pay: netPayCalculated,
                payment_date: values.payment_date.format('YYYY-MM-DD'),
            };

            router.post(route('salary-sheets.pay'), payload, {
                onSuccess: () => {
                    setIsPayModalOpen(false);
                    api.success({ message: 'Success', description: 'Salary payment released successfully' });
                },
                onError: (errors) => {
                    Object.values(errors).forEach(err => {
                        api.error({ message: 'Error', description: err });
                    });
                },
                onFinish: () => setLoading(false)
            });
        };

        const onExport = (type) => {
            if (!gridRef.current?.api) {
                api.error({ message: 'Error', description: 'Grid is not ready for export.' });
                return;
            }

            const fileName = `Salary_Sheet_${months[month - 1]}_${year}`;
            const params = {
                fileName: fileName,
                columnKeys: gridRef.current.api.getAllDisplayedColumns()
                    .map(col => col.getColId())
                    .filter(id => id !== 'actions'),
                processHeaderCallback: (params) => {
                    return params.column.getColDef().headerName;
                }
            };

            if (type === 'csv') {
                gridRef.current.api.exportDataAsCsv(params);
            } else if (type === 'excel') {
                gridRef.current.api.exportDataAsExcel(params);
            }
        };

        const exportItems = [
            { key: 'csv', label: 'Export as CSV' },
            { key: 'excel', label: 'Export as Excel' },
        ];

        return (
            <>
                <Head title="Salary Sheets" />
                {contextHolder}
                {modalContextHolder}
                <div className="container-fluid p-0">
                    <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-2">
                        <Breadcrumb
                            className='breadCrumb'
                            items={[{ title: <Link href="/">Home</Link> }, { title: 'Payroll' }, { title: 'Salary Sheets' }]}
                        />
                        <div className="d-flex gap-2">
                            <Select value={month} onChange={setMonth} options={monthOptions} style={{ width: 130 }} />
                            <Select value={year} onChange={setYear} options={yearOptions} style={{ width: 100 }} />
                            <Button type="primary" onClick={handleFilter}>Filter</Button>
                            <Button
                                icon={<CalendarOutlined />}
                                className="bg-info text-white border-info"
                                onClick={() => {
                                    shiftForm.setFieldsValue({ shifts: appliedShifts });
                                    setIsShiftModalOpen(true);
                                }}
                            >
                                Define Shifts
                            </Button>
                            <Dropdown menu={{ items: exportItems, onClick: ({ key }) => onExport(key) }} placement="bottomRight">
                                <Button icon={<DownloadOutlined />} className="bg-success text-white border-success">
                                    Export
                                </Button>
                            </Dropdown>
                            <Button
                                icon={<SettingOutlined />}
                                onClick={() => {
                                    configForm.setFieldsValue(config);
                                    setIsConfigModalOpen(true);
                                }}
                            >
                                Settings
                            </Button>
                        </div>
                    </div>

                    <div className="card mt-4 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                        <div className="card-body p-0">
                            <div className="ag-grid-wrapper">
                                <AgGridReact
                                    ref={gridRef}
                                    rowData={rowData}
                                    columnDefs={columnDefs}
                                    defaultColDef={{ ...defaultColDef, flex: 1, suppressMenu: true, suppressHeaderMenuButton: true, filter: true, floatingFilter: false }}
                                    theme={gridTheme}
                                    pagination={true}
                                    paginationPageSize={20}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <Modal
                    title={`Release Payment: ${selectedUser?.name}`}
                    open={isPayModalOpen}
                    onCancel={() => setIsPayModalOpen(false)}
                    footer={null}
                    width="80%"
                >
                    <Form form={form} layout="vertical" onFinish={submitPayment}>
                        {selectedUser && (
                            <div className="mb-4">
                                <div className="print-only mb-4 text-center" style={{ display: 'none' }}>
                                    <Title level={2} style={{ margin: 0 }}>Payment Slip: {selectedUser?.name}</Title>
                                    <Text type="secondary" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                        {monthOptions.find(m => m.value === month).label} {year}
                                    </Text>
                                    <Divider style={{ margin: '15px 0' }} />
                                </div>
                                <Card className="bg-light border-0 shadow-sm" bodyStyle={{ padding: '20px' }}>
                                    <div className="bg-white p-3 rounded mb-4 shadow-sm border">
                                        <Text type="secondary" strong className="d-block mb-3 text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                                            Attendance & Productivity Summary
                                        </Text>
                                        <div className="row g-3">
                                            <div className="col-3 text-center border-end">
                                                <Title level={4} className="m-0 text-dark">
                                                    {selectedUser.required_days}D <span style={{ fontSize: '12px', fontWeight: 'normal' }}>/ {selectedUser.total_required_hours.toFixed(0)}H</span>
                                                </Title>
                                                <Text type="secondary" style={{ fontSize: '10px' }}>Expected(Required)</Text>
                                            </div>
                                            <div className="col-3 text-center border-end">
                                                <Title level={4} className="m-0 text-primary">
                                                    {selectedUser.total_worked_hours.toFixed(1)}H
                                                </Title>
                                                <Text type="secondary" style={{ fontSize: '10px' }}>Productive(Worked)</Text>
                                            </div>
                                            <div className="col-3 text-center border-end">
                                                <div className="d-flex flex-column align-items-center">
                                                    <Title level={4} className="m-0 text-danger">
                                                        {selectedUser.absent_days > 0 ? `${selectedUser.absent_days}D` : ''}
                                                        {selectedUser.undertime_hours > 0 ? ` ${selectedUser.undertime_hours.toFixed(1)}H` : ''}
                                                        {selectedUser.late_days > 0 ? ` +${selectedUser.late_days}L` : (selectedUser.absent_days === 0 && selectedUser.undertime_hours === 0 ? '0' : '')}
                                                    </Title>
                                                    <div style={{ fontSize: '9px', color: '#ff4d4f', marginTop: '2px', fontWeight: 'bold' }}>
                                                        {selectedUser.absent_days > 0 ? 'ABS' : ''} {selectedUser.undertime_hours > 0 ? 'UT' : ''} {selectedUser.late_days > 0 ? 'LATE' : ''}
                                                    </div>
                                                </div>
                                                <Text type="secondary" style={{ fontSize: '10px' }}>Missed (Deficit)</Text>
                                            </div>
                                            <div className="col-3 text-center">
                                                <Title level={4} className="m-0 text-success">
                                                    {selectedUser.project_points} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Pts</span>
                                                </Title>
                                                <Text type="secondary" style={{ fontSize: '10px' }}>Incentives(Points)</Text>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between mt-3 pt-3 border-top">
                                            <div className="w-100" style={{ fontSize: '11px' }}>
                                                <div className="row g-2">
                                                    <div className="col-6">
                                                        <div className="d-flex justify-content-between px-2">
                                                            <Text type="secondary">Scheduled / Required:</Text>
                                                            <Text strong>{selectedUser.required_days} Work Days / {selectedUser.total_required_hours.toFixed(0)} Hrs</Text>
                                                        </div>
                                                        <div className="d-flex justify-content-between px-2">
                                                            <Text type="secondary">Actual Presence:</Text>
                                                            <Text strong>{selectedUser.present_days} Days / {selectedUser.late_days} Late</Text>
                                                        </div>
                                                    </div>
                                                    <div className="col-6 border-start">
                                                        <div className="d-flex justify-content-between px-2">
                                                            <Text type="secondary">Total Abs / Leaves:</Text>
                                                            <Text strong>{selectedUser.absent_days} Abs / {selectedUser.leave_days} L</Text>
                                                        </div>
                                                        <div className="d-flex justify-content-between px-2">
                                                            <Text type="secondary">Undertime Hours:</Text>
                                                            <Text strong className="text-danger">-{selectedUser.undertime_hours.toFixed(1)} Hrs</Text>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between mt-2 pt-2 border-top" style={{ fontSize: '9px', color: '#8c8c8c' }}>
                                            <span>Month Calendar: <b>{dayjs(`${year}-${month}-01`).endOf('month').date()} Days (excluding Sat/Sun for Required)</b></span>
                                            <span>System Default: <b>{parseFloat(config?.working_days_override) || calculatedWorkingDays} Days</b></span>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Text strong style={{ fontSize: '16px' }}>Gross Salary Breakdown</Text>
                                        <Text strong style={{ fontSize: '16px' }}>Rs. {selectedUser.gross_salary.toLocaleString()}</Text>
                                    </div>

                                    <Divider style={{ margin: '12px 0' }} />

                                    {selectedUser.existing_payment && (
                                        <div className="bg-white border rounded p-2 mb-3" style={{ fontSize: '12px', borderStyle: 'dashed !important' }}>
                                            <Text strong className="d-block mb-1 text-primary">Payment Record Info:</Text>
                                            <div className="row g-2">
                                                <div className="col-6">
                                                    <b>Method:</b> {selectedUser.existing_payment.payment_method.replace('_', ' ')}
                                                </div>
                                                <div className="col-6">
                                                    <b>Date:</b> {dayjs(selectedUser.existing_payment.payment_date).format('DD MMM')}
                                                </div>
                                                <div className="col-12">
                                                    <b>Ref:</b> {selectedUser.existing_payment.reference || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Benefits/Leaves Section */}
                                    {selectedUser.breakdown.benefits.length > 0 && (
                                        <div className="mb-3">
                                            <Text type="secondary" strong className="d-block mb-2">Benefits & Approved Leaves</Text>
                                            {selectedUser.breakdown.benefits.map((b, idx) => (
                                                <div key={`benefit-${idx}`} className="d-flex justify-content-between mb-1">
                                                    <Text style={{ fontSize: '13px' }}>
                                                        <CheckCircleFilled style={{ color: '#52c41a', marginRight: '8px' }} />
                                                        {b.label}
                                                        {b.count > 0 && <small className="text-muted ms-1">({b.count}{b.unit || 'd'})</small>}
                                                    </Text>
                                                    <Text className="text-success" style={{ fontSize: '13px' }}>
                                                        {b.label === 'Approved Leaves' ? (
                                                            <span style={{ textDecoration: 'line-through', color: '#ff4d4f', opacity: 0.6 }}>Rs. {b.amount.toLocaleString()}</span>
                                                        ) : (
                                                            <span>Rs. {b.amount.toLocaleString()}</span>
                                                        )}
                                                        <span className="ms-2">Covered</span>
                                                    </Text>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Penalties Section */}
                                    <div className="mb-3">
                                        <Text type="secondary" strong className="d-block mb-2">Penalties & Deductions</Text>
                                        {selectedUser.breakdown.penalties.map((p, idx) => (
                                            <div key={`penalty-${idx}`} className="d-flex justify-content-between mb-1">
                                                <Text style={{ fontSize: '13px' }}>
                                                    <CheckCircleFilled style={{ color: p.amount > 0 ? '#ff4d4f' : '#52c41a', marginRight: '8px' }} />
                                                    {p.label}
                                                    {p.count > 0 && <small className="text-muted ms-1">({p.count}{p.unit || 'd'} × {p.rate.toLocaleString()})</small>}
                                                    {p.reason && <small className="text-muted ms-1">- {p.reason}</small>}
                                                </Text>
                                                <Text type="danger" style={{ fontSize: '13px' }}>- Rs. {p.amount.toLocaleString()}</Text>
                                            </div>
                                        ))}
                                        {selectedUser.breakdown.penalties.length === 0 && <Text type="secondary" italic style={{ fontSize: '12px' }}>No penalties recorded.</Text>}
                                    </div>

                                    {/* Taxes Section */}
                                    <div className="mb-3">
                                        <Text type="secondary" strong className="d-block mb-2">Tax Deductions</Text>
                                        {selectedUser.breakdown.taxes.map((t, idx) => (
                                            <div key={`tax-${idx}`} className="d-flex justify-content-between mb-1">
                                                <Text style={{ fontSize: '13px' }}>
                                                    <CheckCircleFilled style={{ color: '#ff4d4f', marginRight: '8px' }} />
                                                    {t.name} <small className="text-muted">({t.rate})</small>
                                                </Text>
                                                <Text type="danger" style={{ fontSize: '13px' }}>- Rs. {t.amount.toLocaleString()}</Text>
                                            </div>
                                        ))}
                                        {selectedUser.breakdown.taxes.length === 0 && <Text type="secondary" italic style={{ fontSize: '12px' }}>No taxes applicable.</Text>}
                                    </div>

                                    {/* Manual Adjustments Display */}
                                    {((watchedAdjustments?.length || 0) > 0) && (
                                        <div className="mb-3">
                                            <Text type="secondary" strong className="d-block mb-2">Manual Adjustments</Text>
                                            {watchedAdjustments.map((a, idx) => a && (
                                                <div key={`watch-adj-${idx}`} className="d-flex justify-content-between mb-1">
                                                    <Text style={{ fontSize: '13px' }}>
                                                        <CheckCircleFilled style={{ color: a.type === 'bonus' || a.type === 'points' ? '#52c41a' : '#ff4d4f', marginRight: '8px' }} />
                                                        {a.label || (a.type === 'points' ? 'Project Points' : 'Adjustment')}
                                                        {a.type === 'points' && <small className="text-muted ms-1">({a.amount} pts)</small>}
                                                    </Text>
                                                    <Text className={a.type === 'bonus' || a.type === 'points' ? "text-success" : "text-danger"} style={{ fontSize: '13px' }}>
                                                        {a.type === 'bonus' || a.type === 'points' ? '+' : '-'} Rs. {(a.type === 'points' ? (parseFloat(a.amount) * selectedUser.point_rate) : (parseFloat(a.amount) || 0)).toLocaleString()}
                                                    </Text>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Divider style={{ margin: '15px 0' }} />
                                    <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded" style={{ border: '1px solid #f0f0f0' }}>
                                        <div>
                                            <Text strong style={{ fontSize: '14px' }}>Final Net Payable</Text>
                                            <div className="text-muted" style={{ fontSize: '11px' }}>{monthOptions.find(m => m.value === month).label} {year}</div>
                                        </div>
                                        <Title level={3} className="m-0 text-success">
                                            Rs. {Math.round(
                                                selectedUser.gross_salary +
                                                selectedUser.overtime_bonus +
                                                selectedUser.project_points_amount +
                                                (watchedAdjustments?.filter(a => a?.type === 'bonus').reduce((acc, curr) => acc + (parseFloat(curr?.amount) || 0), 0) || 0) -
                                                (selectedUser.absent_deduction + selectedUser.undertime_deduction + selectedUser.manual_penalty + selectedUser.total_tax + (watchedAdjustments?.filter(a => a?.type === 'deduction').reduce((acc, curr) => acc + (parseFloat(curr?.amount) || 0), 0) || 0))
                                            ).toLocaleString()}
                                        </Title>
                                    </div>
                                </Card>
                            </div>
                        )}

                        <Divider orientation="left" style={{ fontSize: '13px', color: '#8c8c8c' }}>Manual Adjustments (Bonuses, Penalties, etc.)</Divider>
                        <Form.List name="manual_adjustments">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <div key={key} className="row g-2 mb-2 align-items-top bg-light p-2 rounded mx-0">
                                            <div className="col-md-4">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'label']}
                                                    rules={[{ required: true, message: 'Label required' }]}
                                                >
                                                    <Input placeholder="e.g. Performance Bonus" />
                                                </Form.Item>
                                            </div>
                                            <div className="col-md-3">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'type']}
                                                    initialValue="bonus"
                                                >
                                                    <Select>
                                                        <Select.Option value="bonus">Bonus (+)</Select.Option>
                                                        <Select.Option value="deduction">Deduction (-)</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </div>
                                            <div className="col-md-3">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'amount']}
                                                    rules={[{ required: true, message: 'Amount required' }]}
                                                >
                                                    <InputNumber style={{ width: '100%' }} min={0} placeholder="Amount" />
                                                </Form.Item>
                                            </div>
                                            <div className="col-md-2 text-end">
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => remove(name)}
                                                />
                                            </div>
                                            <div className="col-12 mt-0">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'reason']}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Input placeholder="Optional reason/memo..." size="small" />
                                                </Form.Item>
                                            </div>
                                        </div>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusCircleOutlined />}>
                                            Add Manual Adjustment
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>

                        <div className="row">
                            <div className="col-md-6">
                                <Form.Item name="payment_method" label="Payment Method" rules={[{ required: true }]}>
                                    <Select>
                                        <Select.Option value="bank_transfer">Bank Transfer</Select.Option>
                                        <Select.Option value="cash">Cash</Select.Option>
                                        <Select.Option value="cheque">Cheque</Select.Option>
                                        <Select.Option value="digital_wallet">Digital Wallet</Select.Option>
                                    </Select>
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item name="payment_date" label="Payment Date" rules={[{ required: true }]}>
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </div>
                        </div>

                        <Form.Item name="reference" label="Reference / Transaction ID">
                            <Input placeholder="e.g. TXN-123456" />
                        </Form.Item>

                        <Form.Item name="notes" label="Notes">
                            <Input.TextArea placeholder="Internal memo..." rows={2} />
                        </Form.Item>

                        <div className="d-flex justify-content-between gap-2 mt-4 no-print">
                            <div className="d-flex gap-2">
                                <Button
                                    icon={<PrinterOutlined />}
                                    onClick={handlePrint}
                                    type="default"
                                >
                                    Print Salary Slip
                                </Button>
                                {selectedUser?.existing_payment && (
                                    <Button
                                        danger
                                        type="primary"
                                        htmlType="button"
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnpay(selectedUser);
                                        }}
                                    >
                                        Unpay / Cancel
                                    </Button>
                                )}
                            </div>
                            <div className="d-flex gap-2">
                                <Button onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
                                <Button type="primary" htmlType="submit" loading={loading} icon={<DollarOutlined />}>
                                    {selectedUser?.existing_payment ? 'Update Payment' : 'Release Salary'}
                                </Button>
                            </div>
                        </div>
                    </Form>
                </Modal >

                <Modal
                    title="Payroll Global Settings"
                    open={isConfigModalOpen}
                    onCancel={() => setIsConfigModalOpen(false)}
                    footer={null}
                    width={500}
                >
                    <Form form={configForm} layout="vertical" onFinish={handleConfigSubmit}>
                        <div className="alert alert-info mb-4" style={{ fontSize: '13px' }}>
                            These settings apply globally to all salary calculations for {monthOptions.find(m => m.value === month).label} {year}.
                        </div>

                        <Form.Item
                            name="absent_penalty_rate"
                            label="Absent Penalty Rate (PKR per hour)"
                            extra="If not set, it defaults to (Gross Salary / Total Required Hours)"
                        >
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 500" />
                        </Form.Item>

                        <Form.Item
                            name="working_days_override"
                            label="Standard Working Days (Override)"
                            extra={`Only used if no shifts are assigned. Defaults to weekdays in month (${calculatedWorkingDays}).`}
                        >
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 22" />
                        </Form.Item>


                        <Form.Item
                            name="undertime_penalty_per_hour"
                            label="Undertime Penalty (PKR per hour)"
                            extra="Deducted for each hour of undertime calculated in attendance"
                        >
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 200" />
                        </Form.Item>

                        <Form.Item
                            name="overtime_bonus_per_hour"
                            label="Overtime Bonus (PKR per hour)"
                            extra="Added for each hour of overtime calculated in attendance"
                        >
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 300" />
                        </Form.Item>

                        <Form.Item
                            name="project_point_rate"
                            label="Project Point Rate (PKR per point)"
                            extra="Applied to manual 'Project Points' adjustments"
                        >
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 100" />
                        </Form.Item>

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button onClick={() => setIsConfigModalOpen(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Save Configuration
                            </Button>
                        </div>
                    </Form>
                </Modal>

                <Modal
                    title="Define Monthly Shift Ranges"
                    open={isShiftModalOpen}
                    onCancel={() => setIsShiftModalOpen(false)}
                    onOk={() => {
                        shiftForm.validateFields().then(values => {
                            setLoading(true);
                            router.post(route('salary-sheets.shifts.save'), {
                                month,
                                year,
                                shifts: values.shifts
                            }, {
                                onSuccess: () => {
                                    setLoading(false);
                                    setIsShiftModalOpen(false);
                                    api.success({ message: 'Shifts Saved', description: 'Monthly shift rules persisted and applied.' });
                                },
                                onError: () => setLoading(false)
                            });
                        });
                    }}
                    width={700}
                >
                    <div className="alert alert-warning mb-4" style={{ fontSize: '12px' }}>
                        Define date ranges for shifts in {monthOptions.find(m => m.value === month)?.label}.
                        Dates outside these ranges will use the default calculation.
                    </div>
                    <Form form={shiftForm} layout="vertical">
                        <Form.List name="shifts">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <div key={key} className="row g-2 mb-3 bg-light p-3 rounded mx-0">
                                            <div className="col-md-5">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'shift_id']}
                                                    label="Shift"
                                                    rules={[{ required: true, message: 'Select shift' }]}
                                                >
                                                    <Select
                                                        options={shifts.map(s => ({
                                                            label: `${s.name} (${s.start_time} - ${s.end_time})`,
                                                            value: s.id
                                                        }))}
                                                        placeholder="Select Shift"
                                                    />
                                                </Form.Item>
                                            </div>
                                            <div className="col-md-3">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'start_day']}
                                                    label="Start Day"
                                                    rules={[{ required: true, message: 'Req' }]}
                                                >
                                                    <InputNumber min={1} max={31} placeholder="1" style={{ width: '100%' }} />
                                                </Form.Item>
                                            </div>
                                            <div className="col-md-3">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'end_day']}
                                                    label="End Day"
                                                    rules={[{ required: true, message: 'Req' }]}
                                                >
                                                    <InputNumber min={1} max={31} placeholder="31" style={{ width: '100%' }} />
                                                </Form.Item>
                                            </div>
                                            <div className="col-md-1 d-flex align-items-center pt-3">
                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusCircleOutlined />}>
                                        Add Shift Range
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    </Form>
                </Modal>

                <style>{`
                    @media print {
                        @page {
                            margin: 0.5cm;
                            size: auto;
                        }
                        html, body {
                            height: auto !important;
                            overflow: visible !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        body * {
                            visibility: hidden;
                            height: 0;
                        }
                        .ant-modal-root, .ant-modal-root * {
                            visibility: visible;
                            height: auto;
                        }
                        .ant-modal-mask, .ant-modal-wrap {
                            position: static !important;
                        }
                        .ant-modal {
                            top: 0 !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                        .ant-modal-content {
                            position: static !important;
                            width: 100% !important;
                            box-shadow: none !important;
                            border: none !important;
                            padding: 10px !important;
                        }
                        .no-print, .ant-modal-close, .ant-btn, .print-hidden {
                            display: none !important;
                        }
                        .print-only {
                            display: block !important;
                        }
                        .ant-modal-body {
                            padding: 0 !important;
                        }
                        form .ant-divider {
                            margin: 15px 0 !important;
                        }
                        .ant-card {
                            border: 1px solid #f0f0f0 !important;
                            background: transparent !important;
                            break-inside: avoid;
                            margin-bottom: 20px !important;
                        }
                    }
                `}</style>
            </>
        );
    };

SalarySheet.layout = (page) => <MainLayout children={page} />;
export default SalarySheet;
