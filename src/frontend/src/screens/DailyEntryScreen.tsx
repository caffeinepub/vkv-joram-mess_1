import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useMessData } from "../context/MessDataContext";
import type { MessEntry } from "../types/mess";

function todayStr() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}
function toInputDate(d: string) {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}
function fromInputDate(d: string) {
  return d.replace(/-/g, "");
}
function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export default function DailyEntryScreen() {
  const {
    entries,
    categories,
    addEntry,
    updateEntry,
    deleteEntry,
    getDailyTotal,
  } = useMessData();
  const { user, isAdmin } = useAuth();

  const [viewDate, setViewDate] = useState(todayStr());
  const [form, setForm] = useState({
    date: todayStr(),
    itemName: "",
    quantity: "",
    unit: "",
    pricePerUnit: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MessEntry>>({});

  const totalCost = useMemo(
    () =>
      Number.parseFloat(form.quantity || "0") *
      Number.parseFloat(form.pricePerUnit || "0"),
    [form.quantity, form.pricePerUnit],
  );

  const viewEntries = useMemo(
    () => entries.filter((e) => e.date === viewDate),
    [entries, viewDate],
  );
  const dailyTotal = useMemo(
    () => getDailyTotal(viewDate),
    [getDailyTotal, viewDate],
  );

  const activeCategories = categories.filter((c) => c.isActive);

  const handleAdd = () => {
    if (!form.itemName || !form.quantity || !form.unit || !form.pricePerUnit) {
      toast.error("Please fill all fields");
      return;
    }
    const qty = Number.parseFloat(form.quantity);
    const price = Number.parseFloat(form.pricePerUnit);
    if (Number.isNaN(qty) || Number.isNaN(price) || qty <= 0 || price <= 0) {
      toast.error("Quantity and price must be positive numbers");
      return;
    }
    addEntry({
      date: form.date,
      itemName: form.itemName,
      quantity: qty,
      unit: form.unit,
      pricePerUnit: price,
      totalCost: qty * price,
      createdBy: user?.username ?? "staff",
    });
    setForm((prev) => ({
      ...prev,
      itemName: "",
      quantity: "",
      unit: "",
      pricePerUnit: "",
    }));
    setViewDate(form.date);
    toast.success("Entry added");
  };

  const startEdit = (e: MessEntry) => {
    setEditingId(e.id);
    setEditForm({ ...e });
  };
  const saveEdit = () => {
    if (!editingId || !editForm) return;
    const qty = editForm.quantity ?? 0;
    const price = editForm.pricePerUnit ?? 0;
    updateEntry(editingId, { ...editForm, totalCost: qty * price });
    setEditingId(null);
    toast.success("Entry updated");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="screen-container">
      <h1 className="font-display text-xl font-bold mb-4">Daily Mess Entry</h1>

      {/* Add Entry Form */}
      <div className="form-card">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
          Add Entry
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Date</Label>
            <Input
              data-ocid="daily_entry.date_input"
              type="date"
              value={toInputDate(form.date)}
              onChange={(e) =>
                setForm((p) => ({ ...p, date: fromInputDate(e.target.value) }))
              }
            />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Item Name</Label>
            <Select
              value={form.itemName}
              onValueChange={(v) => setForm((p) => ({ ...p, itemName: v }))}
            >
              <SelectTrigger data-ocid="daily_entry.item_select">
                <SelectValue placeholder="Select item..." />
              </SelectTrigger>
              <SelectContent>
                {activeCategories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Quantity</Label>
            <Input
              data-ocid="daily_entry.quantity_input"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              value={form.quantity}
              onChange={(e) =>
                setForm((p) => ({ ...p, quantity: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Unit</Label>
            <Input
              data-ocid="daily_entry.unit_input"
              placeholder="kg / litre / pcs"
              value={form.unit}
              onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Price per Unit (₹)</Label>
            <Input
              data-ocid="daily_entry.price_input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.pricePerUnit}
              onChange={(e) =>
                setForm((p) => ({ ...p, pricePerUnit: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Total Cost (Auto)</Label>
            <div className="h-9 px-3 flex items-center bg-secondary border border-border rounded-md font-bold text-primary text-sm">
              ₹{totalCost.toFixed(2)}
            </div>
          </div>
        </div>
        <Button
          data-ocid="daily_entry.add_button"
          className="w-full mt-3 font-semibold"
          onClick={handleAdd}
        >
          + Add Entry
        </Button>
      </div>

      {/* Date View */}
      <div className="form-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span className="w-1.5 h-4 bg-accent rounded-full inline-block" />
            View by Date
          </h2>
          <Input
            type="date"
            value={toInputDate(viewDate)}
            onChange={(e) => setViewDate(fromInputDate(e.target.value))}
            className="w-36 text-xs h-8"
          />
        </div>

        <p className="text-xs text-muted-foreground mb-2">
          {displayDate(viewDate)}
        </p>

        {viewEntries.length === 0 ? (
          <div
            data-ocid="daily_entry.empty_state"
            className="py-6 text-center text-muted-foreground text-sm"
          >
            No entries for this date
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4">
            <table className="register-table min-w-[480px]">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Rate</th>
                  <th className="text-right">Total</th>
                  {isAdmin && <th />}
                </tr>
              </thead>
              <tbody>
                {viewEntries.map((e, idx) =>
                  editingId === e.id ? (
                    <tr
                      key={e.id}
                      data-ocid={`daily_entry.item.${idx + 1}`}
                      className="bg-secondary"
                    >
                      <td>
                        <Select
                          value={editForm.itemName ?? ""}
                          onValueChange={(v) =>
                            setEditForm((p) => ({ ...p, itemName: v }))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {activeCategories.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={editForm.quantity ?? ""}
                          onChange={(ev) =>
                            setEditForm((p) => ({
                              ...p,
                              quantity: Number.parseFloat(ev.target.value) || 0,
                            }))
                          }
                          className="h-7 text-xs w-16"
                        />
                      </td>
                      <td>
                        <Input
                          value={editForm.unit ?? ""}
                          onChange={(ev) =>
                            setEditForm((p) => ({
                              ...p,
                              unit: ev.target.value,
                            }))
                          }
                          className="h-7 text-xs w-14"
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={editForm.pricePerUnit ?? ""}
                          onChange={(ev) =>
                            setEditForm((p) => ({
                              ...p,
                              pricePerUnit:
                                Number.parseFloat(ev.target.value) || 0,
                            }))
                          }
                          className="h-7 text-xs w-16"
                        />
                      </td>
                      <td className="text-right font-bold text-primary">
                        ₹
                        {(
                          (editForm.quantity ?? 0) *
                          (editForm.pricePerUnit ?? 0)
                        ).toFixed(2)}
                      </td>
                      <td className="flex gap-1">
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="text-success p-1"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-destructive p-1"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={e.id} data-ocid={`daily_entry.item.${idx + 1}`}>
                      <td className="font-medium">{e.itemName}</td>
                      <td>{e.quantity}</td>
                      <td>{e.unit}</td>
                      <td>₹{e.pricePerUnit}</td>
                      <td className="text-right font-semibold">
                        ₹{e.totalCost.toFixed(2)}
                      </td>
                      {isAdmin && (
                        <td className="flex gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => startEdit(e)}
                            className="text-muted-foreground hover:text-foreground p-1"
                            data-ocid={`daily_entry.edit_button.${idx + 1}`}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteEntry(e.id);
                              toast.success("Deleted");
                            }}
                            className="text-destructive p-1"
                            data-ocid={`daily_entry.delete_button.${idx + 1}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ),
                )}
                <tr className="total-row">
                  <td colSpan={isAdmin ? 4 : 4} className="font-bold">
                    Daily Total
                  </td>
                  <td className="text-right font-bold text-primary">
                    {formatCurrency(dailyTotal)}
                  </td>
                  {isAdmin && <td />}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
