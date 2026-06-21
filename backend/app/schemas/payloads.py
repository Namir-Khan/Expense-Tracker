"""Pydantic schemas for request/response payloads."""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ============================================================================
# Auth Schemas
# ============================================================================


class UserCreate(BaseModel):
    """User registration schema."""

    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    """User login schema (OAuth2 form data)."""

    username: EmailStr  # OAuth2 uses 'username' field for email
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User response schema (no password hash)."""

    id: str
    email: str
    base_currency: str
    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


# ============================================================================
# Category Schemas
# ============================================================================


class CategoryCreate(BaseModel):
    """Category creation schema."""

    name: str = Field(min_length=1, max_length=50)


class CategoryResponse(BaseModel):
    """Category response schema."""

    id: str
    name: str
    is_default: bool
    user_id: Optional[str] = None
    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


# ============================================================================
# Expense Schemas
# ============================================================================


class ExpenseCreate(BaseModel):
    """Expense creation schema."""

    category_name: str = Field(description="Category name (e.g., 'Groceries')")
    amount: Decimal = Field(decimal_places=2, gt=0)
    description: Optional[str] = Field(default=None, max_length=500)
    transaction_date: str = Field(
        description="Date in YYYY-MM-DD format"
    )  # e.g., "2026-06-21"


class ExpenseUpdate(BaseModel):
    """Expense update schema (all fields optional)."""

    category_name: Optional[str] = Field(default=None, description="Category name")
    amount: Optional[Decimal] = Field(default=None, decimal_places=2, gt=0)
    description: Optional[str] = Field(default=None, max_length=500)
    transaction_date: Optional[str] = None


class ExpenseResponse(BaseModel):
    """Expense response schema."""

    id: str
    user_id: str
    category_id: str
    amount: Decimal
    description: Optional[str]
    transaction_date: str
    created_at: datetime
    category: Optional[CategoryResponse] = None  # Optional nested category

    class Config:
        """Pydantic config."""

        from_attributes = True


# ============================================================================
# Budget Schemas
# ============================================================================


class BudgetCreate(BaseModel):
    """Budget creation/update schema."""

    limit_amount: Decimal = Field(decimal_places=2, gt=0)
    month_year: str = Field(description="Month in YYYY-MM format")


class BudgetResponse(BaseModel):
    """Budget response schema."""

    id: str
    user_id: str
    limit_amount: Decimal
    month_year: str
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


# ============================================================================
# Analytics Schemas
# ============================================================================


class TopCategory(BaseModel):
    """Top category info."""

    name: str
    amount: Decimal


class AnalyticsSummary(BaseModel):
    """Analytics summary response."""

    total_spent: Decimal
    remaining_budget: Decimal
    top_category: Optional[TopCategory] = None


class CategoryDistribution(BaseModel):
    """Category distribution for pie charts."""

    name: str
    value: Decimal


class DailyTrend(BaseModel):
    """Daily cumulative spending trend."""

    date: str
    cumulative_amount: Decimal


# ============================================================================
# Error Schemas
# ============================================================================


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    status_code: int
