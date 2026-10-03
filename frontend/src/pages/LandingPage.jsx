import Hero from "../components/landing/Hero";
import LandingNavbar from "../components/landing/LandingNavbar";
import FeaturesSection from "../components/features/FeaturesSection";
import WorkflowSection from "../components/workflow/WorkflowSection";
import FinalCTA from "../components/landing/FinalCTA";
import AppBackground from "../components/layout/AppBackground";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen text-white">
      <AppBackground />

      <LandingNavbar />

      <div className="relative z-10">
        <Hero />
        <FeaturesSection />
        <WorkflowSection />
        <FinalCTA />
      </div>
    </main>
  );
}