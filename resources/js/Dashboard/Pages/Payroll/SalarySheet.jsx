import { useState, useMemo, useRef, useEffect } from 'react';
import { Head, Link, Breadcrumb, EyeOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, DownloadOutlined, DollarOutlined, SettingOutlined, ApartmentOutlined, CheckCircleFilled, router, notification, PlusCircleOutlined, PrinterOutlined, CalendarOutlined, dayjs, WalletOutlined, HomeOutlined } from "@shared/ui";
import { AgGridReact, gridTheme, defaultColDef } from "@agConfig/AgGridConfig";
import { Select, Space, Button, Modal, Form, Input, Checkbox, InputNumber, DatePicker, Card, Typography, Divider, Tag, Tooltip, Dropdown, Menu, Collapse, Empty } from 'antd';
import MainLayout from "@layout";
import { calc } from 'antd/es/theme/internal';

const { Text, Title } = Typography;

const SalarySheet =
    ({ users, attendances, penalties, payments, config, selectedMonth, selectedYear, selectedBatchId: propBatchId, leaveRequests, adjustments, projectPoints, shifts, monthlyShiftAssignments, holidays }) => {
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
        const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);

        // Sync local state when prop changes (e.g. month change)
        useEffect(() => {
            setAppliedShifts(monthlyShiftAssignments || []);
        }, [monthlyShiftAssignments]);

        useEffect(() => {
            if (month !== selectedMonth || year !== selectedYear) {
                handleFilter();
            }
        }, [month, year]);
        const watchedAdjustments = Form.useWatch('manual_adjustments', form);
        const watchedGroups = Form.useWatch('groups', shiftForm);

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

        const usersByStatus = useMemo(() => {
            const groups = {};
            users.forEach(u => {
                const s = u.status || 'active';
                if (!groups[s]) groups[s] = [];
                groups[s].push(u);
            });
            return groups;
        }, [users]);

        const getInitialGroups = () => {
            let baseGroups = [];
            if (appliedShifts && appliedShifts.length > 0) {
                const userConfigs = {};
                appliedShifts.forEach(s => {
                    if (s.user_id !== null) {
                        const range = { shift_id: s.shift_id, start_day: s.start_day, end_day: s.end_day };
                        if (!userConfigs[s.user_id]) userConfigs[s.user_id] = [];
                        userConfigs[s.user_id].push(range);
                    }
                });

                const groupedByConfig = {};
                Object.entries(userConfigs).forEach(([userId, ranges]) => {
                    const sorted = [...ranges].sort((a, b) => a.start_day - b.start_day || a.shift_id - b.shift_id);
                    const key = JSON.stringify(sorted);
                    if (!groupedByConfig[key]) groupedByConfig[key] = { ranges: sorted, user_ids: [] };
                    groupedByConfig[key].user_ids.push(parseInt(userId));
                });

                baseGroups = Object.values(groupedByConfig).map(group => ({
                    ranges: group.ranges,
                    user_ids: group.user_ids
                }));
            }

            // Always ensure we have at least 1 group (Group A)
            // If we have fewer, pad with an empty group
            while (baseGroups.length < 1) {
                baseGroups.push({ ranges: [{}], user_ids: [] });
            }
            return baseGroups;
        };

        useEffect(() => {
            if (isShiftModalOpen) {
                shiftForm.setFieldsValue({ groups: getInitialGroups() });
            }
        }, [isShiftModalOpen, appliedShifts]);

        const unassignedUsers = useMemo(() => {
            const assignedUserIds = new Set();
            (watchedGroups || getInitialGroups()).forEach(g => {
                (g.user_ids || []).forEach(id => assignedUserIds.add(id));
            });
            return users.filter(u => !assignedUserIds.has(u.id));
        }, [users, watchedGroups, isShiftModalOpen]);

        const unassignedUsersByStatus = useMemo(() => {
            const groups = {};
            unassignedUsers.forEach(u => {
                const s = u.status || 'active';
                if (!groups[s]) groups[s] = [];
                groups[s].push(u);
            });
            return groups;
        }, [unassignedUsers]);

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

            // Pre-calculate user groups for display
            const initialGroups = getInitialGroups();
            const userGroupMap = {};
            initialGroups.forEach((group, index) => {
                const groupName = `Group ${String.fromCharCode(65 + index)}`;
                (group.user_ids || []).forEach(uid => {
                    userGroupMap[uid] = groupName;
                });
            });

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
                let totalMissingAttendanceDays = 0;
                let presentDays = 0;
                let absentHours = 0;
                let undertimeHours = 0;
                let homeOvertimeHours = 0;
                let officeOvertimeHours = 0;
                let approvedLeaveDays = 0;
                let absentDays = 0;
                let requiredDays = 0;

                let assignedShiftDetails = [];
                let hasMatchedAnyShift = false;

                for (let d = 1; d <= lastDayOfMonth; d++) {
                    const dateObj = startOfMonth.date(d);
                    const dateStr = dateObj.format('YYYY-MM-DD');
                    const dayName = dateObj.format('dddd');

                    // Skip weekends entirely for payroll logic (Sat/Sun are off)
                    if (dayName === 'Saturday' || dayName === 'Sunday') continue;

                    // Skip Holidays entirely for payroll logic
                    const isHoliday = (holidays || []).some(h => dayjs(h.date).isSame(dateObj, 'day'));
                    if (isHoliday) continue;

                    // Check if on approved leave
                    const onLeave = userLeaves.find(leave => {
                        const leaveStart = dayjs(leave.start_date);
                        const leaveEnd = dayjs(leave.end_date);
                        return dateObj.isSameOrAfter(leaveStart, 'day') && dateObj.isSameOrBefore(leaveEnd, 'day');
                    });

                    let dayNetWorkedMinsHome = 0;
                    let dayNetWorkedMinsOffice = 0;
                    const att = userAttendances.find(a => a.date === dateStr);

                    // Manual Outside Hours Calculation (Approved only)
                    if (att && Array.isArray(att.total_outside_hours)) {
                        att.total_outside_hours.forEach(m => {
                            if (m.status === 'approved' || m.status === 'Approved') {
                                const mins = getMinutes(m.manual_hours);
                                if (m.work_from === 'home') dayNetWorkedMinsHome += mins;
                                else dayNetWorkedMinsOffice += mins;
                            }
                        });
                    }

                    // Match shift for the day:
                    // Priority 1: User-specific assignment for this range
                    // Priority 2: Global monthly assignment for this range
                    let shiftRange = appliedShifts.find(s => d >= s.start_day && d <= s.end_day && s.user_id === user.id);
                    if (!shiftRange) {
                        shiftRange = appliedShifts.find(s => d >= s.start_day && d <= s.end_day && !s.user_id);
                    }

                    let shift = null;
                    if (shiftRange) {
                        hasMatchedAnyShift = true;
                        shift = shifts.find(s => s.id === shiftRange.shift_id);
                        if (shift) {
                            const detail = `${shift.name}: ${shift.start_time} - ${shift.end_time}`;
                            if (!assignedShiftDetails.includes(detail)) {
                                assignedShiftDetails.push(detail);
                            }
                        }
                    }

                    if (onLeave) {
                        approvedLeaveDays++;
                    }

                    if (shift) {
                        const shiftDur = getDuration(shift.start_time, shift.end_time) - (shift.total_break_minutes || 0);
                        totalRequiredMinutes += shiftDur;
                        requiredDays++;

                        let isPresent = (att && (att.status?.toLowerCase() === 'present' || att.status?.toLowerCase() === 'marked'));

                        if (onLeave) {
                            // On leave: Count as worked minutes to avoid deductions
                            totalActualWorkedMinutes += shiftDur;
                            presentDays++; 
                            // we don't count OT for leaves unless they worked, but here we prioritize leave
                        } else if (isPresent) {
                            presentDays++;

                            // Extract check_in/check_out from the clock array segments
                            if (Array.isArray(att.clock) && att.clock.length > 0) {
                                att.clock.forEach(entry => {
                                    const checkIn = entry.check_in;
                                    const checkOut = entry.check_out;
                                    const workedFrom = entry.work_from || 'office';

                                    if (checkIn && checkOut) {
                                        let segDur = getDuration(checkIn, checkOut);
                                        // Subtract breaks from this segment
                                        if (entry.break) {
                                            const bStart = entry.break.break_start;
                                            const bEnd = entry.break.break_end;
                                            if (bStart && bEnd) {
                                                segDur -= getDuration(bStart, bEnd);
                                            }
                                            // Handle multiple breaks in segment if schema allows break_start_2 etc.
                                            let bIdx = 2;
                                            while (entry.break[`break_start_${bIdx}`]) {
                                                const bs = entry.break[`break_start_${bIdx}`];
                                                const be = entry.break[`break_end_${bIdx}`];
                                                if (bs && be) segDur -= getDuration(bs, be);
                                                bIdx++;
                                            }
                                        }
                                        const finalSegDur = Math.max(0, segDur);
                                        if (workedFrom === 'home') dayNetWorkedMinsHome += finalSegDur;
                                        else dayNetWorkedMinsOffice += finalSegDur;
                                    }
                                });
                            } else {
                                // Fallback for legacy flat structure
                                const checkIn = att.check_in;
                                const checkOut = att.check_out;
                                const workedFrom = att.worked_from || 'office';
                                const workedDur = (checkIn && checkOut) ? getDuration(checkIn, checkOut) : 0;

                                if (workedFrom === 'home') dayNetWorkedMinsHome += workedDur;
                                else dayNetWorkedMinsOffice += workedDur;
                            }

                            // Late calculation (Check only the first check-in of the day)
                            const firstCheckIn = Array.isArray(att.clock) && att.clock.length > 0 ? att.clock[0].check_in : att.check_in;
                            if (firstCheckIn) {
                                const sTotal = getMinutes(shift.start_time);
                                const aTotal = getMinutes(firstCheckIn);
                                const lateGraceMins = parseInt(config?.attendance_late_grace_minutes || 0);
                                if (aTotal > (sTotal + lateGraceMins)) {
                                    totalLateDays++;
                                }
                            }

                            // Missing Attendance Detection
                            const hasCheckIn = Array.isArray(att.clock) ? att.clock.some(c => c.check_in) : !!att.check_in;
                            const hasCheckOut = Array.isArray(att.clock) ? att.clock.some(c => c.check_out) : !!att.check_out;
                            if (!hasCheckIn || !hasCheckOut) {
                                totalMissingAttendanceDays++;
                            }

                        } else {
                            // Absent
                            absentDays++;
                            absentHours += shiftDur / 60;
                        }

                        const totalDayWorkedMins = dayNetWorkedMinsHome + dayNetWorkedMinsOffice;
                        if (!onLeave) {
                            totalActualWorkedMinutes += totalDayWorkedMins;
                        }

                        // Calculate Overtime / Undertime
                        if (!onLeave && isPresent && totalDayWorkedMins < shiftDur) {
                            undertimeHours += (shiftDur - totalDayWorkedMins) / 60;
                        } else if (totalDayWorkedMins > shiftDur) {
                            // Distribute excess to overtime
                            let remainingShiftDur = shiftDur;
                            let remainingOfficeMins = dayNetWorkedMinsOffice;
                            let deductOffice = Math.min(remainingOfficeMins, remainingShiftDur);
                            remainingOfficeMins -= deductOffice;
                            remainingShiftDur -= deductOffice;

                            let remainingHomeMins = dayNetWorkedMinsHome;
                            let deductHome = Math.min(remainingHomeMins, remainingShiftDur);
                            remainingHomeMins -= deductHome;
                            remainingShiftDur -= deductHome;

                            officeOvertimeHours += remainingOfficeMins / 60;
                            homeOvertimeHours += remainingHomeMins / 60;
                        } else if (!isPresent && !onLeave && totalDayWorkedMins > 0) {
                            // Absent but had manual hours -> treat manual hours as overtime
                            officeOvertimeHours += dayNetWorkedMinsOffice / 60;
                            homeOvertimeHours += dayNetWorkedMinsHome / 60;
                        }

                    } else {
                        // User has no shift on this day (e.g. they worked on weekend/holiday)
                        const totalDayWorkedMins = dayNetWorkedMinsHome + dayNetWorkedMinsOffice;
                        totalActualWorkedMinutes += totalDayWorkedMins;
                        officeOvertimeHours += dayNetWorkedMinsOffice / 60;
                        homeOvertimeHours += dayNetWorkedMinsHome / 60;
                    }
                }

                // Fallback to standard 22 days/8 hours if no shifts assigned
                let finalRequiredMinutes = totalRequiredMinutes;
                let finalRequiredDays = requiredDays;
                if (finalRequiredMinutes === 0) {
                    finalRequiredDays = calculatedWorkingDays;
                    finalRequiredMinutes = finalRequiredDays * 8 * 60;
                }

                const totalRequiredHours = finalRequiredMinutes / 60;
                const totalWorkedHours = totalActualWorkedMinutes / 60;

                // Dynamic Rates Calculation Strategy
                // User requirement: basic salary divide by total hours
                const hourlyRate = (totalRequiredHours > 0) ? (baseSalary / totalRequiredHours) : 0;
                const undertimeRate = hourlyRate;
                const absentRate = hourlyRate;

                const homeOvertimeRate = hourlyRate * 2.0;
                const officeOvertimeRate = hourlyRate * 2.5;

                const absentDeduction = absentHours * absentRate;
                const undertimeDeduction = undertimeHours * undertimeRate;

                const homeOvertimeBonus = homeOvertimeHours * homeOvertimeRate;
                const officeOvertimeBonus = officeOvertimeHours * officeOvertimeRate;
                const totalOvertimeBonus = homeOvertimeBonus + officeOvertimeBonus;

                // Late Penalty Calculation
                const lateGraceCount = parseInt(config?.late_grace_count || 0);
                const latePenaltyPerDay = parseFloat(config?.late_penalty_per_day || 0);
                const taxableLateDays = Math.max(0, totalLateDays - lateGraceCount);
                const latePenaltyDeduction = taxableLateDays * latePenaltyPerDay;

                // Missing Attendance Penalty Calculation (Deactivated as requested)
                const taxableMissingAttendanceDays = 0;
                const missingAttendancePenaltyDeduction = 0;

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

                const hasNoShift = !hasMatchedAnyShift;
                // User objectives: Isolation of adjustments from main grid.
                // We keep standard calculations based on attendance, overtime and points.
                const totalDeductions = hasNoShift ? 0 : (absentDeduction + undertimeDeduction + latePenaltyDeduction + missingAttendancePenaltyDeduction + totalManualPenalty + totalTax);
                const netPay = hasNoShift ? 0 : Math.max(0, grossSalary + totalOvertimeBonus + manualPointsTotal + projectPointsAmount - totalDeductions);

                const payment = payments.find(p => p.user_id === user.id);

                return {
                    ...user,
                    base_salary: baseSalary,
                    gross_salary: hasNoShift ? 0 : grossSalary,
                    shift_group: userGroupMap[user.id] || "No Group Assigned",
                    assigned_shift: assignedShiftDetails.length > 0 ? assignedShiftDetails.join(" / ") : "No Shift Assigned",
                    has_no_shift: hasNoShift,
                    present_days: presentDays,
                    leave_days: approvedLeaveDays,
                    absent_days: absentDays,
                    required_days: finalRequiredDays,
                    absent_hours: absentHours,
                    undertime_hours: undertimeHours,
                    late_days: totalLateDays,
                    missing_attendance_days: totalMissingAttendanceDays,
                    total_required_hours: totalRequiredHours,
                    total_worked_hours: totalWorkedHours,
                    hourly_rate: hourlyRate,

                    // Detailed Breakdown for Modal
                    breakdown: {
                        benefits: [
                            { label: 'Approved Leaves', count: approvedLeaveDays, amount: 0, unit: 'd' },
                            { label: 'Home Overtime Bonus', count: homeOvertimeHours.toFixed(2), rate: homeOvertimeRate, amount: homeOvertimeBonus, unit: 'hrs', status: 'Bonus' },
                            { label: 'Office Overtime Bonus', count: officeOvertimeHours.toFixed(2), rate: officeOvertimeRate, amount: officeOvertimeBonus, unit: 'hrs', status: 'Bonus' },
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
                            { label: 'Late Arrival Penalty (Per Day)', count: taxableLateDays, rate: latePenaltyPerDay, amount: latePenaltyDeduction, unit: 'days' },
                            ...manualPenaltiesBreakdown.map((p, i) => ({ label: `Manual Penalty: ${p.type}`, reason: p.reason, amount: p.amount, key: `manual-${i}` })),
                            ...userAdjustments.filter(a => a.type === 'deduction').map((a, i) => ({ label: a.label, reason: a.reason, amount: parseFloat(a.amount), key: `adj-d-${i}` }))
                        ].filter(p => p.amount > 0),
                        taxes: taxesBreakdown
                    },

                    absent_deduction: absentDeduction,
                    undertime_deduction: undertimeDeduction,
                    less_hours_penalty: absentDeduction + undertimeDeduction,
                    late_penalty_deduction: latePenaltyDeduction,
                    missing_attendance_penalty_deduction: missingAttendancePenaltyDeduction,
                    overtime_bonus: totalOvertimeBonus,
                    overtime_hours: homeOvertimeHours + officeOvertimeHours,
                    total_extra_earnings: 0,
                    manual_penalty: totalManualPenalty,
                    bonus_total: bonusTotal,
                    adjustment_deduction: deductionTotal,
                    total_tax: totalTax,
                    total_deductions: totalDeductions,
                    net_pay: netPay,
                    payment_status: payment ? payment.status : 'Pending',
                    payment_method: payment ? payment.payment_method : null,
                    payment_date: payment ? payment.payment_date : null,
                    reference: payment ? payment.reference : null,
                    payment_details: payment,
                    raw_adjustments: userAdjustments,
                    point_rate: pointRate,
                    project_points: userProjectPoints,
                    project_points_amount: projectPointsAmount
                };
            }).filter(Boolean);
        }, [users, attendances, penalties, payments, adjustments, config, leaveRequests, month, year, appliedShifts, shifts, holidays]);

        const columnDefs = useMemo(() => {
            return [
                { headerName: "Group", field: "shift_group", rowGroup: true, hide: true },
                {
                    headerName: "Employee",
                    field: "name",
                    pinned: 'left',
                    width: 200,
                    flex: 1
                },
                {
                    headerName: "Emp. Status",
                    field: "status",
                    width: 110,
                    cellRenderer: params => (
                        <Tag color={params.value === 'active' ? 'success' : 'error'}>
                            {params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : 'N/A'}
                        </Tag>
                    )
                },
                {
                    headerName: "Assigned Shift",
                    field: "assigned_shift",
                    width: 250,
                    cellRenderer: params => <Tag color="processing" style={{ whiteSpace: 'normal', height: 'auto', padding: '4px 8px' }}>{params.value}</Tag>
                },
                {
                    headerName: "Required Hrs",
                    field: "total_required_hours",
                    valueFormatter: params => params.value?.toFixed(1),
                    width: 110,
                    cellClass: 'text-primary fw-bold text-center',
                    filter: false,
                    sortable: false
                },
                {
                    headerName: "Recorded Hrs",
                    field: "total_worked_hours",
                    valueFormatter: params => params.value?.toFixed(1),
                    width: 110,
                    cellClass: 'text-success fw-bold text-center',
                    filter: false,
                    sortable: false
                },
                {
                    headerName: "Basic Salary",
                    field: "base_salary",
                    width: 120,
                    valueFormatter: params => Math.round(params.value || 0).toLocaleString(),
                    filter: false,
                    sortable: false
                },
                {
                    headerName: "Gross Salary",
                    field: "gross_salary",
                    width: 120,
                    valueFormatter: params => Math.round(params.value || 0).toLocaleString(),
                    filter: false,
                    sortable: false
                },
                {
                    headerName: "Overtime",
                    field: "overtime_hours",
                    width: 100,
                    cellClass: 'text-success fw-bold',
                    valueFormatter: params => `${(params.value || 0).toFixed(1)} hrs`,
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
                    width: 130,
                    filter: false,
                    sortable: false,
                    cellClass: 'fw-bold'
                },
                {
                    headerName: "Deductions",
                    children: [
                        {
                            headerName: "Taxes",
                            field: "total_tax",
                            minWidth: 150,
                            flex: 3,
                            filter: false,
                            sortable: false,
                            cellRenderer: params => {
                                const taxes = params.data.breakdown?.taxes || [];
                                if (taxes.length === 0) return <Text type="secondary">No Tax</Text>;
                                return (
                                    <div style={{ fontSize: '12px', lineHeight: '1.2', display: 'flex', flexWrap: 'nowrap', gap: '4px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        {taxes.map((t, i) => (
                                            <Tag key={i} color="red" style={{ fontSize: '10px', margin: 0, flexShrink: 0 }}>
                                                {t.name}: {Math.round(t.amount).toLocaleString()}
                                            </Tag>
                                        ))}
                                    </div>
                                );
                            }
                        },
                        { headerName: "Late Pen", field: "late_penalty_deduction", width: 120, filter: false, sortable: false, cellClass: 'text-danger', valueFormatter: params => `-${Math.round(params.value || 0).toLocaleString()}` },
                        { headerName: "Less Hours Pen", field: "less_hours_penalty", width: 130, filter: false, sortable: false, cellClass: 'text-danger', valueFormatter: params => `-${Math.round(params.value || 0).toLocaleString()}` },
                        { headerName: "Manual Pen", field: "manual_penalty", width: 120, filter: false, sortable: false, cellClass: 'text-danger', valueFormatter: params => `-${Math.round(params.value || 0).toLocaleString()}` },
                    ]
                },
                {
                    headerName: "Final Payout",
                    children: [
                        {
                            headerName: "Net Pay",
                            field: "net_pay",
                            cellClass: 'fw-bold text-success',
                            valueFormatter: params => `Rs. ${Math.round(params.value || 0).toLocaleString()}`,
                            width: 140,
                            filter: false,
                            sortable: false, pinned: 'right',
                        },
                        {
                            headerName: "Status",
                            field: "payment_status",
                            width: 110,
                            filter: false,
                            sortable: false, pinned: 'right',
                            cellRenderer: params => {
                                const status = params.value?.toLowerCase();
                                const colorMap = {
                                    'paid': 'success',
                                    'processed': 'processing',
                                    'pending': 'warning',
                                    'failed': 'error'
                                };
                                return <Tag color={colorMap[status] || 'default'}>{params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : 'Pending'}</Tag>
                            }
                        },
                        {
                            headerName: "Actions",
                            colId: 'actions',
                            pinned: 'right',
                            width: 100,
                            suppressSizeToFit: true,
                            filter: false,
                            sortable: false,
                            cellRenderer: params => (
                                <div className="d-flex gap-2 align-items-center h-100">
                                    <Tooltip title="Edit / Process Payment">
                                        <Button
                                            type="text"
                                            className="text-primary p-0"
                                            icon={<EditOutlined style={{ fontSize: '18px' }} />}
                                            onClick={() => handlePay(params.data, params.data.payment_details)}
                                        />
                                    </Tooltip>
                                </div>
                            )
                        }
                    ]
                }
            ];
        }, [rowData]);

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
                notes: payment ? payment.notes : '',
                status: payment ? payment.status : 'pending'
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
                preserveScroll: true,
                only: ['users', 'attendances', 'penalties', 'payments', 'monthlyShiftAssignments', 'leaveRequests', 'adjustments', 'projectPoints', 'selectedMonth', 'selectedYear', 'shifts', 'holidays', 'config']
            });
        };

        const handleGenerateSnapshot = () => {
            modal.confirm({
                title: 'Generate Final Sheet Snapshot',
                content: `This will save a permanent record of the current payroll data for ${monthOptions.find(m => m.value === month)?.label} ${year}. This record will be archived as a "Final Sheet". Continue?`,
                onOk: () => {
                    setLoading(true);
                    router.post(route('salary-sheets.snapshots.store'), {
                        month,
                        year,
                        data: rowData.filter(row => !row.has_no_shift) // Exclude users with no assigned shifts
                    }, {
                        onSuccess: () => {
                            api.success({ message: 'Success', description: 'Snapshot generated successfully' });
                        },
                        onFinish: () => setLoading(false)
                    });
                }
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

            const netPayCalculated = selectedUser.gross_salary + selectedUser.overtime_bonus + selectedUser.total_extra_earnings + selectedUser.project_points_amount + bonusTotal - (
                selectedUser.absent_deduction +
                selectedUser.undertime_deduction +
                selectedUser.total_tax +
                deductionTotal +
                selectedUser.late_penalty_deduction +
                selectedUser.missing_attendance_penalty_deduction +
                selectedUser.manual_penalty
            );

            const payload = {
                ...values,
                adjustments: manualAdjs,
                user_id: selectedUser.id,
                month: month,
                year: year,
                gross_salary: selectedUser.gross_salary,
                overtime_bonus: selectedUser.overtime_bonus,
                total_extra_earnings: selectedUser.total_extra_earnings,
                total_deductions: (selectedUser.absent_deduction + selectedUser.undertime_deduction + selectedUser.late_penalty_deduction + selectedUser.total_tax + deductionTotal + selectedUser.manual_penalty),
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
                            items={[{ title: <Link href="/">Home</Link> }, { title: 'Payroll' }, { title: 'Salary Sheets' }, { title: <small style={{ color: "green" }}>Users: (Salary Assigned )</small> }]}
                        />
                        <div className="d-flex gap-2">
                            <Select value={month} onChange={setMonth} options={monthOptions} style={{ width: 130 }} />
                            <Select value={year} onChange={setYear} options={yearOptions} style={{ width: 100 }} />
                            <Button
                                icon={<CheckCircleFilled />}
                                className="bg-primary text-white border-primary"
                                onClick={handleGenerateSnapshot}
                                loading={loading}
                            >
                                Generate Final Sheet
                            </Button>
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

                    <div className="card mt-2 mx-2 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                        <div className="card-body p-0">
                            <div className="ag-grid-wrapper" style={{ height: 'calc(100vh - 130px)' }}>
                                <AgGridReact
                                    ref={gridRef}
                                    rowData={rowData}
                                    columnDefs={columnDefs}
                                    defaultColDef={{
                                        ...defaultColDef,
                                        flex: 1,
                                        minWidth: 120,
                                        suppressMenu: true,
                                        suppressHeaderMenuButton: true,
                                        filter: true,
                                        floatingFilter: false,
                                        wrapHeaderText: true,
                                        autoHeaderHeight: true,
                                        resizable: true,
                                    }}
                                    getRowStyle={params => {
                                        if (params.data?.has_no_shift) {
                                            return { backgroundColor: '#fff1f0', color: '#cf1322' };
                                        }
                                    }}
                                    theme={gridTheme}
                                    pagination={true}
                                    paginationPageSize={100}
                                    groupDisplayType="groupRows"
                                    isGroupOpenByDefault={params => params.key !== 'No Group Assigned'}
                                    autoSizeStrategy={{
                                        type: 'fitGridWidth',
                                        defaultMinWidth: 100
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <Modal
                    title={<Space><WalletOutlined /> Release Payment: {selectedUser?.name}</Space>}
                    open={isPayModalOpen}
                    onCancel={() => setIsPayModalOpen(false)}
                    footer={null}
                    width={850}
                    centered
                >
                    <Form form={form} layout="vertical" onFinish={submitPayment}>
                        {selectedUser && (
                            <div className="payment-modal-content">
                                {/* Status & Method at Top */}
                                <div className="mb-4">
                                    <Card size="small" className="border-0 shadow-sm" style={{ background: '#f0f7ff' }}>
                                        <div className="row g-3">
                                            <div className="col-md-3">
                                                <Form.Item name="status" label="Payment Status" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                                    <Select>
                                                        <Select.Option value="pending">Pending</Select.Option>
                                                        <Select.Option value="processed">Processed</Select.Option>
                                                        <Select.Option value="paid">Paid</Select.Option>
                                                        <Select.Option value="failed">Failed</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </div>
                                            <div className="col-md-3">
                                                <Form.Item name="payment_method" label="Method" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                                    <Select placeholder="Select Method">
                                                        <Select.Option value="bank_transfer">Bank Transfer</Select.Option>
                                                        <Select.Option value="cash">Cash</Select.Option>
                                                        <Select.Option value="cheque">Cheque</Select.Option>
                                                        <Select.Option value="digital_wallet">Digital Wallet</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </div>
                                            <div className="col-md-3">
                                                <Form.Item name="payment_date" label="Payment Date" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                                    <DatePicker style={{ width: '100%' }} />
                                                </Form.Item>
                                            </div>
                                            <div className="col-md-3">
                                                <Form.Item name="reference" label="Ref / Transaction ID" style={{ marginBottom: 0 }}>
                                                    <Input placeholder="Reference code" />
                                                </Form.Item>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                                {/* Print Header (Hidden on Screen) */}
                                <div className="print-header mb-4 text-center" style={{ display: 'none' }}>
                                    <Title level={2} style={{ margin: 0 }}>PAYROLL SLIP</Title>
                                    <Text strong style={{ fontSize: '18px' }}>{selectedUser.name}</Text>
                                    <br />
                                    <Text type="secondary">{monthOptions.find(m => m.value === month).label} {year}</Text>
                                    <Divider style={{ margin: '15px 0' }} />
                                </div>

                                <div className="row g-4">
                                    {/* Attendance Section */}
                                    <div className="col-12">
                                        <Card size="small" className="border-0 bg-light" bodyStyle={{ padding: '20px' }}>
                                            <Divider orientation="left" style={{ margin: '0 0 20px 0' }}>
                                                <Text type="secondary" strong style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    <CalendarOutlined className="me-2" /> Attendance & Hours Breakdown
                                                </Text>
                                            </Divider>
                                            <div className="row g-3 text-center">
                                                <div className="col-md-3 border-end">
                                                    <div className="p-3">
                                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Required Days</Text>
                                                        <Title level={4} className="m-0 text-secondary">{selectedUser.required_days} Days</Title>
                                                    </div>
                                                </div>
                                                <div className="col-md-3 border-end">
                                                    <div className="p-3">
                                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Present / Leaves</Text>
                                                        <Title level={4} className="m-0 text-primary">{selectedUser.present_days} / {selectedUser.leave_days} d</Title>
                                                    </div>
                                                </div>
                                                <div className="col-md-3 border-end">
                                                    <div className="p-3">
                                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Deficit Hours</Text>
                                                        <Title level={4} className="m-0 text-danger">{selectedUser.undertime_hours?.toFixed(1) || 0} Hrs</Title>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="p-3">
                                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Overtime</Text>
                                                        <Title level={4} className="m-0 text-success">{selectedUser.overtime_hours?.toFixed(1) || 0} Hrs</Title>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 px-3 py-2 bg-white rounded border border-dashed">
                                                <div className="row text-center" style={{ fontSize: '12px' }}>
                                                    <div className="col-4 border-end">
                                                        <Text type="secondary">Required Hrs: </Text>
                                                        <Text strong>{selectedUser.total_required_hours?.toFixed(1) || 0}</Text>
                                                    </div>
                                                    <div className="col-4 border-end">
                                                        <Text type="secondary">Recorded Hrs: </Text>
                                                        <Text strong className="text-primary">{selectedUser.total_worked_hours?.toFixed(1) || 0}</Text>
                                                    </div>
                                                    <div className="col-4">
                                                        <Text type="secondary">Shift: </Text>
                                                        <Text strong style={{ fontSize: '10px' }}>{selectedUser.assigned_shift}</Text>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Earnings Section */}
                                    <div className="col-md-7">
                                        <Card size="small" className="h-100 border-0 shadow-sm" headStyle={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }} title={<Space><DollarOutlined className="text-success" /> Earnings & Bonuses</Space>}>
                                            <div className="p-2">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <Text>Basic Gross Salary</Text>
                                                    <Text strong>Rs. {Math.round(selectedUser.gross_salary || 0).toLocaleString()}</Text>
                                                </div>
                                                {(selectedUser.breakdown?.benefits || []).map((b, i) => (
                                                    <div key={`b-${i}`} className="d-flex justify-content-between mb-2 px-2 py-1 rounded-pill bg-success-subtle" style={{ fontSize: '12px' }}>
                                                        <Text><CheckCircleFilled className="text-success me-2" />{b.label} {b.count > 0 && <small>({b.count} {b.unit})</small>}</Text>
                                                        <Text strong className="text-success">+ Rs. {Math.round(b.amount || 0).toLocaleString()}</Text>
                                                    </div>
                                                ))}
                                                {selectedUser.project_points_amount > 0 && (
                                                    <div className="d-flex justify-content-between mb-2 px-2 py-1 rounded-pill bg-success-subtle" style={{ fontSize: '12px' }}>
                                                        <Text><CheckCircleFilled className="text-success me-2" />Project Points Bonus</Text>
                                                        <Text strong className="text-success">+ Rs. {Math.round(selectedUser.project_points_amount).toLocaleString()}</Text>
                                                    </div>
                                                )}
                                                {selectedUser.overtime_bonus > 0 && (
                                                    <div className="d-flex justify-content-between mb-2 px-2 py-1 rounded-pill bg-success-subtle" style={{ fontSize: '12px' }}>
                                                        <Text><CheckCircleFilled className="text-success me-2" />Overtime Bonus</Text>
                                                        <Text strong className="text-success">+ Rs. {Math.round(selectedUser.overtime_bonus).toLocaleString()}</Text>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Deductions Section */}
                                    <div className="col-md-5">
                                        <Card size="small" className="h-100 border-0 shadow-sm" headStyle={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }} title={<Space><WalletOutlined className="text-danger" /> Deductions</Space>}>
                                            <div className="p-2">
                                                {(selectedUser.breakdown?.penalties || []).map((p, i) => (
                                                    <div key={`p-${i}`} className="d-flex justify-content-between mb-2 px-2 py-1 rounded-pill bg-danger-subtle" style={{ fontSize: '12px' }}>
                                                        <Text><CheckCircleFilled className="text-danger me-2" />{p.label}</Text>
                                                        <Text strong className="text-danger">- Rs. {Math.round(p.amount || 0).toLocaleString()}</Text>
                                                    </div>
                                                ))}
                                                {(selectedUser.breakdown?.taxes || []).map((t, i) => (
                                                    <div key={`t-${i}`} className="d-flex justify-content-between mb-2 px-2 py-1 rounded-pill bg-danger-subtle" style={{ fontSize: '12px' }}>
                                                        <Text><CheckCircleFilled className="text-danger me-2" />{t.name} <small>({t.rate})</small></Text>
                                                        <Text strong className="text-danger">- Rs. {Math.round(t.amount || 0).toLocaleString()}</Text>
                                                    </div>
                                                ))}
                                                {selectedUser.manual_penalty > 0 && (
                                                    <div className="d-flex justify-content-between mb-2 px-2 py-1 rounded-pill bg-danger-subtle" style={{ fontSize: '12px' }}>
                                                        <Text><CheckCircleFilled className="text-danger me-2" />Adjustment Deductions</Text>
                                                        <Text strong className="text-danger">- Rs. {Math.round(selectedUser.manual_penalty).toLocaleString()}</Text>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Net Payable Summary */}
                                    <div className="col-12">
                                        <Card size="small" className="border-0 shadow-sm" style={{ background: '#f6ffed' }}>
                                            <div className="text-center py-2">
                                                <Text type="secondary" className="text-uppercase" style={{ fontSize: '10px', letterSpacing: '1px' }}>Net Payable Amount</Text>
                                                <Title level={2} className="m-0 text-success">
                                                    Rs. {Math.round(
                                                        selectedUser.gross_salary +
                                                        (selectedUser.overtime_bonus || 0) +
                                                        (selectedUser.total_extra_earnings || 0) +
                                                        (selectedUser.project_points_amount || 0) +
                                                        (watchedAdjustments?.filter(a => a?.type === 'bonus').reduce((acc, curr) => acc + (parseFloat(curr?.amount) || 0), 0) || 0) -
                                                        (
                                                            (selectedUser.absent_deduction || 0) +
                                                            (selectedUser.undertime_deduction || 0) +
                                                            (selectedUser.late_penalty_deduction || 0) +
                                                            (selectedUser.missing_attendance_penalty_deduction || 0) +
                                                            (selectedUser.manual_penalty || 0) +
                                                            (selectedUser.total_tax || 0) +
                                                            (watchedAdjustments?.filter(a => a?.type === 'deduction').reduce((acc, curr) => acc + (parseFloat(curr?.amount) || 0), 0) || 0)
                                                        )
                                                    ).toLocaleString()}
                                                </Title>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>{monthOptions.find(m => m.value === month).label} {year}</Text>
                                            </div>
                                        </Card>
                                    </div>

                                </div>
                            </div>
                        )}

                        <Divider orientation="left" style={{ marginTop: '30px' }}>
                            <Button type="link" size="small" icon={<PlusCircleOutlined />} onClick={() => form.setFieldsValue({ manual_adjustments: [...(form.getFieldValue('manual_adjustments') || []), {}] })}>
                                Add Manual Adjustment Items
                            </Button>
                        </Divider>

                        <Form.List name="manual_adjustments">
                            {(fields, { add, remove }) => (
                                <div className="mb-4">
                                    {fields.map(({ key, name, ...restField }) => (
                                        <div key={key} className="bg-light p-3 rounded mb-2 border shadow-sm">
                                            <div className="row g-2 align-items-center">
                                                <div className="col-md-5">
                                                    <Form.Item {...restField} name={[name, 'label']} rules={[{ required: true, message: 'Label required' }]} style={{ marginBottom: 0 }}>
                                                        <Input placeholder="Reason (e.g. Performance Bonus)" />
                                                    </Form.Item>
                                                </div>
                                                <div className="col-md-3">
                                                    <Form.Item {...restField} name={[name, 'type']} initialValue="bonus" style={{ marginBottom: 0 }}>
                                                        <Select>
                                                            <Select.Option value="bonus">Bonus (+)</Select.Option>
                                                            <Select.Option value="deduction">Deduction (-)</Select.Option>
                                                        </Select>
                                                    </Form.Item>
                                                </div>
                                                <div className="col-md-3">
                                                    <Form.Item {...restField} name={[name, 'amount']} rules={[{ required: true, message: 'Amount required' }]} style={{ marginBottom: 0 }}>
                                                        <InputNumber style={{ width: '100%' }} min={0} placeholder="Amount" />
                                                    </Form.Item>
                                                </div>
                                                <div className="col-md-1 text-end">
                                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Form.List>

                        <Form.Item name="notes" label="Notes">
                            <Input.TextArea rows={2} placeholder="Internal payment notes..." />
                        </Form.Item>

                        <div className="text-end border-top pt-3 d-flex justify-content-end gap-2 no-print">
                            {selectedUser?.existing_payment && (
                                <Button
                                    danger
                                    size="large"
                                    type="primary"
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnpay(selectedUser);
                                    }}
                                >
                                    Unpay / Cancel
                                </Button>
                            )}
                            <Button size="large" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
                            <Button size="large" type="primary" htmlType="submit" loading={loading} icon={<CheckCircleOutlined />}>
                                Update
                            </Button>
                        </div>
                    </Form>
                </Modal>


                <Modal
                    title={<Space><SettingOutlined className="text-primary" /> Payroll Global Settings</Space>}
                    open={isConfigModalOpen}
                    onCancel={() => setIsConfigModalOpen(false)}
                    footer={null}
                    width={650}
                    centered
                    bodyStyle={{ padding: '20px 24px' }}
                >
                    <Form form={configForm} layout="vertical" onFinish={handleConfigSubmit} className="creative-form">
                        <div className="alert alert-info mb-4 border-0 shadow-sm d-flex align-items-center gap-3" style={{ background: '#e6f7ff', borderRadius: '12px' }}>
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                <SettingOutlined style={{ fontSize: '20px' }} />
                            </div>
                            <div>
                                <Text strong style={{ display: 'block' }}>Global Calculation Rules</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Adjust rates and penalties applied to all salary calculations for <strong>{monthOptions.find(m => m.value === month).label} {year}</strong>.
                                </Text>
                            </div>
                        </div>

                        <Divider orientation="left" className="m-0 mb-3"><Text strong type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Rate & Bonus Settings</Text></Divider>

                        <div className="row g-3 mb-4">
                            <div className="col-md-12">
                                <Card size="small" className="bg-light border-0 shadow-sm h-100" bodyStyle={{ padding: '15px' }}>
                                    <Form.Item
                                        name="project_point_rate"
                                        label={<Space><DollarOutlined /> Point Rate</Space>}
                                        extra="PKR per Project Point"
                                    >
                                        <InputNumber className="w-100" min={0} placeholder="e.g. 100" />
                                    </Form.Item>
                                </Card>
                            </div>
                        </div>

                        <Divider orientation="left" className="m-0 mb-3"><Text strong type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Penalty & Deduction Settings</Text></Divider>

                        <Card size="small" className="bg-light border-0 mb-4" bodyStyle={{ padding: '15px' }}>
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <Form.Item
                                        name="attendance_late_grace_minutes"
                                        label={
                                            <Space>
                                                Late Grace (Mins)
                                                <Tooltip title="Time in minutes allowed after shift start before being considered 'Late'. Defaults to 0 (exact time) if empty.">
                                                    <SettingOutlined style={{ fontSize: '12px', color: '#1890ff', cursor: 'pointer' }} />
                                                </Tooltip>
                                            </Space>
                                        }
                                        extra="Buffer minutes (Default: 0)"
                                    >
                                        <InputNumber className="w-100" min={0} placeholder="e.g. 15" />
                                    </Form.Item>
                                </div>
                                <div className="col-12 col-md-6">
                                    <Form.Item
                                        name="late_grace_count"
                                        label={
                                            <Space>
                                                Allowed Lates (Count)
                                                <Tooltip title="Number of lates allowed per month without penalty.">
                                                    <SettingOutlined style={{ fontSize: '12px', color: '#1890ff', cursor: 'pointer' }} />
                                                </Tooltip>
                                            </Space>
                                        }
                                        extra="Days allowed"
                                    >
                                        <InputNumber className="w-100" min={0} />
                                    </Form.Item>
                                </div>
                                <div className="col-12 col-md-6">
                                    <Form.Item
                                        name="late_penalty_per_day"
                                        label={
                                            <Space>
                                                Late Penalty (Amount)
                                                <Tooltip title="Penalty amount applied for each late beyond the allowed count.">
                                                    <SettingOutlined style={{ fontSize: '12px', color: '#1890ff', cursor: 'pointer' }} />
                                                </Tooltip>
                                            </Space>
                                        }
                                        extra="PKR / day"
                                    >
                                        <InputNumber className="w-100" min={0} />
                                    </Form.Item>
                                </div>
                            </div>
                        </Card>

                        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                            <Button size="large" onClick={() => setIsConfigModalOpen(false)}>Cancel</Button>
                            <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ borderRadius: '8px' }}>
                                Save All Changes
                            </Button>
                        </div>
                    </Form>
                </Modal>

                <Modal
                    title={<Space><ApartmentOutlined /> {monthOptions.find(m => m.value === month)?.label} {year} - Advanced Shift Assignment</Space>}
                    open={isShiftModalOpen}
                    onCancel={() => setIsShiftModalOpen(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setIsShiftModalOpen(false)}>Close</Button>,
                        <Button key="submit" type="primary" loading={loading} onClick={() => {
                            shiftForm.validateFields().then(values => {
                                setLoading(true);
                                router.post(route('salary-sheets.shifts.save'), {
                                    month,
                                    year,
                                    groups: values.groups || []
                                }, {
                                    onSuccess: () => {
                                        setLoading(false);
                                        setIsShiftModalOpen(false);
                                        api.success({ message: 'Saved Successfully', description: 'All group assignments have been updated.' });
                                    },
                                    onError: (errors) => {
                                        setLoading(false);
                                        Object.values(errors).forEach(err => {
                                            api.error({
                                                message: 'Update Failed',
                                                description: err,
                                                placement: 'topRight'
                                            });
                                        });
                                    }
                                }).catch(info => {
                                    setLoading(false);
                                    api.error({
                                        message: 'Validation Error',
                                        description: 'Please fix the highlighted errors (like overlapping ranges) before saving.',
                                        placement: 'topRight'
                                    });
                                });
                            });
                        }}>
                            Save All Assignments
                        </Button>
                    ]}
                    width={1100}
                    centered
                    bodyStyle={{ padding: '0', backgroundColor: '#f0f2f5' }}
                >
                    <div className="p-4">
                        <Card bordered={false} className="mb-4 shadow-sm" bodyStyle={{ padding: '15px 24px' }} style={{ borderRadius: '12px', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <Title level={5} className="mb-1" style={{ color: '#001529' }}>Assignment Overview</Title>
                                    <Text type="secondary" style={{ fontSize: '13px' }}>Users can be assigned to unique shift ranges. Only <strong>Unassigned</strong> users can be added to new groups.</Text>
                                </div>
                                <div className="text-end">
                                    <Space size="large">
                                        <div className="text-center">
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>{users.length}</div>
                                            <div style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase' }}>Total Users</div>
                                        </div>
                                        <Divider type="vertical" style={{ height: '30px' }} />
                                        <div className="text-center">
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>{users.length - unassignedUsers.length}</div>
                                            <div style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase' }}>Assigned</div>
                                        </div>
                                        <Divider type="vertical" style={{ height: '30px' }} />
                                        <div className="text-center">
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: unassignedUsers.length > 0 ? '#faad14' : '#52c41a' }}>{unassignedUsers.length}</div>
                                            <div style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase' }}>Unassigned</div>
                                        </div>
                                    </Space>
                                </div>
                            </div>
                        </Card>

                        <Form form={shiftForm} layout="vertical">
                            <Form.List name="groups">
                                {(groupFields, groupOps) => (
                                    <div className="row g-4">
                                        {groupFields.map((groupField, groupIndex) => {
                                            const allGroups = shiftForm.getFieldValue('groups') || [];
                                            // Users assigned in other groups should be excluded from this group's selection list
                                            const otherGroupUserIds = allGroups.flatMap((g, idx) =>
                                                idx !== groupIndex ? (g.user_ids || []) : []
                                            );

                                            const groupColor = ['#1890ff', '#722ed1', '#eb2f96', '#2f54eb', '#fa8c16'][groupIndex % 5];

                                            return (
                                                <div key={groupField.key} className="col-12">
                                                    <Card
                                                        hoverable
                                                        className="border-0 shadow-sm"
                                                        style={{ borderRadius: '12px', overflow: 'hidden' }}
                                                        bodyStyle={{ padding: 0 }}
                                                        title={
                                                            <div className="d-flex justify-content-between align-items-center w-100">
                                                                <Space>
                                                                    <div style={{ width: '8px', height: '24px', backgroundColor: groupColor, borderRadius: '4px' }} />
                                                                    <Text strong style={{ fontSize: '16px' }}>Group {String.fromCharCode(65 + groupIndex)}</Text>
                                                                    <Tag color="default" style={{ borderRadius: '10px', fontSize: '11px' }}>
                                                                        {(allGroups[groupIndex]?.user_ids || []).length} Users
                                                                    </Tag>
                                                                </Space>
                                                                <Space>
                                                                    <Button
                                                                        type="primary"
                                                                        ghost
                                                                        size="small"
                                                                        icon={<CheckCircleOutlined />}
                                                                        onClick={() => {
                                                                            shiftForm.validateFields().then(values => {
                                                                                setLoading(true);
                                                                                router.post(route('salary-sheets.shifts.save'), {
                                                                                    month, year, groups: values.groups
                                                                                }, {
                                                                                    onSuccess: () => {
                                                                                        setLoading(false);
                                                                                        api.success({ message: `Group ${String.fromCharCode(65 + groupIndex)} Updated` });
                                                                                    },
                                                                                    onError: (errors) => {
                                                                                        setLoading(false);
                                                                                        Object.values(errors).forEach(err => {
                                                                                            api.error({
                                                                                                message: 'Group Update Failed',
                                                                                                description: err,
                                                                                                placement: 'topRight'
                                                                                            });
                                                                                        });
                                                                                    }
                                                                                }).catch(info => {
                                                                                    setLoading(false);
                                                                                    api.error({
                                                                                        message: 'Validation Error',
                                                                                        description: 'Please fix the highlighted errors in this group before saving.',
                                                                                        placement: 'topRight'
                                                                                    });
                                                                                });
                                                                            });
                                                                        }}
                                                                    >
                                                                        Update This Group
                                                                    </Button>
                                                                    <Tooltip title="Remove this group">
                                                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => groupOps.remove(groupIndex)} />
                                                                    </Tooltip>
                                                                </Space>
                                                            </div>
                                                        }
                                                    >
                                                        <div className="row g-0">
                                                            <div className="col-md-5 border-end p-4 bg-white">
                                                                <Divider orientation="left" style={{ marginTop: 0 }}><Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>1. Shift Ranges</Text></Divider>

                                                                <Form.List
                                                                    name={[groupField.name, 'ranges']}
                                                                    initialValue={[{}]}
                                                                >
                                                                    {(rangeFields, rangeOps, { errors }) => (
                                                                        <div>
                                                                            {rangeFields.map((rangeField, rangeIndex) => (
                                                                                <div key={rangeField.key} className="p-3 mb-3 border rounded-3 bg-light position-relative">
                                                                                    {rangeFields.length > 1 && (
                                                                                        <Button
                                                                                            type="text"
                                                                                            danger
                                                                                            size="small"
                                                                                            icon={<DeleteOutlined />}
                                                                                            className="position-absolute"
                                                                                            style={{ top: '5px', right: '5px' }}
                                                                                            onClick={() => rangeOps.remove(rangeIndex)}
                                                                                        />
                                                                                    )}
                                                                                    <Form.Item
                                                                                        {...rangeField}
                                                                                        name={[rangeField.name, 'shift_id']}
                                                                                        label="Shift Pattern"
                                                                                        rules={[{ required: true, message: 'Select shift' }]}
                                                                                        className="mb-2"
                                                                                    >
                                                                                        <Select
                                                                                            placeholder="Choose Shift"
                                                                                            options={shifts.map(s => ({
                                                                                                label: `${s.name} (${s.start_time} - ${s.end_time})`,
                                                                                                value: s.id
                                                                                            }))}
                                                                                        />
                                                                                    </Form.Item>
                                                                                    <div className="row g-2">
                                                                                        <div className="col-6">
                                                                                            <Form.Item
                                                                                                {...rangeField}
                                                                                                name={[rangeField.name, 'start_day']}
                                                                                                label="From Day"
                                                                                                rules={[
                                                                                                    { required: true, message: 'Day required' },
                                                                                                    { type: 'number', min: 1, max: 31 },
                                                                                                    ({ getFieldValue }) => ({
                                                                                                        validator(_, value) {
                                                                                                            if (value === undefined || value === null) return Promise.resolve();
                                                                                                            const ranges = getFieldValue(['groups', groupIndex, 'ranges']) || [];
                                                                                                            const currentEnd = getFieldValue(['groups', groupIndex, 'ranges', rangeIndex, 'end_day']);

                                                                                                            for (let i = 0; i < ranges.length; i++) {
                                                                                                                if (i === rangeIndex) continue;
                                                                                                                const other = ranges[i];
                                                                                                                if (!other || other.start_day === undefined || other.end_day === undefined) continue;
                                                                                                                if (value <= other.end_day && (currentEnd || value) >= other.start_day) {
                                                                                                                    return Promise.reject(new Error(`Overlaps with range ${other.start_day}-${other.end_day}`));
                                                                                                                }
                                                                                                            }
                                                                                                            return Promise.resolve();
                                                                                                        }
                                                                                                    })
                                                                                                ]}
                                                                                                className="mb-0"
                                                                                            >
                                                                                                <InputNumber className="w-100" />
                                                                                            </Form.Item>
                                                                                        </div>
                                                                                        <div className="col-6">
                                                                                            <Form.Item
                                                                                                {...rangeField}
                                                                                                name={[rangeField.name, 'end_day']}
                                                                                                label="To Day"
                                                                                                rules={[
                                                                                                    { required: true, message: 'Day required' },
                                                                                                    { type: 'number', min: 1, max: 31 },
                                                                                                    ({ getFieldValue }) => ({
                                                                                                        validator(_, value) {
                                                                                                            if (value === undefined || value === null) return Promise.resolve();
                                                                                                            const start = getFieldValue(['groups', groupIndex, 'ranges', rangeIndex, 'start_day']);
                                                                                                            if (start && value < start) {
                                                                                                                return Promise.reject(new Error('End must be >= Start!'));
                                                                                                            }

                                                                                                            const ranges = getFieldValue(['groups', groupIndex, 'ranges']) || [];
                                                                                                            for (let i = 0; i < ranges.length; i++) {
                                                                                                                if (i === rangeIndex) continue;
                                                                                                                const other = ranges[i];
                                                                                                                if (!other || other.start_day === undefined || other.end_day === undefined) continue;
                                                                                                                if ((start || value) <= other.end_day && value >= other.start_day) {
                                                                                                                    return Promise.reject(new Error(`Overlaps with range ${other.start_day}-${other.end_day}`));
                                                                                                                }
                                                                                                            }
                                                                                                            return Promise.resolve();
                                                                                                        },
                                                                                                    }),
                                                                                                ]}
                                                                                                className="mb-0"
                                                                                            >
                                                                                                <InputNumber className="w-100" />
                                                                                            </Form.Item>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                            <Form.ErrorList errors={errors} className="mb-2" />
                                                                            <Button
                                                                                type="dashed"
                                                                                block
                                                                                icon={<PlusCircleOutlined />}
                                                                                onClick={() => rangeOps.add({})}
                                                                                style={{ borderRadius: '8px' }}
                                                                            >
                                                                                Add Range
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </Form.List>
                                                            </div>
                                                            <div className="col-md-7 p-4" style={{ backgroundColor: '#fafafa' }}>
                                                                <Divider orientation="left" style={{ marginTop: 0 }}><Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>2. Member Selection</Text></Divider>

                                                                <Form.Item name={[groupField.name, 'user_ids']} noStyle>
                                                                    <Checkbox.Group className="w-100">
                                                                        <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '10px' }}>
                                                                            {Object.entries(usersByStatus).map(([status, statusUsers]) => {
                                                                                // Filter users: exclude those in OTHER groups
                                                                                const selectableUsers = statusUsers.filter(u => !otherGroupUserIds.includes(u.id));
                                                                                if (selectableUsers.length === 0) return null;

                                                                                const groupUserIds = selectableUsers.map(u => u.id);
                                                                                const currentSelections = shiftForm.getFieldValue(['groups', groupIndex, 'user_ids']) || [];
                                                                                const isAllSelected = groupUserIds.every(id => currentSelections.includes(id));

                                                                                return (
                                                                                    <div key={status} className="mb-4">
                                                                                        <div className="d-flex justify-content-between align-items-baseline mb-2 border-bottom pb-1">
                                                                                            <Text strong style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8c8c8c' }}>{status} ({selectableUsers.length})</Text>
                                                                                            <Button
                                                                                                type="link"
                                                                                                size="small"
                                                                                                style={{ padding: 0, fontSize: '11px' }}
                                                                                                onClick={() => {
                                                                                                    const current = shiftForm.getFieldValue(['groups', groupIndex, 'user_ids']) || [];
                                                                                                    let next;
                                                                                                    if (isAllSelected) {
                                                                                                        next = current.filter(id => !groupUserIds.includes(id));
                                                                                                    } else {
                                                                                                        next = [...new Set([...current, ...groupUserIds])];
                                                                                                    }
                                                                                                    const gs = [...shiftForm.getFieldValue('groups')];
                                                                                                    gs[groupIndex] = { ...gs[groupIndex], user_ids: next };
                                                                                                    shiftForm.setFieldsValue({ groups: gs });
                                                                                                }}
                                                                                            >
                                                                                                {isAllSelected ? 'Deselect All' : 'Select All'}
                                                                                            </Button>
                                                                                        </div>
                                                                                        <div className="row g-2">
                                                                                            {selectableUsers.map(u => (
                                                                                                <div key={u.id} className="col-md-6">
                                                                                                    <div className={`p-2 rounded border bg-white d-flex align-items-center ${currentSelections.includes(u.id) ? 'border-primary' : ''}`} style={{ transition: 'all 0.2s' }}>
                                                                                                        <Checkbox value={u.id}>
                                                                                                            <Text style={{ fontSize: '13px' }}>{u.name}</Text>
                                                                                                        </Checkbox>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </Checkbox.Group>
                                                                </Form.Item>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </div>
                                            );
                                        })}

                                        <div className="col-12 mt-2">
                                            <Button
                                                type="dashed"
                                                block
                                                size="large"
                                                icon={<PlusCircleOutlined />}
                                                onClick={() => groupOps.add({ ranges: [{}], user_ids: [] })}
                                                style={{ borderRadius: '12px', height: '60px', borderStyle: 'dashed', borderWidth: '2px' }}
                                            >
                                                Create New Assignment Group
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Form.List>
                        </Form>
                    </div>
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
