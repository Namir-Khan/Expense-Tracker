"""Expense management endpoints."""
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlmodel import Session, select
from ...db.session import get_session
from ...models.domain import User, Expense, Category
from ...schemas.payloads import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
)
from .deps_router import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseResponse])
async def list_expenses(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> list[Expense]:
    """
    List expenses for current user with optional filtering and pagination.

    Args:
        current_user: Current authenticated user
        session: Database session
        skip: Number of records to skip (pagination)
        limit: Number of records to return
        category_id: Filter by category ID
        start_date: Filter by start date (YYYY-MM-DD)
        end_date: Filter by end date (YYYY-MM-DD)

    Returns:
        List of expenses
    """
    statement = select(Expense).where(Expense.user_id == current_user.id)

    if category_id:
        statement = statement.where(Expense.category_id == category_id)

    if start_date:
        statement = statement.where(Expense.transaction_date >= start_date)

    if end_date:
        statement = statement.where(Expense.transaction_date <= end_date)

    # Order by transaction_date descending
    statement = statement.order_by(Expense.transaction_date.desc()).offset(skip).limit(
        limit
    )

    expenses = session.exec(statement).all()

    # Load related categories
    for expense in expenses:
        session.refresh(expense, ["category"])

    return expenses


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Expense:
    """
    Create a new expense.

    Args:
        expense_data: Expense details (uses category name)
        current_user: Current authenticated user
        session: Database session

    Returns:
        Created expense

    Raises:
        HTTPException: If category not found
    """
    # Look up category by name
    statement = select(Category).where(Category.name == expense_data.category_name)
    category = session.exec(statement).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{expense_data.category_name}' not found",
        )

    # Verify category is default or belongs to user
    if not category.is_default and category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot use another user's category",
        )

    expense = Expense(
        user_id=current_user.id,
        category_id=category.id,
        amount=expense_data.amount,
        description=expense_data.description,
        transaction_date=expense_data.transaction_date,
    )
    session.add(expense)
    session.commit()
    session.refresh(expense)
    session.refresh(expense, ["category"])

    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    expense_data: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Expense:
    """
    Update an expense.

    Args:
        expense_id: Expense ID to update
        expense_data: Updated expense details
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated expense

    Raises:
        HTTPException: If expense not found or belongs to another user
    """
    expense = session.get(Expense, expense_id)

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    if expense.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update another user's expense",
        )

    # Update only provided fields
    if expense_data.category_name:
        # Look up category by name
        statement = select(Category).where(Category.name == expense_data.category_name)
        category = session.exec(statement).first()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category '{expense_data.category_name}' not found",
            )

        # Verify category is default or belongs to user
        if not category.is_default and category.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot use another user's category",
            )
        
        expense.category_id = category.id

    if expense_data.amount is not None:
        expense.amount = expense_data.amount

    if expense_data.description is not None:
        expense.description = expense_data.description

    if expense_data.transaction_date:
        expense.transaction_date = expense_data.transaction_date

    session.add(expense)
    session.commit()
    session.refresh(expense)
    session.refresh(expense, ["category"])

    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """
    Delete an expense.

    Args:
        expense_id: Expense ID to delete
        current_user: Current authenticated user
        session: Database session

    Raises:
        HTTPException: If expense not found or belongs to another user
    """
    expense = session.get(Expense, expense_id)

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    if expense.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete another user's expense",
        )

    session.delete(expense)
    session.commit()
