from django.shortcuts import render
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from tasks.models import Task, TaskStatus
from django.utils import timezone
from .services import AnalyticsService


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics for the authenticated user's organization.
    Returns total, completed, pending, and overdue task counts.
    Cached for 60 seconds.
    """
    user = request.user
    
    # Try to get from cache first
    cache_key = f'dashboard_stats_{user.organization_id}_{user.id}'
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    # Get organization context
    # Superusers can see all tasks, regular users see only their organization
    if user.is_superuser or user.is_staff:
        tasks = Task.active.all()
    elif user.organization:
        tasks = Task.active.filter(organization=user.organization)
    else:
        tasks = Task.active.none()
    
    # Use only() to fetch only needed fields
    tasks = tasks.only('status', 'deadline')
    
    total_tasks = tasks.count()
    completed_tasks = tasks.filter(status=TaskStatus.COMPLETED).count()
    pending_tasks = tasks.exclude(status=TaskStatus.COMPLETED).count()
    overdue_tasks = tasks.filter(
        deadline__lt=timezone.now(),
        status__in=[TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]
    ).count()
    
    data = {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "overdue_tasks": overdue_tasks,
    }
    
    # Cache for 60 seconds
    cache.set(cache_key, data, 60)
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_alerts(request):
    """
    Get dashboard alerts (overdue and delayed tasks).
    Returns top 10 most critical alerts.
    Cached for 30 seconds.
    """
    user = request.user
    
    # Try to get from cache first
    cache_key = f'dashboard_alerts_{user.organization_id}_{user.id}'
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    # Get organization context
    # Superusers can see all tasks, regular users see only their organization
    if user.is_superuser or user.is_staff:
        tasks = Task.active.all()
    elif user.organization:
        tasks = Task.active.filter(organization=user.organization)
    else:
        tasks = Task.active.none()
    
    # Get overdue tasks - optimized query
    overdue_tasks = tasks.filter(
        deadline__lt=timezone.now(),
        status__in=[TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]
    ).select_related('assigned_to', 'created_by', 'department').order_by('deadline')[:10]
    
    # Get delayed tasks - optimized query
    delayed_tasks = tasks.filter(
        status=TaskStatus.DELAYED
    ).select_related('assigned_to', 'created_by', 'department').order_by('-updated_at')[:10]
    
    # Format response
    from tasks.serializers import TaskListSerializer
    
    alerts = {
        'overdue_tasks': TaskListSerializer(overdue_tasks, many=True).data,
        'delayed_tasks': TaskListSerializer(delayed_tasks, many=True).data,
        'total_alerts': len(overdue_tasks) + len(delayed_tasks)
    }
    
    # Cache for 30 seconds
    cache.set(cache_key, alerts, 30)
    
    return Response(alerts)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_summary(request):
    """
    Get analytics summary with completion rate, efficiency score, etc.
    Cached for 5 minutes.
    """
    user = request.user
    
    # Get organization
    if not user.organization and not (user.is_superuser or user.is_staff):
        return Response({
            'error': 'User must belong to an organization'
        }, status=400)
    
    # Try to get from cache first
    cache_key = f'analytics_summary_{user.organization_id if user.organization else "all"}'
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    # Superusers see all data, regular users see their organization
    if user.is_superuser or user.is_staff:
        # For superusers without organization, aggregate all organizations
        summary = AnalyticsService.get_analytics_summary(user.organization)
    else:
        summary = AnalyticsService.get_analytics_summary(user.organization)
    
    # Cache for 5 minutes
    cache.set(cache_key, summary, 300)
    
    return Response(summary)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_trends(request):
    """
    Get analytics trends over time.
    Query params: period (7d, 30d, 90d)
    Cached for 5 minutes.
    """
    user = request.user
    
    # Get organization
    if not user.organization and not (user.is_superuser or user.is_staff):
        return Response({
            'error': 'User must belong to an organization'
        }, status=400)
    
    period = request.query_params.get('period', '30d')
    
    # Try to get from cache first
    cache_key = f'analytics_trends_{user.organization_id if user.organization else "all"}_{period}'
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    # Superusers see all data, regular users see their organization
    trends = AnalyticsService.get_analytics_trends(user.organization, period)
    
    response_data = {
        'period': period,
        'trends': trends
    }
    
    # Cache for 5 minutes
    cache.set(cache_key, response_data, 300)
    
    return Response(response_data)

