import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, ShieldAlert, Zap, Award, Sparkles, Building2, HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/lib/org-context";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
  component: BillingPage,
});

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  badge?: string;
  features: string[];
  unlockedIntegrations: string[];
  ctaText: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "developer",
    name: "Developer Starter",
    priceMonthly: 499,
    priceYearly: 399,
    description: "Ideal for solo developers building personal project memories.",
    features: [
      "1 Active Developer Workspace",
      "Up to 3 Integrations connected",
      "Standard RAG context sync",
      "Up to 250 AI Chat messages/mo",
      "Local sandboxed code execution",
      "Community SLA support"
    ],
    unlockedIntegrations: ["GitHub", "GitLab", "Notion"],
    ctaText: "Start Developer Trial",
  },
  {
    id: "team",
    name: "Professional Team",
    priceMonthly: 1299,
    priceYearly: 999,
    description: "For collaborative dev teams syncing workspace knowledge bases.",
    badge: "Most Popular",
    popular: true,
    features: [
      "Up to 10 Team Members included",
      "Unlimited Project Spaces",
      "Unlimited Integrations connected",
      "Shared Organization RAG Memory",
      "Real-time sync webhooks & triggers",
      "Shared AI Wallets & budget ceilings",
      "Standard email SLA support"
    ],
    unlockedIntegrations: ["GitHub", "GitLab", "Notion", "Google Drive"],
    ctaText: "Start Professional Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise Core",
    priceMonthly: 2499,
    priceYearly: 1999,
    description: "For security-minded corporations running custom private agents.",
    features: [
      "Unlimited Team Members & Workspaces",
      "Dedicated Private LLM endpoints",
      "Self-hosted Private Cloud deployment option",
      "Advanced Security Audit logs & SSO / SAML",
      "Customizable Agent wallets & transaction rules",
      "Dedicated account manager SLA",
      "Custom vector sharding & custom RAG pipelines"
    ],
    unlockedIntegrations: ["GitHub", "GitLab", "Notion", "Google Drive", "Custom APIs"],
    ctaText: "Start Enterprise Trial",
  },
];

const COMPARISON_FEATURES = [
  {
    category: "Workspace & Team",
    items: [
      { name: "Team Members", dev: "1 Member", team: "Up to 10 Members", ent: "Unlimited" },
      { name: "Project Spaces", dev: "3 Projects", team: "Unlimited", ent: "Unlimited" },
      { name: "File Size Upload Limit", dev: "5 MB", team: "50 MB", ent: "Custom" },
    ]
  },
  {
    category: "AI & RAG Engine",
    items: [
      { name: "AI Chat Messages", dev: "250 messages/mo", team: "Unlimited", ent: "Unlimited" },
      { name: "RAG Context Window", dev: "Standard", team: "Expanded", ent: "Custom Scale" },
      { name: "Background Data Sync", dev: "Manual", team: "Webhooks (Instant)", ent: "Custom triggers & API" },
      { name: "Private LLM Hosting", dev: "Shared Hub", devCheck: false, team: "Shared Hub", teamCheck: false, ent: "Dedicated Private Cloud", entCheck: true },
    ]
  },
  {
    category: "Autonomous Agents",
    items: [
      { name: "Autonomous Workspaces", dev: "1 Agent Workspace", team: "10 Agent Workspaces", ent: "Unlimited" },
      { name: "Agent Budget Controls", dev: "Standard limit", team: "Customizable limit", ent: "Transaction Escalations" },
      { name: "Wallet Allocations", dev: "No custom wallets", devCheck: false, team: "Up to 5 wallets", teamCheck: true, ent: "Unlimited custom wallets", entCheck: true },
    ]
  },
  {
    category: "Security & Support",
    items: [
      { name: "SAML / SSO login", dev: "No", devCheck: false, team: "No", teamCheck: false, ent: "Yes", entCheck: true },
      { name: "Detailed Audit Logs", dev: "No", devCheck: false, team: "Basic Logs", teamCheck: true, ent: "Advanced Audit Streams", entCheck: true },
      { name: "Dedicated Support SLA", dev: "Community", team: "Standard Email", ent: "24/7 Phone & Slack", entCheck: true },
    ]
  }
];

function BillingPage() {
  const { activeOrg, loading } = useOrg();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleStartTrial = (plan: Plan) => {
    toast.success(`Your 3-day free trial for ${plan.name} has been activated successfully!`, {
      description: "All features unlocked. Payments will start in Phase 2.",
      duration: 5000,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Page Header */}
      <PageHeader
        title="Billing & Subscriptions"
        description="Choose the right workspace capacity. Try any plan free for 3 days."
      />

      {/* Trial Activation Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary-soft/30 to-background p-6 md:p-8 shadow-soft">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <Badge className="bg-primary/20 text-primary border-none text-xs font-semibold px-2 py-0.5">Trial Campaign</Badge>
            </div>
            <h2 className="text-xl font-bold text-foreground">3-Day Free Trial Available on All Plans</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Gain full, unrestricted access to our unified RAG pipelines, workspace documents syncing, and autonomous agent sandboxes free of charge for 3 days. Cancel anytime.
            </p>
          </div>
          <Button variant="default" className="gradient-primary text-primary-foreground font-semibold px-6 shadow-md hover:scale-[1.02] transition" onClick={() => toast.info("Select a plan below to activate your 3-day free trial.")}>
            Explore Plans Below
          </Button>
        </div>
      </div>

      {/* Billing Cycle Selector Toggle */}
      <div className="flex flex-col items-center space-y-3">
        <div className="inline-flex items-center p-1 rounded-full border border-border bg-muted/40">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${billingCycle === "monthly" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${billingCycle === "yearly" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
          >
            Yearly Billing (Save 20%)
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => {
          const price = billingCycle === "monthly" ? p.priceMonthly : p.priceYearly;
          return (
            <Card
              key={p.id}
              className={`relative flex flex-col justify-between overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 ${
                p.popular ? "border-primary/50 ring-1 ring-primary/20 shadow-soft" : ""
              }`}
            >
              {p.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-bl-lg">
                  {p.badge}
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Plan</span>
                  <CardTitle className="text-lg font-bold">{p.name}</CardTitle>
                </div>
                <CardDescription className="mt-2 min-h-[40px] text-xs">
                  {p.description}
                </CardDescription>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold tracking-tight">₹{price}</span>
                  <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
                </div>
                {billingCycle === "yearly" && (
                  <span className="text-[10px] text-primary font-medium mt-1">Billed annually (₹{price * 12}/yr)</span>
                )}
              </CardHeader>

              <CardContent className="space-y-6 pt-0 flex-1 flex flex-col justify-between">
                {/* Integration Support tags */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Unlocked Syncing:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.unlockedIntegrations.map((integration) => (
                      <Badge key={integration} variant="secondary" className="text-[10px] bg-muted hover:bg-muted font-medium border-border border">
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Features list */}
                <div className="space-y-3">
                  <div className="h-px bg-border" />
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">What's included:</p>
                  <ul className="space-y-2.5">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs">
                        <Check className="mt-0.5 h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-muted-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4">
                  <Button
                    variant={p.popular ? "default" : "outline"}
                    className={`w-full text-xs font-semibold py-2.5 ${p.popular ? "gradient-primary text-primary-foreground hover:opacity-90" : "hover:bg-muted"}`}
                    onClick={() => handleStartTrial(p)}
                  >
                    {p.ctaText}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    No risk. Full access trial for 3 days. Cancel anytime.
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table Section */}
      <div className="space-y-4 pt-6">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-foreground">Detailed Plan Comparison</h3>
          <p className="text-xs text-muted-foreground">Compare precise capabilities across Starter, Team, and Enterprise plans.</p>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 font-semibold text-muted-foreground">Feature Details</th>
                  <th className="p-4 font-semibold text-muted-foreground w-1/4">Developer</th>
                  <th className="p-4 font-semibold text-muted-foreground w-1/4">Professional Team</th>
                  <th className="p-4 font-semibold text-muted-foreground w-1/4">Enterprise Core</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON_FEATURES.map((category) => (
                  <tr key={category.category} className="contents">
                    {/* Category Label Row */}
                    <tr className="bg-muted/10 font-bold border-b border-border">
                      <td colSpan={4} className="p-3 text-[11px] text-primary uppercase tracking-wider">{category.category}</td>
                    </tr>
                    {/* Items rows */}
                    {category.items.map((item) => (
                      <tr key={item.name} className="hover:bg-muted/10">
                        <td className="p-4 font-medium text-foreground">{item.name}</td>
                        <td className="p-4 text-muted-foreground">
                          {"devCheck" in item && !item.devCheck ? (
                            <X className="h-4 w-4 text-muted-foreground/30" />
                          ) : (
                            <span>{item.dev}</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {"teamCheck" in item && !item.teamCheck ? (
                            <X className="h-4 w-4 text-muted-foreground/30" />
                          ) : (
                            <span>{item.team}</span>
                          )}
                        </td>
                        <td className="p-4 font-medium text-foreground">
                          {"entCheck" in item && item.entCheck ? (
                            <div className="flex items-center gap-1.5 text-primary">
                              <Check className="h-4 w-4 text-primary shrink-0" />
                              <span>{item.ent}</span>
                            </div>
                          ) : (
                            <span>{item.ent}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
