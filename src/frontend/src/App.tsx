import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { LogOut, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import BottomNav from "./components/BottomNav";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MessDataProvider } from "./context/MessDataContext";
import { useMessData } from "./context/MessDataContext";
import DailyEntryScreen from "./screens/DailyEntryScreen";
import DashboardScreen from "./screens/DashboardScreen";
import InventoryScreen from "./screens/InventoryScreen";
import LoginScreen from "./screens/LoginScreen";
import PurchasesScreen from "./screens/PurchasesScreen";
import ReportsScreen from "./screens/ReportsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import StudentsScreen from "./screens/StudentsScreen";
import type { ActiveScreen } from "./types/mess";

function AppShell() {
  const { user, isAdmin, logout } = useAuth();
  const { settings } = useMessData();
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("dashboard");

  if (!user) {
    return <LoginScreen />;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md no-print">
        <div className="max-w-2xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={18} className="text-primary-foreground/80" />
            <div>
              <h1 className="font-display font-bold text-sm leading-tight">
                {settings.messName}
              </h1>
              <p className="text-[10px] text-primary-foreground/70 leading-tight">
                {dateStr}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
            >
              {isAdmin ? "Admin" : "Staff"}
            </Badge>
            <span className="text-xs text-primary-foreground/80 font-medium">
              {user.username}
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-primary-foreground/80 hover:text-primary-foreground p-1"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Screen Content */}
      <main className="flex-1 overflow-y-auto">
        {activeScreen === "dashboard" && (
          <DashboardScreen onNavigate={setActiveScreen} />
        )}
        {activeScreen === "daily_entry" && <DailyEntryScreen />}
        {activeScreen === "students" && <StudentsScreen />}
        {activeScreen === "purchases" && <PurchasesScreen />}
        {activeScreen === "inventory" && <InventoryScreen />}
        {activeScreen === "reports" && <ReportsScreen />}
        {activeScreen === "settings" && <SettingsScreen />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav active={activeScreen} onNavigate={setActiveScreen} />

      {/* Footer (visible on print) */}
      <footer className="hidden print:block text-center text-xs text-muted-foreground py-2">
        {settings.messName} | {settings.schoolName} | Academic Year:{" "}
        {settings.academicYear}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <MessDataProvider>
      <AuthProvider>
        <AppShell />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </MessDataProvider>
  );
}
