from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from reports.models import Project, Report

User = get_user_model()


class RBACBaseTestCase(TestCase):

    def setUp(self):
        # Create a manager
        self.manager = User.objects.create_user(
            username='manager_test',
            password='testpass123',
            role='MANAGER',
        )

        # Create two team members
        self.team_member_1 = User.objects.create_user(
            username='tm1_test',
            password='testpass123',
            role='TEAM_MEMBER',
        )
        self.team_member_2 = User.objects.create_user(
            username='tm2_test',
            password='testpass123',
            role='TEAM_MEMBER',
        )

        # Create a project
        self.project = Project.objects.create(
            name='Test Project',
            description='A test project',
        )
        self.project.team_members.add(self.team_member_1, self.team_member_2)

        # Create reports for each team member
        self.report_tm1 = Report.objects.create(
            user=self.team_member_1,
            project=self.project,
            week_start='2026-09-01',
            week_end='2026-09-07',
            status='DRAFT',
            tasks=[],
            blockers=[],
            achievements=[],
            hours_worked={},
            tasks_planned=[],
        )
        self.report_tm2 = Report.objects.create(
            user=self.team_member_2,
            project=self.project,
            week_start='2026-09-01',
            week_end='2026-09-07',
            status='SUBMITTED',
            tasks=[],
            blockers=[],
            achievements=[],
            hours_worked={},
            tasks_planned=[],
        )

        # API client
        self.client = APIClient()

    def login_as(self, user):
        response = self.client.post('/api/auth/token/', {
            'username': user.username,
            'password': 'testpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


class TeamMemberAccessControlTests(RBACBaseTestCase):

    def test_team_member_sees_only_own_reports(self):

        self.login_as(self.team_member_1)

        response = self.client.get('/api/reports/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reports = response.data.get('results', response.data)
        report_ids = [r['id'] for r in reports]

        # Should see own report
        self.assertIn(self.report_tm1.id, report_ids)
        # Should NOT see other team member's report
        self.assertNotIn(self.report_tm2.id, report_ids)

    def test_team_member_cannot_view_other_report_detail(self):
        self.login_as(self.team_member_1)

        response = self.client.get(f'/api/reports/{self.report_tm2.id}/')

        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_team_member_cannot_update_other_report(self):
        self.login_as(self.team_member_1)

        response = self.client.patch(
            f'/api/reports/{self.report_tm2.id}/',
            {'notes': 'hacked'},
            format='json',
        )

        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

        # Verify no modification happened
        self.report_tm2.refresh_from_db()
        self.assertEqual(self.report_tm2.notes, '')

    def test_team_member_cannot_delete_other_report(self):
        self.login_as(self.team_member_1)

        response = self.client.delete(f'/api/reports/{self.report_tm2.id}/')

        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

        # Verify report still exists
        self.assertTrue(Report.objects.filter(id=self.report_tm2.id).exists())

    def test_team_member_cannot_access_stats_endpoint(self):
    
        self.login_as(self.team_member_1)

        response = self.client.get('/api/reports/stats/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_team_member_cannot_access_all_reports_endpoint(self):
      
        self.login_as(self.team_member_1)

        response = self.client.get('/api/reports/all_reports/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_team_member_cannot_access_user_list(self):
       
        self.login_as(self.team_member_1)

        response = self.client.get('/api/users/')

        # Should either be 403 (forbidden) or return only their own user
        if response.status_code == status.HTTP_200_OK:
            users = response.data.get('results', response.data)
            usernames = [u['username'] for u in users]
            self.assertNotIn(self.team_member_2.username, usernames)
            self.assertNotIn(self.manager.username, usernames)

    def test_team_member_cannot_review_reports(self):
        
        self.login_as(self.team_member_1)

        response = self.client.post(f'/api/reports/{self.report_tm2.id}/review/', {
            'action': 'approve',
            'comment': '',
        })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ManagerAccessControlTests(RBACBaseTestCase):
  

    def test_manager_sees_all_reports(self):
      
        self.login_as(self.manager)

        response = self.client.get('/api/reports/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reports = response.data.get('results', response.data)
        report_ids = [r['id'] for r in reports]

        self.assertIn(self.report_tm1.id, report_ids)
        self.assertIn(self.report_tm2.id, report_ids)

    def test_manager_can_view_any_report_detail(self):
      
        self.login_as(self.manager)

        response = self.client.get(f'/api/reports/{self.report_tm2.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.report_tm2.id)

    def test_manager_can_access_stats_endpoint(self):
       
        self.login_as(self.manager)

        response = self.client.get('/api/reports/stats/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_reports', response.data)

    def test_manager_can_access_all_reports_endpoint(self):
      
        self.login_as(self.manager)

        response = self.client.get('/api/reports/all_reports/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should be a list, not paginated
        self.assertIsInstance(response.data, list)

    def test_manager_can_review_submitted_report(self):
      
        self.login_as(self.manager)

        response = self.client.post(f'/api/reports/{self.report_tm2.id}/review/', {
            'action': 'approve',
            'comment': '',
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.report_tm2.refresh_from_db()
        self.assertEqual(self.report_tm2.status, 'APPROVED')

    def test_manager_can_request_changes(self):
     
        self.login_as(self.manager)

        response = self.client.post(f'/api/reports/{self.report_tm2.id}/review/', {
            'action': 'request_changes',
            'comment': 'Please add more detail to blockers.',
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.report_tm2.refresh_from_db()
        self.assertEqual(self.report_tm2.status, 'NEEDS_CORRECTION')
        self.assertEqual(self.report_tm2.manager_comment, 'Please add more detail to blockers.')


class AuthenticationTests(RBACBaseTestCase):
   

    def test_unauthenticated_cannot_list_reports(self):
   
        response = self.client.get('/api/reports/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_cannot_view_report_detail(self):

        response = self.client.get(f'/api/reports/{self.report_tm1.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_cannot_access_stats(self):
 
        response = self.client.get('/api/reports/stats/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class WorkflowTests(RBACBaseTestCase):

    def test_team_member_can_submit_own_draft(self):

        self.login_as(self.team_member_1)

        response = self.client.post(f'/api/reports/{self.report_tm1.id}/submit/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.report_tm1.refresh_from_db()
        self.assertEqual(self.report_tm1.status, 'SUBMITTED')

    def test_team_member_cannot_submit_already_submitted(self):
        self.login_as(self.team_member_2)

        response = self.client.post(f'/api/reports/{self.report_tm2.id}/submit/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_full_review_cycle(self):
        # 1. Team member 1 submits their draft
        self.login_as(self.team_member_1)
        self.client.post(f'/api/reports/{self.report_tm1.id}/submit/')
        self.report_tm1.refresh_from_db()
        self.assertEqual(self.report_tm1.status, 'SUBMITTED')

        # 2. Manager requests changes
        self.login_as(self.manager)
        self.client.post(f'/api/reports/{self.report_tm1.id}/review/', {
            'action': 'request_changes',
            'comment': 'Needs more detail.',
        })
        self.report_tm1.refresh_from_db()
        self.assertEqual(self.report_tm1.status, 'NEEDS_CORRECTION')
        self.assertEqual(self.report_tm1.version, 2)
        self.assertEqual(len(self.report_tm1.version_history), 1)

        # 3. Team member 1 edits and resubmits
        self.login_as(self.team_member_1)
        # Edit: change status back to DRAFT
        self.client.patch(
            f'/api/reports/{self.report_tm1.id}/',
            {'status': 'DRAFT'},
            format='json',
        )
        self.client.post(f'/api/reports/{self.report_tm1.id}/submit/')
        self.report_tm1.refresh_from_db()
        self.assertEqual(self.report_tm1.status, 'SUBMITTED')

        # 4. Manager approves
        self.login_as(self.manager)
        self.client.post(f'/api/reports/{self.report_tm1.id}/review/', {
            'action': 'approve',
            'comment': '',
        })
        self.report_tm1.refresh_from_db()
        self.assertEqual(self.report_tm1.status, 'APPROVED')