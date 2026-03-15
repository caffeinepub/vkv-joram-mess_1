import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMessData } from "../context/MessDataContext";

function toInputDate(d: string) {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}
function fromInputDate(d: string) {
  return d.replace(/-/g, "");
}
function displayDate(d: string) {
  if (!d || d.length < 8) return d;
  return new Date(
    `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function todayStr() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function exportCSV(data: Record<string, string | number>[], filename: string) {
  if (!data.length) {
    toast.error("No data to export");
    return;
  }
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row)
      .map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v))
      .join(","),
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported");
}

export default function ReportsScreen() {
  const { entries, studentCounts, inventory, settings, getDailyTotal } =
    useMessData();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [dailyDate, setDailyDate] = useState(todayStr());
  const [reportMonth, setReportMonth] = useState(currentMonth);

  // Daily report data
  const dailyEntries = useMemo(
    () => entries.filter((e) => e.date === dailyDate),
    [entries, dailyDate],
  );
  const dailyTotal = useMemo(
    () => getDailyTotal(dailyDate),
    [getDailyTotal, dailyDate],
  );
  const dailyStudentCount = useMemo(
    () => studentCounts.find((s) => s.date === dailyDate),
    [studentCounts, dailyDate],
  );

  // Monthly report data
  const monthlyEntries = useMemo(
    () => entries.filter((e) => e.date.startsWith(reportMonth)),
    [entries, reportMonth],
  );
  const monthlyTotal = useMemo(
    () => monthlyEntries.reduce((sum, e) => sum + e.totalCost, 0),
    [monthlyEntries],
  );

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of monthlyEntries) {
      map.set(e.itemName, (map.get(e.itemName) ?? 0) + e.totalCost);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [monthlyEntries]);

  // Day-by-day breakdown for monthly
  const dayBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of monthlyEntries) {
      map.set(e.date, (map.get(e.date) ?? 0) + e.totalCost);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => {
        const sc = studentCounts.find((s) => s.date === date);
        return {
          date,
          total,
          present: sc?.studentsPresent ?? 0,
          perStudent: sc ? total / sc.studentsPresent : 0,
        };
      });
  }, [monthlyEntries, studentCounts]);

  const monthlyStudentCounts = useMemo(
    () => studentCounts.filter((s) => s.date.startsWith(reportMonth)),
    [studentCounts, reportMonth],
  );
  const avgStudents = useMemo(() => {
    if (!monthlyStudentCounts.length) return 0;
    return Math.round(
      monthlyStudentCounts.reduce((sum, s) => sum + s.totalStudents, 0) /
        monthlyStudentCounts.length,
    );
  }, [monthlyStudentCounts]);
  const perStudentMonthly = avgStudents > 0 ? monthlyTotal / avgStudents : 0;

  const monthLabel = `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number.parseInt(reportMonth.slice(4, 6)) - 1]} ${reportMonth.slice(0, 4)}`;

  // Export functions
  const exportDailyCSV = () => {
    const data = dailyEntries.map((e) => ({
      Date: displayDate(e.date),
      Item: e.itemName,
      Quantity: e.quantity,
      Unit: e.unit,
      "Rate (INR)": e.pricePerUnit,
      "Total (INR)": e.totalCost.toFixed(2),
    }));
    if (dailyStudentCount) {
      data.push({
        Date: "TOTAL",
        Item: `Students: ${dailyStudentCount.studentsPresent}`,
        Quantity: 0,
        Unit: "",
        "Rate (INR)": 0,
        "Total (INR)": dailyTotal.toFixed(2),
      });
    }
    exportCSV(data, `daily-report-${dailyDate}.csv`);
  };

  const exportMonthlyCSV = () => {
    const data = dayBreakdown.map((d) => ({
      Date: displayDate(d.date),
      "Total Expense": d.total.toFixed(2),
      "Students Present": d.present,
      "Per Student Cost": d.perStudent.toFixed(2),
    }));
    exportCSV(data, `monthly-report-${reportMonth}.csv`);
  };

  const exportStudentChargeCSV = () => {
    const data = monthlyStudentCounts.map((sc) => ({
      Date: displayDate(sc.date),
      "Total Students": sc.totalStudents,
      Present: sc.studentsPresent,
      "On Leave": sc.studentsOnLeave,
      "Per Student Cost": sc.perStudentCost.toFixed(2),
    }));
    exportCSV(data, `student-charges-${reportMonth}.csv`);
  };

  const exportGroceryCSV = () => {
    const data = inventory.map((item) => ({
      Item: item.itemName,
      Unit: item.unit,
      Purchased: item.quantityPurchased,
      Used: item.quantityUsed,
      Remaining: item.remainingStock,
      "Last Updated": new Date(item.updatedAt).toLocaleDateString("en-IN"),
    }));
    exportCSV(data, `grocery-consumption-${reportMonth}.csv`);
  };

  return (
    <div className="screen-container">
      <h1 className="font-display text-xl font-bold mb-4">Reports</h1>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4 h-9">
          <TabsTrigger
            data-ocid="reports.daily_tab"
            value="daily"
            className="text-xs"
          >
            Daily
          </TabsTrigger>
          <TabsTrigger
            data-ocid="reports.monthly_tab"
            value="monthly"
            className="text-xs"
          >
            Monthly
          </TabsTrigger>
          <TabsTrigger value="students" className="text-xs">
            Students
          </TabsTrigger>
          <TabsTrigger value="grocery" className="text-xs">
            Grocery
          </TabsTrigger>
        </TabsList>

        {/* Daily Report */}
        <TabsContent value="daily">
          <div className="form-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Daily Mess Report</h2>
              <input
                type="date"
                value={toInputDate(dailyDate)}
                onChange={(e) => setDailyDate(fromInputDate(e.target.value))}
                className="text-xs border border-border rounded px-2 py-1 bg-card"
              />
            </div>
            <div className="print-header hidden print:block mb-4">
              <h2 className="text-lg font-bold text-center">
                {settings.messName}
              </h2>
              <p className="text-center text-sm">
                {settings.schoolName} | Daily Mess Report
              </p>
              <p className="text-center text-sm">{displayDate(dailyDate)}</p>
            </div>
            {dailyEntries.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">
                No entries for {displayDate(dailyDate)}
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4">
                <table className="register-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Rate</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyEntries.map((e, i) => (
                      <tr key={e.id} data-ocid={`reports.daily.item.${i + 1}`}>
                        <td className="font-medium">{e.itemName}</td>
                        <td>{e.quantity}</td>
                        <td>{e.unit}</td>
                        <td>₹{e.pricePerUnit}</td>
                        <td className="text-right">
                          ₹{e.totalCost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan={4} className="font-bold">
                        Total
                      </td>
                      <td className="text-right font-bold text-primary">
                        {formatCurrency(dailyTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {dailyStudentCount && (
              <div className="mt-3 p-3 bg-secondary rounded-md grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Total Students:</span>{" "}
                  <strong>{dailyStudentCount.totalStudents}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Present:</span>{" "}
                  <strong className="text-success">
                    {dailyStudentCount.studentsPresent}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">On Leave:</span>{" "}
                  <strong className="text-accent">
                    {dailyStudentCount.studentsOnLeave}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Per Student:</span>{" "}
                  <strong className="text-primary">
                    {formatCurrency(dailyStudentCount.perStudentCost)}
                  </strong>
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-4 no-print">
              <Button
                data-ocid="reports.export_csv_button"
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1"
                onClick={exportDailyCSV}
              >
                <Download size={13} /> Export CSV
              </Button>
              <Button
                data-ocid="reports.print_button"
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1"
                onClick={() => window.print()}
              >
                <Printer size={13} /> Print
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Monthly Report */}
        <TabsContent value="monthly">
          <div className="form-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Monthly Expense Report</h2>
              <input
                type="month"
                value={`${reportMonth.slice(0, 4)}-${reportMonth.slice(4, 6)}`}
                onChange={(e) =>
                  setReportMonth(e.target.value.replace("-", ""))
                }
                className="text-xs border border-border rounded px-2 py-1 bg-card"
              />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-secondary p-2 rounded text-center">
                <p className="text-xs text-muted-foreground">Total Expense</p>
                <p className="font-bold text-primary text-sm">
                  {formatCurrency(monthlyTotal)}
                </p>
              </div>
              <div className="bg-secondary p-2 rounded text-center">
                <p className="text-xs text-muted-foreground">Per Student</p>
                <p className="font-bold text-success text-sm">
                  {formatCurrency(perStudentMonthly)}
                </p>
              </div>
              <div className="bg-secondary p-2 rounded text-center">
                <p className="text-xs text-muted-foreground">Avg Students</p>
                <p className="font-bold text-sm">{avgStudents}</p>
              </div>
              <div className="bg-secondary p-2 rounded text-center">
                <p className="text-xs text-muted-foreground">Month</p>
                <p className="font-bold text-sm">{monthLabel}</p>
              </div>
            </div>

            {/* Category breakdown */}
            {categoryTotals.length > 0 && (
              <>
                <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                  By Category
                </h3>
                <div className="overflow-x-auto -mx-4 mb-4">
                  <table className="register-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th className="text-right">Total</th>
                        <th className="text-right">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryTotals.map(([cat, total], i) => (
                        <tr
                          key={cat}
                          data-ocid={`reports.monthly.item.${i + 1}`}
                        >
                          <td className="font-medium">{cat}</td>
                          <td className="text-right">
                            {formatCurrency(total)}
                          </td>
                          <td className="text-right text-muted-foreground">
                            {monthlyTotal > 0
                              ? ((total / monthlyTotal) * 100).toFixed(1)
                              : 0}
                            %
                          </td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td className="font-bold">Grand Total</td>
                        <td className="text-right font-bold text-primary">
                          {formatCurrency(monthlyTotal)}
                        </td>
                        <td className="text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Day-by-day */}
            {dayBreakdown.length > 0 && (
              <>
                <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                  Day-by-Day
                </h3>
                <div className="overflow-x-auto -mx-4">
                  <table className="register-table min-w-[380px]">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th className="text-right">Expense</th>
                        <th className="text-right">Present</th>
                        <th className="text-right">Per Student</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayBreakdown.map((d, i) => (
                        <tr
                          key={d.date}
                          data-ocid={`reports.monthly.day.item.${i + 1}`}
                        >
                          <td className="text-xs">{displayDate(d.date)}</td>
                          <td className="text-right font-medium">
                            {formatCurrency(d.total)}
                          </td>
                          <td className="text-right">{d.present || "-"}</td>
                          <td className="text-right text-primary">
                            {d.present > 0 ? formatCurrency(d.perStudent) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {monthlyEntries.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-6">
                No data for {monthLabel}
              </p>
            )}

            <div className="flex gap-2 mt-4 no-print">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1"
                onClick={exportMonthlyCSV}
              >
                <Download size={13} /> Export CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1"
                onClick={() => window.print()}
              >
                <Printer size={13} /> Print
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Student Charge Report */}
        <TabsContent value="students">
          <div className="form-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Student Mess Charge</h2>
              <input
                type="month"
                value={`${reportMonth.slice(0, 4)}-${reportMonth.slice(4, 6)}`}
                onChange={(e) =>
                  setReportMonth(e.target.value.replace("-", ""))
                }
                className="text-xs border border-border rounded px-2 py-1 bg-card"
              />
            </div>
            <div className="mb-3 p-2 bg-secondary rounded flex justify-between text-xs">
              <span>
                Monthly Total: <strong>{formatCurrency(monthlyTotal)}</strong>
              </span>
              <span>
                Per Student:{" "}
                <strong className="text-primary">
                  {formatCurrency(perStudentMonthly)}
                </strong>
              </span>
            </div>
            {monthlyStudentCounts.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">
                No student data for {monthLabel}
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4">
                <table className="register-table min-w-[420px]">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-right">Total</th>
                      <th className="text-right">Present</th>
                      <th className="text-right">On Leave</th>
                      <th className="text-right">Per Student</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...monthlyStudentCounts]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((sc, i) => (
                        <tr
                          key={sc.id}
                          data-ocid={`reports.students.item.${i + 1}`}
                        >
                          <td className="text-xs">{displayDate(sc.date)}</td>
                          <td className="text-right">{sc.totalStudents}</td>
                          <td className="text-right text-success">
                            {sc.studentsPresent}
                          </td>
                          <td className="text-right text-accent">
                            {sc.studentsOnLeave}
                          </td>
                          <td className="text-right font-semibold text-primary">
                            {formatCurrency(sc.perStudentCost)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex gap-2 mt-4 no-print">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1"
                onClick={exportStudentChargeCSV}
              >
                <Download size={13} /> Export CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1"
                onClick={() => window.print()}
              >
                <Printer size={13} /> Print
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Grocery Report */}
        <TabsContent value="grocery">
          <div className="form-card">
            <h2 className="text-sm font-semibold mb-3">Grocery Consumption</h2>
            {inventory.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">
                No inventory data
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4">
                <table className="register-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Unit</th>
                      <th className="text-right">Purchased</th>
                      <th className="text-right">Used</th>
                      <th className="text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, i) => (
                      <tr
                        key={item.id}
                        data-ocid={`reports.grocery.item.${i + 1}`}
                      >
                        <td className="font-medium">{item.itemName}</td>
                        <td>{item.unit}</td>
                        <td className="text-right">{item.quantityPurchased}</td>
                        <td className="text-right text-accent">
                          {item.quantityUsed}
                        </td>
                        <td
                          className={`text-right font-semibold ${
                            item.remainingStock / item.quantityPurchased > 0.5
                              ? "text-success"
                              : item.remainingStock / item.quantityPurchased >=
                                  0.2
                                ? "text-warning"
                                : "text-destructive"
                          }`}
                        >
                          {item.remainingStock.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex gap-2 mt-4 no-print">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1"
                onClick={exportGroceryCSV}
              >
                <Download size={13} /> Export CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1"
                onClick={() => window.print()}
              >
                <Printer size={13} /> Print
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
