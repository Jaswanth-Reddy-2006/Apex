import React, { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Brain, Sparkles, Code2, Database, Workflow, Shield } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse Parallax
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 50, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 50, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3deg", "-3deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3deg", "3deg"]);
  const floatY = useTransform(mouseYSpring, [-0.5, 0.5], [-10, 10]);
  const floatX = useTransform(mouseXSpring, [-0.5, 0.5], [-10, 10]);

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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[90vh] pt-32 pb-20 flex items-center overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] mix-blend-multiply opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-400/10 blur-[100px] mix-blend-multiply opacity-50" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Copy & CTAs */}
          <div className="flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-[3.5rem] leading-[1.1] sm:text-6xl lg:text-[5rem] font-extrabold tracking-tight text-foreground">
                One Company Brain.<br />
                <span className="text-gradient">Smarter Decisions.</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="text-xl text-muted-foreground max-w-xl leading-relaxed"
            >
              Apex AI securely connects with your existing software to build one unified knowledge graph that understands your business in real time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link to="/auth">
                <Button className="h-14 px-8 text-base font-semibold rounded-[16px] bg-primary hover:bg-primary/90 text-white shadow-[0_8px_20px_-4px_rgba(108,76,241,0.5)] hover:shadow-[0_12px_28px_-6px_rgba(108,76,241,0.6)] hover:-translate-y-1 transition-all duration-300">
                  Get Started Free
                </Button>
              </Link>
              <Button variant="outline" className="h-14 px-8 text-base font-semibold rounded-[16px] border-border/60 bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:shadow-sm hover:-translate-y-1 transition-all duration-300 group">
                <Play className="mr-2 h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex items-center gap-4 mt-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden z-[${4-i}]`}>
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i}&backgroundColor=e2e8f0`} alt="avatar" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(star => <span key={star} className="text-yellow-400 text-sm">★</span>)}
                </div>
                <span className="text-sm font-medium text-foreground">Loved by 2,000+ teams</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Abstract 3D Illustration */}
          <div className="relative h-[600px] w-full hidden lg:flex items-center justify-center perspective-[2000px]">
            <motion.div
              style={{ rotateX, rotateY }}
              className="relative w-[400px] h-[400px] rounded-[32px] border border-white/40 bg-white/10 backdrop-blur-2xl shadow-[0_32px_80px_-16px_rgba(108,76,241,0.15)] flex items-center justify-center transform-style-3d"
            >
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/40 to-transparent opacity-50" />
              
              {/* Central Glowing Brain */}
              <motion.div 
                animate={{ scale: [1, 1.05, 1], filter: ["blur(0px)", "blur(2px)", "blur(0px)"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Brain className="w-16 h-16 text-primary drop-shadow-[0_0_15px_rgba(108,76,241,0.5)]" />
              </motion.div>

              {/* Orbiting Elements */}
              <OrbitingIcon icon={<Database className="w-5 h-5 text-blue-500" />} radius={140} duration={15} delay={0} />
              <OrbitingIcon icon={<Workflow className="w-5 h-5 text-green-500" />} radius={180} duration={20} delay={5} />
              <OrbitingIcon icon={<Shield className="w-5 h-5 text-orange-500" />} radius={220} duration={25} delay={10} />
              <OrbitingIcon icon={<Code2 className="w-5 h-5 text-purple-500" />} radius={160} duration={18} delay={12} reverse />
              <OrbitingIcon icon={<Sparkles className="w-5 h-5 text-yellow-500" />} radius={200} duration={22} delay={8} reverse />
              
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}

function OrbitingIcon({ icon, radius, duration, delay, reverse = false }: { icon: React.ReactNode, radius: number, duration: number, delay: number, reverse?: boolean }) {
  return (
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay: -delay }}
    >
      <div 
        className="flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-lg border border-border/50"
        style={{ transform: `translateY(-${radius}px)` }}
      >
        <motion.div animate={{ rotate: reverse ? 360 : -360 }} transition={{ duration, repeat: Infinity, ease: "linear", delay: -delay }}>
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );
}
