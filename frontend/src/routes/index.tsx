import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/marketing/navbar";
import { ScrollProgress } from "@/components/marketing/scroll-progress";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { DashboardShowcase } from "@/components/marketing/dashboard-showcase";
import { WorkflowSection } from "@/components/marketing/workflow-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { SecuritySection } from "@/components/marketing/security-section";
import { SocialProofSection } from "@/components/marketing/social-proof";
import { CTASection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";
import { IntegrationsSection } from "@/components/marketing/integrations-section";
import { useEffect } from "react";
import Lenis from "lenis";
import { AuthProvider } from "@/lib/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

const queryClient = new QueryClient();

function Index() {
  // Smooth Scrolling setup (Lenis)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-foreground">
          <ScrollProgress />
          <Navbar />
          
          <main>
            <HeroSection />
            <IntegrationsSection />
            <FeaturesSection />
            <DashboardShowcase />
            <WorkflowSection />
            <HowItWorksSection />
            <SecuritySection />
            <SocialProofSection />
            <CTASection />
          </main>

          <Footer />
        </div>
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
