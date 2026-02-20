"""
Core app initialization.
"""
# This will make sure the app is always imported when
# Django starts so that shared_task will use this app.
# Celery is optional - only import if installed
try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    # Celery not installed - skip
    __all__ = ()
