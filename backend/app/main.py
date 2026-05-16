import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import create_db_and_tables
from .routers import (
    auth, users, chat, patients, appointments,
    doctors, hospitals, password, reports,
    staff, prescriptions, otc_medications, provinces,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    from .database import SessionLocal, engine
    from .seed_provinces import seed_provinces
    from sqlalchemy import text
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        try:
            conn.execute(text("ALTER TYPE appointmentstatus ADD VALUE IF NOT EXISTS 'Pending'"))
            conn.execute(text("ALTER TYPE appointmentstatus ADD VALUE IF NOT EXISTS 'Confirmed'"))
        except Exception:
            pass
    db = SessionLocal()
    try:
        seed_provinces(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Clinic Management API",
    description="API for Clinic Management, a healthcare access platform for rural communities.",
    version="0.7.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request logging middleware ─────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 1)
    logger.info(
        "%s %s → %s (%sms)",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    return response


# ── Global error handler ───────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


# ── Routers ───────────────────────────────────────────────────────────
app.include_router(auth.router,            prefix="/auth",            tags=["Authentication"])
app.include_router(users.router,           prefix="/users",           tags=["Users"])
app.include_router(patients.router,        prefix="/patients",        tags=["Patients"])
app.include_router(doctors.router,         prefix="/doctors",         tags=["Doctors"])
app.include_router(staff.router,           prefix="/staff",           tags=["Staff"])
app.include_router(hospitals.router,       prefix="/hospitals",       tags=["Hospitals"])
app.include_router(appointments.router,    prefix="/appointments",    tags=["Appointments"])
app.include_router(reports.router,         prefix="/medical_reports", tags=["Medical Reports"])
app.include_router(prescriptions.router,   prefix="/prescriptions",   tags=["Prescriptions"])
app.include_router(otc_medications.router, prefix="/otc_medications", tags=["OTC Medications"])
app.include_router(chat.router,            prefix="/chat",            tags=["Chat"])
app.include_router(password.router,        prefix="/password",        tags=["Password"])
app.include_router(provinces.router,       prefix="/provinces",       tags=["Provinces"])


@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": "Welcome to Clinic Management API",
        "version": "v0.7.0",
    }
