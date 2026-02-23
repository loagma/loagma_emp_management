"""
Serializers for Task model.
"""
from rest_framework import serializers
from .models import Task, TaskStatus, Priority
from users.serializers import UserListSerializer


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer for task list"""
    
    assigned_to_user = UserListSerializer(source='assigned_to', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'status_display',
            'priority', 'priority_display', 'deadline',
            'assigned_to', 'assigned_to_user', 'is_overdue',
            'is_paused', 'remaining_time',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_is_overdue(self, obj):
        return obj.is_overdue()


class TaskDetailSerializer(serializers.ModelSerializer):
    """Serializer for task detail"""
    
    assigned_to_user = UserListSerializer(source='assigned_to', read_only=True)
    created_by_user = UserListSerializer(source='created_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'status_display',
            'priority', 'priority_display', 'deadline',
            'assigned_to', 'assigned_to_user',
            'created_by', 'created_by_user',
            'department', 'department_name', 'is_overdue',
            'is_paused', 'paused_at', 'pause_duration', 'remaining_time',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'organization', 'created_at', 'updated_at']
    
    def get_is_overdue(self, obj):
        return obj.is_overdue()


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for task creation"""
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'assigned_to',
            'department', 'priority', 'deadline'
        ]
    
    def validate_assigned_to(self, value):
        """Ensure assigned_to user is in same organization"""
        request = self.context.get('request')
        if not request or not request.user.organization:
            raise serializers.ValidationError("User must belong to an organization")
        
        if value.organization != request.user.organization:
            raise serializers.ValidationError(
                "Cannot assign task to user from different organization"
            )
        return value
    
    def validate_department(self, value):
        """Ensure department is in same organization"""
        if value:
            request = self.context.get('request')
            if not request or not request.user.organization:
                raise serializers.ValidationError("User must belong to an organization")
            
            if value.organization != request.user.organization:
                raise serializers.ValidationError(
                    "Department must belong to your organization"
                )
        return value


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer for task update"""
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'assigned_to',
            'department', 'priority', 'deadline', 'status'
        ]
    
    def validate_assigned_to(self, value):
        """Ensure assigned_to user is in same organization"""
        request = self.context.get('request')
        if value.organization != request.user.organization:
            raise serializers.ValidationError(
                "Cannot assign task to user from different organization"
            )
        return value
    
    def validate_department(self, value):
        """Ensure department is in same organization"""
        if value:
            request = self.context.get('request')
            if value.organization != request.user.organization:
                raise serializers.ValidationError(
                    "Department must belong to your organization"
                )
        return value


class TaskStatusUpdateSerializer(serializers.Serializer):
    """Serializer for quick status update"""
    
    status = serializers.ChoiceField(choices=TaskStatus.choices)


class TaskPriorityUpdateSerializer(serializers.Serializer):
    """Serializer for quick priority update"""
    
    priority = serializers.ChoiceField(choices=Priority.choices)
