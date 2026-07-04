import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Boxes } from "lucide-react";
import { listWorkspaces } from "@/lib/api.functions";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/workspace")({
  component: WorkspacesPage,
});

function WorkspacesPage() {
  const fn = useServerFn(listWorkspaces);
  const { data, isLoading } = useQuery({ queryKey: ["workspaces"], queryFn: () => fn() });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workspaces"
        description="Group projects and members into workspaces within each organization."
      />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No workspaces yet"
          description="Once you create an organization, workspaces will live here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((w) => (
            <Card key={w.id}>
              <CardHeader>
                <CardTitle>{w.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{w.description ?? "—"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
