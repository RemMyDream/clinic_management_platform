# clinic-management

A comprehensive clinic management system designed to streamline operations for medical practices. It includes features for managing patient records, user authentication with role-based access control, and an administrative interface for system oversight.

## Features

*   **User Authentication**: Secure registration and login for different user roles (Admin, Doctor, Patient).
*   **Role-Based Access Control**: Differentiated access to features based on user roles.
*   **Patient Management**: Create, view, update, and delete patient profiles.
*   **Admin Dashboard**: System administration capabilities.
*   **API**: RESTful API for backend services.
*   **Chat Functionality**: Integrated chat for communication (details TBD based on `routers/chat.py`).

## Tech Stack

*   **Backend**:
    *   Python 3.11+
    *   FastAPI
    *   SQLAlchemy
    *   PostgreSQL
    *   Pydantic
    *   Uvicorn (ASGI server)
*   **Frontend**:
    *   React
    *   TypeScript
    *   Node.js / npm

## Git Branching Strategy

This project follows a structured Git branching strategy to ensure clean development workflows and code stability.

### Branch Types

#### Main Branches
*   **`main`**: Production-ready code. All code in this branch should be stable and deployable.
*   **`develop`**: Integration branch for features. This is where feature branches are merged and tested together.

#### Supporting Branches

#### Feature Branches
*   **Naming**: `feature/[feature-name]` or `feature/[use-case]-[brief-description]`
*   **Examples**: 
    *   `feature/patient-dashboard`
    *   `feature/uc3-chatbot`
    *   `feature/user-authentication`
*   **Purpose**: Develop new features
*   **Branched from**: `develop`
*   **Merged into**: `develop`
*   **Lifetime**: Deleted after merge

#### Bugfix Branches
*   **Naming**: `bugfix/[bug-description]` or `bugfix/[use-case]-[brief-description]`
*   **Examples**: 
    *   `bugfix/login-validation-error`
    *   `bugfix/uc2-patient-data-display`
*   **Purpose**: Fix bugs found in `develop` branch
*   **Branched from**: `develop`
*   **Merged into**: `develop`
*   **Lifetime**: Deleted after merge

#### Hotfix Branches
*   **Naming**: `hotfix/[version]` or `hotfix/[critical-issue-description]`
*   **Examples**: 
    *   `hotfix/v1.2.1`
    *   `hotfix/security-vulnerability`
*   **Purpose**: Fix critical issues in production
*   **Branched from**: `main`
*   **Merged into**: Both `main` and `develop`
*   **Lifetime**: Deleted after merge

#### Release Branches
*   **Naming**: `release/[version]`
*   **Examples**: 
    *   `release/v1.0.0`
    *   `release/v2.1.0`
*   **Purpose**: Prepare new production releases
*   **Branched from**: `develop`
*   **Merged into**: Both `main` and `develop`
*   **Lifetime**: Deleted after merge

### Current Branch Status
*   **`main`**: Production-ready stable code
*   **`develop`**: ✅ **Now available** - Integration branch for all new development
*   **Existing feature branches**: Currently based on `main` (transition guidance below)

### Workflow Guidelines

#### For New Features (Going Forward)
1. Create feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Develop and commit your changes:
   ```bash
   git add .
   git commit -m "feat: add patient dashboard functionality"
   ```

3. Push feature branch and create Pull Request:
   ```bash
   git push origin feature/your-feature-name
   ```

4. After code review and approval, merge into `develop`
5. Delete feature branch after merge

#### For Existing Feature Branches (Transition Period)
Since your current feature branches (`feature/IChatbotService`, `feature/forgot_reset_password`, `feature/uc3_chatbot`) are based on `main`:

1. **Continue development normally** on these branches
2. **When ready to merge**, merge them into `develop` instead of `main`:
   ```bash
   git checkout develop
   git merge feature/your-existing-branch
   git push origin develop
   ```
3. **Delete the feature branch** after successful merge

#### For Bug Fixes
1. Create bugfix branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b bugfix/fix-description
   ```

2. Fix the bug and commit:
   ```bash
   git add .
   git commit -m "fix: resolve patient data validation issue"
   ```

3. Follow same PR process as features

#### For Critical Hotfixes
1. Create hotfix branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/v1.0.1
   ```

2. Fix the issue and update version:
   ```bash
   git add .
   git commit -m "hotfix: fix critical security vulnerability"
   ```

3. Merge into both `main` and `develop`:
   ```bash
   # Merge into main
   git checkout main
   git merge hotfix/v1.0.1
   git tag v1.0.1
   
   # Merge into develop
   git checkout develop
   git merge hotfix/v1.0.1
   ```

### Commit Message Conventions

Follow conventional commit format:
*   **feat**: New features (`feat: add chatbot widget component`)
*   **fix**: Bug fixes (`fix: resolve login authentication error`)
*   **docs**: Documentation changes (`docs: update API endpoint documentation`)
*   **style**: Code style changes (`style: format patient dashboard components`)
*   **refactor**: Code refactoring (`refactor: optimize database queries`)
*   **test**: Adding tests (`test: add unit tests for user service`)
*   **chore**: Maintenance tasks (`chore: update dependencies`)

### Pull Request Guidelines

#### Before Creating a PR
*   Ensure your branch is up to date with the target branch
*   Run tests locally: `npm test` (frontend) and `pytest` (backend)
*   Check code formatting and linting
*   Write meaningful commit messages

#### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No merge conflicts
```

### Branch Protection Rules

For production environments, consider implementing:
*   **`main` branch**: Require PR reviews, status checks, and up-to-date branches
*   **`develop` branch**: Require PR reviews and status checks
*   No direct pushes to `main` or `develop` branches
*   Require signed commits for security

### Integration with CI/CD

*   **Feature branches**: Run tests and linting
*   **`develop` branch**: Run full test suite and deploy to staging
*   **`main` branch**: Run tests, security scans, and deploy to production
*   **Release branches**: Generate release notes and artifacts

## Project Structure

The project is organized into two main directories:
*   `backend/`: Contains the FastAPI application, including API routers, database models, schemas, CRUD operations, and business logic.
*   `frontend/`: Contains the React-based user interface.

## Setup and Installation

### Prerequisites

*   Python 3.11 or higher
*   Node.js and npm (latest LTS version recommended)
*   PostgreSQL server installed and running
**.env** setup: DATABASE_URL = postgresql://postgres:password@34.67.156.97:5432/clinic-management-v2
### Backend Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/bnmbanhmi/clinic-management
    cd clinic-management
    ```

2.  **Navigate to the backend directory and create/activate a virtual environment**:
    ```bash
    cd backend
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```

3.  **Install dependencies**:
    (Ensure `requirements.txt` is in the project root directory)
    ```bash
    pip install -r ../requirements.txt
    ```

4.  **Configure Environment Variables**:
    Create a `.env` file in the `backend/` directory (alongside `app/`) with the following content. Adjust values as per your local setup.
    ```env
    DATABASE_URL="postgresql://your_db_user:your_db_password@your_db_host:your_db_port/your_db_name"
    SECRET_KEY="your_very_strong_and_secret_key_here"
    ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    # Optional: For OpenAI chat functionality, if used
    # OPENAI_API_KEY="your_openai_api_key"
    ```
    Replace `your_db_user`, `your_db_password`, `your_db_host`, `your_db_port`, and `your_db_name` with your actual PostgreSQL connection details.

5.  **Initialize the Database and Create Initial Admin User**:
    Ensure your PostgreSQL server is running and the database specified in `DATABASE_URL` exists.
    From the `backend/` directory, run the script:
    ```bash
    python app/create_initial_admin.py
    ```
    This script will create the necessary database tables and an initial admin user with credentials:
    *   Email: `admin@example.com`
    *   Password: `adminpassword`

### Frontend Setup

1.  **Navigate to the frontend directory** (from the project root):
    ```bash
    cd frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Running the Application

### Backend

1.  Ensure your virtual environment in `backend/.venv` is activated.
2.  Navigate to the `backend/` directory.
3.  Start the FastAPI server:
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    The API will be accessible at `http://localhost:8000`. Interactive API documentation (Swagger UI) will be available at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

### Frontend

1.  Navigate to the `frontend/` directory.
2.  Start the React development server:
    ```bash
    npm start
    ```
    The application will typically open in your browser at `http://localhost:3000`.

## API Endpoints Overview

The backend provides several API endpoints for managing users, patients, and authentication. Key endpoints include:

*   `POST /auth/token`: Obtain JWT token for login.
*   `POST /auth/register/`: Register new users.
    *   Admins can create users with `ADMIN` or `DOCTOR` roles.
    *   Doctors can create users with the `PATIENT` role.
*   `GET /users/me/`: Get current authenticated user's details.
*   `POST /patients/`: Create a patient profile (requires an existing user with `PATIENT` role, typically done by a Doctor or Admin after registering the patient user).
*   `GET /patients/`: List patient profiles (access controlled).
*   `GET /chat/`: (If fully implemented) Endpoints for chat functionality.

For a complete and interactive list of API endpoints, refer to the auto-generated documentation at `http://localhost:8000/docs` when the backend server is running.

API Versions:
- v0.1.2: Introduced new API for `database-v2`.
- v0.1.3: Added appointments API.
- v0.1.4: Added doctorAPI, hospitalsAPI and updated `crud.create_user` to insert records not only into the `users` table but also into the `patients` or `doctors` tables, as appropriate.
- v0.5.0: Add API for reset password, Chatbot API
- v0.5.1: Fixing API point for reset password (not finish yet)
- v0.6.0: Add `search_patient` API, EMR API, update user API for updating profile.

To check the current API version, send a `GET` request to the root endpoint (`/`).