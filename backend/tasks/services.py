"""
Business logic for task operations.
"""
from django.utils import timezone
from .models import Task, TaskStatus


class TaskService:
    """Service layer for task business logic"""
    
    @staticmethod
    def create_task(user, validated_data):
        """
        Create a new task with automatic organization assignment.
        
        Args:
            user: The user creating the task
            validated_data: Validated data from serializer
        
        Returns:
            Task: The created task instance
        """
        task = Task.objects.create(
            organization=user.organization,
            created_by=user,
            **validated_data
        )
        return task
    
    @staticmethod
    def update_task_status(task, new_status):
        """
        Update task status with business logic.
        
        Args:
            task: Task instance to update
            new_status: New status value
        
        Returns:
            Task: Updated task instance
        """
        task.status = new_status
        task.save(update_fields=['status', 'updated_at'])
        return task
    
    @staticmethod
    def soft_delete_task(task):
        """
        Soft delete a task (set is_deleted=True).
        
        Args:
            task: Task instance to delete
        
        Returns:
            Task: Soft-deleted task instance
        """
        task.is_deleted = True
        task.save(update_fields=['is_deleted', 'updated_at'])
        return task
    
    @staticmethod
    def get_overdue_tasks(organization):
        """
        Get all overdue tasks for an organization.
        
        Args:
            organization: Organization instance
        
        Returns:
            QuerySet: Overdue tasks
        """
        return Task.active.filter(
            organization=organization,
            deadline__lt=timezone.now(),
            status__in=[TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]
        ).select_related('assigned_to', 'created_by')
    
    @staticmethod
    def get_user_tasks(user):
        """
        Get tasks accessible to a user based on their role.
        
        Args:
            user: User instance
        
        Returns:
            QuerySet: Filtered tasks
        """
        if user.role == 'owner':
            # Owner sees all organization tasks
            return Task.active.filter(organization=user.organization)
        elif user.role == 'manager':
            # Manager sees department tasks
            return Task.active.filter(
                organization=user.organization,
                department=user.department
            )
        else:
            # Employee sees only assigned tasks
            return Task.active.filter(assigned_to=user)
