import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ExternalLink,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  GitBranch,
  Rocket,
  Triangle,
} from "lucide-react";
import { listVercelProjects, listMyOrganizations, listIntegrations } from "@/lib/api.functions";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate as useNav } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/vercel")({
  component: VercelPage,
});

const DEPLOYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  READY: { label: "Live", color: "text-emerald-400", icon: CheckCircle2 },
  ERROR: { label: "Failed", color: "text-red-400", icon: XCircle },
  BUILDING: { label: "Building", color: "text-amber-400", icon: Clock },
  QUEUED: { label: "Queued", color: "text-blue-400", icon: Clock },
  CANCELED: { label: "Cancelled", color: "text-muted-foreground", icon: XCircle },
  unknown: { label: "Unknown", color: "text-muted-foreground", icon: AlertTriangle },
};

function DeploymentBadge({ state }: { state: string }) {
  const cfg = DEPLOYMENT_STATUS_CONFIG[state] ?? DEPLOYMENT_STATUS_CONFIG.unknown;
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function VercelPage() {
  const navigate = useNavigate();
  const orgsFn = useServerFn(listMyOrganizations);
  const integrationsFn = useServerFn(listIntegrations);
  const projectsFn = useServerFn(listVercelProjects);

  const { data: orgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => orgsFn(),
  });

  const activeOrgId = orgs?.[0]?.id ?? "";

  const { data: integrationsData } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => integrationsFn(),
    enabled: !!activeOrgId,
  });

  const vercelConnection = (integrationsData ?? []).find(
    (c: any) => c.provider === "vercel" && c.status === "connected",
  );

  const {
    data: projectsData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["vercel-projects", activeOrgId],
    queryFn: () => projectsFn({ data: { organization_id: activeOrgId } }),
    enabled: !!activeOrgId && !!vercelConnection,
  });

  const projects = projectsData?.projects ?? [];

  // Not connected state
  if (!vercelConnection) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Vercel"
          description="Connect your Vercel account to monitor deployments and project health."
        />
        <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Triangle className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Vercel not connected</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Connect your Vercel account to instantly view all your projects, deployment statuses,
              and logs right here inside APEX.
            </p>
          </div>
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={() => navigate({ to: "/integrations" })}
          >
            <Rocket className="mr-2 h-4 w-4" />
            Connect Vercel in Integrations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vercel"
        description={
          vercelConnection
            ? `Connected as @${vercelConnection.display_name} · ${projects.length} project${projects.length !== 1 ? "s" : ""} found`
            : "Connect your Vercel account to monitor deployments."
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <Triangle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            No Vercel projects found for the connected account.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p: any) => {
            const statusCfg =
              DEPLOYMENT_STATUS_CONFIG[p.latestDeployment] ??
              DEPLOYMENT_STATUS_CONFIG.unknown;
            const StatusIcon = statusCfg.icon;

            return (
              <Card
                key={p.id}
                className="group relative overflow-hidden transition-all duration-200 hover:shadow-elegant border-border/60 hover:border-primary/30"
              >
                {/* Subtle top accent bar */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white">
                        <Triangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{p.name}</CardTitle>
                        {p.framework && p.framework !== "unknown" && (
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">
                            {p.framework}
                          </p>
                        )}
                      </div>
                    </div>
                    <DeploymentBadge state={p.latestDeployment} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Live URL */}
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline font-mono truncate"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {p.url.replace("https://", "")}
                  </a>

                  {/* Last updated */}
                  {p.updatedAt && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Updated{" "}
                      {new Date(p.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}

                  {/* View on Vercel */}
                  <a
                    href={`https://vercel.com/${p.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5 mt-1 group-hover:border-primary/40 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in Vercel
                    </Button>
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
