"""Application configuration and environment variables."""
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Expense Tracking & Budget Management API"
    PROJECT_VERSION: str = "1.0.0"
    DESCRIPTION: str = "A production-ready REST API for expense tracking and budget management"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 * 24 * 60  # 30 days

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./expenses.db")
    # SQLAlchemy SQLite specific: https://docs.sqlalchemy.org/en/20/dialects/sqlite/index.html
    SQLALCHEMY_ECHO: bool = os.getenv("SQLALCHEMY_ECHO", "False").lower() == "true"

    # CORS
    CORS_ORIGINS: list[str] = ["*"]  # Allow all origins for development

    # JWT
    JWT_SUBJECT: str = "access"

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    RELOAD: bool = os.getenv("RELOAD", "True").lower() == "true"

    @classmethod
    def get_database_url_sqlite(cls) -> str:
        """Return SQLite connection string with proper configuration for SQLModel."""
        return "sqlite:///./expenses.db"


settings = Settings()
