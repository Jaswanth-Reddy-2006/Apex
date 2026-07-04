import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, Plus, Loader2, Copy, Trash2 } from "lucide-react";
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
} from "@/lib/api.functions";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  email: z.string().trim().email().max(255),
  role: z.enum(MEMBER_ROLES),
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
  const rows = (members ?? []) as unknown as MemberRow[];
  const filteredRows = activeOrg
    ? rows.filter((m) => m.organization_id === activeOrg)
    : rows;

  const { data: invites } = useQuery({
    queryKey: ["invitations", activeOrg],
    queryFn: () => invitesFn({ data: { organization_id: activeOrg } }),
    enabled: !!activeOrg,
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { organization_id: activeOrg, email: "", role: "developer" },
    values: { organization_id: activeOrg, email: "", role: "developer" },
  });

  const invite = useMutation({
    mutationFn: (v: z.infer<typeof inviteSchema>) => inviteFn({ data: v }),
    onSuccess: (row) => {
      const url = `${window.location.origin}/accept-invite?token=${row.token}`;
      navigator.clipboard.writeText(url).catch(() => undefined);
      toast.success("Invitation created — link copied to clipboard");
      qc.invalidateQueries({ queryKey: ["invitations", activeOrg] });
      setInviteOpen(false);
      form.reset({ organization_id: activeOrg, email: "", role: "developer" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button
                  className="gradient-primary text-primary-foreground"
                  disabled={!activeOrg}
                >
                  <Plus className="mr-2 h-4 w-4" /> Invite member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a new member</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit((v) => invite.mutate(v))}
                  className="space-y-4"
                >
                  <div>
                    <Label>Email</Label>
                    <Input type="email" {...form.register("email")} />
                    {form.formState.errors.email && (
                      <p className="mt-1 text-xs text-destructive">
                        {form.formState.errors.email.message}
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
                  <DialogFooter>
                    <Button type="submit" disabled={invite.isPending}>
                      {invite.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Send invitation"
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
                          {m.role === "owner" ? (
                            <Badge className="gradient-primary text-primary-foreground">
                              owner
                            </Badge>
                          ) : (
                            <Select
                              value={m.role}
                              onValueChange={(v) =>
                                updateRoleFn({
                                  data: {
                                    member_id: m.id,
                                    role: v as (typeof MEMBER_ROLES)[number],
                                  },
                                })
                                  .then(() => {
                                    toast.success("Role updated");
                                    qc.invalidateQueries({ queryKey: ["members"] });
                                  })
                                  .catch((e: Error) => toast.error(e.message))
                              }
                            >
                              <SelectTrigger className="h-8 w-32">
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
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(m.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {m.role !== "owner" && (
                            <Button
                              variant="ghost"
                              size="icon"
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
    </div>
  );
}
