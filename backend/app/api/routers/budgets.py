"""Budget management endpoints."""
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlmodel import Session, select
from ...db.session import get_session
from ...models.domain import User, Budget
from ...schemas.payloads import BudgetCreate, BudgetResponse
from .deps_router import get_current_user

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=Optional[BudgetResponse])
async def get_budget(
    month_year: str = Query(description="Month in YYYY-MM format"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Optional[Budget]:
    """
    Get budget limit for a specific month.

    Args:
        month_year: Month in YYYY-MM format (e.g., "2026-06")
        current_user: Current authenticated user
        session: Database session

    Returns:
        Budget object or None if not set
    """
    statement = select(Budget).where(
        (Budget.user_id == current_user.id) & (Budget.month_year == month_year)
    )
    budget = session.exec(statement).first()

    return budget


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def set_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Budget:
    """
    Set or update budget limit for a specific month.

    Args:
        budget_data: Budget details (limit_amount and month_year)
        current_user: Current authenticated user
        session: Database session

    Returns:
        Created or updated budget
    """
    # Check if budget already exists
    statement = select(Budget).where(
        (Budget.user_id == current_user.id) & (Budget.month_year == budget_data.month_year)
    )
    existing_budget = session.exec(statement).first()

    if existing_budget:
        # Update existing budget
        existing_budget.limit_amount = budget_data.limit_amount
        session.add(existing_budget)
        session.commit()
        session.refresh(existing_budget)
        return existing_budget

    # Create new budget
    budget = Budget(
        user_id=current_user.id,
        limit_amount=budget_data.limit_amount,
        month_year=budget_data.month_year,
    )
    session.add(budget)
    session.commit()
    session.refresh(budget)

    return budget
