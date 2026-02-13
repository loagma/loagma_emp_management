from django.db import models
from users.models import User


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
    """Break periods during work"""
    
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='breaks')
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'breaks'
        ordering = ['-start_time']
    
    def __str__(self):
        return f"Break for {self.attendance.user.username} at {self.start_time}"
