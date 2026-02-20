"""
Services for break monitoring and notification management.
"""
from django.utils import timezone
from .models import Break, AdminNotification


class BreakMonitoringService:
    """Service for monitoring breaks and creating notifications"""
    
    @staticmethod
    def check_exceeded_breaks():
        """
        Check all active breaks for exceeded durations.
        Called periodically by Celery task.
        """
        active_breaks = Break.objects.filter(
            end_time__isnull=True,
            expected_duration_minutes__isnull=False
        ).select_related('attendance__user', 'category', 'attendance__organization')
        
        for break_record in active_breaks:
            if break_record.is_exceeded:
                # Check if notification already exists
                existing = AdminNotification.objects.filter(
                    break_record=break_record,
                    status__in=['unread', 'read']
                ).exists()
                
                if not existing:
                    BreakMonitoringService.create_notification(break_record)
    
    @staticmethod
    def create_notification(break_record):
        """Create admin notification for exceeded break"""
        user = break_record.attendance.user
        employee_name = user.get_full_name() or user.username
        category_name = break_record.category.name if break_record.category else 'Unspecified'
        
        AdminNotification.objects.create(
            break_record=break_record,
            organization=break_record.attendance.organization,
            employee_name=employee_name,
            break_category_name=category_name,
            break_reason=break_record.reason,
            expected_duration_minutes=break_record.expected_duration_minutes,
            overtime_minutes=break_record.overtime_minutes
        )
    
    @staticmethod
    def dismiss_notifications_for_break(break_record):
        """Auto-dismiss notifications when break ends"""
        AdminNotification.objects.filter(
            break_record=break_record,
            status__in=['unread', 'read']
        ).update(status='dismissed')
