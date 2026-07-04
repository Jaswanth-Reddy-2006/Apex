import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Lock, Loader2 } from "lucide-react";
import { listIntegrations, connectGitlab, connectNotion } from "@/lib/api.functions";
import { INTEGRATIONS, type IntegrationDefinition } from "@/lib/integrations-catalog";
import { useOrg } from "@/lib/org-context";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const { activeOrg, hasPermission, loading } = useOrg();
  const fn = useServerFn(listIntegrations);
  const connectGitlabFn = useServerFn(connectGitlab);
  const connectNotionFn = useServerFn(connectNotion);
  const queryClient = useQueryClient();
  
  const [gitlabOpen, setGitlabOpen] = useState(false);
  const [gitlabUser, setGitlabUser] = useState("");
  const [gitlabToken, setGitlabToken] = useState("");
  const [connectingGitlab, setConnectingGitlab] = useState(false);

  const [notionOpen, setNotionOpen] = useState(false);
  const [notionToken, setNotionToken] = useState("");
  const [notionWorkspace, setNotionWorkspace] = useState("");
  const [connectingNotion, setConnectingNotion] = useState(false);

  const { data, isLoading } = useQuery({ 
    queryKey: ["integrations", activeOrg?.organization_id], 
    queryFn: () => fn({ organization_id: activeOrg?.organization_id! }),
    enabled: !!activeOrg
  });
  
  if (loading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!hasPermission("Integrations.Connect")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Access Denied" />
        <EmptyState
          icon={Lock}
          title="Permission Required"
          description="You do not have the required permissions to view or connect integrations."
        />
      </div>
    );
  }

  const connected = new Map((data ?? []).map((r) => [r.provider, r]));

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
      if (!activeOrg?.organization_id) {
        toast.error("No active organization found.");
        return;
      }

      const redirectUri = encodeURIComponent(`${window.location.origin}/integrations-callback`);
      const githubOAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user&state=${activeOrg.organization_id}`;
      
      toast.loading("Redirecting to GitHub for authorization...");
      window.location.href = githubOAuthUrl;
    } else if (item.id === "gitlab") {
      if (isConnected) {
        const conn = connected.get("gitlab");
        toast.success(`Already connected to GitLab as: ${conn?.display_name || "Authorized User"}`);
        return;
      }
      if (!activeOrg?.organization_id) {
        toast.error("No active organization found.");
        return;
      }
      setGitlabUser("");
      setGitlabToken("");
      setGitlabOpen(true);
    } else if (item.id === "notion") {
      if (isConnected) {
        const conn = connected.get("notion");
        toast.success(`Already connected to Notion Workspace: ${conn?.display_name || "Authorized Workspace"}`);
        return;
      }
      if (!activeOrg?.organization_id) {
        toast.error("No active organization found.");
        return;
      }
      const clientId = import.meta.env.VITE_NOTION_CLIENT_ID || "";
      if (!clientId) {
        setNotionToken("");
        setNotionWorkspace("");
        setNotionOpen(true);
        return;
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/integrations-callback`);
      const notionOAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&owner=user&state=notion:${activeOrg.organization_id}`;
      
      toast.loading("Redirecting to Notion for authorization...");
      window.location.href = notionOAuthUrl;
    } else {
      toast.info(`${item.name} integration will be enabled soon.`);
    }
  };

  const handleGitlabConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitlabUser || !gitlabToken) {
      toast.error("Please enter both username and Personal Access Token.");
      return;
    }
    setConnectingGitlab(true);
    try {
      await connectGitlabFn({
        data: {
          username: gitlabUser,
          token: gitlabToken,
          organization_id: activeOrg?.organization_id!,
        },
      });
      toast.success("GitLab connected successfully!");
      queryClient.invalidateQueries({ queryKey: ["integrations", activeOrg?.organization_id] });
      setGitlabOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect GitLab");
    } finally {
      setConnectingGitlab(false);
    }
  };

  const handleNotionConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notionToken || !notionWorkspace) {
      toast.error("Please enter both Notion Token and Workspace Name.");
      return;
    }
    setConnectingNotion(true);
    try {
      await connectNotionFn({
        data: {
          token: notionToken,
          workspaceName: notionWorkspace,
          organization_id: activeOrg?.organization_id!,
        },
      });
      toast.success("Notion connected successfully!");
      queryClient.invalidateQueries({ queryKey: ["integrations", activeOrg?.organization_id] });
      setNotionOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect Notion");
    } finally {
      setConnectingNotion(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrations"
        description="Connect APEX to the services your team already uses."
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

      <Dialog open={gitlabOpen} onOpenChange={setGitlabOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect GitLab</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGitlabConnect} className="space-y-4">
            <div>
              <Label htmlFor="gl-user">GitLab Username</Label>
              <Input
                id="gl-user"
                value={gitlabUser}
                onChange={(e) => setGitlabUser(e.target.value)}
                placeholder="e.g. gitlab_username"
              />
            </div>
            <div>
              <Label htmlFor="gl-token">Personal Access Token</Label>
              <Input
                id="gl-token"
                type="password"
                value={gitlabToken}
                onChange={(e) => setGitlabToken(e.target.value)}
                placeholder="glpat-..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Generate a token in your GitLab Settings &rarr; Access Tokens with "api" or "read_api" scope.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGitlabOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={connectingGitlab}>
                {connectingGitlab ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={notionOpen} onOpenChange={setNotionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Notion Workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNotionConnect} className="space-y-4">
            <div>
              <Label htmlFor="notion-workspace">Workspace Name</Label>
              <Input
                id="notion-workspace"
                value={notionWorkspace}
                onChange={(e) => setNotionWorkspace(e.target.value)}
                placeholder="e.g. APEX Docs"
              />
            </div>
            <div>
              <Label htmlFor="notion-token">Internal Integration Token</Label>
              <Input
                id="notion-token"
                type="password"
                value={notionToken}
                onChange={(e) => setNotionToken(e.target.value)}
                placeholder="secret_..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Generate a secret token in your <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className="text-primary hover:underline">Notion Integrations Dashboard</a>.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNotionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={connectingNotion}>
                {connectingNotion ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect Workspace"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
