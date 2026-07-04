import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Cpu,
  Wallet,
  Users,
  FileText,
  TrendingUp,
  Megaphone,
  Briefcase,
  PlayCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  DollarSign,
  AlertTriangle,
  FileCheck,
  Send,
  UserCheck,
  Percent,
} from "lucide-react";
import {
  getAutonomousDashboard,
  updateActionStatus,
  executeAgentGoal,
  seedAutonomousDemo,
} from "@/lib/api.functions";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/autonomous-os")({
  component: AutonomousOSPage,
});

function AutonomousOSPage() {
  const queryClient = useQueryClient();
  const getDash = useServerFn(getAutonomousDashboard);
  const updateStatus = useServerFn(updateActionStatus);
  const executeGoal = useServerFn(executeAgentGoal);
  const seedDemo = useServerFn(seedAutonomousDemo);

  const [activeTab, setActiveTab] = useState("all");
  const [goalPrompt, setGoalPrompt] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<"orchestrator" | "finance" | "hiring" | "legal" | "gtm" | "fundraising">("orchestrator");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    traces: string[];
    draft: string;
    agent_type: string;
  } | null>(null);

  // Real-time custom slider state for interactive runway tool
  const [customBurn, setCustomBurn] = useState(12000);

  const { data, isLoading } = useQuery({
    queryKey: ["autonomous-dashboard"],
    queryFn: () => getDash({ organization_id: "global" }),
  });

  const seedMutation = useMutation({
    mutationFn: () => seedDemo({ organization_id: "global" }),
    onSuccess: () => {
      toast.success("Demo environment populated successfully!");
      queryClient.invalidateQueries({ queryKey: ["autonomous-dashboard"] });
      setExecutionResult(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to seed demo data");
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ actionId, status }: { actionId: string; status: "approved" | "rejected" }) =>
      updateStatus({ organization_id: "global", action_id: actionId, status }),
    onSuccess: (_, variables) => {
      toast.success(`Action successfully ${variables.status}!`);
      queryClient.invalidateQueries({ queryKey: ["autonomous-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to complete action");
    },
  });

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalPrompt.trim()) return;

    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const res = await executeGoal({
        organization_id: "global",
        goal: goalPrompt,
        agent_type: selectedAgent,
      });
      setExecutionResult(res);
      toast.success("Goal processed by the AI CEO Assistant!");
      queryClient.invalidateQueries({ queryKey: ["autonomous-dashboard"] });
    } catch (err: any) {
      toast.error(err.message || "Error running planner");
    } finally {
      setIsExecuting(false);
    }
  };

  const metrics = data?.metrics || {
    runway_months: 14.5,
    burn_rate: 12000.0,
    cash_balance: 174000.0,
    hiring_candidates_count: 8,
    sales_pipeline_value: 45000.0,
    investor_pipeline_count: 5,
  };

  const actions = data?.actions || [];
  const pendingActions = actions.filter((a) => a.status === "pending");

  // Interactive runway computation based on slider
  const simulatedRunway = useMemo(() => {
    if (customBurn <= 0) return 99;
    return parseFloat((metrics.cash_balance / customBurn).toFixed(1));
  }, [customBurn, metrics.cash_balance]);

  // Sync custom burn slider to DB metrics initially
  useMemo(() => {
    if (metrics.burn_rate) {
      setCustomBurn(metrics.burn_rate);
    }
  }, [metrics.burn_rate]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Autonomous Startup OS"
        description="Your AI-driven CEO command deck that schedules campaigns, manages runway, and stages corporate transactions."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4 text-primary" />
              )}
              Reset Demo Env
            </Button>
          </div>
        }
      />

      {/* 1. Core Financial & Operating Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cash Reserves</CardTitle>
            <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.cash_balance.toLocaleString()}</div>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active bank ledger
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Burn</CardTitle>
            <div className="rounded-md bg-destructive/10 p-2 text-destructive">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.burn_rate.toLocaleString()}/mo</div>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Run-rate costs
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Runway Health</CardTitle>
            <div className="rounded-md bg-primary-soft p-2 text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.runway_months} Months</div>
            <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  metrics.runway_months > 12
                    ? "bg-emerald-500"
                    : metrics.runway_months > 6
                    ? "bg-amber-500"
                    : "bg-destructive"
                }`}
                style={{ width: `${Math.min(100, (metrics.runway_months / 24) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active pipelines</CardTitle>
            <div className="rounded-md bg-amber-500/10 p-2 text-amber-600">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-sm font-medium flex justify-between">
              <span>ATS Candidates:</span>
              <span className="font-bold text-foreground">{metrics.hiring_candidates_count}</span>
            </div>
            <div className="text-sm font-medium flex justify-between">
              <span>Sales Pipeline:</span>
              <span className="font-bold text-foreground">${metrics.sales_pipeline_value.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Human Approval Gates */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Pending Approval Gates (High-Stakes Actions)
        </h2>
        {pendingActions.length === 0 ? (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No pending high-stakes transactions. All agent processes are running within standard safety margins.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingActions.map((action) => (
              <Card key={action.id} className="border-amber-500/30 bg-amber-500/5 shadow-soft flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize text-amber-600 border-amber-500/30 bg-amber-500/10">
                      {action.agent_type} agent
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(action.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-2">{action.description}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                    {action.trace}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 flex-grow">
                  <div className="rounded border border-amber-500/20 bg-amber-500/10 p-2 text-xs space-y-1">
                    <p className="font-semibold text-[10px] uppercase text-amber-800 tracking-wider">Auditable Trace Log</p>
                    <p className="text-amber-700 italic">"Reason: {action.trace}"</p>
                  </div>
                </CardContent>
                <div className="p-4 pt-0 flex gap-2 border-t border-amber-500/10 mt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => actionMutation.mutate({ actionId: action.id, status: "approved" })}
                    disabled={actionMutation.isPending}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/20"
                    onClick={() => actionMutation.mutate({ actionId: action.id, status: "rejected" })}
                    disabled={actionMutation.isPending}
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 3. Founder Command Panel & Agent Execution Terminal */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary animate-pulse" />
            AI CEO Assistant Terminal
          </h2>
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base">Goal Dispatcher</CardTitle>
              <CardDescription>
                Instruct the orchestrator planner. It will dynamically decompose your goal and assign tasks to specialized sub-agents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <Label htmlFor="agent-select">Target Agent</Label>
                    <select
                      id="agent-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                      value={selectedAgent}
                      onChange={(e: any) => setSelectedAgent(e.target.value)}
                    >
                      <option value="orchestrator">Multi-Agent Orchestrator</option>
                      <option value="finance">Finance Agent</option>
                      <option value="hiring">Hiring Agent</option>
                      <option value="legal">Legal Agent</option>
                      <option value="gtm">GTM Agent</option>
                      <option value="fundraising">Fundraising Agent</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="goal-prompt">State Your Goal</Label>
                    <Input
                      id="goal-prompt"
                      className="mt-1.5"
                      value={goalPrompt}
                      onChange={(e) => setGoalPrompt(e.target.value)}
                      placeholder="e.g., 'Draft a Senior Frontend Engineer JD and send offer letter to Jane Miller'"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isExecuting} className="gradient-primary text-white">
                    {isExecuting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Dispatching...</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" /> Run Agent Planner</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {executionResult && (
            <Card className="border-border/80 bg-muted/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Planner Trace & Drafted Outputs</CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {executionResult.agent_type} Executed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded bg-black p-3 font-mono text-xs text-green-400 space-y-1">
                  <p className="font-semibold text-white uppercase text-[10px] tracking-wider mb-2 text-green-300">// Execution Planner Log</p>
                  {executionResult.traces.map((trace, idx) => (
                    <p key={idx}>{trace}</p>
                  ))}
                </div>

                {executionResult.draft && (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> Generated Artifact
                    </p>
                    <div className="text-sm prose prose-sm text-foreground max-w-none whitespace-pre-wrap">
                      {executionResult.draft}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Audit Log column */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Audit & Decisional Trace</h2>
          <Card className="border-border/80 max-h-[400px] overflow-y-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Activity Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No log entries found. Seed mock data to populate logs.</p>
              ) : (
                <div className="space-y-3">
                  {actions.map((act) => (
                    <div key={act.id} className="text-xs border-b border-border pb-2 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground capitalize">{act.agent_type} Agent</span>
                        <Badge variant="outline" className={`text-[9px] uppercase ${
                          act.status === "approved"
                            ? "text-success border-success/30 bg-success-soft"
                            : act.status === "rejected"
                            ? "text-destructive border-destructive/30 bg-destructive-soft"
                            : "text-amber-600 border-amber-500/30 bg-amber-500/5"
                        }`}>
                          {act.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground font-mono leading-relaxed">{act.description}</p>
                      <span className="text-[9px] text-muted-foreground block mt-1">
                        {new Date(act.updated_at || act.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Agent Tabs Hub */}
      <Tabs defaultValue="finance" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="finance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/85 rounded-md py-2">
            <Wallet className="mr-2 h-4 w-4" /> Finance
          </TabsTrigger>
          <TabsTrigger value="hiring" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/85 rounded-md py-2">
            <Users className="mr-2 h-4 w-4" /> Hiring
          </TabsTrigger>
          <TabsTrigger value="legal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/85 rounded-md py-2">
            <FileText className="mr-2 h-4 w-4" /> Legal
          </TabsTrigger>
          <TabsTrigger value="gtm" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/85 rounded-md py-2">
            <Megaphone className="mr-2 h-4 w-4" /> GTM
          </TabsTrigger>
          <TabsTrigger value="fundraising" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/85 rounded-md py-2">
            <Briefcase className="mr-2 h-4 w-4" /> Fundraising
          </TabsTrigger>
        </TabsList>

        {/* Tabs Contents */}
        <TabsContent value="finance">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Interactive Runway Sandbox</CardTitle>
                <CardDescription>Simulate monthly runway thresholds by toggling projected monthly burn rates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Simulated Runway</p>
                    <p className="text-3xl font-bold text-primary mt-1">{simulatedRunway} Months</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase text-right">Cash Balance</p>
                    <p className="text-lg font-semibold text-foreground text-right">${metrics.cash_balance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Simulated Monthly Burn:</span>
                    <span>${customBurn.toLocaleString()}/mo</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="30000"
                    step="500"
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    value={customBurn}
                    onChange={(e) => setCustomBurn(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>$5k/mo</span>
                    <span>$30k/mo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Financial Ledger Outlines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-xs p-2 border-b border-border">
                  <div>
                    <p className="font-semibold text-foreground">AWS Hosting Invoice</p>
                    <p className="text-muted-foreground">Due in 12 days</p>
                  </div>
                  <span className="font-bold text-foreground">$3,500.00</span>
                </div>
                <div className="flex justify-between items-center text-xs p-2 border-b border-border">
                  <div>
                    <p className="font-semibold text-foreground">Brex Office Account Payment</p>
                    <p className="text-muted-foreground">Settled</p>
                  </div>
                  <span className="font-bold text-foreground">$1,250.00</span>
                </div>
                <div className="flex justify-between items-center text-xs p-2">
                  <div>
                    <p className="font-semibold text-foreground">GSuite Workspace seats</p>
                    <p className="text-muted-foreground">Settled</p>
                  </div>
                  <span className="font-bold text-foreground">$240.00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hiring">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Mock ATS Pipeline board</CardTitle>
              <CardDescription>Collaborative Hiring Agent manages applicants and queues offers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                  <p className="font-semibold text-xs text-muted-foreground uppercase flex items-center justify-between">
                    Applied <Badge variant="secondary">2</Badge>
                  </p>
                  <div className="bg-card p-2 rounded border border-border text-xs space-y-0.5">
                    <p className="font-medium text-foreground">Alice Smith</p>
                    <p className="text-muted-foreground text-[10px]">Backend Python dev</p>
                  </div>
                  <div className="bg-card p-2 rounded border border-border text-xs space-y-0.5">
                    <p className="font-medium text-foreground">Bob Jones</p>
                    <p className="text-muted-foreground text-[10px]">GTM Representative</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                  <p className="font-semibold text-xs text-muted-foreground uppercase flex items-center justify-between">
                    Screening <Badge variant="secondary">1</Badge>
                  </p>
                  <div className="bg-card p-2 rounded border border-border text-xs space-y-0.5">
                    <p className="font-medium text-foreground">Cody Miller</p>
                    <p className="text-muted-foreground text-[10px]">Systems Architect</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                  <p className="font-semibold text-xs text-muted-foreground uppercase flex items-center justify-between">
                    Interviewing <Badge variant="secondary">1</Badge>
                  </p>
                  <div className="bg-card p-2 rounded border border-border text-xs space-y-0.5">
                    <p className="font-medium text-foreground">Charlie Davis</p>
                    <p className="text-muted-foreground text-[10px]">Lead Designer</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                  <p className="font-semibold text-xs text-muted-foreground uppercase flex items-center justify-between">
                    Offer Sent <Badge variant="secondary">1</Badge>
                  </p>
                  <div className="bg-amber-500/10 p-2 rounded border border-amber-500/20 text-xs space-y-0.5">
                    <p className="font-medium text-amber-800">Jane Miller</p>
                    <p className="text-amber-700 text-[10px]">Frontend React lead</p>
                    <Badge variant="outline" className="text-[8px] mt-1 bg-amber-500/20 text-amber-800 border-amber-500/30">Awaiting Signature</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Active Corporate Templates</CardTitle>
                <CardDescription>Delaware C-Corp optimized legal documents ready to sign.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/20 cursor-pointer text-xs">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                    <span>Mutual Non-Disclosure Agreement (NDA)</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/20 cursor-pointer text-xs">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                    <span>Fast-track IP Assignment Provision</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/20 cursor-pointer text-xs">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                    <span>Standard Advisory Agreement Token</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Startup Compliance Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Delaware Franchise Tax Filed</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>83(b) Election forms submitted by founders</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>IP assignment agreements signed by all devs</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gtm">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">GTM Sales & Campaigns</CardTitle>
              <CardDescription>Collaborate with the GTM Agent to construct marketing pipeline copies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-muted/10">
                  <CardHeader className="p-3">
                    <CardTitle className="text-xs text-muted-foreground">Twitter Reach</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xl font-bold">14,250</div>
                    <span className="text-[10px] text-success font-semibold flex items-center mt-1">
                      +12% MoM growth
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-muted/10">
                  <CardHeader className="p-3">
                    <CardTitle className="text-xs text-muted-foreground">Active Newsletters</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xl font-bold">3 active</div>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      Avg open rate: 42.5%
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-muted/10">
                  <CardHeader className="p-3">
                    <CardTitle className="text-xs text-muted-foreground">Conversion Ratio</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xl font-bold">3.2%</div>
                    <span className="text-[10px] text-success font-semibold flex items-center mt-1">
                      +0.4% from last cycle
                    </span>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fundraising">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Seed Investor CRM Pipeline</CardTitle>
                <CardDescription>Targeting VC partners for the upcoming seed round.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-xs p-2 border-b border-border">
                  <div>
                    <p className="font-semibold text-foreground">VenturePartners VC</p>
                    <p className="text-muted-foreground">Stage: NDA Signed / Due diligence</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Lead Partner</Badge>
                </div>
                <div className="flex justify-between items-center text-xs p-2 border-b border-border">
                  <div>
                    <p className="font-semibold text-foreground">SeedCapital VC</p>
                    <p className="text-muted-foreground">Stage: Initial Intro meeting</p>
                  </div>
                  <Badge variant="outline">Pipeline</Badge>
                </div>
                <div className="flex justify-between items-center text-xs p-2">
                  <div>
                    <p className="font-semibold text-foreground">AlphaAngels syndicate</p>
                    <p className="text-muted-foreground">Stage: Pitch Deck Shared</p>
                  </div>
                  <Badge variant="outline">Pipeline</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Pitch Deck Slide Outliner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-xs bg-muted/40 p-4 rounded-lg">
                <p className="text-foreground font-semibold">// Target Outline:</p>
                <p className="text-muted-foreground">1. Problem: Early founders drown in ops work.</p>
                <p className="text-muted-foreground">2. Solution: APEX AI CEO orchestrator dashboard.</p>
                <p className="text-muted-foreground">3. Market Opportunity: $19B TAM.</p>
                <p className="text-muted-foreground">4. Financial projections: 15 months runway.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
