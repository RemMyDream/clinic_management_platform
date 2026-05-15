# Clinic Management System — Sprint Progress Tracker

> **Version:** 0.7.0 → 1.0.0
> **Sprint Duration:** 2 weeks — May 7 – May 20, 2026
> **Team Size:** 4 members
> **Status last updated:** 2026-05-15

---

## Project Overview

A web-based healthcare application built with **FastAPI** + **React/TypeScript** + **PostgreSQL + Redis**.

Supports 4 user roles: `PATIENT`, `DOCTOR`, `CLINIC_STAFF`, `ADMIN`.

### Current State (v0.7.0 baseline — what is DONE)
- ✅ Layered architecture: Router → Service → Repository → Model (all 10 domains)
- ✅ Full CRUD: Users, Patients, Doctors, Staff, Hospitals, Appointments, Medical Reports, Prescriptions, OTC Medications, Chat
- ✅ JWT authentication + Role-Based Access Control (RBAC)
- ✅ Patient advanced search (name, phone, ID, insurance, gender, age range)
- ✅ Appointment lifecycle: book → reschedule → cancel → complete
- ✅ AI chatbot (Gemini) — public, patient, staff/doctor modes
- ✅ Password reset (token-based)
- ✅ Docker Compose: Postgres 17 + Redis 7
- ✅ Request logging + global error handler middleware

### What Remains (sprint targets)
| Area | Gap |
|---|---|
| Security | CORS `*`, no token refresh, no server-side logout |
| Infrastructure | No Alembic migrations, crud.py still exists as dead facade |
| AI | Advanced AI endpoints (symptom analysis, disease prediction, summarization) |
| Email | Appointment reminders, medical report delivery |
| Billing | Frontend exists but zero backend support |
| Check-In | Frontend exists but no dedicated backend API |
| Analytics | Frontend exists but no analytics API |
| Doctor Schedule | Frontend exists but no dedicated schedule model |
| Testing | No unit tests, no E2E tests |

---

## Team Assignment

| Member | Focus Area | Domain Ownership |
|---|---|---|
| **M1** | Security & Infrastructure | CORS, JWT refresh/logout, Alembic, crud.py removal, email service |
| **M2** | Clinical Backend | Billing API, Check-In API, Doctor Schedule API, Analytics API, System Logs API |
| **M3** | Frontend Integration | Billing UI, Check-In UI, Analytics UI, Logs UI, Schedule Settings UI |
| **M4** | AI & Quality | AI advanced endpoints, AI frontend, backend tests, frontend tests |

---

## 2-Week Execution Plan

### Week 1 — May 7–13 | Backend Foundation & Critical Features

| Day | M1 | M2 | M3 | M4 |
|---|---|---|---|---|
| Wed May 7 | Set up Alembic | Design Billing model | Audit all frontend ↔ backend gaps | Set up pytest, write test fixtures |
| Thu May 8 | Alembic initial migration | Billing API (Invoice CRUD) | Billing UI → connect to API | AI: analyzeSymptoms endpoint |
| Fri May 9 | CORS restriction + env config | Check-In/Out dedicated API | Check-In UI → connect to API | AI: predictDisease endpoint |
| Mon May 12 | JWT refresh token endpoint | Doctor weekly schedule model + API | Doctor Schedule UI → connect to API | AI: recommendTreatment endpoint |
| Tue May 13 | Server-side logout + token blacklist | Analytics API (user/appt/report stats) | Analytics dashboard → connect to API | AI: summarizeMedicalRecord endpoint |

> **Week 1 milestone (May 13):** All backend APIs implemented. Frontend connected for billing/check-in/analytics/schedule. All 4 AI endpoints live. Alembic running.

---

### Week 2 — May 14–20 | Integration, Email, Testing & Polish

| Day | M1 | M2 | M3 | M4 |
|---|---|---|---|---|
| Wed May 14 | Email service (SMTP) + appointment reminder | System logs backend API | System Logs UI → connect to API | Backend unit tests: auth, users, patients |
| Thu May 15 | Email: medical report delivery to patient | Redis caching on list endpoints | Schedule Settings UI → backend config API | Backend tests: appointments, medical reports |
| Fri May 16 | Remove crud.py — migrate remaining logic to services | Backend integration testing | Frontend E2E: patient flow (book → view → cancel) | Frontend component tests: dashboards, forms |
| Mon May 19 | Security audit (OWASP checklist) | Fix integration bugs from May 16 | Frontend E2E: doctor flow (schedule → create EMR) | Frontend tests: AI chatbot, prescriptions |
| Tue May 20 | Final review + deployment prep | API documentation review (Swagger) | Final UI pass + responsive checks | Test coverage report + bug fixes |

> **Week 2 milestone (May 20):** All features integrated, email working, tests passing, ready for deployment.

---

## Module List & Status

| # | Module | Backend | Frontend | Priority | Complexity |
|---|---|---|---|---|---|
| 1 | Auth & JWT | ✅ Done | ✅ Done | Critical | Medium |
| 2 | User Management | ✅ Done | ✅ Done | Critical | Low |
| 3 | Patient Management | ✅ Done | ✅ Done | Critical | High |
| 4 | Doctor Management | ✅ Done | ✅ Done | High | Medium |
| 5 | Appointment Lifecycle | ✅ Done | ✅ Done | Critical | High |
| 6 | Medical Records (EMR) | ✅ Done | ✅ Done | Critical | High |
| 7 | Prescriptions | ✅ Done | ⚠️ Partial | High | Medium |
| 8 | OTC Medications | ✅ Done | ⚠️ Partial | Medium | Low |
| 9 | Staff Management | ✅ Done | ⚠️ Partial | Medium | Low |
| 10 | AI Chatbot (basic) | ✅ Done | ✅ Done | High | Medium |
| 11 | AI Advanced Endpoints | ❌ Missing | ❌ Missing | High | High |
| 12 | Email Notifications | ❌ Missing | N/A | High | Medium |
| 13 | Billing / Payments | ❌ Missing | ⚠️ UI only | Medium | High |
| 14 | Check-In / Out | ❌ Missing | ⚠️ UI only | Medium | Medium |
| 15 | Doctor Weekly Schedule | ❌ Missing | ⚠️ UI only | Medium | Medium |
| 16 | Analytics API | ❌ Missing | ⚠️ UI only | Medium | Medium |
| 17 | System Logs API | ❌ Missing | ⚠️ UI only | Low | Low |
| 18 | JWT Refresh + Logout | ❌ Missing | ⚠️ Partial | Critical | Low |
| 19 | CORS Restriction | ❌ Missing | N/A | Critical | Low |
| 20 | Alembic Migrations | ❌ Missing | N/A | Critical | Medium |
| 21 | Redis Caching | ⚠️ Infra ready | N/A | Medium | Medium |
| 22 | Test Suite | ❌ Missing | ❌ Missing | High | High |

---

## Detailed Task Breakdown

---

### M1 — Security & Infrastructure

**Assigned modules:** Security hardening, Alembic, Email service, crud.py removal

#### Week 1 Tasks

- [ ] **[BE] Set up Alembic** `PRIORITY: CRITICAL`
  - Install alembic, create `backend/alembic.ini` and `backend/alembic/env.py`
  - Generate initial migration from current SQLAlchemy models
  - Document: `alembic upgrade head` in README
  - _Deadline:_ May 8

- [x] **[BE] Restrict CORS origin** `PRIORITY: CRITICAL` ✅ Done May 15
  - Changed `allow_origins=["*"]` → `[settings.FRONTEND_URL]` in `main.py`
  - Enabled `allow_credentials=True`
  - `FRONTEND_URL` already configured in `config.py`
  - _Deadline:_ May 9

- [ ] **[BE] JWT refresh token endpoint** `PRIORITY: CRITICAL`
  - Add `POST /auth/refresh` — accepts refresh token, returns new access token
  - Store refresh token in `UserRepository` or Redis (TTL 7 days)
  - Update `AuthService.login()` to return both access + refresh tokens
  - Update `dependencies.py` `TokenData` schema to include refresh token
  - _Deadline:_ May 12
  - _Dependency:_ Alembic (if storing refresh tokens in DB)

- [ ] **[BE] Server-side logout + token blacklist** `PRIORITY: HIGH`
  - Add `POST /auth/logout` — blacklists current access token in Redis (TTL = remaining token lifetime)
  - Update `get_current_user` dependency to check Redis blacklist before accepting token
  - _Deadline:_ May 13
  - _Dependency:_ Redis is already configured in `cache.py`

#### Week 2 Tasks

- [ ] **[BE] Email service** `PRIORITY: HIGH`
  - Create `backend/app/services/email_service.py`
  - Implement: `send_email(to, subject, body)` via SMTP (settings from config.py already has MAIL_* vars)
  - Implement: `send_appointment_reminder(appointment)` — triggered 24h before appointment
  - Implement: `send_medical_report(patient_email, report)` — PDF/text attachment
  - Fix `POST /password/forgot-password` to actually send email (currently returns placeholder)
  - _Deadline:_ May 15

- [ ] **[BE] Remove crud.py** `PRIORITY: MEDIUM`
  - Move `create_user` business logic (auto-create patient/doctor/staff profile) → `UserService`
  - Move `get_patient_search_result` formatter → `PatientService`
  - Update `auth_service.py`, `user_service.py`, `patient_service.py`, `create_initial_admin.py` to import from services/repositories directly
  - Delete `crud.py`
  - _Deadline:_ May 16

- [ ] **[SEC] Security audit** `PRIORITY: HIGH`
  - Verify no hardcoded credentials in source
  - Verify all destructive endpoints require admin role
  - Verify JWT expiry is enforced
  - Check for SQL injection risks (SQLAlchemy ORM protects, but verify raw queries if any)
  - Rate limit AI endpoints (add slowapi or similar)
  - _Deadline:_ May 19

---

### M2 — Clinical Backend

**Assigned modules:** Billing, Check-In/Out, Doctor Schedule, Analytics, System Logs

#### Week 1 Tasks

- [ ] **[BE] Billing model + API** `PRIORITY: MEDIUM`
  - Create `backend/app/models/invoice.py`: `Invoice(invoice_id, patient_id, appointment_id, total_amount, tax, discount, status [PENDING/PAID/CANCELLED], created_at)`
  - Create `backend/app/models/invoice_item.py`: `InvoiceItem(item_id, invoice_id, description, unit_price, quantity)`
  - Create repository, service, router at `/billing`
  - Endpoints: `POST /billing/`, `GET /billing/`, `GET /billing/{id}`, `PUT /billing/{id}`, `POST /billing/{id}/pay`
  - _Deadline:_ May 9
  - _Dependency:_ Alembic migration (M1)

- [ ] **[BE] Check-In/Out dedicated API** `PRIORITY: MEDIUM`
  - Add `checked_in_at` (TIMESTAMP, nullable) and `checked_out_at` (TIMESTAMP, nullable) to `Appointment` model
  - Create Alembic migration for these columns
  - Add endpoints: `POST /appointments/{id}/check-in`, `POST /appointments/{id}/check-out`
  - Return appointment with check-in/out timestamps in response schema
  - _Deadline:_ May 9
  - _Dependency:_ Alembic migration (M1)

- [ ] **[BE] Doctor weekly schedule model + API** `PRIORITY: MEDIUM`
  - Create `backend/app/models/doctor_schedule.py`: `DoctorSchedule(schedule_id, doctor_id, day_of_week [0-6], start_time, end_time, max_appointments, is_active)`
  - Create repository + service + router at `/doctors/{doctor_id}/schedule`
  - Endpoints: `GET /doctors/{id}/schedule`, `PUT /doctors/{id}/schedule` (bulk upsert)
  - Use schedule data to improve `GET /appointments/available` slot calculation
  - _Deadline:_ May 13

- [ ] **[BE] Analytics API** `PRIORITY: MEDIUM`
  - Create `backend/app/routers/analytics.py`
  - Endpoints:
    - `GET /analytics/summary` → `{total_users, total_patients, total_doctors, total_staff, total_appointments, total_reports}`
    - `GET /analytics/appointments?period=week|month|year` → status breakdown + trend
    - `GET /analytics/users?period=week|month|year` → registration trend
    - `GET /analytics/revenue?period=week|month|year` → billing stats
  - Use Redis caching (TTL 5 min) from `cache.py`
  - _Deadline:_ May 13

#### Week 2 Tasks

- [ ] **[BE] System logs backend API** `PRIORITY: LOW`
  - Create `backend/app/models/system_log.py`: `SystemLog(log_id, level [INFO/WARN/ERROR], category, message, user_id [nullable], created_at)`
  - Wire into global exception handler + request logging middleware to persist to DB
  - Create `GET /logs/` endpoint (admin only, with filters: level, category, date range, pagination)
  - _Deadline:_ May 14

- [ ] **[BE] Redis caching on heavy list endpoints** `PRIORITY: MEDIUM`
  - Apply `cache_get / cache_set` from `cache.py` to:
    - `GET /patients/` (TTL 2 min, invalidate on create/update/delete)
    - `GET /doctors/` (TTL 5 min)
    - `GET /analytics/summary` (TTL 5 min)
  - _Deadline:_ May 15

- [ ] **[BE] API documentation review** `PRIORITY: LOW`
  - Add missing `summary=`, `description=`, `response_model=` on all router endpoints
  - Verify Swagger at `/docs` is complete and accurate
  - _Deadline:_ May 20

---

### M3 — Frontend Integration

**Assigned modules:** Billing UI, Check-In UI, Analytics UI, System Logs UI, Schedule Settings UI

#### Week 1 Tasks

- [ ] **[FE] Billing.tsx → connect to backend API** `PRIORITY: MEDIUM`
  - Replace hardcoded/mock data with `billingApi.create()`, `billingApi.getAll()`, `billingApi.pay()`
  - Add `billingApi` to `frontend/src/services/api.ts`
  - Show invoice list with status badges (PENDING / PAID / CANCELLED)
  - Handle payment confirmation dialog
  - _Deadline:_ May 9

- [ ] **[FE] CheckInOut.tsx → connect to dedicated check-in API** `PRIORITY: MEDIUM`
  - Replace appointment status hack with `appointmentApi.checkIn(id)` and `appointmentApi.checkOut(id)`
  - Add `checkIn`, `checkOut` to `appointmentApi` in `api.ts`
  - Show check-in timestamp and check-out timestamp in the UI
  - _Deadline:_ May 9
  - _Dependency:_ M2 Check-In API (May 9)

- [ ] **[FE] DoctorSchedule.tsx → connect to schedule API** `PRIORITY: MEDIUM`
  - Replace local `availableTimes` constant with API call to `GET /doctors/{id}/schedule`
  - Add `doctorApi.getSchedule(id)` to `api.ts`
  - Show schedule per doctor on the calendar
  - _Deadline:_ May 13
  - _Dependency:_ M2 Doctor Schedule API (May 13)

- [ ] **[FE] ReportsAnalytics.tsx → connect to analytics API** `PRIORITY: MEDIUM`
  - Replace 3 separate API calls + client-side aggregation with `analyticsApi.getSummary()` and `analyticsApi.getAppointments(period)`
  - Add `analyticsApi` to `api.ts`
  - Show real trend charts
  - _Deadline:_ May 13
  - _Dependency:_ M2 Analytics API (May 13)

#### Week 2 Tasks

- [ ] **[FE] SystemLogs.tsx → connect to logs API** `PRIORITY: LOW`
  - Replace `generateMockLogs()` with `GET /logs/` API call
  - Add `logsApi.getAll(filters)` to `api.ts`
  - Keep client-side filter/search UI but fetch from backend
  - _Deadline:_ May 14
  - _Dependency:_ M2 System Logs API (May 14)

- [ ] **[FE] ScheduleSettings.tsx → connect to schedule config API** `PRIORITY: LOW`
  - Wire save button to `PUT /doctors/{id}/schedule`
  - Add `doctorApi.updateSchedule(id, schedule)` to `api.ts`
  - _Deadline:_ May 15

- [ ] **[FE] E2E: Patient flow** `PRIORITY: HIGH`
  - Manual test: register → login → book appointment → view appointment → cancel appointment
  - Manual test: view medical history → view prescriptions
  - Document any bugs found
  - _Deadline:_ May 16

- [ ] **[FE] E2E: Doctor flow** `PRIORITY: HIGH`
  - Manual test: login → view schedule → select appointment → create EMR → add prescription
  - Manual test: search patients → view patient profile → update EMR summary
  - Document any bugs found
  - _Deadline:_ May 19

- [ ] **[FE] Responsive + UI polish** `PRIORITY: LOW`
  - Check all dashboards on mobile viewport (375px)
  - Fix overflow issues, touch target sizes
  - Consistent loading spinners on all data-fetching components
  - _Deadline:_ May 20

---

### M4 — AI & Quality

**Assigned modules:** AI advanced endpoints, AI frontend, pytest suite, component tests

#### Week 1 Tasks

- [ ] **[BE] AI router + service skeleton** `PRIORITY: HIGH`
  - Create `backend/app/services/ai_service.py` with Gemini client helper
  - Create `backend/app/routers/ai.py`, register as `/ai` prefix in `main.py`
  - Add Redis caching for identical AI requests (TTL 10 min) to avoid repeated Gemini calls
  - _Deadline:_ May 8

- [ ] **[BE] `POST /ai/analyze-symptoms`** `PRIORITY: HIGH`
  - Input: `{symptoms: List[str], patient_id?: int}`
  - Logic: Build Gemini prompt with symptom list + optional patient EMR context
  - Output: `{analysis: str, severity: "low"|"medium"|"high", recommendations: List[str]}`
  - Auth: Bearer (any role)
  - _Deadline:_ May 9

- [ ] **[BE] `POST /ai/predict-disease`** `PRIORITY: HIGH`
  - Input: `{patient_id: int, symptoms: List[str], vitals?: dict}`
  - Logic: Gemini prompt with patient history + symptoms
  - Output: `{predictions: List[{disease: str, probability: float, icd_code?: str}]}`
  - Auth: Doctor only
  - _Deadline:_ May 12

- [ ] **[BE] `POST /ai/recommend-treatment`** `PRIORITY: HIGH`
  - Input: `{patient_id: int, diagnosis: str}`
  - Logic: Gemini prompt with patient history + diagnosis
  - Output: `{recommendations: List[str], medications: List[str], follow_up: str}`
  - Auth: Doctor only
  - _Deadline:_ May 12

- [ ] **[BE] `POST /ai/summarize-record`** `PRIORITY: HIGH`
  - Input: `{record_id: int}`
  - Logic: Fetch MedicalReport + Prescriptions, build Gemini prompt, return structured summary
  - Output: `{summary: str, key_findings: List[str], next_steps: List[str]}`
  - Auth: Doctor, Staff, Admin
  - _Deadline:_ May 13

#### Week 2 Tasks

- [ ] **[FE] AI feature integration** `PRIORITY: HIGH`
  - Add `aiApi.analyzeSymptoms()`, `aiApi.predictDisease()`, `aiApi.recommendTreatment()`, `aiApi.summarizeRecord()` to `api.ts`
  - Integrate symptom analysis into `ChatbotWidget.tsx` for patients (enhanced prompt mode)
  - Integrate `summarizeRecord` into `MedicalReportsManagement.tsx` — "AI Summary" button per report
  - Integrate `predictDisease` + `recommendTreatment` into `CreateEMR.tsx` — "AI Assist" panel
  - _Deadline:_ May 15

- [ ] **[TEST] Backend unit tests — auth + users** `PRIORITY: HIGH`
  - Set up pytest + `pytest-asyncio` + `httpx` test client
  - Create `backend/tests/conftest.py` with test DB session fixture
  - Tests: `POST /auth/token` (valid, invalid credentials), `POST /auth/register` (duplicate email), `GET /users/me`, `PUT /users/me`
  - _Deadline:_ May 14

- [ ] **[TEST] Backend unit tests — patients + appointments** `PRIORITY: HIGH`
  - Tests: CRUD patients, patient search filters, book/cancel/complete appointments
  - Tests: Role-based access (patient can't see other patients, staff can)
  - _Deadline:_ May 15

- [ ] **[TEST] Backend unit tests — medical records + prescriptions** `PRIORITY: HIGH`
  - Tests: Create EMR, search reports, prescription CRUD linked to report
  - _Deadline:_ May 16

- [ ] **[TEST] Frontend component tests** `PRIORITY: MEDIUM`
  - Set up Jest + React Testing Library
  - Tests: `LoginPage` (submit form, show error), `BookAppointment` (slot selection), `PatientSearch` (filter, pagination)
  - _Deadline:_ May 19

- [ ] **[TEST] Coverage report + bug fixes** `PRIORITY: MEDIUM`
  - Run `pytest --cov` and report coverage
  - Fix all failing tests
  - Fix any bugs found during Week 2 E2E testing (M3)
  - _Deadline:_ May 20

---

## Progress Tracking

### Overall Sprint Progress

| Member | Total Tasks | TODO | IN PROGRESS | REVIEW | DONE | BLOCKED |
|---|---|---|---|---|---|---|
| M1 | 7 | 6 | 0 | 0 | 1 | 0 |
| M2 | 7 | 7 | 0 | 0 | 0 | 0 |
| M3 | 9 | 9 | 0 | 0 | 0 | 0 |
| M4 | 10 | 10 | 0 | 0 | 0 | 0 |
| **Total** | **33** | **32** | **0** | **0** | **1** | **0** |

### Module Completion Status

| Module | Status | Owner | Due |
|---|---|---|---|
| Alembic migrations | TODO | M1 | May 8 |
| CORS restriction | DONE ✅ | M1 | May 9 |
| JWT refresh + logout | TODO | M1 | May 13 |
| Email service | TODO | M1 | May 15 |
| crud.py removal | TODO | M1 | May 16 |
| Security audit | TODO | M1 | May 19 |
| Billing API | TODO | M2 | May 9 |
| Check-In API | TODO | M2 | May 9 |
| Doctor Schedule API | TODO | M2 | May 13 |
| Analytics API | TODO | M2 | May 13 |
| System Logs API | TODO | M2 | May 14 |
| Redis caching | TODO | M2 | May 15 |
| Billing UI integration | TODO | M3 | May 9 |
| Check-In UI integration | TODO | M3 | May 9 |
| Doctor Schedule UI | TODO | M3 | May 13 |
| Analytics UI | TODO | M3 | May 13 |
| System Logs UI | TODO | M3 | May 14 |
| Schedule Settings UI | TODO | M3 | May 15 |
| E2E patient flow | TODO | M3 | May 16 |
| E2E doctor flow | TODO | M3 | May 19 |
| AI router + skeleton | TODO | M4 | May 8 |
| AI: analyzeSymptoms | TODO | M4 | May 9 |
| AI: predictDisease | TODO | M4 | May 12 |
| AI: recommendTreatment | TODO | M4 | May 12 |
| AI: summarizeRecord | TODO | M4 | May 13 |
| AI frontend integration | TODO | M4 | May 15 |
| Tests: auth + users | TODO | M4 | May 14 |
| Tests: patients + appts | TODO | M4 | May 15 |
| Tests: medical + prescriptions | TODO | M4 | May 16 |
| Tests: frontend components | TODO | M4 | May 19 |
| Coverage + bug fixes | TODO | M4 | May 20 |

> **How to update:** Change `TODO` → `IN PROGRESS` when you start, → `REVIEW` when a PR is open, → `DONE` when merged. Use `BLOCKED` + add blocker note if stuck.

---

## Dependencies Map

```
Alembic (M1) ──────────────────────────────┐
                                             ↓
                        Billing API (M2) ──→ Billing UI (M3)
                        Check-In API (M2) → Check-In UI (M3)
CORS (M1) ──→ JWT refresh (M1) ──→ Logout (M1)
                                             ↓
                                    Security audit (M1)

Doctor Schedule API (M2) ─────────────────→ Doctor Schedule UI (M3)
Analytics API (M2) ────────────────────────→ Analytics UI (M3)
System Logs API (M2) ──────────────────────→ System Logs UI (M3)

Email service (M1) ─────────────────────────→ Appointment reminders
                                              → Medical report delivery

AI router skeleton (M4) ─────────────────────→ analyzeSymptoms
                                              → predictDisease
                                              → recommendTreatment
                                              → summarizeRecord
                                                       ↓
                                             AI frontend (M4)

Tests (M4) ─────────→ Depends on: all backend APIs being stable (W1 end)
E2E tests (M3) ─────→ Depends on: all UI integrations complete (W2 mid)
```

---

## Risks & Blockers

| Risk | Impact | Probability | Mitigation | Owner |
|---|---|---|---|---|
| Gemini API rate limits on AI endpoints | High | Medium | Add Redis cache (TTL 10 min) on identical requests; implement retry with backoff | M4 |
| Email SMTP config not set up | High | Medium | Use Mailtrap for dev; document required env vars in `.env.example` | M1 |
| Billing model requires Alembic first | High | High | M1 must finish Alembic by May 8 before M2 creates Billing model | M1, M2 |
| Frontend ↔ Backend response schema mismatch | Medium | Medium | Review API contracts before M3 starts integration (May 9) | M2, M3 |
| Check-In columns require DB migration | Medium | High | Covered by Alembic; M2 creates migration, M3 waits for it | M1, M2 |
| Tests fail due to DB state between runs | Medium | Medium | Use transaction rollback per test in `conftest.py` | M4 |
| crud.py removal breaks create_initial_admin.py | Low | High | Update `create_initial_admin.py` as part of M1 crud.py removal task | M1 |

---

## Completion Checklist

### Security
- [x] CORS restricted to `FRONTEND_URL` (not `*`) (done ✅ May 15)
- [ ] JWT refresh token endpoint working
- [ ] Server-side logout blacklists token in Redis
- [ ] Rate limiting on `/ai/*` endpoints
- [ ] No hardcoded secrets in source code
- [ ] Security audit completed

### Backend
- [ ] Alembic set up and initial migration runs cleanly
- [ ] Billing API: create invoice, list, pay
- [ ] Check-In/Out: timestamps stored, API endpoints work
- [ ] Doctor weekly schedule: model, API, used by slot availability
- [ ] Analytics API: summary + trend endpoints
- [ ] System logs: persisted to DB, queryable
- [ ] Email service: appointment reminders + report delivery working
- [ ] Password reset email actually sends
- [ ] Redis caching on heavy list endpoints
- [ ] AI: all 4 advanced endpoints implemented and tested
- [ ] crud.py removed

### Frontend
- [ ] Billing UI connected to backend (no mock data)
- [ ] Check-In UI uses dedicated check-in/out API
- [ ] Doctor Schedule UI uses schedule API
- [ ] Analytics dashboard uses analytics API
- [ ] System Logs UI uses logs API
- [ ] Schedule Settings saves to backend
- [ ] AI: symptom analysis in chatbot
- [ ] AI: summarize record button in EMR management
- [ ] AI: assist panel in create EMR form
- [ ] All ESLint warnings resolved (done ✅ May 7)

### Testing
- [ ] pytest suite runs: `cd backend && pytest`
- [ ] Test coverage ≥ 70% on services and repositories
- [ ] E2E patient flow passes
- [ ] E2E doctor flow passes
- [ ] Frontend component tests pass
- [ ] No regressions in existing features

### Infrastructure
- [ ] Docker Compose: `docker compose up -d` starts Postgres 17 + Redis cleanly (done ✅ May 7)
- [ ] `.env.example` is complete and documented (done ✅ May 7)
- [ ] `create_initial_admin.py` works after crud.py removal
- [ ] `README.md` updated with setup instructions

---

## Bug Fix Log

### 2026-05-15 — Critical Bug Sweep (15 fixes)

#### CRITICAL — Security & Data Integrity

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `backend/app/services/medical_report_service.py:29` | Admin/Staff see **zero** medical reports — `get_by_doctor(db, 0)` always returns empty | Added `get_all()` to `MedicalReportRepository`, used for Admin/Staff roles |
| 2 | `backend/app/services/medical_report_service.py:47,59` | Authorization logic `!=DOCTOR and !=owner` blocks admins from editing/deleting any report | Extracted `_can_modify_report()` — allows report's owning doctor OR any admin |
| 3 | `backend/app/routers/auth.py:27` | Self-registration accepts any role (`body.get("role")`) — users can register as ADMIN | Hardcoded `role=UserRole.PATIENT` for public registration |
| 4 | `backend/app/routers/appointments.py:27-29` | `GET /appointments/` has **no authentication** — anyone can list all appointments | Added `get_current_clinic_staff_or_admin` dependency |

#### HIGH — Security & Configuration

| # | File | Bug | Fix |
|---|------|-----|-----|
| 5 | `backend/app/main.py:35` | CORS `allow_origins=["*"]` allows all origins | Changed to `[settings.FRONTEND_URL]`, enabled `allow_credentials=True` |
| 6 | `frontend/src/components/dashboards/DoctorDashboard.tsx:42` | DoctorDashboard calls `getAll()` (now admin/staff-only) — breaks for doctors | Changed to `getMyAppointments()` |
| 7 | `frontend/src/components/ResetPasswordPage.tsx:40` | Hardcoded URL `http://127.0.0.1:8000` — breaks in any non-local environment | Migrated to centralized `api` instance |
| 8 | `frontend/src/components/LoginPage.tsx`, `ForgotPasswordPage.tsx`, `RegisterPage.tsx` | Raw `axios` with empty `BACKEND_URL` fallback (defaults to `""`) | Migrated all auth pages to centralized `api` instance |

#### MEDIUM — Incorrect Logic

| # | File | Bug | Fix |
|---|------|-----|-----|
| 9 | `frontend/src/components/admin/ReportsAnalytics.tsx:79-81` | Appointment status breakdown uses time-based comparison instead of actual `status` field; cancelled count hardcoded to 0 | Uses `status` field: `Scheduled`/`Completed`/`Canceled` |
| 10 | `frontend/src/components/dashboards/PatientDashboard.tsx:46`, `DoctorDashboard.tsx:56` | "Upcoming" count includes cancelled/completed appointments | Added `status === 'Scheduled'` filter |
| 11 | `frontend/src/components/appointment/BookAppointment.tsx:53` | No date validation — empty or reversed date ranges crash the API call | Added validation: required fields + `dateFrom <= dateTo` check |
| 12 | `frontend/src/components/appointment/ViewAppointment.tsx:44` | Error state captured (`_error`) but **never displayed** to user | Removed underscore prefix, added error display in JSX |

#### LOW — Code Quality & UX

| # | File | Bug | Fix |
|---|------|-----|-----|
| 13 | `frontend/src/components/medical/Prescriptions.tsx:20` | Unused `_doctors` state, `Doctor` interface, and `doctorApi` import | Removed dead code, simplified `loadData()` |
| 14 | `frontend/src/components/medical/MedicalHistory.tsx:379-441` | Mixed English/Vietnamese labels in report detail view | Translated all English labels to Vietnamese |
| 15 | `backend/app/routers/auth.py:20`, `frontend/RegisterPage.tsx:43` | Register endpoint trailing slash mismatch (`/register/` vs `/register`) | Standardized to `/register` (no trailing slash) on both sides |

**Verification:** TypeScript compiles cleanly (`npx tsc --noEmit` — 0 errors). Backend imports verified (`python -c "from app.main import app"` — OK).

---

## Daily Standup Template

```
Date: YYYY-MM-DD
Member: M1 / M2 / M3 / M4

Yesterday:
- [what was completed]

Today:
- [what will be worked on]

Blockers:
- [none / describe blocker]
```
