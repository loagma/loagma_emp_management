"""
Reusable mixins for views and viewsets.
"""


class OrganizationQuerysetMixin:
    """
    Automatically filters queryset by user's organization.
    
    MANDATORY for all ViewSets that access organization-scoped data.
    This ensures multi-tenant data isolation.
    
    Usage:
        class TaskViewSet(OrganizationQuerysetMixin, viewsets.ModelViewSet):
            queryset = Task.objects.all()
            ...
    """
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(
            organization=self.request.user.organization
        )
