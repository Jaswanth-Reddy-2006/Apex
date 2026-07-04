import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Plug, Brain, Cpu, MessageSquare, Workflow, LineChart, LayoutDashboard } from "lucide-react";

const steps = [
  { icon: Plug, title: "Connect Apps", desc: "Sync all your SaaS tools in one click" },
  { icon: Brain, title: "Company Brain", desc: "Builds a unified corporate semantic graph" },
  { icon: Cpu, title: "AI Understanding", desc: "Deep reasoning across structured data" },
  { icon: MessageSquare, title: "Recommendations", desc: "Contextual answers and proactive alerts" },
  { icon: Workflow, title: "Automation", desc: "Execute automated multi-app tasks" },
  { icon: LineChart, title: "Insights", desc: "Trace performance bottlenecks" },
  { icon: LayoutDashboard, title: "Dashboard", desc: "Real-time analytics and management" }
];

export function WorkflowSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  return (
    <section ref={containerRef} className="py-32 bg-background relative overflow-hidden">
      
      {/* Aurora Backdrop (Antimorphism / Auroramorphism) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-primary/10 blur-[100px] opacity-70"
        />
        <motion.div 
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 20, -30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[120px] opacity-60"
        />
        <motion.div 
          animate={{
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-400/5 blur-[130px] opacity-50"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-24">
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-widest text-primary uppercase mb-4"
          >
            Operation Pipeline
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            How the <span className="text-gradient">AI Workflow</span> operates.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-muted-foreground text-base max-w-2xl mx-auto"
          >
            Watch how data traverses from connection to intelligence in real-time.
          </motion.p>
        </div>

        {/* Glass Container wrapping the timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[32px] border border-white/40 bg-white/20 backdrop-blur-[24px] shadow-elegant p-10 md:p-16 overflow-hidden"
        >
          {/* Inner Light Reflection Outline */}
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-white/10 to-transparent pointer-events-none opacity-40" />

          <div className="relative">
            {/* Background Connector Pipe (Glassy Tube) */}
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-white/30 backdrop-blur-sm border border-white/20 rounded-full -translate-y-1/2 hidden md:block shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]" />
            
            {/* Animated Highlight Fill */}
            <motion.div 
              className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-primary via-blue-500 to-primary origin-left -translate-y-1/2 hidden md:block rounded-full shadow-[0_0_10px_rgba(108,76,241,0.5)]"
              style={{ scaleX: scrollYProgress }}
            />

            <div className="flex flex-col md:flex-row justify-between relative z-10 gap-10 md:gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                
                const triggerPoint = index / (steps.length - 1);
                
                // Active status peaks exactly at trigger point and settles down to 0.25
                const isActive = useTransform(scrollYProgress, 
                  [
                    Math.max(0, triggerPoint - 0.08), 
                    triggerPoint, 
                    Math.min(1, triggerPoint + 0.08)
                  ], 
                  [0, 1, 0.25]
                );
                
                return (
                  <div key={step.title} className="flex flex-col items-center flex-1 group">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: index * 0.08, type: "spring", stiffness: 120 }}
                      className="relative"
                    >
                      {/* Active Aurora Glow behind node */}
                      <motion.div 
                        style={{ 
                          opacity: isActive, 
                          scale: useTransform(isActive, [0, 0.25, 1], [0.8, 0.9, 1.25]) 
                        }}
                        className="absolute inset-[-8px] bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-[28px] blur-lg pointer-events-none"
                      />
                      
                      {/* Glass Node */}
                      <motion.div 
                        className="w-20 h-20 rounded-[24px] flex items-center justify-center relative z-10 transition-all duration-500 cursor-pointer group-hover:scale-110 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.04)]"
                        style={{
                          borderColor: useTransform(isActive, [0, 0.25, 1], ["rgba(255,255,255,0.4)", "rgba(108,76,241,0.4)", "#6C4CF1"]),
                          borderWidth: "1.5px",
                          backgroundColor: useTransform(isActive, [0, 0.25, 1], ["rgba(255,255,255,0.4)", "rgba(108,76,241,0.02)", "rgba(108,76,241,0.08)"]),
                          color: useTransform(isActive, [0, 0.25, 1], ["#111827", "#6C4CF1", "#6C4CF1"]),
                          boxShadow: useTransform(isActive, [0, 0.25, 1], [
                            "inset 0 1px 1px rgba(255,255,255,0.6), 0 8px 24px -8px rgba(0,0,0,0.06)",
                            "inset 0 1px 1px rgba(255,255,255,0.7), 0 8px 24px -8px rgba(108,76,241,0.08)",
                            "inset 0 1px 1px rgba(255,255,255,0.8), 0 16px 36px rgba(108,76,241,0.35)"
                          ])
                        }}
                      >
                        {/* Glowing ring inside node */}
                        <motion.div 
                          style={{ opacity: isActive }}
                          className="absolute inset-[3px] border border-primary/20 rounded-[20px] pointer-events-none"
                        />
                        
                        <Icon className="w-7 h-7 text-current" />
                      </motion.div>
                    </motion.div>
                    
                    {/* Step Title & Label */}
                    <div className="text-center mt-6 max-w-[160px] md:max-w-[100px] flex flex-col items-center">
                      <motion.h4 
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08 + 0.15 }}
                        className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors duration-300"
                      >
                        {step.title}
                      </motion.h4>
                      <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 0.6 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08 + 0.2 }}
                        className="text-[10px] text-muted-foreground leading-snug mt-1 hidden md:block"
                      >
                        {step.desc}
                      </motion.p>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
