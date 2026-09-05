from django.contrib import admin
from .models import User, Project, Report

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['user', 'week_start', 'week_end', 'status', 'version', 'created_at']
    list_filter = ['status', 'user', 'project']
    search_fields = ['user__username', 'notes']
    readonly_fields = ['version', 'version_history', 'created_at', 'updated_at']