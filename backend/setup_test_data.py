"""
Setup test data for Loagma Employee Management System
Run with: python manage.py shell < setup_test_data.py
"""
from users.models import User
from organization.models import Organization, Department
from tasks.models import Task
from django.utils import timezone
from datetime import timedelta

print("Setting up test data...")

# Get or create owner user
owner = User.objects.first()
if not owner:
    print("ERROR: No users found. Please create a superuser first:")
    print("   python manage.py createsuperuser")
    exit(1)

print(f"Using owner: {owner.username}")

# Create organization
org, created = Organization.objects.get_or_create(
    name="Loagma Corp",
    defaults={'owner': owner}
)
if created:
    print(f"Created organization: {org.name}")
else:
    print(f"Organization already exists: {org.name}")

# Update owner's organization
if not owner.organization:
    owner.organization = org
    owner.role = 'owner'
    owner.save()
    print(f"Updated owner organization")

# Create departments
departments_data = [
    "Sales",
    "Marketing",
    "Engineering",
    "HR",
    "Operations"
]

departments = {}
for dept_name in departments_data:
    dept, created = Department.objects.get_or_create(
        name=dept_name,
        organization=org
    )
    departments[dept_name] = dept
    if created:
        print(f"Created department: {dept_name}")

# Create managers
managers_data = [
    ("manager_sales", "sales@loagma.com", "Sales"),
    ("manager_eng", "eng@loagma.com", "Engineering"),
]

managers = {}
for username, email, dept_name in managers_data:
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'role': 'manager',
            'organization': org,
            'department': departments[dept_name]
        }
    )
    if created:
        user.set_password('password123')
        user.save()
        print(f"Created manager: {username}")
    managers[dept_name] = user

# Create employees
employees_data = [
    ("emp_rahul", "rahul@loagma.com", "Sales"),
    ("emp_anjali", "anjali@loagma.com", "Sales"),
    ("emp_priya", "priya@loagma.com", "Engineering"),
    ("emp_amit", "amit@loagma.com", "Engineering"),
    ("emp_neha", "neha@loagma.com", "Marketing"),
]

employees = []
for username, email, dept_name in employees_data:
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'role': 'employee',
            'organization': org,
            'department': departments[dept_name]
        }
    )
    if created:
        user.set_password('password123')
        user.save()
        print(f"Created employee: {username}")
    employees.append(user)

# Create tasks
tasks_data = [
    {
        'title': 'Follow up with client ABC',
        'description': 'Call about Q1 proposal and pricing',
        'department': 'Sales',
        'assigned_to': employees[0],  # Rahul
        'priority': 'high',
        'status': 'assigned',
        'deadline_days': 2
    },
    {
        'title': 'Prepare sales presentation',
        'description': 'Create deck for investor meeting',
        'department': 'Sales',
        'assigned_to': employees[1],  # Anjali
        'priority': 'high',
        'status': 'in_progress',
        'deadline_days': 5
    },
    {
        'title': 'Fix login bug',
        'description': 'Users reporting timeout issues',
        'department': 'Engineering',
        'assigned_to': employees[2],  # Priya
        'priority': 'critical',
        'status': 'in_progress',
        'deadline_days': 1
    },
    {
        'title': 'Code review for API changes',
        'description': 'Review PR #234 for new endpoints',
        'department': 'Engineering',
        'assigned_to': employees[3],  # Amit
        'priority': 'medium',
        'status': 'assigned',
        'deadline_days': 3
    },
    {
        'title': 'Update documentation',
        'description': 'Add API docs for new features',
        'department': 'Engineering',
        'assigned_to': employees[2],  # Priya
        'priority': 'low',
        'status': 'assigned',
        'deadline_days': 10
    },
    {
        'title': 'Social media campaign',
        'description': 'Plan Q2 marketing campaign',
        'department': 'Marketing',
        'assigned_to': employees[4],  # Neha
        'priority': 'medium',
        'status': 'assigned',
        'deadline_days': 7
    },
    {
        'title': 'Quarterly report',
        'description': 'Compile Q1 performance metrics',
        'department': 'Sales',
        'assigned_to': employees[0],  # Rahul
        'priority': 'high',
        'status': 'completed',
        'deadline_days': -5  # Completed 5 days ago
    },
    {
        'title': 'Database optimization',
        'description': 'Improve query performance',
        'department': 'Engineering',
        'assigned_to': employees[3],  # Amit
        'priority': 'medium',
        'status': 'completed',
        'deadline_days': -3
    },
    {
        'title': 'Client onboarding',
        'description': 'Setup new client XYZ',
        'department': 'Sales',
        'assigned_to': employees[1],  # Anjali
        'priority': 'high',
        'status': 'delayed',
        'deadline_days': -2  # Overdue by 2 days
    },
]

created_tasks = 0
for task_data in tasks_data:
    dept_name = task_data.pop('department')
    deadline_days = task_data.pop('deadline_days')
    
    task, created = Task.objects.get_or_create(
        title=task_data['title'],
        defaults={
            **task_data,
            'organization': org,
            'department': departments[dept_name],
            'created_by': managers.get(dept_name, owner),
            'deadline': timezone.now() + timedelta(days=deadline_days)
        }
    )
    if created:
        created_tasks += 1

print(f"Created {created_tasks} tasks")

# Summary
print("\n" + "="*50)
print("TEST DATA SUMMARY")
print("="*50)
print(f"Organization: {org.name}")
print(f"Departments: {Department.objects.filter(organization=org).count()}")
print(f"Users: {User.objects.filter(organization=org).count()}")
print(f"  - Owners: {User.objects.filter(organization=org, role='owner').count()}")
print(f"  - Managers: {User.objects.filter(organization=org, role='manager').count()}")
print(f"  - Employees: {User.objects.filter(organization=org, role='employee').count()}")
print(f"Tasks: {Task.objects.filter(organization=org).count()}")
print(f"  - Assigned: {Task.objects.filter(organization=org, status='assigned').count()}")
print(f"  - In Progress: {Task.objects.filter(organization=org, status='in_progress').count()}")
print(f"  - Completed: {Task.objects.filter(organization=org, status='completed').count()}")
print(f"  - Delayed: {Task.objects.filter(organization=org, status='delayed').count()}")
print("\n" + "="*50)
print("TEST CREDENTIALS")
print("="*50)
print(f"Owner: {owner.username} / password123")
print("Manager (Sales): manager_sales / password123")
print("Manager (Eng): manager_eng / password123")
print("Employee: emp_rahul / password123")
print("\nTest data setup complete!")
