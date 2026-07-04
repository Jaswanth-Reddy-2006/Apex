import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CreditCard,
  Wallet,
  ShieldCheck,
  Zap,
  PlayCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  Lock,
  Unlock,
  AlertTriangle,
  Plus,
  RefreshCw,
  Eye,
  ShieldAlert,
  Fingerprint,
} from "lucide-react";
import {
  getPaymentConsole,
  createAgentWallet,
  toggleWalletFreeze,
  simulateAgentTransaction,
  approveEscalatedTransaction,
  seedPaymentsDemo,
  listProjects,
} from "@/lib/api.functions";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agent-payments")({
  component: AgentPaymentsPage,
});

function AgentPaymentsPage() {
  const queryClient = useQueryClient();
  const getConsole = useServerFn(getPaymentConsole);
  const createWallet = useServerFn(createAgentWallet);
  const toggleFreeze = useServerFn(toggleWalletFreeze);
  const simulateTx = useServerFn(simulateAgentTransaction);
  const approveTx = useServerFn(approveEscalatedTransaction);
  const seedDemo = useServerFn(seedPaymentsDemo);
  const projectsFn = useServerFn(listProjects);

  const [createOpen, setCreateOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newDailyLimit, setNewDailyLimit] = useState("100");
  const [newProjectId, setNewProjectId] = useState("");

  const [simWalletId, setSimWalletId] = useState("");
  const [simRecipient, setSimRecipient] = useState("");
  const [simAmount, setSimAmount] = useState("");
  const [simPurpose, setSimPurpose] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    status: string;
    traces: string[];
    transaction: any;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["payments-console"],
    queryFn: () => getConsole({ organization_id: "global" }),
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsFn(),
  });

  const seedMutation = useMutation({
    mutationFn: () => seedDemo({ organization_id: "global" }),
    onSuccess: () => {
      toast.success("Payments Sandbox environment reset!");
      queryClient.invalidateQueries({ queryKey: ["payments-console"] });
      setSimResult(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to seed demo data");
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createWallet({
        organization_id: "global",
        agent_name: newAgentName,
        daily_limit: parseFloat(newDailyLimit),
        project_id: newProjectId || undefined,
      }),
    onSuccess: () => {
      toast.success("Agent payment identity provisioned!");
      queryClient.invalidateQueries({ queryKey: ["payments-console"] });
      setCreateOpen(false);
      setNewAgentName("");
      setNewDailyLimit("100");
      setNewProjectId("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create agent wallet");
    },
  });

  const freezeMutation = useMutation({
    mutationFn: ({ walletId, status }: { walletId: string; status: "active" | "frozen" }) =>
      toggleFreeze({ organization_id: "global", wallet_id: walletId, status }),
    onSuccess: (_, variables) => {
      toast.success(`Wallet successfully ${variables.status === "frozen" ? "frozen" : "activated"}!`);
      queryClient.invalidateQueries({ queryKey: ["payments-console"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle freeze");
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ transactionId, status }: { transactionId: string; status: "approved" | "rejected" }) =>
      approveTx({ organization_id: "global", transaction_id: transactionId, status }),
    onSuccess: (_, variables) => {
      toast.success(`Transaction successfully ${variables.status}!`);
      queryClient.invalidateQueries({ queryKey: ["payments-console"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to process transaction");
    },
  });

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simWalletId || !simRecipient || !simAmount || !simPurpose) {
      toast.error("Please fill in all transaction simulation fields.");
      return;
    }

    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await simulateTx({
        organization_id: "global",
        wallet_id: simWalletId,
        recipient_agent: simRecipient,
        amount: parseFloat(simAmount),
        purpose: simPurpose,
      });
      setSimResult(res);
      if (res.status === "settled") {
        toast.success("Transaction settled autonomously!");
      } else if (res.status === "pending_approval") {
        toast.warning("Transaction escalated to founder approval.");
      } else {
        toast.error("Transaction blocked by policy rules.");
      }
      queryClient.invalidateQueries({ queryKey: ["payments-console"] });
    } catch (err: any) {
      toast.error(err.message || "Simulation failed");
    } finally {
      setIsSimulating(false);
    }
  };

  const wallets = data?.wallets || [];
  const transactions = data?.transactions || [];

  // Compute spend summaries
  const totalSettled = useMemo(() => {
    return transactions
      .filter((t) => t.status === "settled")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const blockedCount = useMemo(() => {
    return transactions.filter((t) => t.status === "blocked").length;
  }, [transactions]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agent-to-Agent Payment Console"
        description="Provision cryptographically secure wallets, verify spending policies, and trace autonomous machine transactions."
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
                <RefreshCw className="mr-2 h-4 w-4 text-primary" />
              )}
              Reset Demo Env
            </Button>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white">
                  <Plus className="mr-1.5 h-4 w-4" /> Provision Wallet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Provision Agent Payment Identity</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createMutation.mutate();
                  }}
                  className="space-y-4 py-2"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="agent-name">Agent Name / Identifier</Label>
                    <Input
                      id="agent-name"
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      placeholder="e.g. Code_Llama_Builder"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="daily-limit">Daily Spending Limit (USD)</Label>
                    <Input
                      id="daily-limit"
                      type="number"
                      value={newDailyLimit}
                      onChange={(e) => setNewDailyLimit(e.target.value)}
                      placeholder="100.00"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="project-select">Bind to APEX Project (Optional)</Label>
                    <select
                      id="project-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                      value={newProjectId}
                      onChange={(e: any) => setNewProjectId(e.target.value)}
                    >
                      <option value="">None / Global Daemon</option>
                      {(projects ?? []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Generating..." : "Provision Wallet Address"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* 1. Core Platform Spending Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Wallets</CardTitle>
            <div className="rounded-md bg-primary-soft p-2 text-primary">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets.length} Machine ID keys</div>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Keys managed in HSM Vault
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Autonomous Settle</CardTitle>
            <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSettled.toLocaleString()}</div>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Settled since boot
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Detections</CardTitle>
            <div className="rounded-md bg-destructive/10 p-2 text-destructive">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedCount} Anomalies</div>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Automatically blocked
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safety Status</CardTitle>
            <div className="rounded-md bg-success-soft p-2 text-success">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold flex items-center gap-1.5 text-success">
              Locked & Guarded
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Deterministic limit checking enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Wallet directory */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Registered Agent Wallets</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wallets.length === 0 ? (
            <Card className="col-span-full border-dashed bg-muted/20 text-center py-8 text-sm text-muted-foreground">
              No wallets found. Provision a wallet or click "Reset Demo Env" to get started.
            </Card>
          ) : (
            wallets.map((wallet) => (
              <Card key={wallet.id} className="shadow-soft border-border flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={wallet.status === "frozen" ? "destructive" : "secondary"} className="capitalize">
                      {wallet.status === "frozen" ? "Frozen" : "Active"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold mt-2 flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-primary" />
                    {wallet.agent_name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Project: <span className="font-semibold text-foreground">
                      {wallet.project_id ? (projects ?? []).find((p) => p.id === wallet.project_id)?.name || "Linked Project" : "Global"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 space-y-4">
                  {/* Daily limit tracker */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Daily Limit Spent:</span>
                      <span className="font-semibold text-foreground">${wallet.spent_today} / ${wallet.daily_limit}</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, (wallet.spent_today / wallet.daily_limit) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Reputation score */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Reputation Score:</span>
                    <Badge variant="outline" className={`font-mono ${
                      wallet.reputation_score > 90
                        ? "text-success border-success/30"
                        : wallet.reputation_score > 70
                        ? "text-amber-500 border-amber-500/30"
                        : "text-destructive border-destructive/30"
                    }`}>
                      {wallet.reputation_score}%
                    </Badge>
                  </div>
                </CardContent>
                <div className="p-4 pt-0 border-t border-border mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant={wallet.status === "active" ? "destructive" : "outline"}
                    className="w-full"
                    onClick={() =>
                      freezeMutation.mutate({
                        walletId: wallet.id,
                        status: wallet.status === "active" ? "frozen" : "active",
                      })
                    }
                    disabled={freezeMutation.isPending}
                  >
                    {wallet.status === "active" ? (
                      <><Lock className="mr-1.5 h-3.5 w-3.5" /> Freeze Wallet</>
                    ) : (
                      <><Unlock className="mr-1.5 h-3.5 w-3.5" /> Unfreeze Wallet</>
                    )}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 3. Simulator Sandbox & Visual Audit Trace */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Agent Payment Simulator (Sandbox)
          </h2>
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base">Initiate Machine Transaction</CardTitle>
              <CardDescription>
                Simulate an autonomous agent payment request to verify limit checking, risk assessment, and identity authentication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSimulate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="sim-wallet">Source Wallet (Agent)</Label>
                    <select
                      id="sim-wallet"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                      value={simWalletId}
                      onChange={(e) => setSimWalletId(e.target.value)}
                      required
                    >
                      <option value="">Select source agent...</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id} disabled={w.status === "frozen"}>
                          {w.agent_name} {w.status === "frozen" ? "(Frozen)" : `(Limit $${w.daily_limit})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="sim-recipient">Recipient Merchant Agent</Label>
                    <Input
                      id="sim-recipient"
                      className="mt-1.5"
                      value={simRecipient}
                      onChange={(e) => setSimRecipient(e.target.value)}
                      placeholder="e.g. OpenAI Embeddings v3"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <Label htmlFor="sim-amount">Amount (USD)</Label>
                    <Input
                      id="sim-amount"
                      type="number"
                      className="mt-1.5"
                      value={simAmount}
                      onChange={(e) => setSimAmount(e.target.value)}
                      placeholder="25.00"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="sim-purpose">Spend Purpose</Label>
                    <Input
                      id="sim-purpose"
                      className="mt-1.5"
                      value={simPurpose}
                      onChange={(e) => setSimPurpose(e.target.value)}
                      placeholder="Generate embedding nodes for Notion update sync"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSimulating} className="gradient-primary text-white">
                    {isSimulating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Settling...</>
                    ) : (
                      <><Zap className="mr-2 h-4 w-4" /> Execute Transaction</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {simResult && (
            <Card className="border-border/80 bg-muted/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Decisional Authorization Pipeline</CardTitle>
                  <Badge className={`uppercase ${
                    simResult.status === "settled"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : simResult.status === "pending_approval"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}>
                    {simResult.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded bg-black p-3 font-mono text-xs text-green-400 space-y-1">
                  <p className="font-semibold text-white uppercase text-[10px] tracking-wider mb-2 text-green-300">// Audit Trail Logs</p>
                  {simResult.traces.map((trace, idx) => (
                    <p key={idx}>{trace}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Human Escalation Gates */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Escalations Pending Review</h2>
          <Card className="border-border/80 max-h-[400px] overflow-y-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Human Approval Gate</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.filter((t) => t.status === "pending_approval").length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">No transactions currently escalated for review.</p>
              ) : (
                <div className="space-y-3">
                  {transactions
                    .filter((t) => t.status === "pending_approval")
                    .map((tx) => {
                      const wallet = wallets.find((w) => w.id === tx.wallet_id);
                      return (
                        <div key={tx.id} className="text-xs border border-amber-500/30 bg-amber-500/5 p-3 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-amber-800 capitalize">
                              {wallet?.agent_name || "Agent"}
                            </span>
                            <span className="font-bold">${tx.amount}</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            Requested for: <span className="text-foreground italic">"{tx.purpose}"</span> to <span className="font-semibold">{tx.recipient_agent}</span>
                          </p>
                          <div className="flex gap-2 pt-1 border-t border-amber-500/10">
                            <Button
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1 h-7"
                              onClick={() => approveMutation.mutate({ transactionId: tx.id, status: "approved" })}
                              disabled={approveMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/20 py-1 h-7"
                              onClick={() => approveMutation.mutate({ transactionId: tx.id, status: "rejected" })}
                              disabled={approveMutation.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Complete Tamper-Evident Transaction Ledger */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Transaction Audit Ledger</h2>
        <Card className="border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs text-foreground uppercase bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tx Hash</th>
                  <th className="px-4 py-3 font-semibold">Source Agent</th>
                  <th className="px-4 py-3 font-semibold">Recipient Merchant</th>
                  <th className="px-4 py-3 font-semibold">Purpose</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-center">Risk Score</th>
                  <th className="px-4 py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No transaction settlement records found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const sourceWallet = wallets.find((w) => w.id === tx.wallet_id);
                    // Mock transaction hash
                    const txHash = `0x${tx.id.replace(/-/g, "").slice(0, 10)}`;
                    return (
                      <tr key={tx.id} className="hover:bg-muted/10">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">{txHash}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-foreground">
                          {sourceWallet?.agent_name || "Unknown Agent"}
                        </td>
                        <td className="px-4 py-3 text-xs">{tx.recipient_agent}</td>
                        <td className="px-4 py-3 text-xs italic">"{tx.purpose}"</td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-foreground">${tx.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={`font-mono text-[10px] ${
                            tx.risk_score > 0.7
                              ? "text-destructive border-destructive/20 bg-destructive-soft"
                              : tx.risk_score > 0.4
                              ? "text-amber-500 border-amber-500/20 bg-amber-500/5"
                              : "text-success border-success/20 bg-success-soft"
                          }`}>
                            {(tx.risk_score * 100).toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge className={`capitalize text-[10px] ${
                            tx.status === "settled"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : tx.status === "pending_approval"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }`}>
                            {tx.status.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
