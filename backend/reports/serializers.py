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
    class Meta:
        model = Project
        fields = '__all__'

class ReportSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ['user', 'version', 'version_history', 'created_at', 'updated_at']