import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { listNotifications } from "@/lib/api.functions";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const fn = useServerFn(listNotifications);
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fn(),
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Notifications" description="All the things you should know about." />
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Notifications about your organizations, projects, and integrations will appear here."
        />
      ) : (
        <Card className="divide-y divide-border">
          {(data ?? []).map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-4">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{n.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
