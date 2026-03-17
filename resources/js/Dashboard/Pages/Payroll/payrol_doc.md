# Payroll & Attendance Documentation

This document explains the logic behind the payroll and attendance system in the BIDWINNERS application.

## 1. Shift & Required Hours Calculation

### How Required Hours are Derived
Required hours are calculated daily for each employee based on their assigned shifts.
- **Shift Sources**:
    1. **Direct User Assignment**: A specific shift assigned to a user for a date range (stored in `MonthlyShiftAssignment`).
    2. **Global Assignment**: A shift assigned to all users (null `user_id`) for a date range if no direct assignment exists.
- **Daily Calculation**:
    - For each day of the month:
        - If the day is a **Weekend** (Saturday/Sunday) or a **Holiday**, it is skipped (Required Hours = 0).
        - If the user is on **Approved Leave**, it is skipped.
        - Otherwise, the system looks for a matching `shiftRange` for that day.
- **Formula**:
    - `Shift Duration = (Shift End Time - Shift Start Time)`
    - `Daily Required Minutes = Shift Duration - Allowed Break Minutes` (from `Shift.total_break_minutes`).
- **Total required hours for the month** is the sum of these daily required minutes converted to hours.
- **Single vs. Multiple Shifts**: The current logic in `SalarySheet.jsx` uses `.find()` on assigned shifts for a day, meaning it only supports **one shift per day** for its overview calculations.

## 2. Attendance & Worked Hours Calculation

### Data Source
Attendance data comes from the `user_attendances` table. Each record contains a `clock` column which is a JSON array of "segments" (check-in/check-out pairs).

### Calculation Logic
- **Worked Hours**:
    - In **SalarySheet.jsx** (Overview): It currently extracts `clock[0]` (the first segment) and calculates the duration between its `check_in` and `check_out`.
    - In **MyAttendance.jsx / UserAttendance.jsx** (Details): It iterates through **all** segments in the `clock` array and sums their durations.
- **Formula**:
    - `Segment Duration = (Check Out - Check In) - Segment Break Duration`.
- **Note on Limitations**: The main Salary Sheet overview currently only calculates hours from the *first* clock-in/out of the day. If a user has multiple check-ins (e.g., split shifts or returning after a break), they might not be fully reflected in the overview grid.

## 3. Break Logic

### Allowed Break
- Defined in the **Shift** model as `total_break_minutes`.
- This is **automatically subtracted** from the "Required Hours".
- *Example*: A shift from 9:00 AM to 6:00 PM (9 hours) with 60 minutes break results in 8 required hours.

### Extra Break
- Extra breaks are handled by users marking "Break Start" and "Break End" during their session.
- These durations are stored within the `clock` segments.
- They are subtracted from the **Worked Hours** in the detail views (`MyAttendance.jsx`), effectively reducing the total recorded time.

## 4. Overtime Logic

Overtime is calculated as the surplus of **Worked Hours** over **Required Hours**.

### Allocation
- **Office Overtime**: Hours worked at the office that exceed the daily required hours.
- **Home Overtime**: Hours worked from home that exceed the daily required hours.
- **Outside Hours**: Additionally, users can request "Outside Hours" (manual entries) for work done outside their normal clock-ins. If approved by an admin, these are added to the total worked hours.

### Calculation Flow
1. Calculate `Total Day Worked (Office + Home + Manual)`.
2. Compare with `Shift Required Minutes`.
3. If `Worked > Required`:
    - The `Required` part is first filled by Office hours (the "regular" part).
    - Any excess is distributed:
        - Remaining Office hours -> **Office Overtime**.
        - Remaining Home hours -> **Home Overtime**.
4. Overtime is paid at different rates:
    - **Home Overtime Rate**: `Hourly Rate * 2.0`
    - **Office Overtime Rate**: `Hourly Rate * 2.5`

## 5. Final Sheet Generation

The "Final Sheet" is a permanent archive of a specific month's payroll.
- **Generation**: Clicking "Generate Final Sheet" in `SalarySheet.jsx` takes the current state of the calculated `rowData` (including all bonuses, deductions, and net pay).
- **Storage**: This is sent to the backend and stored in the `salary_sheet_snapshots` table as a JSON snapshot.
- **Archiving**: This ensures that even if salary packages or historical attendance records change later, the "Final Sheet" remains a frozen record of what was actually calculated at the time of archival.

## 6. Components Overview

- **SalarySheet.jsx**: The master controller for admins to view all employees, adjust payments, and generate final snapshots.
- **UserAttendance.jsx**: Detailed view for admins to view and edit raw attendance logs for any user.
- **MyAttendance.jsx**: Personal dashboard for users to track their own attendance, mark check-ins, and see their break/work duration.
- **MyPayroll.jsx**: Personal view for users to see their archived payroll snapshots (Final Sheets).
