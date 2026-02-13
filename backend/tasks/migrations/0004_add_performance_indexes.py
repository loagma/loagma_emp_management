# Generated migration for performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0003_alter_task_options_task_is_deleted_and_more'),
    ]

    operations = [
        # Add composite indexes for common queries
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['organization', 'status', '-created_at'], name='task_org_status_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['organization', 'assigned_to', 'status'], name='task_org_assign_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['organization', 'department', 'status'], name='task_org_dept_idx'),
        ),
    ]
