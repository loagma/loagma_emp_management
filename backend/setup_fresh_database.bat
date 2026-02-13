@echo off
echo ============================================================
echo DATABASE SETUP FOR LOAGMA EMPLOYEE MANAGEMENT
echo ============================================================
echo.
echo IMPORTANT: This script will guide you through database setup.
echo.
echo STEP 1: Reset PostgreSQL Database
echo ============================================================
echo You need to manually reset the database first.
echo.
echo Open PostgreSQL (psql or pgAdmin) and run:
echo.
echo   DROP DATABASE IF EXISTS loagma_db;
echo   CREATE DATABASE loagma_db;
echo.
echo Press any key AFTER you have reset the database...
pause >nul
echo.
echo STEP 2: Running Migrations
echo ============================================================
python manage.py migrate
echo.
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Migrations failed!
    echo Make sure the database was reset properly.
    pause
    exit /b 1
)
echo.
echo STEP 3: Create Superuser
echo ============================================================
echo.
echo You will be prompted to create a superuser account.
echo Recommended credentials:
echo   Username: admin
echo   Email: admin@loagma.com  
echo   Password: admin123
echo.
python manage.py createsuperuser
echo.
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Superuser creation was cancelled or failed.
    echo You can create it later with: python manage.py createsuperuser
)
echo.
echo ============================================================
echo SETUP COMPLETE!
echo ============================================================
echo.
echo You can now:
echo 1. Start the backend server: python manage.py runserver
echo 2. Login with your superuser credentials
echo 3. Optionally run: python setup_test_data.py (for demo data)
echo.
echo ============================================================
pause
