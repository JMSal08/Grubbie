"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Zap, ShieldCheck, Utensils } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={cartCount} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] flex items-center bg-[#DBAF70]/10 overflow-hidden text-center">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto space-y-8">
              <h1 className="text-5xl md:text-8xl font-headline font-extrabold text-accent leading-tight">
                Get your <span className="text-primary">Grub</span> in no time, with <span className="text-primary">Grubbie.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Order now, with Grubbie.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="rounded-full px-12 h-16 text-xl font-bold" asChild>
                  <Link href="/menu">Browse Menu</Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-12 h-16 text-xl font-bold border-accent text-accent hover:bg-accent hover:text-white">
                  Join as Vendor
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="bg-card p-8 rounded-3xl text-center space-y-4 shadow-sm border border-border/50">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  < Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-headline font-bold">Fast Pickups</h3>
                <p className="text-muted-foreground">Order in advance and skip the long lunch hour queues entirely.</p>
              </div>
              <div className="bg-card p-8 rounded-3xl text-center space-y-4 shadow-sm border border-border/50">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-headline font-bold">Secure Payments</h3>
                <p className="text-muted-foreground">Convenient cashless options with GCash, PayMaya, or cash on pickup.</p>
              </div>
              <div className="bg-card p-8 rounded-3xl text-center space-y-4 shadow-sm border border-border/50">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Utensils className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-headline font-bold">Local Variety</h3>
                <p className="text-muted-foreground">Explore menus from Cafeteria to SouthPoint favorites in one place.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-accent text-accent-foreground py-16">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-headline font-bold text-primary">Grubbie</h2>
            <p className="opacity-70">Empowering student dining through technology and convenience.</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Quick Links</h4>
            <ul className="space-y-2 opacity-70">
              <li><Link href="/menu" className="hover:text-primary">Menu</Link></li>
              <li><Link href="/orders" className="hover:text-primary">Track Order</Link></li>
              <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-lg">For Partners</h4>
            <ul className="space-y-2 opacity-70">
              <li><Link href="/vendor/login" className="hover:text-primary">Vendor Login</Link></li>
              <li><Link href="/vendor/register" className="hover:text-primary">Register Kitchen</Link></li>
              <li><Link href="/policies" className="hover:text-primary">Vendor Policies</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Newsletter</h4>
            <p className="text-sm opacity-70">Stay updated on new food arrivals.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-white/10 border-none rounded-lg px-4 py-2 w-full outline-none" />
              <Button variant="default">Go</Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-16 pt-8 border-t border-white/10 text-center opacity-50 text-sm">
          © 2026 Grubbie. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
