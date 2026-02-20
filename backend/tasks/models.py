from django.db import models
from django.utils import timezone
from core.managers import ActiveManager


class TaskStatus(models.TextChoices):
    ASSIGNED = 'assigned', 'Assigned'
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'
    DELAYED = 'delayed', 'Delayed'
    PAUSED = 'paused', 'Paused'


class Priority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    CRITICAL = 'critical', 'Critical'


class Task(models.Model):

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    organization = models.ForeignKey(
        'organization.Organization',
        on_delete=models.CASCADE,
        related_name="tasks"
    )

    department = models.ForeignKey(
        'organization.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks"
    )

    assigned_to = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name="assigned_tasks"
    )

    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name="created_tasks"
    )

    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.ASSIGNED
    )

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )

    deadline = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    
    # Pause functionality fields
    is_paused = models.BooleanField(default=False)
    paused_at = models.DateTimeField(null=True, blank=True)
    pause_duration = models.DurationField(null=True, blank=True)  # Total time paused
    remaining_time = models.DurationField(null=True, blank=True)  # Time left when paused

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Managers
    objects = models.Manager()  # Default manager
    active = ActiveManager()     # Excludes soft-deleted
    
    class Meta:
        db_table = 'tasks'
        indexes = [
            models.Index(fields=['organization', 'is_deleted']),
            models.Index(fields=['status']),
            models.Index(fields=['deadline']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['created_by']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return self.title
    
    def is_overdue(self):
        """Check if task is overdue"""
        if not self.deadline:
            return False
        
        # Paused tasks cannot be overdue
        if self.is_paused:
            return False
            
        return (
            self.deadline < timezone.now() and
            self.status in [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]
        )
    
    def pause_task(self):
        """Pause the task and calculate remaining time"""
        if self.is_paused:
            return False
            
        now = timezone.now()
        self.is_paused = True
        self.paused_at = now
        self.status = TaskStatus.PAUSED
        
        # Calculate remaining time only if there's a deadline
        if self.deadline and self.deadline > now:
            self.remaining_time = self.deadline - now
        else:
            self.remaining_time = None
            
        self.save()
        return True
    
    def resume_task(self):
        """Resume the task and adjust deadline"""
        if not self.is_paused or not self.paused_at:
            return False
            
        now = timezone.now()
        
        # Calculate pause duration
        pause_duration = now - self.paused_at
        if self.pause_duration:
            self.pause_duration += pause_duration
        else:
            self.pause_duration = pause_duration
        
        # Adjust deadline if we have remaining time
        if self.remaining_time and self.deadline:
            self.deadline = now + self.remaining_time
        
        # Reset pause fields
        self.is_paused = False
        self.paused_at = None
        self.remaining_time = None
        
        # Set status back to in_progress
        self.status = TaskStatus.IN_PROGRESS
        
        self.save()
        return True
