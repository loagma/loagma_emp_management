# Database Setup Instructions

## Problem
The database schema is out of sync with the Django models. The migrations show as applied but the actual database columns don't exist.

## Solution: Reset and Recreate Database

### Step 1: Drop and Recreate Database (PostgreSQL)

Open PostgreSQL command line or pgAdmin and run:

```sql
DROP DATABASE IF EXISTS loagma_db;
CREATE DATABASE loagma_db;
```

### Step 2: Run Migrations

```bash
cd backend
python manage.py migrate
```

### Step 3: Create Superuser

```bash
python manage.py createsuperuser
```

When prompted, enter:
- Username: `admin`
- Email: `admin@loagma.com`
- Password: `admin123`
- Password (again): `admin123`

### Step 4: Setup Test Data (Optional)

```bash
python setup_test_data.py
```

## Quick Login Credentials

After setup, you can login with:

```
Username: admin
Password: admin123
Role: Superuser (Full Access)
```

## Alternative: Use Existing Test Users

If you already ran `setup_test_data.py`, these users exist:

1. **Owner**: First user created (check with list_users.py)
2. **Manager (Sales)**: 
   - Username: `manager_sales`
   - Password: `password123`
3. **Manager (Engineering)**:
   - Username: `manager_eng`
   - Password: `password123`
4. **Employees**: Various employee accounts with password `password123`

## Troubleshooting

If you get "column does not exist" errors:
1. The database needs to be reset (see Step 1)
2. Make sure all migrations are applied (see Step 2)
3. Don't skip the database recreation step
