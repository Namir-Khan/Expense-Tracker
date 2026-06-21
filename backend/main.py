"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from decimal import Decimal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import create_db_and_tables
from app.api.routers import auth, expenses, categories, budgets, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    
    Runs on startup and shutdown.
    """
    # Startup: Create database tables
    create_db_and_tables()
    print("✓ Database initialized")
    yield
    # Shutdown: Cleanup if needed
    print("✓ Application shutdown")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    json_encoders={Decimal: lambda v: float(v)},
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    auth.router,
    prefix=settings.API_V1_STR,
)
app.include_router(
    expenses.router,
    prefix=settings.API_V1_STR,
)
app.include_router(
    categories.router,
    prefix=settings.API_V1_STR,
)
app.include_router(
    budgets.router,
    prefix=settings.API_V1_STR,
)
app.include_router(
    analytics.router,
    prefix=settings.API_V1_STR,
)


@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "message": "Expense Tracking & Budget Management API",
        "version": settings.PROJECT_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
    )
