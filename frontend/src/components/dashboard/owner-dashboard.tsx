import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip
} from "recharts";
import {
  Building2, FolderKanban, Users, Plug, TrendingUp, Activity, 
  ArrowRight, Search, Plus, Sparkles, CheckCircle2, ChevronRight,
  AlertCircle, Clock, Rocket
} from "lucide-react";
import { 
  getDashboardStats, listRecentActivity, listProjects 
} from "@/lib/api.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Mock data for sparklines
const generateSparklineData = (trend: "up" | "down" | "flat") => {
  let base = 10;
  return Array.from({ length: 7 }).map((_, i) => {
    if (trend === "up") base += Math.random() * 5;
    if (trend === "down") base -= Math.random() * 5;
    if (trend === "flat") base += (Math.random() - 0.5) * 4;
    return { value: Math.max(0, base) };
  });
};

const analyticsData = Array.from({ length: 12 }).map((_, i) => ({
  name: `Week ${i+1}`,
  revenue: Math.floor(Math.random() * 5000) + 10000,
  users: Math.floor(Math.random() * 100) + 200,
}));

function HeroSection() {
  const { user } = useAuth();
  const name = user?.email?.split('@')[0] || "User";
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-border/50">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Good Morning, {capitalized} <span className="animate-wave inline-block origin-bottom-right">👋</span>
        </h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Welcome back. Here's what's happening inside your company today.
        </p>
      </div>
      <div className="flex items-center gap-4 hidden md:flex">
        <div className="glass-panel p-3 rounded-2xl flex items-center gap-3 shadow-elegant hover:scale-105 transition-transform cursor-pointer">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium">AI Health</div>
            <div className="text-xs text-success flex items-center mt-0.5">
              <CheckCircle2 className="h-3 w-3 mr-1" /> All systems optimal
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PremiumStatCards() {
  const statsFn = useServerFn(getDashboardStats);
  const stats = useQuery({ queryKey: ["dashboard", "stats"], queryFn: () => statsFn() });
  
  const cards = [
    { label: "Organizations", value: stats.data?.organizations ?? 0, icon: Building2, trend: "up", color: "text-primary", bg: "bg-primary/10", stroke: "#6C4CF1" },
    { label: "Projects", value: stats.data?.projects ?? 0, icon: FolderKanban, trend: "flat", color: "text-blue-500", bg: "bg-blue-500/10", stroke: "#3b82f6" },
    { label: "Team members", value: stats.data?.members ?? 0, icon: Users, trend: "up", color: "text-purple-500", bg: "bg-purple-500/10", stroke: "#a855f7" },
    { label: "Integrations", value: stats.data?.integrations ?? 0, icon: Plug, trend: "up", color: "text-emerald-500", bg: "bg-emerald-500/10", stroke: "#10b981" },
  ];

  return (
    <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => (
        <Card key={c.label} className="enterprise-card glass-panel border-transparent bg-card/60 overflow-hidden relative group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            <div className={`rounded-xl ${c.bg} p-2 ${c.color} enterprise-icon`}>
              <c.icon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative pb-6">
            {stats.isLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="text-4xl font-semibold tracking-tight">
                {c.value.toLocaleString()}
              </div>
            )}
            <p className="mt-2 text-xs font-medium text-success flex items-center">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12% <span className="text-muted-foreground font-normal ml-1">vs last 30 days</span>
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateSparklineData(c.trend as any)}>
                <Line type="monotone" dataKey="value" stroke={c.stroke} strokeWidth={2} dot={false} isAnimationActive={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ))}
    </motion.div>
  );
}

function TimelineActivity() {
  const activityFn = useServerFn(listRecentActivity);
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => activityFn() });

  return (
    <Card className="glass-panel col-span-2 enterprise-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent activity</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 rounded-full">View all</Button>
      </CardHeader>
      <CardContent>
        {activity.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        ) : (activity.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 opacity-70">
            <Activity className="h-10 w-10 text-muted-foreground mb-4" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-border/60 space-y-6">
            {(activity.data ?? []).slice(0, 5).map((a, i) => (
              <motion.div 
                key={a.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative group hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
              >
                <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(var(--color-primary),0.5)]" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 -mt-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm">
                      <span className="font-semibold text-foreground mr-1">System</span>
                      <span className="text-muted-foreground">{a.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 uppercase tracking-wider">Automated Event</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap group-hover:text-primary transition-colors font-medium">
                    {new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PremiumProjects() {
  const projectsFn = useServerFn(listProjects);
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => projectsFn() });

  return (
    <Card className="glass-panel enterprise-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Projects</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 rounded-full">View all</Button>
      </CardHeader>
      <CardContent>
        {projects.isLoading ? (
           <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (projects.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FolderKanban className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">No projects yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">Create your first project to start managing tasks.</p>
            <Button className="mt-6 rounded-full shadow-elegant hover:-translate-y-1 transition-transform group">
              <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" /> New Project
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {(projects.data ?? []).slice(0, 4).map((p) => (
              <li key={p.id}>
                <Link to="/projects" className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-300 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center shadow-sm">
                      <FolderKanban className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{p.name}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{p.status}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CompanyBrain() {
  return (
    <Card className="glass-panel col-span-full enterprise-card bg-gradient-to-br from-card/80 to-primary/5">
      <CardContent className="p-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-2xl mb-2 hover:scale-110 hover:rotate-12 transition-all duration-300 cursor-pointer">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Company Brain</h2>
          <div className="relative group max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50 group-focus-within:text-primary transition-colors" />
            <Input 
              className="h-14 pl-12 pr-14 rounded-full bg-background/80 backdrop-blur-md border-primary/20 shadow-lg text-base focus-visible:ring-primary/50 focus-visible:border-primary transition-all"
              placeholder="Ask anything about your company..."
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button size="icon" className="rounded-full h-10 w-10 shadow-elegant group-hover:scale-105 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {["Show today's blockers", "Summarize Sprint 24", "Who is working on Dashboard?", "Latest commits"].map((suggestion) => (
              <Badge key={suggestion} variant="secondary" className="px-3 py-1.5 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors rounded-full font-normal shadow-sm">
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AIRecommendations() {
  return (
    <Card className="glass-panel col-span-full lg:col-span-1 enterprise-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary font-semibold">
          <Sparkles className="h-4 w-4" /> AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { title: "Engineering blocked on API", action: "Resolve", type: "text-destructive", bg: "bg-destructive/10", icon: AlertCircle },
          { title: "Finance approval pending", action: "Approve", type: "text-warning", bg: "bg-warning/10", icon: Clock },
          { title: "Ready to deploy v1.2", action: "Deploy", type: "text-success", bg: "bg-success/10", icon: Rocket },
        ].map((rec, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 hover:shadow-[0_4px_20px_-10px_rgba(var(--color-primary),0.3)] transition-all group gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${rec.bg} ${rec.type}`}>
                <rec.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{rec.title}</span>
            </div>
            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white rounded-full h-8">
              {rec.action}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AnalyticsOverview() {
  return (
    <Card className="glass-panel col-span-full lg:col-span-2 enterprise-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Analytics Overview</CardTitle>
        <div className="flex gap-2">
          <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">Revenue</Badge>
          <Badge variant="outline" className="rounded-full hover:bg-muted cursor-pointer">Users</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C4CF1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6C4CF1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-xs" tickLine={false} axisLine={false} />
              <YAxis stroke="currentColor" className="text-muted-foreground text-xs" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: '#6C4CF1', fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6C4CF1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" isAnimationActive={true} animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function OwnerDashboard() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      <HeroSection />
      <PremiumStatCards />
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <TimelineActivity />
        <PremiumProjects />
      </motion.div>
      <motion.div variants={itemVariants}>
        <CompanyBrain />
      </motion.div>
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <AnalyticsOverview />
        <AIRecommendations />
      </motion.div>
    </motion.div>
  );
}
