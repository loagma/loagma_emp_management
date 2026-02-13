"""
Fix database schema by directly adding missing columns
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

def run_sql(sql, description):
    """Execute SQL and handle errors"""
    print(f"\n{'='*60}")
    print(f"⚙️  {description}")
    print(f"{'='*60}")
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql)
        print(f"✅ {description} - SUCCESS")
        return True
    except Exception as e:
        error_msg = str(e)
        if "already exists" in error_msg or "duplicate" in error_msg.lower():
            print(f"ℹ️  {description} - Already exists (OK)")
            return True
        else:
            print(f"❌ {description} - FAILED")
            print(f"Error: {error_msg}")
            return False

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║         DATABASE SCHEMA FIX                                  ║
╚══════════════════════════════════════════════════════════════╝

This script will add missing columns to the database.
""")
    
    # Fix users table
    sqls = [
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'employee'",
            "Add role column to users table"
        ),
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER",
            "Add organization_id column to users table"
        ),
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER",
            "Add department_id column to users table"
        ),
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE",
            "Add is_deleted column to users table"
        ),
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
            "Add updated_at column to users table"
        ),
    ]
    
    success_count = 0
    for sql, description in sqls:
        if run_sql(sql, description):
            success_count += 1
    
    print(f"\n{'='*60}")
    print(f"✅ Schema fix completed: {success_count}/{len(sqls)} operations successful")
    print(f"{'='*60}\n")
    
    # Verify the fix
    print("Verifying schema...")
    try:
        from users.models import User
        user_count = User.objects.count()
        print(f"✅ Users table is accessible. Found {user_count} users.")
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    if main():
        print("\n🎉 Database schema is now fixed!")
        print("\nNext steps:")
        print("1. Create superuser: python manage.py createsuperuser")
        print("2. Test backend: python test_backend.py")
        print("3. Start server: python manage.py runserver")
    else:
        print("\n❌ Schema fix failed. You may need to reset the database.")
        print("See SETUP-INSTRUCTIONS.md for database reset steps.")
