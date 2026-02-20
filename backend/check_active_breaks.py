import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from attendance.models import Break, AdminNotification
from attendance.services import BreakMonitoringService

print("Checking active breaks...")
active_breaks = Break.objects.filter(end_time__isnull=True)
print(f"Total active breaks: {active_breaks.count()}")

for b in active_breaks:
    print(f"\nBreak ID: {b.id}")
    print(f"Employee: {b.attendance.user.username}")
    print(f"Expected: {b.expected_duration_minutes} min")
    print(f"Actual: {b.actual_duration_minutes} min")
    print(f"Exceeded: {b.is_exceeded}")
    
    if b.is_exceeded and b.expected_duration_minutes:
        existing = AdminNotification.objects.filter(
            break_record=b,
            status__in=['unread', 'read']
        ).first()
        
        if existing:
            print(f"Notification exists: ID={existing.id}, Status={existing.status}")
        else:
            print("Creating notification...")
            BreakMonitoringService.create_notification(b)
            print("Notification created!")

print("\n\nUnread notifications:")
unread = AdminNotification.objects.filter(status='unread')
print(f"Count: {unread.count()}")
for n in unread:
    print(f"  - {n.employee_name}: {n.overtime_minutes} min overtime")
