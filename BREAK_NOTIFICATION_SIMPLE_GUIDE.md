# Break Notification System - Simple Guide

## What Was Implemented:

When an employee's break exceeds the expected time, the admin gets a notification.

## How to See It Work:

### Step 1: Employee Starts Break (1 minute)
1. Login as employee
2. Punch in if not already
3. Click "Start Break"
4. Select category, enter reason
5. Set duration: **1 minute**
6. Click "Start Break"

### Step 2: Wait (2 minutes)
- Wait 2 minutes
- Employee dashboard will auto-refresh
- Notification will be created automatically

### Step 3: Admin Sees Notification
1. Login as admin
2. Go to dashboard
3. See bell icon (top-right)
4. Red badge shows count
5. Click to view details

## Technical Details:

### When Notification is Created:
- Employee dashboard calls `/api/attendance/current/` every few seconds
- This endpoint checks if break is exceeded
- If exceeded, creates notification automatically
- No manual action needed

### When Admin Sees It:
- Admin dashboard has bell icon
- Polls every 30 seconds for new notifications
- Shows red badge with count
- Click to open notification panel

### Files Changed:
1. **Backend**:
   - `backend/attendance/views.py` - Added notification check in `current()` endpoint
   - `backend/core/permissions.py` - Allow superusers to see notifications

2. **Frontend**:
   - `frontend/src/pages/DashboardPage.jsx` - Added notification badge
   - `frontend/src/components/attendance/BreakNotificationBadge.jsx` - Bell icon with count
   - `frontend/src/components/attendance/BreakNotificationPanel.jsx` - Notification list

## Why It Works:

1. **Real-time check**: Every time employee dashboard refreshes, it checks for exceeded breaks
2. **Auto-create**: Notification created immediately when break exceeds
3. **Auto-poll**: Admin dashboard checks every 30 seconds
4. **No Celery needed**: Works without background tasks

## Current Status:

✅ System is ready and working
✅ No active exceeded breaks right now
✅ Employee needs to start a NEW break to test
✅ Admin will see notification within 30 seconds of break exceeding

## Test Now:

1. Have employee start 1-minute break
2. Wait 2 minutes
3. Admin refreshes dashboard
4. See notification badge appear

That's it! Simple and working.
