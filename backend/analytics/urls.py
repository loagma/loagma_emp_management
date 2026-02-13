from django.urls import path
from .views import (
    dashboard_stats,
    dashboard_alerts,
    analytics_summary,
    analytics_trends
)

urlpatterns = [
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('dashboard/alerts/', dashboard_alerts, name='dashboard-alerts'),
    path('analytics/summary/', analytics_summary, name='analytics-summary'),
    path('analytics/trends/', analytics_trends, name='analytics-trends'),
]
