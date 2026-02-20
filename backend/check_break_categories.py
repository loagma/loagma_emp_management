"""
Quick diagnostic script to check break categories setup
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from attendance.models import BreakCategory
from organization.models import Organization

print("=" * 50)
print("BREAK CATEGORIES DIAGNOSTIC")
print("=" * 50)

# Check organizations
orgs = Organization.objects.all()
print(f"\n📊 Organizations: {orgs.count()}")
for org in orgs:
    print(f"  - {org.name} (ID: {org.id})")

# Check break categories
categories = BreakCategory.objects.all()
print(f"\n☕ Break Categories: {categories.count()}")

if categories.count() == 0:
    print("\n⚠️  WARNING: No break categories found!")
    print("   Run: python manage.py migrate attendance")
else:
    for cat in categories:
        status = "✅ Active" if cat.is_active else "❌ Inactive"
        print(f"  {status} {cat.name} ({cat.default_duration_minutes} min) - Org: {cat.organization.name}")

# Check by organization
print("\n📋 Categories by Organization:")
for org in orgs:
    org_cats = BreakCategory.objects.filter(organization=org, is_active=True)
    print(f"\n  {org.name}:")
    if org_cats.count() == 0:
        print("    ⚠️  No active categories!")
    else:
        for cat in org_cats:
            print(f"    - {cat.name} ({cat.default_duration_minutes} min)")

print("\n" + "=" * 50)
print("DIAGNOSTIC COMPLETE")
print("=" * 50)
