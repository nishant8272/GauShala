import { useState, useEffect } from "react";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { LanguageSelector } from "@/components/landing/language-selector";

export default function Home() {
  const [languageSelected, setLanguageSelected] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("gaushala_lang") || localStorage.getItem("cattlegpt_lang");
      if (saved) return true;
      const onboarded = localStorage.getItem("gaushala_lang_onboarded");
      if (onboarded) return true;
      return false;
    } catch {
      return true;
    }
  });

  const handleLanguageSelect = (lang: string) => {
    try {
      localStorage.setItem("gaushala_lang", lang);
      localStorage.setItem("gaushala_lang_onboarded", "true");
    } catch (e) {
      console.error(e);
    }
    setLanguageSelected(true);
  };

  if (!languageSelected) {
    return <LanguageSelector onSelect={handleLanguageSelect} />;
  }

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary-foreground">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
