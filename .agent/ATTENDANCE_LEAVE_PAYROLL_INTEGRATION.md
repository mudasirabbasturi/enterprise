# Attendance, Leave & Payroll Integration Guide

## Overview
This document explains how the attendance system integrates with leave management and payroll to ensure accurate salary calculations.

## System Components

### 1. **Attendance System**
- **Location**: `UserAttendance.jsx` & `UserAttendanceController.php`
- **Purpose**: Track daily employee presence, absences, overtime, and undertime
- **Statuses**: 
  - `present` - Employee worked
  - `late` - Employee arrived late
  - `absent` - Employee did not show up
  - `no action` - No attendance marked
  - `On Leave` - Employee on approved leave (shown for reference)

### 2. **Leave Management**
- **Location**: Leave Types, Leave Requests, Leave Balances
- **Purpose**: Manage employee leave requests and approvals
- **Leave Statuses**:
  - `pending` - Awaiting approval
  - `approved` - Approved by manager (affects attendance display)
  - `rejected` - Denied
  - `cancelled` - Cancelled by employee

### 3. **Payroll System**
- **Location**: `SalarySheet.jsx` & `SalarySheetController.php`
- **Purpose**: Calculate and process monthly salaries

## How They Work Together

### Attendance Display Logic

```javascript
// When viewing attendance logs:
1. Check if date has attendance record → Show actual status
2. Check if date falls in approved leave → Show "On Leave" tag
3. Otherwise → Show "Not Marked"

// Leave Status Column
- Shows the leave type name (e.g., "Sick Leave", "Annual Leave")
- Only shows for approved leaves
- Helps distinguish between absent and on-leave
```

### Payroll Calculation Logic

```javascript
// From SalarySheet.jsx (lines 42-54)
const presentDays = userAttendances.filter(a => a.status === 'present').length;
const absentDays = Math.max(0, workingDays - presentDays);
const perDayRate = grossSalary / workingDays;
const absentDeduction = absentDays * perDayRate;
```

**Current Behavior:**
- Payroll counts ONLY `present` status as worked days
- All other days (absent, late, on-leave, not-marked) are treated as absent
- Absent days are deducted from salary

**Important Note:**
- Currently, **approved leaves are NOT automatically excluded from absent deductions**
- This means if someone is on approved leave, their salary will still be deducted unless:
  1. You manually mark them as "present" for leave days, OR
  2. You add a bonus/adjustment when releasing salary

## Recommended Workflow

### For Regular Attendance:
1. Open "User Attendance" page
2. Click "View Logs" for a user
3. Use quick buttons:
   - **✓ Present** - Mark as present (fast, no check-in/out needed)
   - **✗ Absent** - Mark as absent
   - **Edit icon** - Full form with check-in/out times, OT, UT

### For Leave Days:
**Option 1: Mark as Present (Recommended)**
- When employee has approved leave, mark them as "present" in attendance
- This prevents salary deduction
- Add note: "On approved leave - [Leave Type]"

**Option 2: Adjust During Salary Release**
- Let leave days count as absent
- When releasing salary, add bonus equal to deducted leave days
- System will auto-note the adjustment

### For Payroll Processing:
1. Go to "Salary Sheets"
2. Select month/year
3. Review calculations:
   - Present days
   - Absent days (includes leave if not marked present)
   - Late deductions
   - Penalties
4. When releasing salary:
   - Add bonus for approved leave days if needed
   - Add adjustments for other deductions
   - System shows final net pay

## Database Schema

### user_attendances
```sql
- id
- user_id
- date
- check_in (time, nullable)
- check_out (time, nullable)
- overtime_hours (decimal, nullable)
- undertime_hours (decimal, nullable)  -- NEW!
- check_in_ip
- check_out_ip
- status (present/late/absent/no action)
- notes
```

### leave_requests
```sql
- id
- user_id
- leave_type_id
- start_date
- end_date
- total_days
- status (pending/approved/rejected/cancelled)
- reason
- approved_by
- approved_at
```

## Key Features

### 1. **Quick Mark Buttons**
- Fast attendance marking without opening full form
- Automatically checks if shift is assigned
- Uses Axios for faster submission
- Shows in "View Logs" modal for unmarked days

### 2. **Overtime & Undertime Calculation**
- Automatically calculated based on shift schedule for that specific day
- Considers day of week (Monday shift may differ from Friday)
- Converts shift duration from minutes to hours
- **OT**: When worked > scheduled hours
- **UT**: When worked < scheduled hours

### 3. **Leave Integration**
- Shows "Leave" column in attendance grid
- Displays leave type for approved leaves
- Helps identify why someone was absent
- Status shows "On Leave" instead of "Not Marked"

### 4. **Shift-Based Calculations**
```javascript
// Example:
User Schedule: Monday = 8 hours (480 minutes)
Check-in: 09:00
Check-out: 18:00
Worked: 9 hours

Result:
- Overtime: 1 hour
- Undertime: 0 hours
```

## Future Enhancements (Recommended)

### 1. **Auto-Mark Leave Days**
Create a scheduled job to automatically mark approved leave days as "present" with a note.

### 2. **Payroll Leave Adjustment**
Update `SalarySheet.jsx` to:
```javascript
// Exclude approved leave days from absent calculation
const approvedLeaveDays = leaveRequests
  .filter(l => l.user_id === user.id && l.status === 'approved')
  .reduce((acc, l) => acc + l.total_days, 0);

const absentDays = Math.max(0, workingDays - presentDays - approvedLeaveDays);
```

### 3. **Leave Balance Deduction**
When marking leave as approved, automatically deduct from leave balance.

### 4. **Attendance Policy Configuration**
Add settings for:
- Should leaves count as present or absent?
- Should late arrivals be auto-detected?
- Overtime calculation rules
- Undertime penalties

## API Endpoints

### Attendance
- `GET /schedule/users-attendance` - List with filters
- `POST /schedule/users-attendance/store` - Create (supports JSON)
- `PUT /schedule/users-attendance/update/{id}` - Update (supports JSON)
- `DELETE /schedule/users-attendance/destroy/{id}` - Delete (supports JSON)

### Leave Requests
- `GET /leave/requests` - List all
- `POST /leave/requests/store` - Create
- `POST /leave/requests/status/{id}` - Approve/Reject

### Payroll
- `GET /payroll/salary-sheets` - View salary sheet
- `POST /payroll/salary-sheets/pay` - Process payment

## Best Practices

1. **Always assign shifts before marking attendance**
2. **Use quick buttons for simple present/absent marking**
3. **Use full form when you need to record check-in/out times**
4. **Review leave requests before processing payroll**
5. **Add notes when making manual adjustments**
6. **Verify OT/UT calculations match actual work**
7. **Export salary sheets before releasing payments**

## Troubleshooting

### "Shift Not Assigned" Error
- Go to User Schedules
- Assign a shift to the user for the specific day
- Ensure shift has duration or start/end times

### Overtime Not Calculating
- Verify shift schedule exists for that day of week
- Check if shift has duration value
- Ensure check-in and check-out times are set

### Leave Not Showing
- Verify leave status is "approved"
- Check date range includes the attendance month
- Ensure leave_type relationship is loaded

### Salary Deduction for Leave Days
- Option 1: Mark leave days as "present" in attendance
- Option 2: Add bonus when releasing salary
- Future: Implement auto-adjustment (see enhancements above)
