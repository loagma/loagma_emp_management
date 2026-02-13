"""
Business logic for analytics calculations.
"""
from django.utils import timezone
from django.db.models import Count, Q, Avg
from datetime import timedelta
from tasks.models import Task, TaskStatus


class AnalyticsService:
    """Service layer for analytics business logic"""
    
    @staticmethod
    def get_dashboard_stats(organization):
        """
        Calculate dashboard statistics.
        
        Args:
            organization: Organization instance
        
        Returns:
            dict: Dashboard statistics
        """
        tasks = Task.active.filter(organization=organization)
        
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status=TaskStatus.COMPLETED).count()
        pending_tasks = tasks.exclude(status=TaskStatus.COMPLETED).count()
        overdue_tasks = tasks.filter(
            deadline__lt=timezone.now(),
            status__in=[TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]
        ).count()
        
        return {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'overdue_tasks': overdue_tasks
        }
    
    @staticmethod
    def get_completion_rate(organization):
        """
        Calculate task completion rate.
        
        Args:
            organization: Organization instance
        
        Returns:
            float: Completion rate percentage
        """
        tasks = Task.active.filter(organization=organization)
        total = tasks.count()
        if total == 0:
            return 0.0
        completed = tasks.filter(status=TaskStatus.COMPLETED).count()
        return round((completed / total) * 100, 2)
    
    @staticmethod
    def get_analytics_summary(organization):
        """
        Get comprehensive analytics summary.
        
        Args:
            organization: Organization instance or None (for superusers to see all data)
        
        Returns:
            dict: Analytics summary with completion rate, efficiency, etc.
        """
        # Filter by organization or get all tasks for superusers
        if organization:
            tasks = Task.active.filter(organization=organization)
        else:
            tasks = Task.active.all()
            
        total_tasks = tasks.count()
        
        if total_tasks == 0:
            return {
                'completion_rate': 0.0,
                'avg_completion_time_days': 0.0,
                'efficiency_score': 0.0,
                'total_tasks': 0,
                'on_time_completion_rate': 0.0
            }
        
        # Completion rate
        completed_tasks = tasks.filter(status=TaskStatus.COMPLETED)
        completion_rate = round((completed_tasks.count() / total_tasks) * 100, 2)
        
        # Average completion time (for completed tasks with deadline)
        completed_with_deadline = completed_tasks.filter(deadline__isnull=False)
        if completed_with_deadline.exists():
            total_time = sum([
                (task.updated_at - task.created_at).days
                for task in completed_with_deadline
            ])
            avg_completion_time = round(total_time / completed_with_deadline.count(), 1)
        else:
            avg_completion_time = 0.0
        
        # On-time completion rate
        on_time_completed = completed_tasks.filter(
            Q(deadline__isnull=True) | Q(updated_at__lte=F('deadline'))
        ).count()
        on_time_rate = round((on_time_completed / total_tasks) * 100, 2) if total_tasks > 0 else 0.0
        
        # Efficiency score (weighted combination of metrics)
        efficiency_score = round(
            (completion_rate * 0.5) + (on_time_rate * 0.5),
            2
        )
        
        return {
            'completion_rate': completion_rate,
            'avg_completion_time_days': avg_completion_time,
            'efficiency_score': efficiency_score,
            'total_tasks': total_tasks,
            'on_time_completion_rate': on_time_rate
        }
    
    @staticmethod
    def get_analytics_trends(organization, period='30d'):
        """
        Get analytics trends over time.
        
        Args:
            organization: Organization instance or None (for superusers to see all data)
            period: Time period ('7d', '30d', '90d')
        
        Returns:
            list: Time-series data for charts
        """
        # Parse period
        days_map = {'7d': 7, '30d': 30, '90d': 90}
        days = days_map.get(period, 30)
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Get tasks created in period
        if organization:
            tasks = Task.active.filter(
                organization=organization,
                created_at__gte=start_date
            )
        else:
            tasks = Task.active.filter(created_at__gte=start_date)
        
        # Group by date
        trends = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            date_end = date_start + timedelta(days=1)
            
            day_tasks = tasks.filter(created_at__range=[date_start, date_end])
            
            trends.append({
                'date': date.strftime('%Y-%m-%d'),
                'created': day_tasks.count(),
                'completed': day_tasks.filter(status=TaskStatus.COMPLETED).count(),
                'overdue': day_tasks.filter(
                    deadline__lt=timezone.now(),
                    status__in=[TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]
                ).count()
            })
        
        return trends


# Import F for query
from django.db.models import F
