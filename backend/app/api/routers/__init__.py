"""Initialize routers package."""
from . import auth
from . import expenses
from . import categories
from . import budgets
from . import analytics

__all__ = ["auth", "expenses", "categories", "budgets", "analytics"]
