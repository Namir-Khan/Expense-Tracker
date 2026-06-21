import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getBudget,
  getAnalyticsDistribution,
  getAnalyticsTrend,
  setBudget,
} from "@/lib/api/client";
import { formatCurrency } from "@/lib/format";

const COLOR_PALETTE = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Tally" },
      { name: "description", content: "See where your money goes and whether you're on track to hit your budget." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  const dist = useQuery({
    queryKey: ["distribution", monthYear],
    queryFn: () => getAnalyticsDistribution(monthYear),
  });

  const trend = useQuery({
    queryKey: ["trend", monthYear],
    queryFn: () => getAnalyticsTrend(monthYear),
  });

  const budget = useQuery({
    queryKey: ["budget", monthYear],
    queryFn: () => getBudget(monthYear),
  });

  const qc = useQueryClient();
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const mutateBudget = useMutation({
    mutationFn: (amount: number) => setBudget(amount, monthYear),
    onSuccess: () => {
      toast.success("Budget updated");
      qc.invalidateQueries({ queryKey: ["budget"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["trend"] });
      setEditingBudget(false);
    },
  });

  // Calculate total from distribution
  const distributionData = (dist.data || []).map(item => ({
    name: item.name,
    value: Number(item.value) || 0,
  }));
  const total = distributionData.reduce((sum, item) => sum + (item.value || 0), 0);

  // Transform for pie chart with colors
  const pieData = distributionData.map((item, idx) => ({
    name: item.name,
    value: item.value,
    percentage: total > 0 ? (item.value / total * 100) : 0,
  }));

  // Transform trend data for line chart
  const trendData = (trend.data || []).map((item) => ({
    date: item.date,
    cumulative: Number(item.cumulative_amount) || 0,
  }));

  const budgetLimit = Number(budget.data?.limit_amount) || 2500;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Visual reporting across categories and time.</p>
        </div>
        <Tabs value="this-month" disabled>
          <TabsList>
            <TabsTrigger value="this-month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Category breakdown</h2>
          <p className="text-xs text-muted-foreground">Where your money went</p>
          {dist.isLoading ? (
            <Skeleton className="mt-6 h-64 w-full" />
          ) : dist.isError ? (
            <p className="py-16 text-center text-sm text-destructive">Failed to load category data</p>
          ) : !distributionData || distributionData.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No expenses recorded for this month yet.</p>
          ) : (
            <div className="mt-4 grid items-center gap-6 sm:grid-cols-[1fr_auto]">
              <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                      stroke="var(--card)"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLOR_PALETTE[i % COLOR_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-mono text-xl font-semibold">{formatCurrency(total)}</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {pieData.map((item, idx) => (
                  <li key={item.name} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                    />
                    <span className="text-foreground">{item.name}</span>
                    <span className="ml-auto font-mono text-muted-foreground">{item.percentage.toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Burn rate</h2>
              <p className="text-xs text-muted-foreground">Cumulative spend vs budget cap</p>
            </div>
            {editingBudget ? (
              <form
                className="flex items-center gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = parseFloat(budgetInput);
                  if (!isNaN(v) && v > 0) mutateBudget.mutate(v);
                }}
              >
                <Input
                  autoFocus
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="h-8 w-24 font-mono"
                  inputMode="decimal"
                />
                <Button type="submit" size="sm" disabled={mutateBudget.isPending}>
                  Save
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBudgetInput(String(budget.data?.limit_amount ?? ""));
                  setEditingBudget(true);
                }}
              >
                <Pencil className="mr-1 h-3 w-3" />
                {budget.data ? formatCurrency(budget.data.limit_amount) : "Set budget"}
              </Button>
            )}
          </div>

          {trend.isLoading || trendData.length === 0 ? (
            <Skeleton className="mt-6 h-64 w-full" />
          ) : trend.isError ? (
            <p className="mt-6 text-center text-sm text-destructive">Failed to load trend data</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <ReferenceLine
                    y={budgetLimit}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="6 4"
                    label={{
                      value: "Budget",
                      position: "insideTopRight",
                      fontSize: 11,
                      fill: "var(--muted-foreground)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}