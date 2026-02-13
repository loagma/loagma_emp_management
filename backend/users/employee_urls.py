"""
URL configuration for employee management endpoints.
"""
from django.urls import path
from .views import EmployeeViewSet

urlpatterns = [
    path('employees/', EmployeeViewSet.as_view({'get': 'list', 'post': 'create'}), name='employee-list'),
    path('employees/<int:pk>/', EmployeeViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='employee-detail'),
    path('employees/<int:pk>/toggle-active/', EmployeeViewSet.as_view({'patch': 'toggle_active'}), name='employee-toggle-active'),
]
