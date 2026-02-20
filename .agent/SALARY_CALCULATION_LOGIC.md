# FINAL SALARY CALCULATION LOGIC

## The Correct Approach (Now Implemented)

### Attendance Statuses:
1. **Present** = Employee worked → ✅ Paid (No deduction)
2. **Absent** = Employee didn't work → Check leave status:
   - **On Approved Leave** → ✅ Paid (No deduction)
   - **NOT on Leave** → ❌ Deducted from salary

## How It Works

### Step 1: Mark Attendance
In User Attendance page, you can mark:
- **✓ Present** - Employee worked
- **✗ Absent** - Employee didn't show up

### Step 2: Approve Leave Requests
In Leave Management:
- Employee submits leave request
- Manager approves/rejects
- **Approved leaves** are automatically considered in payroll

### Step 3: Payroll Calculation (Automatic)

```javascript
// Salary Sheet Calculation Logic:

1. Count Present Days
   presentDays = Count of attendance records with status = 'present'

2. Calculate Approved Leave Days
   approvedLeaveDays = Sum of all approved leave days in the month
   (Handles multi-day leaves that span across months)

3. Calculate Unauthorized Absent Days
   totalAbsentDays = workingDays - presentDays
   unauthorizedAbsentDays = totalAbsentDays - approvedLeaveDays

4. Calculate Deduction
   perDayRate = grossSalary / workingDays
   absentDeduction = unauthorizedAbsentDays × perDayRate
   
   ✅ Approved leave days are NOT deducted
   ❌ Only unauthorized absences are deducted
```

## Example Scenarios

### Scenario 1: Employee on Approved Leave
```
Working Days: 22
Present Days: 15
Approved Leave: 5 days
Unauthorized Absent: 2 days

Calculation:
- Total Absent = 22 - 15 = 7 days
- Approved Leave = 5 days
- Unauthorized Absent = 7 - 5 = 2 days
- Deduction = 2 days × per day rate

Result: Only 2 days deducted, 5 leave days are PAID
```

### Scenario 2: Employee Absent Without Leave
```
Working Days: 22
Present Days: 18
Approved Leave: 0 days
Unauthorized Absent: 4 days

Calculation:
- Total Absent = 22 - 18 = 4 days
- Approved Leave = 0 days
- Unauthorized Absent = 4 - 0 = 4 days
- Deduction = 4 days × per day rate

Result: All 4 absent days are deducted
```

### Scenario 3: Perfect Attendance
```
Working Days: 22
Present Days: 22
Approved Leave: 0 days
Unauthorized Absent: 0 days

Calculation:
- Total Absent = 22 - 22 = 0 days
- Deduction = 0

Result: Full salary, no deductions
```

### Scenario 4: Leave Spanning Multiple Months
```
Leave: Jan 28 - Feb 3 (7 days total)
February Working Days: 22
February Present Days: 18

Calculation for February:
- Leave days in Feb = 3 days (Feb 1, 2, 3)
- Total Absent in Feb = 22 - 18 = 4 days
- Approved Leave in Feb = 3 days
- Unauthorized Absent = 4 - 3 = 1 day
- Deduction = 1 day × per day rate

Result: Only 1 day deducted in February
```

## Salary Sheet Display

The grid now shows:
- **Prs** (Present) - Green - Days worked
- **Leave** - Blue - Approved leave days (PAID)
- **Abs** (Absent) - Red - Unauthorized absences (DEDUCTED)
- **Late** - Orange - Late arrivals (separate penalty)

## Important Notes

### ✅ What You DON'T Need to Do:
- ❌ Don't manually mark leave days as "present"
- ❌ Don't add bonus for leave days
- ❌ Don't worry about leave deductions

### ✅ What Happens Automatically:
- ✅ System checks approved leaves
- ✅ Excludes leave days from deductions
- ✅ Only deducts unauthorized absences
- ✅ Shows breakdown in salary sheet

## Workflow

### For HR/Admin:
1. **Approve Leave Requests** in Leave Management
2. **Mark Daily Attendance** (Present/Absent)
3. **Review Salary Sheet** at month end
   - Check Present days
   - Check Leave days (should match approved leaves)
   - Check Absent days (only unauthorized)
4. **Release Salary** - Deductions are already correct!

### For Employees:
1. Submit leave request when needed
2. Wait for approval
3. If approved → Leave days are PAID automatically
4. If not approved → Absent days will be deducted

## Database Tables Involved

### user_attendances
- Stores daily attendance (present/absent/late)
- Does NOT store leave information

### leave_requests
- Stores leave applications
- Status: pending/approved/rejected/cancelled
- Only **approved** leaves affect salary

### Payroll Calculation
- Reads both tables
- Combines data to calculate correct deductions
- Approved leaves = Paid days
- Unauthorized absences = Deducted days

## Benefits of This Approach

1. **Accurate Payroll** - Only unauthorized absences are deducted
2. **Fair to Employees** - Approved leaves are paid
3. **Automatic** - No manual adjustments needed
4. **Transparent** - Clear breakdown in salary sheet
5. **Audit Trail** - All data is tracked and logged

## Future Enhancements

### Recommended:
1. **Leave Balance Tracking** - Auto-deduct from balance when approved
2. **Leave Types** - Different policies for sick/annual/casual leave
3. **Half-Day Leaves** - Support for half-day deductions
4. **Unpaid Leaves** - Option for unpaid leave (should be deducted)
5. **Working Days Config** - Make working days configurable per month

### Optional:
1. **Auto-Mark Leave Days** - Scheduled job to mark approved leaves as present
2. **Leave Notifications** - Email when leave is approved/rejected
3. **Leave Reports** - Analytics on leave usage
4. **Leave Carry Forward** - Unused leaves to next year
