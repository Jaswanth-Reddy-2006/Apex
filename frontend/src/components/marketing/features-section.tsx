import { motion } from "framer-motion";
import { Database, BrainCircuit, Zap, Users2, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Unify Your Data",
    description: "Connect all your tools and centralize your data in one secure, queryable place.",
    color: "from-blue-500 to-cyan-400"
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Insights",
    description: "Get instant answers, summaries, and predictive recommendations directly from your company data.",
    color: "from-purple-500 to-fuchsia-400"
  },
  {
    icon: Zap,
    title: "Automate Workflows",
    description: "Automate repetitive manual tasks and save your team hours of context-switching every week.",
    color: "from-amber-500 to-orange-400"
  },
  {
    icon: Users2,
    title: "Real-Time Collaboration",
    description: "Keep your entire organization aligned with multiplayer workspaces and smart notifications.",
    color: "from-emerald-500 to-teal-400"
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Ready",
    description: "Built from the ground up with row-level security, SOC2 compliance, and performance at scale.",
    color: "from-rose-500 to-pink-400"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  }
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 bg-secondary/30 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Everything Connected. <span className="text-gradient">Everything Smart.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Bring all your apps, data, and teams into one intelligent platform that understands your work and helps you move significantly faster.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            // First two cards are wider on tablet, but on desktop they are all 1/5th.
            // Actually, a 5-column grid on large screens, or 3-top 2-bottom on md. 
            // Let's use a nice wrapping flex or specific col spans.
            const colSpanClass = index < 2 ? "md:col-span-1 lg:col-span-1" : 
                                 index === 2 ? "md:col-span-2 lg:col-span-1" : 
                                 "md:col-span-1 lg:col-span-1";

            return (
              <motion.div 
                key={feature.title}
                variants={cardVariants}
                className={`relative group rounded-[24px] bg-white p-8 border border-border/60 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-2 ${colSpanClass}`}
              >
                {/* Subtle gradient border effect on hover */}
                <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center text-center h-full">
                  <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${feature.color} bg-opacity-10`}>
                    <div className="w-full h-full rounded-2xl bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                       <Icon className="w-6 h-6 text-foreground group-hover:-translate-y-1 transition-transform duration-300" />
                    </div>
                  </div>
                  
                  <h3 className="text-[17px] font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-[14px] text-muted-foreground leading-relaxed mt-auto">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
