import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Github,
  Slack,
  Cloud,
  Boxes,
  ShieldCheck,
  Zap,
  Users,
  BarChart3,
  Brain,
  Check,
  Twitter,
  Lock,
  Layers,
  Workflow,
  MessagesSquare,
  Rocket,
  Globe,
  KeyRound,
  Database,
  Code2,
  Gauge,
  Bot,
  Building2,
  LineChart,
  UserCog,
  Wrench,
  Wallet,
  Eye,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { ApexLogo } from "@/components/app/apex-logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "APEX — One AI Operating System For Modern Companies" },
      {
        name: "description",
        content:
          "APEX is a multi-tenant AI OS: organizations, projects, RBAC, integrations, and an isolated per-project AI chat — all in one secure platform.",
      },
      { property: "og:title", content: "APEX — One AI Operating System" },
      {
        property: "og:description",
        content:
          "Replace GitHub, Slack, Notion and 20+ tools with one AI-native platform. Multi-tenant, RBAC, audit logs, per-project AI chat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const stats = [
  { label: "Integrations", value: "20+" },
  { label: "Default roles", value: "11" },
  { label: "Permission keys", value: "25" },
  { label: "Time to onboard", value: "< 60s" },
];

const features = [
  {
    icon: Brain,
    title: "Organizational memory",
    body: "Every doc, decision, and conversation indexed and searchable — a shared brain for your company.",
  },
  {
    icon: Boxes,
    title: "One workspace, every tool",
    body: "Connect GitHub, Slack, Notion, Vercel, and 20+ services. Stop tab-switching, start shipping.",
  },
  {
    icon: Bot,
    title: "Per-project AI chat",
    body: "Isolated chatbot per project with pinned threads, uploads, and full-text history search.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade security",
    body: "Row-level security, RBAC, audit logs, encrypted tokens, and SSO on every plan.",
  },
  {
    icon: Users,
    title: "Multi-tenant by design",
    body: "Organizations, workspaces, and projects — with per-role permissions baked in.",
  },
  {
    icon: BarChart3,
    title: "Real analytics",
    body: "Usage, deployment, and knowledge activity across every project in one dashboard.",
  },
];

const integrations = [
  "GitHub", "GitLab", "Bitbucket", "Vercel", "AWS", "Cloudflare",
  "Notion", "Slack", "Discord", "Gmail", "Google Drive", "Jira",
  "Linear", "Trello", "OpenAI", "Claude", "Gemini", "Stripe",
];

const steps = [
  {
    icon: Building2,
    title: "Create your organization",
    body: "A 3-step wizard sets up your company, first workspace, and initial project atomically.",
  },
  {
    icon: UserCog,
    title: "Invite your team by role",
    body: "Owner, Admin, PM, Developer, Tester, Finance, Viewer — or build your own custom roles.",
  },
  {
    icon: Rocket,
    title: "Ship with AI in every project",
    body: "Isolated project chat, connected tools, and dashboards tuned for each role.",
  },
];

const roles = [
  { icon: Building2, name: "Owner", body: "Company-wide KPIs, billing, ownership transfer." },
  { icon: LineChart, name: "PM", body: "Project health, throughput, blockers, at-a-glance." },
  { icon: Code2, name: "Developer", body: "Assigned projects, PRs, deployments, AI chat." },
  { icon: Wrench, name: "Tester / QA", body: "Test runs, bugs, releases across environments." },
  { icon: Wallet, name: "Finance", body: "Seat usage, invoices, budgets across projects." },
  { icon: Eye, name: "Viewer", body: "Read-only insight scoped to invited projects only." },
];

const security = [
  { icon: Lock, title: "Row-level security", body: "Every table is scoped by org and project — enforced in the database." },
  { icon: KeyRound, title: "OAuth token vault", body: "Provider tokens are encrypted at rest and never leave the server." },
  { icon: ShieldCheck, title: "Audit log", body: "Every privileged action is written to an immutable audit stream." },
  { icon: Database, title: "Isolated project data", body: "Project members only see the projects they're invited to." },
];

const plans = [
  {
    name: "Starter",
    price: "$0",
    tag: "For individuals exploring APEX",
    features: ["Up to 3 projects", "5 integrations", "1 workspace", "Community support"],
    cta: "Get started",
    featured: false,
  },
  {
    name: "Team",
    price: "$29",
    tag: "For growing teams shipping fast",
    features: [
      "Unlimited projects",
      "All integrations",
      "Unlimited workspaces",
      "RBAC & audit logs",
      "Priority support",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    tag: "For large orgs with custom needs",
    features: ["SSO / SAML", "Custom SLAs", "Dedicated support", "On-prem option"],
    cta: "Contact sales",
    featured: false,
  },
];

const testimonials = [
  {
    quote:
      "APEX replaced 6 tools on day one. Our engineers stopped hunting for context and started shipping.",
    name: "Alex Rivera",
    role: "CTO, Northwind Labs",
  },
  {
    quote:
      "Per-project AI chat is the missing link. Every project has its own memory — no more prompt-copying between tools.",
    name: "Priya Shah",
    role: "Head of Product, Fabric.io",
  },
  {
    quote:
      "The RBAC and audit logs made our SOC-2 evidence collection almost automatic.",
    name: "Marcus Vale",
    role: "Security Lead, Halcyon",
  },
];

const faqs = [
  {
    q: "What is APEX?",
    a: "APEX is an AI Operating System that centralizes your company's tools, knowledge, and workflows into a single platform. Think of it as one login for every product your team uses.",
  },
  {
    q: "How does per-project AI work?",
    a: "Every project has its own isolated conversation history, uploads, and system context. Only project members can access that project's chat.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Every organization is isolated with row-level security, all tokens are encrypted at rest, and every privileged action is written to an audit log.",
  },
  {
    q: "Which integrations are supported?",
    a: "The APEX foundation includes 20+ integration slots covering GitHub, Slack, Notion, Vercel, AWS, Cloudflare, OpenAI, and more. New providers can be added without changing app code.",
  },
  {
    q: "Do you support self-hosting?",
    a: "Enterprise customers can deploy APEX to their own infrastructure. Contact us for a deployment guide.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.5 },
};

export default function Landing() {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <ApexLogo />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition hover:text-foreground">Features</a>
            <a href="#how" className="text-sm text-muted-foreground transition hover:text-foreground">How it works</a>
            <a href="#integrations" className="text-sm text-muted-foreground transition hover:text-foreground">Integrations</a>
            <a href="#pricing" className="text-sm text-muted-foreground transition hover:text-foreground">Pricing</a>
            <a href="#faq" className="text-sm text-muted-foreground transition hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {loading ? null : user ? (
              <Button asChild size="sm" className="gradient-primary text-primary-foreground shadow-elegant">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="gradient-primary text-primary-foreground shadow-elegant">
                  <Link to="/auth" search={{ mode: "register" } as never}>
                    Get started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative gradient-hero overflow-hidden">
        {/* Decorative floating orbs */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-48 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-6 gap-1.5 border border-border bg-card px-3 py-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Phase 1 — Foundation now live
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              One <span className="text-gradient">AI Operating System</span>
              <br /> for modern companies
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Replace GitHub, Slack, Notion, Vercel, and 20+ other tabs with a single, secure
              platform. APEX stores your org's knowledge, connects every tool, and runs an
              isolated AI assistant inside every project.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elegant hover-scale">
                <Link to="/auth" search={{ mode: "register" } as never}>
                  Start free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">See how it works</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required · SOC-2 ready architecture · Setup in under a minute
            </p>
          </motion.div>

          {/* Preview card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-16 max-w-5xl"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="ml-3 text-xs text-muted-foreground">apex.dev/dashboard</span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
                {["Projects", "Members", "Integrations", "Activity"].map((label, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                    className="bg-card p-6"
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-semibold">{[12, 34, 18, 512][i]}</p>
                    <p className="mt-1 text-xs text-success">↑ {[12, 4, 2, 87][i]}%</p>
                  </motion.div>
                ))}
              </div>
              <div className="grid gap-px bg-border md:grid-cols-3">
                <div className="col-span-2 bg-card p-6">
                  <p className="text-sm font-medium">Recent activity</p>
                  <div className="mt-4 space-y-3">
                    {[
                      "Deployed apex-web to production",
                      "Connected GitHub integration",
                      "Invited 3 members to Design workspace",
                      "AI chat: refactored onboarding flow",
                    ].map((row, i) => (
                      <motion.div
                        key={row}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-foreground">{row}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="bg-card p-6">
                  <p className="text-sm font-medium">Connected</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["GitHub", "Slack", "Notion", "Vercel", "OpenAI", "Stripe"].map((name) => (
                      <Badge key={name} variant="secondary" className="rounded-md">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            {...fadeUp}
            className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-6 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur sm:grid-cols-4"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold tracking-tight text-gradient">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Marquee logo cloud */}
      <section className="border-y border-border bg-muted/30 py-10">
        <p className="mb-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
          Connects to the tools your team already uses
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10 px-6">
            {[...integrations, ...integrations].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="flex h-10 shrink-0 items-center justify-center rounded-md border border-border bg-card px-6 text-sm font-medium text-muted-foreground"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes marquee { to { transform: translateX(-50%); } }`}</style>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Platform</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything your company runs on, in one place
            </h2>
            <p className="mt-4 text-muted-foreground">
              APEX is built as a modular OS. Each capability is independent, secure by
              default, and ready to plug into the AI agents shipping in Phase 2.
            </p>
          </motion.div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="group rounded-xl border border-border bg-card p-6 transition hover:shadow-elegant"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-sm font-medium text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              From sign-up to shipping in three steps
            </h2>
          </motion.div>
          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-2xl border border-border bg-card p-8"
              >
                <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground shadow-elegant">
                  {i + 1}
                </div>
                <s.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI chat spotlight */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div {...fadeUp}>
              <p className="text-sm font-medium text-primary">AI, per project</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                An isolated AI assistant inside every project
              </h2>
              <p className="mt-4 text-muted-foreground">
                Ship faster with a project-scoped chatbot that remembers your work, respects
                membership boundaries, and never leaks context between teams.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Pinned threads, uploads, and full-text history search",
                  "Only project members can see or query that project's chat",
                  "Streaming responses powered by the Lovable AI Gateway",
                  "Fine-grained permission checks on every message",
                ].map((line) => (
                  <li key={line} className="flex gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <MessagesSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">apex-web · #onboarding</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">Project scoped</Badge>
              </div>
              <div className="space-y-4 p-5">
                <ChatBubble
                  who="You"
                  text="Summarize this week's decisions in the onboarding project."
                  right
                />
                <ChatBubble
                  who="APEX"
                  text="3 decisions locked: (1) split invite email into wizard, (2) role matrix stays flat, (3) auto-provision workspace on org create. Owners: Alex, Priya."
                />
                <ChatBubble
                  who="You"
                  text="Draft a release note for the PM to review."
                  right
                />
                <div className="flex items-center gap-1 pl-1">
                  <motion.span
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <motion.span
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.span
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Role-based dashboards */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Role-aware</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              A dashboard tuned for every role
            </h2>
            <p className="mt-4 text-muted-foreground">
              Sidebar, KPIs, and quick actions adapt to who's signed in — Owner, PM,
              Developer, Tester, Finance, or Viewer.
            </p>
          </motion.div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <r.icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="font-semibold">{r.name}</p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{r.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Security</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Secure by construction, not by convention
            </h2>
          </motion.div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {security.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <s.icon className="h-6 w-6 text-primary" />
                <p className="mt-4 font-semibold">{s.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div {...fadeUp}>
              <p className="text-sm font-medium text-primary">Architecture</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Built like an operating system, not an app
              </h2>
              <p className="mt-4 text-muted-foreground">
                Domain-driven modules, feature-based architecture, and clean boundaries mean
                four engineers can work in parallel without stepping on each other.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: Layers, text: "Multi-tenant Postgres with row-level security" },
                  { icon: Workflow, text: "Type-safe server functions & typed API layer" },
                  { icon: Globe, text: "Pluggable integration & agent runtime interfaces" },
                  { icon: Gauge, text: "Server / client separation with strict boundaries" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex gap-3 text-sm">
                    <Icon className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-elegant"
            >
              <pre className="overflow-x-auto text-xs leading-relaxed text-muted-foreground">
{`apex/
├─ web/                # TanStack Start · React 19 · Tailwind v4
│  ├─ routes/          # File-based, SSR + client
│  ├─ components/      # UI library + app shell
│  └─ lib/             # Auth, theme, RBAC context
├─ server/             # createServerFn RPCs · Zod validation
│  ├─ organizations/
│  ├─ projects/
│  ├─ integrations/
│  ├─ chat/            # per-project AI (streaming)
│  └─ knowledge/       # ← plug RAG in Phase 2
├─ db/                 # Postgres · RLS · RBAC · migrations
│  ├─ profiles
│  ├─ organizations · workspaces · projects
│  ├─ user_roles · role_permissions
│  ├─ project_members · invitations
│  └─ integrations · notifications · audit_logs
└─ integrations/       # OAuth provider adapters (plug-in)`}
              </pre>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-sm font-medium text-primary">Pricing</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Start free. Upgrade when your team grows.
            </p>
          </motion.div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`relative rounded-2xl border p-8 transition ${
                  plan.featured
                    ? "border-primary bg-card shadow-elegant scale-[1.02]"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {plan.featured && (
                  <Badge className="absolute -top-3 left-8 gradient-primary text-primary-foreground">
                    Most popular
                  </Badge>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tag}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-sm text-muted-foreground">/ user / mo</span>
                  )}
                </div>
                <Button
                  asChild
                  className={`mt-6 w-full ${
                    plan.featured ? "gradient-primary text-primary-foreground" : ""
                  }`}
                  variant={plan.featured ? "default" : "outline"}
                >
                  <Link to="/auth">{plan.cta}</Link>
                </Button>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-sm font-medium text-primary">Teams love APEX</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              What early customers say
            </h2>
          </motion.div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.blockquote
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full gradient-primary" />
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-sm font-medium text-primary">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Questions, answered
            </h2>
          </motion.div>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border py-24">
        <div className="absolute inset-0 gradient-hero" aria-hidden />
        <motion.div {...fadeUp} className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Ready to run your company on one platform?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Get your organization set up in under a minute. No credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {loading ? null : user ? (
              <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elegant hover-scale">
                <Link to="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elegant hover-scale">
                  <Link to="/auth" search={{ mode: "register" } as never}>
                    Create your organization <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <ApexLogo />
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                One AI Operating System for modern companies.
              </p>
              <div className="mt-4 flex gap-3 text-muted-foreground">
                <Github className="h-5 w-5" />
                <Twitter className="h-5 w-5" />
                <Slack className="h-5 w-5" />
                <Cloud className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#features">Features</a></li>
                <li><a href="#how">How it works</a></li>
                <li><a href="#integrations">Integrations</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Company</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#faq">FAQ</a></li>
                <li><Link to="/support">Support</Link></li>
                {loading ? null : user ? (
                  <li><Link to="/dashboard">Dashboard</Link></li>
                ) : (
                  <li><Link to="/auth">Sign in</Link></li>
                )}
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} APEX. All rights reserved.</p>
            <p>Built with security-first architecture.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ChatBubble({ who, text, right }: { who: string; text: string; right?: boolean }) {
  return (
    <div className={`flex ${right ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          right
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-muted"
        }`}
      >
        <p className={`mb-0.5 text-[10px] uppercase tracking-wide ${right ? "opacity-70" : "text-muted-foreground"}`}>
          {who}
        </p>
        {text}
      </div>
    </div>
  );
}
