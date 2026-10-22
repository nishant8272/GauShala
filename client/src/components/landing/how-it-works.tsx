import { motion } from "framer-motion";
import { User, Smartphone, Stethoscope, ChevronRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Register Your Farm",
    description: "Create a profile for your farm and add your cattle using ear tags or muzzle IDs.",
    icon: User,
  },
  {
    number: "02",
    title: "Monitor & Ask",
    description: "Use WhatsApp or the Web App to ask health questions or upload photos for AI analysis.",
    icon: Smartphone,
  },
  {
    number: "03",
    title: "Get Expert Help",
    description: "Receive AI insights instantly or get connected to a nearby vet for a physical visit.",
    icon: Stethoscope,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Simple steps to modernize your cattle management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-border z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-full bg-background border-4 border-muted flex items-center justify-center mb-6 shadow-sm group hover:border-primary transition-colors duration-300">
                <step.icon className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              
              <div className="bg-secondary/10 text-secondary-foreground font-bold px-3 py-1 rounded-full text-xs mb-4 inline-block">
                STEP {step.number}
              </div>

              <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
