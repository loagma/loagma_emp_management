"""
Views for task management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from core.mixins import OrganizationQuerysetMixin
from core.permissions import IsManagerOrOwner, IsAssignedOrManager
from .models import Task
from .serializers import (
    TaskListSerializer,
    TaskDetailSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskStatusUpdateSerializer,
    TaskPriorityUpdateSerializer
)
from .services import TaskService


class TaskViewSet(OrganizationQuerysetMixin, viewsets.ModelViewSet):
    """
    ViewSet for task CRUD operations.
    Automatically filtered by organization via mixin.
    
    Endpoints:
    - GET /api/tasks/ - List tasks
    - POST /api/tasks/ - Create task
    - GET /api/tasks/{id}/ - Get task detail
    - PUT/PATCH /api/tasks/{id}/ - Update task
    - DELETE /api/tasks/{id}/ - Soft delete task
    - PATCH /api/tasks/{id}/status/ - Quick status update
    """
    
    queryset = Task.active.all()
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'department']
    ordering_fields = ['created_at', 'updated_at', 'deadline', 'priority']
    search_fields = ['title', 'description']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TaskUpdateSerializer
        elif self.action == 'list':
            return TaskListSerializer
        return TaskDetailSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action"""
        if self.action == 'destroy':
            # Only Owner or Manager can delete tasks
            return [IsManagerOrOwner()]
        # All authenticated users can create and view tasks
        # Object-level permissions handled by IsAssignedOrManager
        return [IsAssignedOrManager()]
    
    def get_queryset(self):
        """
        Get queryset with optimizations and role-based filtering.
        """
        queryset = super().get_queryset()
        
        # Optimize queries with select_related and prefetch_related
        queryset = queryset.select_related(
            'assigned_to',
            'created_by',
            'department',
            'organization'
        ).only(
            'id', 'title', 'description', 'status', 'priority', 'deadline',
            'assigned_to__id', 'assigned_to__username', 'assigned_to__email', 'assigned_to__role',
            'created_by__id', 'created_by__username',
            'department__id', 'department__name',
            'organization__id', 'organization__name',
            'created_at', 'updated_at', 'is_deleted'
        )
        
        # Apply role-based filtering
        user = self.request.user
        
        if user.role == 'owner':
            # Owner sees all organization tasks (already filtered by mixin)
            pass
        elif user.role == 'manager':
            # Manager sees only department tasks
            if user.department:
                queryset = queryset.filter(department=user.department)
            else:
                # Manager without department sees nothing
                queryset = queryset.none()
        else:
            # Employee sees only assigned tasks
            queryset = queryset.filter(assigned_to=user)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create task using service layer"""
        validated_data = serializer.validated_data
        
        # If employee, force assign to themselves
        if self.request.user.role == 'employee':
            validated_data['assigned_to'] = self.request.user
        
        task = TaskService.create_task(
            user=self.request.user,
            validated_data=validated_data
        )
        # Set the instance for the response
        serializer.instance = task
    
    def perform_destroy(self, instance):
        """Soft delete task using service layer"""
        TaskService.soft_delete_task(instance)
    
    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """
        Quick status update endpoint.
        
        PATCH /api/tasks/{id}/status/
        Body: {"status": "completed"}
        """
        task = self.get_object()
        serializer = TaskStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated_task = TaskService.update_task_status(
            task=task,
            new_status=serializer.validated_data['status']
        )
        
        return Response(
            TaskDetailSerializer(updated_task).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['patch'], url_path='priority')
    def update_priority(self, request, pk=None):
        """
        Quick priority update endpoint.
        
        PATCH /api/tasks/{id}/priority/
        Body: {"priority": "high"}
        """
        task = self.get_object()
        serializer = TaskPriorityUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Update priority directly
        task.priority = serializer.validated_data['priority']
        task.save()
        
        return Response(
            TaskDetailSerializer(task).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['patch'], url_path='pause')
    def pause_task(self, request, pk=None):
        """
        Pause a task.
        
        PATCH /api/tasks/{id}/pause/
        """
        task = self.get_object()
        
        if task.pause_task():
            return Response(
                {
                    'message': 'Task paused successfully',
                    'task': TaskDetailSerializer(task).data
                },
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'Task cannot be paused'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['patch'], url_path='resume')
    def resume_task(self, request, pk=None):
        """
        Resume a paused task.
        
        PATCH /api/tasks/{id}/resume/
        """
        task = self.get_object()
        
        if task.resume_task():
            return Response(
                {
                    'message': 'Task resumed successfully',
                    'task': TaskDetailSerializer(task).data
                },
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'Task cannot be resumed'},
                status=status.HTTP_400_BAD_REQUEST
            )
