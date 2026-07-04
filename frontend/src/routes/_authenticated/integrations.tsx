import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle } from "lucide-react";
import { listIntegrations } from "@/lib/api.functions";
import { INTEGRATIONS, type IntegrationDefinition } from "@/lib/integrations-catalog";
import { useOrg } from "@/lib/org-context";
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
  const { activeOrg } = useOrg();
  const fn = useServerFn(listIntegrations);
  const { data } = useQuery({ 
    queryKey: ["integrations", activeOrg?.organization_id], 
    queryFn: () => fn({ organization_id: activeOrg?.organization_id! }),
    enabled: !!activeOrg
  });
  const connected = new Map((data ?? []).map((r) => [r.provider, r]));

  const grouped = INTEGRATIONS.reduce<Record<string, IntegrationDefinition[]>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrations"
        description="Connect APEX to the services your team already uses. OAuth wiring will be added in Phase 2."
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
                        <p className="text-xs text-muted-foreground">{i.description}</p>
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
                      onClick={() =>
                        toast.info(
                          `${i.name} OAuth will be enabled in Phase 2. Provider slot registered.`,
                        )
                      }
                    >
                      {isConnected ? "Manage" : "Connect"}
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
