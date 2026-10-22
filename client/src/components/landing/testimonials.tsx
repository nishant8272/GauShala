import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Dairy Farmer, Punjab",
    content: "CattleGPT saved my prize cow. The AI spotted the early signs of Lumpy Skin Disease from a photo I uploaded, and I got a vet visit the same day.",
    rating: 5,
  },
  {
    name: "Dr. Anjali Sharma",
    role: "Veterinary Surgeon",
    content: "This platform has revolutionized how I manage my visits. The preliminary data from the AI helps me prioritize critical cases.",
    rating: 5,
  },
  {
    name: "Vikram Singh",
    role: "Livestock Owner, Rajasthan",
    content: "The voice support in Hindi is a blessing. I can just speak to the app and get advice instantly. It's like having a doctor in my pocket.",
    rating: 4,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-center text-foreground mb-16">
          Trusted by Farmers & Vets
        </h2>

        <div className="max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((t, i) => (
                <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="h-full border-none shadow-md bg-card">
                      <CardContent className="flex flex-col p-8 h-full">
                        <div className="flex gap-1 mb-6">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < t.rating ? "text-secondary fill-secondary" : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <blockquote className="text-lg text-muted-foreground mb-6 flex-grow italic">
                          "{t.content}"
                        </blockquote>
                        <div className="mt-auto pt-6 border-t border-border">
                          <p className="font-bold text-foreground">{t.name}</p>
                          <p className="text-sm text-primary font-medium">{t.role}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
            <div className="flex justify-center items-center gap-3 mt-6 md:hidden">
              <CarouselPrevious className="static translate-y-0 h-9 w-9" />
              <span className="text-xs text-muted-foreground font-medium">Swipe to browse</span>
              <CarouselNext className="static translate-y-0 h-9 w-9" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
