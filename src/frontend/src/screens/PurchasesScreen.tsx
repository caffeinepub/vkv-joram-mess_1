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
import type { Purchase } from "../types/mess";

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

export default function PurchasesScreen() {
  const { purchases, categories, addPurchase, updatePurchase, deletePurchase } =
    useMessData();
  const { isAdmin } = useAuth();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [form, setForm] = useState({
    date: todayStr(),
    supplier: "",
    itemName: "",
    quantity: "",
    unit: "",
    pricePerUnit: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Purchase>>({});

  const totalPurchase = useMemo(
    () =>
      Number.parseFloat(form.quantity || "0") *
      Number.parseFloat(form.pricePerUnit || "0"),
    [form.quantity, form.pricePerUnit],
  );

  const filteredPurchases = useMemo(
    () =>
      [...purchases]
        .filter((p) => p.date.startsWith(filterMonth))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [purchases, filterMonth],
  );

  const monthTotal = useMemo(
    () => filteredPurchases.reduce((sum, p) => sum + p.totalPurchase, 0),
    [filteredPurchases],
  );

  const activeCategories = categories.filter((c) => c.isActive);

  const handleAdd = () => {
    if (
      !form.date ||
      !form.supplier ||
      !form.itemName ||
      !form.quantity ||
      !form.unit ||
      !form.pricePerUnit
    ) {
      toast.error("Please fill all fields");
      return;
    }
    const qty = Number.parseFloat(form.quantity);
    const price = Number.parseFloat(form.pricePerUnit);
    if (Number.isNaN(qty) || Number.isNaN(price) || qty <= 0 || price <= 0) {
      toast.error("Quantity and price must be positive");
      return;
    }
    addPurchase({
      date: form.date,
      supplier: form.supplier,
      itemName: form.itemName,
      quantity: qty,
      unit: form.unit,
      pricePerUnit: price,
      totalPurchase: qty * price,
    });
    setForm((p) => ({
      ...p,
      supplier: "",
      itemName: "",
      quantity: "",
      unit: "",
      pricePerUnit: "",
    }));
    toast.success("Purchase added");
  };

  const startEdit = (p: Purchase) => {
    setEditingId(p.id);
    setEditForm({ ...p });
  };
  const saveEdit = () => {
    if (!editingId) return;
    const qty = editForm.quantity ?? 0;
    const price = editForm.pricePerUnit ?? 0;
    updatePurchase(editingId, { ...editForm, totalPurchase: qty * price });
    setEditingId(null);
    toast.success("Purchase updated");
  };

  return (
    <div className="screen-container">
      <h1 className="font-display text-xl font-bold mb-4">Purchases</h1>

      {/* Add Form */}
      <div className="form-card">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
          Add Purchase
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Date</Label>
            <Input
              data-ocid="purchases.date_input"
              type="date"
              value={toInputDate(form.date)}
              onChange={(e) =>
                setForm((p) => ({ ...p, date: fromInputDate(e.target.value) }))
              }
            />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Supplier</Label>
            <Input
              data-ocid="purchases.supplier_input"
              placeholder="Supplier name"
              value={form.supplier}
              onChange={(e) =>
                setForm((p) => ({ ...p, supplier: e.target.value }))
              }
            />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Item</Label>
            <Select
              value={form.itemName}
              onValueChange={(v) => setForm((p) => ({ ...p, itemName: v }))}
            >
              <SelectTrigger data-ocid="purchases.item_select">
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
              data-ocid="purchases.quantity_input"
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
              placeholder="kg / litre / pcs"
              value={form.unit}
              onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Price/Unit (₹)</Label>
            <Input
              data-ocid="purchases.price_input"
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
            <Label className="text-xs">Total (Auto)</Label>
            <div className="h-9 px-3 flex items-center bg-secondary border border-border rounded-md font-bold text-primary text-sm">
              ₹{totalPurchase.toFixed(2)}
            </div>
          </div>
        </div>
        <Button
          data-ocid="purchases.add_button"
          className="w-full mt-3 font-semibold"
          onClick={handleAdd}
        >
          + Add Purchase
        </Button>
      </div>

      {/* History */}
      <div className="form-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span className="w-1.5 h-4 bg-accent rounded-full inline-block" />
            Purchase History
          </h2>
          <input
            type="month"
            value={`${filterMonth.slice(0, 4)}-${filterMonth.slice(4, 6)}`}
            onChange={(e) => setFilterMonth(e.target.value.replace("-", ""))}
            className="text-xs border border-border rounded px-2 py-1 bg-card"
          />
        </div>

        <div className="mb-2 p-2 bg-secondary rounded-md flex justify-between">
          <span className="text-xs text-muted-foreground">
            {filteredPurchases.length} records
          </span>
          <span className="text-xs font-bold text-primary">
            Month Total: {formatCurrency(monthTotal)}
          </span>
        </div>

        {filteredPurchases.length === 0 ? (
          <div
            data-ocid="purchases.empty_state"
            className="py-6 text-center text-muted-foreground text-sm"
          >
            No purchases for this month
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4">
            <table className="register-table min-w-[600px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th className="text-right">Total</th>
                  {isAdmin && <th />}
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((p, idx) =>
                  editingId === p.id ? (
                    <tr
                      key={p.id}
                      data-ocid={`purchases.item.${idx + 1}`}
                      className="bg-secondary"
                    >
                      <td>
                        <Input
                          type="date"
                          value={toInputDate(editForm.date ?? "")}
                          onChange={(e) =>
                            setEditForm((x) => ({
                              ...x,
                              date: fromInputDate(e.target.value),
                            }))
                          }
                          className="h-7 text-xs w-24"
                        />
                      </td>
                      <td>
                        <Input
                          value={editForm.supplier ?? ""}
                          onChange={(e) =>
                            setEditForm((x) => ({
                              ...x,
                              supplier: e.target.value,
                            }))
                          }
                          className="h-7 text-xs w-20"
                        />
                      </td>
                      <td>
                        <Input
                          value={editForm.itemName ?? ""}
                          onChange={(e) =>
                            setEditForm((x) => ({
                              ...x,
                              itemName: e.target.value,
                            }))
                          }
                          className="h-7 text-xs w-18"
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={editForm.quantity ?? ""}
                          onChange={(e) =>
                            setEditForm((x) => ({
                              ...x,
                              quantity: Number.parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="h-7 text-xs w-14"
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={editForm.pricePerUnit ?? ""}
                          onChange={(e) =>
                            setEditForm((x) => ({
                              ...x,
                              pricePerUnit:
                                Number.parseFloat(e.target.value) || 0,
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
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-destructive p-1"
                        >
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id} data-ocid={`purchases.item.${idx + 1}`}>
                      <td className="text-xs">{displayDate(p.date)}</td>
                      <td className="text-xs">{p.supplier}</td>
                      <td className="font-medium">{p.itemName}</td>
                      <td>
                        {p.quantity} {p.unit}
                      </td>
                      <td>₹{p.pricePerUnit}</td>
                      <td className="text-right font-semibold text-primary">
                        {formatCurrency(p.totalPurchase)}
                      </td>
                      {isAdmin && (
                        <td className="flex gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="text-muted-foreground p-1"
                            data-ocid={`purchases.edit_button.${idx + 1}`}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deletePurchase(p.id);
                              toast.success("Deleted");
                            }}
                            className="text-destructive p-1"
                            data-ocid={`purchases.delete_button.${idx + 1}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ),
                )}
                <tr className="total-row">
                  <td colSpan={isAdmin ? 5 : 5} className="font-bold">
                    Month Total
                  </td>
                  <td className="text-right font-bold text-primary">
                    {formatCurrency(monthTotal)}
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
