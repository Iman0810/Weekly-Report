# 📊 Weekly Report Generator & Team Dashboard

A full-stack application for team members to submit weekly reports and managers to review/analyze them.

## 🚀 Features

- **Auth** - JWT login/register with role-based access (Team Member / Manager)
- **Reports** - Create, edit, submit, and track weekly reports with tasks, blockers, achievements, hours
- **Workflow** - Draft → Submitted → Needs Correction → Approved with version history
- **Team Dashboard** - Filter by member, status, project, date
- **Projects** - CRUD with team member assignment
- **Users** - Manager can create/delete users
- **Charts** - Status distribution, hours by task type, activity feed
- **UI** - Dark/Light theme toggle, responsive Bootstrap

## 🛠️ Tech Stack

**Backend:** Django 5, Django REST Framework, PostgreSQL, JWT, `uv`
**Frontend:** React 18, Vite, React Router, TanStack Query, Axios, Bootstrap, Recharts

## 🐳 Quick Start with Docker

```bash
git clone <your-repo-url>
cd weekly-report-app
docker-compose up --build -d

Service	URL
Frontend	http://localhost
Backend API	http://localhost:8000/api
Admin	http://localhost:8000/admin
🔧 Manual Setup
Backend
bash

cd backend
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
cp .env.example .env  # Edit with your DB credentials
uv run python manage.py migrate
uv run python manage.py seed_data
uv run python manage.py runserver

Frontend
bash

cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev

Database
bash

docker run --name weekly_report_db \
  -e POSTGRES_DB=weekly_report \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:15-alpine

🔑 Default Credentials
Role	Username	Password
Manager	manager	password123
Team Member	team_member_1	password123
Team Member	team_member_2	password123
📁 Project Structure
text

weekly-report-app/
├── backend/          # Django backend
│   ├── backend_config/
│   ├── reports/      # models, views, serializers
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/         # React frontend
│   ├── src/
│   │   ├── pages/    # All pages
│   │   ├── components/
│   │   ├── context/
│   │   └── api/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md

🔌 API Endpoints
Method	Endpoint	Access
POST	/api/auth/register/	Public
POST	/api/auth/token/	Public
GET	/api/auth/me/	Auth
GET/POST	/api/reports/	Auth
PUT	/api/reports/{id}/	Owner
POST	/api/reports/{id}/submit/	Owner
POST	/api/reports/{id}/review/	Manager
GET	/api/reports/all_reports/	Manager
GET	/api/reports/stats/	Manager
GET/POST	/api/projects/	Auth / Manager
GET	/api/users/	Manager
🤝 License

MIT