"""
Test script to create an employee and verify login flow
"""
import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from organization.models import Organization

def create_test_employee():
    """Create a test employee for testing"""
    
    # Get first superuser as organization owner
    owner = User.objects.filter(is_superuser=True).first()
    if not owner:
        print("Error: No superuser found. Please create a superuser first.")
        sys.exit(1)
    
    # Get or create organization
    org = Organization.objects.filter(owner=owner).first()
    if not org:
        org = Organization.objects.create(
            name="Test Organization",
            owner=owner
        )
        print(f"✓ Created organization: {org.name}")
    
    # Check if employee already exists
    username = "testemployee"
    if User.objects.filter(username=username).exists():
        print(f"✓ Employee '{username}' already exists")
        user = User.objects.get(username=username)
    else:
        # Create employee
        user = User.objects.create_user(
            username=username,
            email="employee@test.com",
            password="employee123",
            first_name="Test",
            last_name="Employee",
            organization=org,
            role="employee",
            is_staff=False,
            is_superuser=False,
            is_active=True
        )
        print(f"✓ Created employee: {username}")
    
    print("\n" + "="*50)
    print("EMPLOYEE LOGIN CREDENTIALS")
    print("="*50)
    print(f"Username: {username}")
    print(f"Password: employee123")
    print(f"Role: {user.role}")
    print(f"Is Staff: {user.is_staff}")
    print(f"Is Superuser: {user.is_superuser}")
    print(f"Is Active: {user.is_active}")
    print("="*50)
    print("\nEmployee should see:")
    print("- Only Dashboard menu item")
    print("- Time tracking interface with punch in/out")
    print("- No access to Tasks, Analytics, Employees, Profile")
    print("="*50)

if __name__ == "__main__":
    try:
        create_test_employee()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
