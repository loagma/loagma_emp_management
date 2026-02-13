"""
Create admin user with username 'admin' and password 'admin123'
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from organization.models import Organization, Department

print("\n" + "="*60)
print("CREATING ADMIN USER")
print("="*60)

# Check if admin already exists
if User.objects.filter(username='admin').exists():
    print("\n⚠️  User 'admin' already exists. Updating...")
    user = User.objects.get(username='admin')
    user.set_password('admin123')
    user.is_superuser = True
    user.is_staff = True
    user.role = 'owner'
    user.email = 'admin@loagma.com'
    
    # Ensure user has organization
    if not user.organization:
        org = Organization.objects.first()
        if org:
            user.organization = org
            if not user.department:
                dept = Department.objects.filter(organization=org).first()
                user.department = dept
    
    user.save()
    print("✅ User 'admin' updated successfully!")
else:
    print("\n📝 Creating new user 'admin'...")
    
    # Get or create organization
    org = Organization.objects.first()
    if not org:
        # Create a temporary user for org owner
        temp_user = User.objects.create_user(
            username='temp_owner',
            email='temp@loagma.com',
            password='temp123'
        )
        org = Organization.objects.create(
            name="Loagma Corporation",
            owner=temp_user
        )
    
    # Get or create department
    dept = Department.objects.filter(organization=org).first()
    if not dept:
        dept = Department.objects.create(
            name="Administration",
            organization=org
        )
    
    # Create admin user
    user = User.objects.create_superuser(
        username='admin',
        email='admin@loagma.com',
        password='admin123',
        role='owner',
        organization=org,
        department=dept
    )
    
    print("✅ User 'admin' created successfully!")

print("\n" + "="*60)
print("LOGIN CREDENTIALS")
print("="*60)
print("\n  Username: admin")
print("  Password: admin123")
print("  Email: admin@loagma.com")
print("  Role: Owner (Superuser)")
print("\n" + "="*60 + "\n")
