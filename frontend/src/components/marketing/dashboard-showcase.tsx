import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import {
  ArrowRight, CheckCircle2, TrendingUp, Bell, Search,
  BrainCircuit, LayoutDashboard, GitBranch, MessageSquare,
  Zap, Users, BarChart3, Workflow, Sparkles, Activity,
  ArrowUpRight, Shield, FileText,
} from "lucide-react";
import CountUp from "react-countup";
const CountUpComponent = (CountUp as any).default || CountUp;

/* ─── Mini Sparkline ─────────────────────────────────────────────── */
function Sparkline({ pts, color }: { pts: string; color: string }) {
  const id = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox="0 0 72 24" className="w-18 h-6" style={{ width: 72, height: 24 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,24 ${pts} 72,24`} fill={`url(#${id})`} />
    </svg>
  );
}

/* ─── Bar chart ──────────────────────────────────────────────────── */
function MiniBar({ bars, color }: { bars: number[]; color: string }) {
  const max = Math.max(...bars);
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 28 }}>
      {bars.map((v, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 * i, duration: 0.4, ease: "easeOut" }}
          style={{
            width: 5,
            height: `${(v / max) * 100}%`,
            borderRadius: 2,
            background: i === bars.length - 1 ? color : `color-mix(in srgb, ${color} 35%, #e5e7eb)`,
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}

/* ─── KPI Glass Card ─────────────────────────────────────────────── */
function KPICard({
  title, value, delta, color, icon: Icon, bars, spark,
}: {
  title: string; value: number; delta: string; color: string;
  icon: React.ElementType; bars: number[]; spark: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-[18px] p-4 border overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(16px)",
        borderColor: `color-mix(in srgb, ${color} 18%, rgba(255,255,255,0.8))`,
        boxShadow: `0 4px 24px color-mix(in srgb, ${color} 12%, transparent), 0 1px 0 rgba(255,255,255,0.9) inset`,
      }}
    >
      {/* Top glint */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none rounded-[18px]" />
      {/* Bloom */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30"
        style={{ background: color }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center"
            style={{ background: `color-mix(in srgb, ${color} 14%, white)` }}
          >
            <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.8} />
          </div>
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: `color-mix(in srgb, ${color} 12%, white)`, color }}
          >
            {delta}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 font-semibold mb-0.5">{title}</p>
        <p className="text-[22px] font-black text-gray-900 leading-none">
          <CountUpComponent end={value} duration={2.2} />
        </p>
        <div className="flex items-end justify-between mt-2">
          <Sparkline pts={spark} color={color} />
          <MiniBar bars={bars} color={color} />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Donut ring SVG ─────────────────────────────────────────────── */
function DonutRing({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 22; const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={56} height={56} viewBox="0 0 56 56">
        <circle cx={28} cy={28} r={r} fill="none" stroke="#F3F4F6" strokeWidth={5} />
        <circle
          cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
        <text x={28} y={32} textAnchor="middle" fontSize={10} fontWeight={800} fill="#111">{pct}%</text>
      </svg>
      <span className="text-[9px] font-bold text-gray-400">{label}</span>
    </div>
  );
}

/* ─── Main Section ───────────────────────────────────────────────── */
export function DashboardShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const yOffset = useTransform(scrollYProgress, [0, 1], [40, -40]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 45, damping: 18 });
  const sy = useSpring(my, { stiffness: 45, damping: 18 });
  const rotX = useTransform(sy, [-0.5, 0.5], ["2.5deg", "-2.5deg"]);
  const rotY = useTransform(sx, [-0.5, 0.5], ["-2.5deg", "2.5deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const kpis = [
    { title: "Active Projects", value: 24,  delta: "+12%", color: "#6C4CF1", icon: Workflow,
      bars: [30,42,36,50,44,58,52,64,58,70,65,80], spark: "0,20 9,14 18,16 27,10 36,12 45,6 54,8 63,3 72,5" },
    { title: "Tasks Completed", value: 128, delta: "+8%",  color: "#0EA5E9", icon: CheckCircle2,
      bars: [20,34,28,40,36,52,46,60,54,68,62,78], spark: "0,18 9,12 18,14 27,8 36,10 45,5 54,7 63,3 72,2" },
    { title: "Team Members",    value: 42,  delta: "+5%",  color: "#10B981", icon: Users,
      bars: [38,50,44,58,52,64,60,70,66,74,70,82], spark: "0,14 9,10 18,12 27,7 36,9 45,4 54,5 63,2 72,2" },
  ];

  const activity = [
    { icon: GitBranch,     text: "PR #204 merged to main",       time: "2m",  color: "#8B5CF6", tag: "GitHub"  },
    { icon: MessageSquare, text: "Slack digest: 4 blockers found",time: "9m",  color: "#0EA5E9", tag: "Slack"   },
    { icon: Zap,           text: "Invoice workflow auto-approved",time: "15m", color: "#F59E0B", tag: "Zapier"  },
    { icon: TrendingUp,    text: "Revenue alert: +$48k closed",   time: "22m", color: "#EF4444", tag: "HubSpot" },
    { icon: Shield,        text: "Security scan passed ✓",        time: "31m", color: "#10B981", tag: "AWS"     },
  ];

  return (
    <section
      ref={containerRef}
      className="py-32 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      style={{ background: "linear-gradient(160deg, #F5F3FF 0%, #EFF6FF 50%, #F0FDF4 100%)" }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[10%] w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "rgba(108,76,241,0.07)" }} />
        <div className="absolute bottom-0 right-[5%] w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "rgba(14,165,233,0.06)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[100px]"
          style={{ background: "rgba(16,185,129,0.04)" }} />
        {/* dot grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #6C4CF1 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── LEFT COPY ───────────────────────────────────────── */}
          <motion.div style={{ y: yOffset }} className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full border border-primary/20 bg-primary/6 text-primary text-[10px] font-black tracking-[0.18em] uppercase"
            >
              <Activity className="w-3 h-3" />
              Live Insights
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="text-3xl md:text-[46px] font-black tracking-tight leading-[1.08]"
            >
              All Your Company Intelligence{" "}
              <span
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  backgroundImage: "linear-gradient(135deg, #6C4CF1, #0EA5E9)",
                }}
              >
                in One Place.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base text-gray-500 leading-relaxed"
            >
              Go beyond simple dashboards. Apex AI gives you deep visibility across
              projects, teams, tools, and workflows — so you proactively identify
              bottlenecks before they happen.
            </motion.p>

            <ul className="space-y-3 mt-1">
              {[
                { text: "Real-time project tracking across all tools",   color: "#6C4CF1" },
                { text: "AI-generated team performance analytics",         color: "#0EA5E9" },
                { text: "Automated risk detection & recommendations",      color: "#10B981" },
                { text: "Executive reports generated on schedule",         color: "#F59E0B" },
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 * i }}
                  className="flex items-center gap-3 text-[14px] font-semibold text-gray-700"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${item.color} 14%, white)` }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: item.color }} />
                  </div>
                  {item.text}
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-2"
            >
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 h-12 px-6 rounded-[14px] text-[14px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #6C4CF1, #8B5CF6)",
                  boxShadow: "0 8px 24px rgba(108,76,241,0.38), inset 0 1px 1px rgba(255,255,255,0.2)",
                }}
              >
                Explore Dashboard
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* ── RIGHT DASHBOARD MOCKUP ───────────────────────────── */}
          <div className="relative hidden md:block" style={{ perspective: "1800px" }}>
            <motion.div
              style={{ rotateX: rotX, rotateY: rotY }}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-[24px] overflow-hidden border"
              style={{
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(28px) saturate(180%)",
                borderColor: "rgba(255,255,255,0.75)",
                boxShadow: [
                  "0 0 0 1px rgba(255,255,255,0.7) inset",
                  "0 32px 80px -12px rgba(108,76,241,0.18)",
                  "0 8px 32px -4px rgba(0,0,0,0.08)",
                ].join(", "),
              }}
            >
              {/* Moving light sheen */}
              <motion.div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  background: useTransform(
                    [sx, sy],
                    ([lx, ly]) =>
                      `radial-gradient(700px circle at ${(lx as number) * 100 + 50}% ${(ly as number) * 100 + 50}%, rgba(255,255,255,0.22), transparent 60%)`
                  ),
                }}
              />

              {/* Browser chrome */}
              <div
                className="relative z-10 flex items-center gap-3 px-4 py-3 border-b"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  borderColor: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-gray-400 font-medium"
                    style={{ background: "rgba(0,0,0,0.04)" }}
                  >
                    <Search className="w-3 h-3" />
                    app.apex.ai/dashboard
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Bell className="w-4 h-4 text-gray-300" />
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-400 border border-white" />
                  </div>
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10">
                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=42&backgroundColor=ddd6fe" alt="" />
                  </div>
                </div>
              </div>

              {/* Dashboard body */}
              <div className="relative z-10 flex" style={{ minHeight: 420 }}>

                {/* Sidebar */}
                <div
                  className="w-[155px] shrink-0 flex flex-col py-4 border-r"
                  style={{
                    background: "linear-gradient(160deg,rgba(15,10,42,0.92),rgba(26,15,58,0.88))",
                    borderColor: "rgba(108,76,241,0.2)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="px-4 mb-5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-[8px] bg-primary flex items-center justify-center">
                      <BrainCircuit className="w-3.5 h-3.5 text-white" strokeWidth={1.8} />
                    </div>
                    <span className="text-[13px] font-black text-white">APEX</span>
                  </div>

                  <div className="px-3 mb-3">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] bg-white/6">
                      <Search className="w-3 h-3 text-white/25" />
                      <span className="text-[10px] text-white/25">Search…</span>
                    </div>
                  </div>

                  <nav className="flex flex-col gap-0.5 px-2 flex-1">
                    {[
                      { icon: LayoutDashboard, label: "Dashboard",   active: true  },
                      { icon: BrainCircuit,    label: "Company Brain",active: false },
                      { icon: BarChart3,       label: "Analytics",   active: false },
                      { icon: Workflow,        label: "Workflows",   active: false },
                      { icon: FileText,        label: "Reports",     active: false },
                    ].map(({ icon: Icon, label, active }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[11px] font-semibold ${
                          active ? "bg-primary/20 text-white" : "text-white/30"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.2 : 1.6} />
                        {label}
                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                    ))}
                  </nav>

                  <div className="px-3 mt-3">
                    <div
                      className="rounded-[10px] px-3 py-2 border"
                      style={{ background: "rgba(108,76,241,0.15)", borderColor: "rgba(108,76,241,0.3)" }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <motion.div
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 1.6, repeat: Infinity }}
                          className="w-1.5 h-1.5 rounded-full bg-green-400"
                        />
                        <span className="text-[9px] font-black text-primary/80 uppercase tracking-wider">AI Online</span>
                      </div>
                      <p className="text-[9px] text-white/30">312 signals processed</p>
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div
                  className="flex-1 p-5 flex flex-col gap-4"
                  style={{ background: "rgba(248,247,255,0.6)", backdropFilter: "blur(8px)" }}
                >
                  {/* Top bar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-black text-gray-900">Good morning, Sarah 👋</p>
                      <p className="text-[10px] text-gray-400">Here's what's happening in your workspace today.</p>
                    </div>
                    <motion.div
                      animate={{ boxShadow: ["0 4px 14px rgba(108,76,241,0.28)", "0 6px 22px rgba(108,76,241,0.48)", "0 4px 14px rgba(108,76,241,0.28)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#6C4CF1,#8B5CF6)" }}
                    >
                      <Sparkles className="w-3 h-3" />
                      AI Summary
                    </motion.div>
                  </div>

                  {/* KPI row */}
                  <div className="grid grid-cols-3 gap-3">
                    {kpis.map((k) => (
                      <KPICard key={k.title} {...k} />
                    ))}
                  </div>

                  {/* Bottom row: AI digest + Activity */}
                  <div className="grid grid-cols-2 gap-3 flex-1">

                    {/* AI digest glass card */}
                    <div
                      className="rounded-[18px] p-4 border flex flex-col"
                      style={{
                        background: "rgba(255,255,255,0.7)",
                        backdropFilter: "blur(16px)",
                        borderColor: "rgba(255,255,255,0.8)",
                        boxShadow: "0 4px 20px rgba(108,76,241,0.07), 0 1px 0 rgba(255,255,255,0.9) inset",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-[8px] flex items-center justify-center bg-primary/10">
                          <BrainCircuit className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                        </div>
                        <p className="text-[11px] font-black text-gray-800">AI Digest</p>
                      </div>
                      <ul className="space-y-2 flex-1">
                        {[
                          { dot: "#6C4CF1", text: "3 PRs merged this morning" },
                          { dot: "#10B981", text: "12 tasks completed on time" },
                          { dot: "#EF4444", text: "2 blockers in API design" },
                          { dot: "#F59E0B", text: "Marketing campaign launched" },
                        ].map(({ dot, text }) => (
                          <li key={text} className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                            {text}
                          </li>
                        ))}
                      </ul>
                      <button
                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-[10px] text-[11px] font-bold text-primary"
                        style={{ background: "rgba(108,76,241,0.08)", border: "1px solid rgba(108,76,241,0.15)" }}
                      >
                        Ask Apex AI
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Activity feed glass card */}
                    <div
                      className="rounded-[18px] p-4 border flex flex-col"
                      style={{
                        background: "rgba(255,255,255,0.7)",
                        backdropFilter: "blur(16px)",
                        borderColor: "rgba(255,255,255,0.8)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.9) inset",
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-primary" />
                          <p className="text-[11px] font-black text-gray-800">Live Activity</p>
                        </div>
                        <motion.div
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 1.8, repeat: Infinity }}
                          className="flex items-center gap-1"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-[9px] font-bold text-green-500">Live</span>
                        </motion.div>
                      </div>
                      <div className="space-y-0 flex-1">
                        {activity.map(({ icon: Icon, text, time, color, tag }) => (
                          <div key={text} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                            <div
                              className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0"
                              style={{ background: `${color}15` }}
                            >
                              <Icon className="w-2.5 h-2.5" style={{ color }} />
                            </div>
                            <span className="text-[10px] font-medium text-gray-700 flex-1 truncate">{text}</span>
                            <span
                              className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
                              style={{ background: `${color}12`, color }}
                            >
                              {tag}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
