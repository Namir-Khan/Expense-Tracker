"""Authentication endpoints."""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import Session, select
from ...core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
)
from ...db.session import get_session
from ...models.domain import User
from ...schemas.payloads import (
    UserCreate,
    UserLogin,
    TokenResponse,
    UserResponse,
)
from .deps_router import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    session: Session = Depends(get_session),
) -> User:
    """
    Register a new user.

    Args:
        user_data: User email and password
        session: Database session

    Returns:
        Created user (without password hash)

    Raises:
        HTTPException: If email already exists
    """
    # Check if user already exists
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    user_data: UserLogin,
    session: Session = Depends(get_session),
) -> dict:
    """
    Authenticate user and return JWT token.

    Args:
        user_data: OAuth2 form data (username=email, password)
        session: Database session

    Returns:
        Access token and token type

    Raises:
        HTTPException: If credentials invalid
    """
    # Find user by email
    statement = select(User).where(User.email == user_data.username)
    user = session.exec(statement).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create JWT token
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current authenticated user info.

    Args:
        current_user: Current authenticated user

    Returns:
        User data (without password hash)
    """
    return current_user
