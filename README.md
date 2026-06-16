# Clinic Management System

A full-stack clinic management system with **FastAPI** (backend) and **React + TypeScript** (frontend). It covers online appointment booking, electronic medical records (EMR), prescriptions, role-based access control (Patient / Doctor / Clinic Staff / Admin), and an AI chatbot powered by Google Gemini.

> **Version:** 0.7.0

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, SQLAlchemy, Pydantic, JWT (python-jose), passlib/bcrypt |
| Database | PostgreSQL 17 |
| Cache | Redis 7 |
| Frontend | React 19 + TypeScript, MUI, React Router, Axios |
| AI | Google Gemini (`gemini-2.5-flash`) |
| Infra | Docker Compose |

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Docker Desktop | Latest | `docker --version` |
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |

---

## 1. Start Infrastructure (Docker)

PostgreSQL 17 and Redis 7 are defined in `docker-compose.yml`. From the project root:

```bash
docker compose up -d
docker compose ps        # both containers should be "running (healthy)"
```

| Container | Port (host) |
|-----------|-------------|
| clinic-postgres | 5432 |
| clinic-redis | 6379 |

> Tables are created automatically the first time the backend starts.

---

## 2. Backend Setup

```bash
cd backend

# Create the env file (skip if backend/.env already exists)
cp .env.example .env          # Windows: copy .env.example .env

# Install dependencies
pip install -r ../requirements.txt
```

**`backend/.env` — required values** (must match `docker-compose.yml`):

```env
# Database & cache
DATABASE_URL=postgresql://clinic_user:clinic_password@localhost:5432/clinic_management
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=change_me_to_a_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google Gemini (required for chatbot) — get a key at
# https://aistudio.google.com/app/apikey  (must start with "AIza...")
GOOGLE_API_KEY=AIza...your_real_key...
GEMINI_MODEL=gemini-2.5-flash

# Frontend origin (CORS)
FRONTEND_URL=http://localhost:3000
```

Start the server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API root: <http://localhost:8000> → returns `{"version": "v0.7.0"}`
- Swagger docs: <http://localhost:8000/docs>

---

## 3. Seed Initial Data

Creates 1 admin, 1 hospital, 2 doctors, 2 staff, and 10 patients. Run from `backend/`:

```bash
python -m app.create_initial_admin
```

---

## 4. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm start
```

Web app: <http://localhost:3000>

---

## Test Accounts

> Login uses the **email** as the username field.

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `chienbk@gmail.com` | `Fcchien@12` |
| **Doctor** | `dr.smith@clinic.com` | `doctor123` |
| **Doctor** | `dr.johnson@clinic.com` | `doctor123` |
| **Staff** | `mary.nurse@clinic.com` | `staff123` |
| **Staff** | `james.reception@clinic.com` | `staff123` |
| **Patient** | `alice.wilson@email.com` | `patient123` |

---

## Roles & Permissions (summary)

| Capability | Patient | Doctor | Staff | Admin |
|------------|:------:|:------:|:-----:|:-----:|
| Book appointment | ✅ (own) | — | ✅ (for patient) | ✅ |
| Confirm appointment | — | — | ✅ | ✅ |
| Accept / Complete appointment | — | ✅ | ✅ | ✅ |
| Create / edit medical report (EMR) | — | ✅ (own) | — | ✅ |
| Create / edit prescription | — | ✅ | — | ✅ |
| View medical reports | own | own | all | all |
| Create patient profile | — | — | ✅ | ✅ |
| Manage OTC medications | — | — | ✅ | ✅ |
| Manage users / doctors / staff | — | — | — | ✅ |

---

## Feature Walkthrough by Role

- **Patient** — Book appointments (multi-step), view "My appointments" calendar (cancel / reschedule), prescriptions, medical history (list & timeline view, export/print), AI health assistant.
- **Doctor** — Personal schedule, patient search, create EMR (vitals, diagnosis, prescriptions), manage & export medical reports.
- **Clinic Staff** — Schedule appointments for patients, check-in / complete / cancel, billing (local prototype), patient registration & search.
- **Admin** — User management (create/edit/delete with role), reports & analytics, schedule settings, system logs.

---

## API Quick Reference

Open <http://localhost:8000/docs> for interactive docs. Authenticate via **POST `/auth/token`** (username = email), copy `access_token`, then click **Authorize**.

| Endpoint | Method | Role |
|----------|--------|------|
| `/auth/register` | POST | Public (always creates PATIENT) |
| `/auth/token` | POST | Public — login |
| `/patients/search` | POST | Any auth |
| `/appointments/book` | POST | Any auth |
| `/appointments/{id}/confirm` | POST | Staff/Admin |
| `/appointments/{id}/complete` | POST | Doctor/Staff/Admin |
| `/medical_reports/` | POST | Doctor |
| `/prescriptions/` | POST | Doctor |
| `/chat/public` · `/chat/patient` · `/chat/send` | POST | Public / Patient / Doctor·Staff |

---

## Troubleshooting

**Backend can't connect to the database**
- Confirm containers are healthy: `docker compose ps`
- Ensure `DATABASE_URL` in `.env` matches `docker-compose.yml` (port **5432**, user `clinic_user`)

**`API_KEY_INVALID` / chatbot 500 error**
- `GOOGLE_API_KEY` is invalid. A valid Gemini key starts with `AIza...` (from <https://aistudio.google.com/app/apikey>) — keys like `AQ.xxx` are **not** Gemini keys.

**Login fails with correct credentials**
- The form sends the `username` field but expects the **email** as the value.

**Frontend "Network Error" / blank page**
- Verify the backend is running on port 8000 and `FRONTEND_URL=http://localhost:3000` is set (CORS).
- Clear `localStorage` and re-login if you see 401 errors.

**Reset everything (wipes data)**
```bash
docker compose down -v
docker compose up -d
cd backend && python -m app.create_initial_admin
```

---

*For the detailed design report, see [archive.md](archive.md) and `Clinic Management System.docx`.*
