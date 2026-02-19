import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from users.serializers import EnhancedEmployeeListSerializer
from django.test import RequestFactory

# Create a request factory
factory = RequestFactory()
request = factory.get('/api/employees/')

# Get all employees
employees = User.active.filter(is_superuser=False, is_staff=False).select_related('organization', 'department').prefetch_related('assigned_tasks', 'attendances')

print(f"Found {employees.count()} employees")

# Try to serialize the first employee
if employees.exists():
    employee = employees.first()
    print(f"\nTesting serialization for: {employee.username}")
    
    try:
        serializer = EnhancedEmployeeListSerializer(employee, context={'request': request})
        data = serializer.data
        print("✓ Serialization successful!")
        print(f"Data: {data}")
    except Exception as e:
        print(f"✗ Serialization failed: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No employees found to test")
