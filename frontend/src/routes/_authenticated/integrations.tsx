import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle } from "lucide-react";
import { listIntegrations, listMyOrganizations } from "@/lib/api.functions";
import { INTEGRATIONS, type IntegrationDefinition } from "@/lib/integrations-catalog";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/integrations")({
  component: IntegrationsPage,
});

const CATEGORY_LABELS: Record<IntegrationDefinition["category"], string> = {
  code: "Code & repositories",
  cloud: "Cloud & deployment",
  communication: "Communication",
  productivity: "Productivity",
  ai: "AI providers",
  payments: "Payments",
};

function IntegrationsPage() {
  const fn = useServerFn(listIntegrations);
  const orgsFn = useServerFn(listMyOrganizations);

  const { data } = useQuery({ queryKey: ["integrations"], queryFn: () => fn() });
  const { data: orgs } = useQuery({ queryKey: ["organizations"], queryFn: () => orgsFn() });

  const connected = new Map((data ?? []).map((r) => [r.provider, r]));
  const activeOrg = orgs?.[0]?.id || "";

  const grouped = INTEGRATIONS.reduce<Record<string, IntegrationDefinition[]>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});

  const handleConnectClick = (item: IntegrationDefinition, isConnected: boolean) => {
    if (item.id === "github") {
      if (isConnected) {
        const conn = connected.get("github");
        toast.success(`You are already connected to GitHub as: ${conn?.display_name || "Authorized User"}`);
        return;
      }

      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "";
      if (!clientId) {
        toast.error("Please add VITE_GITHUB_CLIENT_ID to your frontend/.env file to configure this OAuth flow.");
        return;
      }

      if (!activeOrg) {
        toast.error("No active organization found. Please register or join an organization first.");
        return;
      }

      const redirectUri = encodeURIComponent(`${window.location.origin}/integrations-callback`);
      const githubOAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user&state=${activeOrg}`;
      
      toast.loading("Redirecting to GitHub for authorization...");
      window.location.href = githubOAuthUrl;

    } else if (item.id === "vercel") {
      if (isConnected) {
        const conn = connected.get("vercel");
        toast.success(`Already connected to Vercel as: ${conn?.display_name || "Authorized User"}`);
        return;
      }

      const clientId = import.meta.env.VITE_VERCEL_CLIENT_ID || "";
      if (!clientId) {
        toast.error("Please add VITE_VERCEL_CLIENT_ID to your frontend/.env file.");
        return;
      }

      if (!activeOrg) {
        toast.error("No active organization found. Please register or join an organization first.");
        return;
      }

      const redirectUri = encodeURIComponent(`${window.location.origin}/integrations-callback`);
      const vercelOAuthUrl = `https://vercel.com/integrations/${import.meta.env.VITE_VERCEL_INTEGRATION_SLUG}/new?redirect_uri=${redirectUri}&state=${activeOrg}_vercel`;

      toast.loading("Redirecting to Vercel for authorization...");
      window.location.href = vercelOAuthUrl;

    } else {
      toast.info(`${item.name} OAuth will be enabled soon. Provider slot registered.`);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrations"
        description="Connect APEX to the services your team already uses. OAuth wiring is fully enabled for GitHub."
      />

      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {CATEGORY_LABELS[cat as IntegrationDefinition["category"]]}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => {
              const conn = connected.get(i.id);
              const isConnected = conn?.status === "connected";
              return (
                <Card key={i.id} className="transition hover:shadow-soft">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary font-semibold">
                        {i.name[0]}
                      </div>
                      <div>
                        <CardTitle className="text-base">{i.name}</CardTitle>
                        {isConnected ? (
                          <p className="text-xs text-success font-mono font-medium">@{conn?.display_name}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">{i.description}</p>
                        )}
                      </div>
                    </div>
                    {isConnected ? (
                      <Badge className="gap-1 bg-success text-success-foreground">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Circle className="h-3 w-3" /> Not connected
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      variant={isConnected ? "outline" : "default"}
                      size="sm"
                      className={isConnected ? "" : "gradient-primary text-primary-foreground"}
                      onClick={() => handleConnectClick(i, isConnected)}
                    >
                      {isConnected ? "Connected" : "Connect"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
