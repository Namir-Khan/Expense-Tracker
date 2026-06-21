# Postman Testing Guide - Expense Tracker API

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication

### Demo User Credentials
- **Email**: demo@example.com
- **Password**: demo123456

### Getting Started
1. Sign up or login to get a JWT token
2. Use the token in the `Authorization: Bearer {token}` header for authenticated endpoints
3. Token lasts 30 days

---

## 🔐 Authentication Endpoints

### 1. Sign Up (Create New User)
**POST** `/auth/signup`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "base_currency": "USD",
  "created_at": "2026-06-21T10:00:00Z"
}
```

**Status Codes:**
- `201` - User created successfully
- `400` - Email already registered

---

### 2. Login (Get JWT Token)
**POST** `/auth/login`

**Headers:**
```json
{
  "Content-Type": "application/x-www-form-urlencoded"
}
```

**Body (form-urlencoded):**
```
username=demo@example.com&password=demo123456
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Status Codes:**
- `200` - Login successful
- `401` - Invalid credentials

---

### 3. Get Current User Info
**GET** `/auth/me`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "demo@example.com",
  "base_currency": "USD",
  "created_at": "2026-06-21T10:00:00Z"
}
```

---

## 📂 Category Endpoints

### 1. List All Categories
**GET** `/categories`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Groceries",
    "is_default": true,
    "user_id": null,
    "created_at": "2026-06-21T10:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Dining Out",
    "is_default": true,
    "user_id": null,
    "created_at": "2026-06-21T10:00:00Z"
  }
]
```

---

### 2. Create Custom Category
**POST** `/categories`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "name": "Pet Care"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "name": "Pet Care",
  "is_default": false,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-06-21T10:00:00Z"
}
```

---

### 3. Delete Custom Category
**DELETE** `/categories/{category_id}`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Path Parameters:**
- `category_id` - The category ID to delete

**Response (204 No Content):**
```
(no body)
```

**Status Codes:**
- `204` - Category deleted successfully
- `404` - Category not found
- `403` - Cannot delete default categories or another user's category

---

## 💰 Expense Endpoints

### 1. List Expenses (with Filters)
**GET** `/expenses`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Query Parameters:**
- `skip` (optional) - Number of expenses to skip (default: 0)
- `limit` (optional) - Number of expenses to return (default: 10)
- `category_id` (optional) - Filter by category ID
- `start_date` (optional) - Filter by start date (YYYY-MM-DD)
- `end_date` (optional) - Filter by end date (YYYY-MM-DD)

**Example:**
```
GET /expenses?skip=0&limit=20&start_date=2026-06-01&end_date=2026-06-30
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440200",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "category_id": "550e8400-e29b-41d4-a716-446655440001",
    "amount": 45.50,
    "description": "Weekly groceries",
    "transaction_date": "2026-06-21",
    "created_at": "2026-06-21T10:00:00Z",
    "category": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Groceries",
      "is_default": true,
      "user_id": null,
      "created_at": "2026-06-21T10:00:00Z"
    }
  }
]
```

---

### 2. Create Expense
**POST** `/expenses`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "category_name": "Groceries",
  "amount": 65.50,
  "description": "Weekly groceries at Whole Foods",
  "transaction_date": "2026-06-21"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440200",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "category_id": "550e8400-e29b-41d4-a716-446655440001",
  "amount": 65.50,
  "description": "Weekly groceries at Whole Foods",
  "transaction_date": "2026-06-21",
  "created_at": "2026-06-21T10:00:00Z",
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Groceries",
    "is_default": true,
    "user_id": null,
    "created_at": "2026-06-21T10:00:00Z"
  }
}
```

**Notes:**
- Use `category_name` (string), not category ID
- `description` is optional
- `transaction_date` must be in YYYY-MM-DD format

---

### 3. Update Expense
**PUT** `/expenses/{expense_id}`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

**Body (all fields optional):**
```json
{
  "category_name": "Shopping",
  "amount": 75.50,
  "description": "Updated description",
  "transaction_date": "2026-06-22"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440200",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "category_id": "550e8400-e29b-41d4-a716-446655440005",
  "amount": 75.50,
  "description": "Updated description",
  "transaction_date": "2026-06-22",
  "created_at": "2026-06-21T10:00:00Z",
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "name": "Shopping",
    "is_default": true,
    "user_id": null,
    "created_at": "2026-06-21T10:00:00Z"
  }
}
```

---

### 4. Delete Expense
**DELETE** `/expenses/{expense_id}`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Response (204 No Content):**
```
(no body)
```

---

## 💵 Budget Endpoints

### 1. Get Budget for Month
**GET** `/budgets`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Query Parameters:**
- `month_year` (required) - Month in YYYY-MM format (e.g., "2026-06")

**Example:**
```
GET /budgets?month_year=2026-06
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440300",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "limit_amount": 2500.00,
  "month_year": "2026-06",
  "created_at": "2026-06-21T10:00:00Z",
  "updated_at": "2026-06-21T10:00:00Z"
}
```

**Response (204 No Content) - if no budget set:**
```
null
```

---

### 2. Set or Update Budget
**POST** `/budgets`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "limit_amount": 3000.00,
  "month_year": "2026-06"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440300",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "limit_amount": 3000.00,
  "month_year": "2026-06",
  "created_at": "2026-06-21T10:00:00Z",
  "updated_at": "2026-06-21T10:00:00Z"
}
```

**Notes:**
- If budget already exists for the month, it will be updated
- `month_year` must be in YYYY-MM format

---

## 📊 Analytics Endpoints

### 1. Get Monthly Summary
**GET** `/analytics/summary`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Query Parameters:**
- `month_year` (required) - Month in YYYY-MM format (e.g., "2026-06")

**Example:**
```
GET /analytics/summary?month_year=2026-06
```

**Response (200 OK):**
```json
{
  "total_spent": 1250.50,
  "remaining_budget": 1249.50,
  "top_category": {
    "name": "Groceries",
    "amount": 450.75
  }
}
```

**Response (if no expenses):**
```json
{
  "total_spent": 0,
  "remaining_budget": 2500,
  "top_category": null
}
```

---

### 2. Get Category Distribution (Pie Chart Data)
**GET** `/analytics/distribution`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Query Parameters:**
- `month_year` (required) - Month in YYYY-MM format (e.g., "2026-06")

**Example:**
```
GET /analytics/distribution?month_year=2026-06
```

**Response (200 OK):**
```json
[
  {
    "name": "Groceries",
    "value": 450.75
  },
  {
    "name": "Dining Out",
    "value": 325.50
  },
  {
    "name": "Transportation",
    "value": 150.00
  },
  {
    "name": "Entertainment",
    "value": 99.99
  }
]
```

**Notes:**
- Returns sorted by value (highest first)
- Use for pie charts and category breakdown

---

### 3. Get Daily Spending Trend (Line Chart Data)
**GET** `/analytics/trend`

**Headers:**
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Query Parameters:**
- `month_year` (required) - Month in YYYY-MM format (e.g., "2026-06")

**Example:**
```
GET /analytics/trend?month_year=2026-06
```

**Response (200 OK):**
```json
[
  {
    "date": "2026-06-01",
    "cumulative_amount": 45.50
  },
  {
    "date": "2026-06-02",
    "cumulative_amount": 77.50
  },
  {
    "date": "2026-06-03",
    "cumulative_amount": 92.50
  },
  {
    "date": "2026-06-05",
    "cumulative_amount": 152.50
  }
]
```

**Notes:**
- Shows cumulative amount for each day
- Only includes dates with expenses
- Use for budget burn rate line charts

---

## 🧪 Complete Postman Testing Workflow

### Step 1: Login (Get Token)
```
POST /auth/login
Body (form-urlencoded): username=demo@example.com&password=demo123456
Copy the access_token value
```

### Step 2: Create a Test Expense
```
POST /expenses
Headers: Authorization: Bearer {access_token}
Body:
{
  "category_name": "Groceries",
  "amount": 50.00,
  "description": "Test expense",
  "transaction_date": "2026-06-21"
}
```

### Step 3: List All Expenses
```
GET /expenses
Headers: Authorization: Bearer {access_token}
```

### Step 4: Get Analytics Summary
```
GET /analytics/summary?month_year=2026-06
Headers: Authorization: Bearer {access_token}
```

### Step 5: Get Category Distribution
```
GET /analytics/distribution?month_year=2026-06
Headers: Authorization: Bearer {access_token}
```

### Step 6: Get Spending Trend
```
GET /analytics/trend?month_year=2026-06
Headers: Authorization: Bearer {access_token}
```

### Step 7: Set Budget
```
POST /budgets
Headers: Authorization: Bearer {access_token}
Body:
{
  "limit_amount": 3000.00,
  "month_year": "2026-06"
}
```

---

## 📋 Quick Reference - All Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/auth/signup` | Register new user | ❌ |
| POST | `/auth/login` | Login & get token | ❌ |
| GET | `/auth/me` | Get current user | ✅ |
| GET | `/categories` | List all categories | ✅ |
| POST | `/categories` | Create custom category | ✅ |
| DELETE | `/categories/{id}` | Delete custom category | ✅ |
| GET | `/expenses` | List expenses | ✅ |
| POST | `/expenses` | Create expense | ✅ |
| PUT | `/expenses/{id}` | Update expense | ✅ |
| DELETE | `/expenses/{id}` | Delete expense | ✅ |
| GET | `/budgets` | Get budget for month | ✅ |
| POST | `/budgets` | Set/update budget | ✅ |
| GET | `/analytics/summary` | Get monthly summary | ✅ |
| GET | `/analytics/distribution` | Get category breakdown | ✅ |
| GET | `/analytics/trend` | Get spending trend | ✅ |

---

## 🔧 Tips for Postman

### Save Token as Variable
After login, save the token as a Postman variable:
1. In the login response, click on the token value
2. Create a new variable: `token`
3. In Authorization header, use: `Bearer {{token}}`

### Date Format Reminder
- Always use YYYY-MM-DD for transaction dates
- Always use YYYY-MM for month_year queries

### Default Categories Available
- Groceries
- Transportation
- Utilities
- Entertainment
- Healthcare
- Shopping
- Dining Out
- Insurance
- Rent
- Subscriptions
- Education
- Personal Care
- Gifts
- Travel
- Other

---

## 📝 Error Responses

### 400 Bad Request
```json
{
  "detail": "Email already registered"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid email or password"
}
```

### 404 Not Found
```json
{
  "detail": "Expense not found"
}
```

### 403 Forbidden
```json
{
  "detail": "Cannot delete default categories"
}
```

---

## 🎯 Common Testing Scenarios

### Scenario 1: Add Multiple Expenses and View Analytics
1. Login
2. Create 5-10 expenses in different categories
3. Call `/analytics/summary` to see total and top category
4. Call `/analytics/distribution` to see breakdown
5. Call `/analytics/trend` to see cumulative trend

### Scenario 2: Set Budget and Track Spending
1. Create expenses totaling ~$1,500
2. Set budget to $2,000
3. Check `/budgets` endpoint to confirm budget is set
4. Call `/analytics/summary` to see remaining budget

### Scenario 3: Update and Delete Expenses
1. Create an expense
2. Update it with new amount/category
3. Delete it
4. Verify it's gone in `/expenses` list

---

Generated for Expense Tracker API v1.0.0
