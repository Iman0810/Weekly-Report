from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from reports.models import Project, Report
from datetime import datetime, timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed database with test data'
    
    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding database with test data...')
        
        # Create users
        users = []
        for i in range(1, 6):
            user, created = User.objects.get_or_create(
                username=f'team_member_{i}',
                defaults={
                    'email': f'team{i}@example.com',
                    'role': 'TEAM_MEMBER',
                    'first_name': f'Team',
                    'last_name': f'Member {i}'
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'✅ Created user: {user.username}')
            users.append(user)
        
        # Create manager
        manager, created = User.objects.get_or_create(
            username='manager',
            defaults={
                'email': 'manager@example.com',
                'role': 'MANAGER',
                'first_name': 'Manager',
                'last_name': 'User'
            }
        )
        if created:
            manager.set_password('password123')
            manager.save()
            self.stdout.write('✅ Created manager user')
        
        # Create projects
        projects = []
        project_names = ['Client A', 'Internal Tooling', 'R&D', 'Marketing', 'Support']
        for name in project_names:
            project, created = Project.objects.get_or_create(
                name=name,
                defaults={'description': f'Project for {name}'}
            )
            if created:
                self.stdout.write(f'✅ Created project: {name}')
            projects.append(project)
        
        # Create reports for each user
        statuses = ['DRAFT', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED']
        weeks = []
        for i in range(4):
            week_start = datetime.now().date() - timedelta(weeks=i+1)
            weeks.append(week_start)
        
        report_count = 0
        for user in users:
            for idx, week_start in enumerate(weeks):
                week_end = week_start + timedelta(days=6)
                
                # Assign different statuses to make it interesting
                if idx == 0:
                    status = 'SUBMITTED'
                elif idx == 1:
                    status = 'NEEDS_CORRECTION'
                elif idx == 2:
                    status = 'APPROVED'
                else:
                    status = random.choice(statuses)
                
                report, created = Report.objects.get_or_create(
                    user=user,
                    week_start=week_start,
                    defaults={
                        'week_end': week_end,
                        'project': random.choice(projects),
                        'status': status,
                        'tasks': [
                            {
                                'name': f'Task {j+1}',
                                'priority': random.choice(['HIGH', 'MEDIUM', 'LOW']),
                                'planned_percent': random.randint(80, 100),
                                'actual_percent': random.randint(60, 100),
                                'status': random.choice(['COMPLETED', 'IN_PROGRESS', 'BLOCKED']),
                                'time_planned': random.randint(2, 8),
                                'time_spent': random.randint(2, 10),
                                'output': f'Deliverable for task {j+1}'
                            } for j in range(random.randint(2, 4))
                        ],
                        'blockers': [
                            {'description': 'Waiting for dependencies', 'is_key': True}
                        ] if random.choice([True, False]) else [],
                        'achievements': [
                            {'description': f'Completed {random.randint(2, 4)} tasks', 'is_key': True}
                        ],
                        'hours_worked': {
                            'Development': random.randint(15, 30),
                            'Testing': random.randint(5, 10),
                            'Meetings': random.randint(2, 5),
                            'Documentation': random.randint(2, 8)
                        },
                        'notes': f'Weekly report for week starting {week_start}',
                        'version': 1,
                        'version_history': []
                    }
                )
                if created:
                    report_count += 1
                    self.stdout.write(f'✅ Created report for {user.username} - week {week_start}')
        
        self.stdout.write(self.style.SUCCESS(f'🎉 Database seeded successfully! Created {report_count} reports.'))