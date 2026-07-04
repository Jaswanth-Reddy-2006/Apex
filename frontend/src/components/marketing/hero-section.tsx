import React from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight, Play, Sparkles, TrendingUp, Users,
  CheckCircle2, GitBranch, MessageSquare, Zap, Activity,
  LayoutDashboard, BrainCircuit, Bell, Search, Settings,
  ChevronRight, BarChart3, Workflow, FileText,
} from "lucide-react";

/* ─── Mini bar chart ─────────────────────────────────────────────── */
function BarChart({ bars, color }: { bars: number[]; color: string }) {
  const max = Math.max(...bars);
  return (
    <div className="flex items-end gap-[3px] h-10">
      {bars.map((v, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.8 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: `${(v / max) * 100}%`,
            width: 6,
            borderRadius: 3,
            background: i === bars.length - 1
              ? color
              : `color-mix(in srgb, ${color} 40%, #e5e7eb)`,
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Sparkline ──────────────────────────────────────────────────── */
function Spark({ pts, color }: { pts: string; color: string }) {
  const id = `s${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox="0 0 64 20" className="w-16 h-5" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,20 ${pts} 64,20`} fill={`url(#${id})`} />
    </svg>
  );
}

/* ─── Premium App Window ─────────────────────────────────────────── */
function AppWindow() {
  const stats = [
    { label: "Active Users",  value: "12,847", pct: "+18%", color: "#6C4CF1", bars: [30,45,38,55,42,68,60,72,65,85,78,95], spark: "0,16 8,12 16,14 24,8 32,10 40,5 48,7 56,3 64,5" },
    { label: "AI Queries",    value: "98.4K",  pct: "+32%", color: "#0EA5E9", bars: [20,35,28,42,38,55,48,62,56,70,66,88], spark: "0,18 8,14 16,16 24,10 32,12 40,6 48,8 56,4 64,2" },
    { label: "Workflows Run", value: "3,291",  pct: "+11%", color: "#10B981", bars: [40,52,44,60,50,66,58,70,62,76,70,84], spark: "0,14 8,10 16,13 24,7 32,9 40,5 48,6 56,3 64,2" },
    { label: "Hours Saved",   value: "847h",   pct: "+24%", color: "#F59E0B", bars: [25,38,32,50,44,58,52,65,60,73,68,82], spark: "0,17 8,13 16,15 24,9 32,11 40,6 48,8 56,4 64,2" },
  ];

  const feed = [
    { icon: CheckCircle2,  text: "Q3 report summarised by AI",    tag: "Apex AI",    time: "2m",  color: "#10B981" },
    { icon: GitBranch,     text: "PR #204 linked to Sprint 12",   tag: "GitHub",     time: "7m",  color: "#8B5CF6" },
    { icon: MessageSquare, text: "Slack digest: 3 action items",  tag: "Slack",      time: "12m", color: "#0EA5E9" },
    { icon: Zap,           text: "Invoice workflow approved",      tag: "Workflow",   time: "18m", color: "#F59E0B" },
    { icon: TrendingUp,    text: "Revenue alert: +$48k deal",     tag: "Salesforce", time: "24m", color: "#EF4444" },
  ];

  const nav = [
    { icon: LayoutDashboard, label: "Dashboard",    active: true  },
    { icon: BrainCircuit,    label: "Company Brain", active: false },
    { icon: BarChart3,       label: "Analytics",    active: false },
    { icon: Workflow,        label: "Workflows",    active: false },
    { icon: FileText,        label: "Reports",      active: false },
    { icon: Settings,        label: "Settings",     active: false },
  ];

  return (
    <div
      className="w-full rounded-[22px] overflow-hidden border"
      style={{
        borderColor: "rgba(108,76,241,0.15)",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.6) inset",
          "0 40px 100px -20px rgba(108,76,241,0.22)",
          "0 20px 60px -12px rgba(0,0,0,0.12)",
        ].join(", "),
      }}
    >
      {/* Browser chrome */}
      <div className="bg-white/95 border-b border-gray-100 px-4 py-3 flex items-center gap-3" style={{ backdropFilter: "blur(12px)" }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-gray-100/80 rounded-lg px-4 py-1.5 flex items-center gap-2 w-64">
            <div className="w-2 h-2 rounded-full bg-primary/50" />
            <span className="text-[11px] text-gray-400 font-medium">app.apex.ai/dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-4 h-4 text-gray-300" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400 border border-white" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=42&backgroundColor=ddd6fe" alt="" />
            </div>
            <span className="text-[11px] font-semibold text-gray-600">Alex</span>
          </div>
        </div>
      </div>

      {/* App body */}
      <div className="flex" style={{ height: 340 }}>

        {/* Dark sidebar */}
        <div
          className="w-[175px] shrink-0 flex flex-col py-4 border-r"
          style={{
            background: "linear-gradient(160deg, #0F0A2A 0%, #1A0F3A 100%)",
            borderColor: "rgba(108,76,241,0.2)",
          }}
        >
          {/* Logo */}
          <div className="px-4 mb-5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-[7px] bg-primary flex items-center justify-center shadow-sm">
              <BrainCircuit className="w-3.5 h-3.5 text-white" strokeWidth={1.8} />
            </div>
            <span className="text-[13px] font-black text-white">APEX</span>
          </div>

          {/* Search */}
          <div className="px-3 mb-4">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] bg-white/8">
              <Search className="w-3 h-3 text-white/30" />
              <span className="text-[10px] text-white/30">Search…</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 px-2 flex-1">
            {nav.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-[9px] text-[11px] font-semibold transition-colors ${
                  active
                    ? "bg-primary/20 text-white"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.2 : 1.6} />
                {label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
            ))}
          </nav>

          {/* AI badge */}
          <div className="px-3 mt-3">
            <div
              className="rounded-[10px] px-3 py-2 border"
              style={{ background: "rgba(108,76,241,0.15)", borderColor: "rgba(108,76,241,0.3)" }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] font-black text-primary/90 uppercase tracking-wider">AI Online</span>
              </div>
              <p className="text-[9px] text-white/40">247 signals processed</p>
            </div>
          </div>
        </div>

        {/* Main area */}
        <div
          className="flex-1 flex flex-col gap-3 p-4 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #F8F7FF 0%, #F0F4FF 100%)" }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-black text-gray-900">Good morning, Alex 👋</p>
              <p className="text-[10px] text-gray-400">Your company intelligence is up to date.</p>
            </div>
            <motion.div
              animate={{ boxShadow: ["0 4px 14px rgba(108,76,241,0.3)", "0 6px 20px rgba(108,76,241,0.5)", "0 4px 14px rgba(108,76,241,0.3)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#6C4CF1,#8B5CF6)" }}
            >
              <Sparkles className="w-3 h-3" />
              AI Summary ready
            </motion.div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-[13px] bg-white border border-white/80 p-3"
                style={{ boxShadow: `0 2px 12px ${s.color}10` }}
              >
                <p className="text-[9px] text-gray-400 font-bold mb-1">{s.label}</p>
                <p className="text-[17px] font-black text-gray-900 leading-none mb-2">{s.value}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[9px] font-bold" style={{ color: s.color }}>{s.pct}</span>
                    <BarChart bars={s.bars} color={s.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity feed */}
          <div className="flex-1 bg-white rounded-[13px] border border-white/80 px-3 py-2.5 overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-primary" />
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Live Activity</p>
              </div>
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="flex items-center gap-1"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[9px] text-green-500 font-bold">Live</span>
              </motion.div>
            </div>
            {feed.map(({ icon: Icon, text, tag, time, color }) => (
              <div key={text} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                  <Icon className="w-2.5 h-2.5" style={{ color }} />
                </div>
                <span className="text-[10px] font-semibold text-gray-700 flex-1 truncate">{text}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${color}12`, color }}>
                  {tag}
                </span>
                <span className="text-[9px] text-gray-300 shrink-0">{time}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Hero ──────────────────────────────────────────────────── */
export function HeroSection() {
  const { scrollY } = useScroll();
  const windowY       = useTransform(scrollY, [0, 400], [0, 55]);
  const windowOpacity = useTransform(scrollY, [0, 380], [1, 0.55]);
  const windowScale   = useTransform(scrollY, [0, 400], [1, 0.97]);

  return (
    <section className="relative pt-32 pb-0 overflow-hidden text-center">

      {/* ── Mesh gradient bg ──────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[8%] left-1/2 -translate-x-1/2 w-[1100px] h-[700px]"
          style={{ background: "radial-gradient(ellipse, rgba(108,76,241,0.09) 0%, transparent 65%)" }} />
        <div className="absolute top-[15%] left-[5%] w-[380px] h-[380px] rounded-full blur-[130px]"
          style={{ background: "rgba(14,165,233,0.06)" }} />
        <div className="absolute top-[10%] right-[5%] w-[320px] h-[320px] rounded-full blur-[110px]"
          style={{ background: "rgba(168,85,247,0.07)" }} />
        <div className="absolute top-[30%] right-[20%] w-[200px] h-[200px] rounded-full blur-[80px]"
          style={{ background: "rgba(236,72,153,0.05)" }} />
        {/* Fine grid */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: [
              "linear-gradient(rgba(108,76,241,0.04) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(108,76,241,0.04) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-white/80 text-[12px] font-bold text-primary mb-8 shadow-sm"
          style={{
            borderColor: "rgba(108,76,241,0.2)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 12px rgba(108,76,241,0.1)",
          }}
        >
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
          Apex AI · Company Brain 2.0 is live
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-[3.5rem] sm:text-[5rem] lg:text-[6.8rem] font-black tracking-[-0.035em] leading-[1.0] mb-6"
        >
          One Company Brain.
          <br />
          <span
            className="relative inline-block"
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              backgroundImage: "linear-gradient(135deg, #6C4CF1 0%, #8B5CF6 40%, #0EA5E9 100%)",
            }}
          >
            Smarter Decisions.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-lg md:text-[20px] text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Apex AI securely connects with your existing software to build one unified
          knowledge graph that understands your business — in real time.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22 }}
          className="flex items-center justify-center gap-4 flex-wrap mb-10"
        >
          <Link to="/auth">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="h-14 px-8 text-[16px] font-bold rounded-[16px] text-white flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #6C4CF1 0%, #8B5CF6 100%)",
                boxShadow: "0 8px 28px rgba(108,76,241,0.42), 0 2px 6px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.25)",
              }}
            >
              Get Started Free
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </Link>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            className="h-14 px-7 text-[16px] font-semibold rounded-[16px] border border-gray-200/80 bg-white/70 text-gray-700 flex items-center gap-3 hover:border-primary/25 hover:bg-white transition-all"
            style={{ backdropFilter: "blur(10px)", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}
          >
            <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center border border-primary/15">
              <Play className="w-3.5 h-3.5 text-primary fill-primary" />
            </div>
            Watch Demo
          </motion.button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center justify-center gap-6 mb-16 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i*13}&backgroundColor=ddd6fe,bfdbfe,bbf7d0`} alt="" />
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex gap-0.5 mb-0.5">
                {[1,2,3,4,5].map((s) => <span key={s} className="text-yellow-400 text-sm">★</span>)}
              </div>
              <p className="text-[13px] font-semibold text-gray-600">
                Loved by <span className="text-gray-900 font-black">2,000+</span> teams
              </p>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex items-center gap-4 text-[12px] text-gray-400 font-semibold">
            {["SOC2 Compliant", "99.9% Uptime", "GDPR Ready"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {t}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── App window ───────────────────────────────────────── */}
        <div className="relative px-4 md:px-0">

          {/* Floating revenue card */}
          <motion.div
            initial={{ opacity: 0, x: -24, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.0, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-20 rounded-[20px] bg-white border border-white/90 p-4 flex items-center gap-3"
            style={{
              left: "-3%", top: "10%",
              boxShadow: "0 16px 40px rgba(108,76,241,0.14), 0 1px 0 rgba(255,255,255,0.9) inset",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="w-11 h-11 rounded-[13px] flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6C4CF1,#A78BFA)" }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold leading-none mb-1">Revenue Signal</p>
              <p className="text-[18px] font-black text-gray-900 leading-none">$2.4M</p>
              <p className="text-[10px] font-bold text-emerald-500 mt-0.5">↑ 18% MoM</p>
            </div>
          </motion.div>

          {/* Floating team card */}
          <motion.div
            initial={{ opacity: 0, x: 24, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-20 rounded-[20px] bg-white border border-white/90 px-4 py-3"
            style={{
              right: "-3%", top: "8%",
              boxShadow: "0 16px 40px rgba(14,165,233,0.12), 0 1px 0 rgba(255,255,255,0.9) inset",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-400"
              />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Team Online</span>
            </div>
            <div className="flex -space-x-2 mb-1.5">
              {[3,6,9,12].map((s) => (
                <div key={s} className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${s}&backgroundColor=ddd6fe`} alt="" />
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center">
                <span className="text-[8px] font-black text-primary">+9</span>
              </div>
            </div>
            <p className="text-[12px] font-bold text-gray-700">14 teammates active</p>
          </motion.div>

          {/* Alert card bottom left */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute z-20 rounded-[16px] bg-white border border-white/90 px-3 py-2.5 flex items-center gap-2.5"
            style={{
              left: "-2%", bottom: "16%",
              boxShadow: "0 12px 32px rgba(16,185,129,0.12), 0 1px 0 rgba(255,255,255,0.9) inset",
            }}
          >
            <div className="w-7 h-7 rounded-[9px] flex items-center justify-center bg-emerald-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-800">Report auto-summarised</p>
              <p className="text-[10px] text-gray-400">Apex AI · just now</p>
            </div>
          </motion.div>

          {/* App window */}
          <motion.div
            initial={{ opacity: 0, y: 56, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.48, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            style={{ y: windowY, opacity: windowOpacity, scale: windowScale }}
            className="mx-8 lg:mx-16"
          >
            <AppWindow />
          </motion.div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
