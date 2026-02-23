# API Endpoints - Complete Reference

## Authentication Endpoints

### POST /auth/login/
**Purpose**: User login with JWT token generation  
**Authentication**: None (public)  
**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```
**Response** (200):
```json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token"
}
```

### POST /auth/refresh/
**Purpose**: Refresh access token  
**Authentication**: None  
**Request Body**:
```json
{
  "refresh": "jwt_refresh_token"
}
```
**Response** (200):
```json
{
  "access": "new_jwt_access_token"
}
```

### GET /auth/me/
**Purpose**: Get current user profile  
**Authentication**: Required (JWT)  
**Response** (200):
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "owner",
  "role_display": "Owner",
  "organization": 1,
  "organization_name": "Acme Corp",
  "department": 2,
  "department_name": "Sales",
  "date_joined": "2024-01-01T00:00:00Z"
}
```

## Dashboard Endpoints

### GET /api/dashboard/stats/
**Purpose**: Get dashboard statistics  
**Authentication**: Required  
**Response** (200):
```json
{
  "total_tasks": 1284,
  "completed_tasks": 942,
  "pending_tasks": 312,
  "overdue_tasks": 30
}
```

### GET /api/dashboard/alerts/
**Purpose**: Get critical alerts (overdue/delayed tasks)  
**Authentication**: Required  
**Response** (200):
```json
{
  "overdue_tasks": [...],
  "delayed_tasks": [...],
  "total_alerts": 15
}
```

## Task Management Endpoints

### GET /api/tasks/
**Purpose**: List tasks with filtering and pagination  
**Authentication**: Required  
**Permissions**: Role-based (Owner sees all, Manager sees department, Employee sees assigned)  
**Query Parameters**:
- `status`: Filter by status (assigned, in_progress, completed, delayed)
- `priority`: Filter by priority (low, medium, high)
- `assigned_to`: Filter by user ID
- `department`: Filter by department ID
- `search`: Search in title and description
- `ordering`: Sort by field (created_at, updated_at, deadline, priority)
- `page`: Page number
- `page_size`: Items per page (max 100)

**Response** (200):
```json
{
  "count": 150,
  "next": "http://api.example.com/api/tasks/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Follow up with client",
      "status": "assigned",
      "status_display": "Assigned",
      "priority": "high",
      "priority_display": "High",
      "deadline": "2024-03-15T10:00:00Z",
      "assigned_to": 5,
      "assigned_to_user": {
        "id": 5,
        "username": "employee1",
        "email": "emp@example.com",
        "role": "employee",
        "role_display": "Employee"
      },
      "is_overdue": false,
      "created_at": "2024-03-01T09:00:00Z",
      "updated_at": "2024-03-01T09:00:00Z"
    }
  ]
}
```

### POST /api/tasks/
**Purpose**: Create new task  
**Authentication**: Required  
**Permissions**: Owner or Manager only  
**Request Body**:
```json
{
  "title": "Follow up with client",
  "description": "Call client about proposal",
  "assigned_to": 5,
  "department": 2,
  "priority": "high",
  "deadline": "2024-03-15T10:00:00Z"
}
```
**Response** (201):
```json
{
  "id": 1,
  "title": "Follow up with client",
  "description": "Call client about proposal",
  "status": "assigned",
  "status_display": "Assigned",
  "priority": "high",
  "priority_display": "High",
  "deadline": "2024-03-15T10:00:00Z",
  "assigned_to": 5,
  "assigned_to_user": {...},
  "created_by": 1,
  "created_by_user": {...},
  "department": 2,
  "department_name": "Sales",
  "is_overdue": false,
  "created_at": "2024-03-01T09:00:00Z",
  "updated_at": "2024-03-01T09:00:00Z"
}
```

### GET /api/tasks/{id}/
**Purpose**: Get task detail  
**Authentication**: Required  
**Permissions**: Assigned user, Manager, or Owner  
**Response** (200): Same as POST response

### PUT/PATCH /api/tasks/{id}/
**Purpose**: Update task  
**Authentication**: Required  
**Permissions**: Owner, Manager, or task creator  
**Request Body** (partial update allowed):
```json
{
  "title": "Updated title",
  "status": "in_progress",
  "priority": "medium"
}
```
**Response** (200): Updated task object

### DELETE /api/tasks/{id}/
**Purpose**: Soft delete task  
**Authentication**: Required  
**Permissions**: Owner or Manager only  
**Response** (204): No content

### PATCH /api/tasks/{id}/status/
**Purpose**: Quick status update  
**Authentication**: Required  
**Permissions**: Assigned user, Manager, or Owner  
**Request Body**:
```json
{
  "status": "completed"
}
```
**Response** (200): Updated task object

## Employee Management Endpoints

### GET /api/employees/
**Purpose**: List employees in organization  
**Authentication**: Required  
**Permissions**: Owner or Manager only  
**Query Parameters**:
- `page`: Page number
- `page_size`: Items per page

**Response** (200):
```json
{
  "count": 25,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 5,
      "username": "employee1",
      "email": "emp@example.com",
      "role": "employee",
      "role_display": "Employee"
    }
  ]
}
```

### GET /api/employees/{id}/
**Purpose**: Get employee detail with task summary  
**Authentication**: Required  
**Permissions**: Owner or Manager only  
**Response** (200):
```json
{
  "id": 5,
  "username": "employee1",
  "email": "emp@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "employee",
  "role_display": "Employee",
  "organization": 1,
  "organization_name": "Acme Corp",
  "department": 2,
  "department_name": "Sales",
  "date_joined": "2024-01-01T00:00:00Z",
  "task_summary": {
    "total_assigned": 45,
    "completed": 32,
    "in_progress": 8,
    "pending": 3,
    "delayed": 2,
    "completion_rate": 71.11
  }
}
```

## Analytics Endpoints

### GET /api/analytics/summary/
**Purpose**: Get analytics summary  
**Authentication**: Required  
**Response** (200):
```json
{
  "completion_rate": 73.5,
  "avg_completion_time_days": 2.3,
  "efficiency_score": 85.2,
  "total_tasks": 1284,
  "on_time_completion_rate": 89.4
}
```

### GET /api/analytics/trends/
**Purpose**: Get analytics trends over time  
**Authentication**: Required  
**Query Parameters**:
- `period`: Time period (7d, 30d, 90d) - default: 30d

**Response** (200):
```json
{
  "period": "30d",
  "trends": [
    {
      "date": "2024-02-15",
      "created": 12,
      "completed": 8,
      "overdue": 2
    },
    {
      "date": "2024-02-16",
      "created": 15,
      "completed": 10,
      "overdue": 1
    }
  ]
}
```

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": true,
  "message": "Validation error",
  "status_code": 400,
  "details": {
    "field_name": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

## Authentication Header

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <access_token>
```

## Rate Limiting

- Default: 100 requests per minute per user
- Burst: 200 requests per minute

## Pagination

All list endpoints use pagination:
- Default page size: 20
- Max page size: 100
- Query params: `?page=2&page_size=50`

## Filtering

Task list supports filtering:
- By status: `?status=completed`
- By priority: `?priority=high`
- By assignee: `?assigned_to=5`
- By department: `?department=2`
- Search: `?search=client`
- Ordering: `?ordering=-created_at` (prefix with - for descending)

## Multi-Tenant Safety

All endpoints automatically filter by user's organization. Cross-organization access returns 404 (not 403) to prevent enumeration.

---

**API Version**: 1.0  
**Base URL**: `http://127.0.0.1:8000/`  
**Production URL**: TBD
