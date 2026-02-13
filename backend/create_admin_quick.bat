@echo off
echo ============================================================
echo QUICK ADMIN CREATION
echo ============================================================
echo.
echo This will create a superuser account for admin panel access.
echo.
echo Default credentials:
echo   Username: admin
echo   Email: admin@loagma.com
echo   Password: admin123
echo.
echo ============================================================
echo.

python manage.py createsuperuser --username admin --email admin@loagma.com

echo.
echo ============================================================
echo Done! You can now login with your admin credentials.
echo ============================================================
pause
