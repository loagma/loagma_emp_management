"""
Custom model managers for the application.
"""
from django.db import models


class ActiveManager(models.Manager):
    """
    Manager that automatically excludes soft-deleted records.
    Use this as the default manager for models with soft delete.
    """
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
