from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Project, Report

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'first_name', 'last_name']
    
    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            role=validated_data.get('role', 'TEAM_MEMBER'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class ProjectSerializer(serializers.ModelSerializer):
    team_members = UserSerializer(many=True, read_only=True)
    team_member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'team_members', 'team_member_ids', 'created_at']
    
    def create(self, validated_data):
        team_member_ids = validated_data.pop('team_member_ids', [])
        project = Project.objects.create(**validated_data)
        if team_member_ids:
            project.team_members.set(User.objects.filter(id__in=team_member_ids))
        return project
    
    def update(self, instance, validated_data):
        team_member_ids = validated_data.pop('team_member_ids', None)
        
        # Update fields
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        
        # Update team members if provided
        if team_member_ids is not None:
            instance.team_members.set(User.objects.filter(id__in=team_member_ids))
        
        return instance
    
class ReportSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)  
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        source='project',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Report
        fields = [
            'id', 'user', 'project', 'project_id', 
            'week_start', 'week_end', 'status',
            'tasks', 'blockers', 'achievements', 'hours_worked', 'notes',
            'manager_comment', 'version', 'version_history',
            'created_at', 'updated_at' , 'tasks_planned'
        ]
        read_only_fields = ['user', 'version', 'version_history', 'created_at', 'updated_at']