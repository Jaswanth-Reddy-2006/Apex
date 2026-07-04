import { motion } from "framer-motion";
import { ShieldCheck, Lock, Key, FileCheck, Eye, Users, Fingerprint } from "lucide-react";

const securityFeatures = [
  { icon: Lock, title: "End-to-End Encryption", desc: "AES-256 encryption at rest and TLS 1.3 in transit." },
  { icon: ShieldCheck, title: "SOC2 Type II", desc: "Independently audited and certified for enterprise security." },
  { icon: FileCheck, title: "GDPR & HIPAA", desc: "Fully compliant with global data privacy regulations." },
  { icon: Key, title: "OAuth 2.0 & SAML SSO", desc: "Seamless integration with Okta, Google, and Azure AD." },
  { icon: Eye, title: "Detailed Audit Logs", desc: "Track every query, action, and access request in real-time." },
  { icon: Users, title: "Role-Based Access", desc: "Granular permissions down to the row level." },
  { icon: Fingerprint, title: "Zero Trust Architecture", desc: "Strict verification for every user and device." }
];

export function SecuritySection() {
  return (
    <section id="security" className="py-32 bg-background relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] mix-blend-multiply opacity-50" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-20">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-widest text-primary uppercase mb-4"
          >
            Bank-Grade Security
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Enterprise security is our <span className="text-gradient">baseline.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center">
          {securityFeatures.map((feature, i) => {
            const Icon = feature.icon;
            // Make the first card span 2 cols on lg screens to break the grid nicely if there are 7 items
            const isFeatured = i === 0;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
                className={`relative group rounded-[24px] border border-border bg-card p-6 overflow-hidden hover:-translate-y-1 transition-all duration-300 ${isFeatured ? 'lg:col-span-2' : ''}`}
              >
                {/* Hover Glow Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 text-primary group-hover:scale-110 group-hover:text-primary transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-[17px] font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-[14px] text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
