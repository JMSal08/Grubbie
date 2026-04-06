
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Utensils, Clock, ShieldCheck, Heart, Users, Lightbulb } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function AboutPage() {
  const creators = [
    { name: "Jan Michael Renz Salcedo", role: "Lead Developer", image: PlaceHolderImages.find(img => img.id === 'creator-1') },
    { name: "Dominique Luna", role: "UI Designer", image: PlaceHolderImages.find(img => img.id === 'creator-2') },
    { name: "Kendrick Louiz Malonzo", role: "Developer", image: PlaceHolderImages.find(img => img.id === 'creator-3') },
    { name: "Marion James Dapiawen", role: "Developer", image: PlaceHolderImages.find(img => img.id === 'creator-4') },
  ];

  const diningImage = PlaceHolderImages.find(img => img.id === 'about-dining');

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="bg-accent text-accent-foreground py-20 text-center">
          <div className="container mx-auto px-4">
            <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm font-bold bg-primary text-primary-foreground border-none">
              Our Story
            </Badge>
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6">
              Revolutionizing Campus Dining
            </h1>
            <p className="text-xl opacity-80 max-w-2xl mx-auto leading-relaxed">
              Grubbie was born out of a simple observation: students and staff spend too much time waiting in lines instead of enjoying their meals.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-headline font-bold text-accent">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To empower the school community by providing a seamless, digital-first food ordering experience that saves time, reduces stress, and supports local vendors.
              </p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Clock className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">Save Time</h4>
                    <p className="text-sm text-muted-foreground">Focus on your studies or work, not the queue.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">Reliable Ordering</h4>
                    <p className="text-sm text-muted-foreground">Order with confidence knowing your food is being prepared.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={diningImage?.imageUrl} 
                alt={diningImage?.description} 
                className="object-cover w-full h-full"
                data-ai-hint={diningImage?.imageHint}
              />
            </div>
          </div>
        </section>

        {/* Creators Section */}
        <section className="py-20 bg-accent/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-headline font-bold text-accent mb-12">The Minds Behind Grubbie</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {creators.map((creator, index) => (
                <div key={index} className="space-y-4">
                  <div className="relative aspect-square rounded-3xl overflow-hidden shadow-lg group">
                    <img 
                      src={creator.image?.imageUrl} 
                      alt={creator.name} 
                      className="object-cover w-full h-full transition-transform group-hover:scale-110"
                      data-ai-hint={creator.image?.imageHint}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{creator.name}</h4>
                    <p className="text-sm text-muted-foreground">{creator.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-headline font-bold text-accent text-center mb-16">What Drives Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-sm bg-secondary/20 rounded-3xl">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Heart className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="font-headline font-bold text-xl">Community First</h3>
                  <p className="text-muted-foreground">We prioritize the needs of our students, faculty, and local food partners in everything we build.</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-secondary/20 rounded-3xl">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Lightbulb className="h-8 w-8 text-yellow-500" />
                  </div>
                  <h3 className="font-headline font-bold text-xl">Innovation</h3>
                  <p className="text-muted-foreground">We constantly seek smarter ways to use technology to improve the daily campus life experience.</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-secondary/20 rounded-3xl">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="font-headline font-bold text-xl">Transparency</h3>
                  <p className="text-muted-foreground">Building trust through clear communication between vendors and customers is our priority.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-20 text-center container mx-auto px-4">
          <div className="bg-primary/10 rounded-[3rem] p-12 md:p-20">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-accent mb-6">Ready to skip the line?</h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join Grubbie today!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/menu" className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold hover:bg-primary/90 transition-colors">
                Order Your First Meal
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-accent text-accent-foreground py-12 text-center border-t border-white/10">
        <p className="opacity-50 text-sm">© 2026 Grubbie. All rights reserved.</p>
      </footer>
    </div>
  );
}
