"use client";

import Image from 'next/image';
import { Star, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FoodItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface FoodCardProps {
  item: FoodItem;
  onAddToCart: (item: FoodItem) => void;
}

export function FoodCard({ item, onAddToCart }: FoodCardProps) {
  const { toast } = useToast();

  const handleAdd = () => {
    onAddToCart(item);
    toast({
      title: "Added to cart",
      description: `${item.name} added successfully!`,
    });
  };

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-card">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="food meal"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="backdrop-blur-md bg-white/70">
            {item.category}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-headline font-bold text-lg line-clamp-1">{item.name}</h3>
          <span className="font-bold text-accent">₱{item.price}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 h-10">
          {item.description}
        </p>
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span>{item.rating} ({item.reviewsCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>15-20 mins</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAdd} className="w-full gap-2 rounded-full font-semibold">
          <Plus className="h-4 w-4" />
          Pre-order Now
        </Button>
      </CardFooter>
    </Card>
  );
}