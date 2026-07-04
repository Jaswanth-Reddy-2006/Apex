import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, TrendingUp, Bell, User, Search, Settings } from "lucide-react";
import CountUp from "react-countup";

const CountUpComponent = (CountUp as any).default || CountUp;


export function DashboardShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Subtle scroll parallax for the whole section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  const yOffset = useTransform(scrollYProgress, [0, 1], [50, -50]);

  // Mouse Parallax for the dashboard frame
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 50, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 50, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["2deg", "-2deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-2deg", "2deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section 
      ref={containerRef} 
      className="py-32 bg-background relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Copy & CTA */}
          <motion.div 
            style={{ y: yOffset }}
            className="flex flex-col gap-6"
          >
            <p className="text-xs font-bold tracking-widest text-primary uppercase">
              Live Insights
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              All Your Company Intelligence in <span className="text-gradient">One Place</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Go beyond simple dashboards. Apex AI gives you deep visibility across projects, teams, tools, and workflows, allowing you to proactively identify bottlenecks before they happen.
            </p>
            
            <ul className="space-y-4 mt-2">
              {["Real-time project tracking", "Team performance analytics", "AI-driven risk recommendations", "Automated executive reports"].map((item, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center gap-3 text-[15px] font-medium text-foreground/80"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  {item}
                </motion.li>
              ))}
            </ul>

            <div className="mt-6">
              <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
                Explore Dashboard
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>

          {/* Right: Interactive Dashboard */}
          <div className="relative perspective-[2000px] z-10 hidden md:block">
            <motion.div
              style={{ rotateX, rotateY }}
              className="relative w-[110%] -ml-[5%] rounded-2xl border border-white/60 bg-[#F8F9FC]/90 backdrop-blur-xl shadow-[0_24px_80px_-12px_rgba(108,76,241,0.2)] overflow-hidden flex flex-col"
            >
              {/* Fake Browser Header */}
              <div className="h-12 border-b border-border/50 bg-white/50 flex items-center px-4 gap-2 shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="mx-auto w-1/2 h-6 bg-white rounded-md border border-border/40 flex items-center justify-center text-[10px] text-muted-foreground">
                  <Search className="w-3 h-3 mr-1" /> apex.ai/dashboard
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 grid grid-cols-12 gap-6 h-[500px]">
                
                {/* Sidebar Mock */}
                <div className="col-span-3 flex flex-col gap-4 border-r border-border/50 pr-6">
                  <div className="flex items-center gap-2 mb-4">
                     <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white text-[10px] font-bold">A</div>
                     <span className="font-bold text-sm">APEX</span>
                  </div>
                  {[
                    { label: "Dashboard", active: true },
                    { label: "AI Chat", active: false },
                    { label: "Projects", active: false },
                    { label: "Members", active: false },
                    { label: "Integrations", active: false },
                    { label: "Settings", active: false },
                  ].map((item, i) => (
                    <div key={i} className={`text-[12px] font-medium py-2 px-3 rounded-md transition-colors cursor-pointer ${item.active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/5 hover:text-foreground'}`}>
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Main Content Mock */}
                <div className="col-span-9 flex flex-col gap-6">
                  
                  {/* Top Bar */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Good morning, Sarah 👋</h3>
                      <p className="text-xs text-muted-foreground">Here's what's happening in your workspace today.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center"><Bell className="w-4 h-4 text-muted-foreground" /></div>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <KPICard title="Active Projects" value={24} trend={12} color="text-green-500" />
                    <KPICard title="Tasks Completed" value={128} trend={8} color="text-primary" />
                    <KPICard title="Team Members" value={42} trend={5} color="text-blue-500" />
                  </div>

                  {/* Charts & Activity */}
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    
                    {/* Chart Area */}
                    <div className="bg-white border border-border/50 rounded-xl p-4 flex flex-col relative overflow-hidden">
                      <h4 className="text-xs font-semibold mb-4">AI Summary</h4>
                      <ul className="space-y-3 text-[11px] text-muted-foreground flex-1">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> 3 PRs merged this morning</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 12 tasks completed on time</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> 2 blockers found in API design</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Marketing campaign started</li>
                      </ul>
                      <div className="absolute bottom-4 right-4">
                        <Button size="sm" className="h-7 text-[10px] bg-primary/10 text-primary hover:bg-primary/20">Ask Apex AI</Button>
                      </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="bg-white border border-border/50 rounded-xl p-4">
                      <h4 className="text-xs font-semibold mb-4">Recent Activity</h4>
                      <div className="space-y-4">
                        {[1, 2, 3].map((_, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 * i }}
                            className="flex items-center gap-3"
                          >
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i+10}`} alt="avatar" className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${80 - (i * 20)}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="h-full bg-primary/40" 
                                />
                              </div>
                            </div>
                          </motion.div>
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

function KPICard({ title, value, trend, color }: { title: string, value: number, trend: number, color: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white border border-border/50 p-4 rounded-xl shadow-sm flex flex-col justify-between"
    >
      <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
      <div className="mt-2">
        <span className="text-2xl font-bold text-foreground">
          <CountUpComponent end={value} duration={2.5} viewport={{ once: true }} />
        </span>
      </div>
      <div className={`mt-2 flex items-center gap-1 text-[10px] font-medium ${color}`}>
        <TrendingUp className="w-3 h-3" />
        +{trend}%
      </div>
    </motion.div>
  );
}
