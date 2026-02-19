"""
Serializers for User model.
"""
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import User


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for user list (minimal data)"""
    
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'role_display', 'department', 'is_active']
        read_only_fields = ['id']


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for user detail (full data)"""
    
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'organization', 'organization_name',
            'department', 'department_name', 'profile_picture', 'date_joined', 
            'is_superuser', 'is_staff', 'is_active'
        ]
        read_only_fields = ['id', 'organization', 'date_joined', 'is_superuser', 'is_staff']
    
    def get_profile_picture(self, obj):
        """Get URL for profile picture from Cloudinary"""
        try:
            if hasattr(obj, 'profile_picture') and obj.profile_picture:
                # Cloudinary field returns the URL directly
                if hasattr(obj.profile_picture, 'url'):
                    return obj.profile_picture.url
                # If it's already a string URL
                return str(obj.profile_picture)
            return None
        except Exception as e:
            print(f"Error getting profile picture for user {obj.id}: {e}")
            return None


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating employees with password"""
    
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'department'
        ]
    
    def create(self, validated_data):
        """Create employee user with hashed password"""
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class EnhancedEmployeeListSerializer(serializers.ModelSerializer):
    """Enhanced serializer for employee list with additional information"""
    
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    profile_picture_url = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    today_work_hours = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'department', 'department_name',
            'profile_picture_url', 'task_count', 'today_work_hours',
            'last_activity', 'is_active'
        ]
        read_only_fields = ['id']
    
    def get_profile_picture_url(self, obj):
        """Get URL for profile picture from Cloudinary"""
        try:
            if hasattr(obj, 'profile_picture') and obj.profile_picture:
                # Cloudinary field returns the URL directly
                if hasattr(obj.profile_picture, 'url'):
                    return obj.profile_picture.url
                # If it's already a string URL
                return str(obj.profile_picture)
            return None
        except Exception as e:
            print(f"Error getting profile picture for user {obj.id}: {e}")
            return None
    
    def get_task_count(self, obj):
        """Get count of assigned and in-progress tasks"""
        try:
            from tasks.models import Task
            return Task.active.filter(
                assigned_to=obj,
                status__in=['assigned', 'in_progress']
            ).count()
        except Exception as e:
            print(f"Error getting task count for user {obj.id}: {e}")
            return 0
    
    def get_today_work_hours(self, obj):
        """Calculate total work hours for today"""
        try:
            from attendance.models import Attendance
            
            today = timezone.now().date()
            attendance = Attendance.objects.filter(
                user=obj,
                punch_in__date=today
            ).first()
            
            if not attendance:
                return "0h 0m"
            
            # Calculate work time
            if attendance.total_work_time:
                total_seconds = int(attendance.total_work_time.total_seconds())
            else:
                # If still working, calculate current duration
                if attendance.punch_in and not attendance.punch_out:
                    duration = timezone.now() - attendance.punch_in
                    # Subtract break time
                    if attendance.total_break_time:
                        duration -= attendance.total_break_time
                    total_seconds = max(0, int(duration.total_seconds()))
                else:
                    total_seconds = 0
            
            # Format as "Xh Ym"
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return f"{hours}h {minutes}m"
        except Exception as e:
            print(f"Error getting work hours for user {obj.id}: {e}")
            return "0h 0m"
    
    def get_last_activity(self, obj):
        """Get timestamp of last activity (attendance or task update)"""
        try:
            from attendance.models import Attendance
            from tasks.models import Task
            
            # Get latest attendance
            latest_attendance = Attendance.objects.filter(user=obj).order_by('-punch_in').first()
            
            # Get latest task update
            latest_task = Task.active.filter(assigned_to=obj).order_by('-updated_at').first()
            
            # Compare and return the most recent
            attendance_time = latest_attendance.punch_in if latest_attendance else None
            task_time = latest_task.updated_at if latest_task else None
            
            if attendance_time and task_time:
                return max(attendance_time, task_time).isoformat()
            elif attendance_time:
                return attendance_time.isoformat()
            elif task_time:
                return task_time.isoformat()
            
            return None
        except Exception as e:
            print(f"Error getting last activity for user {obj.id}: {e}")
            return None
