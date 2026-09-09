from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('TEAM_MEMBER', 'Team Member'),
        ('MANAGER', 'Manager'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='TEAM_MEMBER')
    
    def __str__(self):
        return self.username

class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    team_members = models.ManyToManyField(
        User,
        related_name='assigned_projects',
        blank=True,
        limit_choices_to={'role': 'TEAM_MEMBER'}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Report(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('NEEDS_CORRECTION', 'Needs Correction'),
        ('APPROVED', 'Approved'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True)
    
    week_start = models.DateField()
    week_end = models.DateField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    tasks = models.JSONField(default=list)
    blockers = models.JSONField(default=list)
    achievements = models.JSONField(default=list)
    hours_worked = models.JSONField(default=dict)
    notes = models.TextField(blank=True)
    
    manager_comment = models.TextField(blank=True)
    version = models.IntegerField(default=1)
    version_history = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    tasks_planned = models.JSONField(default=list)
    
    def __str__(self):
        return f"{self.user.username} - Week of {self.week_start}"