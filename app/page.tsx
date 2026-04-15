import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DemoSection } from "@/components/landing/DemoSection";
import { HeroSection } from "@/components/landing/HeroSection";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <DemoSection />
      </main>
      <Footer />
    </>
  );
}
