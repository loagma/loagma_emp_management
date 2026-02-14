"""
Simplified Employee Monthly Report Generation
"""
from django.utils import timezone
from datetime import datetime, timedelta
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from tasks.models import Task, TaskStatus
from attendance.models import Attendance


class SimpleEmployeeReport:
    """Generate simple monthly performance report"""
    
    def __init__(self, user, year, month):
        self.user = user
        self.year = year
        self.month = month
        self.start_date = datetime(year, month, 1).date()
        
        # Calculate end date
        if month == 12:
            self.end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
        else:
            self.end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)
    
    def generate_pdf(self):
        """Generate simple PDF report"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Title
        title = Paragraph(f"<b>Monthly Report - {self.start_date.strftime('%B %Y')}</b>", styles['Title'])
        story.append(title)
        story.append(Spacer(1, 0.3*inch))
        
        # Employee Info
        info = Paragraph(f"""
            <b>Employee:</b> {self.user.get_full_name() or self.user.username}<br/>
            <b>Email:</b> {self.user.email}<br/>
            <b>Period:</b> {self.start_date} to {self.end_date}
        """, styles['Normal'])
        story.append(info)
        story.append(Spacer(1, 0.3*inch))
        
        # Get data
        attendance_data = self._get_attendance_stats()
        task_data = self._get_task_stats()
        
        # Attendance Table
        story.append(Paragraph("<b>Attendance Summary</b>", styles['Heading2']))
        att_table = Table([
            ['Days Worked', str(attendance_data['days'])],
            ['Total Hours', f"{attendance_data['hours']:.1f}"],
            ['Avg Hours/Day', f"{attendance_data['avg']:.1f}"],
        ])
        att_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ]))
        story.append(att_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Task Table
        story.append(Paragraph("<b>Task Performance</b>", styles['Heading2']))
        task_table = Table([
            ['Total Tasks', str(task_data['total'])],
            ['Completed', str(task_data['completed'])],
            ['In Progress', str(task_data['in_progress'])],
            ['Completion Rate', f"{task_data['rate']:.1f}%"],
        ])
        task_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ]))
        story.append(task_table)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def _get_attendance_stats(self):
        """Get attendance statistics"""
        records = Attendance.objects.filter(
            user=self.user,
            punch_in__date__gte=self.start_date,
            punch_in__date__lte=self.end_date
        )
        
        total_days = records.count()
        total_seconds = sum(
            r.total_work_time.total_seconds() 
            for r in records 
            if r.total_work_time
        )
        total_hours = total_seconds / 3600
        avg_hours = total_hours / total_days if total_days > 0 else 0
        
        return {
            'days': total_days,
            'hours': total_hours,
            'avg': avg_hours
        }
    
    def _get_task_stats(self):
        """Get task statistics"""
        tasks = Task.active.filter(
            assigned_to=self.user,
            created_at__date__gte=self.start_date,
            created_at__date__lte=self.end_date
        )
        
        total = tasks.count()
        completed = tasks.filter(status=TaskStatus.COMPLETED).count()
        in_progress = tasks.filter(status=TaskStatus.IN_PROGRESS).count()
        rate = (completed / total * 100) if total > 0 else 0
        
        return {
            'total': total,
            'completed': completed,
            'in_progress': in_progress,
            'rate': rate
        }
