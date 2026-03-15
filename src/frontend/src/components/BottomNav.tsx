import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import type { ActiveScreen } from "../types/mess";

const NAV_ITEMS: {
  id: ActiveScreen;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "daily_entry", label: "Entry", icon: ClipboardList },
  { id: "students", label: "Students", icon: Users },
  { id: "purchases", label: "Purchases", icon: ShoppingCart },
  { id: "inventory", label: "Stock", icon: Package },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

interface Props {
  active: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
}

export default function BottomNav({ active, onNavigate }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 no-print">
      <div className="max-w-2xl mx-auto flex">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              type="button"
              key={id}
              data-ocid={`nav.${id}_link`}
              onClick={() => onNavigate(id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                size={isActive ? 20 : 18}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? "text-primary" : ""}
              />
              <span
                className={`text-[9px] font-medium leading-none ${
                  isActive ? "text-primary font-bold" : ""
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-8 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
