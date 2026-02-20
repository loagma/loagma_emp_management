"""
Celery tasks for attendance and break monitoring.
Note: Celery is optional. If not installed, monitoring must be done manually.
"""
import logging

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
    
    @shared_task
    def monitor_break_durations():
        """
        Periodic task to check for exceeded breaks.
        Runs every 3 minutes via Celery Beat.
        """
        try:
            from .services import BreakMonitoringService
            BreakMonitoringService.check_exceeded_breaks()
            logger.info("Break monitoring task completed successfully")
        except Exception as e:
            logger.error(f"Error in break monitoring task: {str(e)}")
            raise
            
except ImportError:
    # Celery not installed - define a dummy function
    logger.warning("Celery not installed. Break monitoring task will not run automatically.")
    
    def monitor_break_durations():
        """Dummy function when Celery is not installed"""
        pass
