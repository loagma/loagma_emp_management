from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models
from cloudinary.models import CloudinaryField
from core.managers import ActiveManager


class UserRole(models.TextChoices):
    OWNER = 'owner', 'Owner'
    MANAGER = 'manager', 'Manager'
    EMPLOYEE = 'employee', 'Employee'


class ActiveUserManager(DjangoUserManager):
    """Custom user manager that excludes soft-deleted users."""
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class User(AbstractUser):

    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.EMPLOYEE
    )
    
    organization = models.ForeignKey(
        'organization.Organization',
        on_delete=models.CASCADE,
        related_name='users',
        null=True,  # Temporary - will be required after migration
        blank=True
    )
    
    department = models.ForeignKey(
        'organization.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    
    is_deleted = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    profile_picture = CloudinaryField(
        'image',
        folder='profile_pictures',
        null=True,
        blank=True,
        help_text='Employee profile picture',
        transformation={
            'width': 400,
            'height': 400,
            'crop': 'fill',
            'gravity': 'face',
            'quality': 'auto:good'
        }
    )
    
    # Managers
    objects = DjangoUserManager()  # Default manager with auth support
    active = ActiveUserManager()    # Excludes soft-deleted
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['organization', 'is_deleted']),
            models.Index(fields=['department']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
