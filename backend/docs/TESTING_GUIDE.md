# Expense Tracking API - Complete Testing Guide

## Quick Start

### 1. Setup and Installation

```bash
# Navigate to backend directory
cd backend

# Windows
run.bat

# macOS/Linux
bash run.sh

# Or manually:
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`

### 2. Access API Documentation

- **Interactive Docs (Swagger)**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API Testing Workflows

All protected endpoints require the `Authorization: Bearer <token>` header with a valid JWT token.

### Workflow 1: User Registration & Login

#### 1.1 Sign Up (Create Account)
```bash
curl -X POST "http://localhost:8000/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "base_currency": "USD",
  "created_at": "2026-06-21T10:00:00Z"
}
```

#### 1.2 Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john@example.com&password=SecurePass123!"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJleHAiOjE3NzM2NzE0MDB9.abc123...",
  "token_type": "bearer"
}
```

**Save the token** - you'll use it for all subsequent requests.

#### 1.3 Get Current User Info
```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Workflow 2: Category Management

#### 2.1 List All Categories (Default + User's Custom)
```bash
curl -X GET "http://localhost:8000/api/v1/categories" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
[
  {
    "id": "cat-uuid-001",
    "name": "Groceries",
    "is_default": true,
    "user_id": null,
    "created_at": "2026-06-21T10:00:00Z"
  },
  {
    "id": "cat-uuid-002",
    "name": "Transportation",
    "is_default": true,
    "user_id": null,
    "created_at": "2026-06-21T10:00:00Z"
  },
  ...
]
```

**Note:** The system comes with 15 default categories:
- Groceries, Transportation, Utilities, Entertainment, Healthcare
- Shopping, Dining Out, Insurance, Rent, Subscriptions
- Education, Personal Care, Gifts, Travel, Other

#### 2.2 Create Custom Category
```bash
curl -X POST "http://localhost:8000/api/v1/categories" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Car Maintenance"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Car Maintenance",
  "is_default": false,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-06-21T10:00:00Z"
}
```

#### 2.3 Delete Custom Category
```bash
curl -X DELETE "http://localhost:8000/api/v1/categories/550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:** HTTP 204 No Content

---

### Workflow 3: Expense Management

#### 3.1 Create Expense

First, get a category ID from the list (e.g., Groceries):

```bash
curl -X POST "http://localhost:8000/api/v1/expenses" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "cat-groceries-uuid",
    "amount": "45.50",
    "description": "Weekly groceries shopping",
    "transaction_date": "2026-06-21"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "category_id": "cat-groceries-uuid",
  "amount": "45.50",
  "description": "Weekly groceries shopping",
  "transaction_date": "2026-06-21",
  "created_at": "2026-06-21T10:00:00Z",
  "category": {
    "id": "cat-groceries-uuid",
    "name": "Groceries",
    "is_default": true,
    "user_id": null,
    "created_at": "2026-06-21T10:00:00Z"
  }
}
```

#### 3.2 Create Multiple Expenses
```bash
# Expense 2 - Transportation
curl -X POST "http://localhost:8000/api/v1/expenses" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "cat-transportation-uuid",
    "amount": "25.00",
    "description": "Uber ride to office",
    "transaction_date": "2026-06-21"
  }'

# Expense 3 - Utilities
curl -X POST "http://localhost:8000/api/v1/expenses" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "cat-utilities-uuid",
    "amount": "89.00",
    "description": "Electricity bill",
    "transaction_date": "2026-06-15"
  }'

# Expense 4 - Dining Out
curl -X POST "http://localhost:8000/api/v1/expenses" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "cat-dining-uuid",
    "amount": "35.75",
    "description": "Dinner with friends",
    "transaction_date": "2026-06-20"
  }'

# Expense 5 - Entertainment
curl -X POST "http://localhost:8000/api/v1/expenses" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "cat-entertainment-uuid",
    "amount": "15.00",
    "description": "Movie tickets",
    "transaction_date": "2026-06-18"
  }'
```

#### 3.3 List All Expenses
```bash
curl -X GET "http://localhost:8000/api/v1/expenses" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
[
  {
    "id": "exp-uuid-001",
    "user_id": "user-uuid",
    "category_id": "cat-uuid",
    "amount": "45.50",
    "description": "Weekly groceries",
    "transaction_date": "2026-06-21",
    "created_at": "2026-06-21T10:00:00Z",
    "category": { ... }
  },
  ...
]
```

#### 3.4 List Expenses with Pagination
```bash
curl -X GET "http://localhost:8000/api/v1/expenses?skip=0&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 3.5 Filter Expenses by Date Range
```bash
curl -X GET "http://localhost:8000/api/v1/expenses?start_date=2026-06-15&end_date=2026-06-25" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 3.6 Filter Expenses by Category
```bash
curl -X GET "http://localhost:8000/api/v1/expenses?category_id=cat-groceries-uuid" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 3.7 Update Expense
```bash
curl -X PUT "http://localhost:8000/api/v1/expenses/550e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "50.00",
    "description": "Updated: Weekly groceries and household items"
  }'
```

#### 3.8 Delete Expense
```bash
curl -X DELETE "http://localhost:8000/api/v1/expenses/550e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:** HTTP 204 No Content

---

### Workflow 4: Budget Management

#### 4.1 Set Monthly Budget
```bash
curl -X POST "http://localhost:8000/api/v1/budgets" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limit_amount": "2000.00",
    "month_year": "2026-06"
  }'
```

**Response:**
```json
{
  "id": "budget-uuid-001",
  "user_id": "user-uuid",
  "limit_amount": "2000.00",
  "month_year": "2026-06",
  "created_at": "2026-06-21T10:00:00Z",
  "updated_at": "2026-06-21T10:00:00Z"
}
```

#### 4.2 Get Budget for a Month
```bash
curl -X GET "http://localhost:8000/api/v1/budgets?month_year=2026-06" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 4.3 Update Budget
```bash
curl -X POST "http://localhost:8000/api/v1/budgets" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limit_amount": "2500.00",
    "month_year": "2026-06"
  }'
```

---

### Workflow 5: Analytics & Reporting

#### 5.1 Get Monthly Summary
Shows total spent, remaining budget, and top spending category.

```bash
curl -X GET "http://localhost:8000/api/v1/analytics/summary?month_year=2026-06" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "total_spent": "210.25",
  "remaining_budget": "1789.75",
  "top_category": "Groceries",
  "top_category_amount": "45.50"
}
```

#### 5.2 Get Category Distribution (Pie Chart Data)
Perfect for Recharts pie charts.

```bash
curl -X GET "http://localhost:8000/api/v1/analytics/distribution?month_year=2026-06" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
[
  {
    "name": "Groceries",
    "value": "45.50"
  },
  {
    "name": "Transportation",
    "value": "25.00"
  },
  {
    "name": "Utilities",
    "value": "89.00"
  },
  {
    "name": "Dining Out",
    "value": "35.75"
  },
  {
    "name": "Entertainment",
    "value": "15.00"
  }
]
```

#### 5.3 Get Daily Spending Trend (Line Chart Data)
Cumulative spending over time, perfect for Recharts line charts.

```bash
curl -X GET "http://localhost:8000/api/v1/analytics/trend?month_year=2026-06" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
[
  {
    "date": "2026-06-15",
    "cumulative_amount": "89.00"
  },
  {
    "date": "2026-06-18",
    "cumulative_amount": "104.00"
  },
  {
    "date": "2026-06-20",
    "cumulative_amount": "139.75"
  },
  {
    "date": "2026-06-21",
    "cumulative_amount": "210.25"
  }
]
```

---

## Testing in Swagger UI

1. Go to http://localhost:8000/docs
2. Click the "Authorize" button (top right)
3. Use any Bearer token format (the Authorize dialog just adds the token to requests)
4. Click "Try it out" on any endpoint
5. Fill in the parameters and request body
6. Click "Execute"

---

## Data Validation Examples

### Valid Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### Invalid Request (too short password):
```json
{
  "email": "user@example.com",
  "password": "short"
}
```
**Error:** `400 Bad Request - ensure this value has at least 8 characters`

### Invalid Expense (negative amount):
```json
{
  "category_id": "cat-uuid",
  "amount": "-10.00",
  "transaction_date": "2026-06-21"
}
```
**Error:** `422 Unprocessable Entity - ensure this value is greater than 0`

---

## Error Responses

### Unauthorized (Invalid/Expired Token)
```json
{
  "detail": "Invalid or expired token"
}
```
Status: `401 Unauthorized`

### Not Found
```json
{
  "detail": "Expense not found"
}
```
Status: `404 Not Found`

### Forbidden (Access Denied)
```json
{
  "detail": "Cannot delete another user's expense"
}
```
Status: `403 Forbidden`

### Bad Request
```json
{
  "detail": "Email already registered"
}
```
Status: `400 Bad Request`

---

## Database File

The SQLite database is automatically created at: `backend/expenses.db`

To inspect the database:
```bash
# Windows
sqlite3 expenses.db

# macOS/Linux
sqlite3 ./expenses.db

# Then use SQL commands:
# .tables - see all tables
# SELECT * FROM user; - see users
# SELECT * FROM expense; - see expenses
# .quit - exit
```

---

## Environment Variables

Edit `.env` to configure:

```bash
# Security - Change this in production!
SECRET_KEY=your-super-secret-key-change-in-production-12345

# Database
DATABASE_URL=sqlite:///./expenses.db
SQLALCHEMY_ECHO=False

# Server
HOST=0.0.0.0
PORT=8000
RELOAD=True
```

---

## Next Steps

1. **Connect Frontend**: Update your React/Vue/Angular app to use `http://localhost:8000/api/v1/` as the API base URL
2. **Token Storage**: Save the `access_token` from login response and send it in all protected requests
3. **Error Handling**: Catch 401 responses to redirect to login
4. **Analytics Integration**: Parse the analytics endpoints response format for your charting library

---

## Common Issues

### CORS Error
**Solution**: Make sure the backend is running and `*` is in `CORS_ORIGINS` (default setting)

### Database Lock Error
**Solution**: Delete `expenses.db` and restart the server

### Token Expired
**Solution**: Login again to get a new token (default expiration: 30 days)

### Module Not Found
**Solution**: Ensure you've installed dependencies: `pip install -r requirements.txt`

---

## Production Deployment Notes

Before deploying to production:
1. Change `SECRET_KEY` to a secure random value
2. Update `CORS_ORIGINS` to specific domains
3. Set `RELOAD=False`
4. Switch to PostgreSQL for production
5. Use environment variables from a secure configuration service
6. Enable HTTPS/TLS
7. Set up database backups
8. Configure logging and monitoring
9. Use a production ASGI server (Gunicorn + Uvicorn)
10. Set up rate limiting and API versioning
