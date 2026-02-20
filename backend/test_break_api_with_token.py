"""
Test break categories API endpoint with actual JWT token
"""
import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User

# Get user
user = User.objects.get(username='admin@gmail.com')

# Generate token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

print("=" * 60)
print("BREAK CATEGORIES API TEST WITH JWT TOKEN")
print("=" * 60)
print(f"\n👤 User: {user.username}")
print(f"   Organization: {user.organization}")
print(f"\n🔑 Access Token (first 50 chars): {access_token[:50]}...")

# Test API endpoint
url = "https://loagma-emp-management.onrender.comapi/attendance/break-categories/"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

print(f"\n📡 Testing GET {url}")
print(f"   Headers: Authorization: Bearer {access_token[:20]}...")

try:
    response = requests.get(url, headers=headers)
    print(f"\n✅ Response Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   Response type: {type(data)}")
        print(f"   Response data: {data}")
        
        if isinstance(data, list):
            print(f"   Categories found: {len(data)}")
            for cat in data:
                print(f"     - {cat['name']} ({cat['default_duration_minutes']} min)")
        else:
            print(f"   Unexpected response format: {data}")
    else:
        print(f"   Error: {response.text}")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
