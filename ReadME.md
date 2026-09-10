# 📊 Weekly Report Generator & Team Dashboard

A full-stack application where team members submit structured weekly reports and managers review, approve, or request changes across the whole team.

---

## 🚀 Quick Start (Docker — Recommended)

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

**Step 1 — Clone the repo:**

```bash
git clone https://github.com/Iman0810/Weekly-Report.git
cd weekly-report-app
```

**Step 2 — Create your environment file:**

```bash
cp .env.example .env
```

**Step 3 — Build and start everything:**

```bash
docker compose up --build -d
```

**Step 4 — Access the application:**

| Service | URL |
| :--- | :--- |
| Frontend | http://localhost |
| Backend API | http://localhost:8000/api |
| Admin Panel | http://localhost:8000/admin |

**Stop the stack:**

```bash
docker compose down
```

**Reset everything (delete database):**

```bash
docker compose down -v
```

The database is automatically migrated and seeded with test data on first startup.

---

## 🔑 Default Credentials

After the containers start, log in with any of these:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Manager** | `manager` | `password123` |
| Team Member | `team_member_1` | `password123` |
| Team Member | `team_member_2` | `password123` |
| Team Member | `team_member_3` | `password123` |
| Team Member | `team_member_4` | `password123` |
| Team Member | `team_member_5` | `password123` |

---

## ✨ Features

### Core

- **Authentication** — JWT login/register with role-based access (Team Member / Manager)
- **Weekly Reports** — Create, edit, submit, and track reports with:
  - Task-level table (name, priority, planned % vs actual %, status, time planned vs spent, output)
  - Tasks planned for next week
  - Blockers & achievements (with key-item flagging)
  - Hours worked by task type
  - Optional notes
- **Review Workflow** — Draft → Submitted → Needs Correction → Approved, with version history
- **Report History** — Organized by week with status badges

### Manager Dashboard

- View all team reports (with drafts hidden)
- Filter by team member, project, status, and date range
- Track submission compliance (submitted / in progress / not started)
- Approve or Request Changes with feedback

### Admin Features

- Project CRUD with team member assignment
- User management (create/delete)
- Django admin panel at `/admin`

### UI

- Visual insights (charts for status distribution & hours by task type)
- Recent activity feed
- Dark/Light theme toggle
- Responsive Bootstrap layout

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Django 5 · Django REST Framework · SimpleJWT |
| **Database** | PostgreSQL 15 |
| **Frontend** | React 18 · Vite · React Router · TanStack Query |
| **UI** | Bootstrap 5 · Recharts |
| **HTTP Client** | Axios |
| **Package Manager** | `uv` (Python) · `npm` (JS) |
| **Containers** | Docker · Docker Compose · Nginx |

---

## 🔧 Manual Setup (Without Docker)

**Prerequisites:** Python 3.11+, Node.js 18+, PostgreSQL 15+, `uv` (`pip install uv`)

### 1. Database

Start a PostgreSQL instance (Docker or local):

```bash
docker run --name weekly_report_db \
  -e POSTGRES_DB=weekly_report \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:15-alpine
```

### 2. Backend

```bash
cd backend

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate        # Linux/Mac
# or: .venv\Scripts\activate     # Windows
uv pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env if your DB credentials differ

# Run migrations and seed data
uv run python manage.py migrate
uv run python manage.py seed_data

# Start the server
uv run python manage.py runserver
```

Backend runs at: **http://localhost:8000**

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Point the frontend to the backend API
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Start the dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 📁 Project Structure

```
weekly-report-app/
├── backend/                      # Django backend
│   ├── backend_config/           # Settings, URLs, WSGI
│   ├── reports/                  # Main app (models, views, serializers)
│   │   ├── migrations/
│   │   ├── management/commands/  # seed_data command
│   │   ├── admin.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── api/                  # Axios client
│   │   ├── components/           # Reusable components (Navbar, Charts, etc.)
│   │   ├── context/              # Auth context
│   │   └── pages/                # All page components
│   ├── Dockerfile
│   ├── nginx.conf                # Nginx config for production
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Access |
| :--- | :--- | :--- |
| POST | `/api/auth/register/` | Public |
| POST | `/api/auth/token/` | Public |
| POST | `/api/auth/token/refresh/` | Public |
| GET | `/api/auth/me/` | Authenticated |

### Reports

| Method | Endpoint | Access |
| :--- | :--- | :--- |
| GET | `/api/reports/` | Authenticated |
| POST | `/api/reports/` | Team Member |
| GET | `/api/reports/{id}/` | Owner / Manager |
| PUT | `/api/reports/{id}/` | Owner |
| POST | `/api/reports/{id}/submit/` | Owner |
| POST | `/api/reports/{id}/review/` | Manager |
| GET | `/api/reports/all_reports/` | Manager |
| GET | `/api/reports/stats/` | Manager |

### Projects

| Method | Endpoint | Access |
| :--- | :--- | :--- |
| GET | `/api/projects/` | Authenticated |
| POST | `/api/projects/` | Manager |
| PUT | `/api/projects/{id}/` | Manager |
| DELETE | `/api/projects/{id}/` | Manager |

### Users

| Method | Endpoint | Access |
| :--- | :--- | :--- |
| GET | `/api/users/` | Manager |
| DELETE | `/api/users/{id}/` | Manager |

---

## 🧪 Testing the Workflow

1. Log in as `team_member_1` → create a report → **Submit**
2. Log in as `manager` → open Team Dashboard → **Review** the report → **Request Changes** with a comment
3. Log in as `team_member_1` → see the feedback → **Edit** and **Resubmit**
4. Log in as `manager` → **Approve**

---

## 🤝 License

MIT