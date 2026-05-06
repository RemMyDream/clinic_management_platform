# Clinic Management System — Project Context & Development Plan

> **Last Updated:** 2026-05-06
> **Version:** 0.7.0 — Layered Architecture Complete

---

## Executive Summary

The Clinic Management System (CMS) is a web-based healthcare application built with **FastAPI** (backend), **React + TypeScript** (frontend), and **PostgreSQL** (database). It supports 4 user roles: Patient, Doctor, Clinic Staff, and Admin.

**v0.7.0 STATUS (2026-05-06):** Layered architecture is now complete. All missing models (Staff, Prescription, OTCMedicationRecord), schemas, repositories, and services have been implemented. All routers have been refactored to use the service layer. Three new routers added (staff, prescriptions, otc_medications). main.py registers all routers with request logging and global error handler middleware. Password reset is now functional.

**Remaining gaps:** AI advanced endpoints (symptom analysis, disease prediction, etc.), billing/check-in backend, doctor schedule model, email service, Alembic migrations, CORS origin restriction for production, frontend updates for new APIs.

---

# TASK 1 — Feature & Functionality Consolidation

## Module 1: Authentication & User Management

| Feature | Purpose | Actors | Status | Notes |
|---------|---------|--------|--------|-------|
| Register (U1) | Create new account | User, Admin | ✅ Implemented | POST /auth/register |
| Login (U2) | Authenticate user | User | ✅ Implemented | POST /auth/token (JWT) |
| Logout (U3) | End session | User | ⚠️ Partial | Frontend only (localStorage clear), no server-side token invalidation |
| Update Profile (U4) | Edit personal info | All roles | ✅ Implemented | PUT /users/me |
| Reset Password (U6) | Recover account | User | ✅ Implemented | Functional — UserRepository has create/verify/clear token logic; User model has columns |
| User CRUD | Manage users | Admin | ✅ Implemented | Full CRUD in /users |

## Module 2: Patient Management

| Feature | Purpose | Actors | Status | Notes |
|---------|---------|--------|--------|-------|
| Create Patient | Register patient profile | Staff, Admin | ✅ Implemented | POST /patients |
| Search Patients (D1) | Find patient records | Doctor, Staff | ✅ Implemented | POST /patients/search with filters |
| View Patient Profile | View details | Doctor, Staff | ✅ Implemented | GET /patients/{id} |
| Update Patient | Edit patient info | Staff, Admin | ✅ Implemented | PUT /patients/{id} |
| EMR Summary | AI-generated summary | Staff, Doctor | ✅ Implemented | PUT /patients/{id}/emr |

## Module 3: Doctor Management

| Feature | Purpose | Actors | Status | Notes |
|---------|---------|--------|--------|-------|
| Create Doctor | Register doctor profile | Admin | ✅ Implemented | POST /doctors |
| Search Doctors (P1) | Find doctor info | Patient | ✅ Implemented | GET /doctors?specialty=X via DoctorRepository.get_by_specialty |
| View Doctor Profile | View details | All | ✅ Implemented | GET /doctors/{id} |
| Update Doctor | Edit doctor info | Admin | ✅ Implemented | PUT /doctors/{id} |
| Doctor Schedule (D6) | Manage weekly schedule | Doctor | ⚠️ Partial | Frontend component exists but no dedicated schedule model/table |

## Module 4: Appointment Management

| Feature | Purpose | Actors | Status | Notes |
|---------|---------|--------|--------|-------|
| Book Appointment (P3) | Reserve time slot | Patient | ✅ Implemented | POST /appointments/book |
| View Appointments (P4, D4) | See own appointments | Patient, Doctor | ✅ Implemented | GET /appointments/me |
| Cancel Appointment (P5, D5) | Cancel booking | Patient, Doctor | ⚠️ Partial | DELETE exists but no status update (no status field at all) |
| View Available Slots (P2) | See open times | Patient | ✅ Implemented | GET /appointments/available |
| Reschedule | Change appointment time | Patient, Doctor | ⚠️ Partial | PUT exists but no proper reschedule workflow |
| **Appointment Status** | Track scheduled/completed/canceled | All | ✅ Implemented | `status` field (SCHEDULED/COMPLETED/CANCELED/NO_SHOW) + cancel/complete endpoints |
| **Service Field** | Type of medical service | All | ✅ Implemented | `service` field with default "General Consultation" |

## Module 5: Medical Records (EMR)

| Feature | Purpose | Actors | Status | Notes |
|---------|---------|--------|--------|-------|
| Create Medical Report (D3) | Document consultation | Doctor | ✅ Implemented | POST /medical_reports |
| View Medical History (D2, P6) | Review past records | Doctor, Patient | ✅ Implemented | GET /medical_reports |
| Update Medical Report | Edit EMR | Doctor | ✅ Implemented | PUT /medical_reports/{id} |
| Search Reports | Find specific records | Doctor | ✅ Implemented | GET /medical_reports/search |
| **Appointment Link** | Link report to appointment | Doctor | ✅ Implemented | `appointment_id` FK added to MedicalReport model |

## Module 6: Prescription Management

| Feature | Purpose | Actors | Status | Notes |
|---------|---------|--------|--------|-------|
| **Create Prescription** | Prescribe medications | Doctor | ✅ Implemented | POST /prescriptions/ — Prescription model + PrescriptionRepository + PrescriptionService |
| **View Prescriptions** | See medication list | Patient, Doctor | ✅ Implemented | GET /prescriptions/by-report/{id} and /by-patient/{id} |
| **Update Prescription** | Modify prescription | Doctor | ✅ Implemented | PUT /prescriptions/{id} |
| **C_PrescriptionController** | Full prescription API | Doctor | ✅ Implemented | /prescriptions router with full CRUD |

## Module 7: Staff Management

| Feature | Purpose | Actors | Status | Notes |
|---------|---------|--------|--------|-------|
| **Staff Model** | Staff-specific data | Admin | ✅ Implemented | Staff model + StaffRepository + StaffService + /staff router |
| **OTC Medication Records** | Track dispensed OTC meds | Staff | ✅ Implemented | OTCMedicationRecord model + repository + service + /otc_medications router |
| Check-In/Out | Patient arrival tracking | Staff | ⚠️ Partial | Frontend exists (CheckInOut.tsx) but no backend support |
| Billing | Payment/billing management | Staff | ⚠️ Partial | Frontend exists (Billing.tsx, BillingOverview.tsx) but no backend model/API |

## Module 8: AI / Chatbot

| Feature | Purpose | Actors | Status | Notes |
|---------|---------|--------|--------|-------|
| Public Chat (U5) | FAQ assistance | Anyone | ✅ Implemented | POST /chat/public |
| Patient Chat | Personal medical chat | Patient | ✅ Implemented | POST /chat/patient |
| Staff/Doctor Chat | EMR assistance | Staff, Doctor | ✅ Implemented | POST /chat/send |
| **Symptom Analysis** | AI symptom assessment | Patient | ❌ Missing | **Spec C_AIController.analyzeSymptoms** |
| **Disease Prediction** | AI-based prediction | Doctor | ❌ Missing | **Spec C_AIController.predictDisease** |
| **Treatment Recommendation** | AI treatment plans | Doctor | ❌ Missing | **Spec C_AIController.recommendTreatment** |
| **Record Summarization** | AI medical summary | Doctor | ❌ Missing | **Spec C_AIController.summarizeMedicalRecord** |

## Module 9: Email & Notifications

| Feature | Purpose | Actors | Status | Notes |
|---------|---------|--------|--------|-------|
| **Send Email** | Generic email | System | ❌ Missing | **Spec C_EmailController** |
| **Appointment Reminder** | Email reminders | System | ❌ Missing | |
| **Password Reset Email** | Recovery email | System | ⚠️ Partial | Endpoint exists but non-functional |
| **Medical Report Email** | Send report to patient | System | ❌ Missing | |

## Module 10: Admin & Dashboard

| Feature | Purpose | Actors | Status | Notes |
|---------|---------|--------|--------|-------|
| Admin Dashboard | System overview | Admin | ✅ Implemented | AdminDashboard.tsx |
| User Management | Manage all users | Admin | ✅ Implemented | UserManagement.tsx |
| Reports & Analytics | System reports | Admin | ⚠️ Partial | Frontend exists, limited backend support |
| Schedule Settings | Configure slots | Admin | ⚠️ Partial | Frontend exists, no backend config API |
| System Logs | Activity logging | Admin | ⚠️ Partial | Frontend exists, no backend logging |

---

## Gap Analysis Summary

| Category | Specified | Implemented | Partially | Missing |
|----------|-----------|-------------|-----------|---------|
| Models | 10 | 10 | 0 | 0 ✅ |
| Controllers/Routers | 11 | 10 | 1 | 1 (AI advanced endpoints, Email) |
| Use Cases | 18 | 15 | 2 | 1 (Billing backend, Doctor schedule) |
| Frontend Pages | 15 | 14 | 1 | 0 |

### Completed Items (v0.7.0)

1. ✅ Staff model, repository, service, router
2. ✅ Prescription model (separate table), repository, service, router
3. ✅ OTCMedicationRecord model, repository, service, router
4. ✅ Appointment `status` (SCHEDULED/COMPLETED/CANCELED/NO_SHOW) + `service` fields
5. ✅ MedicalReport `appointment_id` FK
6. ✅ Full layered architecture: Router → Service → Repository → Model
7. ✅ Password reset fully functional
8. ✅ Doctor search by specialty
9. ✅ Request logging + global error handler middleware

### Still Missing / Next Steps

1. **AI advanced endpoints** — analyzeSymptoms, predictDisease, recommendTreatment, summarizeMedicalRecord
2. **Email service** — Appointment reminders, report-to-patient email
3. **Alembic migrations** — Schema version control for production deployments
4. **Billing backend** — Model and API for billing/payment (frontend BillingOverview.tsx exists)
5. **Doctor weekly schedule** — Dedicated schedule model and /doctors/{id}/schedule endpoint
6. **Check-in/out backend** — Status-change workflow with timestamps
7. **CORS restriction** — Change `allow_origins=["*"]` to specific frontend origin before deployment
8. **Frontend updates** — Integrate new prescriptions, OTC, staff APIs into React UI

---

# TASK 2 — Development Roadmap & Team Planning

## Project Phases

### Phase 1: Database & Model Completion (Week 1)
**Priority: CRITICAL**

| Task | Dependencies | Output | Assigned To |
|------|-------------|--------|-------------|
| Add `status` and `service` fields to Appointment model | None | Updated model + migration | BE-1 |
| Add `appointment_id` FK to MedicalReport | None | Updated model + migration | BE-1 |
| Create Staff model | None | New model + migration | BE-2 |
| Create Prescription model (separate table) | None | New model + migration | BE-2 |
| Create OTCMedicationRecord model | Staff model | New model + migration | BE-2 |
| Add password reset token fields to User | None | Updated model + migration | BE-1 |
| Set up Alembic for proper migrations | None | Migration infrastructure | BE-1 |

### Phase 2: Service Layer Refactoring (Week 1-2)
**Priority: HIGH**

| Task | Dependencies | Output | Assigned To |
|------|-------------|--------|-------------|
| Extract business logic from crud.py into service modules | Phase 1 | services/ directory | BE-1 |
| Create AuthService | None | Proper auth logic separation | BE-1 |
| Create AppointmentService | Phase 1 | Appointment business logic | BE-2 |
| Create MedicalRecordService | Phase 1 | EMR business logic | BE-2 |
| Create PrescriptionService | Phase 1 | Prescription logic | BE-2 |
| Refactor routers to use services | Service creation | Clean routers | BE-1, BE-2 |

### Phase 3: Missing API Endpoints (Week 2-3)
**Priority: HIGH**

| Task | Dependencies | Output | Assigned To |
|------|-------------|--------|-------------|
| Prescription CRUD endpoints | PrescriptionService | /prescriptions router | BE-2 |
| OTC Medication endpoints | OTCMedicationRecord model | /otc-medications router | BE-2 |
| Doctor search by specialty | None | Enhanced /doctors endpoint | BE-1 |
| Appointment status management | Phase 1 | Cancel/complete/reschedule APIs | BE-1 |
| Password reset (functional) | Phase 1 | Working email-based reset | BE-1 |
| Email notification service | None | Email sending infrastructure | BE-1 |

### Phase 4: Frontend Integration (Week 2-4)
**Priority: HIGH**

| Task | Dependencies | Output | Assigned To |
|------|-------------|--------|-------------|
| Update Appointment components for status/service | Phase 3 APIs | Updated booking UI | FE-1 |
| Prescription management UI | Prescription API | New prescription pages | FE-1 |
| Staff management pages | Staff API | Staff dashboard updates | FE-2 |
| Doctor search/filter UI | Doctor search API | Enhanced doctor search | FE-2 |
| Check-In/Out integration | Backend support | Working check-in flow | FE-2 |
| Billing integration | Backend support | Working billing flow | FE-2 |
| Password reset flow | Reset API | Working reset pages | FE-1 |

### Phase 5: AI Enhancement (Week 3-4)
**Priority: MEDIUM**

| Task | Dependencies | Output | Assigned To |
|------|-------------|--------|-------------|
| AI symptom analysis endpoint | Gemini integration | /ai/analyze-symptoms | BE-2 |
| AI disease prediction | Gemini integration | /ai/predict-disease | BE-2 |
| AI treatment recommendation | Gemini integration | /ai/recommend-treatment | BE-2 |
| AI record summarization | Gemini integration | /ai/summarize-record | BE-2 |
| Frontend AI feature integration | AI endpoints | Enhanced chatbot UI | FE-1 |

### Phase 6: Testing & Quality (Week 4-5)
**Priority: HIGH**

| Task | Dependencies | Output | Assigned To |
|------|-------------|--------|-------------|
| Backend unit tests | All backend phases | pytest test suite | BE-1, BE-2 |
| Frontend component tests | All frontend phases | Jest/RTL tests | FE-1, FE-2 |
| Integration tests | All phases | E2E test scenarios | DevOps |
| API documentation review | All APIs | Updated OpenAPI docs | DevOps |
| Security audit | All phases | Security report | DevOps |

### Phase 7: Deployment & Documentation (Week 5-6)
**Priority: MEDIUM**

| Task | Dependencies | Output | Assigned To |
|------|-------------|--------|-------------|
| Docker containerization | None | Dockerfile, docker-compose | DevOps |
| CI/CD pipeline | Docker setup | GitHub Actions workflow | DevOps |
| Production deployment | CI/CD | Deployed application | DevOps |
| User documentation | All features | User guide | DevOps |
| Technical documentation | All phases | Architecture docs | DevOps |

## Team Assignment Matrix

| Member | Role | Modules | Workload |
|--------|------|---------|----------|
| **BE-1** | Backend Lead | Auth, Users, Appointments, Email, Migrations, Service Layer | 40% |
| **BE-2** | Backend Dev | Medical Records, Prescriptions, OTC Meds, AI, Doctors, Staff | 40% |
| **FE-1** | Frontend Lead | Auth pages, Appointments, Prescriptions, AI/Chatbot, Dashboard | 40% |
| **FE-2** | Frontend Dev | Staff pages, Billing, Check-In, Doctor search, Profile, Medical records | 40% |
| **DevOps** | DevOps/Docs | Docker, CI/CD, Testing infra, Documentation, Security | 30% |

## Timeline (6-Week Sprint Plan)

| Sprint | Week | Focus | Deliverables |
|--------|------|-------|--------------|
| Sprint 1 | W1 | Foundation | DB migrations, models, Alembic, service layer skeleton |
| Sprint 2 | W2 | Core APIs | Services complete, missing endpoints, prescription API |
| Sprint 3 | W3 | Integration | Frontend updates, AI endpoints, email service |
| Sprint 4 | W4 | Features | All features integrated, staff/billing/OTC |
| Sprint 5 | W5 | Quality | Testing, bug fixes, security audit |
| Sprint 6 | W6 | Release | Deployment, documentation, final polish |

## Critical Path

```
DB Models → Service Layer → API Endpoints → Frontend Integration → Testing → Deployment
```

## Risks & Bottlenecks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Prescription model migration may break existing data | High | Migrate TEXT prescription data to new table |
| Appointment status addition requires data backfill | Medium | Default existing appointments to "COMPLETED" |
| Gemini AI rate limits | Medium | Implement caching and rate limiting |
| CORS * in production | High | Restrict to specific origins before deployment |
| No Alembic = risky migrations | High | Set up Alembic first before any schema changes |

---

# TASK 3 — System Endpoint & Architecture Design

## Complete API Endpoint Specification

### Authentication (`/auth`)

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/auth/register` | `{email, password, full_name, role}` | `{user_id, email, role}` | None | Validate unique email, hash password, create user |
| POST | `/auth/token` | `{email, password}` (form-data) | `{access_token, token_type}` | None | Verify credentials, generate JWT |
| POST | `/auth/logout` | None | `{message}` | Bearer | Invalidate token (server-side blacklist) |
| POST | `/auth/refresh` | `{refresh_token}` | `{access_token}` | None | Validate refresh token, issue new access token |

### Users (`/users`)

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/users/` | `{email, password, full_name, role}` | `UserResponse` | Admin | Create user with role |
| GET | `/users/me` | None | `UserResponse` | Bearer | Get current user from token |
| PUT | `/users/me` | `{full_name, email}` | `UserResponse` | Bearer | Update own profile |
| GET | `/users/` | None | `List[UserResponse]` | Admin | List all users |
| GET | `/users/{user_id}` | None | `UserResponse` | Bearer | Get user details |
| PUT | `/users/{user_id}` | `{full_name, role}` | `UserResponse` | Admin | Admin update user |
| DELETE | `/users/{user_id}` | None | `{message}` | Admin | Soft/hard delete user |

### Patients (`/patients`)

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/patients/` | `PatientCreate` | `PatientResponse` | Staff/Admin | Create patient profile linked to user |
| GET | `/patients/` | None | `List[PatientResponse]` | Bearer | List all patients |
| GET | `/patients/{patient_id}` | None | `PatientResponse` | Bearer | Get patient details |
| PUT | `/patients/{patient_id}` | `PatientUpdate` | `PatientResponse` | Staff/Admin | Update patient info |
| DELETE | `/patients/{patient_id}` | None | `{message}` | Admin | Delete patient |
| POST | `/patients/search` | `{name, phone, email, id, age_range, gender}` | `List[PatientResponse]` | Bearer | Advanced search with filters |
| PUT | `/patients/{patient_id}/emr` | `{emr_summary}` | `PatientResponse` | Doctor/Staff | Update AI-generated EMR summary |

### Doctors (`/doctors`)

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/doctors/` | `DoctorCreate` | `DoctorResponse` | Admin | Create doctor profile |
| GET | `/doctors/` | `?specialty=X` | `List[DoctorResponse]` | Bearer | List/filter doctors |
| GET | `/doctors/{doctor_id}` | None | `DoctorResponse` | Bearer | Get doctor details |
| PUT | `/doctors/{doctor_id}` | `DoctorUpdate` | `DoctorResponse` | Admin | Update doctor info |
| DELETE | `/doctors/{doctor_id}` | None | `{message}` | Admin | Delete doctor |
| GET | `/doctors/{doctor_id}/schedule` | `?date=YYYY-MM-DD` | `ScheduleResponse` | Bearer | Get doctor availability |

### Appointments (`/appointments`)

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/appointments/book` | `{patient_id, doctor_id, date, time, service, reason}` | `AppointmentResponse` | Patient/Staff | Create appointment with status=SCHEDULED |
| GET | `/appointments/` | None | `List[AppointmentResponse]` | Admin/Staff | List all appointments |
| GET | `/appointments/me` | None | `List[AppointmentResponse]` | Bearer | Get current user's appointments |
| GET | `/appointments/{id}` | None | `AppointmentResponse` | Bearer | Get appointment details |
| PUT | `/appointments/{id}` | `AppointmentUpdate` | `AppointmentResponse` | Bearer | Update appointment |
| PUT | `/appointments/{id}/cancel` | `{reason}` | `AppointmentResponse` | Bearer | Cancel with status=CANCELED |
| PUT | `/appointments/{id}/complete` | None | `AppointmentResponse` | Doctor/Staff | Mark as COMPLETED |
| GET | `/appointments/available` | `?doctor_id=X&date=Y` | `List[TimeSlot]` | Bearer | Get available time slots |
| GET | `/appointments/available-range` | `?doctor_id=X&start=Y&end=Z` | `List[DaySlots]` | Bearer | Get slots for date range |

### Medical Reports (`/medical-reports`)

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/medical-reports/` | `MedicalReportCreate` | `MedicalReportResponse` | Doctor | Create EMR linked to appointment |
| GET | `/medical-reports/` | None | `List[MedicalReportResponse]` | Bearer | Role-filtered list |
| GET | `/medical-reports/{id}` | None | `MedicalReportResponse` | Bearer | Get report details |
| PUT | `/medical-reports/{id}` | `MedicalReportUpdate` | `MedicalReportResponse` | Doctor | Update report |
| DELETE | `/medical-reports/{id}` | None | `{message}` | Admin | Delete report |
| GET | `/medical-reports/search` | `?patient_id=X&date_range=Y` | `List[MedicalReportResponse]` | Bearer | Search reports |

### Prescriptions (`/prescriptions`) — NEW

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/prescriptions/` | `{report_id, medication_name, dosage, quantity}` | `PrescriptionResponse` | Doctor | Create prescription linked to report |
| GET | `/prescriptions/` | `?patient_id=X&report_id=Y` | `List[PrescriptionResponse]` | Bearer | List prescriptions |
| GET | `/prescriptions/{id}` | None | `PrescriptionResponse` | Bearer | Get prescription details |
| PUT | `/prescriptions/{id}` | `PrescriptionUpdate` | `PrescriptionResponse` | Doctor | Update prescription |
| DELETE | `/prescriptions/{id}` | None | `{message}` | Doctor | Delete prescription |

### OTC Medications (`/otc-medications`) — NEW

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/otc-medications/` | `{patient_id, medication_name, quantity}` | `OTCResponse` | Staff | Record OTC dispensing |
| GET | `/otc-medications/` | `?patient_id=X` | `List[OTCResponse]` | Staff/Admin | List OTC records |
| PUT | `/otc-medications/{id}` | `OTCUpdate` | `OTCResponse` | Staff | Update record |
| DELETE | `/otc-medications/{id}` | None | `{message}` | Staff/Admin | Delete record |

### Staff (`/staff`) — NEW

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/staff/` | `{user_id, position}` | `StaffResponse` | Admin | Create staff profile |
| GET | `/staff/` | None | `List[StaffResponse]` | Admin | List all staff |
| GET | `/staff/{id}` | None | `StaffResponse` | Admin/Staff | Get staff details |
| PUT | `/staff/{id}` | `StaffUpdate` | `StaffResponse` | Admin | Update staff |
| DELETE | `/staff/{id}` | None | `{message}` | Admin | Delete staff profile |

### AI (`/ai`) — NEW

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/ai/analyze-symptoms` | `{symptoms: List[str]}` | `{analysis, severity, recommendations}` | Bearer | Gemini symptom analysis |
| POST | `/ai/predict-disease` | `{medical_data}` | `{predictions: List[{disease, probability}]}` | Doctor | AI disease prediction |
| POST | `/ai/recommend-treatment` | `{patient_id}` | `{recommendations}` | Doctor | AI treatment plans |
| POST | `/ai/summarize-record` | `{record_id}` | `{summary}` | Doctor | AI record summary |

### Chat (`/chat`)

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/chat/public` | `{message}` | `{response}` | None | Public FAQ chatbot |
| POST | `/chat/patient` | `{message}` | `{response}` | Patient | Patient-specific AI chat |
| POST | `/chat/send` | `{message, patient_id}` | `{response}` | Doctor/Staff | EMR-assisted chat |
| GET | `/chat/history` | None | `List[ChatMessage]` | Bearer | Get user's chat history |

### Password (`/password`)

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/password/forgot-password` | `{email}` | `{message}` | None | Send reset email with token |
| POST | `/password/reset-password` | `{token, new_password}` | `{message}` | None | Validate token, update password |

### Hospitals (`/hospitals`)

| Method | Route | Request Body | Response | Auth | Business Logic |
|--------|-------|-------------|----------|------|---------------|
| POST | `/hospitals/` | `HospitalCreate` | `HospitalResponse` | Admin | Create hospital |
| GET | `/hospitals/` | None | `List[HospitalResponse]` | Bearer | List hospitals |
| GET | `/hospitals/{id}` | None | `HospitalResponse` | Bearer | Get hospital details |
| PUT | `/hospitals/{id}` | `HospitalUpdate` | `HospitalResponse` | Admin | Update hospital |
| DELETE | `/hospitals/{id}` | None | `{message}` | Admin | Delete hospital |

---

## Frontend Structure

### Pages & Routing

| Route | Page | Component | Roles | API Calls |
|-------|------|-----------|-------|-----------|
| `/` | Homepage | LoginPage | Guest | — |
| `/login` | Login | LoginPage | Guest | POST /auth/token |
| `/register` | Register | RegisterPage | Guest | POST /auth/register |
| `/forgot-password` | Forgot Password | ForgotPasswordPage | Guest | POST /password/forgot-password |
| `/reset-password` | Reset Password | ResetPasswordPage | Guest | POST /password/reset-password |
| `/dashboard` | Dashboard | DashboardWrapper | All | Role-specific APIs |
| `/profile` | Profile | Profile | All | GET/PUT /users/me |
| `/appointments` | Appointments | ViewAppointment | All | GET /appointments/me |
| `/appointments/book` | Book Appointment | BookAppointment | Patient | POST /appointments/book |
| `/appointments/schedule` | Schedule | ScheduleAppointment | Doctor/Staff | GET /appointments |
| `/medical-records` | Medical Records | MedicalReportsManagement | Doctor/Staff | GET /medical-reports |
| `/medical-records/create` | Create EMR | CreateEMR | Doctor | POST /medical-reports |
| `/medical-history` | Medical History | MedicalHistory | Patient | GET /medical-reports |
| `/prescriptions` | Prescriptions | Prescriptions | Doctor/Patient | GET /prescriptions |
| `/patients` | Patient Search | PatientSearch | Doctor/Staff | POST /patients/search |
| `/billing` | Billing | Billing | Staff | Billing APIs |
| `/check-in` | Check-In/Out | CheckInOut | Staff | Appointment status APIs |
| `/admin/users` | User Management | UserManagement | Admin | GET/PUT/DELETE /users |
| `/admin/reports` | Analytics | ReportsAnalytics | Admin | Dashboard APIs |
| `/admin/schedule` | Schedule Settings | ScheduleSettings | Admin | Config APIs |
| `/admin/logs` | System Logs | SystemLogs | Admin | Log APIs |

### State Management
- **Auth state**: localStorage (accessToken, role, userId)
- **API calls**: Axios with interceptors for token attachment
- **No global state manager** — consider adding Context API or Zustand for complex state

### Reusable Components
- BaseDashboard (layout wrapper)
- Sidebar (role-aware navigation)
- ChatbotWidget (floating AI chat)
- AppointmentCard, AppointmentList, AppointmentForm
- MedicalRecordForm
- ProfileForm

---

## Proposed Backend Architecture

### Current Structure (Flat)
```
backend/app/
├── main.py
├── models.py          # All models in one file
├── schemas.py         # All Pydantic schemas in one file
├── crud.py            # ALL database operations (28KB monolith)
├── database.py
├── config.py
├── dependencies.py
└── routers/
    ├── auth.py
    ├── users.py
    ├── patients.py
    ├── doctors.py
    ├── appointments.py
    ├── hospitals.py
    ├── chat.py
    ├── reports.py
    └── password.py
```

### Proposed Structure (Layered)
```
backend/app/
├── main.py
├── config.py
├── database.py
├── dependencies.py
│
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── patient.py
│   ├── doctor.py
│   ├── staff.py           # NEW
│   ├── hospital.py
│   ├── appointment.py
│   ├── medical_report.py
│   ├── prescription.py    # NEW
│   ├── otc_medication.py  # NEW
│   └── chat_message.py
│
├── schemas/
│   ├── __init__.py
│   ├── user.py
│   ├── patient.py
│   ├── doctor.py
│   ├── staff.py           # NEW
│   ├── hospital.py
│   ├── appointment.py
│   ├── medical_report.py
│   ├── prescription.py    # NEW
│   ├── otc_medication.py  # NEW
│   └── chat.py
│
├── repositories/
│   ├── __init__.py
│   ├── user_repository.py
│   ├── patient_repository.py
│   ├── doctor_repository.py
│   ├── staff_repository.py
│   ├── appointment_repository.py
│   ├── medical_report_repository.py
│   ├── prescription_repository.py
│   ├── otc_medication_repository.py
│   └── chat_repository.py
│
├── services/
│   ├── __init__.py
│   ├── auth_service.py
│   ├── user_service.py
│   ├── patient_service.py
│   ├── doctor_service.py
│   ├── staff_service.py
│   ├── appointment_service.py
│   ├── medical_report_service.py
│   ├── prescription_service.py
│   ├── otc_medication_service.py
│   ├── chat_service.py
│   ├── ai_service.py
│   └── email_service.py
│
├── routers/
│   ├── __init__.py
│   ├── auth.py
│   ├── users.py
│   ├── patients.py
│   ├── doctors.py
│   ├── staff.py           # NEW
│   ├── appointments.py
│   ├── medical_reports.py
│   ├── prescriptions.py   # NEW
│   ├── otc_medications.py # NEW
│   ├── hospitals.py
│   ├── chat.py
│   ├── ai.py              # NEW
│   ├── password.py
│   └── email.py           # NEW
│
├── middleware/
│   ├── __init__.py
│   ├── auth_middleware.py
│   └── error_handler.py
│
├── utils/
│   ├── __init__.py
│   ├── security.py
│   ├── email.py
│   └── validators.py
│
└── migrations/           # Alembic
    ├── env.py
    ├── versions/
    └── alembic.ini
```

### Architecture Flow
```
Client Request
    → Router (validate input, parse request)
        → Service (business logic, authorization rules)
            → Repository (database queries)
                → Model (ORM entity)
            ← Repository returns model/data
        ← Service returns DTO/schema
    ← Router returns HTTP response
```

### Validation Strategy
- **Request validation**: Pydantic schemas at router level
- **Business validation**: Service layer (e.g., "can this doctor cancel this appointment?")
- **Database constraints**: Model level (unique, not null, FK)

### Error Handling Strategy
- Custom exception classes (`NotFoundException`, `ForbiddenException`, etc.)
- Global exception handler middleware
- Consistent error response format: `{detail: string, status_code: int}`

### Security Practices
- JWT with expiration (30 min access, 7 day refresh)
- Password hashing with bcrypt
- Role-based access control via dependencies
- CORS restricted to specific origins (not `*`)
- Input sanitization via Pydantic
- SQL injection prevention via SQLAlchemy ORM

### Database Organization
- PostgreSQL with proper indexes on FK columns
- Cascading deletes on related records
- Alembic for version-controlled migrations
- Connection pooling via SQLAlchemy

---

# TASK 4 — Refactoring Strategy

## Incremental Refactor Plan

### Step 1: Set Up Alembic Migration Infrastructure
**Why:** Manual SQL migrations are error-prone and not tracked in version control properly.

### Step 2: Split Models into Separate Files
**Why:** Single `models.py` will grow as we add Staff, Prescription, OTCMedicationRecord. Separate files improve maintainability.

### Step 3: Split Schemas into Separate Files
**Why:** Same reasoning as models — `schemas.py` is already large and will grow.

### Step 4: Add Missing Models
- Staff (staff_id, user_id FK, position)
- Prescription (prescription_id, report_id FK, medication_name, dosage, quantity)
- OTCMedicationRecord (otc_id, patient_id FK, staff_id FK, medication_name, quantity, created_at)
- Add `status` enum and `service` fields to Appointment
- Add `appointment_id` FK to MedicalReport
- Add `reset_token` and `reset_token_expiry` to User

### Step 5: Create Repository Layer
**Why:** crud.py is a 28KB monolith mixing all database operations. Split into domain-specific repositories.

### Step 6: Create Service Layer
**Why:** Business logic is scattered between routers and crud.py. Services provide a clean boundary.

### Step 7: Refactor Routers to Use Services
**Why:** Routers should only handle HTTP concerns (parsing request, returning response). Business logic moves to services.

### Step 8: Add Missing Routers
- Prescription router
- OTC Medication router
- Staff router
- AI router
- Email router

### Step 9: Add Middleware & Error Handling ✅ DONE
- Global exception handler in main.py
- Request logging middleware (method, path, status, duration)

---

## Actual Final Structure (v0.7.0) ✅

```
backend/app/
├── main.py                     # FastAPI app, routers, CORS, logging middleware
├── config.py
├── database.py                 # Enums (UserRole, Gender, Class), engine, session
├── dependencies.py             # get_current_user, role-based dependency functions
├── crud.py                     # Backward-compat facade (delegates to repositories)
│
├── models/
│   ├── __init__.py             # Central import hub
│   ├── user.py                 # reset_password_token fields enabled
│   ├── patient.py
│   ├── doctor.py               # description field added
│   ├── staff.py                # NEW — staff_id FK, position
│   ├── hospital.py
│   ├── appointment.py          # status enum + service field added
│   ├── medical_report.py       # appointment_id FK + created_at added
│   ├── prescription.py         # NEW — separate table
│   ├── otc_medication.py       # NEW
│   └── chat_message.py         # role field added
│
├── schemas/
│   ├── __init__.py
│   ├── token.py, user.py, password.py
│   ├── patient.py, doctor.py, staff.py  # staff.py NEW
│   ├── hospital.py, appointment.py, medical_report.py
│   ├── prescription.py, otc_medication.py  # NEW
│   └── chat.py
│
├── repositories/
│   ├── __init__.py
│   ├── user_repository.py      # password reset token methods
│   ├── patient_repository.py   # search with RBAC
│   ├── doctor_repository.py    # get_by_specialty
│   ├── staff_repository.py     # NEW
│   ├── hospital_repository.py
│   ├── appointment_repository.py  # cancel(), complete() methods
│   ├── medical_report_repository.py
│   ├── prescription_repository.py  # NEW — get_by_patient joins via MedicalReport
│   ├── otc_medication_repository.py  # NEW
│   └── chat_repository.py
│
├── services/
│   ├── __init__.py
│   ├── auth_service.py         # authenticate, create_access_token, login, register
│   ├── user_service.py         # RBAC for update/delete
│   ├── patient_service.py      # search with pagination
│   ├── doctor_service.py       # get_by_specialty
│   ├── staff_service.py        # NEW
│   ├── appointment_service.py  # cancel, complete with role checks
│   ├── medical_report_service.py
│   ├── prescription_service.py  # NEW — doctor-only create/update/delete
│   ├── otc_medication_service.py  # NEW — staff-only create/update/delete
│   └── chat_service.py
│
└── routers/
    ├── __init__.py
    ├── auth.py                  # delegates to AuthService
    ├── users.py                 # delegates to UserService
    ├── patients.py              # delegates to PatientService
    ├── doctors.py               # specialty filter query param
    ├── staff.py                 # NEW — admin-only CRUD
    ├── hospitals.py             # delegates to HospitalRepository
    ├── appointments.py          # cancel/complete endpoints added
    ├── reports.py               # delegates to MedicalReportService
    ├── prescriptions.py         # NEW — full CRUD
    ├── otc_medications.py       # NEW — full CRUD
    ├── chat.py                  # delegates to PatientRepository
    ├── password.py              # functional (no longer stub)
    └── utils.py                 # send_email, send_password_reset_email
```

## API Prefix Map (v0.7.0)

| Prefix | Router | New in v0.7? |
|--------|--------|-------------|
| `/auth` | auth.py | — |
| `/users` | users.py | — |
| `/patients` | patients.py | — |
| `/doctors` | doctors.py | specialty filter |
| `/staff` | staff.py | ✅ NEW |
| `/hospitals` | hospitals.py | — |
| `/appointments` | appointments.py | cancel/complete |
| `/medical_reports` | reports.py | — |
| `/prescriptions` | prescriptions.py | ✅ NEW |
| `/otc_medications` | otc_medications.py | ✅ NEW |
| `/chat` | chat.py | — |
| `/password` | password.py | now functional |
- CORS configuration (restrict from `*`)

### Step 10: Frontend Alignment
- Update API calls to match new endpoints
- Add missing pages (Prescription management, Staff management)
- Connect Check-In/Out and Billing to backend

---

## Current Codebase Problems

| Problem | Location | Impact | Fix |
|---------|----------|--------|-----|
| Monolithic crud.py (28KB) | `app/crud.py` | Hard to maintain, test, navigate | Split into repositories |
| No service layer | Entire backend | Business logic in routers | Create services/ |
| All models in one file | `app/models.py` | Will grow unmanageable | Split into models/ |
| All schemas in one file | `app/schemas.py` | Same as above | Split into schemas/ |
| No appointment status | `app/models.py` | Cannot track lifecycle | Add status enum |
| CORS allows all origins | `app/main.py` | Security vulnerability | Restrict origins |
| Hardcoded hospital_id=1 | `app/crud.py` | Inflexible doctor creation | Make configurable |
| Password reset non-functional | `app/routers/password.py` | Feature doesn't work | Add DB columns, implement |
| No Alembic | `database/migrations/` | Risky manual migrations | Set up Alembic |
| Prescription as TEXT field | `medical_reports.prescription` | No structured medication data | Separate Prescription table |

---

## Technical Standards & Conventions

- **Python**: 3.11+, FastAPI, type hints everywhere
- **TypeScript**: strict mode, functional components
- **Naming**: snake_case (Python), camelCase (TypeScript), PascalCase (components)
- **API versioning**: Not yet needed (v1 implicit)
- **Response format**: Pydantic models → JSON
- **Date format**: ISO 8601 (YYYY-MM-DD)
- **Time format**: HH:MM (24-hour)
- **Pagination**: `?skip=0&limit=100` (existing pattern)

---

## Pending Tasks

- [ ] Set up Alembic
- [ ] Split models.py into models/ package
- [ ] Split schemas.py into schemas/ package
- [ ] Add Staff model
- [ ] Add Prescription model
- [ ] Add OTCMedicationRecord model
- [ ] Add status/service to Appointment
- [ ] Add appointment_id to MedicalReport
- [ ] Add password reset fields to User
- [ ] Create repository layer (from crud.py)
- [ ] Create service layer
- [ ] Refactor routers to use services
- [ ] Create prescription endpoints
- [ ] Create OTC medication endpoints
- [ ] Create staff endpoints
- [ ] Create AI endpoints
- [ ] Create email service
- [ ] Implement password reset
- [ ] Restrict CORS
- [ ] Frontend: prescription management
- [ ] Frontend: staff management
- [ ] Frontend: connect billing/check-in to backend
- [ ] Set up pytest
- [ ] Docker setup
- [ ] CI/CD pipeline

---

## Known Issues

1. Password reset returns placeholder message — needs DB columns and email integration
2. Hardcoded `hospital_id=1` in doctor creation
3. Chat history endpoint returns placeholder
4. No token refresh mechanism
5. No server-side logout (token blacklist)
6. CORS allows `*` — must restrict before production
7. No input sanitization beyond Pydantic
8. No rate limiting on AI endpoints
9. No pagination on some list endpoints
