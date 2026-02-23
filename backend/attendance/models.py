from django.db import models
from django.utils import timezone
from datetime import timedelta
from users.models import User


class BreakCategory(models.Model):
    """Predefined break categories with default durations"""
    
    name = models.CharField(max_length=50)
    default_duration_minutes = models.IntegerField(
        help_text="Default duration in minutes"
    )
    is_active = models.BooleanField(default=True)
    organization = models.ForeignKey(
        'organization.Organization',
        on_delete=models.CASCADE,
        related_name='break_categories'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance_breakcategory'
        unique_together = [['name', 'organization']]
        ordering = ['name']
        verbose_name = 'Break Category'
        verbose_name_plural = 'Break Categories'
    
    def __str__(self):
        return f"{self.name} ({self.default_duration_minutes} min)"


class Attendance(models.Model):
    """Employee attendance tracking"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    organization = models.ForeignKey('organization.Organization', on_delete=models.CASCADE)
    
    punch_in = models.DateTimeField()
    punch_out = models.DateTimeField(null=True, blank=True)
    
    total_work_time = models.DurationField(null=True, blank=True)  # Total time worked
    total_break_time = models.DurationField(null=True, blank=True)  # Total break time
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('punched_in', 'Punched In'),
            ('on_break', 'On Break'),
            ('punched_out', 'Punched Out'),
        ],
        default='punched_in'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendances'
        ordering = ['-punch_in']
        indexes = [
            models.Index(fields=['user', 'punch_in']),
            models.Index(fields=['organization', 'punch_in']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.punch_in.date()}"


class Break(models.Model):
    """Break periods during work with enhanced tracking"""
    
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='breaks')
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)
    
    # New fields for enhanced tracking
    category = models.ForeignKey(
        BreakCategory,
        on_delete=models.PROTECT,
        related_name='breaks',
        null=True,  # Nullable for backward compatibility
        blank=True
    )
    reason = models.TextField(
        blank=True,
        default='',
        help_text="Employee-provided reason for break"
    )
    expected_duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        help_text="Expected break duration in minutes"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'breaks'
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['attendance', 'start_time']),
            models.Index(fields=['category']),
            models.Index(fields=['start_time', 'end_time']),
        ]
    
    def __str__(self):
        return f"Break for {self.attendance.user.username} at {self.start_time}"
    
    @property
    def expected_end_time(self):
        """Calculate expected end time based on expected duration"""
        if self.expected_duration_minutes:
            return self.start_time + timedelta(minutes=self.expected_duration_minutes)
        return None
    
    @property
    def actual_duration_minutes(self):
        """Calculate actual duration in minutes"""
        if self.end_time:
            return int((self.end_time - self.start_time).total_seconds() / 60)
        else:
            return int((timezone.now() - self.start_time).total_seconds() / 60)
    
    @property
    def is_exceeded(self):
        """Check if break has exceeded expected duration"""
        if not self.expected_duration_minutes:
            return False
        return self.actual_duration_minutes > self.expected_duration_minutes
    
    @property
    def overtime_minutes(self):
        """Calculate overtime in minutes"""
        if not self.is_exceeded:
            return 0
        return self.actual_duration_minutes - self.expected_duration_minutes



class AdminNotification(models.Model):
    """Notifications for admins when breaks exceed expected duration or tasks are paused"""
    
    NOTIFICATION_TYPE_CHOICES = [
        ('break_exceeded', 'Break Exceeded'),
        ('task_pause', 'Task Paused'),
    ]
    
    STATUS_CHOICES = [
        ('unread', 'Unread'),
        ('read', 'Read'),
        ('dismissed', 'Dismissed'),
    ]
    
    break_record = models.ForeignKey(
        Break,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    organization = models.ForeignKey(
        'organization.Organization',
        on_delete=models.CASCADE,
        related_name='break_notifications'
    )
    employee = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='admin_notifications',
        null=True,
        blank=True
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='break_exceeded'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='unread'
    )
    message = models.TextField(blank=True)  # General message field for task pauses
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Snapshot data (in case break is deleted)
    employee_name = models.CharField(max_length=255)
    break_category_name = models.CharField(max_length=50, null=True, blank=True)
    break_reason = models.TextField(blank=True)
    expected_duration_minutes = models.IntegerField(null=True, blank=True)
    overtime_minutes = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'attendance_adminnotification'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['break_record']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Admin Notification'
        verbose_name_plural = 'Admin Notifications'
    
    def __str__(self):
        return f"Notification for {self.employee_name} - {self.break_category_name} ({self.status})"
