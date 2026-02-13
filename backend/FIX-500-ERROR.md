# 🔧 Fix 500 Internal Server Error

## Problem
After adding "critical" priority to the Task model, the backend is throwing 500 errors because the database doesn't have this new choice yet.

## Solution

### Step 1: Stop the Backend Server
In the terminal where backend is running:
- Press `Ctrl+C` to stop the server

### Step 2: Create Migration
```bash
cd backend
python manage.py makemigrations
```

This should create a new migration file for the Priority change.

### Step 3: Run Migration
```bash
python manage.py migrate
```

### Step 4: Restart Backend Server
```bash
python manage.py runserver
```

### Step 5: Refresh Frontend
- Go to your browser
- Refresh the page (F5 or Ctrl+R)
- Login again if needed

## Expected Result
✅ Dashboard loads without errors
✅ /auth/me/ returns user data
✅ /api/dashboard/stats/ returns statistics
✅ /api/dashboard/alerts/ returns alerts

## If Still Having Issues

### Check Backend Terminal
Look for Python error messages in the terminal where backend is running.

### Common Issues:

1. **Migration not created**
   - Make sure you stopped the server first
   - Run `python manage.py makemigrations tasks`

2. **Migration fails**
   - Check if database file is locked
   - Close any database viewers
   - Try again

3. **Still 500 errors**
   - Check backend terminal for Python traceback
   - Look for the specific error message
   - Share the error message for help

## Quick Test
After restarting, test these URLs in browser:
- https://loagma-emp-management.onrender.com/admin (should load Django admin)
- https://loagma-emp-management.onrender.com/api/tasks/ (should return JSON)

If these work, the frontend should work too!
