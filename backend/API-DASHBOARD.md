# Dashboard Stats API Documentation

## Overview

The Dashboard Stats API provides quick metrics summary for the frontend dashboard. This is the first screen users see and must be fast and simple.

## Endpoint

```
GET /api/dashboard/stats/
```

## Authentication

Required: Yes (JWT Bearer Token)

```
Authorization: Bearer <your_jwt_token>
```

## Request

### Method
`GET`

### Headers
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json
```

### Query Parameters
None

## Response

### Success Response (200 OK)

```json
{
  "total_tasks": 1284,
  "completed_tasks": 942,
  "pending_tasks": 312,
  "overdue_tasks": 30
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_tasks` | integer | Total number of tasks in the organization |
| `completed_tasks` | integer | Number of tasks with status 'completed' |
| `pending_tasks` | integer | Number of tasks not completed (all statuses except 'completed') |
| `overdue_tasks` | integer | Number of tasks past deadline with status 'assigned' or 'progress' |

### Error Responses

#### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

#### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

## Business Logic

### Organization Context
- The endpoint automatically determines the user's organization context
- If user has created tasks, uses their organization
- If user only has assigned tasks, uses organization from assigned tasks
- Returns zeros if user has no tasks

### Task Counting Rules

1. **Total Tasks**: All tasks in the organization
2. **Completed Tasks**: Tasks with `status='completed'`
3. **Pending Tasks**: All tasks except completed (includes 'assigned', 'progress', 'delayed')
4. **Overdue Tasks**: Tasks where:
   - `deadline < current_time`
   - `status IN ['assigned', 'progress']`
   - Excludes completed and delayed tasks

## Usage Examples

### cURL

```bash
curl -X GET http://127.0.0.1:8000//api/dashboard/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Python (requests)

```python
import requests

url = "http://127.0.0.1:8000//api/dashboard/stats/"
headers = {
    "Authorization": "Bearer YOUR_TOKEN_HERE",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)
data = response.json()

print(f"Total Tasks: {data['total_tasks']}")
print(f"Completed: {data['completed_tasks']}")
print(f"Pending: {data['pending_tasks']}")
print(f"Overdue: {data['overdue_tasks']}")
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const response = await axios.get('http://127.0.0.1:8000//api/dashboard/stats/', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { total_tasks, completed_tasks, pending_tasks, overdue_tasks } = response.data;
```

### React Hook Example

```javascript
import { useQuery } from '@tanstack/react-query';
import api from '../app/axios';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats/');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
```

## Frontend Integration

### Dashboard Cards Mapping

```javascript
// Map API response to MetricCard components
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
```

## Performance Considerations

- **Fast Query**: Uses indexed fields (status, deadline, organization)
- **Minimal Data**: Returns only 4 integers
- **No Joins**: Simple count queries
- **Cacheable**: Can be cached for 30-60 seconds

### Recommended Caching Strategy

```python
# Frontend: Cache for 30 seconds
refetchInterval: 30000

# Backend: Add Redis caching (optional)
from django.core.cache import cache

cache_key = f"dashboard_stats_{org.id}"
cached_data = cache.get(cache_key)

if cached_data:
    return Response(cached_data)

# ... compute stats ...

cache.set(cache_key, data, 60)  # Cache for 60 seconds
```

## Testing

### Manual Testing

1. Start Django server:
```bash
python manage.py runserver
```

2. Get authentication token:
```bash
curl -X POST http://127.0.0.1:8000//auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

3. Test dashboard stats:
```bash
curl -X GET http://127.0.0.1:8000//api/dashboard/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Automated Testing

Use the provided test script:
```bash
python test_dashboard_api.py
```

## Future Enhancements

- [ ] Add date range filtering (last 7 days, 30 days, etc.)
- [ ] Add completion rate percentage
- [ ] Add trend indicators (up/down from previous period)
- [ ] Add department-wise breakdown
- [ ] Add employee performance summary
- [ ] Add Redis caching for better performance
- [ ] Add GraphQL support

## Related Endpoints

- `GET /api/tasks/` - List all tasks
- `POST /api/tasks/` - Create new task
- `GET /api/tasks/{id}/` - Get task details

## Support

For issues or questions:
- Check Django logs: `python manage.py runserver`
- Verify authentication token is valid
- Ensure user has tasks in their organization
- Check database has Task records

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: ✅ Production Ready
