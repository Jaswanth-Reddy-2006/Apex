import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  MotionValue,
} from "framer-motion";
import {
  Plug, Brain, Cpu, MessageSquare,
  Workflow, LineChart, LayoutDashboard,
  ArrowRight,
} from "lucide-react";

/* ─── Data ─────────────────────────────────────────────────────── */
const steps = [
  {
    icon: Plug, num: "01", title: "Connect Apps",
    subtitle: "Unified Integration Layer",
    desc: "Apex connects to every SaaS tool your team already uses — Slack, Salesforce, Notion, Jira and 50+ more — with zero-config OAuth flows.",
    color: "#6C4CF1", accent: "#EDE9FE", tag: "Setup",
  },
  {
    icon: Brain, num: "02", title: "Company Brain",
    subtitle: "Knowledge Synthesis",
    desc: "All ingested data is continuously organized into a living semantic knowledge graph — your entire company's intelligence in one place.",
    color: "#7C3AED", accent: "#EDE9FE", tag: "Memory",
  },
  {
    icon: Cpu, num: "03", title: "AI Understanding",
    subtitle: "Deep Contextual Reasoning",
    desc: "Apex's AI reads between the lines — correlating signals across departments, detecting patterns humans miss, at enterprise scale.",
    color: "#4F46E5", accent: "#EEF2FF", tag: "Reasoning",
  },
  {
    icon: MessageSquare, num: "04", title: "Recommendations",
    subtitle: "Proactive Intelligence",
    desc: "Get contextual answers, instant summaries, and proactive alerts delivered to you before problems become crises.",
    color: "#0EA5E9", accent: "#E0F2FE", tag: "Insights",
  },
  {
    icon: Workflow, num: "05", title: "Automation",
    subtitle: "Multi-App Workflows",
    desc: "Trigger automated cross-app workflows with natural language. Apex handles the busywork so your team focuses on what matters.",
    color: "#8B5CF6", accent: "#EDE9FE", tag: "Execute",
  },
  {
    icon: LineChart, num: "06", title: "Insights",
    subtitle: "Performance Intelligence",
    desc: "Surface bottlenecks, track KPIs, and drill into exactly where and why things are slowing down — across your entire org.",
    color: "#06B6D4", accent: "#ECFEFF", tag: "Analytics",
  },
  {
    icon: LayoutDashboard, num: "07", title: "Dashboard",
    subtitle: "Real-Time Command Center",
    desc: "One unified dashboard for every team — with live data, AI summaries, and customizable views for every role.",
    color: "#6C4CF1", accent: "#EDE9FE", tag: "Control",
  },
];

/* ─── Left Stepper Item ─────────────────────────────────────────── */
function StepperItem({
  step, index, activeIndex, total,
}: {
  step: (typeof steps)[number]; index: number; activeIndex: number; total: number;
}) {
  const isActive = index === activeIndex;
  const isPast   = index < activeIndex;
  const Icon = step.icon;

  return (
    <motion.div
      animate={{ opacity: isActive ? 1 : isPast ? 0.55 : 0.3 }}
      transition={{ duration: 0.35 }}
      className="flex items-center gap-3 relative"
    >
      {/* Connecting line segment */}
      {index < total - 1 && (
        <div className="absolute left-[15px] top-[30px] w-[2px] h-[36px] bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="w-full rounded-full origin-top"
            animate={{ scaleY: isPast ? 1 : isActive ? 0.5 : 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ height: "100%", background: step.color }}
          />
        </div>
      )}

      {/* Icon bubble */}
      <motion.div
        animate={{
          backgroundColor: isActive ? step.accent : "#F3F4F6",
          borderColor: isActive ? step.color : "transparent",
          scale: isActive ? 1.08 : 1,
        }}
        transition={{ duration: 0.35 }}
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-[1.5px]"
      >
        <Icon className="w-4 h-4" style={{ color: isActive ? step.color : "#9CA3AF" }} strokeWidth={1.7} />
      </motion.div>

      {/* Label */}
      <div className="min-w-0">
        <motion.p
          animate={{ color: isActive ? step.color : "#6B7280" }}
          className="text-[12px] font-semibold leading-none truncate"
        >
          {step.title}
        </motion.p>
        {isActive && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 0.55, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] text-gray-400 mt-0.5 truncate"
          >
            {step.subtitle}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Feature Card ───────────────────────────────────────────────── */
function FeatureCard({ step, isActive }: { step: (typeof steps)[number]; isActive: boolean }) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 28, scale: isActive ? 1 : 0.97 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ pointerEvents: isActive ? "auto" : "none" }}
      className="absolute inset-0"
    >
      <div
        className="h-full w-full rounded-[32px] relative overflow-hidden border border-white/80"
        style={{
          background: `linear-gradient(145deg, ${step.accent} 0%, #ffffff 60%)`,
          boxShadow: `0 24px 80px -12px color-mix(in srgb, ${step.color} 30%, transparent), 0 1px 0 rgba(255,255,255,1) inset`,
        }}
      >
        {/* Top-left glass glint */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none rounded-[32px]" />

        {/* Watermark number */}
        <div
          className="absolute -right-2 -bottom-6 text-[160px] font-black leading-none select-none pointer-events-none"
          style={{ color: step.color, opacity: 0.04 }}
        >
          {step.num}
        </div>

        <div className="relative z-10 p-10 h-full flex flex-col">
          {/* Top row: tag + step counter */}
          <div className="flex items-center justify-between mb-8">
            <span
              className="text-[10px] font-black tracking-[0.18em] uppercase px-3 py-1.5 rounded-full"
              style={{ background: step.accent, color: step.color }}
            >
              {step.tag}
            </span>
          </div>

          {/* Icon */}
          <div className="relative w-fit mb-8">
            <div
              className="absolute inset-0 scale-150 rounded-full blur-2xl"
              style={{ background: step.color, opacity: 0.12 }}
            />
            <div
              className="relative w-[80px] h-[80px] rounded-[24px] flex items-center justify-center border border-white"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.7))`,
                boxShadow: `0 8px 28px -4px color-mix(in srgb, ${step.color} 25%, transparent), inset 0 1px 1px white`,
              }}
            >
              <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/80 to-transparent pointer-events-none" />
              <Icon className="w-9 h-9 relative z-10" style={{ color: step.color }} strokeWidth={1.5} />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: step.color }}>
              {step.subtitle}
            </p>
            <h3 className="text-[36px] md:text-[44px] font-black tracking-tight text-gray-900 leading-[1.05] mb-4">
              {step.title}
            </h3>
            <p className="text-[14px] text-gray-500 leading-[1.7] max-w-[400px]">
              {step.desc}
            </p>
          </div>

          {/* Bottom CTA hint */}
          <div className="flex items-center gap-2 mt-6">
            <div className="h-[2px] w-8 rounded-full" style={{ background: step.color }} />
            <span className="text-[12px] font-semibold" style={{ color: step.color }}>
              Continue scrolling
            </span>
            <ArrowRight className="w-3 h-3" style={{ color: step.color }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Section ───────────────────────────────────────────────── */
export function WorkflowSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(Math.floor(v * steps.length), steps.length - 1);
    setActiveIndex(idx);
  });

  const progressPct = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const activeStep  = steps[activeIndex];

  return (
    <div ref={scrollRef} style={{ height: `${steps.length * 100}vh` }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden bg-white">

        {/* Ambient bg gradient */}
        <motion.div
          animate={{ background: `radial-gradient(ellipse 55% 70% at 75% 50%, color-mix(in srgb, ${activeStep.color} 8%, transparent), transparent)` }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none"
        />

        {/* Top progress bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gray-100/80 z-30 backdrop-blur-sm">
          <motion.div
            className="h-full rounded-r-full origin-left"
            style={{
              width: progressPct,
              background: `linear-gradient(90deg, #6C4CF1, ${activeStep.color})`,
              boxShadow: `0 0 10px color-mix(in srgb, ${activeStep.color} 60%, transparent)`,
            }}
          />
        </div>

        <div className="relative z-10 h-full grid grid-cols-[auto_1fr] md:grid-cols-[280px_1fr]">

          {/* ── LEFT PANEL ─────────────────────────────────────────── */}
          <div className="flex flex-col justify-center px-8 md:px-10 gap-6 border-r border-gray-100/60 min-w-[200px]">
            {/* Header */}
            <div className="mb-2">
              <motion.p
                key={activeIndex}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-black tracking-[0.2em] uppercase mb-1"
                style={{ color: activeStep.color }}
              >
                Operation Pipeline
              </motion.p>
              <h2 className="text-[22px] font-black text-gray-900 leading-tight">
                AI Workflow
              </h2>
              <p className="text-[12px] text-gray-400 mt-1 leading-snug">
                How data becomes intelligence.
              </p>
            </div>

            {/* Step list */}
            <div className="flex flex-col gap-[10px]">
              {steps.map((step, i) => (
                <StepperItem
                  key={step.num}
                  step={step}
                  index={i}
                  activeIndex={activeIndex}
                  total={steps.length}
                />
              ))}
            </div>

            {/* Progress fraction */}
            <div className="mt-2 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-400 font-semibold">Progress</span>
                <motion.span
                  key={activeIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-black"
                  style={{ color: activeStep.color }}
                >
                  {activeStep.num} of {String(steps.length).padStart(2, "0")}
                </motion.span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ width: progressPct, background: activeStep.color }}
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ────────────────────────────────────────── */}
          <div className="relative flex items-center justify-center p-8 md:p-16">


            {/* Card stack */}
            <div className="relative w-full max-w-[560px] h-[460px] md:h-[480px]">
              {steps.map((step, i) => (
                <FeatureCard key={step.num} step={step} isActive={i === activeIndex} />
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ opacity: activeIndex === 0 ? 1 : 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="w-5 h-8 rounded-full border-2 border-gray-200 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-gray-300" />
          </motion.div>
          <p className="text-[10px] text-gray-300 tracking-widest uppercase font-semibold">
            Scroll to explore
          </p>
        </motion.div>

      </div>
    </div>
  );
}
