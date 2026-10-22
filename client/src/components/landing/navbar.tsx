import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Tractor, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { translations, type Language } from "@/lib/translations";
import { useAuth, UserAvatarMenu } from "@/features/auth";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [currentLang, setCurrentLang] = useState<Language>("hi");
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem("gaushala_lang") as Language;
    if (saved) {
      setCurrentLang(saved);
    } else {
      const oldSaved = localStorage.getItem("cattlegpt_lang") as Language;
      if (oldSaved) {
        setCurrentLang(oldSaved);
        localStorage.setItem("gaushala_lang", oldSaved);
      }
    }
  }, []);

  const t = translations[currentLang].nav;
  const brand = translations[currentLang].brand;

  const handleLanguageChange = (lang: Language) => {
    localStorage.setItem("gaushala_lang", lang);
    setCurrentLang(lang);
    window.location.reload(); 
  };

  const baseLinks = [
    { name: t.features, href: "/#features" },
    { name: t.howItWorks, href: "/#how-it-works" },
    { name: t.findVet, href: "/features/find-vet" },
    { name: t.emergency, href: "/features/emergency" },
  ];

  const links = user?.role === "super_admin"
    ? [...baseLinks, { name: "Buffalo Monitor", href: "/cattle-dashboard" }]
    : baseLinks;

  const languages = [
    { code: "hi", name: "हिन्दी" },
    { code: "en", name: "English" },
    { code: "pb", name: "ਪੰਜਾਬੀ" },
    { code: "mr", name: "मराठी" },
    { code: "gu", name: "ગુજરાતી" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0 mr-2 xl:mr-6">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:bg-primary/90 transition-colors">
            <Tractor className="h-6 w-6" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-foreground whitespace-nowrap">
            {brand}
          </span>
        </Link>

        {/* Desktop Links (Visible on lg screens and above) */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-7 shrink-0">
          {links.map((link) => (
            link.href.startsWith("/#") ? (
              <a
                key={link.name}
                href={link.href}
                className="text-xs xl:text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap py-1"
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs xl:text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap py-1"
              >
                {link.name}
              </Link>
            )
          ))}
        </div>

        {/* Desktop Right Actions (Visible on lg screens and above) */}
        <div className="hidden lg:flex items-center gap-2.5 xl:gap-4 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 font-medium text-xs xl:text-sm px-2.5">
                <Globe className="h-4 w-4" />
                <span>{languages.find(l => l.code === currentLang)?.name || "Language"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as Language)}
                  className="cursor-pointer"
                >
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <UserAvatarMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium text-xs xl:text-sm"
                onClick={() => openAuthModal("login")}
              >
                {t.login}
              </Button>
              <Button
                size="sm"
                className="font-medium text-xs xl:text-sm shadow-md hover:shadow-lg transition-all"
                onClick={() => openAuthModal("register")}
              >
                {t.getStarted}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile & Tablet Menu Button (< lg screens) */}
        <div className="lg:hidden flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem key={lang.code} onClick={() => handleLanguageChange(lang.code as Language)}>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[310px] sm:w-[380px] border-l-border/50 overflow-y-auto max-h-[100dvh] flex flex-col p-5 sm:p-6 touch-pan-y">
              <div className="flex flex-col gap-6 mt-4 pb-12 flex-1">
                {/* Brand Header */}
                <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                  <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                    <Tractor className="h-5 w-5" />
                  </div>
                  <span className="font-serif text-xl font-bold tracking-tight text-foreground">
                    {brand}
                  </span>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-2">
                  {links.map((link) => (
                    link.href.startsWith("/#") ? (
                      <a
                        key={link.name}
                        href={link.href}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-muted"
                        onClick={() => setIsOpen(false)}
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-muted"
                        onClick={() => {
                          setIsOpen(false);
                          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                        }}
                      >
                        {link.name}
                      </Link>
                    )
                  ))}

                  <div className="border-t border-border/60 my-2 pt-3 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3">Core Services</span>
                    <Link
                      href="/features/records"
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-muted flex items-center gap-2.5"
                      onClick={() => {
                        setIsOpen(false);
                        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                      }}
                    >
                      <span>📋 Digital Animal Records</span>
                    </Link>
                    <Link
                      href="/features/chatbot"
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-muted flex items-center gap-2.5"
                      onClick={() => {
                        setIsOpen(false);
                        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                      }}
                    >
                      <span>🤖 AI Health Assistant</span>
                    </Link>
                  </div>
                </div>

                {/* User Info & Actions */}
                <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-border/40">
                  {isAuthenticated ? (
                    <div className="space-y-2.5">
                      <div className="p-3 bg-muted/60 rounded-xl border border-border/40">
                        <p className="text-xs font-bold text-foreground truncate">{user?.username}</p>
                        <p className="text-[10px] text-muted-foreground capitalize font-semibold">{user?.role}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center text-xs font-semibold py-2"
                        onClick={() => { setLocation("/my-appointments"); setIsOpen(false); }}
                      >
                        📅 My Appointments
                      </Button>
                      {user?.role === "doctor" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center text-xs font-semibold py-2"
                          onClick={() => { setLocation("/doctor/dashboard"); setIsOpen(false); }}
                        >
                          Doctor Dashboard
                        </Button>
                      )}
                      {user?.role === "super_admin" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-center text-xs font-semibold py-2"
                            onClick={() => { setLocation("/super-admin"); setIsOpen(false); }}
                          >
                            Super Admin Panel
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-center text-xs font-semibold py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                            onClick={() => { setLocation("/cattle-dashboard"); setIsOpen(false); }}
                          >
                            Buffalo Monitor Dashboard
                          </Button>
                        </>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full justify-center text-xs font-semibold py-2"
                        onClick={() => { logout(); setIsOpen(false); }}
                      >
                        Log Out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-center font-medium"
                        onClick={() => { openAuthModal("login"); setIsOpen(false); }}
                      >
                        {t.login}
                      </Button>
                      <Button
                        className="w-full justify-center font-medium shadow-md"
                        onClick={() => { openAuthModal("register"); setIsOpen(false); }}
                      >
                        {t.getStarted}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
