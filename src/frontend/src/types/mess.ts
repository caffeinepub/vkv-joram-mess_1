export interface MessEntry {
  id: string;
  date: string; // YYYYMMDD
  itemName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
  createdBy: string;
  createdAt: string;
}

export interface StudentCount {
  id: string;
  date: string;
  totalStudents: number;
  studentsPresent: number;
  studentsOnLeave: number;
  perStudentCost: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplier: string;
  itemName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPurchase: number;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  unit: string;
  quantityPurchased: number;
  quantityUsed: number;
  remainingStock: number;
  updatedAt: string;
}

export interface FoodCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface MessUser {
  id: string;
  username: string;
  password: string;
  role: "admin" | "staff";
  createdAt: string;
}

export interface MessSettings {
  messName: string;
  schoolName: string;
  academicYear: string;
}

export type ActiveScreen =
  | "dashboard"
  | "daily_entry"
  | "students"
  | "purchases"
  | "inventory"
  | "reports"
  | "settings";
