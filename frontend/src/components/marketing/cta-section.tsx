import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-[32px] overflow-hidden bg-primary p-12 md:p-20 text-center"
        >
          {/* Subtle abstract background textures for the CTA box */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30 mix-blend-overlay" />
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent blur-2xl pointer-events-none" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
              Ready to build your <br className="hidden md:block" />
              Company Brain?
            </h2>
            <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Join thousands of fast-growing teams already using Apex AI to unify their knowledge, automate workflows, and make faster decisions.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link to="/auth">
                <Button className="h-14 px-8 text-base font-semibold rounded-2xl bg-white text-primary hover:bg-white/90 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" className="h-14 px-8 text-base font-semibold rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm hover:-translate-y-1 transition-all duration-300">
                <Calendar className="mr-2 w-5 h-5" />
                Book a Demo
              </Button>
            </div>
            
            <p className="text-primary-foreground/60 text-sm mt-8">
              No credit card required. 14-day free trial on enterprise plans.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
