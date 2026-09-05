from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ReportViewSet, ProjectViewSet, UserRegistrationView, UserDetailView

router = DefaultRouter()
router.register('reports', ReportViewSet)
router.register('projects', ProjectViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/me/', UserDetailView.as_view(), name='user_detail'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]