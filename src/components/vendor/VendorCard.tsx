"use client";

import Image from 'next/image';
import { Star, MapPin, ChevronRight, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vendor } from '@/lib/types';
import Link from 'next/link';

interface VendorCardProps {
  vendor: Vendor;
}

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-card">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={vendor.imageUrl}
          alt={vendor.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="restaurant storefront"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="backdrop-blur-md bg-white/70">
            {vendor.category}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-headline font-bold text-xl line-clamp-1">{vendor.name}</h3>
          <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs font-bold text-primary">{vendor.rating}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
          {vendor.description}
        </p>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MapPin className="h-3 w-3 text-primary" />
          <span className="truncate">{vendor.location}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" className="w-full gap-2 rounded-full font-semibold border-primary text-primary hover:bg-primary hover:text-white transition-colors" asChild>
          <Link href={`/menu?vendor=${vendor.id}`}>
            View Menu
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
