"""
Quick test script to verify task creation works
Run with: python manage.py shell < test_create_task.py
"""
from users.models import User
from tasks.models import Task
from django.utils import timezone
from datetime import timedelta

print("Testing task creation...")

# Get a manager user
manager = User.objects.filter(role='manager').first()
if not manager:
    print("ERROR: No manager found")
    exit(1)

print(f"Manager: {manager.username}")
print(f"Organization: {manager.organization}")
print(f"Department: {manager.department}")

# Get an employee to assign to
employee = User.objects.filter(role='employee', organization=manager.organization).first()
if not employee:
    print("ERROR: No employee found")
    exit(1)

print(f"Employee: {employee.username}")
print(f"Employee Department: {employee.department}")

# Try to create a task
try:
    task = Task.objects.create(
        title="Test Task from Script",
        description="Testing task creation",
        organization=manager.organization,
        department=employee.department,
        assigned_to=employee,
        created_by=manager,
        priority="medium",
        deadline=timezone.now() + timedelta(days=7)
    )
    print(f"\n✅ SUCCESS: Task created with ID {task.id}")
    print(f"Title: {task.title}")
    print(f"Assigned to: {task.assigned_to.username}")
    print(f"Department: {task.department.name if task.department else 'None'}")
    print(f"Priority: {task.priority}")
    
    # Clean up
    task.delete()
    print("\n✅ Test task deleted")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
