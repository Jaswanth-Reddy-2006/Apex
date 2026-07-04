import { motion } from "framer-motion";
import { Database, BrainCircuit, Zap, Users2, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Unify Your Data",
    description:
      "Connect all your tools and centralize data in one secure, queryable Company Brain. No more silos.",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
    lightBg:  "#EFF6FF",
    glow:     "rgba(59,130,246,0.25)",
    tag:      "Data",
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Insights",
    description:
      "Get instant answers, summaries, and predictive recommendations sourced directly from your live company data.",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
    lightBg:  "#F5F3FF",
    glow:     "rgba(124,58,237,0.25)",
    tag:      "Intelligence",
  },
  {
    icon: Zap,
    title: "Automate Workflows",
    description:
      "Automate repetitive manual tasks with natural language. Save your team hours of context-switching every single week.",
    gradient: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
    lightBg:  "#FFFBEB",
    glow:     "rgba(245,158,11,0.25)",
    tag:      "Automation",
  },
  {
    icon: Users2,
    title: "Real-Time Collaboration",
    description:
      "Keep your entire organization aligned with live multiplayer workspaces and intelligent smart notifications.",
    gradient: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
    lightBg:  "#ECFDF5",
    glow:     "rgba(16,185,129,0.25)",
    tag:      "Teamwork",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Ready",
    description:
      "Built from the ground up with row-level security, SOC2 compliance, and performance that scales with your company.",
    gradient: "linear-gradient(135deg, #EF4444 0%, #EC4899 100%)",
    lightBg:  "#FFF1F2",
    glow:     "rgba(239,68,68,0.25)",
    tag:      "Security",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 relative overflow-hidden bg-[#FAFBFF]">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #6C4CF112 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none" />

      {/* Ambient blobs */}
      <div className="absolute top-20 -left-32 w-[400px] h-[400px] rounded-full bg-blue-400/6 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-[400px] h-[400px] rounded-full bg-purple-400/6 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-[10px] font-black tracking-[0.2em] uppercase mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Core Features
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="text-3xl md:text-[52px] font-black tracking-tight leading-[1.05] mb-5"
          >
            Everything Connected.{" "}
            <span className="text-gradient">Everything Smart.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
          >
            Bring all your apps, data, and teams into one intelligent platform
            that understands your work and helps you move significantly faster.
          </motion.p>
        </div>

        {/* Bento grid — 3 top + 2 bottom */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {features.slice(0, 3).map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.slice(3).map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i + 3} wide />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature, index, wide = false,
}: {
  feature: (typeof features)[number]; index: number; wide?: boolean;
}) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.25 } }}
      className="relative group rounded-[28px] overflow-hidden border border-white/80"
      style={{
        background: `linear-gradient(150deg, ${feature.lightBg} 0%, #ffffff 100%)`,
        boxShadow: `0 4px 24px -4px ${feature.glow}, 0 1px 0 rgba(255,255,255,0.9) inset`,
      }}
    >
      {/* Top glint */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none rounded-[28px]" />

      {/* Hover glow bloom */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: feature.glow }}
      />

      <div className={`relative z-10 p-8 flex flex-col ${wide ? "md:flex-row md:items-start md:gap-8" : ""}`}>

        {/* Icon + tag */}
        <div className={`flex ${wide ? "flex-col gap-3" : "flex-row items-start justify-between"} mb-6`}>
          {/* Icon orb */}
          <div className="relative">
            <div
              className="absolute inset-0 scale-[2] rounded-full blur-2xl opacity-40 transition-opacity duration-500 group-hover:opacity-70"
              style={{ background: feature.gradient }}
            />
            <div
              className="relative w-[58px] h-[58px] rounded-[18px] flex items-center justify-center border border-white/90 shadow-sm"
              style={{
                background: feature.gradient,
                boxShadow: `0 8px 20px ${feature.glow}`,
              }}
            >
              <div className="absolute inset-0 rounded-[18px] bg-gradient-to-br from-white/30 to-transparent" />
              <Icon className="w-7 h-7 text-white relative z-10" strokeWidth={1.6} />
            </div>
          </div>

          {!wide && (
            <span
              className="text-[9px] font-black tracking-[0.16em] uppercase px-2.5 py-1 rounded-full mt-1"
              style={{
                background: feature.lightBg,
                color: `color-mix(in srgb, ${feature.gradient.slice(23, 30)} 80%, #000)`,
              }}
            >
              {feature.tag}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="flex-1">
          {wide && (
            <span
              className="inline-block text-[9px] font-black tracking-[0.16em] uppercase px-2.5 py-1 rounded-full mb-3"
              style={{ background: feature.lightBg }}
            >
              {feature.tag}
            </span>
          )}
          <h3 className="text-[20px] font-black text-gray-900 leading-tight mb-3">
            {feature.title}
          </h3>
          <p className="text-[14px] text-gray-500 leading-[1.7]">
            {feature.description}
          </p>

          {/* Bottom accent */}
          <div className="flex items-center gap-2 mt-5">
            <div
              className="h-[2px] w-6 rounded-full"
              style={{ background: feature.gradient }}
            />
            <span
              className="text-[11px] font-bold opacity-60"
              style={{ color: `color-mix(in srgb, ${feature.gradient.slice(23, 30)} 100%, transparent)` }}
            >
              Learn more
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
