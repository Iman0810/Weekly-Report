from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User, Project, Report
from .serializers import UserSerializer, UserRegistrationSerializer, ProjectSerializer, ReportSerializer
from datetime import datetime, timedelta

class UserRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

class UserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user

        if user.role == 'MANAGER':
            return Project.objects.all()
        
        user_projects = Project.objects.filter(team_members=user)
        if user_projects.exists():
            return user_projects
  
        return Project.objects.none() 

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Report.objects.all().order_by('-created_at')
        
        if user.role != 'MANAGER':
            queryset = queryset.filter(user=user)
        
        user_id = self.request.query_params.get('user_id')
        if user_id and user.role == 'MANAGER':
            queryset = queryset.filter(user_id=user_id)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        report = self.get_object()
        
        if report.user != request.user and request.user.role != 'MANAGER':
            return Response(
                {'error': 'You can only submit your own reports'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if report.status != 'DRAFT':
            return Response(
                {'error': f'Only draft reports can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        report.status = 'SUBMITTED'
        report.save()
        return Response({'status': 'submitted'})
    
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        if request.user.role != 'MANAGER':
            return Response(
                {'error': 'Only managers can review reports'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        report = self.get_object()
        action = request.data.get('action')
        comment = request.data.get('comment', '')
        
        if report.status != 'SUBMITTED':
            return Response(
                {'error': 'Only submitted reports can be reviewed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if action == 'approve':
            report.status = 'APPROVED'
            report.save()
            return Response({'status': 'approved'})
        
        elif action == 'request_changes':
            history_entry = {
                'version': report.version,
                'tasks': report.tasks,
                'blockers': report.blockers,
                'achievements': report.achievements,
                'hours_worked': report.hours_worked,
                'notes': report.notes,
                'comment': comment,
                'timestamp': report.updated_at.isoformat()
            }
            report.version_history.append(history_entry)
            report.version += 1
            report.status = 'NEEDS_CORRECTION'
            report.manager_comment = comment
            report.save()
            return Response({'status': 'needs_correction'})
        
        return Response(
            {'error': 'Invalid action. Use "approve" or "request_changes"'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def all_reports(self, request):
        """Get all reports without pagination (for managers)"""
        if request.user.role != 'MANAGER':
            return Response(
                {'error': 'Only managers can view all reports'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = Report.objects.all().order_by('-created_at')
        
        # Apply filters
        user_id = request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        project_id = request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        week_start = request.query_params.get('week_start')
        if week_start:
            queryset = queryset.filter(week_start=week_start)
        
        week_end = request.query_params.get('week_end')
        if week_end:
            queryset = queryset.filter(week_end=week_end)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        if request.user.role != 'MANAGER':
            return Response(
                {'error': 'Only managers can view stats'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        team_members = User.objects.filter(role='TEAM_MEMBER')
        total_members = team_members.count()
        
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        # Count open blockers across all reports
        open_blockers = 0
        for report in Report.objects.all():
            if report.blockers:
                for blocker in report.blockers:
                    if blocker.get('is_key', False):
                        open_blockers += 1
        
        # Calculate pending and not_started users
        submitted_users_this_week = Report.objects.filter(
            status__in=['SUBMITTED', 'APPROVED'],
            week_start__gte=week_start,
            week_end__lte=week_end
        ).values_list('user_id', flat=True).distinct()
        submitted_count_this_week = len(set(submitted_users_this_week))
        
        # Pending = has draft but not submitted for this week
        pending_users = 0
        for member in team_members:
            has_draft = Report.objects.filter(
                user=member,
                status='DRAFT',
                week_start__gte=week_start,
                week_end__lte=week_end
            ).exists()
            has_submitted = Report.objects.filter(
                user=member,
                status__in=['SUBMITTED', 'APPROVED'],
                week_start__gte=week_start,
                week_end__lte=week_end
            ).exists()
            
            if has_draft and not has_submitted:
                pending_users += 1
        
        not_started_users = total_members - submitted_count_this_week - pending_users
        
        compliance_rate = round((submitted_count_this_week / total_members * 100), 1) if total_members > 0 else 0
        
        return Response({
            'total_reports': Report.objects.count(),
            'submitted': Report.objects.filter(status='SUBMITTED').count(),
            'needs_correction': Report.objects.filter(status='NEEDS_CORRECTION').count(),
            'approved': Report.objects.filter(status='APPROVED').count(),
            'draft': Report.objects.filter(status='DRAFT').count(),
            'submitted_this_week': submitted_count_this_week,
            'total_members': total_members,
            'compliance_rate': compliance_rate,
            'open_blockers': open_blockers,
            'pending_users': pending_users,
            'not_started_users': not_started_users,
            'week_start': week_start.isoformat(),
            'week_end': week_end.isoformat(),
        })

class UserViewSet(viewsets.ModelViewSet):  
    """
    ViewSet for managing users (only for managers)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        if self.request.user.role == 'MANAGER':
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'MANAGER':
            return Response(
                {'error': 'Only managers can delete users'},
                status=status.HTTP_403_FORBIDDEN
            )
        user = self.get_object()
        if user.id == request.user.id:
            return Response(
                {'error': 'You cannot delete yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)