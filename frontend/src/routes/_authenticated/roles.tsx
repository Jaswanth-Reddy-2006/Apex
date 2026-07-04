import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shield, Plus, Loader2, Save, Trash2, Lock, RefreshCw, Check } from "lucide-react";
import { useOrg } from "@/lib/org-context";
import { toast } from "sonner";
import { z } from "zod";
import {
  listMyOrganizations,
  listRoles,
  listPermissions,
  createRole,
  updateRolePermissions,
  deleteRole,
  listMembers,
} from "@/lib/api.functions";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/roles")({
  component: RolesPage,
});

interface PermissionItem {
  id: string;
  key: string;
  category: string;
  description: string;
}

interface RoleItem {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  is_system: boolean;
  permission_ids: string[];
}

function RolesPage() {
  const { hasPermission, loading: orgLoading } = useOrg();
  const orgsFn = useServerFn(listMyOrganizations);
  const permsFn = useServerFn(listPermissions);
  const rolesFn = useServerFn(listRoles);
  const membersFn = useServerFn(listMembers);
  const createFn = useServerFn(createRole);
  const updateFn = useServerFn(updateRolePermissions);
  const deleteFn = useServerFn(deleteRole);
  const qc = useQueryClient();

  const { data: orgs } = useQuery({ queryKey: ["organizations"], queryFn: () => orgsFn() });
  const [orgId, setOrgId] = useState<string>("");
  const activeOrg = orgId || orgs?.[0]?.id || "";

  // Queries
  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permsFn(),
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", activeOrg],
    queryFn: () => rolesFn({ data: { organization_id: activeOrg } }),
    enabled: !!activeOrg,
  });

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: () => membersFn(),
  });

  // State
  const [activeTab, setActiveTab] = useState("permissions");
  const [selectedRoleName, setSelectedRoleName] = useState<string>("admin");
  const [selectedUserId, setSelectedUserId] = useState<string>("_role_");
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Filter members list by active org
  const orgMembers = useMemo(() => {
    const list = (members ?? []) as any[];
    return list.filter((m) => m.organization_id === activeOrg);
  }, [members, activeOrg]);

  // Filter members by selected role
  const roleMembers = useMemo(() => {
    return orgMembers.filter((m) => m.role.toLowerCase() === selectedRoleName.toLowerCase());
  }, [orgMembers, selectedRoleName]);

  // Get active role item to display/edit
  const activeRoleItem = useMemo(() => {
    const list = (roles ?? []) as RoleItem[];
    // Find role matching selectedRoleName
    return list.find((r) => r.name.toLowerCase() === selectedRoleName.toLowerCase()) || list[0];
  }, [roles, selectedRoleName]);

  // Sync selected permission IDs with active role permissions
  useEffect(() => {
    if (activeRoleItem) {
      setSelectedPermIds(new Set(activeRoleItem.permission_ids));
    }
  }, [activeRoleItem]);

  // Find permission by key
  const findPermId = (key: string): string => {
    const match = (permissions ?? []).find((p) => p.key.toLowerCase() === key.toLowerCase());
    return match?.id || "";
  };

  // Modules & Mappings for standard dev app features
  const modules = useMemo(() => {
    return [
      {
        name: "AI Chat",
        createKey: "Chat.Access",
        readKey: "Chat.Access",
        updateKey: "Chat.Access",
        deleteKey: "Chat.Access",
      },
      {
        name: "Projects",
        createKey: "Project.Create",
        readKey: "Project.View",
        updateKey: "Project.Create",
        deleteKey: "Project.Create",
      },
      {
        name: "Members",
        createKey: "People.Invite",
        readKey: "People.View",
        updateKey: "People.Invite",
        deleteKey: "People.Invite",
      },
      {
        name: "Roles & Permissions",
        createKey: "Roles.Manage",
        readKey: "Roles.View",
        updateKey: "Roles.Manage",
        deleteKey: "Roles.Manage",
      },
      {
        name: "Integrations",
        createKey: "Integrations.Connect",
        readKey: "Integrations.Connect",
        updateKey: "Integrations.Connect",
        deleteKey: "Integrations.Connect",
      },
      {
        name: "Analytics",
        createKey: "Analytics.View",
        readKey: "Analytics.View",
        updateKey: "Analytics.View",
        deleteKey: "Analytics.View",
      },
      {
        name: "Billing",
        createKey: "Billing.View",
        readKey: "Billing.View",
        updateKey: "Billing.View",
        deleteKey: "Billing.View",
      },
      {
        name: "Audit Logs",
        createKey: "Audit.View",
        readKey: "Audit.View",
        updateKey: "Audit.View",
        deleteKey: "Audit.View",
      },
    ];
  }, []);

  const createRoleMutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          organization_id: activeOrg,
          name: newRoleName,
          description: newRoleDesc,
          permission_ids: [],
        },
      }),
    onSuccess: () => {
      toast.success("Role created successfully");
      qc.invalidateQueries({ queryKey: ["roles", activeOrg] });
      setCreateOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSavePermissions = async () => {
    if (!activeRoleItem) return;
    setSavingPermissions(true);
    try {
      await updateFn({
        data: {
          role_id: activeRoleItem.id,
          permission_ids: Array.from(selectedPermIds),
        },
      });
      toast.success("Authorizations saved successfully");
      qc.invalidateQueries({ queryKey: ["roles", activeOrg] });
    } catch (e: any) {
      toast.error(e.message || "Failed to save permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleTogglePermission = (key: string, checked: boolean) => {
    const pId = findPermId(key);
    if (!pId) return;
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(pId);
      else next.delete(pId);
      return next;
    });
  };

  const handleToggleAllModule = (moduleItem: typeof modules[0], checked: boolean) => {
    const keys = [moduleItem.createKey, moduleItem.readKey, moduleItem.updateKey, moduleItem.deleteKey];
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => {
        const pId = findPermId(k);
        if (pId) {
          if (checked) next.add(pId);
          else next.delete(pId);
        }
      });
      return next;
    });
  };

  if (orgLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!hasPermission("Roles.View")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Access Denied" />
        <EmptyState
          icon={Lock}
          title="Permission Required"
          description="You do not have the required permissions to view or manage authorizations."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Authorizations</h1>
          <p className="text-sm text-muted-foreground">Manage roles and module-level access permissions</p>
        </div>
        <div className="flex items-center gap-2">
          {orgs && orgs.length > 1 && (
            <Select value={activeOrg} onValueChange={setOrgId}>
              <SelectTrigger className="w-48 bg-background">
                <SelectValue placeholder="Select Organization" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["roles", activeOrg] });
              qc.invalidateQueries({ queryKey: ["permissions"] });
              qc.invalidateQueries({ queryKey: ["members"] });
              toast.success("Data refreshed");
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {activeTab === "permissions" && (
            <Button
              className="gradient-primary text-primary-foreground font-medium"
              onClick={handleSavePermissions}
              disabled={savingPermissions || !activeRoleItem || !hasPermission("Roles.Manage")}
            >
              {savingPermissions ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b border-border bg-transparent px-1 pb-px">
          <TabsList className="h-10 bg-transparent p-0 gap-6">
            <TabsTrigger
              value="permissions"
              className="h-10 rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 text-sm font-semibold text-muted-foreground bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              User Permissions
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="h-10 rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 text-sm font-semibold text-muted-foreground bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Manage Roles
            </TabsTrigger>
          </TabsList>
        </div>

        {/* User Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-2 rounded-xl border border-border p-4 bg-card">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter By Role</Label>
              <Select value={selectedRoleName} onValueChange={(val) => {
                setSelectedRoleName(val);
                setSelectedUserId("_role_");
              }}>
                <SelectTrigger className="w-full mt-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["owner", "admin", "manager", "developer", "designer", "qa", "devops", "finance", "viewer"].map((roleName) => (
                    <SelectItem key={roleName} value={roleName}>
                      {roleName}
                    </SelectItem>
                  ))}
                  {(roles ?? [])
                    .filter((r) => !["owner", "admin", "manager", "developer", "designer", "qa", "devops", "finance", "viewer"].includes(r.name.toLowerCase()))
                    .map((r) => (
                      <SelectItem key={r.id} value={r.name}>
                        {r.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select User ({roleMembers.length} users)</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full mt-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_role_">— Choose a user —</SelectItem>
                  {roleMembers.map((m) => (
                    <SelectItem key={m.id} value={m.user_id}>
                      {m.profiles?.full_name || m.profiles?.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="rounded-xl overflow-hidden border border-border shadow-none">
            <CardHeader className="bg-muted/10 border-b border-border py-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base font-semibold">
                    {selectedUserId === "_role_" ? (
                      `Configure module permissions for the "${selectedRoleName}" role`
                    ) : (
                      `Permissions configured for the role "${selectedRoleName}" (applied to selected user)`
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Toggle checkboxes below to edit access permissions. Save changes to apply.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow>
                    <TableHead className="w-64 font-semibold text-foreground text-xs uppercase tracking-wider">Module</TableHead>
                    <TableHead className="text-center font-semibold text-foreground text-xs uppercase tracking-wider">Create</TableHead>
                    <TableHead className="text-center font-semibold text-foreground text-xs uppercase tracking-wider">Read</TableHead>
                    <TableHead className="text-center font-semibold text-foreground text-xs uppercase tracking-wider">Update</TableHead>
                    <TableHead className="text-center font-semibold text-foreground text-xs uppercase tracking-wider">Delete</TableHead>
                    <TableHead className="text-center font-semibold text-foreground text-xs uppercase tracking-wider">All</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((m) => {
                    const cId = findPermId(m.createKey);
                    const rId = findPermId(m.readKey);
                    const uId = findPermId(m.updateKey);
                    const dId = findPermId(m.deleteKey);

                    const createChecked = cId ? selectedPermIds.has(cId) : false;
                    const readChecked = rId ? selectedPermIds.has(rId) : false;
                    const updateChecked = uId ? selectedPermIds.has(uId) : false;
                    const deleteChecked = dId ? selectedPermIds.has(dId) : false;

                    const allChecked = createChecked && readChecked && updateChecked && deleteChecked;

                    return (
                      <TableRow key={m.name} className="hover:bg-muted/5 border-b border-border last:border-0">
                        <TableCell className="font-semibold text-sm text-foreground py-3.5 pl-6">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {m.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3.5">
                          <Checkbox
                            checked={createChecked}
                            onCheckedChange={(val) => handleTogglePermission(m.createKey, !!val)}
                            disabled={!hasPermission("Roles.Manage")}
                          />
                        </TableCell>
                        <TableCell className="text-center py-3.5">
                          <Checkbox
                            checked={readChecked}
                            onCheckedChange={(val) => handleTogglePermission(m.readKey, !!val)}
                            disabled={!hasPermission("Roles.Manage")}
                          />
                        </TableCell>
                        <TableCell className="text-center py-3.5">
                          <Checkbox
                            checked={updateChecked}
                            onCheckedChange={(val) => handleTogglePermission(m.updateKey, !!val)}
                            disabled={!hasPermission("Roles.Manage")}
                          />
                        </TableCell>
                        <TableCell className="text-center py-3.5">
                          <Checkbox
                            checked={deleteChecked}
                            onCheckedChange={(val) => handleTogglePermission(m.deleteKey, !!val)}
                            disabled={!hasPermission("Roles.Manage")}
                          />
                        </TableCell>
                        <TableCell className="text-center py-3.5">
                          <Checkbox
                            checked={allChecked}
                            onCheckedChange={(val) => handleToggleAllModule(m, !!val)}
                            disabled={!hasPermission("Roles.Manage")}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Roles Tab */}
        <TabsContent value="roles" className="space-y-6 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold">Configured Roles</h3>
              <p className="text-xs text-muted-foreground">List and configure custom roles scoped to this organization.</p>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button
                  className="gradient-primary text-primary-foreground font-medium"
                  disabled={!activeOrg || !hasPermission("Roles.Manage")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Custom Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create custom role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label htmlFor="r-name">Role Name</Label>
                    <Input
                      id="r-name"
                      placeholder="e.g. Lead Designer"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="r-desc">Description</Label>
                    <Textarea
                      id="r-desc"
                      placeholder="Describe scope of the role..."
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createRoleMutation.mutate()}
                    disabled={createRoleMutation.isPending || newRoleName.trim().length < 2}
                  >
                    {createRoleMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      "Create role"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {rolesLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (roles ?? []).length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No roles found"
              description="Create a custom role to customize your permission rules."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(roles ?? []).map((r) => (
                <Card key={r.id} className="relative rounded-xl border border-border shadow-none overflow-hidden bg-card hover:bg-muted/5 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          {r.name}
                          {r.is_system && (
                            <Badge variant="secondary" className="text-[10px] py-px">
                              System
                            </Badge>
                          )}
                        </CardTitle>
                        {r.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {r.description}
                          </p>
                        )}
                      </div>
                      {!r.is_system && hasPermission("Roles.Manage") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Warning: Deleting this custom role will also remove/delete all team members currently assigned to it. Are you sure you want to proceed?")) {
                              deleteFn({ data: { role_id: r.id } }).then(() => {
                                toast.success("Role deleted");
                                qc.invalidateQueries({ queryKey: ["roles", activeOrg] });
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 pb-4">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>{r.permission_ids.length} active permissions</span>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          setSelectedRoleName(r.name);
                          setSelectedUserId("_role_");
                          setActiveTab("permissions");
                        }}
                      >
                        Configure Access
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
