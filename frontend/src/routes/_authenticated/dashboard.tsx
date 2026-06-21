import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  getAnalyticsSummary,
  getAnalyticsTrend,
  listExpenses,
  getBudget,
} from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { useQuickAdd } from "@/components/quick-add-context";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Tally" },
      { name: "description", content: "Your monthly spending snapshot at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const summary = useQuery({
    queryKey: ["summary", monthYear],
    queryFn: () => getAnalyticsSummary(monthYear),
  });

  const trend = useQuery({
    queryKey: ["trend", monthYear],
    queryFn: () => getAnalyticsTrend(monthYear),
  });

  const budget = useQuery({
    queryKey: ["budget", monthYear],
    queryFn: () => getBudget(monthYear),
  });

  const recent = useQuery({
    queryKey: ["expenses", { limit: 5, offset: 0 }],
    queryFn: () => listExpenses({ limit: 5 }),
  });

  const { setOpen } = useQuickAdd();

  // Transform trend data for bar chart (last 7 days)
  const sevenDayBars = trend.data?.slice(-7).map((item) => ({
    day: new Date(item.date).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3),
    amount: Number(item.cumulative_amount) || 0,
  })) || [];

  // Calculate total spent and remaining
  const totalSpent = Number(summary.data?.total_spent) || 0;
  const budgetLimit = Number(budget.data?.limit_amount) || 5000; // default budget
  const remaining = budgetLimit - totalSpent;
  const consumedPct = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">A quick look at where things stand this month.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="hidden sm:inline-flex">
          <Plus className="mr-1 h-4 w-4" /> Add expense
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Spent this month</p>
          {summary.isLoading ? (
            <Skeleton className="mt-3 h-8 w-32" />
          ) : (
            <>
              <p className="mt-2 font-mono text-3xl font-semibold">{formatCurrency(totalSpent)}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowUp className="h-3 w-3 text-destructive" />
                Budget tracking
              </p>
            </>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Remaining budget</p>
          {summary.isLoading || budget.isLoading ? (
            <Skeleton className="mt-3 h-8 w-32" />
          ) : (
            <>
              <p className="mt-2 font-mono text-3xl font-semibold">{formatCurrency(Math.max(0, remaining))}</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(consumedPct, 100)}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {consumedPct.toFixed(0)}% of {formatCurrency(budgetLimit)} used
              </p>
            </>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Top category</p>
          {summary.isLoading || !summary.data?.top_category?.name ? (
            <Skeleton className="mt-3 h-8 w-32" />
          ) : summary.data?.top_category ? (
            <div className="mt-2 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">
                {summary.data.top_category.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-semibold">{summary.data.top_category.name}</p>
                <p className="font-mono text-sm text-muted-foreground">
                  {formatCurrency(summary.data.top_category.amount)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No expenses yet</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link to="/expenses" className="text-sm text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {recent.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="my-3 h-10 w-full" />)
            ) : recent.data && recent.data.length > 0 ? (
              recent.data.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.description || r.category?.name || "Expense"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.transaction_date)}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    {r.category?.name || "—"}
                  </span>
                  <p className="ml-auto font-mono font-semibold tabular-nums">{formatCurrency(r.amount)}</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No expenses yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Last 7 days</h2>
          <p className="text-xs text-muted-foreground">Daily spending velocity</p>
          <div className="mt-4 h-48">
            {trend.isLoading || sevenDayBars.length === 0 ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sevenDayBars}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Bar dataKey="amount" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}