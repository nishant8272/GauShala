import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Check, ArrowRight, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { translations, type Language } from "@/lib/translations";
import { useAuth } from "@/features/auth";

export function Hero() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [currentLang, setCurrentLang] = useState<Language>("hi");

  useEffect(() => {
    const saved = localStorage.getItem("gaushala_lang") as Language;
    if (saved) setCurrentLang(saved);
  }, []);

  const t = translations[currentLang].hero;

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-20 pb-12 sm:pb-16 md:py-0">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-cattle.png"
          alt="Farmer with cattle at golden hour"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay: Darker on left for text readability */}
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary-foreground text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t.badge}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-white leading-[1.1] mb-6 drop-shadow-lg">
            {t.title1} <br />
            <span className="text-secondary italic">{t.title2}</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 max-w-lg leading-relaxed drop-shadow-md">
            {t.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10">
            <Button 
              size="lg" 
              className="w-full sm:w-auto text-sm sm:text-base font-semibold h-12 px-6 sm:px-8 shadow-xl hover:scale-105 transition-transform cursor-pointer"
              onClick={() => {
                if (isAuthenticated) {
                  setLocation(user?.role === "doctor" ? "/doctor/dashboard" : user?.role === "super_admin" ? "/super-admin" : "/features/records");
                } else {
                  openAuthModal("register", "user");
                }
              }}
            >
              {t.cta1}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <WhatsAppButton
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-black/40 text-white border-white/20 hover:bg-black/60 hover:text-white backdrop-blur-md h-12 px-6 sm:px-8 text-sm sm:text-base cursor-pointer"
              initialText={t.cta2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 text-xs sm:text-sm font-medium text-gray-300">
            {t.features.map(
              (item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="bg-primary/20 p-1 rounded-full text-primary-foreground border border-primary/30 shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>{item}</span>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hidden md:flex flex-col items-center gap-2"
      >
        <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
        <div className="w-px h-12 bg-linear-to-b from-white/50 to-transparent" />
      </motion.div>
    </section>
  );
}
