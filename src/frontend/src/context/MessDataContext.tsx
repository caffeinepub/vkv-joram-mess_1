import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  FoodCategory,
  InventoryItem,
  MessEntry,
  MessSettings,
  MessUser,
  Purchase,
  StudentCount,
} from "../types/mess";

const KEYS = {
  entries: "mess_entries",
  students: "mess_student_counts",
  purchases: "mess_purchases",
  inventory: "mess_inventory",
  categories: "mess_food_categories",
  settings: "mess_settings",
  users: "mess_users",
};

const RESET_FLAG = "mess_data_was_reset";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_CATEGORIES: FoodCategory[] = [
  "Rice",
  "Dal",
  "Vegetables",
  "Oil",
  "Eggs",
  "Fish",
  "Chicken",
  "Milk",
  "Spices",
  "Others",
].map((name, i) => ({ id: `cat-${i}`, name, isActive: true }));

const DEFAULT_USERS: MessUser[] = [
  {
    id: "user-admin",
    username: "admin",
    password: "1234",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-staff",
    username: "staff",
    password: "5678",
    role: "staff",
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_SETTINGS: MessSettings = {
  messName: "VKV Joram Mess",
  schoolName: "VKV Joram",
  academicYear: "2025-26",
};

const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: uid(),
    itemName: "Rice",
    unit: "kg",
    quantityPurchased: 50,
    quantityUsed: 12,
    remainingStock: 38,
    updatedAt: new Date().toISOString(),
  },
  {
    id: uid(),
    itemName: "Dal",
    unit: "kg",
    quantityPurchased: 20,
    quantityUsed: 5,
    remainingStock: 15,
    updatedAt: new Date().toISOString(),
  },
  {
    id: uid(),
    itemName: "Oil",
    unit: "litre",
    quantityPurchased: 10,
    quantityUsed: 3,
    remainingStock: 7,
    updatedAt: new Date().toISOString(),
  },
  {
    id: uid(),
    itemName: "Vegetables",
    unit: "kg",
    quantityPurchased: 15,
    quantityUsed: 8,
    remainingStock: 7,
    updatedAt: new Date().toISOString(),
  },
  {
    id: uid(),
    itemName: "Spices",
    unit: "kg",
    quantityPurchased: 3,
    quantityUsed: 2.5,
    remainingStock: 0.5,
    updatedAt: new Date().toISOString(),
  },
];

function seed3MonthsData(): {
  entries: MessEntry[];
  students: StudentCount[];
  purchases: Purchase[];
} {
  const entries: MessEntry[] = [];
  const students: StudentCount[] = [];
  const purchases: Purchase[] = [];
  const now = new Date();
  const itemNames = ["Rice", "Dal", "Vegetables", "Oil", "Eggs"];
  const unitMap: Record<string, string> = {
    Rice: "kg",
    Dal: "kg",
    Vegetables: "kg",
    Oil: "litre",
    Eggs: "pcs",
  };
  const priceMap: Record<string, number> = {
    Rice: 45,
    Dal: 80,
    Vegetables: 30,
    Oil: 120,
    Eggs: 6,
  };
  const qtyMap: Record<string, number> = {
    Rice: 10,
    Dal: 3,
    Vegetables: 5,
    Oil: 2,
    Eggs: 50,
  };

  for (let d = 25; d >= 1; d--) {
    const date = new Date(now.getFullYear(), now.getMonth(), d);
    if (date > now) continue;
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const dayItems = itemNames.slice(0, 3 + (d % 3));
    let dailyTotal = 0;
    for (const [idx, item] of dayItems.entries()) {
      const qty = qtyMap[item] + (d % 3);
      const price = priceMap[item];
      const total = qty * price;
      dailyTotal += total;
      entries.push({
        id: uid(),
        date: dateStr,
        itemName: item,
        quantity: qty,
        unit: unitMap[item],
        pricePerUnit: price,
        totalCost: total,
        createdBy: "admin",
        createdAt: date.toISOString(),
      });
      if (idx === 0) {
        purchases.push({
          id: uid(),
          date: dateStr,
          supplier: "Local Market",
          itemName: item,
          quantity: qty * 2,
          unit: unitMap[item],
          pricePerUnit: price,
          totalPurchase: qty * 2 * price,
          createdAt: date.toISOString(),
        });
      }
    }
    const present = 85 + (d % 12);
    students.push({
      id: uid(),
      date: dateStr,
      totalStudents: 100,
      studentsPresent: present,
      studentsOnLeave: 100 - present,
      perStudentCost:
        dailyTotal > 0 ? Math.round((dailyTotal / present) * 100) / 100 : 0,
    });
  }
  return { entries, students, purchases };
}

interface MessDataContextType {
  entries: MessEntry[];
  studentCounts: StudentCount[];
  purchases: Purchase[];
  inventory: InventoryItem[];
  categories: FoodCategory[];
  settings: MessSettings;
  users: MessUser[];
  addEntry: (e: Omit<MessEntry, "id" | "createdAt">) => void;
  updateEntry: (id: string, e: Partial<MessEntry>) => void;
  deleteEntry: (id: string) => void;
  addStudentCount: (s: Omit<StudentCount, "id">) => void;
  updateStudentCount: (id: string, s: Partial<StudentCount>) => void;
  deleteStudentCount: (id: string) => void;
  addPurchase: (p: Omit<Purchase, "id" | "createdAt">) => void;
  updatePurchase: (id: string, p: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, "id" | "updatedAt">) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addCategory: (name: string) => void;
  updateCategory: (id: string, updates: Partial<FoodCategory>) => void;
  deleteCategory: (id: string) => void;
  saveSettings: (s: MessSettings) => void;
  addUser: (u: Omit<MessUser, "id" | "createdAt">) => void;
  updateUser: (id: string, u: Partial<MessUser>) => void;
  deleteUser: (id: string) => void;
  getDailyTotal: (date: string) => number;
  getMonthlyTotal: (month: string) => number;
  getEntriesForDate: (date: string) => MessEntry[];
  getStudentCountForDate: (date: string) => StudentCount | undefined;
  getPurchasesForMonth: (month: string) => Purchase[];
  exportBackup: () => void;
  importBackup: (json: string) => void;
  resetAllData: () => void;
  updateAuthUser: (updated: MessUser) => void;
}

const MessDataContext = createContext<MessDataContextType | null>(null);

export function MessDataProvider({ children }: { children: React.ReactNode }) {
  // Check reset flag before any useState initializers so seeding is skipped
  const wasReset = localStorage.getItem(RESET_FLAG) === "1";
  if (wasReset) localStorage.removeItem(RESET_FLAG);

  const [entries, setEntries] = useState<MessEntry[]>(() => {
    if (wasReset) return [];
    const stored = load<MessEntry[]>(KEYS.entries, []);
    if (stored.length > 0) return stored;
    return seed3MonthsData().entries;
  });
  const [studentCounts, setStudentCounts] = useState<StudentCount[]>(() => {
    if (wasReset) return [];
    const stored = load<StudentCount[]>(KEYS.students, []);
    if (stored.length > 0) return stored;
    return seed3MonthsData().students;
  });
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    if (wasReset) return [];
    const stored = load<Purchase[]>(KEYS.purchases, []);
    if (stored.length > 0) return stored;
    return seed3MonthsData().purchases;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    wasReset ? [] : load<InventoryItem[]>(KEYS.inventory, DEFAULT_INVENTORY),
  );
  const [categories, setCategories] = useState<FoodCategory[]>(() =>
    load<FoodCategory[]>(KEYS.categories, DEFAULT_CATEGORIES),
  );
  const [settings, setSettings] = useState<MessSettings>(() =>
    load<MessSettings>(KEYS.settings, DEFAULT_SETTINGS),
  );
  const [users, setUsers] = useState<MessUser[]>(() =>
    load<MessUser[]>(KEYS.users, DEFAULT_USERS),
  );

  useEffect(() => {
    save(KEYS.entries, entries);
  }, [entries]);
  useEffect(() => {
    save(KEYS.students, studentCounts);
  }, [studentCounts]);
  useEffect(() => {
    save(KEYS.purchases, purchases);
  }, [purchases]);
  useEffect(() => {
    save(KEYS.inventory, inventory);
  }, [inventory]);
  useEffect(() => {
    save(KEYS.categories, categories);
  }, [categories]);
  useEffect(() => {
    save(KEYS.settings, settings);
  }, [settings]);
  useEffect(() => {
    save(KEYS.users, users);
  }, [users]);

  const addEntry = useCallback((e: Omit<MessEntry, "id" | "createdAt">) => {
    setEntries((prev) => [
      ...prev,
      { ...e, id: uid(), createdAt: new Date().toISOString() },
    ]);
  }, []);
  const updateEntry = useCallback((id: string, e: Partial<MessEntry>) => {
    setEntries((prev) => prev.map((x) => (x.id === id ? { ...x, ...e } : x)));
  }, []);
  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addStudentCount = useCallback((s: Omit<StudentCount, "id">) => {
    setStudentCounts((prev) => {
      const existing = prev.findIndex((x) => x.date === s.date);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], ...s };
        return updated;
      }
      return [...prev, { ...s, id: uid() }];
    });
  }, []);
  const updateStudentCount = useCallback(
    (id: string, s: Partial<StudentCount>) => {
      setStudentCounts((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...s } : x)),
      );
    },
    [],
  );
  const deleteStudentCount = useCallback((id: string) => {
    setStudentCounts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addPurchase = useCallback((p: Omit<Purchase, "id" | "createdAt">) => {
    setPurchases((prev) => [
      ...prev,
      { ...p, id: uid(), createdAt: new Date().toISOString() },
    ]);
  }, []);
  const updatePurchase = useCallback((id: string, p: Partial<Purchase>) => {
    setPurchases((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }, []);
  const deletePurchase = useCallback((id: string) => {
    setPurchases((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addInventoryItem = useCallback(
    (item: Omit<InventoryItem, "id" | "updatedAt">) => {
      setInventory((prev) => [
        ...prev,
        { ...item, id: uid(), updatedAt: new Date().toISOString() },
      ]);
    },
    [],
  );
  const updateInventoryItem = useCallback(
    (id: string, item: Partial<InventoryItem>) => {
      setInventory((prev) =>
        prev.map((x) =>
          x.id === id
            ? { ...x, ...item, updatedAt: new Date().toISOString() }
            : x,
        ),
      );
    },
    [],
  );
  const deleteInventoryItem = useCallback((id: string) => {
    setInventory((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addCategory = useCallback((name: string) => {
    setCategories((prev) => [...prev, { id: uid(), name, isActive: true }]);
  }, []);
  const updateCategory = useCallback(
    (id: string, updates: Partial<FoodCategory>) => {
      setCategories((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...updates } : x)),
      );
    },
    [],
  );
  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const saveSettings = useCallback((s: MessSettings) => {
    setSettings(s);
  }, []);

  const addUser = useCallback((u: Omit<MessUser, "id" | "createdAt">) => {
    setUsers((prev) => [
      ...prev,
      { ...u, id: uid(), createdAt: new Date().toISOString() },
    ]);
  }, []);
  const updateUser = useCallback((id: string, u: Partial<MessUser>) => {
    setUsers((prev) => prev.map((x) => (x.id === id ? { ...x, ...u } : x)));
  }, []);
  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((x) => x.id !== id));
  }, []);
  const updateAuthUser = useCallback((updated: MessUser) => {
    setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  }, []);

  const getDailyTotal = useCallback(
    (date: string) =>
      entries
        .filter((e) => e.date === date)
        .reduce((sum, e) => sum + e.totalCost, 0),
    [entries],
  );
  const getMonthlyTotal = useCallback(
    (month: string) =>
      entries
        .filter((e) => e.date.startsWith(month))
        .reduce((sum, e) => sum + e.totalCost, 0),
    [entries],
  );
  const getEntriesForDate = useCallback(
    (date: string) => entries.filter((e) => e.date === date),
    [entries],
  );
  const getStudentCountForDate = useCallback(
    (date: string) => studentCounts.find((s) => s.date === date),
    [studentCounts],
  );
  const getPurchasesForMonth = useCallback(
    (month: string) => purchases.filter((p) => p.date.startsWith(month)),
    [purchases],
  );

  const exportBackup = useCallback(() => {
    const data = {
      entries,
      studentCounts,
      purchases,
      inventory,
      categories,
      settings,
      users,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vkv-joram-mess-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    entries,
    studentCounts,
    purchases,
    inventory,
    categories,
    settings,
    users,
  ]);

  const importBackup = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.entries) setEntries(data.entries);
      if (data.studentCounts) setStudentCounts(data.studentCounts);
      if (data.purchases) setPurchases(data.purchases);
      if (data.inventory) setInventory(data.inventory);
      if (data.categories) setCategories(data.categories);
      if (data.settings) setSettings(data.settings);
      if (data.users) setUsers(data.users);
    } catch {
      throw new Error("Invalid backup file");
    }
  }, []);

  const resetAllData = useCallback(() => {
    for (const k of Object.values(KEYS)) {
      localStorage.removeItem(k);
    }
    localStorage.removeItem("mess_auth");
    // Set flag BEFORE reload so state initializers see it and skip seeding
    localStorage.setItem(RESET_FLAG, "1");
    window.location.reload();
  }, []);

  return (
    <MessDataContext.Provider
      value={{
        entries,
        studentCounts,
        purchases,
        inventory,
        categories,
        settings,
        users,
        addEntry,
        updateEntry,
        deleteEntry,
        addStudentCount,
        updateStudentCount,
        deleteStudentCount,
        addPurchase,
        updatePurchase,
        deletePurchase,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addCategory,
        updateCategory,
        deleteCategory,
        saveSettings,
        addUser,
        updateUser,
        deleteUser,
        getDailyTotal,
        getMonthlyTotal,
        getEntriesForDate,
        getStudentCountForDate,
        getPurchasesForMonth,
        exportBackup,
        importBackup,
        resetAllData,
        updateAuthUser,
      }}
    >
      {children}
    </MessDataContext.Provider>
  );
}

export function useMessData() {
  const ctx = useContext(MessDataContext);
  if (!ctx) throw new Error("useMessData must be used inside MessDataProvider");
  return ctx;
}
