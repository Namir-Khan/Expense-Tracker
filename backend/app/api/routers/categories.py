"""Category management endpoints."""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import Session, select
from ...db.session import get_session
from ...models.domain import User, Category
from ...schemas.payloads import CategoryCreate, CategoryResponse
from .deps_router import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[Category]:
    """
    Get all default categories plus user's custom categories.

    Args:
        current_user: Current authenticated user
        session: Database session

    Returns:
        List of categories
    """
    # Get default categories (is_default=True)
    default_statement = select(Category).where(Category.is_default == True)
    default_categories = session.exec(default_statement).all()

    # Get user's custom categories
    user_statement = select(Category).where(
        (Category.user_id == current_user.id) & (Category.is_default == False)
    )
    user_categories = session.exec(user_statement).all()

    return default_categories + user_categories


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Category:
    """
    Create a new custom category for the user.

    Args:
        category_data: Category name
        current_user: Current authenticated user
        session: Database session

    Returns:
        Created category
    """
    category = Category(
        name=category_data.name,
        is_default=False,
        user_id=current_user.id,
    )
    session.add(category)
    session.commit()
    session.refresh(category)

    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """
    Delete a custom category.

    Args:
        category_id: Category ID to delete
        current_user: Current authenticated user
        session: Database session

    Raises:
        HTTPException: If category not found, is default, or doesn't belong to user
    """
    category = session.get(Category, category_id)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if category.is_default:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete default categories",
        )

    if category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete another user's category",
        )

    session.delete(category)
    session.commit()
