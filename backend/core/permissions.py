"""
Custom permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Permission class for Owner role.
    Owner has full access to all organization data.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'owner'
        )
    
    def has_object_permission(self, request, view, obj):
        # Owner can access any object in their organization
        return obj.organization == request.user.organization


class IsManagerOrOwner(BasePermission):
    """
    Permission class for Manager and Owner roles.
    Manager has department-scoped access.
    Owner has full organization access.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['owner', 'manager']
        )
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Owner has full access
        if user.role == 'owner':
            return obj.organization == user.organization
        
        # Manager has department-scoped access
        if user.role == 'manager':
            return (
                obj.organization == user.organization and
                obj.department == user.department
            )
        
        return False


class IsAssignedOrManager(BasePermission):
    """
    Permission class for task access.
    Employee can only access assigned tasks.
    Manager/Owner can access all organization/department tasks.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Owner has full access
        if user.role == 'owner':
            return obj.organization == user.organization
        
        # Manager has department access
        if user.role == 'manager':
            return (
                obj.organization == user.organization and
                obj.department == user.department
            )
        
        # Employee can only access assigned tasks
        return obj.assigned_to == user or obj.created_by == user
