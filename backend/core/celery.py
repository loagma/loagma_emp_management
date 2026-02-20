"""
Celery configuration for the project.
Note: This file requires celery and redis to be installed.
Install with: pip install celery redis django-celery-beat
"""
import os

try:
    from celery import Celery
    from celery.schedules import crontab
    
    # Set the default Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    
    app = Celery('core')
    
    # Load configuration from Django settings with CELERY namespace
    app.config_from_object('django.conf:settings', namespace='CELERY')
    
    # Auto-discover tasks in all installed apps
    app.autodiscover_tasks()
    
    # Configure periodic tasks
    app.conf.beat_schedule = {
        'monitor-break-durations': {
            'task': 'attendance.tasks.monitor_break_durations',
            'schedule': crontab(minute='*/3'),  # Every 3 minutes
        },
    }
    
    @app.task(bind=True)
    def debug_task(self):
        print(f'Request: {self.request!r}')
        
except ImportError as e:
    print(f"Warning: Celery dependencies not installed. Background tasks will not be available.")
    print(f"To enable background monitoring, install: pip install celery redis django-celery-beat")
    app = None
