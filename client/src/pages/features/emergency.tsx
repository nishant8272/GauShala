import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Ambulance, Phone, ShieldAlert, Zap, Clock, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EmergencyPage() {
  const EMERGENCY_HOTLINE = "18008384357"; // 1800-VET-HELP

  const triggerDialer = () => {
    window.location.href = `tel:${EMERGENCY_HOTLINE}`;
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="bg-destructive text-destructive-foreground py-20 px-4 md:px-6 relative overflow-hidden">
          <div className="container mx-auto text-center max-w-4xl relative z-10">
            <div className="bg-white/20 p-4 rounded-full w-fit mx-auto mb-8 animate-pulse shadow-lg">
              <ShieldAlert className="h-16 w-16" />
            </div>
            <h1 className="text-4xl md:text-7xl font-serif font-bold mb-6">24/7 Emergency Veterinary Care</h1>
            <p className="text-xl opacity-90 mb-10 leading-relaxed max-w-2xl mx-auto">
              Critical care support for your livestock. If your animal is in severe distress or every second counts, connect with our emergency dispatch desk immediately.
            </p>
            
            {/* Call button triggers device phone dialer directly */}
            <a href={`tel:${EMERGENCY_HOTLINE}`} className="inline-block w-full sm:w-auto">
              <Button 
                size="lg" 
                onClick={triggerDialer}
                className="w-full sm:w-auto h-auto py-4 px-6 sm:px-10 text-base sm:text-xl md:text-2xl font-black rounded-full bg-white text-destructive hover:bg-white/90 shadow-2xl animate-bounce flex flex-wrap items-center justify-center gap-2 sm:gap-3 border-4 border-white/40 leading-tight"
              >
                <PhoneCall className="h-6 w-6 sm:h-8 sm:w-8 animate-pulse shrink-0" />
                <span>CALL 1800-VET-HELP (1800-838-4357)</span>
              </Button>
            </a>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Rapid Response Dispatch", 
                desc: "Mobile veterinary ambulances equipped with oxygen and surgical kits dispatched within 30 minutes of your call.", 
                icon: Zap 
              },
              { 
                title: "Instant First-Aid Guidance", 
                desc: "Immediate phone guidance from senior livestock surgeons to help you administer first-aid before the vet arrives.", 
                icon: Clock 
              },
              { 
                title: "24/7 Multilingual Helpline", 
                desc: "Our emergency desk is staffed round the clock in Hindi, Punjabi, Marathi, Gujarati, English, and regional dialects.", 
                icon: Phone 
              },
            ].map((item, i) => (
              <Card key={i} className="border-border/60 shadow-xl bg-card hover:shadow-2xl transition-all">
                <CardContent className="p-10 text-center">
                  <div className="bg-primary/10 p-4 rounded-3xl w-fit mx-auto mb-6">
                    <item.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold mb-4 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm mb-6">{item.desc}</p>
                  <Button 
                    variant="outline"
                    className="rounded-xl font-bold border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={triggerDialer}
                  >
                    <Phone className="w-4 h-4 mr-2" /> Connect Helpline
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
