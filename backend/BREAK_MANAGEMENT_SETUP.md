# Enhanced Break Management System - Setup Guide

## ✅ What's Working Now

The Enhanced Break Management System is fully functional with the following features:

### Core Features (Working)
1. **Break Categories**: 6 predefined categories per organization
   - Lunch Break (60 min)
   - Coffee Break (15 min)
   - Personal Break (10 min)
   - Meeting (30 min)
   - Restroom (5 min)
   - Other (15 min)

2. **Enhanced Break Start**: Employees can start breaks with:
   - Category selection
   - Reason (minimum 3 characters)
   - Expected duration (hours and minutes)

3. **Break Tracking**: System automatically:
   - Calculates expected end time
   - Tracks actual duration
   - Identifies when breaks exceed expected duration
   - Calculates overtime

4. **Break History**: View past breaks with:
   - Filtering by date range
   - Filtering by category
   - Filtering by employee (admin only)

5. **Break Statistics**: Analytics including:
   - Average duration per category
   - Most frequently used categories
   - Total break counts

6. **Active Breaks Monitor**: Real-time view of ongoing breaks (admin only)

7. **Backward Compatibility**: Legacy breaks without categories still work

## 📋 API Endpoints Available

### Break Categories
- `GET /api/attendance/break-categories/` - List active categories
- `POST /api/attendance/break-categories/` - Create category (admin)

### Breaks
- `POST /api/attendance/start-break/` - Start break (enhanced or legacy)
- `POST /api/attendance/end-break/` - End break
- `GET /api/attendance/break-history/` - Get break history
- `GET /api/attendance/break-statistics/` - Get statistics
- `GET /api/attendance/active-breaks/` - Get active breaks (admin)

### Admin Notifications
- `GET /api/attendance/notifications/` - List notifications (admin)
- `POST /api/attendance/notifications/{id}/mark-read/` - Mark as read
- `POST /api/attendance/notifications/{id}/dismiss/` - Dismiss
- `GET /api/attendance/notifications/unread-count/` - Get unread count

## 🔧 Optional: Enable Automatic Break Monitoring

To enable automatic monitoring of exceeded breaks (creates admin notifications every 3 minutes):

### 1. Install Celery Dependencies
```bash
pip install celery redis django-celery-beat
```

### 2. Install and Start Redis
**Windows:**
- Download Redis from: https://github.com/microsoftarchive/redis/releases
- Or use WSL: `sudo apt-get install redis-server`
- Start Redis: `redis-server`

**Linux/Mac:**
```bash
# Install Redis
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                  # macOS

# Start Redis
redis-server
```

### 3. Start Celery Worker
```bash
cd backend
celery -A core worker -l info
```

### 4. Start Celery Beat (Scheduler)
```bash
cd backend
celery -A core beat -l info
```

## 🎨 Frontend Integration

### Using the BreakStartModal Component

```javascript
import BreakStartModal from './components/attendance/BreakStartModal';

function AttendanceDashboard() {
  const [showBreakModal, setShowBreakModal] = useState(false);

  const handleBreakSuccess = () => {
    // Refresh attendance data
    refetchAttendance();
  };

  return (
    <>
      <button onClick={() => setShowBreakModal(true)}>
        Start Break
      </button>

      <BreakStartModal
        isOpen={showBreakModal}
        onClose={() => setShowBreakModal(false)}
        onSuccess={handleBreakSuccess}
      />
    </>
  );
}
```

## 📊 Database Schema

### New Tables
- `attendance_breakcategory` - Break categories
- `attendance_adminnotification` - Admin notifications

### Modified Tables
- `breaks` - Added: category, reason, expected_duration_minutes

## 🧪 Testing the System

### 1. Test Break Start (Enhanced)
```bash
curl -X POST http://localhost:8000/api/attendance/start-break/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "reason": "Lunch time",
    "expected_hours": 1,
    "expected_minutes": 0
  }'
```

### 2. Test Break Start (Legacy - Still Works)
```bash
curl -X POST http://localhost:8000/api/attendance/start-break/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get Break Categories
```bash
curl http://localhost:8000/api/attendance/break-categories/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Break History
```bash
curl http://localhost:8000/api/attendance/break-history/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Next Steps

### Remaining Frontend Components (Optional)
1. **BreakHistory Component** - Display break history table
2. **BreakStatistics Component** - Display analytics dashboard
3. **AdminNotificationPanel** - Notification UI for admins
4. **ActiveBreaksMonitor** - Real-time active breaks display

### Integration Points
- Add BreakStartModal to employee dashboard
- Add break history to employee profile
- Add admin notification panel to admin dashboard
- Add active breaks monitor to admin dashboard

## 📝 Notes

- The system works without Celery - you just won't have automatic monitoring
- All existing break functionality remains unchanged
- Break categories are organization-specific
- Admins can create custom categories
- Default categories are created automatically for each organization

## 🐛 Troubleshooting

### Server won't start
- Make sure all migrations are applied: `python manage.py migrate`
- Check for syntax errors in new files

### Celery not working
- Ensure Redis is running: `redis-cli ping` (should return PONG)
- Check Celery worker logs for errors
- Verify CELERY_BROKER_URL in settings.py

### Break categories not showing
- Run migrations: `python manage.py migrate attendance`
- Check if default categories were created
- Verify user has an organization assigned

## 📚 Documentation

For full specification, see:
- `.kiro/specs/enhanced-break-management/requirements.md`
- `.kiro/specs/enhanced-break-management/design.md`
- `.kiro/specs/enhanced-break-management/tasks.md`
