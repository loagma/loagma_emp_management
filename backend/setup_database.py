"""
Database setup script - Run this after resetting the PostgreSQL database
"""
import os
import sys
import subprocess

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"⚙️  {description}")
    print(f"{'='*60}")
    
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"❌ Error: {description} failed")
        print(result.stderr)
        return False
    
    print(result.stdout)
    print(f"✅ {description} completed successfully")
    return True

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║         LOAGMA DATABASE SETUP                                ║
╚══════════════════════════════════════════════════════════════╝

IMPORTANT: Before running this script, you must:
1. Open PostgreSQL (pgAdmin or psql)
2. Run these SQL commands:
   
   DROP DATABASE IF EXISTS loagma_db;
   CREATE DATABASE loagma_db;

Press Enter after you have reset the database, or Ctrl+C to cancel...
""")
    
    input()
    
    # Step 1: Run migrations
    if not run_command("python manage.py migrate", "Running database migrations"):
        print("\n❌ Setup failed at migration step")
        print("Make sure:")
        print("  - PostgreSQL is running")
        print("  - Database 'loagma_db' exists")
        print("  - Database credentials in .env are correct")
        sys.exit(1)
    
    # Step 2: Create superuser
    print(f"\n{'='*60}")
    print("👤 Creating Superuser Account")
    print(f"{'='*60}")
    print("\nYou will be prompted to create a superuser account.")
    print("Recommended credentials:")
    print("  Username: admin")
    print("  Email: admin@loagma.com")
    print("  Password: admin123")
    print()
    
    result = subprocess.run("python manage.py createsuperuser", shell=True)
    
    if result.returncode != 0:
        print("\n⚠️  Superuser creation was cancelled or failed")
        print("You can create it later with: python manage.py createsuperuser")
    else:
        print("\n✅ Superuser created successfully")
    
    # Final message
    print(f"\n{'='*60}")
    print("🎉 DATABASE SETUP COMPLETE!")
    print(f"{'='*60}")
    print("\nNext steps:")
    print("1. Start backend: python manage.py runserver")
    print("2. Start frontend: cd ../frontend && npm run dev")
    print("3. Login at: http://localhost:5173")
    print("\nLogin credentials:")
    print("  Username: admin")
    print("  Password: admin123")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
