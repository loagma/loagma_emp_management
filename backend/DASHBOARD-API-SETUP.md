# Dashboard Stats API - Setup Guide

## What Was Built

✅ **Endpoint**: `GET /api/dashboard/stats/`  
✅ **Purpose**: Provide quick metrics for frontend dashboard  
✅ **Authentication**: JWT Bearer Token required  
✅ **Response Time**: Fast (simple count queries)

## Files Created/Modified

### New Files
1. ✅ `analytics/urls.py` - URL routing for analytics endpoints
2. ✅ `test_dashboard_api.py` - Test script for API verification
3. ✅ `API-DASHBOARD.md` - Complete API documentation
4. ✅ `DASHBOARD-API-SETUP.md` - This file

### Modified Files
1. ✅ `analytics/views.py` - Added `dashboard_stats` view
2. ✅ `core/urls.py` - Connected analytics URLs

## Quick Start

### Step 1: Verify Django Server

```bash
cd backend
python manage.py runserver
```

Server should start at: `http://127.0.0.1:8000/`

### Step 2: Get Authentication Token

First, you need to login to get a JWT token:

```bash
curl -X POST http://127.0.0.1:8000//auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

Response will include:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

Copy the `access` token.

### Step 3: Test Dashboard Stats Endpoint

```bash
curl -X GET http://127.0.0.1:8000//api/dashboard/stats/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "total_tasks": 1284,
  "completed_tasks": 942,
  "pending_tasks": 312,
  "overdue_tasks": 30
}
```

### Step 4: Test with Python Script

1. Update token in `test_dashboard_api.py`:
```python
TOKEN = "your_access_token_here"
```

2. Run test:
```bash
python test_dashboard_api.py
```

## API Response Explained

```json
{
  "total_tasks": 1284,      // All tasks in organization
  "completed_tasks": 942,   // Tasks with status='completed'
  "pending_tasks": 312,     // All non-completed tasks
  "overdue_tasks": 30       // Past deadline, not completed
}
```

## Frontend Integration

### Step 1: Create API Function

File: `frontend/src/features/analytics/api/analyticsApi.js`

```javascript
import api from "../../../app/axios";

export const fetchDashboardStats = async () => {
  const res = await api.get("/dashboard/stats/");
  return res.data;
};
```

### Step 2: Use in Dashboard Page

```javascript
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../features/analytics/api/analyticsApi';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <div>Error loading stats</div>;

  return (
    <PageLayout>
      <Section title="Overview">
        <DashboardGrid cols={4}>
          <MetricCard
            title="Total Tasks"
            value={data.total_tasks}
          />
          <MetricCard
            title="Completed"
            value={data.completed_tasks}
          />
          <MetricCard
            title="Pending"
            value={data.pending_tasks}
          />
          <MetricCard
            title="Overdue Tasks"
            value={data.overdue_tasks}
          />
        </DashboardGrid>
      </Section>
    </PageLayout>
  );
}
```

## Troubleshooting

### Issue: 401 Unauthorized

**Problem**: Token is missing or invalid

**Solution**:
1. Login again to get fresh token
2. Check token is included in Authorization header
3. Verify token format: `Bearer <token>`

### Issue: 403 Forbidden

**Problem**: User doesn't have permission

**Solution**:
1. Check user is authenticated
2. Verify user has proper role
3. Check IsAuthenticated permission is working

### Issue: Empty Response (all zeros)

**Problem**: User has no tasks in organization

**Solution**:
1. Create some test tasks
2. Assign tasks to the user
3. Verify organization relationship

### Issue: Connection Refused

**Problem**: Django server not running

**Solution**:
```bash
python manage.py runserver
```

## Database Requirements

The endpoint queries the `Task` model with these fields:
- `organization` - ForeignKey to Organization
- `status` - CharField (assigned, progress, completed, delayed)
- `deadline` - DateTimeField
- `created_by` - ForeignKey to User
- `assigned_to` - ForeignKey to User

Make sure migrations are applied:
```bash
python manage.py makemigrations
python manage.py migrate
```

## Performance Notes

### Query Optimization
- Uses `.count()` for efficient counting
- Filters by organization for data isolation
- Uses indexed fields (status, deadline)

### Caching Strategy (Optional)
Add Redis caching for high-traffic scenarios:

```python
from django.core.cache import cache

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    cache_key = f"dashboard_stats_{user.id}"
    
    # Try cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    # ... compute stats ...
    
    # Cache for 60 seconds
    cache.set(cache_key, data, 60)
    return Response(data)
```

## Next Steps

1. ✅ Test endpoint manually with cURL
2. ✅ Test with Python script
3. ⏳ Integrate with frontend
4. ⏳ Add error handling in frontend
5. ⏳ Add loading states
6. ⏳ Add auto-refresh (30 seconds)
7. ⏳ Add error toast notifications

## Related Documentation

- [API-DASHBOARD.md](./API-DASHBOARD.md) - Complete API documentation
- [tasks/models.py](./tasks/models.py) - Task model definition
- [analytics/views.py](./analytics/views.py) - View implementation

---

**Status**: ✅ Ready for Testing  
**Next**: Frontend Integration
