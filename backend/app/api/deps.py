"""Dependency injection utilities."""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlmodel import Session, select
from ..core.security import decode_token
from ..db.session import get_session
from ..models.domain import User

security = HTTPBearer()


async def get_current_user(
    credentials = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    """
    Get current authenticated user from JWT token.

    Args:
        credentials: HTTP Bearer token
        session: Database session

    Returns:
        Current user object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    statement = select(User).where(User.id == user_id)
    user = session.exec(statement).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
