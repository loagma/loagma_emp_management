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
    path('employees/<int:pk>/quick_view/', EmployeeViewSet.as_view({'get': 'quick_view'}), name='employee-quick-view'),
    path('employees/<int:pk>/monthly-report/', EmployeeViewSet.as_view({'get': 'monthly_report'}), name='employee-monthly-report'),
    path('employees/upload_profile_picture/', EmployeeViewSet.as_view({'post': 'upload_profile_picture'}), name='employee-upload-profile-picture'),
]
