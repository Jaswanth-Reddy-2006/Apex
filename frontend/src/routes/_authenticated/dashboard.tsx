import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Building2,
  FolderKanban,
  Users,
  Plug,
  Activity,
  TrendingUp,
  Bug,
  GitBranch,
  Rocket,
  Wallet,
  Eye,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  getDashboardStats,
  listRecentActivity,
  listProjects,
  listMembers,
} from "@/lib/api.functions";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/lib/org-context";
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { activeOrg, role, loading, isOwner, isAdmin } = useOrg();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!activeOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title="Welcome to APEX" description="You are not part of any organization yet." />
        <EmptyState
          icon={Building2}
          title="No organization"
          description="Create an organization to get started."
          action={
            <Button asChild>
              <Link to="/organization">Create organization</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const rs = role.toLowerCase();
  if (isOwner) return <OwnerDashboard />;
  if (isAdmin) return <OwnerDashboard />;
  if (rs.includes("project-manager") || rs === "manager") return <ProjectManagerDashboard />;
  if (rs.includes("developer")) return <DeveloperDashboard />;
  if (rs.includes("tester") || rs.includes("qa")) return <TesterDashboard />;
  if (rs.includes("finance")) return <FinanceDashboard />;
  return <ViewerDashboard />;
}

// -------------------- Shared cards --------------------
function StatCards() {
  const statsFn = useServerFn(getDashboardStats);
  const stats = useQuery({ queryKey: ["dashboard", "stats"], queryFn: () => statsFn() });
  const cards = [
    { label: "Organizations", value: stats.data?.organizations ?? 0, icon: Building2 },
    { label: "Projects", value: stats.data?.projects ?? 0, icon: FolderKanban },
    { label: "Team members", value: stats.data?.members ?? 0, icon: Users },
    { label: "Integrations", value: stats.data?.integrations ?? 0, icon: Plug },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            <div className="rounded-xl bg-primary/20 backdrop-blur-md border border-primary/30 p-2 text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]">
              <c.icon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-semibold">{c.value}</div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3 w-3 text-success" />
              Live
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RoleBadge() {
  const { role, activeOrg } = useOrg();
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="capitalize">
        <ShieldCheck className="mr-1 h-3 w-3" />
        {role.replace(/-/g, " ")}
      </Badge>
      <Badge variant="outline">{activeOrg?.organization_name}</Badge>
    </div>
  );
}

function RecentActivityCard() {
  const activityFn = useServerFn(listRecentActivity);
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => activityFn() });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (activity.data ?? []).length === 0 ? (
          <EmptyState icon={Activity} title="No activity" description="Actions will appear here." />
        ) : (
          <ul className="space-y-3">
            {(activity.data ?? []).slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm">{a.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectsCard({ title = "Projects" }: { title?: string }) {
  const projectsFn = useServerFn(listProjects);
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => projectsFn() });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (projects.data ?? []).length === 0 ? (
          <EmptyState icon={FolderKanban} title="No projects" description="Create one to get started." />
        ) : (
          <ul className="space-y-2">
            {(projects.data ?? []).slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  to="/projects"
                  className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-muted"
                >
                  <span className="font-medium">{p.name}</span>
                  <Badge variant="secondary">{p.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// -------------------- Owner / Admin --------------------
// Handled by the Premium OwnerDashboard imported from @/components/dashboard/owner-dashboard

// -------------------- Project Manager --------------------
function ProjectManagerDashboard() {
  const projectsFn = useServerFn(listProjects);
  const membersFn = useServerFn(listMembers);
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => projectsFn() });
  const members = useQuery({ queryKey: ["members"], queryFn: () => membersFn() });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Project Manager Dashboard"
        description="Track projects, assignments, and team velocity."
        actions={<RoleBadge />}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Active projects</div><div className="mt-1 text-3xl font-semibold">{projects.data?.length ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Team size</div><div className="mt-1 text-3xl font-semibold">{members.data?.length ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Open tasks</div><div className="mt-1 text-3xl font-semibold">0</div></CardContent></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectsCard title="Your projects" />
        <RecentActivityCard />
      </div>
    </div>
  );
}

// -------------------- Developer --------------------
function DeveloperDashboard() {
  const projectsFn = useServerFn(listProjects);
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => projectsFn() });
  return (
    <div className="space-y-8">
      <PageHeader
        title="Developer Dashboard"
        description="Your assigned projects, deployments, and AI copilot."
        actions={<RoleBadge />}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><GitBranch className="h-5 w-5 text-primary" /><div><div className="text-xs text-muted-foreground">Assigned projects</div><div className="text-2xl font-semibold">{projects.data?.length ?? 0}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Rocket className="h-5 w-5 text-primary" /><div><div className="text-xs text-muted-foreground">Deployments (7d)</div><div className="text-2xl font-semibold">0</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><MessageSquare className="h-5 w-5 text-primary" /><div><div className="text-xs text-muted-foreground">AI chats</div><Button asChild size="sm" variant="link" className="p-0"><Link to="/chat">Open AI Chat →</Link></Button></div></CardContent></Card>
      </div>
      <ProjectsCard title="Assigned projects" />
    </div>
  );
}

// -------------------- Tester / QA --------------------
function TesterDashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="QA / Tester Dashboard"
        description="Bug logs, test runs, and release readiness."
        actions={<RoleBadge />}
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Bug className="h-5 w-5 text-destructive" /><div><div className="text-xs text-muted-foreground">Open bugs</div><div className="text-2xl font-semibold">0</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-success" /><div><div className="text-xs text-muted-foreground">Tests passed</div><div className="text-2xl font-semibold">0</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-5 w-5 text-warning" /><div><div className="text-xs text-muted-foreground">Pending review</div><div className="text-2xl font-semibold">0</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Rocket className="h-5 w-5 text-primary" /><div><div className="text-xs text-muted-foreground">Releases (30d)</div><div className="text-2xl font-semibold">0</div></div></CardContent></Card>
      </div>
      <ProjectsCard title="Projects under test" />
    </div>
  );
}

// -------------------- Finance --------------------
function FinanceDashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Finance Dashboard"
        description="Billing, invoices, and workspace credits."
        actions={<RoleBadge />}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><Wallet className="h-5 w-5 text-primary" /><div><div className="text-xs text-muted-foreground">MTD spend</div><div className="text-2xl font-semibold">$0.00</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-success" /><div><div className="text-xs text-muted-foreground">Credits remaining</div><div className="text-2xl font-semibold">—</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><div className="text-xs text-muted-foreground">Paid seats</div><div className="text-2xl font-semibold">1</div></div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent invoices</CardTitle></CardHeader>
        <CardContent>
          <EmptyState icon={Wallet} title="No invoices" description="Invoices will appear here after your first billing cycle." />
        </CardContent>
      </Card>
    </div>
  );
}

// -------------------- Viewer --------------------
function ViewerDashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Read-only overview of your organization."
        actions={<RoleBadge />}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><Eye className="h-5 w-5 text-primary" /><div><div className="text-xs text-muted-foreground">Access level</div><div className="text-2xl font-semibold">Read-only</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><FolderKanban className="h-5 w-5 text-primary" /><div><div className="text-xs text-muted-foreground">Visible projects</div><div className="text-2xl font-semibold">—</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Activity className="h-5 w-5 text-primary" /><div><div className="text-xs text-muted-foreground">Latest updates</div><div className="text-2xl font-semibold">Live</div></div></CardContent></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectsCard title="Visible projects" />
        <RecentActivityCard />
      </div>
    </div>
  );
}
