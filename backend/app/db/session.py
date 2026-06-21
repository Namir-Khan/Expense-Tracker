"""Database session management and connection setup."""
from sqlalchemy import create_engine, event
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, select
from ..core.config import settings

# SQLite-specific engine configuration for production readiness
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=settings.SQLALCHEMY_ECHO,
)

# Enable foreign keys for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign key constraints in SQLite."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def create_db_and_tables():
    """Create database tables on startup."""
    SQLModel.metadata.create_all(engine)
    seed_default_categories()
    seed_sample_expenses()


def seed_default_categories():
    """Seed default expense categories into the database."""
    from ..models.domain import Category
    
    default_categories = [
        "Groceries",
        "Transportation",
        "Utilities",
        "Entertainment",
        "Healthcare",
        "Shopping",
        "Dining Out",
        "Insurance",
        "Rent",
        "Subscriptions",
        "Education",
        "Personal Care",
        "Gifts",
        "Travel",
        "Other",
    ]

    with Session(engine) as session:
        for category_name in default_categories:
            # Check if category already exists
            statement = select(Category).where(
                (Category.name == category_name) & (Category.is_default == True)
            )
            existing = session.exec(statement).first()
            
            if not existing:
                category = Category(
                    name=category_name,
                    is_default=True,
                    user_id=None,
                )
                session.add(category)
        
        session.commit()


def seed_sample_expenses():
    """Seed sample expense data for demo purposes."""
    from ..models.domain import User, Category, Expense
    from ..core.security import get_password_hash
    from decimal import Decimal
    
    with Session(engine) as session:
        # Check if demo user already exists
        demo_email = "demo@example.com"
        demo_user_stmt = select(User).where(User.email == demo_email)
        demo_user = session.exec(demo_user_stmt).first()
        
        if demo_user is None:
            # Create demo user
            demo_user = User(
                email=demo_email,
                hashed_password=get_password_hash("demo123456"),
                base_currency="USD",
            )
            session.add(demo_user)
            session.flush()  # Ensure user ID is generated
        
        # Check if demo user already has expenses
        expenses_check = select(Expense).where(Expense.user_id == demo_user.id)
        existing_expenses = session.exec(expenses_check).first()
        
        if existing_expenses is None:
            # Get all default categories
            categories_stmt = select(Category).where(Category.is_default == True)
            categories = session.exec(categories_stmt).all()
            category_map = {cat.name: cat.id for cat in categories}
            
            # Sample expenses for June 2026 (across different days for variety)
            sample_expenses = [
                ("Groceries", Decimal("45.50"), "Weekly groceries", "2026-06-01"),
                ("Dining Out", Decimal("32.00"), "Lunch with team", "2026-06-02"),
                ("Transportation", Decimal("15.00"), "Uber to office", "2026-06-03"),
                ("Utilities", Decimal("120.00"), "Electricity bill", "2026-06-04"),
                ("Entertainment", Decimal("25.00"), "Movie tickets", "2026-06-05"),
                ("Groceries", Decimal("62.35"), "Weekly groceries", "2026-06-08"),
                ("Shopping", Decimal("89.99"), "New shoes", "2026-06-09"),
                ("Healthcare", Decimal("50.00"), "Doctor visit copay", "2026-06-10"),
                ("Dining Out", Decimal("45.50"), "Dinner reservation", "2026-06-11"),
                ("Transportation", Decimal("20.00"), "Gas", "2026-06-12"),
                ("Subscriptions", Decimal("14.99"), "Netflix", "2026-06-13"),
                ("Personal Care", Decimal("35.00"), "Haircut", "2026-06-14"),
                ("Groceries", Decimal("55.20"), "Weekly groceries", "2026-06-15"),
                ("Travel", Decimal("150.00"), "Train tickets", "2026-06-16"),
                ("Gifts", Decimal("40.00"), "Birthday gift", "2026-06-17"),
                ("Dining Out", Decimal("28.75"), "Casual lunch", "2026-06-18"),
                ("Entertainment", Decimal("60.00"), "Concert tickets", "2026-06-19"),
                ("Groceries", Decimal("48.10"), "Weekly groceries", "2026-06-22"),
                ("Insurance", Decimal("200.00"), "Car insurance", "2026-06-23"),
                ("Education", Decimal("99.00"), "Online course", "2026-06-24"),
                ("Dining Out", Decimal("52.30"), "Dinner", "2026-06-25"),
                ("Transportation", Decimal("18.00"), "Uber", "2026-06-26"),
                ("Rent", Decimal("1500.00"), "Monthly rent", "2026-06-27"),
                ("Utilities", Decimal("85.00"), "Internet bill", "2026-06-28"),
            ]
            
            for category_name, amount, description, date in sample_expenses:
                category_id = category_map.get(category_name)
                if category_id:
                    expense = Expense(
                        user_id=demo_user.id,
                        category_id=category_id,
                        amount=amount,
                        description=description,
                        transaction_date=date,
                    )
                    session.add(expense)
        
        session.commit()


def get_session():
    """Dependency to get database session."""
    with Session(engine) as session:
        yield session
