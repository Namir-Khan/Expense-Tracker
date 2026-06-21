# Expense Tracking & Budget Management API

A production-ready REST API built with FastAPI for expense tracking and budget management.

## Features

- **User Authentication**: JWT-based stateless authentication with secure password hashing
- **Expense Management**: Create, read, update, and delete expenses with filtering and pagination
- **Categories**: Pre-defined default categories plus custom user categories
- **Budget Management**: Set monthly budget limits and track spending
- **Analytics**: 
  - Monthly spending summary with budget comparison
  - Category-wise expense distribution
  - Daily cumulative spending trends
- **SQLite Database**: Auto-generated SQLite database with migration-ready schema for PostgreSQL
- **CORS Support**: Pre-configured CORS middleware for frontend integration

## Technology Stack

- **Framework**: FastAPI 0.104.1
- **Server**: Uvicorn
- **Database**: SQLite (V1) with SQLModel ORM
- **Authentication**: PyJWT + passlib (bcrypt)
- **Data Validation**: Pydantic v2
- **Python**: 3.10+

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
├── expenses.db            # SQLite database (auto-created)
└── app/
    ├── core/
    │   ├── config.py      # Settings and environment variables
    │   └── security.py    # JWT encoding/decoding, password hashing
    ├── db/
    │   └── session.py     # Database engine and session management
    ├── models/
    │   └── domain.py      # SQLModel database tables
    ├── schemas/
    │   └── payloads.py    # Pydantic request/response models
    └── api/
        ├── deps.py        # Dependency injection (get_current_user)
        └── routers/
            ├── auth.py          # Authentication endpoints
            ├── expenses.py      # Expense management endpoints
            ├── categories.py    # Category management endpoints
            ├── budgets.py       # Budget management endpoints
            └── analytics.py     # Analytics endpoints
```

## Installation & Setup

### 1. Clone and Navigate
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment
Update `.env` file with your settings:
```
SECRET_KEY=your-super-secret-key-change-in-production
DATABASE_URL=sqlite:///./expenses.db
HOST=0.0.0.0
PORT=8000
RELOAD=True
```

### 5. Run the Server
```bash
# Development with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or use the command from main.py
python main.py
```

The API will be available at: **http://localhost:8000**

## API Documentation

Once the server is running, visit:
- **Interactive Docs (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /signup` - Register new user
- `POST /login` - Login (returns JWT token)
- `GET /me` - Get current user info (requires authentication)

### Expenses (`/api/v1/expenses`)
- `GET /` - List expenses with pagination and filtering
  - Query params: `skip`, `limit`, `category_id`, `start_date`, `end_date`
- `POST /` - Create new expense
- `PUT /{id}` - Update expense
- `DELETE /{id}` - Delete expense

### Categories (`/api/v1/categories`)
- `GET /` - List all default + user's custom categories
- `POST /` - Create custom category
- `DELETE /{id}` - Delete custom category

### Budgets (`/api/v1/budgets`)
- `GET /` - Get budget for a month
  - Query param: `month_year` (YYYY-MM format)
- `POST /` - Set/update budget for a month

### Analytics (`/api/v1/analytics`)
- `GET /summary` - Monthly spending summary
  - Query param: `month_year`
  - Returns: `total_spent`, `remaining_budget`, `top_category`
- `GET /distribution` - Category-wise expense distribution
  - Query param: `month_year`
  - Returns: Array of `{ name, value }` (Recharts format)
- `GET /trend` - Daily cumulative spending trend
  - Query param: `month_year`
  - Returns: Array of `{ date, cumulative_amount }`

## Example Usage

### 1. Sign Up
```bash
curl -X POST "http://localhost:8000/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'
```

### 2. Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=securepassword123"
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Create Expense (with token)
```bash
curl -X POST "http://localhost:8000/api/v1/expenses" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "category-uuid",
    "amount": "45.50",
    "description": "Weekly groceries",
    "transaction_date": "2026-06-21"
  }'
```

### 4. Get Monthly Analytics
```bash
curl -X GET "http://localhost:8000/api/v1/analytics/summary?month_year=2026-06" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Security Considerations

- **JWT Tokens**: Stateless bearer tokens with 30-day expiration (configurable)
- **Password Hashing**: Bcrypt hashing with salt (passlib)
- **CORS**: Currently allows all origins (`*`) for development
- **Database**: Foreign key constraints enabled for referential integrity

### Production Checklist
- [ ] Change `SECRET_KEY` in `.env`
- [ ] Update `CORS_ORIGINS` to specific domains
- [ ] Switch to PostgreSQL (update `DATABASE_URL`)
- [ ] Enable HTTPS/TLS
- [ ] Set `RELOAD=False`
- [ ] Use environment-specific `.env` files
- [ ] Configure proper logging
- [ ] Set up monitoring and error tracking
- [ ] Enable rate limiting
- [ ] Configure database backups

## Database Schema

### User
- `id` (UUID, PK)
- `email` (String, Unique)
- `hashed_password` (String)
- `base_currency` (String, Default: "USD")
- `created_at` (DateTime)

### Category
- `id` (UUID, PK)
- `name` (String)
- `is_default` (Boolean)
- `user_id` (UUID, FK -> User, Nullable)
- `created_at` (DateTime)

### Expense
- `id` (UUID, PK)
- `user_id` (UUID, FK -> User, Indexed)
- `category_id` (UUID, FK -> Category)
- `amount` (Decimal)
- `description` (String, Nullable)
- `transaction_date` (String, Indexed)
- `created_at` (DateTime)

### Budget
- `id` (UUID, PK)
- `user_id` (UUID, FK -> User)
- `limit_amount` (Decimal)
- `month_year` (String, YYYY-MM Format)
- `created_at` (DateTime)
- `updated_at` (DateTime)

## Error Handling

All endpoints return proper HTTP status codes:
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid/missing JWT token
- `403 Forbidden` - Access denied (resource belongs to another user)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Future Enhancements

- PostgreSQL migration (schema already supports it)
- Redis caching for analytics
- Recurring expenses
- Multi-currency support
- OCR for receipt scanning
- Mobile app integration
- Real-time notifications
- Export to CSV/PDF

## Development

### Run Tests (when added)
```bash
pytest
```

### Code Formatting
```bash
black app/
isort app/
```

### Linting
```bash
pylint app/
flake8 app/
```

## License

This project is part of the Expense Tracking & Budget Management System.

## Support

For issues or questions, contact the development team.
