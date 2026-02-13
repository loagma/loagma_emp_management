@echo off
echo ========================================
echo Fixing 500 Error - Loagma Backend
echo ========================================
echo.

echo Step 1: Creating migrations...
python manage.py makemigrations
if %errorlevel% neq 0 (
    echo ERROR: Failed to create migrations
    pause
    exit /b 1
)
echo.

echo Step 2: Running migrations...
python manage.py migrate
if %errorlevel% neq 0 (
    echo ERROR: Failed to run migrations
    pause
    exit /b 1
)
echo.

echo Step 3: Checking system...
python manage.py check
if %errorlevel% neq 0 (
    echo ERROR: System check failed
    pause
    exit /b 1
)
echo.

echo ========================================
echo SUCCESS! Backend is ready.
echo ========================================
echo.
echo Now starting the server...
echo Press Ctrl+C to stop the server
echo.
python manage.py runserver
