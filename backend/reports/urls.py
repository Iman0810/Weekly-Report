from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ReportViewSet, ProjectViewSet, UserRegistrationView, UserDetailView, UserViewSet

router = DefaultRouter()
router.register('reports', ReportViewSet, basename='report')
router.register('projects', ProjectViewSet, basename='project')
router.register('users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/me/', UserDetailView.as_view(), name='user_detail'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]