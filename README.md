# Clinic Management System

A comprehensive clinic management system built with FastAPI (Backend) and React (Frontend).

## Quick Start Guide

### 1. Prerequisites
*   **Python**: 3.11+
*   **Node.js**: Latest LTS
*   **PostgreSQL**: Version 14 (Running via Homebrew)

### 2. Database Management
If you are using Mac with Homebrew, use these commands to manage the PostgreSQL service:

*   **Start**: `brew services start postgresql@14`
*   **Stop**: `brew services stop postgresql@14`
*   **Restart**: `brew services restart postgresql@14`
*   **Status**: `brew services list`
*   **Check Connectivity**: `pg_isready`

### 3. Backend Setup
The backend is configured to use a local PostgreSQL database named `clinic-management-v2`.

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment (if not already done)
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r ../requirements.txt

# Initialize database and seed initial data
python app/create_initial_admin.py
```

**Environment Variables (`backend/.env`):**
```env
DATABASE_URL="postgresql:///clinic-management-v2"
SECRET_KEY="clinic_management_secret_key"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_API_KEY="your_actual_key_here"  # Required for chatbot features
```

### 4. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install
```

---

## Running the Application

### Backend Server
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*   **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **Version Check**: `GET http://localhost:8000/` should return `v0.6.0`

### Frontend Server
```bash
cd frontend
npm start
```
*   **Web App**: [http://localhost:3000](http://localhost:3000)

---

## Initial Credentials
Use these to log in for the first time:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `adminpassword` |

---

## Development Info
*   **Architecture**: REST API with FastAPI, SQLAlchemy, and Pydantic.
*   **Database**: PostgreSQL.
*   **AI Integration**: Google Gemini SDK (`gemma-3-27b-it`) for clinical assistance and general inquiries.

*For original detailed documentation, see [archive.md](archive.md).*
