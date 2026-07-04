import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const navLinks = [
    { label: "Product", href: "#product" },
    { label: "Features", href: "#features" },
    { label: "Integrations", href: "#integrations" },
    { label: "Pricing", href: "#pricing" },
    { label: "Resources", href: "#resources" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/80 backdrop-blur-[20px] shadow-sm border-b border-border/50 py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary overflow-hidden shadow-sm">
             <motion.div 
               className="absolute inset-0 bg-white/20"
               whileHover={{ scale: 1.5, rotate: 45 }}
               transition={{ duration: 0.4 }}
             />
             <span className="relative text-white font-bold text-lg leading-none">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
            APEX
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group relative text-[15px] font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full rounded-full" />
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link to="/auth" className="hidden text-[15px] font-medium text-foreground hover:text-primary transition-colors sm:block">
            Log in
          </Link>
          <Link to="/auth">
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-[12px] px-6 shadow-[0_4px_14px_0_rgba(108,76,241,0.39)] hover:shadow-[0_6px_20px_rgba(108,76,241,0.23)] transition-all">
                Get Started Free
              </Button>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
