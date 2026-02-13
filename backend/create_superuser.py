"""
Create a superuser with Owner role for full system access
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from organization.models import Organization, Department

# Create superuser with Owner role
username = "admin"
email = "admin@loagma.com"
password = "admin123"

# Delete existing user if exists
User.objects.filter(username=username).delete()

# First create a temporary user to be the owner
temp_user = User.objects.create_user(
    username="temp_owner",
    email="temp@loagma.com",
    password="temp123",
    role="owner"
)

# Create organization with temp owner
org, _ = Organization.objects.get_or_create(
    name="Loagma Corporation",
    defaults={"owner": temp_user}
)

# Create department
dept, _ = Department.objects.get_or_create(
    name="Administration",
    organization=org
)

# Create actual superuser
user = User.objects.create_user(
    username=username,
    email=email,
    password=password,
    role="owner",
    organization=org,
    department=dept,
    is_staff=True,
    is_superuser=True
)

# Update organization owner to the actual admin
org.owner = user
org.save()

# Update temp user to belong to the org
temp_user.organization = org
temp_user.department = dept
temp_user.save()

# Delete temp user
temp_user.delete()

print("=" * 60)
print("✅ SUPERUSER CREATED SUCCESSFULLY")
print("=" * 60)
print(f"Username: {username}")
print(f"Password: {password}")
print(f"Email: {email}")
print(f"Role: Owner (Full Access)")
print(f"Organization: {org.name}")
print(f"Department: {dept.name}")
print("=" * 60)
print("\n🔐 LOGIN CREDENTIALS:")
print(f"   Username: {username}")
print(f"   Password: {password}")
print("=" * 60)
