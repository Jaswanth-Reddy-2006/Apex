import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { Shield, Lock, RefreshCw, Server } from "lucide-react";

export const enterpriseIntegrations = [
  { name: "Google Workspace", slug: "google", status: "Connected" },
  { name: "Gmail", slug: "gmail", status: "Connected" },
  { name: "Google Drive", slug: "googledrive", status: "Connected" },
  { name: "Google Calendar", slug: "googlecalendar", status: "Available" },
  { name: "Slack", slug: "slack", status: "Connected" },
  { name: "Microsoft Teams", slug: "microsoftteams", status: "Available" },
  { name: "GitHub", slug: "github", status: "Connected" },
  { name: "GitLab", slug: "gitlab", status: "Available" },
  { name: "Bitbucket", slug: "bitbucket", status: "Available" },
  { name: "Jira", slug: "jira", status: "Connected" },
  { name: "Linear", slug: "linear", status: "Connected" },
  { name: "ClickUp", slug: "clickup", status: "Coming Soon" },
  { name: "Trello", slug: "trello", status: "Available" },
  { name: "Notion", slug: "notion", status: "Connected" },
  { name: "Confluence", slug: "confluence", status: "Available" },
  { name: "Figma", slug: "figma", status: "Connected" },
  { name: "Miro", slug: "miro", status: "Available" },
  { name: "Discord", slug: "discord", status: "Connected" },
  { name: "Zoom", slug: "zoom", status: "Available" },
  { name: "HubSpot", slug: "hubspot", status: "Available" },
  { name: "Salesforce", slug: "salesforce", status: "Coming Soon" },
  { name: "Stripe", slug: "stripe", status: "Connected" },
  { name: "Zapier", slug: "zapier", status: "Connected" },
  { name: "Cloudflare", slug: "cloudflare", status: "Available" },
  { name: "AWS", slug: "amazonaws", status: "Connected" },
  { name: "Azure", slug: "microsoftazure", status: "Coming Soon" },
  { name: "Vercel", slug: "vercel", status: "Connected" },
  { name: "Netlify", slug: "netlify", status: "Available" },
  { name: "MongoDB", slug: "mongodb", status: "Available" },
  { name: "Postman", slug: "postman", status: "Available" },
  { name: "OpenAI", slug: "openai", status: "Connected" },
  { name: "Anthropic", slug: "anthropic", status: "Connected" },
];

export function IntegrationsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [randomPulseIndex, setRandomPulseIndex] = useState<number | null>(null);

  // Parallax and Mouse Tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 50, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 50, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["1deg", "-1deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-1deg", "1deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Scroll Parallax (Optional subtle vertical shift based on scroll)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  // Random Pulsing Effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random integration from the list to pulse
      const randomIdx = Math.floor(Math.random() * enterpriseIntegrations.length);
      setRandomPulseIndex(randomIdx);
      setTimeout(() => setRandomPulseIndex(null), 2000); // Clear pulse after 2s
    }, 4000); // Trigger every 4s

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="integrations"
      className="relative border-y border-border bg-background py-32 overflow-hidden"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Effects */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] opacity-60 mix-blend-screen" />
        <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[100px] opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay" />
      </motion.div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <p className="text-xs font-bold tracking-widest text-primary uppercase mb-4">
            Connects with 50+ Enterprise Tools
          </p>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            Works with the tools your team already uses
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Apex AI securely connects with your existing applications to build one unified Company Brain that understands your business in real time.
          </p>
        </motion.div>

        {/* Large Floating Glass Card with Mouse Parallax */}
        <motion.div
          style={{ rotateX, rotateY, transformPerspective: 2000 }}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="relative rounded-[24px] border border-white/40 bg-white/10 backdrop-blur-[20px] shadow-[0_16px_64px_-8px_rgba(108,76,241,0.1)] overflow-hidden p-1 py-12"
        >
          {/* Dynamic Light Reflection Layer */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
            style={{
              background: useTransform(
                [x, y],
                ([latestX, latestY]) =>
                  `radial-gradient(800px circle at ${
                    (latestX as number) * 100 + 50
                  }% ${(latestY as number) * 100 + 50}%, rgba(255,255,255,0.15) 0%, transparent 60%)`
              ),
            }}
          />
          
          {/* Infinite Marquee Container */}
          <div className="relative z-10 flex flex-col gap-6 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)] group/marquee">
            
            {/* Row 1 */}
            <div className="flex w-max animate-[marquee_50s_linear_infinite] group-hover/marquee:[animation-play-state:paused] gap-6 px-3">
              {[...enterpriseIntegrations.slice(0, 16), ...enterpriseIntegrations.slice(0, 16)].map((integration, i) => {
                const isHovered = hoveredCard === `${integration.slug}-1-${i}`;
                const isRandomPulse = randomPulseIndex === (i % 16);
                
                return (
                  <div
                    key={`${integration.slug}-1-${i}`}
                    onMouseEnter={() => setHoveredCard(`${integration.slug}-1-${i}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`
                      relative flex h-[72px] w-[280px] shrink-0 items-center gap-4 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md px-5 shadow-sm cursor-pointer group
                      transition-all duration-300 ease-out
                      hover:-translate-y-2 hover:scale-[1.05] hover:border-primary/40 hover:shadow-[0_8px_32px_0_rgba(108,76,241,0.2)] hover:bg-white/70
                      ${isRandomPulse && !isHovered ? 'shadow-[0_0_20px_0_rgba(108,76,241,0.3)] border-primary/30' : ''}
                    `}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm transition-transform duration-300 group-hover:rotate-[5deg] group-hover:scale-110">
                      <img src={`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${integration.slug}.svg`} alt={integration.name} className="h-7 w-7" />
                    </div>
                    <div className="flex flex-col justify-center overflow-hidden">
                      <span className="truncate text-[15px] font-semibold text-foreground">
                        {integration.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`
                          h-2 w-2 rounded-full 
                          ${integration.status === 'Connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : integration.status === 'Available' ? 'bg-slate-300' : 'bg-primary shadow-[0_0_8px_rgba(108,76,241,0.6)]'}
                          ${(isHovered || isRandomPulse) ? 'animate-pulse' : ''}
                        `} />
                        <span className="text-[11px] uppercase font-bold text-muted-foreground truncate tracking-wider">
                          {integration.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Row 2 (Moves slightly faster for depth, starts offset) */}
            <div className="flex w-max animate-[marquee_45s_linear_infinite_reverse] group-hover/marquee:[animation-play-state:paused] gap-6 px-3 ml-[-300px]">
              {[...enterpriseIntegrations.slice(16), ...enterpriseIntegrations.slice(16)].map((integration, i) => {
                const isHovered = hoveredCard === `${integration.slug}-2-${i}`;
                const isRandomPulse = randomPulseIndex === ((i % 16) + 16);

                return (
                  <div
                    key={`${integration.slug}-2-${i}`}
                    onMouseEnter={() => setHoveredCard(`${integration.slug}-2-${i}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`
                      relative flex h-[72px] w-[280px] shrink-0 items-center gap-4 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md px-5 shadow-sm cursor-pointer group
                      transition-all duration-300 ease-out
                      hover:-translate-y-2 hover:scale-[1.05] hover:border-primary/40 hover:shadow-[0_8px_32px_0_rgba(108,76,241,0.2)] hover:bg-white/70
                      ${isRandomPulse && !isHovered ? 'shadow-[0_0_20px_0_rgba(108,76,241,0.3)] border-primary/30' : ''}
                    `}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm transition-transform duration-300 group-hover:rotate-[5deg] group-hover:scale-110">
                      <img src={`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${integration.slug}.svg`} alt={integration.name} className="h-7 w-7" />
                    </div>
                    <div className="flex flex-col justify-center overflow-hidden">
                      <span className="truncate text-[15px] font-semibold text-foreground">
                        {integration.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`
                          h-2 w-2 rounded-full 
                          ${integration.status === 'Connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : integration.status === 'Available' ? 'bg-slate-300' : 'bg-primary shadow-[0_0_8px_rgba(108,76,241,0.6)]'}
                          ${(isHovered || isRandomPulse) ? 'animate-pulse' : ''}
                        `} />
                        <span className="text-[11px] uppercase font-bold text-muted-foreground truncate tracking-wider">
                          {integration.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </motion.div>

        {/* Trust Elements */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex flex-col items-center justify-center gap-6"
        >
          <div className="text-center">
            <p className="text-[13px] font-medium text-muted-foreground/80 mb-3">
              Trusted by teams using
            </p>
            <p className="text-sm font-semibold text-foreground tracking-wide flex gap-4 flex-wrap justify-center">
              <span>GitHub</span> <span className="text-muted-foreground/30">•</span>
              <span>Google</span> <span className="text-muted-foreground/30">•</span>
              <span>Slack</span> <span className="text-muted-foreground/30">•</span>
              <span>Notion</span> <span className="text-muted-foreground/30">•</span>
              <span>Jira</span> <span className="text-muted-foreground/30">•</span>
              <span>Figma</span> <span className="text-muted-foreground/30">•</span>
              <span>Stripe</span> <span className="text-muted-foreground/30">•</span>
              <span>AWS</span>
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              <Shield className="h-3.5 w-3.5" /> OAuth 2.0
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              <Lock className="h-3.5 w-3.5" /> Encrypted
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              <RefreshCw className="h-3.5 w-3.5" /> Real-Time Sync
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              <Server className="h-3.5 w-3.5" /> Enterprise Security
            </div>
          </div>
        </motion.div>

      </div>

      <style>{`
        @keyframes marquee { 
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } 
        }
      `}</style>
    </section>
  );
}
