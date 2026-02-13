from django.db import models
from django.utils import timezone
from core.managers import ActiveManager


class TaskStatus(models.TextChoices):
    ASSIGNED = 'assigned', 'Assigned'
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'
    DELAYED = 'delayed', 'Delayed'


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
        return (
            self.deadline < timezone.now() and
            self.status in [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]
        )
