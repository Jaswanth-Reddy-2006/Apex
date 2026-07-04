import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shield, Plus, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  listMyOrganizations,
  listRoles,
  listPermissions,
  createRole,
  updateRolePermissions,
  deleteRole,
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

export const Route = createFileRoute("/_authenticated/roles")({
  component: RolesPage,
});

function RolesPage() {
  const orgsFn = useServerFn(listMyOrganizations);
  const permsFn = useServerFn(listPermissions);
  const rolesFn = useServerFn(listRoles);
  const createFn = useServerFn(createRole);
  const updateFn = useServerFn(updateRolePermissions);
  const deleteFn = useServerFn(deleteRole);
  const qc = useQueryClient();

  const { data: orgs } = useQuery({ queryKey: ["organizations"], queryFn: () => orgsFn() });
  const [orgId, setOrgId] = useState<string>("");
  const activeOrg = orgId || orgs?.[0]?.id || "";

  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permsFn(),
  });

  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles", activeOrg],
    queryFn: () => rolesFn({ data: { organization_id: activeOrg } }),
    enabled: !!activeOrg,
  });

  const grouped = useMemo(() => {
    const g: Record<string, typeof permissions> = {};
    (permissions ?? []).forEach((p) => {
      g[p.category] = g[p.category] ?? [];
      g[p.category]!.push(p);
    });
    return g;
  }, [permissions]);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [newPerms, setNewPerms] = useState<Set<string>>(new Set());

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          organization_id: activeOrg,
          name,
          description: desc,
          permission_ids: Array.from(newPerms),
        },
      }),
    onSuccess: () => {
      toast.success("Role created");
      qc.invalidateQueries({ queryKey: ["roles", activeOrg] });
      setCreateOpen(false);
      setName("");
      setDesc("");
      setNewPerms(new Set());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Roles & Permissions"
        description="Define dynamic roles per organization. Assign granular permissions to each role."
        actions={
          <div className="flex items-center gap-2">
            {(orgs?.length ?? 0) > 1 && (
              <Select value={activeOrg} onValueChange={setOrgId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  {(orgs ?? []).map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button
                  className="gradient-primary text-primary-foreground"
                  disabled={!activeOrg}
                >
                  <Plus className="mr-2 h-4 w-4" /> New role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create custom role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <div className="mt-2 max-h-72 space-y-4 overflow-y-auto rounded-lg border border-border p-3">
                      {Object.entries(grouped).map(([cat, items]) => (
                        <div key={cat}>
                          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {cat}
                          </div>
                          <div className="mt-1 grid gap-1 md:grid-cols-2">
                            {(items ?? []).map((p) => {
                              const on = newPerms.has(p.id);
                              return (
                                <label
                                  key={p.id}
                                  className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-sm hover:bg-muted"
                                >
                                  <Checkbox
                                    checked={on}
                                    onCheckedChange={(v) => {
                                      setNewPerms((prev) => {
                                        const next = new Set(prev);
                                        if (v) next.add(p.id);
                                        else next.delete(p.id);
                                        return next;
                                      });
                                    }}
                                  />
                                  <span>
                                    <span className="font-mono text-xs">{p.key}</span>
                                    <span className="ml-1 text-xs text-muted-foreground">
                                      — {p.description}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => create.mutate()}
                    disabled={create.isPending || name.trim().length < 2}
                  >
                    {create.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Create role"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {!activeOrg ? (
        <EmptyState
          icon={Shield}
          title="Create an organization first"
          description="Roles are scoped to an organization."
        />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(roles ?? []).map((r) => (
            <RoleCard
              key={r.id}
              role={r}
              permissions={permissions ?? []}
              onSave={(ids) =>
                updateFn({ data: { role_id: r.id, permission_ids: ids } }).then(() => {
                  toast.success("Permissions updated");
                  qc.invalidateQueries({ queryKey: ["roles", activeOrg] });
                })
              }
              onDelete={
                r.is_system
                  ? undefined
                  : () =>
                      deleteFn({ data: { role_id: r.id } }).then(() => {
                        toast.success("Role deleted");
                        qc.invalidateQueries({ queryKey: ["roles", activeOrg] });
                      })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoleCard({
  role,
  permissions,
  onSave,
  onDelete,
}: {
  role: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
    permission_ids: string[];
  };
  permissions: Array<{ id: string; key: string; category: string; description: string }>;
  onSave: (ids: string[]) => Promise<unknown>;
  onDelete?: () => Promise<unknown>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permission_ids));
  const [saving, setSaving] = useState(false);
  const dirty =
    selected.size !== role.permission_ids.length ||
    role.permission_ids.some((id) => !selected.has(id));

  const grouped = useMemo(() => {
    const g: Record<string, typeof permissions> = {};
    permissions.forEach((p) => {
      g[p.category] = g[p.category] ?? [];
      g[p.category]!.push(p);
    });
    return g;
  }, [permissions]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {role.name}
              {role.is_system && <Badge variant="secondary">System</Badge>}
            </CardTitle>
            {role.description && (
              <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
            )}
          </div>
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {cat}
              </div>
              <div className="mt-1 grid gap-0.5">
                {(items ?? []).map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 text-xs"
                  >
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (v) next.add(p.id);
                          else next.delete(p.id);
                          return next;
                        });
                      }}
                    />
                    <span className="font-mono">{p.key}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            disabled={!dirty || saving}
            onClick={async () => {
              setSaving(true);
              await onSave(Array.from(selected));
              setSaving(false);
            }}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
