import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useMessData } from "../context/MessDataContext";
import type { ActiveScreen } from "../types/mess";

interface Props {
  onNavigate: (screen: ActiveScreen) => void;
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return dateStr;
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return new Date(`${y}-${m}-${d}`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function DashboardScreen({ onNavigate }: Props) {
  const { entries, studentCounts, settings, getDailyTotal, getMonthlyTotal } =
    useMessData();
  const { user } = useAuth();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const currentMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthName = now.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const todayExpense = useMemo(
    () => getDailyTotal(todayStr),
    [getDailyTotal, todayStr],
  );
  const monthlyExpense = useMemo(
    () => getMonthlyTotal(currentMonth),
    [getMonthlyTotal, currentMonth],
  );

  const latestStudentCount = useMemo(() => {
    const todayCount = studentCounts.find((s) => s.date === todayStr);
    if (todayCount) return todayCount;
    const sorted = [...studentCounts].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    return sorted[0];
  }, [studentCounts, todayStr]);

  const totalStudents = latestStudentCount?.totalStudents ?? 0;
  const studentsPresent = latestStudentCount?.studentsPresent ?? 0;

  const perStudentMonthly = useMemo(() => {
    if (totalStudents === 0) return 0;
    return monthlyExpense / totalStudents;
  }, [monthlyExpense, totalStudents]);

  const todayEntries = useMemo(
    () =>
      entries
        .filter((e) => e.date === todayStr)
        .slice(-5)
        .reverse(),
    [entries, todayStr],
  );

  const recentDays = useMemo(() => {
    const days = new Map<string, number>();
    for (const e of entries) {
      days.set(e.date, (days.get(e.date) ?? 0) + e.totalCost);
    }
    return Array.from(days.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 5);
  }, [entries]);

  const stats = [
    {
      label: monthName,
      value: formatCurrency(monthlyExpense),
      sub: "Monthly Expense",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-secondary",
    },
    {
      label: String(totalStudents),
      value: studentsPresent > 0 ? `${studentsPresent} present` : "No data",
      sub: "Total Students",
      icon: Users,
      color: "text-chart-5",
      bg: "bg-muted",
    },
    {
      label: formatCurrency(perStudentMonthly),
      value: "Per Student",
      sub: "Monthly Charge",
      icon: IndianRupee,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: formatCurrency(todayExpense),
      value: "Today",
      sub: "Today's Expense",
      icon: CalendarDays,
      color: "text-accent",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="screen-container">
      {/* Header */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground">
          {now.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="font-display text-xl font-bold text-foreground">
          Welcome, {user?.username}!
        </h1>
        <p className="text-xs text-muted-foreground">{settings.schoolName}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map((stat) => (
          <div key={stat.sub} className={`stat-card ${stat.bg}`}>
            <div className="flex items-start justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">
                {stat.sub}
              </span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <p
              className={`font-display text-base font-bold ${stat.color} leading-tight`}
            >
              {stat.label}
            </p>
            <p className="text-xs text-muted-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-2">
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onNavigate("daily_entry")}
            className="flex flex-col items-center gap-1.5 p-3 bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <ClipboardList size={20} className="text-primary" />
            <span className="text-xs font-medium text-foreground">
              Add Entry
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("students")}
            className="flex flex-col items-center gap-1.5 p-3 bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <Users size={20} className="text-chart-5" />
            <span className="text-xs font-medium text-foreground">
              Students
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("purchases")}
            className="flex flex-col items-center gap-1.5 p-3 bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <ShoppingCart size={20} className="text-accent" />
            <span className="text-xs font-medium text-foreground">
              Purchases
            </span>
          </button>
        </div>
      </div>

      {/* Today's Entries */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            Today's Entries
          </h2>
          <button
            type="button"
            onClick={() => onNavigate("daily_entry")}
            className="flex items-center gap-1 text-xs text-primary"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {todayEntries.length === 0 ? (
            <div
              data-ocid="dashboard.empty_state"
              className="py-6 text-center text-muted-foreground text-sm"
            >
              No entries for today yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="register-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {todayEntries.map((e, i) => (
                    <tr key={e.id} data-ocid={`dashboard.entry.item.${i + 1}`}>
                      <td className="font-medium">{e.itemName}</td>
                      <td className="text-right">
                        {e.quantity} {e.unit}
                      </td>
                      <td className="text-right">₹{e.pricePerUnit}</td>
                      <td className="text-right font-semibold">
                        ₹{e.totalCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={3} className="font-bold">
                      Today's Total
                    </td>
                    <td className="text-right font-bold text-primary">
                      {formatCurrency(todayExpense)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Days Summary */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">
          Recent Days
        </h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {recentDays.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-sm">
              No data
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="register-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Expense</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDays.map(([date, total], i) => (
                    <tr key={date} data-ocid={`dashboard.recent.item.${i + 1}`}>
                      <td>{formatDate(date)}</td>
                      <td className="text-right font-semibold text-primary">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
