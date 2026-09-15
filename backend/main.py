from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.database import Base, engine, ensure_sqlite_users_schema, ensure_sqlite_settings_schema
from app import models  # noqa: F401  (ensures models are registered before create_all)
from app.config import settings
from app.rate_limit import limiter
from app.routers import (
    auth_router,
    checkin_router,
    journal_router,
    favorites_router,
    settings_router,
    journey_router,
    recommendations_router,
    reports_router,
    export_router,
    organizations_router,
    themes_router,
    testimonials_router,
    consultants_router,
    admin_router,
)

if settings.AUTO_CREATE_SCHEMA:
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_users_schema()
    ensure_sqlite_settings_schema()

app = FastAPI(
    title="Encourage Me API",
    description="Backend for Encourage Me — an emotional wellness platform. Built and Powered by Emtrixz Technology.",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(checkin_router.router)
app.include_router(journal_router.router)
app.include_router(favorites_router.router)
app.include_router(settings_router.router)
app.include_router(journey_router.router)
app.include_router(recommendations_router.router)
app.include_router(reports_router.router)
app.include_router(export_router.router)
app.include_router(themes_router.router)
app.include_router(testimonials_router.router)
app.include_router(organizations_router.router)
app.include_router(consultants_router.router)
app.include_router(admin_router.router)


@app.get("/")
def root():
    return {
        "app": "Encourage Me",
        "status": "running",
        "message": "Built and Powered by Emtrixz Technology",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}