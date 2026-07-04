import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AppWindow, Link2, Settings2, Network, Database, BrainCircuit, Bot, LayoutDashboard, ArrowDown } from "lucide-react";

const architectureSteps = [
  { icon: AppWindow, title: "Source Apps", desc: "Your existing enterprise tools" },
  { icon: Link2, title: "Connectors", desc: "Secure OAuth 2.0 API integrations" },
  { icon: Settings2, title: "Processing Engine", desc: "Data normalization & cleaning" },
  { icon: Network, title: "Knowledge Graph", desc: "Mapping relationships between entities" },
  { icon: Database, title: "Vector Database", desc: "Semantic embedding storage" },
  { icon: BrainCircuit, title: "Large Language Model", desc: "Reasoning and understanding" },
  { icon: Bot, title: "AI Agents", desc: "Autonomous task execution" },
  { icon: LayoutDashboard, title: "Unified Dashboard", desc: "Real-time insights interface" }
];

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  return (
    <section ref={containerRef} className="py-32 bg-secondary/30 relative overflow-hidden">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            The Architecture of <span className="text-gradient">Intelligence</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base text-muted-foreground"
          >
            How data flows from your tools into actionable insights.
          </motion.p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute top-0 bottom-0 left-[27px] md:left-1/2 w-0.5 bg-border/50 md:-translate-x-1/2" />
          
          {/* Animated Highlight Line */}
          <motion.div 
            className="absolute top-0 left-[27px] md:left-1/2 w-0.5 bg-gradient-to-b from-primary via-blue-500 to-primary origin-top md:-translate-x-1/2"
            style={{ scaleY: scrollYProgress }}
          />

          <div className="space-y-8 relative z-10">
            {architectureSteps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              const triggerPoint = index / (architectureSteps.length - 1);
              const isActive = useTransform(scrollYProgress, 
                [Math.max(0, triggerPoint - 0.1), triggerPoint], 
                [0, 1]
              );

              return (
                <div key={step.title} className={`flex items-center gap-6 md:gap-0 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  
                  {/* Left Side (Empty on mobile, alternating on desktop) */}
                  <div className={`hidden md:flex flex-1 ${isEven ? 'justify-end pr-12' : 'justify-start pl-12'}`}>
                    <motion.div 
                      initial={{ opacity: 0, x: isEven ? 20 : -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: 0.2 }}
                      className={`text-left ${isEven ? 'md:text-right' : ''}`}
                    >
                      <h4 className="text-lg font-bold text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </motion.div>
                  </div>

                  {/* Center Node */}
                  <div className="relative shrink-0 flex items-center justify-center w-14 h-14">
                    <motion.div 
                      style={{ opacity: isActive, scale: isActive }}
                      className="absolute inset-0 bg-primary/20 rounded-full blur-md"
                    />
                    <motion.div 
                      className="w-14 h-14 rounded-2xl bg-white border border-border/60 shadow-sm flex items-center justify-center relative z-10 transition-colors duration-300"
                      style={{
                        borderColor: useTransform(isActive, [0, 1], ["#E5E7EB", "#6C4CF1"]),
                        backgroundColor: useTransform(isActive, [0, 1], ["#ffffff", "#F0EEFD"])
                      }}
                    >
                      <Icon className="w-5 h-5 text-foreground" />
                    </motion.div>
                  </div>

                  {/* Right Side (Content on mobile, alternating on desktop) */}
                  <div className={`flex-1 md:hidden`}>
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: 0.2 }}
                    >
                      <h4 className="text-[15px] font-bold text-foreground">{step.title}</h4>
                      <p className="text-[13px] text-muted-foreground">{step.desc}</p>
                    </motion.div>
                  </div>
                  <div className={`hidden md:flex flex-1 ${!isEven ? 'justify-end pr-12 opacity-0' : 'justify-start pl-12 opacity-0'}`}>
                    {/* Placeholder for layout balance on desktop */}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
