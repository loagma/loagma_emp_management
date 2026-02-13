"""
Simple script to create admin user using Django shell
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Check if admin exists
if User.objects.filter(username='admin').exists():
    print("Admin user already exists!")
    user = User.objects.get(username='admin')
else:
    # Create admin
    user = User.objects.create_superuser(
        username='admin',
        email='admin@loagma.com',
        password='admin123'
    )
    print("✅ Admin user created successfully!")

print("=" * 60)
print("🔐 LOGIN CREDENTIALS:")
print(f"   Username: admin")
print(f"   Password: admin123")
print("=" * 60)
