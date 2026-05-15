# Clinic Management System — Testing Tutorial

> **Version:** 0.7.0
> **Last Updated:** 2026-05-15

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Start Infrastructure (Docker)](#2-start-infrastructure-docker)
3. [Start Backend](#3-start-backend)
4. [Start Frontend](#4-start-frontend)
5. [Seed Test Data](#5-seed-test-data)
6. [Test Accounts](#6-test-accounts)
7. [Test: PATIENT Role](#7-test-patient-role)
8. [Test: DOCTOR Role](#8-test-doctor-role)
9. [Test: CLINIC_STAFF Role](#9-test-clinic_staff-role)
10. [Test: ADMIN Role](#10-test-admin-role)
11. [Test: Public Features (No Login)](#11-test-public-features-no-login)
12. [Test: API Endpoints Directly (Swagger)](#12-test-api-endpoints-directly-swagger)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

Make sure the following are installed:

| Tool | Version | Check Command |
|------|---------|---------------|
| Docker Desktop | Latest | `docker --version` |
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | Any | `git --version` |

---

## 2. Start Infrastructure (Docker)

The app requires **PostgreSQL 17** and **Redis 7**. Both are configured in `docker-compose.yml`.

```bash
# From the project root directory
docker compose up -d
```

Verify containers are running:

```bash
docker compose ps
```

Expected output:

| Container | Status | Port |
|-----------|--------|------|
| clinic-postgres | running (healthy) | 5432 |
| clinic-redis | running (healthy) | 6379 |

To check database connectivity:

```bash
docker exec -it clinic-postgres psql -U clinic_user -d clinic_management -c "\dt"
```

> **Note:** On first run the database will be empty. Tables are created automatically when the backend starts.

---

## 3. Start Backend

### 3.1 Configure environment

```bash
cd backend

# Copy the example env file (skip if .env already exists)
copy .env.example .env
```

Edit `backend/.env` and fill in required values:

```env
# Required — must match docker-compose.yml
DATABASE_URL=postgresql://clinic_user:clinic_password@localhost:5432/clinic_management
REDIS_URL=redis://localhost:6379/0

# Required — JWT settings
SECRET_KEY=your_random_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Required — for AI chatbot functionality
GOOGLE_API_KEY=your_google_api_key_here

# Required — must match frontend port
FRONTEND_URL=http://localhost:3000
```

### 3.2 Install dependencies

```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose[cryptography] passlib[bcrypt] pydantic pydantic-settings python-dotenv python-multipart redis google-generativeai
```

### 3.3 Start the server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify: open http://localhost:8000 — you should see:

```json
{
  "message": "Welcome to Clinic Management API",
  "version": "v0.7.0"
}
```

Swagger docs: http://localhost:8000/docs

---

## 4. Start Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm start
```

The app opens at http://localhost:3000. You should see the **Login page**.

---

## 5. Seed Test Data

The seed script creates 1 admin, 1 hospital, 2 doctors, 2 staff, and 10 patients.

Open a **new terminal**:

```bash
cd backend
python -m app.create_initial_admin
```

Expected output:

```
✅ Admin user created: bnmbanhmi (ID: 1)
✅ Default hospital created: Default Medical Center (ID: 1)
✅ Doctor created: Dr. John Smith (ID: 2)
✅ Doctor created: Dr. Sarah Johnson (ID: 3)
✅ Staff created: Mary Williams (Head Nurse) (ID: 4)
✅ Staff created: James Brown (Receptionist) (ID: 5)
✅ Patient created: Alice Wilson (ID: 6)
...
🎉 Initial user creation completed!
```

---

## 6. Test Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **ADMIN** | `bachnhatminh0212@gmail.com` | `02122004` | Full system access |
| **DOCTOR** | `dr.smith@clinic.com` | `doctor123` | Cardiology |
| **DOCTOR** | `dr.johnson@clinic.com` | `doctor123` | Pediatrics |
| **STAFF** | `mary.nurse@clinic.com` | `staff123` | Head Nurse |
| **STAFF** | `james.reception@clinic.com` | `staff123` | Receptionist |
| **PATIENT** | `alice.wilson@email.com` | `patient123` | Patient |
| **PATIENT** | `bob.martinez@email.com` | `patient123` | Patient |

> **Login uses email** as the username field.

---

## 7. Test: PATIENT Role

### 7.1 Register a new patient

1. Go to http://localhost:3000/register
2. Fill in: username, email, full name, password
3. Click **Đăng ký**
4. Should see success toast and redirect to login

### 7.2 Login

1. Go to http://localhost:3000/login
2. Enter email: `alice.wilson@email.com`, password: `patient123`
3. Should redirect to **Patient Dashboard** (`/dashboard`)

### 7.3 Patient Dashboard

Verify the dashboard shows:
- **Stat cards:** Today's appointments, Upcoming, Completed, Prescriptions
- **Quick actions:** Book appointment, Medical history, Prescriptions
- **Today's appointments table** (empty if no appointments booked yet)
- **AI Health Assistant** chatbot (inline)

### 7.4 Book an Appointment

1. Click **Đặt lịch khám** in sidebar (or quick action)
2. **Step 1 — Filters:**
   - Select a date range (e.g., tomorrow to next week)
   - Optionally select a doctor
   - Click **Tìm lịch trống**
3. **Step 2 — Available Slots:**
   - See available time slots with doctor names
   - Click a slot to select it
4. **Step 3 — Confirm:**
   - Enter a reason for visit
   - Click **Xác nhận đặt lịch**
5. **Step 4 — Success message** should appear

**Edge cases to test:**
- Try booking with empty date range → should show error
- Try date range where dateFrom > dateTo → should show error

### 7.5 View My Appointments

1. Click **Lịch khám của tôi** in sidebar
2. See a **calendar view** with dots on appointment dates
3. Click a date → see appointments in the table below
4. Click an appointment row → modal with details opens
5. Test **Hủy lịch hẹn** (Cancel) on a Scheduled appointment
6. Test **Thay đổi lịch** (Reschedule) — select new date/time

### 7.6 View Prescriptions

1. Click **Đơn thuốc** in sidebar
2. Shows list of prescriptions (empty if doctor hasn't created any yet)
3. Click a prescription card → detail panel shows medication info

### 7.7 View Medical History

1. Click **Lịch sử khám bệnh** in sidebar
2. Toggle between **Timeline** and **Grid** view
3. Use search filters: patient name, diagnosis, date range, status
4. Click a report → detail panel with diagnosis, vitals, treatment
5. Test **Xuất file** (Export CSV) and **In** (Print)

### 7.8 AI Chatbot

1. The chatbot widget appears on the dashboard (inline)
2. Type a health question → should get AI response
3. On non-dashboard pages, a **floating chatbot** appears in bottom-right

---

## 8. Test: DOCTOR Role

### 8.1 Login

1. Email: `dr.smith@clinic.com`, Password: `doctor123`
2. Should redirect to **Doctor Dashboard**

### 8.2 Doctor Dashboard

Verify:
- **Stat cards:** Today's appointments, Total patients, Upcoming, Completed today, Medical reports
- **Quick actions:** View schedule, Search patients, Create EMR, Medical reports, Medical history, Prescriptions
- **Today's schedule table** with patient names and status

### 8.3 View Doctor Schedule

1. Click **Lịch trình của tôi** in sidebar
2. See a calendar with appointments for this doctor
3. Shows appointments with time, patient, reason, status

### 8.4 Search Patients

1. Click **Danh sách bệnh nhân** in sidebar
2. Use search filters: name, phone, insurance number, ID, gender, age range
3. Click search → results appear with patient cards
4. Click a patient card → see full patient profile and EMR summary

### 8.5 Create Medical Report (EMR)

1. Click **Tạo hồ sơ mới** in sidebar
2. **Step 1:** Select a patient from the dropdown (shows today's appointments)
3. **Step 2:** Fill in the medical report form:
   - Diagnosis (Chẩn đoán ban đầu)
   - Reason for visit (Lý do khám)
   - Treatment process (Quá trình điều trị)
   - Vital signs: pulse, temperature, blood pressure, respiratory rate, weight
   - Personal/family history
   - Doctor notes
4. **Step 3:** Add prescriptions:
   - Click **+ Thêm thuốc**
   - Fill in: medication name, dosage, quantity
   - Add multiple medications
5. Click **Lưu hồ sơ** (Save) → should show success

### 8.6 Manage Medical Reports

1. Click **Hồ sơ bệnh án** in sidebar → goes to `/dashboard/records`
2. Alternatively, use quick action **Báo cáo y tế** → `/dashboard/medical-reports`
3. See list of reports this doctor created
4. Click a report → detail panel
5. Test **Sửa** (Edit) → modal with editable fields
6. Test **Xuất** (Export CSV)
7. Test **Xóa** (Delete) → confirmation dialog

### 8.7 AI Chatbot (Doctor Mode)

- The doctor chatbot can be used with patient context
- In non-dashboard pages, the floating chatbot sends requests as doctor role

---

## 9. Test: CLINIC_STAFF Role

### 9.1 Login

1. Email: `mary.nurse@clinic.com`, Password: `staff123`
2. Should redirect to **Staff Dashboard**

### 9.2 Staff Dashboard

Verify:
- **Stat cards:** Today's appointments, Total patients, Pending check-ins, Completed today
- **Quick actions:** Schedule appointment, Search patients, Check-in
- **Today's schedule table** with patient names, doctor, reason, status (Vietnamese labels)

### 9.3 Schedule Appointment (for a patient)

1. Click **Sắp xếp lịch hẹn** in sidebar
2. **Step 1:** Search and select a patient
3. **Step 2:** Select a doctor
4. **Step 3:** Pick date → see available time slots
5. **Step 4:** Enter reason → confirm booking
6. Should see success message

### 9.4 Check-In / Check-Out

1. Click **Đăng ký / Thanh toán** in sidebar
2. See today's appointments divided into tabs:
   - **Đang chờ** (Scheduled) — with action buttons
   - **Hoàn thành** (Completed)
3. **Statistics bar:** Total, Pending, Completed, Cancelled counts
4. Use **search box** to filter by patient/doctor/reason
5. Click **✓ Hoàn thành** on a Scheduled appointment → marks as Completed
6. Click **Hủy lịch** → confirmation dialog → marks as Canceled
7. Refresh → appointment moves to correct tab

### 9.5 Search Patients

1. Click **Đăng ký bệnh nhân** in sidebar
2. Same patient search as Doctor role (filters, profile view)

---

## 10. Test: ADMIN Role

### 10.1 Login

1. Email: `bachnhatminh0212@gmail.com`, Password: `02122004`
2. Should redirect to **Admin Dashboard**

### 10.2 Admin Dashboard

Verify:
- **Stat cards:** Total users, Patients, Doctors, Staff (real counts from API)
- **Quick actions:** User Management, Reports & Analytics, Schedule Settings, System Logs
- **System overview** section

### 10.3 User Management

1. Click **Quản lý người dùng** in sidebar or quick action
2. See full user list with role, email, actions
3. **Create user:** Click create → fill form with role selection (PATIENT, DOCTOR, STAFF, ADMIN)
4. **Edit user:** Click edit on a row → modify details
5. **Delete user:** Click delete → confirmation → user removed

**Important test:** Verify that when admin creates a DOCTOR user, a doctor profile is also created (linked to a hospital).

### 10.4 Reports & Analytics

1. Click **Báo cáo & Phân tích** in sidebar
2. See statistics:
   - Total users, patients, doctors, staff
   - Today / weekly / monthly appointments
   - **Status breakdown:** Scheduled, Completed, Canceled (real data from `status` field)
3. Toggle period: **Week / Month / Year** → trend charts update
4. Test **Xuất CSV** (Export) button

### 10.5 Schedule Settings

1. Click **Cài đặt lịch trình** in sidebar
2. View/configure scheduling parameters
3. (Note: backend API for saving schedule settings is not yet implemented — UI only)

### 10.6 System Logs

1. Click **Nhật ký hệ thống** in sidebar
2. View system activity logs
3. Use filters: level, category, date range
4. (Note: backend logging API is not yet implemented — uses generated mock data)

---

## 11. Test: Public Features (No Login)

### 11.1 Public Chatbot

1. Go to http://localhost:3000/login (or any non-dashboard page)
2. A **floating chatbot** widget appears in the bottom-right corner
3. Click it → type a general health question
4. Should get a response from the public chatbot (no auth required)

### 11.2 Forgot Password Flow

1. On the login page, click **Quên mật khẩu?**
2. Enter a registered email address
3. Click **Gửi liên kết đặt lại**
4. Should see message: "If an account with that email exists, a password reset link has been sent."
5. (Note: actual email sending requires SMTP configuration in `.env`)

### 11.3 Registration

1. Go to http://localhost:3000/register
2. Fill in all fields → submit
3. **Security test:** Verify that the registered user always gets PATIENT role (cannot escalate to ADMIN/DOCTOR via API manipulation)

---

## 12. Test: API Endpoints Directly (Swagger)

Open http://localhost:8000/docs for interactive API documentation.

### 12.1 Authentication

1. Click **POST /auth/token** → Try it out
2. Enter `username` (email) and `password` → Execute
3. Copy the `access_token` from the response
4. Click the **Authorize** button (top-right) → paste the token → Authorize

### 12.2 Key Endpoints to Test

| Endpoint | Method | Role Required | What to Test |
|----------|--------|---------------|--------------|
| `/auth/register` | POST | None | Register new patient |
| `/auth/token` | POST | None | Login, get JWT token |
| `/users/me` | GET | Any | Get current user profile |
| `/users/` | GET | Admin | List all users |
| `/patients/search` | POST | Any auth | Search with filters |
| `/doctors/` | GET | Any auth | List doctors (optional `?specialty=` filter) |
| `/appointments/book` | POST | Any auth | Book appointment |
| `/appointments/me` | GET | Any auth | Get my appointments |
| `/appointments/` | GET | Staff/Admin | List all appointments |
| `/appointments/{id}/cancel` | POST | Owner/Staff/Admin | Cancel appointment |
| `/appointments/{id}/complete` | POST | Doctor/Staff/Admin | Complete appointment |
| `/medical_reports/` | GET | Any auth | Role-filtered report list |
| `/medical_reports/` | POST | Doctor | Create medical report |
| `/prescriptions/` | POST | Doctor | Create prescription |
| `/prescriptions/by-patient/{id}` | GET | Any auth | Get patient's prescriptions |
| `/otc_medications/` | POST | Staff/Admin | Record OTC dispensing |
| `/chat/public` | POST | None | Public chatbot |
| `/chat/patient` | POST | Patient | Patient AI chat |
| `/chat/send` | POST | Doctor/Staff | EMR-assisted chat |

### 12.3 Authorization Tests

Verify these access controls work:

| Test | Expected Result |
|------|-----------------|
| Patient calls `GET /appointments/` | 403 Forbidden |
| Patient calls `POST /medical_reports/` | 403 Forbidden |
| Doctor calls `DELETE /users/{id}` | 403 Forbidden |
| Unauthenticated call to `GET /appointments/me` | 401 Unauthorized |
| Doctor updates another doctor's medical report | 403 Forbidden |
| Admin updates any medical report | 200 OK |
| Self-registration with `role: "ADMIN"` | Still creates PATIENT role |

---

## 13. Troubleshooting

### Docker containers won't start

```bash
# Check logs
docker compose logs postgres
docker compose logs redis

# Restart
docker compose down
docker compose up -d
```

### Backend: "Could not connect to database"

- Verify Docker containers are running: `docker compose ps`
- Verify `.env` DATABASE_URL matches docker-compose.yml credentials
- Check PostgreSQL port is not used by another process: `netstat -an | findstr 5432`

### Backend: "GOOGLE_API_KEY" error

- The AI chatbot requires a valid Google API key (Gemini)
- Get one from: https://aistudio.google.com/app/apikey
- Set it in `backend/.env`

### Frontend: Blank page after login

- Open browser DevTools (F12) → Console tab
- Check for CORS errors → verify `FRONTEND_URL=http://localhost:3000` in `.env`
- Check for 401 errors → token may be expired, clear localStorage and re-login

### Frontend: "Network Error" on API calls

- Verify backend is running on port 8000
- Verify `REACT_APP_BACKEND_URL` is set correctly (or not set, defaults to `http://localhost:8000`)
- Check browser DevTools → Network tab for failed requests

### Login fails with correct credentials

- The login form sends `username` field but uses **email** as the value
- Make sure you're entering the **email address**, not the username
- Check the backend terminal for error logs

### Seed script fails

- Make sure the backend `.env` file exists with correct `DATABASE_URL`
- Make sure Docker Postgres container is running and healthy
- Run from the `backend/` directory: `python -m app.create_initial_admin`

### Reset everything

```bash
# Stop all containers and delete data volumes
docker compose down -v

# Restart fresh
docker compose up -d

# Wait for healthy status, then re-seed
cd backend
python -m app.create_initial_admin
```
