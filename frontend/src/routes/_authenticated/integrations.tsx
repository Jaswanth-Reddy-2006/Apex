import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, useInView } from "framer-motion";
import {
  Circle,
  Lock,
  Loader2,
  ExternalLink,
  Trash2,
  Settings2,
  BookOpen,
  ArrowRight,
  Zap,
} from "lucide-react";
import {
  listIntegrations,
  connectGitlab,
  connectNotion,
  disconnectIntegration,
  listGithubRepositories,
  listGitlabRepositories,
  listNotionPages,
  connectGoogleDrive,
  listGoogleDriveFiles,
  scrapeWebsite,
  listScrapedWebsites,
  deleteScrapedWebsite,
} from "@/lib/api.functions";
import { INTEGRATIONS, type IntegrationDefinition } from "@/lib/integrations-catalog";
import { useOrg } from "@/lib/org-context";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ConnectConfirmModal,
  RedirectLoadingOverlay,
  DisconnectConfirmModal,
  DisconnectLoadingModal,
  DisconnectSuccessModal,
  ConnectionErrorModal,
} from "@/components/app/integration-modals";


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

// Shape returned by listIntegrations server function
interface IntegrationRecord {
  provider: string;
  status: string;
  display_name?: string;
  created_at?: string;
  [key: string]: unknown;
}

function IntegrationsPage() {
  const { activeOrg, hasPermission, loading } = useOrg();
  const fn = useServerFn(listIntegrations);
  const connectGitlabFn = useServerFn(connectGitlab);
  const connectNotionFn = useServerFn(connectNotion);
  const connectGdriveFn = useServerFn(connectGoogleDrive);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Clear any stuck loading/redirect toasts when mounting the integrations list page
    toast.dismiss();
  }, []);
  
  const [gitlabOpen, setGitlabOpen] = useState(false);
  const [gitlabUser, setGitlabUser] = useState("");
  const [gitlabToken, setGitlabToken] = useState("");
  const [connectingGitlab, setConnectingGitlab] = useState(false);

  const [notionOpen, setNotionOpen] = useState(false);
  const [notionToken, setNotionToken] = useState("");
  const [notionWorkspace, setNotionWorkspace] = useState("");
  const [connectingNotion, setConnectingNotion] = useState(false);

  const [gdriveOpen, setGdriveOpen] = useState(false);
  const [gdriveToken, setGdriveToken] = useState("");
  const [gdriveUser, setGdriveUser] = useState("");
  const [connectingGdrive, setConnectingGdrive] = useState(false);

  const [selectedManageIntegration, setSelectedManageIntegration] = useState<string | null>(null);
  
  const [websiteOpen, setWebsiteOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  // ── Premium Modal State ──────────────────────────────────────────────────
  const [connectModalItem, setConnectModalItem] = useState<IntegrationDefinition | null>(null);
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null);
  const [disconnectModalItem, setDisconnectModalItem] = useState<IntegrationDefinition | null>(null);
  const [disconnectLoadingItem, setDisconnectLoadingItem] = useState<string | null>(null);
  const [disconnectSuccessItem, setDisconnectSuccessItem] = useState<string | null>(null);
  const [connectErrorItem, setConnectErrorItem] = useState<{ item: IntegrationDefinition; type: "generic" | "offline" | "cancelled" } | null>(null);

  const listWebsitesFn = useServerFn(listScrapedWebsites);
  const scrapeWebsiteFn = useServerFn(scrapeWebsite);
  const deleteWebsiteFn = useServerFn(deleteScrapedWebsite);

  const websitesQuery = useQuery({
    queryKey: ["scraped-websites", activeOrg?.organization_id],
    queryFn: () => listWebsitesFn({ organization_id: activeOrg?.organization_id! }),
    enabled: !!activeOrg && websiteOpen,
  });

  const handleScrapeWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setScraping(true);
    try {
      await scrapeWebsiteFn({
        data: {
          url: newUrl,
          organization_id: activeOrg?.organization_id!,
        }
      });
      toast.success("Website scraped and indexed successfully!");
      setNewUrl("");
      queryClient.invalidateQueries({ queryKey: ["scraped-websites", activeOrg?.organization_id] });
      queryClient.invalidateQueries({ queryKey: ["integrations", activeOrg?.organization_id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to scrape website.");
    } finally {
      setScraping(false);
    }
  };

  const handleDeleteWebsite = async (url: string) => {
    if (!confirm(`Are you sure you want to delete indexed pages for ${url}?`)) return;
    const toastId = toast.loading("Deleting scraped website data...");
    try {
      await deleteWebsiteFn({
        data: {
          url,
          organization_id: activeOrg?.organization_id!,
        }
      });
      toast.success("Website data deleted.");
      queryClient.invalidateQueries({ queryKey: ["scraped-websites", activeOrg?.organization_id] });
      queryClient.invalidateQueries({ queryKey: ["integrations", activeOrg?.organization_id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete website.");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const disconnectFn = useServerFn(disconnectIntegration);

  const disconnectMutation = useMutation({
    mutationFn: (provider: string) =>
      disconnectFn({
        data: { organization_id: activeOrg?.organization_id!, provider },
      }),
    onSuccess: (_, provider) => {
      queryClient.invalidateQueries({ queryKey: ["integrations", activeOrg?.organization_id] });
      setSelectedManageIntegration(null);
      setDisconnectLoadingItem(null);
      // show success modal briefly
      setDisconnectSuccessItem(provider);
    },
    onError: (err: any) => {
      setDisconnectLoadingItem(null);
      toast.error(err.message || "Failed to disconnect integration.");
    },
  });

  const listGithubFn = useServerFn(listGithubRepositories);
  const listGitlabFn = useServerFn(listGitlabRepositories);
  const listNotionPagesFn = useServerFn(listNotionPages);

  const githubReposQuery = useQuery({
    queryKey: ["github-repos-manage", activeOrg?.organization_id],
    queryFn: () => listGithubFn({ data: { organization_id: activeOrg?.organization_id! } }),
    enabled: selectedManageIntegration === "github" && !!activeOrg,
  });

  const gitlabReposQuery = useQuery({
    queryKey: ["gitlab-repos-manage", activeOrg?.organization_id],
    queryFn: () => listGitlabFn({ data: { organization_id: activeOrg?.organization_id! } }),
    enabled: selectedManageIntegration === "gitlab" && !!activeOrg,
  });

  const notionPagesQuery = useQuery({
    queryKey: ["notion-pages-manage", activeOrg?.organization_id],
    queryFn: () => listNotionPagesFn({ organization_id: activeOrg?.organization_id! }),
    enabled: selectedManageIntegration === "notion" && !!activeOrg,
  });

  const listGdriveFn = useServerFn(listGoogleDriveFiles);

  const googleFilesQuery = useQuery({
    queryKey: ["gdrive-files-manage", activeOrg?.organization_id],
    queryFn: () => listGdriveFn({ organization_id: activeOrg?.organization_id! }),
    enabled: selectedManageIntegration === "gdrive" && !!activeOrg,
  });

  const { data, isLoading } = useQuery({ 
    queryKey: ["integrations", activeOrg?.organization_id], 
    queryFn: () => fn({ organization_id: activeOrg?.organization_id! }),
    enabled: !!activeOrg
  });
  
  if (loading || isLoading) {
    return (
      <div className="space-y-10 p-1">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        {[0, 1].map((s) => (
          <div key={s} className="space-y-4">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-3xl border border-border/40 p-6 space-y-4 bg-card/80 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!hasPermission("Integrations.Read")) {
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

  const connected = new Map((data ?? []).map((r: IntegrationRecord) => [r.provider, r]));

  const grouped = INTEGRATIONS.reduce<Record<string, IntegrationDefinition[]>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});

  const handleConnectClick = (item: IntegrationDefinition, isConnected: boolean) => {
    if (isConnected) {
      // Already connected — show manage toast
      const conn = connected.get(item.id);
      toast.success(`Already connected as: ${(conn as any)?.display_name || "Authorized User"}`);
      return;
    }
    if (item.id === "website") {
      setWebsiteOpen(true);
      return;
    }
    if (!activeOrg?.organization_id) {
      toast.error("No active organization found.");
      return;
    }
    // Show the premium confirm modal instead of redirecting immediately
    setConnectModalItem(item);
  };

  // Called when user clicks "Continue" in the connect confirm modal
  const handleConfirmConnect = () => {
    const item = connectModalItem;
    if (!item || !activeOrg?.organization_id) return;
    setConnectModalItem(null);
    setRedirectingTo(item.name);

    if (item.id === "github") {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "";
      if (!clientId) {
        setRedirectingTo(null);
        toast.error("Please add VITE_GITHUB_CLIENT_ID to your frontend/.env file.");
        return;
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/integrations-callback`);
      setTimeout(() => {
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user&state=${activeOrg.organization_id}`;
      }, 600);
    } else if (item.id === "gitlab") {
      setRedirectingTo(null);
      setGitlabUser("");
      setGitlabToken("");
      setGitlabOpen(true);
    } else if (item.id === "notion") {
      const clientId = import.meta.env.VITE_NOTION_CLIENT_ID || "";
      if (!clientId) {
        setRedirectingTo(null);
        setNotionToken("");
        setNotionWorkspace("");
        setNotionOpen(true);
        return;
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/integrations-callback`);
      setTimeout(() => {
        window.location.href = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&owner=user&state=notion:${activeOrg.organization_id}`;
      }, 600);
    } else if (item.id === "gdrive") {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
      if (!clientId) {
        setRedirectingTo(null);
        setGdriveToken("");
        setGdriveUser("");
        setGdriveOpen(true);
        return;
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/integrations-callback`);
      setTimeout(() => {
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/drive.readonly%20https://www.googleapis.com/auth/userinfo.profile&access_type=offline&prompt=consent&state=gdrive:${activeOrg.organization_id}`;
      }, 600);
    } else {
      setRedirectingTo(null);
      toast.info(`${item.name} integration will be enabled soon.`);
    }
  };

  // Disconnect flow — show confirmation modal first
  const handleDisconnectRequest = (item: IntegrationDefinition) => {
    setDisconnectModalItem(item);
  };

  const handleConfirmDisconnect = () => {
    const item = disconnectModalItem;
    if (!item) return;
    setDisconnectModalItem(null);
    setDisconnectLoadingItem(item.id);
    disconnectMutation.mutate(item.id);
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

  const handleGoogleDriveConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdriveToken) {
      toast.error("Please enter a Google Access Token.");
      return;
    }
    setConnectingGdrive(true);
    try {
      await connectGdriveFn({
        data: {
          username: gdriveUser || "Google User",
          token: gdriveToken,
          organization_id: activeOrg?.organization_id!,
        },
      });
      toast.success("Google Drive connected successfully!");
      queryClient.invalidateQueries({ queryKey: ["integrations", activeOrg?.organization_id] });
      setGdriveOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect Google Drive");
    } finally {
      setConnectingGdrive(false);
    }
  };

  return (
    <div className="space-y-12 relative">
      {/* Subtle radial background blur */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/4 blur-[100px]" />
      </div>

      <PageHeader
        title="Integrations"
        description="Connect APEX to the services your team already uses."
      />

      {Object.entries(grouped).map(([cat, items], catIdx) => (
        <AnimatedSection key={cat} delay={catIdx * 0.1}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6 pl-1">
            {CATEGORY_LABELS[cat as IntegrationDefinition["category"]]}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i, idx) => {
              const conn = connected.get(i.id);
              const isConnected = (conn as IntegrationRecord | undefined)?.status === "connected";
              return (
                <IntegrationCard
                  key={i.id}
                  item={i}
                  conn={conn}
                  isConnected={isConnected}
                  index={idx}
                  onConnect={() => handleConnectClick(i, isConnected)}
                  onManage={() => {
                    if (i.id === "website") setWebsiteOpen(true);
                    else setSelectedManageIntegration(i.id);
                  }}
                  onDisconnect={() => handleDisconnectRequest(i)}
                  isDisconnecting={disconnectLoadingItem === i.id}
                />
              );
            })}
          </div>
        </AnimatedSection>
      ))}

      {/* ─── Premium Modals ─────────────────────────────────────────────── */}
      {connectModalItem && (
        <ConnectConfirmModal
          integrationName={connectModalItem.name}
          integrationId={connectModalItem.id}
          onConfirm={handleConfirmConnect}
          onCancel={() => setConnectModalItem(null)}
        />
      )}
      {redirectingTo && (
        <RedirectLoadingOverlay integrationName={redirectingTo} />
      )}
      {disconnectModalItem && (
        <DisconnectConfirmModal
          integrationName={disconnectModalItem.name}
          onConfirm={handleConfirmDisconnect}
          onCancel={() => setDisconnectModalItem(null)}
        />
      )}
      {disconnectLoadingItem && (
        <DisconnectLoadingModal integrationName={disconnectLoadingItem} />
      )}
      {disconnectSuccessItem && (
        <DisconnectSuccessModal
          integrationName={disconnectSuccessItem}
          onDone={() => setDisconnectSuccessItem(null)}
        />
      )}
      {connectErrorItem && (
        <ConnectionErrorModal
          integrationName={connectErrorItem.item.name}
          errorType={connectErrorItem.type}
          onRetry={() => {
            const item = connectErrorItem.item;
            setConnectErrorItem(null);
            setTimeout(() => setConnectModalItem(item), 200);
          }}
          onCancel={() => setConnectErrorItem(null)}
        />
      )}

      <Dialog open={gitlabOpen} onOpenChange={setGitlabOpen}>
        <DialogContent className="glass-panel">
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
        <DialogContent className="glass-panel">
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

      <Dialog
        open={selectedManageIntegration !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedManageIntegration(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="capitalize flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Manage {selectedManageIntegration} Connection
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Status section */}
            <div className="rounded-lg border border-border p-4 bg-muted/30 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Account Connection</p>
                <p className="text-sm font-semibold text-foreground">
                  {selectedManageIntegration && (connected.get(selectedManageIntegration) as IntegrationRecord | undefined)?.display_name ? (
                    <span>@{(connected.get(selectedManageIntegration) as IntegrationRecord | undefined)?.display_name}</span>
                  ) : (
                    <span>Authorized Account</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="text-success font-medium">Synced & Active</span>
                </p>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (selectedManageIntegration && confirm(`Are you sure you want to disconnect ${selectedManageIntegration}?`)) {
                    disconnectMutation.mutate(selectedManageIntegration);
                  }
                }}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Disconnecting...</>
                ) : (
                  "Disconnect Account"
                )}
              </Button>
            </div>

            {/* List of synced resources (repositories or Notion pages) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  {selectedManageIntegration === "notion" ? "Synced Workspace Pages" : selectedManageIntegration === "gdrive" ? "Synced Google Drive Files" : "Linked Repositories"}
                </h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {selectedManageIntegration === "github" && (githubReposQuery.data?.repositories?.length ?? 0)}
                  {selectedManageIntegration === "gitlab" && (gitlabReposQuery.data?.repositories?.length ?? 0)}
                  {selectedManageIntegration === "notion" && (notionPagesQuery.data?.pages?.length ?? 0)}
                  {selectedManageIntegration === "gdrive" && (googleFilesQuery.data?.files?.length ?? 0)}
                  {selectedManageIntegration && !["github", "gitlab", "notion", "gdrive"].includes(selectedManageIntegration) && 0}
                  {" resources"}
                </Badge>
              </div>

              {/* GitHub loading/list */}
              {selectedManageIntegration === "github" && (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {githubReposQuery.isLoading ? (
                    <div className="space-y-2 py-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : githubReposQuery.data?.repositories?.length ? (
                    githubReposQuery.data.repositories.map((repo: any) => (
                      <div key={repo.full_name} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-sm">
                        <span className="font-medium text-foreground">{repo.full_name}</span>
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                          View Repository <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No repositories found in this account.</p>
                  )}
                </div>
              )}

              {/* GitLab loading/list */}
              {selectedManageIntegration === "gitlab" && (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {gitlabReposQuery.isLoading ? (
                    <div className="space-y-2 py-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : gitlabReposQuery.data?.repositories?.length ? (
                    gitlabReposQuery.data.repositories.map((repo: any) => (
                      <div key={repo.full_name} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-sm">
                        <span className="font-medium text-foreground">{repo.full_name}</span>
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                          View Repository <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No repositories found in this account.</p>
                  )}
                </div>
              )}

              {/* Notion loading/list */}
              {selectedManageIntegration === "notion" && (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {notionPagesQuery.isLoading ? (
                    <div className="space-y-2 py-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : notionPagesQuery.data?.pages?.length ? (
                    notionPagesQuery.data.pages.map((page: any) => (
                      <div key={page.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-sm">
                        <div className="flex flex-col space-y-0.5">
                          <span className="font-medium text-foreground">{page.title}</span>
                          {page.last_edited_time && (
                            <span className="text-[10px] text-muted-foreground">Edited: {new Date(page.last_edited_time).toLocaleDateString()}</span>
                          )}
                        </div>
                        {page.url ? (
                          <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                            Open in Notion <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Synced to AI Memory</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No accessible pages found in this workspace connection.</p>
                  )}
                </div>
              )}

              {/* Google Drive loading/list */}
              {selectedManageIntegration === "gdrive" && (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {googleFilesQuery.isLoading ? (
                    <div className="space-y-2 py-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : googleFilesQuery.data?.files?.length ? (
                    googleFilesQuery.data.files.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-sm">
                        <div className="flex flex-col space-y-0.5">
                          <span className="font-medium text-foreground">{file.name}</span>
                          {file.modifiedTime && (
                            <span className="text-[10px] text-muted-foreground">Modified: {new Date(file.modifiedTime).toLocaleDateString()}</span>
                          )}
                        </div>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                          Open File <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No accessible files found in this Google Drive connection.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={gdriveOpen} onOpenChange={setGdriveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Google Drive</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGoogleDriveConnect} className="space-y-4">
            <div>
              <Label htmlFor="gd-user">Display Name / Email (Optional)</Label>
              <Input
                id="gd-user"
                value={gdriveUser}
                onChange={(e) => setGdriveUser(e.target.value)}
                placeholder="e.g. personal-drive"
              />
            </div>
            <div>
              <Label htmlFor="gd-token">Google Access Token</Label>
              <Input
                id="gd-token"
                type="password"
                value={gdriveToken}
                onChange={(e) => setGdriveToken(e.target.value)}
                placeholder="ya29.a0AfH6SM..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a temporary Google Access Token with `drive.readonly` access to connect manual drive resources.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGdriveOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={connectingGdrive}>
                {connectingGdrive ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect Drive"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={websiteOpen} onOpenChange={setWebsiteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Manage Website Scraper
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <form onSubmit={handleScrapeWebsite} className="space-y-2">
              <Label htmlFor="web-url" className="text-sm font-semibold">
                Scrape & Index a New Website URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="web-url"
                  type="url"
                  placeholder="https://example.com/docs"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  disabled={scraping}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={scraping || !newUrl} className="gradient-primary">
                  {scraping ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Scraping...
                    </>
                  ) : (
                    "Scrape & Index"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste a public documentation link or webpage. The scraper will extract and clean the text, run vector embeddings, and save them to your AI RAG memory.
              </p>
            </form>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Currently Indexed Pages</h3>
              {websitesQuery.isLoading ? (
                <div className="space-y-2 py-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : websitesQuery.data && websitesQuery.data.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {websitesQuery.data.map((site: any) => (
                    <div
                      key={site.url}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-sm"
                    >
                      <div className="flex flex-col space-y-0.5 max-w-[80%]">
                        <span className="font-semibold text-foreground truncate">{site.title}</span>
                        <span className="text-xs text-muted-foreground truncate font-mono">{site.url}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {site.chunks_count} chunks indexed · Added {new Date(site.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleDeleteWebsite(site.url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No websites indexed"
                  description="Add a webpage URL above to start teaching your APEX AI assistant."
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helper: Section Fade-Up on Scroll ───────────────────────────────────────
function AnimatedSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className="space-y-0"
    >
      {children}
    </motion.section>
  );
}

// ─── Helper: Premium Integration Card ────────────────────────────────────────
function IntegrationCard({
  item,
  conn,
  isConnected,
  index,
  onConnect,
  onManage,
  onDisconnect,
  isDisconnecting,
}: {
  item: IntegrationDefinition;
  conn: any;
  isConnected: boolean;
  index: number;
  onConnect: () => void;
  onManage: () => void;
  onDisconnect: () => void;
  isDisconnecting: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const tiltX = isHovered ? (mousePos.y - 0.5) * -2 : 0;
  const tiltY = isHovered ? (mousePos.x - 0.5) * 2 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, delay: index * 0.06, ease: "easeOut" }}
    >
      <motion.div
        ref={cardRef}
        className={cn(
          // Base card — always white, never green
          "relative overflow-hidden cursor-default",
          "bg-white/80 dark:bg-card/80 backdrop-blur-[12px]",
          "border rounded-3xl",
          "transition-colors duration-300",
          // Connected: thin left accent line via box-ring + soft border
          isConnected
            ? "border-border/50 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08),inset_3px_0_0_0_rgba(34,197,94,0.75)]"
            : "border-border/40 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)]",
          isHovered && "border-primary/20 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.13),inset_3px_0_0_0_rgba(34,197,94,0.75)]",
        )}
        style={{
          transform: `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) ${isHovered ? "translateY(-6px) scale(1.018)" : "translateY(0) scale(1)"}`,
          transition: "transform 250ms ease-out, box-shadow 250ms ease-out, border-color 250ms ease-out",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
        onMouseMove={handleMouseMove}
      >
        {/* Glass top shine */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        {/* Mouse-following soft reflection */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{
            opacity: isHovered ? 0.05 : 0,
            background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, white, transparent 65%)`,
            transition: "opacity 200ms",
          }}
        />

        {/* Very subtle connected health indicator at top-right */}
        {isConnected && (
          <div className="absolute top-4 right-4 z-10">
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"
                style={{ animationDuration: "4s" }}
              />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
        )}

        <div className="relative p-6 space-y-4">
          {/* ── Row 1: Logo + Name + Status badge ── */}
          <div className="flex items-center gap-3">
            {/* Logo — circular glass container, always neutral */}
            <motion.div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                "bg-primary/8 text-primary border border-primary/10 font-bold text-base shadow-sm",
              )}
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {item.name[0]}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[15px] leading-tight text-foreground truncate">
                  {item.name}
                </h3>
              </div>
              {isConnected ? (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  <span className="text-emerald-600 font-medium">@{(conn as any)?.display_name}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                  {item.description}
                </p>
              )}
            </div>

            {/* Status badge */}
            {isConnected ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50/80 text-emerald-700 border border-emerald-200/60"
                title="Connected · Active"
              >
                <Zap className="h-2.5 w-2.5" />
                Connected
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.04 }}
                className="shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium bg-muted/50 text-muted-foreground border border-border/50"
              >
                <Circle className="h-2 w-2" />
                Not connected
              </motion.div>
            )}
          </div>

          {/* ── Row 2: Connected meta — Last Sync / Connected since ── */}
          {isConnected && (conn as any)?.created_at && (
            <div className="flex items-center gap-4 px-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <div className="h-3 w-3 rounded-full bg-emerald-100 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
                <span>
                  Since{" "}
                  <span className="font-medium text-foreground/70">
                    {new Date((conn as any).created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="text-emerald-600 font-medium">Healthy</span>
              </div>
            </div>
          )}

          {/* ── Divider ── */}
          <div className="h-px bg-border/40" />

          {/* ── Row 3: Action buttons ── */}
          <div className="flex gap-2">
            {isConnected ? (
              <>
                {/* Manage — glass style */}
                <motion.button
                  className={cn(
                    "group flex flex-1 items-center justify-center gap-1.5",
                    "rounded-xl border border-border/60 bg-muted/30 backdrop-blur-sm",
                    "px-3 py-2.5 text-[13px] font-medium text-foreground",
                    "transition-all duration-200",
                    "hover:border-primary/25 hover:bg-primary/5 hover:text-primary hover:shadow-[0_2px_12px_-4px_rgba(108,76,241,0.2)]",
                  )}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onManage}
                >
                  <motion.span
                    whileHover={{ rotate: 22 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex shrink-0"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </motion.span>
                  Manage
                </motion.button>

                {/* Disconnect — circular glass icon button */}
                <motion.button
                  className={cn(
                    "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl",
                    "border border-border/60 bg-muted/30 backdrop-blur-sm text-muted-foreground",
                    "transition-all duration-200",
                    "hover:border-red-300/60 hover:bg-red-50/80 hover:text-red-600",
                    "hover:shadow-[0_2px_14px_-4px_rgba(239,68,68,0.25)]",
                  )}
                  whileHover={{ y: -1, scale: 1.04 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={onDisconnect}
                  disabled={isDisconnecting}
                  title="Disconnect integration"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </motion.button>
              </>
            ) : (
              /* Connect — gradient primary with arrow */
              <motion.button
                className={cn(
                  "group relative flex w-full items-center justify-center gap-2",
                  "rounded-xl gradient-primary text-primary-foreground",
                  "px-4 py-2.5 text-[13px] font-semibold",
                  "shadow-[0_2px_10px_-2px_rgba(108,76,241,0.35)]",
                  "overflow-hidden",
                )}
                whileHover={{
                  y: -2,
                  scale: 1.015,
                  boxShadow: "0 8px 24px -4px rgba(108,76,241,0.42)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={onConnect}
              >
                <span>Connect</span>
                <motion.span
                  className="inline-flex"
                  initial={{ x: 0 }}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.18 }}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </motion.span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
