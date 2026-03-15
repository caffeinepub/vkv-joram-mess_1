import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface StudentCount {
    id: Principal;
    date: string;
    studentsOnLeave: bigint;
    createdAt: Time;
    totalStudents: bigint;
    studentsPresent: bigint;
    perStudentCost: number;
}
export interface Inventory {
    id: Principal;
    quantityPurchased: number;
    remainingStock: number;
    unit: string;
    updatedAt: Time;
    itemName: string;
    quantityUsed: number;
}
export interface User {
    id: Principal;
    username: string;
    createdAt: Time;
    role: string;
}
export interface MessEntry {
    id: Principal;
    date: string;
    createdAt: Time;
    createdBy: Principal;
    unit: string;
    totalCost: number;
    pricePerUnit: number;
    itemName: string;
    quantity: number;
}
export interface Setting {
    key: string;
    value: string;
}
export interface Purchase {
    id: Principal;
    totalPurchase: number;
    supplier: string;
    date: string;
    createdAt: Time;
    unit: string;
    pricePerUnit: number;
    itemName: string;
    quantity: number;
}
export interface UserProfile {
    username: string;
    role: string;
}
export interface FoodCategory {
    id: Principal;
    name: string;
    isActive: boolean;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFoodCategory(name: string, isActive: boolean): Promise<Principal>;
    createInventory(itemName: string, quantityPurchased: number, quantityUsed: number, unit: string): Promise<Principal>;
    createMessEntry(date: string, itemName: string, quantity: number, unit: string, pricePerUnit: number): Promise<Principal>;
    createPurchase(date: string, supplier: string, itemName: string, quantity: number, unit: string, pricePerUnit: number): Promise<Principal>;
    createStudentCount(date: string, totalStudents: bigint, studentsPresent: bigint, perStudentCost: number): Promise<Principal>;
    createUser(username: string, role: string): Promise<Principal>;
    deleteFoodCategory(categoryId: Principal): Promise<void>;
    deleteInventory(inventoryId: Principal): Promise<void>;
    deleteMessEntry(entryId: Principal): Promise<void>;
    deletePurchase(purchaseId: Principal): Promise<void>;
    deleteStudentCount(countId: Principal): Promise<void>;
    deleteUser(userId: Principal): Promise<void>;
    getAllFoodCategories(): Promise<Array<FoodCategory>>;
    getAllInventory(): Promise<Array<Inventory>>;
    getAllMessEntries(): Promise<Array<MessEntry>>;
    getAllPurchases(): Promise<Array<Purchase>>;
    getAllSettings(): Promise<Array<Setting>>;
    getAllStudentCounts(): Promise<Array<StudentCount>>;
    getAllUsers(): Promise<Array<User>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyReport(date: string): Promise<{
        totalCost: number;
        entries: Array<MessEntry>;
        studentCount?: StudentCount;
    }>;
    getGroceryConsumptionReport(month: string, year: string): Promise<Array<Inventory>>;
    getInventoryByItemName(itemName: string): Promise<Inventory | null>;
    getMessEntriesByDate(date: string): Promise<Array<MessEntry>>;
    getMonthlyReport(month: string, year: string): Promise<{
        entriesByCategory: Array<[string, number]>;
        totalExpense: number;
    }>;
    getPurchasesByDateRange(startDate: string, endDate: string): Promise<Array<Purchase>>;
    getSetting(key: string): Promise<Setting | null>;
    getStudentCountsByDate(date: string): Promise<Array<StudentCount>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateFoodCategory(categoryId: Principal, name: string, isActive: boolean): Promise<void>;
    updateInventory(inventoryId: Principal, itemName: string, quantityPurchased: number, quantityUsed: number, unit: string): Promise<void>;
    updateMessEntry(entryId: Principal, date: string, itemName: string, quantity: number, unit: string, pricePerUnit: number): Promise<void>;
    updatePurchase(purchaseId: Principal, date: string, supplier: string, itemName: string, quantity: number, unit: string, pricePerUnit: number): Promise<void>;
    updateSetting(key: string, value: string): Promise<void>;
    updateStudentCount(countId: Principal, date: string, totalStudents: bigint, studentsPresent: bigint, perStudentCost: number): Promise<void>;
    updateUser(userId: Principal, username: string, role: string): Promise<void>;
}
