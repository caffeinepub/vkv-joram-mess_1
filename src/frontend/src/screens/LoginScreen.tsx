import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useMessData } from "../context/MessDataContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const { users, settings } = useMessData();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const ok = login(username.trim(), password.trim(), users);
      if (!ok) {
        setError("Invalid username or password");
        setShowReset(true);
        toast.error("Login failed");
      } else {
        toast.success(`Welcome, ${username}!`);
      }
      setLoading(false);
    }, 300);
  };

  const handleResetCredentials = () => {
    // Only reset the users key so other data is preserved
    localStorage.removeItem("mess_users");
    localStorage.removeItem("mess_auth");
    toast.success("Credentials reset. Use admin / 1234 to login.");
    setError("");
    setShowReset(false);
    setUsername("admin");
    setPassword("");
    // Force re-render by reloading
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-card">
            <UtensilsCrossed size={32} className="text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {settings.messName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {settings.schoolName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Academic Year: {settings.academicYear}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-card p-6">
          <h2 className="font-display font-semibold text-lg mb-5 text-center text-foreground">
            Sign In
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-username" className="text-sm font-medium">
                Username
              </Label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="login-username"
                  data-ocid="login.username_input"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                    setShowReset(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pl-9"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-sm font-medium">
                Password / PIN
              </Label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="login-password"
                  data-ocid="login.password_input"
                  type="password"
                  placeholder="Enter PIN or password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                    setShowReset(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <p
                data-ocid="login.error_state"
                className="text-destructive text-sm text-center"
              >
                {error}
              </p>
            )}

            <Button
              data-ocid="login.submit_button"
              className="w-full font-semibold"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            {showReset && (
              <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-800 dark:text-amber-300 mb-2">
                  Forgot your password? You can reset credentials back to
                  defaults.
                  <br />
                  <span className="font-medium">
                    Your other data will not be deleted.
                  </span>
                </p>
                <Button
                  data-ocid="login.reset_button"
                  variant="outline"
                  size="sm"
                  className="text-xs border-amber-400 text-amber-700 hover:bg-amber-100"
                  onClick={handleResetCredentials}
                >
                  Reset to default credentials
                </Button>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Default: admin / 1234 &nbsp;|&nbsp; staff / 5678
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
