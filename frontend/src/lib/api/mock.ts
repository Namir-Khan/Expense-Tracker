import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Film,
  Heart,
  Plane,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type Category = {
  id: string;
  name: string;
  icon: LucideIcon;
  colorVar: string; // chart css var
};

export const CATEGORIES: Category[] = [
  { id: "food", name: "Food & Dining", icon: Utensils, colorVar: "--cat-food" },
  { id: "transport", name: "Transport", icon: Car, colorVar: "--cat-transport" },
  { id: "shopping", name: "Shopping", icon: ShoppingBag, colorVar: "--cat-shopping" },
  { id: "housing", name: "Housing", icon: Home, colorVar: "--cat-housing" },
  { id: "entertainment", name: "Entertainment", icon: Film, colorVar: "--cat-entertainment" },
  { id: "health", name: "Health", icon: Heart, colorVar: "--cat-health" },
  { id: "travel", name: "Travel", icon: Plane, colorVar: "--cat-travel" },
  { id: "other", name: "Other", icon: Wallet, colorVar: "--cat-other" },
];

export const getCategory = (id: string) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

export type Expense = {
  id: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note: string;
};

type Store = {
  expenses: Expense[];
  budget: number;
  auth: { email: string } | null;
};

const STORAGE_KEY = "expense-tracker-store";
const SAMPLE_NOTES: Record<string, string[]> = {
  food: ["Lunch", "Groceries", "Coffee", "Dinner out", "Takeout"],
  transport: ["Uber", "Gas", "Train ticket", "Parking"],
  shopping: ["New shoes", "Amazon order", "Clothes", "Gift"],
  housing: ["Rent", "Electricity", "Internet", "Water bill"],
  entertainment: ["Movie", "Concert", "Streaming", "Game"],
  health: ["Pharmacy", "Gym", "Doctor visit"],
  travel: ["Hotel", "Flight", "Airbnb"],
  other: ["Misc", "Stationery"],
};

function seed(): Store {
  const expenses: Expense[] = [];
  const now = new Date();
  for (let i = 0; i < 45; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random() * 60));
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const notes = SAMPLE_NOTES[cat.id];
    expenses.push({
      id: crypto.randomUUID(),
      amount: Math.round((5 + Math.random() * 245) * 100) / 100,
      category: cat.id,
      date: d.toISOString().slice(0, 10),
      note: notes[Math.floor(Math.random() * notes.length)],
    });
  }
  return { expenses, budget: 2500, auth: null };
}

let store: Store | null = null;

function load(): Store {
  if (store) return store;
  if (typeof window === "undefined") {
    store = seed();
    return store;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      store = JSON.parse(raw);
      return store!;
    } catch {
      /* fallthrough */
    }
  }
  store = seed();
  persist();
  return store;
}

function persist() {
  if (typeof window === "undefined" || !store) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

// --- Auth ---
export async function login(email: string, _password: string) {
  await delay();
  const s = load();
  s.auth = { email };
  persist();
  localStorage.setItem("auth-token", "mock-token");
  return { token: "mock-token", email };
}

export async function signup(email: string, password: string) {
  return login(email, password);
}

export function logout() {
  const s = load();
  s.auth = null;
  persist();
  if (typeof window !== "undefined") localStorage.removeItem("auth-token");
}

export function isAuthed() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("auth-token");
}

// --- Categories ---
export async function getCategories() {
  await delay(40);
  return CATEGORIES;
}

// --- Expenses ---
export type ListParams = {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
};

export async function listExpenses(params: ListParams = {}) {
  await delay(80);
  const { limit = 10, offset = 0, category, search } = params;
  let rows = [...load().expenses].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (category && category !== "all") rows = rows.filter((r) => r.category === category);
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) => r.note.toLowerCase().includes(q) || getCategory(r.category).name.toLowerCase().includes(q),
    );
  }
  const total = rows.length;
  return { rows: rows.slice(offset, offset + limit), total };
}

export async function createExpense(input: Omit<Expense, "id">) {
  await delay(80);
  const s = load();
  const exp: Expense = { id: crypto.randomUUID(), ...input };
  s.expenses.unshift(exp);
  persist();
  return exp;
}

export async function deleteExpense(id: string) {
  await delay(80);
  const s = load();
  s.expenses = s.expenses.filter((e) => e.id !== id);
  persist();
  return { ok: true };
}

// --- Analytics ---
function inMonth(d: string, year: number, month: number) {
  const dt = new Date(d);
  return dt.getFullYear() === year && dt.getMonth() === month;
}

export async function getSummary() {
  await delay(60);
  const s = load();
  const now = new Date();
  const thisMonth = s.expenses.filter((e) => inMonth(e.date, now.getFullYear(), now.getMonth()));
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = s.expenses.filter((e) =>
    inMonth(e.date, lastMonthDate.getFullYear(), lastMonthDate.getMonth()),
  );
  const total = thisMonth.reduce((a, b) => a + b.amount, 0);
  const lastTotal = lastMonth.reduce((a, b) => a + b.amount, 0);
  const trend = lastTotal === 0 ? 0 : ((total - lastTotal) / lastTotal) * 100;
  const byCat = new Map<string, number>();
  thisMonth.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
  let topCat = "other";
  let topAmt = 0;
  for (const [k, v] of byCat) {
    if (v > topAmt) {
      topAmt = v;
      topCat = k;
    }
  }
  return {
    totalThisMonth: total,
    trendPct: trend,
    budget: s.budget,
    remaining: Math.max(0, s.budget - total),
    consumedPct: Math.min(100, (total / s.budget) * 100),
    topCategory: topCat,
    topCategoryAmount: topAmt,
  };
}

export async function get7DayBars() {
  await delay(40);
  const s = load();
  const now = new Date();
  const out: { day: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const amt = s.expenses.filter((e) => e.date === key).reduce((a, b) => a + b.amount, 0);
    out.push({ day: d.toLocaleDateString("en-US", { weekday: "short" }), amount: amt });
  }
  return out;
}

export type Timeframe = "this-month" | "last-month" | "year";

function rangeFor(tf: Timeframe): { start: Date; end: Date } {
  const now = new Date();
  if (tf === "this-month")
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  if (tf === "last-month")
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0),
    };
  return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
}

export async function getDistribution(tf: Timeframe) {
  await delay(60);
  const { start, end } = rangeFor(tf);
  const rows = load().expenses.filter((e) => {
    const d = new Date(e.date);
    return d >= start && d <= end;
  });
  const totals = new Map<string, number>();
  rows.forEach((e) => totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount));
  const total = rows.reduce((a, b) => a + b.amount, 0);
  return {
    total,
    slices: Array.from(totals.entries()).map(([cat, amount]) => ({
      category: cat,
      name: getCategory(cat).name,
      amount,
      pct: total === 0 ? 0 : (amount / total) * 100,
    })),
  };
}

export async function getTrend(tf: Timeframe) {
  await delay(60);
  const { start, end } = rangeFor(tf);
  const s = load();
  const days: { date: string; cumulative: number }[] = [];
  let cum = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    cum += s.expenses.filter((e) => e.date === key).reduce((a, b) => a + b.amount, 0);
    days.push({ date: key, cumulative: Math.round(cum * 100) / 100 });
    cursor.setDate(cursor.getDate() + 1);
  }
  // For "year", thin out to monthly cumulative
  if (tf === "year") {
    const monthly: { date: string; cumulative: number }[] = [];
    let lastMonth = -1;
    days.forEach((d) => {
      const m = new Date(d.date).getMonth();
      if (m !== lastMonth) {
        monthly.push(d);
        lastMonth = m;
      } else {
        monthly[monthly.length - 1] = d;
      }
    });
    return { points: monthly, budget: s.budget * 12 };
  }
  return { points: days, budget: s.budget };
}

export async function getBudget() {
  await delay(30);
  return { monthly: load().budget };
}

export async function setBudget(amount: number) {
  await delay(60);
  const s = load();
  s.budget = amount;
  persist();
  return { monthly: s.budget };
}