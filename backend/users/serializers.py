"""
Serializers for User model.
"""
from rest_framework import serializers
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
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'organization', 'organization_name',
            'department', 'department_name', 'date_joined', 'is_superuser', 'is_staff', 'is_active'
        ]
        read_only_fields = ['id', 'organization', 'date_joined', 'is_superuser', 'is_staff']


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
