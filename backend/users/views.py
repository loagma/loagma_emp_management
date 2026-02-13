"""
Views for user authentication and profile.
"""
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, status
from django.db.models import Count, Q

from core.mixins import OrganizationQuerysetMixin
from core.permissions import IsManagerOrOwner
from .models import User
from .serializers import UserListSerializer, UserDetailSerializer, EmployeeCreateSerializer
from tasks.models import Task, TaskStatus


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Get current authenticated user's profile.
    
    Returns user details including organization and role information.
    """
    serializer = UserDetailSerializer(request.user)
    return Response(serializer.data)


class EmployeeViewSet(OrganizationQuerysetMixin, viewsets.ModelViewSet):
    """
    ViewSet for employee management.
    
    Endpoints:
    - GET /api/employees/ - List employees
    - POST /api/employees/ - Create employee
    - GET /api/employees/{id}/ - Get employee detail
    - PUT/PATCH /api/employees/{id}/ - Update employee
    - DELETE /api/employees/{id}/ - Delete employee (soft delete)
    - PATCH /api/employees/{id}/toggle-active/ - Toggle active status
    """
    
    queryset = User.active.all()
    permission_classes = [IsManagerOrOwner]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return EmployeeCreateSerializer
        elif self.action == 'list':
            return UserListSerializer
        return UserDetailSerializer
    
    def get_queryset(self):
        """Filter employees by organization and exclude superusers"""
        qs = super().get_queryset()
        # Exclude superusers from employee list
        return qs.filter(is_superuser=False, is_staff=False)
    
    def perform_create(self, serializer):
        """Create employee with organization context"""
        # Set organization from current user
        serializer.save(
            organization=self.request.user.organization,
            role='employee',
            is_superuser=False,
            is_staff=False
        )
    
    def perform_update(self, serializer):
        """Update employee, prevent role/superuser changes"""
        serializer.save(
            role='employee',
            is_superuser=False,
            is_staff=False
        )
    
    def perform_destroy(self, instance):
        """Soft delete employee"""
        instance.is_deleted = True
        instance.is_active = False
        instance.save()
    
    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        """Toggle employee active status"""
        employee = self.get_object()
        employee.is_active = not employee.is_active
        employee.save()
        
        serializer = self.get_serializer(employee)
        return Response(serializer.data)
    
    def get_queryset(self):
        """Get employees in user's organization"""
        queryset = super().get_queryset()
        
        # Optimize queries
        queryset = queryset.select_related('organization', 'department')
        
        # Exclude superusers and staff
        queryset = queryset.filter(is_superuser=False, is_staff=False)
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """
        Get employee detail with task summary.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Calculate task summary
        assigned_tasks = Task.active.filter(assigned_to=instance)
        
        task_summary = {
            'total_assigned': assigned_tasks.count(),
            'completed': assigned_tasks.filter(status=TaskStatus.COMPLETED).count(),
            'in_progress': assigned_tasks.filter(status=TaskStatus.IN_PROGRESS).count(),
            'pending': assigned_tasks.filter(status=TaskStatus.ASSIGNED).count(),
            'delayed': assigned_tasks.filter(status=TaskStatus.DELAYED).count(),
        }
        
        # Calculate completion rate
        if task_summary['total_assigned'] > 0:
            task_summary['completion_rate'] = round(
                (task_summary['completed'] / task_summary['total_assigned']) * 100,
                2
            )
        else:
            task_summary['completion_rate'] = 0.0
        
        # Combine data
        response_data = serializer.data
        response_data['task_summary'] = task_summary
        
        return Response(response_data)
