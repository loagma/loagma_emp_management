"""
Test pause functionality for tasks
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tasks.models import Task
from users.models import User

print("=" * 60)
print("TESTING PAUSE FUNCTIONALITY")
print("=" * 60)

# Get a test task
task = Task.objects.filter(is_deleted=False).first()

if not task:
    print("No tasks found to test")
    exit()

print(f"\n📋 Testing with task: {task.title}")
print(f"   ID: {task.id}")
print(f"   Status: {task.status}")
print(f"   Has deadline: {task.deadline is not None}")
print(f"   Is paused: {task.is_paused}")

# Test pause
print(f"\n⏸️  Attempting to pause task...")
result = task.pause_task()
print(f"   Pause result: {result}")

if result:
    print(f"   ✅ Task paused successfully!")
    print(f"   New status: {task.status}")
    print(f"   Is paused: {task.is_paused}")
    print(f"   Paused at: {task.paused_at}")
    print(f"   Remaining time: {task.remaining_time}")
    
    # Test resume
    print(f"\n▶️  Attempting to resume task...")
    resume_result = task.resume_task()
    print(f"   Resume result: {resume_result}")
    
    if resume_result:
        print(f"   ✅ Task resumed successfully!")
        print(f"   New status: {task.status}")
        print(f"   Is paused: {task.is_paused}")
        print(f"   Pause duration: {task.pause_duration}")
    else:
        print(f"   ❌ Failed to resume task")
else:
    print(f"   ❌ Failed to pause task")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)