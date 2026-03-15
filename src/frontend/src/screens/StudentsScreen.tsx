import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useMessData } from "../context/MessDataContext";

function todayStr() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}
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

export default function StudentsScreen() {
  const {
    studentCounts,
    addStudentCount,
    updateStudentCount,
    deleteStudentCount,
    getDailyTotal,
  } = useMessData();
  const { isAdmin } = useAuth();

  const [form, setForm] = useState({
    date: todayStr(),
    totalStudents: "",
    studentsPresent: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    totalStudents: "",
    studentsPresent: "",
  });

  const studentsOnLeave = useMemo(() => {
    const total = Number.parseInt(form.totalStudents || "0");
    const present = Number.parseInt(form.studentsPresent || "0");
    return Math.max(0, total - present);
  }, [form.totalStudents, form.studentsPresent]);

  const perStudentCost = useMemo(() => {
    const present = Number.parseInt(form.studentsPresent || "0");
    if (present <= 0) return 0;
    return getDailyTotal(form.date) / present;
  }, [form.studentsPresent, form.date, getDailyTotal]);

  const editOnLeave = useMemo(() => {
    return Math.max(
      0,
      Number.parseInt(editForm.totalStudents || "0") -
        Number.parseInt(editForm.studentsPresent || "0"),
    );
  }, [editForm.totalStudents, editForm.studentsPresent]);

  const editPerStudentCost = useMemo(() => {
    const present = Number.parseInt(editForm.studentsPresent || "0");
    if (present <= 0) return 0;
    return getDailyTotal(editForm.date) / present;
  }, [editForm.studentsPresent, editForm.date, getDailyTotal]);

  const sortedCounts = useMemo(
    () => [...studentCounts].sort((a, b) => b.date.localeCompare(a.date)),
    [studentCounts],
  );

  const handleSave = () => {
    const total = Number.parseInt(form.totalStudents);
    const present = Number.parseInt(form.studentsPresent);
    if (!form.date || Number.isNaN(total) || Number.isNaN(present)) {
      toast.error("Please fill all fields with valid numbers");
      return;
    }
    if (present > total) {
      toast.error("Present cannot exceed total students");
      return;
    }
    addStudentCount({
      date: form.date,
      totalStudents: total,
      studentsPresent: present,
      studentsOnLeave: total - present,
      perStudentCost,
    });
    setForm({ date: todayStr(), totalStudents: "", studentsPresent: "" });
    toast.success("Student count saved");
  };

  const startEdit = (sc: (typeof studentCounts)[0]) => {
    setEditingId(sc.id);
    setEditForm({
      date: sc.date,
      totalStudents: String(sc.totalStudents),
      studentsPresent: String(sc.studentsPresent),
    });
  };
  const saveEdit = () => {
    if (!editingId) return;
    const total = Number.parseInt(editForm.totalStudents);
    const present = Number.parseInt(editForm.studentsPresent);
    updateStudentCount(editingId, {
      date: editForm.date,
      totalStudents: total,
      studentsPresent: present,
      studentsOnLeave: total - present,
      perStudentCost: editPerStudentCost,
    });
    setEditingId(null);
    toast.success("Updated");
  };

  return (
    <div className="screen-container">
      <h1 className="font-display text-xl font-bold mb-4">Student Count</h1>

      {/* Form */}
      <div className="form-card">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
          Record Attendance
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Date</Label>
            <Input
              data-ocid="students.date_input"
              type="date"
              value={toInputDate(form.date)}
              onChange={(e) =>
                setForm((p) => ({ ...p, date: fromInputDate(e.target.value) }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Total Students</Label>
            <Input
              data-ocid="students.total_input"
              type="number"
              min="0"
              placeholder="100"
              value={form.totalStudents}
              onChange={(e) =>
                setForm((p) => ({ ...p, totalStudents: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Students Present</Label>
            <Input
              data-ocid="students.present_input"
              type="number"
              min="0"
              placeholder="90"
              value={form.studentsPresent}
              onChange={(e) =>
                setForm((p) => ({ ...p, studentsPresent: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">On Leave (Auto)</Label>
            <div className="h-9 px-3 flex items-center bg-secondary border border-border rounded-md font-bold text-accent text-sm">
              {studentsOnLeave}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Per Student Cost (Auto)</Label>
            <div className="h-9 px-3 flex items-center bg-secondary border border-border rounded-md font-bold text-primary text-sm">
              ₹{perStudentCost.toFixed(2)}
            </div>
          </div>
        </div>
        <Button
          data-ocid="students.save_button"
          className="w-full mt-3 font-semibold"
          onClick={handleSave}
        >
          Save Attendance
        </Button>
      </div>

      {/* History */}
      <div className="form-card">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-accent rounded-full inline-block" />
          Attendance History
        </h2>
        {sortedCounts.length === 0 ? (
          <div
            data-ocid="students.empty_state"
            className="py-6 text-center text-muted-foreground text-sm"
          >
            No attendance records yet
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4">
            <table className="register-table min-w-[480px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Present</th>
                  <th className="text-right">Leave</th>
                  <th className="text-right">Per/Student</th>
                  {isAdmin && <th />}
                </tr>
              </thead>
              <tbody>
                {sortedCounts.map((sc, idx) =>
                  editingId === sc.id ? (
                    <tr
                      key={sc.id}
                      data-ocid={`students.item.${idx + 1}`}
                      className="bg-secondary"
                    >
                      <td>
                        <Input
                          type="date"
                          value={toInputDate(editForm.date)}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              date: fromInputDate(e.target.value),
                            }))
                          }
                          className="h-7 text-xs w-28"
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={editForm.totalStudents}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              totalStudents: e.target.value,
                            }))
                          }
                          className="h-7 text-xs w-16"
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={editForm.studentsPresent}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              studentsPresent: e.target.value,
                            }))
                          }
                          className="h-7 text-xs w-16"
                        />
                      </td>
                      <td className="text-right font-bold text-accent">
                        {editOnLeave}
                      </td>
                      <td className="text-right font-bold text-primary">
                        ₹{editPerStudentCost.toFixed(2)}
                      </td>
                      <td className="flex gap-1">
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="text-success p-1 text-xs font-bold"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-destructive p-1 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={sc.id} data-ocid={`students.item.${idx + 1}`}>
                      <td className="text-xs">{displayDate(sc.date)}</td>
                      <td className="text-right">{sc.totalStudents}</td>
                      <td className="text-right text-success font-medium">
                        {sc.studentsPresent}
                      </td>
                      <td className="text-right text-accent font-medium">
                        {sc.studentsOnLeave}
                      </td>
                      <td className="text-right font-semibold text-primary">
                        {formatCurrency(sc.perStudentCost)}
                      </td>
                      {isAdmin && (
                        <td className="flex gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => startEdit(sc)}
                            className="text-muted-foreground p-1"
                            data-ocid={`students.edit_button.${idx + 1}`}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteStudentCount(sc.id);
                              toast.success("Deleted");
                            }}
                            className="text-destructive p-1"
                            data-ocid={`students.delete_button.${idx + 1}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
