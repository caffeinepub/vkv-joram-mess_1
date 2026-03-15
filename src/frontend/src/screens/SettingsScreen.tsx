import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useMessData } from "../context/MessDataContext";
import type { MessUser } from "../types/mess";

export default function SettingsScreen() {
  const {
    settings,
    saveSettings,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    users,
    addUser,
    updateUser,
    deleteUser,
    exportBackup,
    importBackup,
    resetAllData,
  } = useMessData();
  const { isAdmin } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  // App settings form
  const [settingsForm, setSettingsForm] = useState({ ...settings });

  // New category
  const [newCatName, setNewCatName] = useState("");

  // New user form
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    password: "",
    role: "staff" as "admin" | "staff",
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<MessUser>>({});

  const handleSaveSettings = () => {
    saveSettings(settingsForm);
    toast.success("Settings saved");
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      toast.error("Enter a category name");
      return;
    }
    addCategory(newCatName.trim());
    setNewCatName("");
    toast.success("Category added");
  };

  const handleAddUser = () => {
    if (!newUserForm.username.trim() || !newUserForm.password.trim()) {
      toast.error("Username and password are required");
      return;
    }
    if (users.some((u) => u.username === newUserForm.username.trim())) {
      toast.error("Username already exists");
      return;
    }
    addUser(newUserForm);
    setNewUserForm({ username: "", password: "", role: "staff" });
    toast.success("User added");
  };

  const startEditUser = (u: MessUser) => {
    setEditingUserId(u.id);
    setEditUserForm({ ...u });
  };
  const saveEditUser = () => {
    if (!editingUserId) return;
    updateUser(editingUserId, editUserForm);
    setEditingUserId(null);
    toast.success("User updated");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importBackup(ev.target?.result as string);
        toast.success("Backup restored successfully");
      } catch {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="screen-container">
      <h1 className="font-display text-xl font-bold mb-4">Settings</h1>

      <Tabs defaultValue="app" className="w-full">
        <TabsList
          className={`grid mb-4 h-9 ${isAdmin ? "grid-cols-4" : "grid-cols-2"}`}
        >
          <TabsTrigger value="app" className="text-xs">
            App
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs">
            Food Items
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="text-xs">
              Users
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="backup" className="text-xs">
              Backup
            </TabsTrigger>
          )}
        </TabsList>

        {/* App Settings */}
        <TabsContent value="app">
          <div className="form-card">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
              App Configuration
            </h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Mess Name</Label>
                <Input
                  data-ocid="settings.mess_name_input"
                  value={settingsForm.messName}
                  onChange={(e) =>
                    setSettingsForm((p) => ({ ...p, messName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">School Name</Label>
                <Input
                  value={settingsForm.schoolName}
                  onChange={(e) =>
                    setSettingsForm((p) => ({
                      ...p,
                      schoolName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Academic Year</Label>
                <Input
                  value={settingsForm.academicYear}
                  onChange={(e) =>
                    setSettingsForm((p) => ({
                      ...p,
                      academicYear: e.target.value,
                    }))
                  }
                  placeholder="2025-26"
                />
              </div>
              <Button
                data-ocid="settings.save_settings_button"
                className="w-full font-semibold"
                onClick={handleSaveSettings}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Food Categories */}
        <TabsContent value="categories">
          <div className="form-card">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
              Food Item Categories
            </h2>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="New category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                className="flex-1"
              />
              <Button onClick={handleAddCategory} size="sm" className="gap-1">
                <Plus size={14} /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p
                  data-ocid="settings.categories.empty_state"
                  className="text-center text-muted-foreground text-sm py-4"
                >
                  No categories
                </p>
              ) : (
                categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    data-ocid={`settings.categories.item.${idx + 1}`}
                    className="flex items-center justify-between p-2.5 bg-card border border-border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={cat.isActive}
                        onCheckedChange={(checked) =>
                          updateCategory(cat.id, { isActive: checked })
                        }
                        className="scale-75"
                      />
                      <span
                        className={`text-sm ${cat.isActive ? "text-foreground" : "text-muted-foreground line-through"}`}
                      >
                        {cat.name}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          deleteCategory(cat.id);
                          toast.success("Category removed");
                        }}
                        className="text-destructive p-1"
                        data-ocid={`settings.categories.delete_button.${idx + 1}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* User Management (Admin Only) */}
        {isAdmin && (
          <TabsContent value="users">
            <div className="form-card">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
                User Accounts
              </h2>
              {/* Add User Form */}
              <div className="bg-secondary rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold mb-2 text-muted-foreground">
                  Add New User
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Username"
                    value={newUserForm.username}
                    onChange={(e) =>
                      setNewUserForm((p) => ({
                        ...p,
                        username: e.target.value,
                      }))
                    }
                    className="text-sm h-8"
                  />
                  <Input
                    placeholder="Password / PIN"
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) =>
                      setNewUserForm((p) => ({
                        ...p,
                        password: e.target.value,
                      }))
                    }
                    className="text-sm h-8"
                  />
                  <Select
                    value={newUserForm.role}
                    onValueChange={(v) =>
                      setNewUserForm((p) => ({
                        ...p,
                        role: v as "admin" | "staff",
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    data-ocid="settings.add_user_button"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={handleAddUser}
                  >
                    <Plus size={13} /> Add User
                  </Button>
                </div>
              </div>

              {/* Users Table */}
              <div className="space-y-2">
                {users.map((u, idx) => (
                  <div
                    key={u.id}
                    data-ocid={`settings.users.item.${idx + 1}`}
                    className="border border-border rounded-md p-2.5"
                  >
                    {editingUserId === u.id ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={editUserForm.username ?? ""}
                          onChange={(e) =>
                            setEditUserForm((p) => ({
                              ...p,
                              username: e.target.value,
                            }))
                          }
                          className="h-7 text-xs"
                          placeholder="Username"
                        />
                        <Input
                          value={editUserForm.password ?? ""}
                          onChange={(e) =>
                            setEditUserForm((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          className="h-7 text-xs"
                          placeholder="Password"
                          type="password"
                        />
                        <Select
                          value={editUserForm.role ?? "staff"}
                          onValueChange={(v) =>
                            setEditUserForm((p) => ({
                              ...p,
                              role: v as "admin" | "staff",
                            }))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={saveEditUser}
                            className="h-7 text-xs flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUserId(null)}
                            className="h-7 text-xs flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck
                            size={14}
                            className={
                              u.role === "admin"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }
                          />
                          <div>
                            <p className="font-medium text-sm">{u.username}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {u.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEditUser(u)}
                            className="text-muted-foreground p-1 text-xs border border-border rounded px-2"
                          >
                            Edit
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                className="text-destructive p-1"
                                data-ocid={`settings.users.delete_button.${idx + 1}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete User?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove {u.username}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="settings.users.delete_cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  data-ocid="settings.users.delete_confirm_button"
                                  onClick={() => {
                                    deleteUser(u.id);
                                    toast.success("User deleted");
                                  }}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}

        {/* Backup & Restore (Admin Only) */}
        {isAdmin && (
          <TabsContent value="backup">
            <div className="form-card">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
                Backup & Restore
              </h2>
              <div className="space-y-3">
                <Button
                  data-ocid="settings.export_backup_button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={exportBackup}
                >
                  Export Backup (JSON)
                </Button>

                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <Button
                    data-ocid="settings.import_backup_button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => fileRef.current?.click()}
                  >
                    Import Backup
                  </Button>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong className="text-destructive">Danger Zone</strong> —
                    This will delete all data and cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full"
                        data-ocid="settings.reset_button"
                      >
                        Reset All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete ALL mess records,
                          students, purchases, and settings. This cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-ocid="settings.reset_cancel_button">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          data-ocid="settings.reset_confirm_button"
                          onClick={resetAllData}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Yes, Reset Everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
