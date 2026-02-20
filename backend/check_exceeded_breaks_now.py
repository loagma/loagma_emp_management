"""
Manually check for exceeded breaks and create notifications
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from attendance.services import BreakMonitoringService
from attendance.models import Break, AdminNotification

print("=" * 60)
print("CHECKING FOR EXCEEDED BREAKS")
print("=" * 60)

# Get all active breaks
active_breaks = Break.objects.filter(
    end_time__isnull=True,
    expected_duration_minutes__isnull=False
).select_related('attendance__user', 'category', 'attendance__organization')

print(f"\n📋 Found {active_breaks.count()} active breaks with expected duration")

for break_record in active_breaks:
    user = break_record.attendance.user
    employee_name = user.get_full_name() or user.username
    category_name = break_record.category.name if break_record.category else 'Unspecified'
    
    print(f"\n👤 Employee: {employee_name}")
    print(f"   Category: {category_name}")
    print(f"   Expected: {break_record.expected_duration_minutes} minutes")
    print(f"   Actual: {break_record.actual_duration_minutes} minutes")
    print(f"   Exceeded: {'YES' if break_record.is_exceeded else 'NO'}")
    
    if break_record.is_exceeded:
        print(f"   Overtime: {break_record.overtime_minutes} minutes")
        
        # Check if notification already exists
        existing = AdminNotification.objects.filter(
            break_record=break_record,
            status__in=['unread', 'read']
        ).first()
        
        if existing:
            print(f"   ⚠️  Notification already exists (ID: {existing.id}, Status: {existing.status})")
        else:
            print(f"   ✅ Creating notification...")
            BreakMonitoringService.create_notification(break_record)
            print(f"   ✅ Notification created!")

# Show all notifications
print("\n" + "=" * 60)
print("ALL NOTIFICATIONS")
print("=" * 60)

notifications = AdminNotification.objects.all().order_by('-created_at')
print(f"\nTotal notifications: {notifications.count()}")

for notif in notifications:
    print(f"\n📢 Notification ID: {notif.id}")
    print(f"   Employee: {notif.employee_name}")
    print(f"   Category: {notif.break_category_name}")
    print(f"   Expected: {notif.expected_duration_minutes} min")
    print(f"   Overtime: {notif.overtime_minutes} min")
    print(f"   Status: {notif.status}")
    print(f"   Created: {notif.created_at}")

print("\n" + "=" * 60)
print("CHECK COMPLETE")
print("=" * 60)
