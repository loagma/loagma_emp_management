"""
Test break categories access for different user roles
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from attendance.views import BreakCategoryViewSet
from attendance.models import BreakCategory

User = get_user_model()
factory = RequestFactory()

print("=" * 60)
print("BREAK CATEGORIES ACCESS TEST")
print("=" * 60)

# Get a test employee user
try:
    employee = User.objects.filter(role='employee', is_active=True).first()
    if not employee:
        print("\n❌ No active employee found in database")
        print("   Please create an employee user first")
        exit(1)
    
    print(f"\n👤 Testing with user: {employee.username}")
    print(f"   Role: {employee.role}")
    print(f"   Organization: {employee.organization.name if employee.organization else 'None'}")
    print(f"   Is Active: {employee.is_active}")
    print(f"   Is Staff: {employee.is_staff}")
    print(f"   Is Superuser: {employee.is_superuser}")
    
    # Create a mock request
    request = factory.get('/api/attendance/break-categories/')
    request.user = employee
    
    # Test the viewset
    viewset = BreakCategoryViewSet()
    viewset.request = request
    viewset.format_kwarg = None
    viewset.action = 'list'
    
    # Check permissions
    print("\n🔐 Checking permissions...")
    permissions = viewset.get_permissions()
    print(f"   Permission classes: {[p.__class__.__name__ for p in permissions]}")
    
    # Check if user has permission
    for permission in permissions:
        has_perm = permission.has_permission(request, viewset)
        print(f"   {permission.__class__.__name__}: {'✅ ALLOWED' if has_perm else '❌ DENIED'}")
    
    # Try to get queryset
    print("\n📋 Checking queryset...")
    try:
        queryset = viewset.get_queryset()
        count = queryset.count()
        print(f"   Categories found: {count}")
        
        if count > 0:
            print("\n   Categories:")
            for cat in queryset:
                print(f"     - {cat.name} ({cat.default_duration_minutes} min)")
        else:
            print("   ⚠️  No categories in queryset")
            
            # Check if categories exist but are filtered out
            all_cats = BreakCategory.objects.filter(is_active=True)
            print(f"\n   Total active categories in DB: {all_cats.count()}")
            if all_cats.count() > 0:
                print("   ⚠️  Categories exist but are being filtered out!")
                print(f"   User organization: {employee.organization}")
                for cat in all_cats:
                    print(f"     - {cat.name} (Org: {cat.organization})")
                    
    except Exception as e:
        print(f"   ❌ Error getting queryset: {e}")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
