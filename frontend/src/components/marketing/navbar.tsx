import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Product",      href: "#product"      },
  { label: "Features",     href: "#features"     },
  { label: "Integrations", href: "#integrations" },
  { label: "Pricing",      href: "#pricing"      },
  { label: "Resources",    href: "#resources"    },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobile]   = useState(false);
  const [activeLink, setActive]   = useState<string | null>(null);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 30));

  return (
    <>
      {/* ── Main nav bar ────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4"
      >
        {/*
          The pill: starts fully transparent, turns into a floating
          glassmorphism capsule once scrolled.
        */}
        <motion.div
          animate={{
            backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(0px)",
            backgroundColor: scrolled ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0)",
            borderColor:     scrolled ? "rgba(255,255,255,0.7)"   : "rgba(255,255,255,0)",
            boxShadow: scrolled
              ? "0 8px 32px -4px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px rgba(108,76,241,0.06)"
              : "none",
            paddingLeft:  scrolled ? "20px" : "0px",
            paddingRight: scrolled ? "20px" : "0px",
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="w-full max-w-5xl flex items-center justify-between h-14 border rounded-[18px]"
        >

          {/* ── Logo ────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
              <motion.div
                className="absolute inset-0 bg-white/20"
                whileHover={{ scale: 1.6, rotate: 45 }}
                transition={{ duration: 0.4 }}
              />
              <span className="relative text-white font-black text-[15px] leading-none">A</span>
            </div>
            <span className="text-[17px] font-black tracking-tight text-gray-900 group-hover:text-primary transition-colors">
              APEX
            </span>
          </Link>

          {/* ── Center nav links ────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onMouseEnter={() => setActive(link.label)}
                onMouseLeave={() => setActive(null)}
                className="relative px-3.5 py-2 rounded-[10px] text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                {/* Hover pill bg */}
                <AnimatePresence>
                  {activeLink === link.label && (
                    <motion.span
                      layoutId="nav-hover-pill"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="absolute inset-0 rounded-[10px] bg-gray-100/80"
                    />
                  )}
                </AnimatePresence>
                <span className="relative z-10">{link.label}</span>
              </a>
            ))}
          </nav>

          {/* ── Right actions ───────────────────────────────────── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Log in — text only */}
            <Link
              to="/auth"
              className="hidden sm:block text-[14px] font-semibold text-gray-500 hover:text-gray-900 transition-colors px-3 py-2 rounded-[10px] hover:bg-gray-100/70"
            >
              Log in
            </Link>

            {/* CTA button — Shepherd-style pill with arrow */}
            <Link to="/auth">
              <motion.div
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 pl-4 pr-3 py-2 rounded-[12px] text-[14px] font-bold text-white cursor-pointer select-none"
                style={{
                  background: "linear-gradient(135deg, #6C4CF1 0%, #8B5CF6 100%)",
                  boxShadow: "0 4px 16px rgba(108,76,241,0.35), inset 0 1px 1px rgba(255,255,255,0.2)",
                }}
              >
                Get Started
                <span
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20"
                >
                  <ArrowUpRight className="w-3 h-3 text-white" strokeWidth={2.5} />
                </span>
              </motion.div>
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobile((o) => !o)}
              className="md:hidden ml-1 p-2 rounded-[10px] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      </motion.header>

      {/* ── Mobile menu ─────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-[76px] left-4 right-4 z-40 rounded-[20px] border border-white/70 overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(24px) saturate(180%)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.9) inset",
            }}
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setMobile(false)}
                  className="px-4 py-3 rounded-[12px] text-[15px] font-semibold text-gray-700 hover:bg-gray-100 hover:text-primary transition-all"
                >
                  {link.label}
                </motion.a>
              ))}

              <div className="mt-2 pt-3 border-t border-gray-100 flex flex-col gap-2">
                <Link
                  to="/auth"
                  className="px-4 py-3 rounded-[12px] text-[15px] font-semibold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Log in
                </Link>
                <Link to="/auth">
                  <div
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-[14px] text-[15px] font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #6C4CF1, #8B5CF6)",
                      boxShadow: "0 4px 16px rgba(108,76,241,0.3)",
                    }}
                  >
                    Get Started Free
                    <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
