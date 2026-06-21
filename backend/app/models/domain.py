"""SQLModel domain models for database tables."""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import uuid4
from sqlmodel import SQLModel, Field, Relationship


class User(SQLModel, table=True):
    """User account model."""

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    base_currency: str = Field(default="USD")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    expenses: list["Expense"] = Relationship(back_populates="user")
    categories: list["Category"] = Relationship(back_populates="user")
    budgets: list["Budget"] = Relationship(back_populates="user")

    class Config:
        """SQLModel config."""

        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com",
                "base_currency": "USD",
                "created_at": "2026-06-21T10:00:00Z",
            }
        }


class Category(SQLModel, table=True):
    """Expense category model."""

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str
    is_default: bool = Field(default=False)
    user_id: Optional[str] = Field(default=None, foreign_key="user.id", index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Optional[User] = Relationship(back_populates="categories")
    expenses: list["Expense"] = Relationship(back_populates="category")

    class Config:
        """SQLModel config."""

        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "Groceries",
                "is_default": True,
                "user_id": None,
                "created_at": "2026-06-21T10:00:00Z",
            }
        }


class Expense(SQLModel, table=True):
    """Expense transaction model."""

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    category_id: str = Field(foreign_key="category.id")
    amount: Decimal = Field(decimal_places=2, max_digits=10)
    description: Optional[str] = Field(default=None)
    transaction_date: str = Field(index=True)  # YYYY-MM-DD format
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: User = Relationship(back_populates="expenses")
    category: Category = Relationship(back_populates="expenses")

    class Config:
        """SQLModel config."""

        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440002",
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "category_id": "550e8400-e29b-41d4-a716-446655440001",
                "amount": "45.50",
                "description": "Weekly groceries",
                "transaction_date": "2026-06-21",
                "created_at": "2026-06-21T10:00:00Z",
            }
        }


class Budget(SQLModel, table=True):
    """Monthly budget limit model."""

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    limit_amount: Decimal = Field(decimal_places=2, max_digits=10)
    month_year: str = Field(index=True)  # YYYY-MM format
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: User = Relationship(back_populates="budgets")

    class Config:
        """SQLModel config."""

        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440003",
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "limit_amount": "2000.00",
                "month_year": "2026-06",
                "created_at": "2026-06-21T10:00:00Z",
                "updated_at": "2026-06-21T10:00:00Z",
            }
        }
