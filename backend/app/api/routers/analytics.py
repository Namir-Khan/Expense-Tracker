"""Analytics and reporting endpoints."""
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func
from datetime import datetime
from ...db.session import get_session
from ...models.domain import User, Expense, Category, Budget
from ...schemas.payloads import (
    AnalyticsSummary,
    CategoryDistribution,
    DailyTrend,
)
from .deps_router import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary(
    month_year: str = Query(description="Month in YYYY-MM format"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> AnalyticsSummary:
    """
    Get monthly spending summary.

    Args:
        month_year: Month in YYYY-MM format (e.g., "2026-06")
        current_user: Current authenticated user
        session: Database session

    Returns:
        Summary with total spent, remaining budget, and top category
    """
    # Get all expenses for the month
    statement = select(Expense).where(
        (Expense.user_id == current_user.id)
        & (Expense.transaction_date.startswith(month_year))
    )
    expenses = session.exec(statement).all()

    # Calculate total spent
    total_spent = sum(expense.amount for expense in expenses)
    if total_spent is None:
        total_spent = Decimal("0.00")

    # Get budget for the month
    budget_statement = select(Budget).where(
        (Budget.user_id == current_user.id) & (Budget.month_year == month_year)
    )
    budget = session.exec(budget_statement).first()

    # Calculate remaining budget
    remaining_budget = Decimal("0.00")
    if budget:
        remaining_budget = budget.limit_amount - total_spent

    # Find top category
    top_category = None

    if expenses:
        # Group by category and sum amounts
        category_totals = {}
        for expense in expenses:
            category_id = expense.category_id
            if category_id not in category_totals:
                category_totals[category_id] = Decimal("0.00")
            category_totals[category_id] += expense.amount

        # Find category with highest total
        if category_totals:
            top_cat_id = max(category_totals, key=category_totals.get)
            top_cat_obj = session.get(Category, top_cat_id)
            if top_cat_obj:
                from ...schemas.payloads import TopCategory
                top_category = TopCategory(
                    name=top_cat_obj.name,
                    amount=category_totals[top_cat_id],
                )

    return AnalyticsSummary(
        total_spent=total_spent,
        remaining_budget=remaining_budget,
        top_category=top_category,
    )


@router.get("/distribution", response_model=list[CategoryDistribution])
async def get_distribution(
    month_year: str = Query(description="Month in YYYY-MM format"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[CategoryDistribution]:
    """
    Get expense distribution by category for the month (for pie charts).

    Args:
        month_year: Month in YYYY-MM format (e.g., "2026-06")
        current_user: Current authenticated user
        session: Database session

    Returns:
        List of categories with their total amounts
    """
    # Get all expenses for the month
    statement = select(Expense).where(
        (Expense.user_id == current_user.id)
        & (Expense.transaction_date.startswith(month_year))
    )
    expenses = session.exec(statement).all()

    # Group by category
    category_totals = {}
    for expense in expenses:
        category_id = expense.category_id
        if category_id not in category_totals:
            category_totals[category_id] = Decimal("0.00")
        category_totals[category_id] += expense.amount

    # Build response with category names
    distribution = []
    for category_id, total_amount in category_totals.items():
        category = session.get(Category, category_id)
        if category:
            distribution.append(
                CategoryDistribution(
                    name=category.name,
                    value=total_amount,
                )
            )

    # Sort by value descending
    distribution.sort(key=lambda x: x.value, reverse=True)

    return distribution


@router.get("/trend", response_model=list[DailyTrend])
async def get_trend(
    month_year: str = Query(description="Month in YYYY-MM format"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[DailyTrend]:
    """
    Get cumulative daily spending trend for the month.

    Args:
        month_year: Month in YYYY-MM format (e.g., "2026-06")
        current_user: Current authenticated user
        session: Database session

    Returns:
        List of daily cumulative amounts
    """
    # Get all expenses for the month, ordered by date
    statement = (
        select(Expense)
        .where(
            (Expense.user_id == current_user.id)
            & (Expense.transaction_date.startswith(month_year))
        )
        .order_by(Expense.transaction_date)
    )
    expenses = session.exec(statement).all()

    # Build cumulative trend
    trend_dict = {}
    cumulative = Decimal("0.00")

    for expense in expenses:
        current_date = expense.transaction_date
        cumulative += expense.amount
        # Store in dict to handle multiple expenses on same date
        trend_dict[current_date] = cumulative

    # Convert dict to sorted list of DailyTrend objects
    trend = [
        DailyTrend(date=date, cumulative_amount=amount)
        for date, amount in sorted(trend_dict.items())
    ]

    return trend
