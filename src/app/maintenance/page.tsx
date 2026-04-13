
"use client";

import Image from 'next/image';
import { Hammer, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

/**
 * MaintenancePage - A dedicated view for scheduled platform downtime.
 * Designed to maintain brand identity while informing users of the service status.
 */
export default function MaintenancePage() {
  const logo = PlaceHolderImages.find(img => img.id === 'grubbie-logo');

  return (
    <div className="min-h-screen bg-secondary/10 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl w-full space-y-12">
        {/* Logo Section */}
        {logo && (
          <div className="flex justify-center mb-4 transition-transform hover:scale-105 duration-300">
            <Image 
              src={logo.imageUrl} 
              alt="Grubbie Logo" 
              width={300} 
              height={120} 
              className="object-contain h-24 w-auto"
              priority
              data-ai-hint="grubbie logo"
            />
          </div>
        )}
        
        {/* Main Content Card */}
        <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl border border-white/20 relative overflow-hidden">
          {/* Background decoration for modern feel */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-8">
            <div className="bg-primary/10 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto text-primary animate-pulse">
              <Hammer className="h-12 w-12" />
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-accent leading-tight">
                We're Baking Something <br />
                <span className="text-primary">New!</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                Grubbie is currently undergoing scheduled maintenance to improve our service. We'll be back before you can say "Lunch Time!"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" variant="outline" className="rounded-full px-10 h-14 font-bold text-lg border-accent text-accent hover:bg-accent hover:text-white transition-all" asChild>
                <a href="mailto:support@grubbie.com">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Support
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="space-y-2 opacity-60">
          <p className="text-sm font-bold text-accent uppercase tracking-widest">Expected Back Online: Soon</p>
          <p className="text-xs">© 2026 Grubbie. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
