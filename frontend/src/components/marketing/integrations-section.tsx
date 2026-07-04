import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { Shield, Lock, RefreshCw, Server } from "lucide-react";

/* ─── Brand colors for icon tinting ─────────────────────────────── */
const brandColors: Record<string, { bg: string; icon: string }> = {
  google:          { bg: "#FFF3E0", icon: "#F9AB00" },
  gmail:           { bg: "#FCE8E6", icon: "#EA4335" },
  googledrive:     { bg: "#E8F5E9", icon: "#34A853" },
  googlecalendar:  { bg: "#E3F2FD", icon: "#1A73E8" },
  slack:           { bg: "#FFF0F5", icon: "#E01E5A" },
  microsoftteams:  { bg: "#EDE7F6", icon: "#6264A7" },
  github:          { bg: "#F3F0FF", icon: "#24292F" },
  gitlab:          { bg: "#FFF3E0", icon: "#FC6D26" },
  bitbucket:       { bg: "#E3F2FD", icon: "#0052CC" },
  jira:            { bg: "#E3F2FD", icon: "#0052CC" },
  linear:          { bg: "#F0EEFF", icon: "#5E6AD2" },
  clickup:         { bg: "#FCE4EC", icon: "#FF1966" },
  trello:          { bg: "#E3F2FD", icon: "#0052CC" },
  notion:          { bg: "#F5F5F5", icon: "#000000" },
  confluence:      { bg: "#E3F2FD", icon: "#0052CC" },
  figma:           { bg: "#FFF3E0", icon: "#F24E1E" },
  miro:            { bg: "#FFFDE7", icon: "#FFD02F" },
  discord:         { bg: "#EDE7F6", icon: "#5865F2" },
  zoom:            { bg: "#E3F2FD", icon: "#2D8CFF" },
  hubspot:         { bg: "#FFF3E0", icon: "#FF7A59" },
  salesforce:      { bg: "#E3F2FD", icon: "#00A1E0" },
  stripe:          { bg: "#EDE7F6", icon: "#635BFF" },
  zapier:          { bg: "#FFF3E0", icon: "#FF4A00" },
  cloudflare:      { bg: "#FFF3E0", icon: "#F38020" },
  amazonaws:       { bg: "#FFF3E0", icon: "#FF9900" },
  microsoftazure:  { bg: "#E3F2FD", icon: "#0078D4" },
  vercel:          { bg: "#F5F5F5", icon: "#000000" },
  netlify:         { bg: "#E0F7FA", icon: "#00AD9F" },
  mongodb:         { bg: "#E8F5E9", icon: "#47A248" },
  postman:         { bg: "#FFF3E0", icon: "#FF6C37" },
  openai:          { bg: "#F5F5F5", icon: "#10A37F" },
  anthropic:       { bg: "#F5F5F5", icon: "#191919" },
};

export const enterpriseIntegrations = [
  { name: "Google Workspace", slug: "google",         status: "Connected"   },
  { name: "Gmail",            slug: "gmail",           status: "Connected"   },
  { name: "Google Drive",     slug: "googledrive",     status: "Connected"   },
  { name: "Google Calendar",  slug: "googlecalendar",  status: "Available"   },
  { name: "Slack",            slug: "slack",           status: "Connected"   },
  { name: "Microsoft Teams",  slug: "microsoftteams",  status: "Available"   },
  { name: "GitHub",           slug: "github",          status: "Connected"   },
  { name: "GitLab",           slug: "gitlab",          status: "Available"   },
  { name: "Bitbucket",        slug: "bitbucket",       status: "Available"   },
  { name: "Jira",             slug: "jira",            status: "Connected"   },
  { name: "Linear",           slug: "linear",          status: "Connected"   },
  { name: "ClickUp",          slug: "clickup",         status: "Coming Soon" },
  { name: "Trello",           slug: "trello",          status: "Available"   },
  { name: "Notion",           slug: "notion",          status: "Connected"   },
  { name: "Confluence",       slug: "confluence",      status: "Available"   },
  { name: "Figma",            slug: "figma",           status: "Connected"   },
  { name: "Miro",             slug: "miro",            status: "Available"   },
  { name: "Discord",          slug: "discord",         status: "Connected"   },
  { name: "Zoom",             slug: "zoom",            status: "Available"   },
  { name: "HubSpot",          slug: "hubspot",         status: "Available"   },
  { name: "Salesforce",       slug: "salesforce",      status: "Coming Soon" },
  { name: "Stripe",           slug: "stripe",          status: "Connected"   },
  { name: "Zapier",           slug: "zapier",          status: "Connected"   },
  { name: "Cloudflare",       slug: "cloudflare",      status: "Available"   },
  { name: "AWS",              slug: "amazonaws",       status: "Connected"   },
  { name: "Azure",            slug: "microsoftazure",  status: "Coming Soon" },
  { name: "Vercel",           slug: "vercel",          status: "Connected"   },
  { name: "Netlify",          slug: "netlify",         status: "Available"   },
  { name: "MongoDB",          slug: "mongodb",         status: "Available"   },
  { name: "Postman",          slug: "postman",         status: "Available"   },
  { name: "OpenAI",           slug: "openai",          status: "Connected"   },
  { name: "Anthropic",        slug: "anthropic",       status: "Connected"   },
];

/* ─── Icon with CSS colour filter ───────────────────────────────── */
function BrandIcon({ slug, size = 28 }: { slug: string; size?: number }) {
  const brand = brandColors[slug] ?? { bg: "#F3F4F6", icon: "#6B7280" };

  // Convert hex to a CSS color filter using a data-uri approach.
  // Simple-icons SVGs are black. We'll tint them with a coloured bg box.
  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:rotate-[6deg] group-hover:scale-110"
      style={{
        width: 44,
        height: 44,
        background: brand.bg,
        boxShadow: `0 2px 8px color-mix(in srgb, ${brand.icon} 15%, transparent)`,
      }}
    >
      <img
        src={`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`}
        alt={slug}
        width={size}
        height={size}
        style={{
          // SVGs from simple-icons are black; colorise with CSS filter
          filter: slug === "notion" || slug === "anthropic" || slug === "vercel" || slug === "github"
            ? "none"  // keep black for these
            : `invert(1) sepia(1) saturate(10) hue-rotate(0deg)`,
        }}
        onLoad={(e) => {
          // After load, apply the exact brand hue via inline filter
          const img = e.currentTarget;
          img.style.filter = colorToFilter(brand.icon);
        }}
      />
    </div>
  );
}

/*
  Approximate CSS filter chain to re-colour a black SVG to a given hex.
  Uses a precomputed lookup for common hues — enough for brand colours.
*/
function colorToFilter(hex: string): string {
  // For simplicity, use brightness + hue-rotate + saturate to approximate brand colors
  // We'll take a simpler approach: sepia → hue-rotate
  const hueMap: Record<string, string> = {
    "#EA4335": "invert(29%) sepia(93%) saturate(1352%) hue-rotate(343deg) brightness(95%) contrast(101%)",
    "#F9AB00": "invert(72%) sepia(61%) saturate(700%) hue-rotate(1deg) brightness(101%) contrast(101%)",
    "#34A853": "invert(55%) sepia(61%) saturate(400%) hue-rotate(88deg) brightness(92%) contrast(89%)",
    "#1A73E8": "invert(31%) sepia(98%) saturate(1170%) hue-rotate(199deg) brightness(100%) contrast(96%)",
    "#E01E5A": "invert(16%) sepia(94%) saturate(3000%) hue-rotate(316deg) brightness(88%) contrast(96%)",
    "#6264A7": "invert(34%) sepia(24%) saturate(1200%) hue-rotate(210deg) brightness(90%) contrast(87%)",
    "#24292F": "invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(20%) contrast(100%)",
    "#FC6D26": "invert(52%) sepia(64%) saturate(1100%) hue-rotate(349deg) brightness(101%) contrast(100%)",
    "#0052CC": "invert(16%) sepia(90%) saturate(1600%) hue-rotate(209deg) brightness(90%) contrast(101%)",
    "#5E6AD2": "invert(40%) sepia(30%) saturate(1400%) hue-rotate(209deg) brightness(90%) contrast(90%)",
    "#FF1966": "invert(18%) sepia(95%) saturate(3500%) hue-rotate(325deg) brightness(95%) contrast(101%)",
    "#F24E1E": "invert(43%) sepia(72%) saturate(1200%) hue-rotate(352deg) brightness(101%) contrast(99%)",
    "#FFD02F": "invert(82%) sepia(60%) saturate(700%) hue-rotate(4deg) brightness(106%) contrast(103%)",
    "#5865F2": "invert(39%) sepia(60%) saturate(2000%) hue-rotate(220deg) brightness(97%) contrast(97%)",
    "#2D8CFF": "invert(46%) sepia(72%) saturate(1400%) hue-rotate(196deg) brightness(101%) contrast(101%)",
    "#FF7A59": "invert(56%) sepia(65%) saturate(800%) hue-rotate(338deg) brightness(102%) contrast(102%)",
    "#00A1E0": "invert(48%) sepia(80%) saturate(900%) hue-rotate(177deg) brightness(97%) contrast(101%)",
    "#635BFF": "invert(38%) sepia(50%) saturate(3000%) hue-rotate(235deg) brightness(100%) contrast(101%)",
    "#FF4A00": "invert(44%) sepia(92%) saturate(1200%) hue-rotate(352deg) brightness(102%) contrast(101%)",
    "#F38020": "invert(57%) sepia(60%) saturate(900%) hue-rotate(358deg) brightness(102%) contrast(101%)",
    "#FF9900": "invert(64%) sepia(72%) saturate(900%) hue-rotate(358deg) brightness(101%) contrast(101%)",
    "#0078D4": "invert(33%) sepia(78%) saturate(1200%) hue-rotate(193deg) brightness(98%) contrast(101%)",
    "#00AD9F": "invert(54%) sepia(62%) saturate(700%) hue-rotate(147deg) brightness(91%) contrast(101%)",
    "#47A248": "invert(55%) sepia(46%) saturate(500%) hue-rotate(85deg) brightness(89%) contrast(86%)",
    "#FF6C37": "invert(53%) sepia(72%) saturate(900%) hue-rotate(345deg) brightness(102%) contrast(101%)",
    "#10A37F": "invert(53%) sepia(61%) saturate(600%) hue-rotate(128deg) brightness(90%) contrast(90%)",
    "#191919": "invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(10%) contrast(100%)",
    "#000000": "invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%)",
  };
  return hueMap[hex] ?? "none";
}

/* ─── Integration Card ───────────────────────────────────────────── */
function IntCard({
  integration, id, isPulsing, isHovered, onEnter, onLeave,
}: {
  integration: (typeof enterpriseIntegrations)[number];
  id: string; isPulsing: boolean; isHovered: boolean;
  onEnter: () => void; onLeave: () => void;
}) {
  const brand = brandColors[integration.slug] ?? { bg: "#F3F4F6", icon: "#6B7280" };
  const isConnected = integration.status === "Connected";
  const isComing    = integration.status === "Coming Soon";

  return (
    <div
      id={id}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="relative flex h-[76px] w-[260px] shrink-0 items-center gap-3 rounded-2xl px-4 cursor-pointer group transition-all duration-300"
      style={{
        background:   isHovered ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.75)",
        border:       isHovered
          ? `1.5px solid color-mix(in srgb, ${brand.icon} 30%, #e5e7eb)`
          : "1.5px solid rgba(255,255,255,0.7)",
        boxShadow:    isHovered
          ? `0 12px 32px -4px color-mix(in srgb, ${brand.icon} 22%, transparent), 0 1px 0 white inset`
          : isPulsing
          ? `0 0 20px color-mix(in srgb, ${brand.icon} 25%, transparent)`
          : "0 2px 8px rgba(0,0,0,0.04)",
        transform:    isHovered ? "translateY(-3px) scale(1.03)" : isPulsing ? "scale(1.01)" : "none",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Subtle left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-opacity duration-300"
        style={{ background: brand.icon, opacity: isHovered || isConnected ? 0.7 : 0 }}
      />

      <BrandIcon slug={integration.slug} />

      <div className="flex flex-col justify-center min-w-0 flex-1">
        <span className="text-[13px] font-bold text-gray-800 truncate leading-tight">
          {integration.name}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isConnected ? "animate-pulse" : ""}`}
            style={{
              background: isConnected ? "#22C55E" : isComing ? "#6C4CF1" : "#CBD5E1",
              boxShadow: isConnected ? "0 0 6px rgba(34,197,94,0.7)" : isComing ? "0 0 6px rgba(108,76,241,0.6)" : "none",
            }}
          />
          <span
            className="text-[10px] font-black tracking-wider uppercase"
            style={{
              color: isConnected ? "#16A34A" : isComing ? "#6C4CF1" : "#94A3B8",
            }}
          >
            {integration.status}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main section ───────────────────────────────────────────────── */
export function IntegrationsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [pulsing, setPulsing]         = useState<number | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mx = useSpring(x, { stiffness: 50, damping: 20 });
  const my = useSpring(y, { stiffness: 50, damping: 20 });
  const rotateX = useTransform(my, [-0.5, 0.5], ["1deg", "-1deg"]);
  const rotateY = useTransform(mx, [-0.5, 0.5], ["-1deg", "1deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top)  / r.height - 0.5);
  };

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  useEffect(() => {
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * enterpriseIntegrations.length);
      setPulsing(idx);
      setTimeout(() => setPulsing(null), 1800);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const row1 = enterpriseIntegrations.slice(0, 16);
  const row2 = enterpriseIntegrations.slice(16);

  return (
    <section
      id="integrations"
      ref={containerRef}
      className="relative border-y border-border bg-background py-28 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {/* Colourful ambient blobs */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(108,76,241,0.08), transparent 70%)" }} />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.07), transparent 70%)" }} />
        <div className="absolute bottom-1/4 left-1/2 w-[300px] h-[300px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(234,67,53,0.05), transparent 70%)" }} />
      </motion.div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-[11px] font-black tracking-[0.22em] text-primary uppercase mb-3">
            50+ Enterprise Integrations
          </p>
          <h2 className="text-3xl md:text-[48px] font-black tracking-tight mb-4 leading-[1.05]">
            Works with the tools your{" "}
            <span className="text-gradient">team already uses</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Apex securely connects with your existing stack to build one unified Company Brain — no migration required.
          </p>
        </motion.div>

        {/* Glass panel with marquees */}
        <motion.div
          style={{ rotateX, rotateY, transformPerspective: 2000 }}
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative rounded-[28px] overflow-hidden py-10"
          style2={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.6), rgba(249,250,251,0.8))",
            border: "1.5px solid rgba(255,255,255,0.7)",
            boxShadow: "0 20px 60px -10px rgba(108,76,241,0.1), 0 1px 0 rgba(255,255,255,0.9) inset",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Moving light reflection */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: useTransform(
                [mx, my],
                ([lx, ly]) =>
                  `radial-gradient(900px circle at ${(lx as number) * 100 + 50}% ${(ly as number) * 100 + 50}%, rgba(255,255,255,0.18), transparent 55%)`
              ),
            }}
          />

          <div className="relative z-10 flex flex-col gap-5 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] group/marquee">

            {/* Row 1 — forward */}
            <div className="flex w-max gap-4 px-4 animate-[marquee_55s_linear_infinite] group-hover/marquee:[animation-play-state:paused]">
              {[...row1, ...row1].map((item, i) => {
                const id = `r1-${item.slug}-${i}`;
                return (
                  <IntCard
                    key={id} id={id} integration={item}
                    isPulsing={pulsing === i % 16}
                    isHovered={hoveredCard === id}
                    onEnter={() => setHoveredCard(id)}
                    onLeave={() => setHoveredCard(null)}
                  />
                );
              })}
            </div>

            {/* Row 2 — reverse */}
            <div className="flex w-max gap-4 px-4 ml-[-220px] animate-[marquee_48s_linear_infinite_reverse] group-hover/marquee:[animation-play-state:paused]">
              {[...row2, ...row2].map((item, i) => {
                const id = `r2-${item.slug}-${i}`;
                return (
                  <IntCard
                    key={id} id={id} integration={item}
                    isPulsing={pulsing === (i % 16) + 16}
                    isHovered={hoveredCard === id}
                    onEnter={() => setHoveredCard(id)}
                    onLeave={() => setHoveredCard(null)}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: Shield,    label: "OAuth 2.0",          color: "#6C4CF1" },
            { icon: Lock,      label: "End-to-End Encrypted", color: "#0EA5E9" },
            { icon: RefreshCw, label: "Real-Time Sync",       color: "#10B981" },
            { icon: Server,    label: "Enterprise Security",  color: "#F59E0B" },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-[12px] font-bold"
              style={{
                background: `color-mix(in srgb, ${color} 8%, white)`,
                borderColor: `color-mix(in srgb, ${color} 20%, #e5e7eb)`,
                color,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          ))}
        </motion.div>

      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0);    }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
