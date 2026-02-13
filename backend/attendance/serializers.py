from rest_framework import serializers
from .models import Attendance, Break


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
            'id', 'user_name', 'punch_in', 'punch_out',
            'total_work_time', 'total_break_time', 'status'
        ]
