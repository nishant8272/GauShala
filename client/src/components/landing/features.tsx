import { motion } from "framer-motion";
import { MessageSquareText, FileText, MapPin, Ambulance, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { translations, type Language } from "@/lib/translations";

export function Features() {
  const [currentLang, setCurrentLang] = useState<Language>("hi");

  useEffect(() => {
    const saved = localStorage.getItem("gaushala_lang") as Language;
    if (saved) setCurrentLang(saved);
  }, []);

  const t = translations[currentLang].features;

  const features = [
    {
      id: 1,
      title: t.chatbot.title,
      description: t.chatbot.desc,
      icon: MessageSquareText,
      image: "/images/feature-chatbot.png",
      points: ["NLP", "Voice & Image Support", "Regional Dialects"],
      colSpan: "lg:col-span-2",
      link: "/features/chatbot"
    },
    {
      id: 2,
      title: t.records.title,
      description: t.records.desc,
      icon: FileText,
      image: "/images/feature-records.png",
      points: ["Muzzle ID Technology", "Health History Timeline", "Milk Yield Tracking"],
      colSpan: "lg:col-span-1",
      link: "/features/records"
    },
    {
      id: 3,
      title: t.findVet.title,
      description: t.findVet.desc,
      icon: MapPin,
      image: "/images/feature-vet.png",
      points: ["GPS Matching", "Specialist Search", "Verified Reviews"],
      colSpan: "lg:col-span-1",
      link: "/features/find-vet"
    },
    {
      id: 4,
      title: t.emergency.title,
      description: t.emergency.desc,
      icon: Ambulance,
      image: "/images/feature-emergency.png",
      points: ["24/7 Helpline", "Mobile Vet Units", "Critical Alerts"],
      colSpan: "lg:col-span-2",
      link: "/features/emergency"
    },
    {
      id: 5,
      title: t.prediction.title,
      description: t.prediction.desc,
      icon: BrainCircuit,
      image: "/images/feature-prediction.png",
      points: ["Symptom Analysis", "Risk Forecasting", "Preventive Alerts"],
      colSpan: "lg:col-span-3",
      link: "/features/chatbot"
    },
  ];

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/5 px-4 py-1">
            {t.badge}
          </Badge>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">
            {t.title}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(350px,auto)]">
          {features.map((feature, index) => (
            <Link
              key={feature.id}
              href={feature.link}
              onClick={() => {
                window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`group relative h-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer ${feature.colSpan}`}
              >
                {/* Background Image & Overlay */}
                {feature.image && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-black/20" />
                  </div>
                )}

                <div className="relative z-10 h-full p-8 flex flex-col justify-end text-white">
                  <div className="mb-auto text-white/80">
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl w-fit mb-6 border border-white/10">
                      <feature.icon className="h-8 w-8" color="white" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-secondary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-base mb-6 text-gray-300">
                    {feature.description}
                  </p>

                  <ul className="space-y-2">
                    {feature.points.map((point, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-medium opacity-90">
                        <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                        <span className="text-gray-200">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
