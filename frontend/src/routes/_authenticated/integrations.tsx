import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Key, ExternalLink, Loader2 } from "lucide-react";
import { listIntegrations, listMyOrganizations, connectVercelToken } from "@/lib/api.functions";
import { INTEGRATIONS, type IntegrationDefinition } from "@/lib/integrations-catalog";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const qc = useQueryClient();
  const fn = useServerFn(listIntegrations);
  const orgsFn = useServerFn(listMyOrganizations);
  const connectVercelFn = useServerFn(connectVercelToken);

  const { data } = useQuery({ queryKey: ["integrations"], queryFn: () => fn() });
  const { data: orgs } = useQuery({ queryKey: ["organizations"], queryFn: () => orgsFn() });

  const connected = new Map((data ?? []).map((r) => [r.provider, r]));
  const activeOrg = orgs?.[0]?.id || "";

  // Vercel token dialog state
  const [vercelDialogOpen, setVercelDialogOpen] = useState(false);
  const [vercelToken, setVercelToken] = useState("");

  const vercelConnect = useMutation({
    mutationFn: () =>
      connectVercelFn({
        data: { token: vercelToken.trim(), organization_id: activeOrg },
      }),
    onSuccess: (result) => {
      toast.success(`Vercel connected as @${result.username}!`);
      qc.invalidateQueries({ queryKey: ["integrations"] });
      qc.invalidateQueries({ queryKey: ["vercel-projects"] });
      setVercelDialogOpen(false);
      setVercelToken("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grouped = INTEGRATIONS.reduce<Record<string, IntegrationDefinition[]>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});

  const handleConnectClick = (item: IntegrationDefinition, isConnected: boolean) => {
    if (item.id === "github") {
      if (isConnected) {
        const conn = connected.get("github");
        toast.success(`Already connected to GitHub as: ${conn?.display_name || "Authorized User"}`);
        return;
      }
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "";
      if (!clientId) {
        toast.error("Please add VITE_GITHUB_CLIENT_ID to your frontend/.env file.");
        return;
      }
      if (!activeOrg) {
        toast.error("No active organization found. Please create one first.");
        return;
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/integrations-callback`);
      const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user&state=${activeOrg}`;
      toast.loading("Redirecting to GitHub for authorization...");
      window.location.href = url;

    } else if (item.id === "vercel") {
      if (isConnected) {
        const conn = connected.get("vercel");
        toast.success(`Already connected to Vercel as: ${conn?.display_name || "Authorized User"}`);
        return;
      }
      if (!activeOrg) {
        toast.error("No active organization found. Please create one first.");
        return;
      }
      setVercelDialogOpen(true);

    } else {
      toast.info(`${item.name} integration will be enabled soon.`);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrations"
        description="Connect APEX to the services your team already uses."
      />

      {/* Vercel Token Dialog */}
      <Dialog open={vercelDialogOpen} onOpenChange={setVercelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white text-sm font-bold">▲</span>
              Connect Vercel
            </DialogTitle>
            <DialogDescription>
              Paste your Vercel Access Token below. APEX will verify it and connect to your Vercel account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
              <p className="text-xs font-medium text-foreground">How to get your token:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">vercel.com/account/tokens <ExternalLink className="h-2.5 w-2.5" /></a></li>
                <li>Click <strong>"Create Token"</strong></li>
                <li>Name it <strong>"APEX Integration"</strong></li>
                <li>Set expiration → <strong>No Expiration</strong></li>
                <li>Copy the token and paste it below</li>
              </ol>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vercel-token" className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                Access Token
              </Label>
              <Input
                id="vercel-token"
                type="password"
                placeholder="Paste your Vercel token here..."
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setVercelDialogOpen(false); setVercelToken(""); }}>
              Cancel
            </Button>
            <Button
              disabled={!vercelToken.trim() || vercelConnect.isPending}
              onClick={() => vercelConnect.mutate()}
              className="gradient-primary text-primary-foreground"
            >
              {vercelConnect.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
              ) : (
                "Connect Vercel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
