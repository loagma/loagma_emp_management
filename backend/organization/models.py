from django.db import models


class Organization(models.Model):

    name = models.CharField(max_length=255)

    owner = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name="owned_organizations"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organizations'

    def __str__(self):
        return self.name


class Department(models.Model):

    name = models.CharField(max_length=100)

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="departments"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'departments'
        indexes = [
            models.Index(fields=['organization']),
        ]

    def __str__(self):
        return f"{self.name} - {self.organization.name}"
