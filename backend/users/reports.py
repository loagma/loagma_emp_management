"""
Employee Monthly Report Generation
"""
from django.utils import timezone
from datetime import datetime, timedelta
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from tasks.models import Task, TaskStatus
from attendance.models import Attendance


class EmployeeMonthlyReport:
    """Generate comprehensive monthly performance report for an employee"""
    
    def __init__(self, user, year, month):
        self.user = user
        self.year = year
        self.month = month
        self.start_date = datetime(year, month, 1).date()
        
        # Calculate end date (last day of month)
        if month == 12:
            self.end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
        else:
            self.end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)
    
    def generate_pdf(self):
        """Generate PDF report"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=20
        )
        
        # Title
        title = Paragraph(f"Monthly Performance Report", title_style)
        story.append(title)
        
        # Employee Info
        employee_info = f"""
        <b>Employee:</b> {self.user.get_full_name() or self.user.username}<br/>
        <b>Email:</b> {self.user.email}<br/>
        <b>Role:</b> {self.user.get_role_display()}<br/>
        <b>Report Period:</b> {self.start_date.strftime('%B %Y')}<br/>
        <b>Generated:</b> {timezone.now().strftime('%B %d, %Y at %I:%M %p')}
        """
        story.append(Paragraph(employee_info, styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Get data
        attendance_data = self._get_attendance_data()
        task_data = self._get_task_data()
        
        # Attendance Summary
        story.append(Paragraph("Attendance Summary", heading_style))
        attendance_table = self._create_attendance_table(attendance_data)
        story.append(attendance_table)
        story.append(Spacer(1, 20))
        
        # Task Performance
        story.append(Paragraph("Task Performance", heading_style))
        task_table = self._create_task_table(task_data)
        story.append(task_table)
        story.append(Spacer(1, 20))
        
        # Daily Attendance Details
        story.append(Paragraph("Daily Attendance Log", heading_style))
        daily_table = self._create_daily_attendance_table(attendance_data['records'])
        story.append(daily_table)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def _get_attendance_data(self):
        """Get attendance statistics"""
        records = Attendance.objects.filter(
            user=self.user,
            punch_in__date__gte=self.start_date,
            punch_in__date__lte=self.end_date
        ).order_by('punch_in')
        
        total_days = records.count()
        total_work_seconds = 0
        total_break_seconds = 0
        
        for record in records:
            if record.total_work_time:
                total_work_seconds += record.total_work_time.total_seconds()
            if record.total_break_time:
                total_break_seconds += record.total_break_time.total_seconds()
        
        total_work_hours = total_work_seconds / 3600
        total_break_hours = total_break_seconds / 3600
        avg_hours_per_day = total_work_hours / total_days if total_days > 0 else 0
        
        return {
            'records': records,
            'total_days': total_days,
            'total_work_hours': round(total_work_hours, 2),
            'total_break_hours': round(total_break_hours, 2),
            'avg_hours_per_day': round(avg_hours_per_day, 2)
        }
    
    def _get_task_data(self):
        """Get task statistics"""
        tasks = Task.active.filter(
            assigned_to=self.user,
            created_at__date__gte=self.start_date,
            created_at__date__lte=self.end_date
        )
        
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status=TaskStatus.COMPLETED).count()
        in_progress_tasks = tasks.filter(status=TaskStatus.IN_PROGRESS).count()
        pending_tasks = tasks.filter(status=TaskStatus.ASSIGNED).count()
        overdue_tasks = tasks.filter(
            deadline__lt=timezone.now(),
            status__in=[TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]
        ).count()
        
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        return {
            'total': total_tasks,
            'completed': completed_tasks,
            'in_progress': in_progress_tasks,
            'pending': pending_tasks,
            'overdue': overdue_tasks,
            'completion_rate': round(completion_rate, 1)
        }
    
    def _create_attendance_table(self, data):
        """Create attendance summary table"""
        table_data = [
            ['Metric', 'Value'],
            ['Days Worked', str(data['total_days'])],
            ['Total Work Hours', f"{data['total_work_hours']} hrs"],
            ['Total Break Time', f"{data['total_break_hours']} hrs"],
            ['Average Hours/Day', f"{data['avg_hours_per_day']} hrs"],
        ]
        
        table = Table(table_data, colWidths=[3*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        return table
    
    def _create_task_table(self, data):
        """Create task performance table"""
        table_data = [
            ['Metric', 'Value'],
            ['Total Tasks', str(data['total'])],
            ['Completed', str(data['completed'])],
            ['In Progress', str(data['in_progress'])],
            ['Pending', str(data['pending'])],
            ['Overdue', str(data['overdue'])],
            ['Completion Rate', f"{data['completion_rate']}%"],
        ]
        
        table = Table(table_data, colWidths=[3*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        return table
    
    def _create_daily_attendance_table(self, records):
        """Create daily attendance log table"""
        table_data = [['Date', 'Punch In', 'Punch Out', 'Work Hours', 'Break Time']]
        
        for record in records:
            date = record.punch_in.strftime('%b %d, %Y')
            punch_in = record.punch_in.strftime('%I:%M %p')
            punch_out = record.punch_out.strftime('%I:%M %p') if record.punch_out else 'N/A'
            
            work_hours = 'N/A'
            if record.total_work_time:
                hours = int(record.total_work_time.total_seconds() // 3600)
                minutes = int((record.total_work_time.total_seconds() % 3600) // 60)
                work_hours = f"{hours}h {minutes}m"
            
            break_time = 'N/A'
            if record.total_break_time:
                hours = int(record.total_break_time.total_seconds() // 3600)
                minutes = int((record.total_break_time.total_seconds() % 3600) // 60)
                break_time = f"{hours}h {minutes}m"
            
            table_data.append([date, punch_in, punch_out, work_hours, break_time])
        
        if len(table_data) == 1:
            table_data.append(['No attendance records', '', '', '', ''])
        
        table = Table(table_data, colWidths=[1.5*inch, 1.3*inch, 1.3*inch, 1.3*inch, 1.3*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        
        return table
