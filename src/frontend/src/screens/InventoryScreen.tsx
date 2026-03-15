import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import type { InventoryItem } from "../types/mess";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function stockColor(pct: number) {
  if (pct > 50) return "text-success";
  if (pct >= 20) return "text-warning";
  return "text-destructive";
}

function stockBarColor(pct: number) {
  if (pct > 50) return "bg-success";
  if (pct >= 20) return "bg-accent";
  return "bg-destructive";
}

export default function InventoryScreen() {
  const {
    inventory,
    categories,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  } = useMessData();
  const { isAdmin } = useAuth();

  const [form, setForm] = useState({
    itemName: "",
    unit: "",
    quantityPurchased: "",
    quantityUsed: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});
  const [updateUsedId, setUpdateUsedId] = useState<string | null>(null);
  const [usedValue, setUsedValue] = useState("");

  const remainingStock = useMemo(
    () =>
      Math.max(
        0,
        Number.parseFloat(form.quantityPurchased || "0") -
          Number.parseFloat(form.quantityUsed || "0"),
      ),
    [form.quantityPurchased, form.quantityUsed],
  );

  const activeCategories = categories.filter((c) => c.isActive);

  const handleAdd = () => {
    if (!form.itemName || !form.unit || !form.quantityPurchased) {
      toast.error("Please fill required fields");
      return;
    }
    const purchased = Number.parseFloat(form.quantityPurchased);
    const used = Number.parseFloat(form.quantityUsed || "0");
    addInventoryItem({
      itemName: form.itemName,
      unit: form.unit,
      quantityPurchased: purchased,
      quantityUsed: used,
      remainingStock: purchased - used,
    });
    setForm({
      itemName: "",
      unit: "",
      quantityPurchased: "",
      quantityUsed: "",
    });
    toast.success("Inventory item added");
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };
  const saveEdit = () => {
    if (!editingId) return;
    const purchased = editForm.quantityPurchased ?? 0;
    const used = editForm.quantityUsed ?? 0;
    updateInventoryItem(editingId, {
      ...editForm,
      remainingStock: purchased - used,
    });
    setEditingId(null);
    toast.success("Updated");
  };

  const handleUpdateUsed = (id: string) => {
    const newUsed = Number.parseFloat(usedValue);
    if (Number.isNaN(newUsed) || newUsed < 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    updateInventoryItem(id, {
      quantityUsed: newUsed,
      remainingStock: item.quantityPurchased - newUsed,
    });
    setUpdateUsedId(null);
    setUsedValue("");
    toast.success("Usage updated");
  };

  return (
    <div className="screen-container">
      <h1 className="font-display text-xl font-bold mb-4">Inventory</h1>

      {/* Add Form */}
      <div className="form-card">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
          Add / Update Stock
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Item Name</Label>
            <Select
              value={form.itemName}
              onValueChange={(v) => setForm((p) => ({ ...p, itemName: v }))}
            >
              <SelectTrigger data-ocid="inventory.item_select">
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
            <Label className="text-xs">Unit</Label>
            <Input
              placeholder="kg / litre"
              value={form.unit}
              onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Qty Purchased</Label>
            <Input
              data-ocid="inventory.purchased_input"
              type="number"
              min="0"
              placeholder="0"
              value={form.quantityPurchased}
              onChange={(e) =>
                setForm((p) => ({ ...p, quantityPurchased: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Qty Used</Label>
            <Input
              data-ocid="inventory.used_input"
              type="number"
              min="0"
              placeholder="0"
              value={form.quantityUsed}
              onChange={(e) =>
                setForm((p) => ({ ...p, quantityUsed: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Remaining (Auto)</Label>
            <div className="h-9 px-3 flex items-center bg-secondary border border-border rounded-md font-bold text-primary text-sm">
              {remainingStock.toFixed(1)}
            </div>
          </div>
        </div>
        <Button
          data-ocid="inventory.save_button"
          className="w-full mt-3 font-semibold"
          onClick={handleAdd}
        >
          Save to Inventory
        </Button>
      </div>

      {/* Stock List */}
      <div className="form-card">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-accent rounded-full inline-block" />
          Current Stock
        </h2>
        {inventory.length === 0 ? (
          <div
            data-ocid="inventory.empty_state"
            className="py-6 text-center text-muted-foreground text-sm"
          >
            No inventory items
          </div>
        ) : (
          <div className="space-y-3">
            {inventory.map((item, idx) => {
              const pct =
                item.quantityPurchased > 0
                  ? Math.min(
                      100,
                      (item.remainingStock / item.quantityPurchased) * 100,
                    )
                  : 0;
              const isEdit = editingId === item.id;
              return (
                <div
                  key={item.id}
                  data-ocid={`inventory.item.${idx + 1}`}
                  className="border border-border rounded-lg p-3 bg-card"
                >
                  {isEdit ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={editForm.itemName ?? ""}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              itemName: e.target.value,
                            }))
                          }
                          className="h-7 text-xs"
                          placeholder="Item name"
                        />
                        <Input
                          value={editForm.unit ?? ""}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, unit: e.target.value }))
                          }
                          className="h-7 text-xs w-16"
                          placeholder="unit"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Purchased</Label>
                          <Input
                            type="number"
                            value={editForm.quantityPurchased ?? ""}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                quantityPurchased:
                                  Number.parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Used</Label>
                          <Input
                            type="number"
                            value={editForm.quantityUsed ?? ""}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                quantityUsed:
                                  Number.parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                          className="h-7 text-xs"
                        >
                          <X size={12} /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveEdit}
                          className="h-7 text-xs"
                        >
                          <Check size={12} /> Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-semibold text-sm text-foreground">
                            {item.itemName}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({item.unit})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                                className="text-muted-foreground p-1"
                                data-ocid={`inventory.edit_button.${idx + 1}`}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteInventoryItem(item.id);
                                  toast.success("Removed");
                                }}
                                className="text-destructive p-1"
                                data-ocid={`inventory.delete_button.${idx + 1}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Purchased
                          </p>
                          <p className="font-semibold text-sm">
                            {item.quantityPurchased}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Used</p>
                          <p className="font-semibold text-sm text-accent">
                            {item.quantityUsed}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Remaining
                          </p>
                          <p className={`font-bold text-sm ${stockColor(pct)}`}>
                            {item.remainingStock.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={`${stockColor(pct)} font-medium`}>
                            {pct > 50 ? "Good" : pct >= 20 ? "Low" : "Critical"}
                          </span>
                          <span className="text-muted-foreground">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${stockBarColor(pct)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      {updateUsedId === item.id ? (
                        <div className="flex gap-2 mt-2">
                          <Input
                            type="number"
                            placeholder="New used qty"
                            value={usedValue}
                            onChange={(e) => setUsedValue(e.target.value)}
                            className="h-7 text-xs flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateUsed(item.id)}
                            className="h-7 text-xs"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUpdateUsedId(null)}
                            className="h-7 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUpdateUsedId(item.id);
                            setUsedValue(String(item.quantityUsed));
                          }}
                          className="mt-2 text-xs text-primary font-medium hover:underline"
                        >
                          Update Used Quantity
                        </button>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated: {formatDate(item.updatedAt)}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
