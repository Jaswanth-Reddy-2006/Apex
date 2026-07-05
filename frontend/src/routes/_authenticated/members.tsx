import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, Plus, Loader2, Copy, Trash2, Lock, Pencil, Eye, EyeOff } from "lucide-react";
import { useOrg } from "@/lib/org-context";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  listMembers,
  listMyOrganizations,
  createInvitation,
  listInvitations,
  revokeInvitation,
  removeMember,
  updateMemberRole,
  createOrganizationMember,
  listMemberProjects,
  updateMemberProjects,
  listProjects,
} from "@/lib/api.functions";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

export const Route = createFileRoute("/_authenticated/members")({
  component: MembersPage,
});

const MEMBER_ROLES = [
  "admin",
  "manager",
  "developer",
  "designer",
  "qa",
  "devops",
  "finance",
  "viewer",
] as const;

const inviteSchema = z.object({
  organization_id: z.string().uuid("Pick an organization"),
  email: z.string().trim().email("Invalid email").max(255),
  fullName: z.string().trim().min(2, "Name is required").max(100),
  role: z.enum(MEMBER_ROLES),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  project_ids: z.array(z.string()).default([]),
});

type MemberRow = {
  id: string;
  role: string;
  created_at: string;
  user_id: string;
  organization_id: string;
  profiles: { email: string; full_name: string | null; avatar_url: string | null } | null;
};

function MembersPage() {
  const { hasPermission, loading: orgLoading } = useOrg();
  const membersFn = useServerFn(listMembers);
  const orgsFn = useServerFn(listMyOrganizations);
  const invitesFn = useServerFn(listInvitations);
  const inviteFn = useServerFn(createInvitation);
  const revokeFn = useServerFn(revokeInvitation);
  const removeFn = useServerFn(removeMember);
  const updateRoleFn = useServerFn(updateMemberRole);
  const qc = useQueryClient();

  const { data: orgs } = useQuery({ queryKey: ["organizations"], queryFn: () => orgsFn() });
  const [orgFilter, setOrgFilter] = useState<string>("");
  const activeOrg = orgFilter || orgs?.[0]?.id || "";

  const { data: members, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => membersFn(),
  });

  const { data: invites } = useQuery({
    queryKey: ["invitations", activeOrg],
    queryFn: () => invitesFn({ data: { organization_id: activeOrg } }),
    enabled: !!activeOrg,
  });

  const createMemberFn = useServerFn(createOrganizationMember);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { organization_id: activeOrg, email: "", fullName: "", role: "developer", password: "", project_ids: [] },
  });

  useEffect(() => {
    if (activeOrg) {
      form.setValue("organization_id", activeOrg);
    }
  }, [activeOrg, form]);

  const invite = useMutation({
    mutationFn: (v: z.infer<typeof inviteSchema>) => createMemberFn({ data: v }),
    onSuccess: () => {
      toast.success("Member created successfully!");
      qc.invalidateQueries({ queryKey: ["members"] });
      setInviteOpen(false);
      form.reset({ organization_id: activeOrg, email: "", fullName: "", role: "developer", password: "", project_ids: [] });
      setShowPassword(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Edit Member & Project Assignment states
  const [editOpen, setEditOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [assignedProjects, setAssignedProjects] = useState<Set<string>>(new Set());
  const [savingProjects, setSavingProjects] = useState(false);

  const projectsFn = useServerFn(listProjects);
  const { data: projectsList } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsFn(),
  });

  const memberProjectsFn = useServerFn(listMemberProjects);
  const { data: memberProjectIds } = useQuery({
    queryKey: ["member-projects", selectedMember?.user_id],
    queryFn: () => memberProjectsFn({ data: { user_id: selectedMember?.user_id! } }),
    enabled: !!selectedMember,
  });

  const updateMemberProjectsFn = useServerFn(updateMemberProjects);

  // Update states when selected member or their projects change
  useEffect(() => {
    if (selectedMember) {
      setEditRole(selectedMember.role);
    }
  }, [selectedMember]);

  useEffect(() => {
    if (memberProjectIds) {
      setAssignedProjects(new Set(memberProjectIds));
    }
  }, [memberProjectIds]);

  if (orgLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!hasPermission("People.Read")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Access Denied" />
        <EmptyState
          icon={Lock}
          title="Permission Required"
          description="You do not have the required permissions to view or manage organization members."
        />
      </div>
    );
  }

  const rows = (members ?? []) as unknown as MemberRow[];
  const filteredRows = activeOrg
    ? rows.filter((m) => m.organization_id === activeOrg)
    : rows;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Members"
        description="Invite people to your organization and assign roles. Invitations expire in 7 days."
        actions={
          <div className="flex items-center gap-2">
            {(orgs?.length ?? 0) > 1 && (
              <Select value={activeOrg} onValueChange={setOrgFilter}>
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
            <Dialog open={inviteOpen} onOpenChange={(open) => {
              setInviteOpen(open);
              if (!open) {
                form.reset({ organization_id: activeOrg, email: "", fullName: "", role: "developer", password: "", project_ids: [] });
                setShowPassword(false);
              }
            }}>
              <DialogTrigger asChild>
                <Button
                  className="gradient-primary text-primary-foreground"
                  disabled={!activeOrg}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a new member</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit((v) => invite.mutate(v))}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="c-name">Full name</Label>
                    <Input id="c-name" {...form.register("fullName")} />
                    {form.formState.errors.fullName && (
                      <p className="mt-1 text-xs text-destructive">
                        {form.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="c-email">Email</Label>
                    <Input id="c-email" type="email" {...form.register("email")} />
                    {form.formState.errors.email && (
                      <p className="mt-1 text-xs text-destructive">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="c-password">Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="c-password"
                        type={showPassword ? "text" : "password"}
                        className="pr-10"
                        {...form.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {form.formState.errors.password && (
                      <p className="mt-1 text-xs text-destructive">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={form.watch("role")}
                      onValueChange={(v) =>
                        form.setValue("role", v as (typeof MEMBER_ROLES)[number], {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMBER_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assign to Projects</Label>
                    <div className="mt-1 max-h-40 overflow-y-auto space-y-2 rounded-lg border border-border p-3 bg-muted/10">
                      {(projectsList ?? []).length === 0 ? (
                        <div className="text-xs text-muted-foreground p-1">No projects available in the organization.</div>
                      ) : (
                        (projectsList ?? []).map((p) => {
                          const checked = (form.watch("project_ids") || []).includes(p.id);
                          return (
                            <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(val) => {
                                  const currentIds = form.getValues("project_ids") || [];
                                  if (val) {
                                    form.setValue("project_ids", [...currentIds, p.id]);
                                  } else {
                                    form.setValue("project_ids", currentIds.filter(id => id !== p.id));
                                  }
                                }}
                              />
                              <span className="font-medium text-xs text-foreground truncate">{p.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={invite.isPending}>
                      {invite.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create member"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({filteredRows.length})</TabsTrigger>
          <TabsTrigger value="invites">
            Pending invites ({(invites ?? []).filter((i) => i.status === "pending").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No members yet"
              description="Invite people to your organization to get started."
            />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((m) => {
                    const name = m.profiles?.full_name ?? m.profiles?.email ?? "—";
                    const initials = name.slice(0, 2).toUpperCase();
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary-soft text-primary text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{name}</div>
                              <div className="text-xs text-muted-foreground">
                                {m.profiles?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={m.role === "owner" ? "default" : "secondary"}>
                            {m.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(m.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {m.role !== "owner" && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedMember(m);
                                  setEditOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  removeFn({ data: { member_id: m.id } })
                                    .then(() => {
                                      toast.success("Member removed");
                                      qc.invalidateQueries({ queryKey: ["members"] });
                                    })
                                    .catch((e: Error) => toast.error(e.message))
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          {(invites ?? []).length === 0 ? (
            <EmptyState
              icon={Users}
              title="No invitations"
              description="Invite someone to get started."
            />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(invites ?? []).map((i) => {
                    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/accept-invite?token=${i.token}`;
                    return (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{i.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={i.status === "pending" ? "outline" : "secondary"}
                            className={
                              i.status === "accepted"
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : ""
                            }
                          >
                            {i.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(i.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(url);
                                toast.success("Invite link copied");
                              }}
                              title="Copy invite link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {i.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  revokeFn({ data: { invitation_id: i.id } })
                                    .then(() => {
                                      toast.success("Invitation revoked");
                                      qc.invalidateQueries({
                                        queryKey: ["invitations", activeOrg],
                                      });
                                    })
                                    .catch((e: Error) => toast.error(e.message))
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member Assignments</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <Label>Member Details</Label>
                <div className="rounded-lg border border-border p-3 bg-muted/20">
                  <div className="font-semibold text-sm">{selectedMember.profiles?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{selectedMember.profiles?.email ?? "—"}</div>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-role">Organization Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Project Assignments</Label>
                <div className="mt-1 max-h-56 overflow-y-auto space-y-2 rounded-lg border border-border p-3 bg-muted/10">
                  {(projectsList ?? []).length === 0 ? (
                    <div className="text-xs text-muted-foreground p-1">No projects available in the organization.</div>
                  ) : (
                    (projectsList ?? []).map((p) => {
                      const checked = assignedProjects.has(p.id);
                      return (
                        <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(val) => {
                              setAssignedProjects((prev) => {
                                const next = new Set(prev);
                                if (val) next.add(p.id);
                                else next.delete(p.id);
                                return next;
                              });
                            }}
                          />
                          <span className="font-medium text-xs text-foreground truncate">{p.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    setSavingProjects(true);
                    try {
                      // 1. Update organizational role
                      await updateRoleFn({
                        data: {
                          member_id: selectedMember.id,
                          role: editRole as any,
                        },
                      });
                      
                      // 2. Update project assignments
                      await updateMemberProjectsFn({
                        data: {
                          user_id: selectedMember.user_id,
                          project_ids: Array.from(assignedProjects),
                        },
                      });

                      toast.success("Member updated successfully!");
                      qc.invalidateQueries({ queryKey: ["members"] });
                      setEditOpen(false);
                    } catch (e: any) {
                      toast.error(e.message || "Failed to update member");
                    } finally {
                      setSavingProjects(false);
                    }
                  }}
                  disabled={savingProjects}
                >
                  {savingProjects ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
