import { Tractor, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { translations, type Language } from "@/lib/translations";

export function Footer() {
  const [currentLang, setCurrentLang] = useState<Language>("hi");

  useEffect(() => {
    const saved = localStorage.getItem("gaushala_lang") as Language;
    if (saved) setCurrentLang(saved);
  }, []);

  const t = translations[currentLang];

  return (
    <footer className="bg-[#1a1a1a] text-gray-400 pt-16 pb-8 text-sm">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-primary p-1.5 rounded-lg">
                <Tractor className="h-5 w-5 text-white" />
              </div>
              <span className="font-serif text-xl font-bold">{t.brand}</span>
            </div>
            <p className="leading-relaxed">
              {t.footer.desc}
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-bold mb-6 text-base">{t.nav.features}</h4>
            <ul className="space-y-3">
              <li><Link href="/#features" className="hover:text-white transition-colors">{t.nav.features}</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">{t.nav.howItWorks}</Link></li>
              <li><Link href="/features/records" className="hover:text-white transition-colors">Digital Animal Records</Link></li>
              <li><Link href="/features/chatbot" className="hover:text-white transition-colors">AI Health Assistant</Link></li>
              <li><Link href="/features/emergency" className="hover:text-white transition-colors">24/7 Emergency Dispatch</Link></li>
            </ul>
          </div>

          {/* For Vets */}
          <div>
            <h4 className="text-white font-bold mb-6 text-base">{t.nav.forVets}</h4>
            <ul className="space-y-3">
              <li><Link href="/doctor/onboard" className="hover:text-white transition-colors">Doctor Onboarding & Verification</Link></li>
              <li><Link href="/doctor/dashboard" className="hover:text-white transition-colors">Doctor Workspace</Link></li>
              <li><Link href="/features/find-vet" className="hover:text-white transition-colors">Public Vet Catalog</Link></li>
              <li><Link href="/my-appointments" className="hover:text-white transition-colors">Appointment Management</Link></li>
            </ul>
          </div>

          {/* Contact & Resources */}
          <div>
            <h4 className="text-white font-bold mb-6 text-base">{t.footer.contact}</h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span>support@gaushala.in</span>
              </li>
              <li className="flex gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span>+91 1800-123-4567</span>
              </li>
              <li className="flex gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Tech Park, Bangalore, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>{t.footer.rights}</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Emblem_of_India.svg/1200px-Emblem_of_India.svg.png" alt="Emblem" className="h-8 opacity-50 grayscale hover:grayscale-0 transition-all" />
              <span className="text-xs">Supported by DAHD</span>
            </span>
            <span className="text-xs border border-gray-700 px-2 py-1 rounded">Digital India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
