from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .models import Attendance, Break, BreakCategory, AdminNotification
from .serializers import (
    AttendanceSerializer, 
    AttendanceListSerializer,
    BreakCategorySerializer,
    StartBreakSerializer,
    EnhancedBreakSerializer,
    AdminNotificationSerializer
)
from .services import BreakMonitoringService
from core.mixins import OrganizationQuerysetMixin
from core.permissions import IsManagerOrOwner


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
        """Punch in for the day - only once per day"""
        user = request.user
        
        # Check if already punched in today (including completed punches)
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        existing = Attendance.objects.filter(
            user=user,
            punch_in__gte=today_start
        ).first()
        
        if existing:
            if existing.punch_out:
                return Response(
                    {'error': 'You have already completed your attendance for today. You can only punch in once per day.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': 'Already punched in today'},
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
        """Punch out for the day - only once per day"""
        user = request.user
        
        # Get current attendance
        attendance = Attendance.objects.filter(
            user=user,
            punch_out__isnull=True
        ).first()
        
        if not attendance:
            return Response(
                {'error': 'No active punch-in found. You must punch in first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify it's from today
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        if attendance.punch_in < today_start:
            return Response(
                {'error': 'Cannot punch out for a previous day. Please contact administrator.'},
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
        """Start a break with optional enhanced data (category, reason, duration)"""
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
        
        # Check if enhanced data is provided
        if request.data and any(key in request.data for key in ['category_id', 'reason', 'expected_hours', 'expected_minutes']):
            # Use enhanced break serializer
            serializer = StartBreakSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = serializer.validated_data
            
            # Create break with enhanced data
            break_record = Break.objects.create(
                attendance=attendance,
                start_time=timezone.now(),
                category=validated_data['category'],
                reason=validated_data['reason'],
                expected_duration_minutes=validated_data['expected_duration_minutes']
            )
        else:
            # Legacy break creation (backward compatibility)
            break_record = Break.objects.create(
                attendance=attendance,
                start_time=timezone.now()
            )
        
        # Update attendance status
        attendance.status = 'on_break'
        attendance.save()
        
        # Return enhanced break data if available
        if break_record.category:
            break_serializer = EnhancedBreakSerializer(break_record)
            return Response({
                'message': 'Break started successfully',
                'break': break_serializer.data,
                'attendance': AttendanceSerializer(attendance).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'message': 'Break started successfully',
                'attendance': AttendanceSerializer(attendance).data
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def end_break(self, request):
        """End current break and dismiss notifications"""
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
        
        # Dismiss any notifications for this break
        BreakMonitoringService.dismiss_notifications_for_break(active_break)
        
        # Update attendance status
        attendance.status = 'punched_in'
        attendance.save()
        
        # Return enhanced data if available
        if active_break.category:
            break_serializer = EnhancedBreakSerializer(active_break)
            return Response({
                'message': 'Break ended successfully',
                'break': break_serializer.data,
                'attendance': AttendanceSerializer(attendance).data
            })
        else:
            return Response({
                'message': 'Break ended successfully',
                'attendance': AttendanceSerializer(attendance).data
            })
    
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
        
        # Check if current break is exceeded and create notification
        if attendance.status == 'on_break':
            active_break = Break.objects.filter(
                attendance=attendance,
                end_time__isnull=True,
                expected_duration_minutes__isnull=False
            ).first()
            
            if active_break and active_break.is_exceeded:
                # Check if notification already exists
                existing = AdminNotification.objects.filter(
                    break_record=active_break,
                    status__in=['unread', 'read']
                ).exists()
                
                if not existing:
                    BreakMonitoringService.create_notification(active_break)
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def break_history(self, request):
        """Get break history with filtering"""
        from django.db.models import Q
        from datetime import datetime
        
        user = request.user
        
        # Base queryset
        if user.is_superuser or user.is_staff:
            # Admins see all breaks in their organization
            breaks = Break.objects.filter(
                attendance__organization=user.organization
            ).select_related('attendance__user', 'category')
        else:
            # Employees see only their own breaks
            breaks = Break.objects.filter(
                attendance__user=user
            ).select_related('category')
        
        # Apply filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        category_id = request.query_params.get('category')
        employee_id = request.query_params.get('employee')
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                breaks = breaks.filter(start_time__gte=start_dt)
            except:
                pass
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                breaks = breaks.filter(start_time__lte=end_dt)
            except:
                pass
        
        if category_id:
            breaks = breaks.filter(category_id=category_id)
        
        if employee_id and (user.is_superuser or user.is_staff):
            breaks = breaks.filter(attendance__user_id=employee_id)
        
        # Order by most recent first
        breaks = breaks.order_by('-start_time')
        
        # Serialize
        serializer = EnhancedBreakSerializer(breaks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def break_statistics(self, request):
        """Get break statistics"""
        from django.db.models import Avg, Count
        from datetime import datetime
        
        user = request.user
        
        # Base queryset
        if user.is_superuser or user.is_staff:
            breaks = Break.objects.filter(
                attendance__organization=user.organization,
                end_time__isnull=False
            )
        else:
            breaks = Break.objects.filter(
                attendance__user=user,
                end_time__isnull=False
            )
        
        # Apply date range filter if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                breaks = breaks.filter(start_time__gte=start_dt)
            except:
                pass
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                breaks = breaks.filter(start_time__lte=end_dt)
            except:
                pass
        
        # Calculate statistics
        category_stats = []
        categories = BreakCategory.objects.filter(
            organization=user.organization,
            is_active=True
        )
        
        for category in categories:
            cat_breaks = breaks.filter(category=category)
            count = cat_breaks.count()
            
            if count > 0:
                # Calculate average duration
                total_minutes = sum([b.actual_duration_minutes for b in cat_breaks])
                avg_minutes = total_minutes / count
                
                category_stats.append({
                    'category_id': category.id,
                    'category_name': category.name,
                    'count': count,
                    'average_duration_minutes': round(avg_minutes, 2)
                })
        
        # Sort by count (most frequent first)
        category_stats.sort(key=lambda x: x['count'], reverse=True)
        
        return Response({
            'total_breaks': breaks.count(),
            'category_statistics': category_stats,
            'most_frequent_category': category_stats[0] if category_stats else None
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsManagerOrOwner])
    def active_breaks(self, request):
        """Get currently active breaks (admin only)"""
        user = request.user
        
        # Get all active breaks in organization
        breaks = Break.objects.filter(
            attendance__organization=user.organization,
            end_time__isnull=True,
            expected_duration_minutes__isnull=False
        ).select_related('attendance__user', 'category').order_by('start_time')
        
        # Check for exceeded breaks and create notifications
        for break_record in breaks:
            if break_record.is_exceeded:
                # Check if notification already exists
                existing = AdminNotification.objects.filter(
                    break_record=break_record,
                    status__in=['unread', 'read']
                ).exists()
                
                if not existing:
                    BreakMonitoringService.create_notification(break_record)
        
        # Serialize with employee information
        data = []
        for break_record in breaks:
            break_data = EnhancedBreakSerializer(break_record).data
            break_data['employee_name'] = break_record.attendance.user.get_full_name() or break_record.attendance.user.username
            break_data['employee_id'] = break_record.attendance.user.id
            data.append(break_data)
        
        # Sort by elapsed time (longest first)
        data.sort(key=lambda x: x['actual_duration_minutes'], reverse=True)
        
        return Response(data)



    @action(detail=False, methods=['post'], permission_classes=[IsManagerOrOwner])
    def check_exceeded_breaks(self, request):
        """Manually check for exceeded breaks and create notifications (admin only)"""
        user = request.user
        
        # Get all active breaks in organization
        active_breaks = Break.objects.filter(
            attendance__organization=user.organization,
            end_time__isnull=True,
            expected_duration_minutes__isnull=False
        ).select_related('attendance__user', 'category')
        
        notifications_created = 0
        
        for break_record in active_breaks:
            if break_record.is_exceeded:
                # Check if notification already exists
                existing = AdminNotification.objects.filter(
                    break_record=break_record,
                    status__in=['unread', 'read']
                ).exists()
                
                if not existing:
                    BreakMonitoringService.create_notification(break_record)
                    notifications_created += 1
        
        return Response({
            'message': f'Checked {active_breaks.count()} active breaks',
            'notifications_created': notifications_created
        })



class BreakCategoryViewSet(OrganizationQuerysetMixin, viewsets.ModelViewSet):
    """
    ViewSet for break category management.
    
    Endpoints:
    - GET /api/attendance/break-categories/ - List active categories
    - POST /api/attendance/break-categories/ - Create category (admin only)
    - GET /api/attendance/break-categories/{id}/ - Get category details
    - PUT /api/attendance/break-categories/{id}/ - Update category (admin only)
    - DELETE /api/attendance/break-categories/{id}/ - Delete category (admin only)
    """
    
    queryset = BreakCategory.objects.all()
    serializer_class = BreakCategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for break categories
    
    def get_queryset(self):
        """Filter by organization and show only active categories"""
        qs = super().get_queryset()
        # Only show active categories for list view
        if self.action == 'list':
            return qs.filter(is_active=True)
        return qs
    
    def get_permissions(self):
        """Admin only for create, update, delete"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManagerOrOwner()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        """Create category with organization context"""
        serializer.save(organization=self.request.user.organization)
    
    def perform_destroy(self, instance):
        """Soft delete - prevent deletion if breaks exist"""
        # Check if any breaks reference this category
        if instance.breaks.exists():
            return Response(
                {'error': 'Cannot delete category with existing break records'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Soft delete
        instance.is_active = False
        instance.save()



class AdminNotificationViewSet(OrganizationQuerysetMixin, viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for admin notifications (read-only with actions).
    
    Endpoints:
    - GET /api/attendance/notifications/ - List notifications (admin only)
    - GET /api/attendance/notifications/{id}/ - Get notification details
    - POST /api/attendance/notifications/{id}/mark-read/ - Mark as read
    - POST /api/attendance/notifications/{id}/dismiss/ - Dismiss notification
    - GET /api/attendance/notifications/unread-count/ - Get unread count
    """
    
    queryset = AdminNotification.objects.all()
    serializer_class = AdminNotificationSerializer
    permission_classes = [IsManagerOrOwner]
    pagination_class = None  # Disable pagination for notifications
    
    def get_queryset(self):
        """Filter by organization and optionally by status"""
        qs = super().get_queryset()
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        return qs.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.status = 'read'
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss notification"""
        notification = self.get_object()
        notification.status = 'dismissed'
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = AdminNotification.objects.filter(
            organization=request.user.organization,
            status='unread'
        ).count()
        
        return Response({'unread_count': count})
