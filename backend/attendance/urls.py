from django.urls import path
from .views import AttendanceViewSet

urlpatterns = [
    path('attendance/', AttendanceViewSet.as_view({'get': 'list'}), name='attendance-list'),
    path('attendance/punch-in/', AttendanceViewSet.as_view({'post': 'punch_in'}), name='attendance-punch-in'),
    path('attendance/punch-out/', AttendanceViewSet.as_view({'post': 'punch_out'}), name='attendance-punch-out'),
    path('attendance/start-break/', AttendanceViewSet.as_view({'post': 'start_break'}), name='attendance-start-break'),
    path('attendance/end-break/', AttendanceViewSet.as_view({'post': 'end_break'}), name='attendance-end-break'),
    path('attendance/current/', AttendanceViewSet.as_view({'get': 'current'}), name='attendance-current'),
]
