from django.urls import path
from .views import AttendanceViewSet, BreakCategoryViewSet, AdminNotificationViewSet

urlpatterns = [
    # Attendance endpoints
    path('attendance/', AttendanceViewSet.as_view({'get': 'list'}), name='attendance-list'),
    path('attendance/punch-in/', AttendanceViewSet.as_view({'post': 'punch_in'}), name='attendance-punch-in'),
    path('attendance/punch-out/', AttendanceViewSet.as_view({'post': 'punch_out'}), name='attendance-punch-out'),
    path('attendance/start-break/', AttendanceViewSet.as_view({'post': 'start_break'}), name='attendance-start-break'),
    path('attendance/end-break/', AttendanceViewSet.as_view({'post': 'end_break'}), name='attendance-end-break'),
    path('attendance/current/', AttendanceViewSet.as_view({'get': 'current'}), name='attendance-current'),
    path('attendance/break-history/', AttendanceViewSet.as_view({'get': 'break_history'}), name='attendance-break-history'),
    path('attendance/break-statistics/', AttendanceViewSet.as_view({'get': 'break_statistics'}), name='attendance-break-statistics'),
    path('attendance/active-breaks/', AttendanceViewSet.as_view({'get': 'active_breaks'}), name='attendance-active-breaks'),
    path('attendance/check-exceeded-breaks/', AttendanceViewSet.as_view({'post': 'check_exceeded_breaks'}), name='attendance-check-exceeded-breaks'),
    
    # Break category endpoints
    path('attendance/break-categories/', BreakCategoryViewSet.as_view({'get': 'list', 'post': 'create'}), name='break-category-list'),
    path('attendance/break-categories/<int:pk>/', BreakCategoryViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='break-category-detail'),
    
    # Admin notification endpoints
    path('attendance/notifications/', AdminNotificationViewSet.as_view({'get': 'list'}), name='admin-notification-list'),
    path('attendance/notifications/<int:pk>/', AdminNotificationViewSet.as_view({'get': 'retrieve'}), name='admin-notification-detail'),
    path('attendance/notifications/<int:pk>/mark-read/', AdminNotificationViewSet.as_view({'post': 'mark_read'}), name='admin-notification-mark-read'),
    path('attendance/notifications/<int:pk>/dismiss/', AdminNotificationViewSet.as_view({'post': 'dismiss'}), name='admin-notification-dismiss'),
    path('attendance/notifications/unread-count/', AdminNotificationViewSet.as_view({'get': 'unread_count'}), name='admin-notification-unread-count'),
]
