from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User, Project, Report
from .serializers import UserSerializer, UserRegistrationSerializer, ProjectSerializer, ReportSerializer

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
        
        # Managers see all projects
        if user.role == 'MANAGER':
            return Project.objects.all()
        
        # Team members see projects they're assigned to OR all projects (if none assigned)
        user_projects = Project.objects.filter(team_members=user)
        if user_projects.exists():
            return user_projects
        # If no projects assigned, show all projects (or empty)
        return Project.objects.none()  # Or return Project.objects.all() if you prefer
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
    def stats(self, request):
        if request.user.role != 'MANAGER':
            return Response(
                {'error': 'Only managers can view stats'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response({
            'total_reports': Report.objects.count(),
            'submitted': Report.objects.filter(status='SUBMITTED').count(),
            'needs_correction': Report.objects.filter(status='NEEDS_CORRECTION').count(),
            'approved': Report.objects.filter(status='APPROVED').count(),
            'draft': Report.objects.filter(status='DRAFT').count(),
        })

class UserViewSet(viewsets.ModelViewSet):  # Change from ReadOnlyModelViewSet to ModelViewSet
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
        # Only managers can delete users
        if request.user.role != 'MANAGER':
            return Response(
                {'error': 'Only managers can delete users'},
                status=status.HTTP_403_FORBIDDEN
            )
        # Prevent deleting self
        user = self.get_object()
        if user.id == request.user.id:
            return Response(
                {'error': 'You cannot delete yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)