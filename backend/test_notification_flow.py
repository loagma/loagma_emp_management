"""
Test the complete notification flow
"""
import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from attendance.models import Break, AdminNotification, Attendance
from users.models import User
from django.utils import timezone

print("=" * 60)
print("NOTIFICATION FLOW TEST")
print("=" * 60)

# Get employee
employee = User.objects.get(username='testemp')
print(f"\n1. Employee: {employee.username}")

# Get current attendance
attendance = Attendance.objects.filter(
    user=employee,
    punch_out__isnull=True
).first()

if not attendance:
    print("   No active attendance - employee needs to punch in first")
    exit()

print(f"   Attendance ID: {attendance.id}")
print(f"   Status: {attendance.status}")

# Check for active break
active_break = Break.objects.filter(
    attendance=attendance,
    end_time__isnull=True
).first()

if active_break:
    print(f"\n2. Active Break Found:")
    print(f"   Break ID: {active_break.id}")
    print(f"   Expected Duration: {active_break.expected_duration_minutes} min")
    print(f"   Actual Duration: {active_break.actual_duration_minutes} min")
    print(f"   Is Exceeded: {active_break.is_exceeded}")
    
    if active_break.is_exceeded and active_break.expected_duration_minutes:
        print(f"\n3. Break is EXCEEDED by {active_break.overtime_minutes} minutes!")
        
        # Check for existing notification
        existing = AdminNotification.objects.filter(
            break_record=active_break,
            status__in=['unread', 'read']
        ).first()
        
        if existing:
            print(f"   Notification already exists:")
            print(f"   - ID: {existing.id}")
            print(f"   - Status: {existing.status}")
            print(f"   - Created: {existing.created_at}")
        else:
            print(f"   No notification found - this should not happen!")
            print(f"   The /api/attendance/current/ endpoint should have created one")
    else:
        print(f"\n3. Break is NOT exceeded yet")
        if active_break.expected_duration_minutes:
            remaining = active_break.expected_duration_minutes - active_break.actual_duration_minutes
            print(f"   Time remaining: {remaining} minutes")
else:
    print(f"\n2. No active break")

# Show all unread notifications
print(f"\n4. Unread Notifications:")
unread = AdminNotification.objects.filter(
    organization=employee.organization,
    status='unread'
)
print(f"   Count: {unread.count()}")
for n in unread:
    print(f"   - {n.employee_name}: {n.break_category_name}, {n.overtime_minutes} min overtime")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
print("\nNext steps:")
print("1. If employee has active exceeded break, notification should exist")
print("2. Admin dashboard should show notification badge")
print("3. If no notification, employee needs to start a NEW break with expected duration")
