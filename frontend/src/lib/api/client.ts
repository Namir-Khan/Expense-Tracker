/**
 * API Client for communicating with the FastAPI backend
 * Base URL: http://localhost:8000/api/v1
 */

const API_BASE_URL = "http://localhost:8000/api/v1";

// Token management
const TOKEN_KEY = "auth-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// API Response types
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  base_currency: string;
  created_at: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  is_default: boolean;
  user_id: string | null;
  created_at: string;
}

export interface ExpenseResponse {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
  category?: CategoryResponse;
}

// Category color mapping
export const CATEGORY_COLORS: Record<string, string> = {
  "Groceries": "#10b981",
  "Transportation": "#3b82f6",
  "Utilities": "#6366f1",
  "Entertainment": "#f59e0b",
  "Healthcare": "#ef4444",
  "Shopping": "#ec4899",
  "Dining Out": "#f97316",
  "Insurance": "#06b6d4",
  "Rent": "#8b5cf6",
  "Subscriptions": "#14b8a6",
  "Education": "#eab308",
  "Personal Care": "#6366f1",
  "Gifts": "#ec4899",
  "Travel": "#f59e0b",
  "Other": "#6b7280",
};

export function getCategoryColor(categoryName: string): string {
  return CATEGORY_COLORS[categoryName] || CATEGORY_COLORS["Other"];
}

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
  requiresAuth: boolean = false
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add auth token if required
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// --- Auth Endpoints ---

export async function signup(email: string, password: string): Promise<UserResponse> {
  const response = await apiCall<UserResponse>("/auth/signup", "POST", {
    email,
    password,
  });
  return response;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiCall<AuthResponse>("/auth/login", "POST", {
    username: email, // OAuth2 uses 'username' field
    password,
  });

  // Save token
  setToken(response.access_token);
  return response;
}

export async function logout(): Promise<void> {
  clearToken();
}

export async function isAuthed(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    await apiCall<UserResponse>("/auth/me", "GET", undefined, true);
    return true;
  } catch {
    clearToken();
    return false;
  }
}

export async function getCurrentUser(): Promise<UserResponse> {
  return apiCall<UserResponse>("/auth/me", "GET", undefined, true);
}

// --- Category Endpoints ---

export async function getCategories(): Promise<CategoryResponse[]> {
  return apiCall<CategoryResponse[]>("/categories", "GET", undefined, true);
}

export async function createCategory(name: string): Promise<CategoryResponse> {
  return apiCall<CategoryResponse>(
    "/categories",
    "POST",
    { name },
    true
  );
}

export async function deleteCategory(id: string): Promise<void> {
  await apiCall(`/categories/${id}`, "DELETE", undefined, true);
}

// --- Expense Endpoints ---

export interface ListExpensesParams {
  skip?: number;
  limit?: number;
  category_id?: string;
  start_date?: string;
  end_date?: string;
}

export async function listExpenses(
  params: ListExpensesParams = {}
): Promise<ExpenseResponse[]> {
  const queryParams = new URLSearchParams();
  if (params.skip !== undefined) queryParams.append("skip", params.skip.toString());
  if (params.limit !== undefined) queryParams.append("limit", params.limit.toString());
  if (params.category_id) queryParams.append("category_id", params.category_id);
  if (params.start_date) queryParams.append("start_date", params.start_date);
  if (params.end_date) queryParams.append("end_date", params.end_date);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return apiCall<ExpenseResponse[]>(
    `/expenses${query}`,
    "GET",
    undefined,
    true
  );
}

export async function createExpense(data: {
  category_name: string;
  amount: number;
  description?: string;
  transaction_date: string;
}): Promise<ExpenseResponse> {
  return apiCall<ExpenseResponse>(
    "/expenses",
    "POST",
    data,
    true
  );
}

export async function updateExpense(
  id: string,
  data: Partial<{
    category_name: string;
    amount: number;
    description: string;
    transaction_date: string;
  }>
): Promise<ExpenseResponse> {
  return apiCall<ExpenseResponse>(
    `/expenses/${id}`,
    "PUT",
    data,
    true
  );
}

export async function deleteExpense(id: string): Promise<void> {
  await apiCall(`/expenses/${id}`, "DELETE", undefined, true);
}

// --- Budget Endpoints ---

export interface BudgetResponse {
  id: string;
  user_id: string;
  limit_amount: number;
  month_year: string;
  created_at: string;
  updated_at: string;
}

export async function getBudget(month_year: string): Promise<BudgetResponse | null> {
  try {
    return await apiCall<BudgetResponse>(
      `/budgets?month_year=${month_year}`,
      "GET",
      undefined,
      true
    );
  } catch {
    return null;
  }
}

export async function setBudget(
  limit_amount: number,
  month_year: string
): Promise<BudgetResponse> {
  return apiCall<BudgetResponse>(
    "/budgets",
    "POST",
    { limit_amount, month_year },
    true
  );
}

// --- Analytics Endpoints ---

export interface AnalyticsSummary {
  total_spent: number;
  remaining_budget: number;
  top_category: {
    name: string;
    amount: number;
  } | null;
}

export async function getAnalyticsSummary(
  month_year: string
): Promise<AnalyticsSummary> {
  return apiCall<AnalyticsSummary>(
    `/analytics/summary?month_year=${month_year}`,
    "GET",
    undefined,
    true
  );
}

export interface CategoryDistribution {
  name: string;
  value: number;
}

export async function getAnalyticsDistribution(
  month_year: string
): Promise<CategoryDistribution[]> {
  return apiCall<CategoryDistribution[]>(
    `/analytics/distribution?month_year=${month_year}`,
    "GET",
    undefined,
    true
  );
}

export interface DailyTrend {
  date: string;
  cumulative_amount: number;
}

export async function getAnalyticsTrend(
  month_year: string
): Promise<DailyTrend[]> {
  return apiCall<DailyTrend[]>(
    `/analytics/trend?month_year=${month_year}`,
    "GET",
    undefined,
    true
  );
}
