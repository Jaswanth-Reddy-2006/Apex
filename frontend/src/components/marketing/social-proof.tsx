import { motion } from "framer-motion";
import CountUp from "react-countup";

const CountUpComponent = (CountUp as any).default || CountUp;

const stats = [
  { label: "Happy Teams", value: 2000, suffix: "+", decimals: 0 },
  { label: "Integrations", value: 50, suffix: "+", decimals: 0 },
  { label: "Uptime", value: 99.9, suffix: "%", decimals: 1 },
  { label: "Customer Rating", value: 4.9, suffix: "/5", decimals: 1 }
];

export function SocialProofSection() {
  return (
    <section className="py-24 bg-secondary/30 relative border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Animated Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-border/50">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center justify-center text-center px-4"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-2 flex items-center">
                <CountUpComponent 
                  end={stat.value} 
                  decimals={stat.decimals}
                  duration={2.5} 
                  viewport={{ once: true }} 
                  useEasing 
                />
                <span>{stat.suffix}</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </p>
              
              {stat.label === "Customer Rating" && (
                <div className="flex gap-1 mt-2 text-yellow-400">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-[10px]">★</span>)}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Large Testimonial */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-32 max-w-4xl mx-auto text-center"
        >
          <div className="text-6xl text-primary/20 font-serif leading-none mb-6">“</div>
          <h3 className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed">
            Apex AI is like having a second brain for our entire company. It connects everything and saves our engineering and sales teams hours of manual digging every single day.
          </h3>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Sarah" alt="Sarah Johnson" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">Sarah Johnson</p>
              <p className="text-xs text-muted-foreground">CTO at NextFlow</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
