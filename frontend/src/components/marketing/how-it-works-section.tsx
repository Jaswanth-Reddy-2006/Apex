import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import {
  MessageSquare, Mail, Video,
  TrendingUp, BarChart3, Users,
  GitBranch, CheckCircle2, Rocket,
  FileText, BookOpen, GitPullRequest,
  BrainCircuit, Zap, Sparkles,
} from "lucide-react";

/* ─── Source card definitions ──────────────────────────────────── */
const sources = [
  {
    label: "Communications",
    emoji: "💬",
    color: "#6C4CF1",
    accent: "#EDE9FE",
    items: [
      { icon: MessageSquare, text: "Sarah: Q3 results look great 👌", tag: "Slack" },
      { icon: Mail,          text: "Partnership proposal received",    tag: "Gmail" },
      { icon: Video,         text: "Design review · Tomorrow 10am",   tag: "Teams" },
    ],
  },
  {
    label: "Sales",
    emoji: "📈",
    color: "#0EA5E9",
    accent: "#E0F2FE",
    items: [
      { icon: TrendingUp, text: "Acme Corp · $48k deal · hot",    tag: "Salesforce" },
      { icon: BarChart3,  text: "Pipeline: $2.4M active deals",   tag: "HubSpot"    },
      { icon: Users,      text: "12 demos booked this week",       tag: "Outreach"   },
    ],
  },
  {
    label: "Engineering",
    emoji: "⚙️",
    color: "#8B5CF6",
    accent: "#EDE9FE",
    items: [
      { icon: GitBranch,    text: "PR #204 merged · main",         tag: "GitHub"  },
      { icon: CheckCircle2, text: "5 issues resolved today",       tag: "Jira"    },
      { icon: Rocket,       text: "CI/CD · all checks passing ✓",  tag: "Vercel"  },
    ],
  },
  {
    label: "Documentation",
    emoji: "📄",
    color: "#06B6D4",
    accent: "#ECFEFF",
    items: [
      { icon: FileText,       text: "Q4 Roadmap · 78% complete",  tag: "Notion"      },
      { icon: BookOpen,       text: "API docs v2.4 published",    tag: "Confluence"  },
      { icon: GitPullRequest, text: "ENG-204 spec · in review",   tag: "Linear"      },
    ],
  },
];

/* ─── Individual card ───────────────────────────────────────────── */
function SourceCard({ src, lit }: { src: (typeof sources)[number]; lit: boolean }) {
  return (
    <motion.div
      animate={{
        opacity:   lit ? 1 : 0.25,
        y:         lit ? 0 : 12,
        scale:     lit ? 1 : 0.97,
      }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 min-w-0 rounded-[20px] border overflow-hidden"
      style={{
        borderColor: lit ? `color-mix(in srgb, ${src.color} 20%, #e5e7eb)` : "#F3F4F6",
        background:  lit ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)",
        boxShadow:   lit
          ? `0 8px 28px -4px color-mix(in srgb, ${src.color} 18%, transparent), 0 1px 0 white inset`
          : "none",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center gap-2 border-b"
        style={{
          background:   `linear-gradient(to right, color-mix(in srgb, ${src.color} 8%, white), white)`,
          borderColor:  `color-mix(in srgb, ${src.color} 12%, #f3f4f6)`,
        }}
      >
        <span className="text-[13px]">{src.emoji}</span>
        <p className="text-[12px] font-black" style={{ color: src.color }}>
          {src.label}
        </p>
        <div
          className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: lit ? src.color : "#D1D5DB" }}
        />
      </div>

      {/* Items */}
      <div className="divide-y" style={{ divideColor: "#F9FAFB" }}>
        {src.items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
              <div
                className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${src.color} 10%, white)` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: src.color }} strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-gray-800 leading-tight">{item.text}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.tag}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Main section ───────────────────────────────────────────────── */
export function HowItWorksSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", setProgress);

  const cardLit   = sources.map((_, i) => progress >= 0.06 + i * 0.10);
  const pathDrawn = sources.map((_, i) => progress >= 0.10 + i * 0.10);
  const nodeOn    = progress >= 0.55;

  const pathColors = sources.map((s) => s.color);

  /*
    SVG is a separate block BETWEEN the cards and the node.
    ViewBox: "0 0 1000 90"  (90 px tall connector zone)
    4 card centers (in %): 12.5, 37.5, 62.5, 87.5 → in 1000: 125, 375, 625, 875
    Paths start at y=0 (card bottom), converge at x=500 y=90 (node top).
  */
  const svgPaths = [
    "M 125,0 C 125,58 500,75 500,90",
    "M 375,0 C 375,44 500,65 500,90",
    "M 625,0 C 625,44 500,65 500,90",
    "M 875,0 C 875,58 500,75 500,90",
  ];

  return (
    <div ref={scrollRef} style={{ height: "600vh" }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden bg-white">

        {/* Dot grid bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #6C4CF110 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-transparent to-white/90 pointer-events-none" />

        {/* Top progress strip */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gray-100 z-30">
          <div
            className="h-full rounded-r-full transition-all duration-100"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, #6C4CF1, #06B6D4)",
              boxShadow: "0 0 10px rgba(108,76,241,0.45)",
            }}
          />
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 md:px-10 gap-0">

          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-3"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-black tracking-widest text-primary uppercase">
                How it works
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="text-2xl md:text-[42px] font-black tracking-tight leading-[1.08]"
            >
              Apex learns{" "}
              <span className="text-gradient">while you work.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground mt-2 max-w-md mx-auto"
            >
              Every message, commit, and update flows silently into your company's
              intelligence layer — no tagging required.
            </motion.p>
          </div>

          {/* ── Diagram area ─────────────────────────────────────── */}
          <div className="w-full max-w-4xl">

            {/* Source cards */}
            <div className="flex gap-3 md:gap-4">
              {sources.map((src, i) => (
                <SourceCard key={src.label} src={src} lit={cardLit[i]} />
              ))}
            </div>

            {/* SVG connector zone */}
            <div className="w-full relative" style={{ height: "88px" }}>
              <svg
                viewBox="0 0 1000 90"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
              >
                {svgPaths.map((d, i) => (
                  <g key={i}>
                    {/* Ghost track */}
                    <path
                      d={d}
                      stroke="#E5E7EB"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Animated colored fill */}
                    <motion.path
                      d={d}
                      stroke={pathColors[i]}
                      strokeWidth="2.5"
                      strokeDasharray="5 4"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: pathDrawn[i] ? 1 : 0,
                        opacity:    pathDrawn[i] ? 0.8 : 0,
                      }}
                      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </g>
                ))}
              </svg>

              {/* Traveling dots — positioned as HTML circles along the paths */}
              {pathDrawn.map((drawn, i) =>
                drawn ? (
                  <motion.div
                    key={i}
                    className="absolute w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{
                      background: pathColors[i],
                      boxShadow: `0 0 8px ${pathColors[i]}80`,
                      // approximate midpoint of each path
                      left: `${[14, 38, 62, 86][i]}%`,
                      top:  `${[52, 42, 42, 52][i]}%`,
                    }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
                  />
                ) : null
              )}
            </div>

            {/* Central node */}
            <div className="flex justify-center">
              <div className="relative flex flex-col items-center gap-2">
                {/* Bloom ring */}
                <motion.div
                  animate={{ opacity: nodeOn ? 1 : 0, scale: nodeOn ? [1, 1.1, 1] : 0.8 }}
                  transition={{ opacity: { duration: 0.6 }, scale: { duration: 2.5, repeat: Infinity } }}
                  className="absolute w-24 h-24 rounded-[28px] blur-2xl"
                  style={{ background: "rgba(108,76,241,0.3)", top: -6 }}
                />

                {/* Node icon */}
                <motion.div
                  animate={{
                    background: nodeOn
                      ? "linear-gradient(135deg, #6C4CF1 0%, #8B5CF6 55%, #A78BFA 100%)"
                      : "linear-gradient(135deg, #F3F4F6, #E5E7EB)",
                    boxShadow: nodeOn
                      ? "0 16px 48px rgba(108,76,241,0.4), 0 0 0 6px rgba(108,76,241,0.1), inset 0 1px 1px rgba(255,255,255,0.3)"
                      : "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                  transition={{ duration: 0.75 }}
                  className="relative w-[68px] h-[68px] rounded-[22px] flex items-center justify-center border-2 border-white"
                >
                  <BrainCircuit
                    className="w-8 h-8 transition-colors duration-700"
                    style={{ color: nodeOn ? "white" : "#D1D5DB" }}
                    strokeWidth={1.5}
                  />

                  {/* Green online dot */}
                  <motion.div
                    animate={{ opacity: nodeOn ? 1 : 0, scale: nodeOn ? 1 : 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-green-400 border-[2.5px] border-white"
                    style={{ boxShadow: "0 0 10px rgba(74,222,128,0.8)" }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-green-400"
                    />
                  </motion.div>
                </motion.div>

                {/* Label */}
                <motion.div
                  animate={{ opacity: nodeOn ? 1 : 0, y: nodeOn ? 0 : 6 }}
                  transition={{ duration: 0.45, delay: 0.15 }}
                  className="text-center"
                >
                  <p className="text-[14px] font-black text-gray-900">Apex Intelligence Core</p>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <Zap className="w-3 h-3 text-primary" />
                    <p className="text-[11px] text-gray-400 font-medium">Always learning · Zero configuration</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <motion.p
            animate={{ opacity: progress < 0.04 ? 1 : 0 }}
            className="absolute bottom-5 text-[10px] text-gray-300 tracking-widest uppercase font-semibold"
          >
            Scroll to explore
          </motion.p>
        </div>
      </div>
    </div>
  );
}
