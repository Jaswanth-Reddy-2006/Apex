import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Lock } from "lucide-react";
import { useOrg } from "@/lib/org-context";
import { listAuditLogs, listMyOrganizations } from "@/lib/api.functions";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/audit")({
  component: AuditPage,
});

function AuditPage() {
  const { hasPermission, loading } = useOrg();
  const orgsFn = useServerFn(listMyOrganizations);
  const logsFn = useServerFn(listAuditLogs);
  const { data: orgs } = useQuery({ queryKey: ["organizations"], queryFn: () => orgsFn() });
  const [orgId, setOrgId] = useState<string>("");
  const activeOrg = orgId || orgs?.[0]?.id || "";

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!hasPermission("Audit.View")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Access Denied" />
        <EmptyState
          icon={Lock}
          title="Permission Required"
          description="You do not have the required permissions to view audit logs."
        />
      </div>
    );
  }
  const { data, isLoading } = useQuery({
    queryKey: ["audit", activeOrg],
    queryFn: () => logsFn({ data: { organization_id: activeOrg } }),
    enabled: !!activeOrg,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit Logs"
        description="Every privileged action across your organization, immutable and org-admin scoped."
        actions={
          (orgs?.length ?? 0) > 1 ? (
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
          ) : null
        }
      />

      {!activeOrg ? (
        <EmptyState icon={FileText} title="No organization" description="Create one to see logs." />
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit events yet"
          description="Privileged actions appear here in real time."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {row.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{row.resource ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.actor_id?.slice(0, 8) ?? "system"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
