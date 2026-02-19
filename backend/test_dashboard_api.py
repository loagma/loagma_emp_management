"""
Test script for Dashboard Stats API endpoint

Usage:
    python test_dashboard_api.py

Make sure the Django server is running on http://127.0.0.1:8000/
"""

import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000/"
DASHBOARD_STATS_URL = f"{BASE_URL}/api/dashboard/stats/"

# You'll need to replace this with a valid token
# Get token by logging in first
TOKEN = "your_token_here"

def test_dashboard_stats():
    """Test the dashboard stats endpoint"""
    
    print("=" * 60)
    print("Testing Dashboard Stats API")
    print("=" * 60)
    
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        print(f"\n📡 Making GET request to: {DASHBOARD_STATS_URL}")
        response = requests.get(DASHBOARD_STATS_URL, headers=headers)
        
        print(f"\n📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ Success! Dashboard Stats:")
            print(json.dumps(data, indent=2))
            
            print("\n📈 Metrics Summary:")
            print(f"  • Total Tasks: {data.get('total_tasks', 0)}")
            print(f"  • Completed: {data.get('completed_tasks', 0)}")
            print(f"  • Pending: {data.get('pending_tasks', 0)}")
            print(f"  • Overdue: {data.get('overdue_tasks', 0)}")
            
        elif response.status_code == 401:
            print("\n❌ Authentication failed!")
            print("Please update the TOKEN variable with a valid JWT token")
            print("\nTo get a token:")
            print("1. Login via /auth/login/ endpoint")
            print("2. Copy the access token from response")
            print("3. Update TOKEN variable in this script")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error!")
        print("Make sure Django server is running:")
        print("  python manage.py runserver")
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    test_dashboard_stats()
