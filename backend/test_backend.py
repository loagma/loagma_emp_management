"""
Test backend API endpoints
"""
import requests
import json

BASE_URL = "https://loagma-emp-management.onrender.com"

def test_endpoint(method, endpoint, data=None, token=None, description=""):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    print(f"\n{'='*60}")
    print(f"Testing: {description}")
    print(f"{'='*60}")
    print(f"Method: {method}")
    print(f"URL: {url}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            print(f"Data: {json.dumps(data, indent=2)}")
            response = requests.post(url, json=data, headers=headers)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code < 400:
            print(f"✅ Success")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return response.json()
        else:
            print(f"❌ Failed")
            print(f"Error: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error")
        print(f"Make sure backend is running: python manage.py runserver")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║         BACKEND API TEST                                     ║
╚══════════════════════════════════════════════════════════════╝
""")
    
    # Test 1: Login
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    result = test_endpoint(
        "POST",
        "/auth/login/",
        data=login_data,
        description="Login with admin credentials"
    )
    
    if not result:
        print("\n❌ Login failed. Cannot continue tests.")
        print("\nMake sure:")
        print("  1. Backend is running: python manage.py runserver")
        print("  2. Database is set up: python setup_database.py")
        print("  3. Superuser exists with username 'admin' and password 'admin123'")
        return
    
    access_token = result.get("access")
    
    # Test 2: Get current user
    test_endpoint(
        "GET",
        "/auth/me/",
        token=access_token,
        description="Get current user info"
    )
    
    # Test 3: Dashboard stats
    test_endpoint(
        "GET",
        "/api/dashboard/stats/",
        token=access_token,
        description="Get dashboard statistics"
    )
    
    # Test 4: Dashboard alerts
    test_endpoint(
        "GET",
        "/api/dashboard/alerts/",
        token=access_token,
        description="Get dashboard alerts"
    )
    
    # Test 5: Tasks list
    test_endpoint(
        "GET",
        "/api/tasks/",
        token=access_token,
        description="Get tasks list"
    )
    
    # Test 6: Employees list
    test_endpoint(
        "GET",
        "/api/employees/",
        token=access_token,
        description="Get employees list"
    )
    
    # Test 7: Analytics summary
    test_endpoint(
        "GET",
        "/api/analytics/summary/",
        token=access_token,
        description="Get analytics summary"
    )
    
    # Test 8: Analytics trends
    test_endpoint(
        "GET",
        "/api/analytics/trends/",
        token=access_token,
        description="Get analytics trends"
    )
    
    print(f"\n{'='*60}")
    print("🎉 ALL TESTS COMPLETED")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
