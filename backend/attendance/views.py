from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .models import Attendance, Break
from .serializers import AttendanceSerializer, AttendanceListSerializer
from core.mixins import OrganizationQuerysetMixin


class AttendanceViewSet(OrganizationQuerysetMixin, viewsets.ModelViewSet):
    """
    ViewSet for attendance management.
    
    Endpoints:
    - POST /api/attendance/punch-in/ - Punch in
    - POST /api/attendance/punch-out/ - Punch out
    - POST /api/attendance/start-break/ - Start break
    - POST /api/attendance/end-break/ - End break
    - GET /api/attendance/current/ - Get current attendance
    - GET /api/attendance/ - List attendances
    """
    
    queryset = Attendance.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = AttendanceSerializer
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AttendanceListSerializer
        return AttendanceSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Admins see all, employees see only their own
        if user.is_superuser or user.is_staff:
            return qs
        return qs.filter(user=user)
    
    @action(detail=False, methods=['post'])
    def punch_in(self, request):
        """Punch in for the day"""
        user = request.user
        
        # Check if already punched in today
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        existing = Attendance.objects.filter(
            user=user,
            punch_in__gte=today_start,
            punch_out__isnull=True
        ).first()
        
        if existing:
            return Response(
                {'error': 'Already punched in'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new attendance
        attendance = Attendance.objects.create(
            user=user,
            organization=user.organization,
            punch_in=timezone.now(),
            status='punched_in'
        )
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def punch_out(self, request):
        """Punch out for the day"""
        user = request.user
        
        # Get current attendance
        attendance = Attendance.objects.filter(
            user=user,
            punch_out__isnull=True
        ).first()
        
        if not attendance:
            return Response(
                {'error': 'No active punch-in found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # End any active break
        active_break = Break.objects.filter(
            attendance=attendance,
            end_time__isnull=True
        ).first()
        
        if active_break:
            active_break.end_time = timezone.now()
            active_break.duration = active_break.end_time - active_break.start_time
            active_break.save()
        
        # Calculate total times
        punch_out_time = timezone.now()
        total_time = punch_out_time - attendance.punch_in
        
        # Calculate total break time
        total_break = timedelta()
        for brk in attendance.breaks.all():
            if brk.duration:
                total_break += brk.duration
        
        # Update attendance
        attendance.punch_out = punch_out_time
        attendance.total_break_time = total_break
        attendance.total_work_time = total_time - total_break
        attendance.status = 'punched_out'
        attendance.save()
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def start_break(self, request):
        """Start a break"""
        user = request.user
        
        # Get current attendance
        attendance = Attendance.objects.filter(
            user=user,
            punch_out__isnull=True
        ).first()
        
        if not attendance:
            return Response(
                {'error': 'No active punch-in found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already on break
        active_break = Break.objects.filter(
            attendance=attendance,
            end_time__isnull=True
        ).first()
        
        if active_break:
            return Response(
                {'error': 'Already on break'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create break
        Break.objects.create(
            attendance=attendance,
            start_time=timezone.now()
        )
        
        # Update attendance status
        attendance.status = 'on_break'
        attendance.save()
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def end_break(self, request):
        """End current break"""
        user = request.user
        
        # Get current attendance
        attendance = Attendance.objects.filter(
            user=user,
            punch_out__isnull=True
        ).first()
        
        if not attendance:
            return Response(
                {'error': 'No active punch-in found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get active break
        active_break = Break.objects.filter(
            attendance=attendance,
            end_time__isnull=True
        ).first()
        
        if not active_break:
            return Response(
                {'error': 'No active break found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # End break
        active_break.end_time = timezone.now()
        active_break.duration = active_break.end_time - active_break.start_time
        active_break.save()
        
        # Update attendance status
        attendance.status = 'punched_in'
        attendance.save()
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current attendance status"""
        user = request.user
        
        attendance = Attendance.objects.filter(
            user=user,
            punch_out__isnull=True
        ).first()
        
        if not attendance:
            return Response({'status': 'not_punched_in'})
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data)
