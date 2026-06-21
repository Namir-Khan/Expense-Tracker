import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Inbox, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteExpense, listExpenses, getCategories, getCategoryColor } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { useQuickAdd } from "@/components/quick-add-context";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — Tally" },
      { name: "description", content: "Browse, search, and manage every transaction in your ledger." },
    ],
  }),
  component: ExpensesPage,
});

type Sort = { key: "date" | "amount"; dir: "asc" | "desc" };

function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<Sort>({ key: "date", dir: "desc" });
  const limit = 10;
  const qc = useQueryClient();
  const { setOpen } = useQuickAdd();

  // Get categories for filtering
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Fetch all expenses
  const query = useQuery({
    queryKey: ["expenses"],
    queryFn: () => listExpenses({ limit: 1000 }),
  });

  // Transform API response to UI format and apply filtering
  const transformedExpenses = useMemo(() => {
    if (!query.data) return [];
    
    return query.data.map((exp) => ({
      id: exp.id,
      amount: Number(exp.amount) || 0,
      category: exp.category?.name || "Unknown",
      category_id: exp.category_id,
      date: exp.transaction_date,
      note: exp.description || "",
    }));
  }, [query.data]);

  // Apply filtering and sorting
  const sortedRows = useMemo(() => {
    let rows = [...transformedExpenses];

    // Filter by search
    if (search) {
      rows = rows.filter((r) =>
        r.note.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      rows = rows.filter((r) => r.category === categoryFilter);
    }

    // Sort
    rows.sort((a, b) => {
      if (sort.key === "amount") {
        return sort.dir === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
      return sort.dir === "asc"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    });

    return rows.slice(page * limit, page * limit + limit);
  }, [transformedExpenses, search, categoryFilter, sort, page]);

  const total = transformedExpenses.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const del = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      toast.success("Expense deleted");
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  function toggleSort(key: Sort["key"]) {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My expenses</h1>
        <p className="text-sm text-muted-foreground">Every transaction, searchable and sortable.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search expenses…"
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-left">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("date")}
                  >
                    Date {sort.key === "date" && (sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("amount")}
                  >
                    Amount {sort.key === "amount" && (sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-16" /></td>
                    <td />
                  </tr>
                ))
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Inbox}
                      title="No expenses found"
                      description="Try a different search or add your first expense."
                      action={
                        <Button onClick={() => setOpen(true)}>
                          <Plus className="mr-1 h-4 w-4" /> Add expense
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(row.date)}</td>
                    <td className="px-4 py-3 font-medium">{row.note || "—"}</td>
                    <td className="px-4 py-3">
                      <span 
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: getCategoryColor(row.category) }}
                      >
                        {row.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Delete expense">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This can't be undone. {formatCurrency(row.amount)} on {formatDate(row.date)} will be removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => del.mutate(row.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {sortedRows.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Page {page + 1} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}