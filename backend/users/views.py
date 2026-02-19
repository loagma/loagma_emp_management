"""
Views for user authentication and profile.
"""
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, status
from django.db.models import Count, Q
from django.utils import timezone

from core.mixins import OrganizationQuerysetMixin
from core.permissions import IsManagerOrOwner
from .models import User
from .serializers import (
    UserListSerializer, 
    UserDetailSerializer, 
    EmployeeCreateSerializer,
    EnhancedEmployeeListSerializer
)
from tasks.models import Task, TaskStatus


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Get current authenticated user's profile.
    
    Returns user details including organization and role information.
    """
    serializer = UserDetailSerializer(request.user)
    return Response(serializer.data)


class EmployeeViewSet(OrganizationQuerysetMixin, viewsets.ModelViewSet):
    """
    ViewSet for employee management.
    
    Endpoints:
    - GET /api/employees/ - List employees
    - POST /api/employees/ - Create employee
    - GET /api/employees/{id}/ - Get employee detail
    - PUT/PATCH /api/employees/{id}/ - Update employee
    - DELETE /api/employees/{id}/ - Delete employee (soft delete)
    - PATCH /api/employees/{id}/toggle-active/ - Toggle active status
    """
    
    queryset = User.active.all()
    permission_classes = [IsManagerOrOwner]
    
    def get_permissions(self):
        """
        Override permissions for specific actions.
        """
        if self.action == 'upload_profile_picture':
            # Allow any authenticated user to upload their own profile picture
            return [IsAuthenticated()]
        return super().get_permissions()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return EmployeeCreateSerializer
        elif self.action == 'list':
            return EnhancedEmployeeListSerializer
        return UserDetailSerializer
    
    def get_queryset(self):
        """Filter employees by organization and exclude superusers"""
        qs = super().get_queryset()
        # Exclude superusers from employee list
        return qs.filter(is_superuser=False, is_staff=False)
    
    def perform_create(self, serializer):
        """Create employee with organization context"""
        # Set organization from current user
        serializer.save(
            organization=self.request.user.organization,
            role='employee',
            is_superuser=False,
            is_staff=False
        )
    
    def perform_update(self, serializer):
        """Update employee, prevent role/superuser changes"""
        serializer.save(
            role='employee',
            is_superuser=False,
            is_staff=False
        )
    
    def perform_destroy(self, instance):
        """Soft delete employee"""
        instance.is_deleted = True
        instance.is_active = False
        instance.save()
    
    @action(detail=False, methods=['post'])
    def upload_profile_picture(self, request):
        """
        Upload profile picture for the current user using Cloudinary.
        
        Validates:
        - File format (JPEG, PNG, GIF)
        - File size (max 5MB)
        - Image dimensions (min 100x100px, max 2000x2000px)
        """
        import cloudinary.uploader
        from PIL import Image
        from io import BytesIO
        
        if 'profile_picture' not in request.FILES:
            return Response({
                'error': 'No profile picture file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['profile_picture']
        
        # Validate file size (5MB max)
        max_size = 5 * 1024 * 1024  # 5MB in bytes
        if file.size > max_size:
            return Response({
                'error': 'File size exceeds 5MB limit'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file format
        allowed_formats = ['image/jpeg', 'image/png', 'image/gif']
        if file.content_type not in allowed_formats:
            return Response({
                'error': 'Invalid file format. Please upload JPEG, PNG, or GIF'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate image dimensions
        try:
            image = Image.open(file)
            width, height = image.size
            
            if width < 100 or height < 100:
                return Response({
                    'error': 'Image dimensions too small. Minimum 100x100px required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if width > 2000 or height > 2000:
                return Response({
                    'error': 'Image dimensions too large. Maximum 2000x2000px allowed'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Reset file pointer after reading
            file.seek(0)
        except Exception as e:
            return Response({
                'error': f'Invalid image file: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Upload to Cloudinary
        try:
            user = request.user
            
            # Delete old profile picture from Cloudinary if exists
            if user.profile_picture:
                try:
                    # Extract public_id from the CloudinaryField
                    public_id = user.profile_picture.public_id
                    cloudinary.uploader.destroy(public_id)
                except Exception as e:
                    print(f"Error deleting old image: {e}")
                    pass  # Ignore errors when deleting old image
            
            # Upload new image to Cloudinary - let CloudinaryField handle it
            # Simply assign the file to the CloudinaryField
            user.profile_picture = file
            user.save()
            
            # Get the URL from the CloudinaryField
            profile_picture_url = user.profile_picture.url if user.profile_picture else None
            
            return Response({
                'message': 'Profile picture uploaded successfully',
                'profile_picture': profile_picture_url
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to upload image: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        """Toggle employee active status"""
        employee = self.get_object()
        employee.is_active = not employee.is_active
        employee.save()
        
        status_text = "activated" if employee.is_active else "deactivated"
        
        serializer = self.get_serializer(employee)
        return Response({
            'message': f'Employee {status_text} successfully',
            'employee': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def quick_view(self, request, pk=None):
        """
        Get comprehensive real-time employee data for Quick View modal.
        
        Returns:
        - Basic info (name, email, department, role, profile picture)
        - Working status (punched in/out, on break, current duration)
        - Today's summary (total work time, break time, punch times)
        - Activity log (all punch events for today)
        - Today's tasks with status
        - Task statistics (completed today, pending, total assigned)
        """
        from attendance.models import Attendance, Break
        from tasks.models import Task
        from django.db.models import Q
        
        employee = self.get_object()
        today = timezone.now().date()
        now = timezone.now()
        
        # Basic info
        profile_picture_url = None
        if employee.profile_picture:
            profile_picture_url = request.build_absolute_uri(employee.profile_picture.url)
        
        # Get today's attendance
        today_attendance = Attendance.objects.filter(
            user=employee,
            punch_in__date=today
        ).first()
        
        # Working status
        working_status = {
            'status': 'not_punched_in',
            'punch_in_time': None,
            'current_duration_seconds': 0,
            'is_on_break': False
        }
        
        if today_attendance:
            if today_attendance.status == 'punched_in':
                working_status['status'] = 'punched_in'
                working_status['punch_in_time'] = today_attendance.punch_in.isoformat()
                
                # Calculate current duration
                duration = now - today_attendance.punch_in
                if today_attendance.total_break_time:
                    duration -= today_attendance.total_break_time
                working_status['current_duration_seconds'] = int(duration.total_seconds())
                
            elif today_attendance.status == 'on_break':
                working_status['status'] = 'on_break'
                working_status['punch_in_time'] = today_attendance.punch_in.isoformat()
                working_status['is_on_break'] = True
                
                # Calculate duration excluding current break
                duration = now - today_attendance.punch_in
                if today_attendance.total_break_time:
                    duration -= today_attendance.total_break_time
                # Subtract current break time
                current_break = Break.objects.filter(
                    attendance=today_attendance,
                    end_time__isnull=True
                ).first()
                if current_break:
                    duration -= (now - current_break.start_time)
                working_status['current_duration_seconds'] = int(duration.total_seconds())
                
            elif today_attendance.status == 'punched_out':
                working_status['status'] = 'punched_out'
                working_status['punch_in_time'] = today_attendance.punch_in.isoformat()
                if today_attendance.total_work_time:
                    working_status['current_duration_seconds'] = int(today_attendance.total_work_time.total_seconds())
        
        # Today's summary
        today_summary = {
            'total_work_time_seconds': 0,
            'total_break_time_seconds': 0,
            'punch_in_time': None,
            'punch_out_time': None
        }
        
        if today_attendance:
            today_summary['punch_in_time'] = today_attendance.punch_in.isoformat()
            if today_attendance.punch_out:
                today_summary['punch_out_time'] = today_attendance.punch_out.isoformat()
            
            if today_attendance.total_work_time:
                today_summary['total_work_time_seconds'] = int(today_attendance.total_work_time.total_seconds())
            elif today_attendance.punch_in and not today_attendance.punch_out:
                # Still working - calculate current work time
                duration = now - today_attendance.punch_in
                if today_attendance.total_break_time:
                    duration -= today_attendance.total_break_time
                today_summary['total_work_time_seconds'] = int(duration.total_seconds())
            
            if today_attendance.total_break_time:
                today_summary['total_break_time_seconds'] = int(today_attendance.total_break_time.total_seconds())
        
        # Activity log
        activity_log = []
        if today_attendance:
            # Punch in
            activity_log.append({
                'type': 'punch_in',
                'timestamp': today_attendance.punch_in.isoformat()
            })
            
            # Breaks
            breaks = Break.objects.filter(attendance=today_attendance).order_by('start_time')
            for brk in breaks:
                activity_log.append({
                    'type': 'break_start',
                    'timestamp': brk.start_time.isoformat()
                })
                if brk.end_time:
                    activity_log.append({
                        'type': 'break_end',
                        'timestamp': brk.end_time.isoformat()
                    })
            
            # Punch out
            if today_attendance.punch_out:
                activity_log.append({
                    'type': 'punch_out',
                    'timestamp': today_attendance.punch_out.isoformat()
                })
        
        # Today's tasks
        today_tasks = Task.active.filter(
            assigned_to=employee,
            created_at__date=today
        ).values('id', 'title', 'status', 'priority')
        
        # Task statistics
        all_tasks = Task.active.filter(assigned_to=employee)
        completed_today = Task.active.filter(
            assigned_to=employee,
            status='completed',
            updated_at__date=today
        ).count()
        
        task_stats = {
            'completed_today': completed_today,
            'pending': all_tasks.filter(status__in=['assigned', 'in_progress']).count(),
            'total_assigned': all_tasks.count()
        }
        
        # Build response
        response_data = {
            'id': employee.id,
            'first_name': employee.first_name,
            'last_name': employee.last_name,
            'email': employee.email,
            'department': employee.department.name if employee.department else None,
            'role': employee.get_role_display(),
            'profile_picture': profile_picture_url,
            'working_status': working_status,
            'today_summary': today_summary,
            'activity_log': activity_log,
            'tasks': list(today_tasks),
            'task_stats': task_stats
        }
        
        return Response(response_data)
    
    @action(detail=True, methods=['get'])
    def monthly_report(self, request, pk=None):
        """Generate and download monthly performance report"""
        from django.http import HttpResponse, JsonResponse
        
        employee = self.get_object()
        
        # Get year and month from query params (default to current month)
        from django.utils import timezone
        now = timezone.now()
        
        try:
            year = int(request.query_params.get('year', now.year))
            month = int(request.query_params.get('month', now.month))
        except (ValueError, TypeError) as e:
            return JsonResponse({
                'error': f'Invalid year or month parameter: {str(e)}'
            }, status=400)
        
        try:
            # Import here to catch import errors
            from .simple_report import SimpleEmployeeReport
            
            # Generate report
            report = SimpleEmployeeReport(employee, year, month)
            pdf_buffer = report.generate_pdf()
            
            # Create response
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            filename = f"{employee.username}_report_{year}_{month:02d}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
        except ImportError as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'error': f'Import error: {str(e)}',
                'type': 'ImportError'
            }, status=500)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print("="*50)
            print("ERROR GENERATING REPORT:")
            print(error_trace)
            print("="*50)
            return JsonResponse({
                'error': f'Failed to generate report: {str(e)}',
                'type': type(e).__name__,
                'trace': error_trace
            }, status=500)
    
    def get_queryset(self):
        """Get employees in user's organization"""
        queryset = super().get_queryset()
        
        # Optimize queries with select_related and prefetch_related
        queryset = queryset.select_related('organization', 'department')
        queryset = queryset.prefetch_related('assigned_tasks', 'attendances')
        
        # Exclude superusers and staff
        queryset = queryset.filter(is_superuser=False, is_staff=False)
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """
        Get employee detail with task summary.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Calculate task summary
        assigned_tasks = Task.active.filter(assigned_to=instance)
        
        task_summary = {
            'total_assigned': assigned_tasks.count(),
            'completed': assigned_tasks.filter(status=TaskStatus.COMPLETED).count(),
            'in_progress': assigned_tasks.filter(status=TaskStatus.IN_PROGRESS).count(),
            'pending': assigned_tasks.filter(status=TaskStatus.ASSIGNED).count(),
            'delayed': assigned_tasks.filter(status=TaskStatus.DELAYED).count(),
        }
        
        # Calculate completion rate
        if task_summary['total_assigned'] > 0:
            task_summary['completion_rate'] = round(
                (task_summary['completed'] / task_summary['total_assigned']) * 100,
                2
            )
        else:
            task_summary['completion_rate'] = 0.0
        
        # Combine data
        response_data = serializer.data
        response_data['task_summary'] = task_summary
        
        return Response(response_data)
