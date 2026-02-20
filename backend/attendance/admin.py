from django.contrib import admin
from .models import Attendance, Break, BreakCategory, AdminNotification


@admin.register(BreakCategory)
class BreakCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'default_duration_minutes', 'is_active', 'organization', 'created_at']
    list_filter = ['is_active', 'organization']
    search_fields = ['name']
    ordering = ['organization', 'name']


@admin.register(AdminNotification)
class AdminNotificationAdmin(admin.ModelAdmin):
    list_display = ['employee_name', 'break_category_name', 'status', 'overtime_minutes', 'created_at']
    list_filter = ['status', 'notification_type', 'organization']
    search_fields = ['employee_name', 'break_category_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


admin.site.register(Attendance)
admin.site.register(Break)
