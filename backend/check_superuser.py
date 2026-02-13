"""
Check if superuser exists and create one if needed
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from organization.models import Organization, Department

print("\n" + "="*60)
print("CHECKING SUPERUSER STATUS")
print("="*60)

# Check for existing superusers
superusers = User.objects.filter(is_superuser=True)

if superusers.exists():
    print(f"\n✅ Found {superusers.count()} superuser(s):")
    for user in superusers:
        print(f"\n  Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Is Staff: {user.is_staff}")
        print(f"  Is Superuser: {user.is_superuser}")
        print(f"  Organization: {user.organization}")
        print(f"  Department: {user.department}")
else:
    print("\n❌ No superuser found!")
    print("\nCreating superuser 'admin'...")
    
    # Get or create organization
    org, _ = Organization.objects.get_or_create(
        name="Loagma Corporation",
        defaults={'owner_id': 1}  # Temporary, will update
    )
    
    # Get or create department
    dept, _ = Department.objects.get_or_create(
        name="Administration",
        organization=org
    )
    
    # Create superuser
    try:
        user = User.objects.create_superuser(
            username='admin',
            email='admin@loagma.com',
            password='admin123',
            role='owner',
            organization=org,
            department=dept
        )
        
        # Update org owner
        org.owner = user
        org.save()
        
        print("\n✅ Superuser created successfully!")
        print(f"\n  Username: admin")
        print(f"  Password: admin123")
        print(f"  Email: admin@loagma.com")
        
    except Exception as e:
        print(f"\n❌ Failed to create superuser: {e}")

print("\n" + "="*60)
print("READY TO LOGIN")
print("="*60)
print("\nCredentials:")
print("  Username: admin")
print("  Password: admin123")
print("="*60 + "\n")
