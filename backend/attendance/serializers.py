from rest_framework import serializers
from .models import Attendance, Break, BreakCategory, AdminNotification


class BreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = Break
        fields = ['id', 'start_time', 'end_time', 'duration']
        read_only_fields = ['id', 'duration']


class AttendanceSerializer(serializers.ModelSerializer):
    breaks = BreakSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'user', 'user_name', 'punch_in', 'punch_out',
            'total_work_time', 'total_break_time', 'status',
            'breaks', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'organization', 'created_at']


class AttendanceListSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'user', 'user_name', 'punch_in', 'punch_out',
            'total_work_time', 'total_break_time', 'status'
        ]
        read_only_fields = ['id', 'user']



class BreakCategorySerializer(serializers.ModelSerializer):
    """Serializer for break categories"""
    
    class Meta:
        model = BreakCategory
        fields = [
            'id', 'name', 'default_duration_minutes',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StartBreakSerializer(serializers.Serializer):
    """Serializer for starting a break with enhanced data"""
    
    category_id = serializers.IntegerField(required=True)
    reason = serializers.CharField(
        required=True,
        min_length=3,
        max_length=500,
        error_messages={
            'min_length': 'Reason must be at least 3 characters long',
            'required': 'Break reason is required'
        }
    )
    expected_hours = serializers.IntegerField(
        required=True,
        min_value=0,
        max_value=23,
        error_messages={
            'min_value': 'Hours must be between 0 and 23',
            'max_value': 'Hours must be between 0 and 23'
        }
    )
    expected_minutes = serializers.IntegerField(
        required=True,
        min_value=0,
        max_value=59,
        error_messages={
            'min_value': 'Minutes must be between 0 and 59',
            'max_value': 'Minutes must be between 0 and 59'
        }
    )
    
    def validate(self, data):
        """Validate the break submission"""
        # Ensure total duration is greater than zero
        total_minutes = data['expected_hours'] * 60 + data['expected_minutes']
        if total_minutes == 0:
            raise serializers.ValidationError(
                "Expected duration must be greater than zero"
            )
        
        # Validate category exists and is active
        try:
            category = BreakCategory.objects.get(
                id=data['category_id'],
                is_active=True
            )
        except BreakCategory.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid or inactive break category"
            )
        
        data['category'] = category
        data['expected_duration_minutes'] = total_minutes
        return data


class EnhancedBreakSerializer(serializers.ModelSerializer):
    """Serializer for breaks with enhanced tracking fields"""
    
    category_name = serializers.CharField(
        source='category.name',
        read_only=True,
        default='Unspecified'
    )
    expected_end_time = serializers.SerializerMethodField()
    actual_duration_minutes = serializers.SerializerMethodField()
    is_exceeded = serializers.SerializerMethodField()
    overtime_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = Break
        fields = [
            'id', 'start_time', 'end_time', 'duration',
            'category', 'category_name', 'reason',
            'expected_duration_minutes', 'expected_end_time',
            'actual_duration_minutes', 'is_exceeded', 'overtime_minutes'
        ]
        read_only_fields = [
            'id', 'duration', 'expected_end_time',
            'actual_duration_minutes', 'is_exceeded', 'overtime_minutes'
        ]
    
    def get_expected_end_time(self, obj):
        return obj.expected_end_time
    
    def get_actual_duration_minutes(self, obj):
        return obj.actual_duration_minutes
    
    def get_is_exceeded(self, obj):
        return obj.is_exceeded
    
    def get_overtime_minutes(self, obj):
        return obj.overtime_minutes


class AdminNotificationSerializer(serializers.ModelSerializer):
    """Serializer for admin notifications"""
    
    break_id = serializers.IntegerField(source='break_record.id', read_only=True)
    is_break_active = serializers.SerializerMethodField()
    current_overtime_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminNotification
        fields = [
            'id', 'break_id', 'notification_type', 'status',
            'employee_name', 'break_category_name', 'break_reason',
            'expected_duration_minutes', 'overtime_minutes',
            'is_break_active', 'current_overtime_minutes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_is_break_active(self, obj):
        """Check if the break is still active"""
        try:
            return obj.break_record.end_time is None
        except:
            return False
    
    def get_current_overtime_minutes(self, obj):
        """Get current overtime if break is still active"""
        try:
            if obj.break_record.end_time is None:
                return obj.break_record.overtime_minutes
            return obj.overtime_minutes
        except:
            return obj.overtime_minutes
