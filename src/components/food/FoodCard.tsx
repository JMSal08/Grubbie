
"use client";

import Image from 'next/image';
import { Star, Plus, Clock, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FoodItem } from '@/lib/types';
import Link from 'next/link';

interface FoodCardProps {
  item: FoodItem;
  onAddToCart?: (item: FoodItem) => void;
  onDelete?: (item: FoodItem) => void;
  isOwner?: boolean;
  hideAction?: boolean;
}

export function FoodCard({ item, onAddToCart, onDelete, isOwner = false, hideAction = false }: FoodCardProps) {
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
            <span>{item.rating || 0} ({item.reviewsCount || 0})</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {item.preparationTime 
                ? `${item.preparationTime} ${item.preparationTimeUnit === 'hours' ? (item.preparationTime === 1 ? 'hr' : 'hrs') : 'mins'}` 
                : '15-20 mins'}
            </span>
          </div>
        </div>
      </CardContent>
      {!hideAction && (
        <CardFooter className="p-4 pt-0 gap-2">
          {isOwner ? (
            <>
              <Button variant="outline" size="sm" asChild className="flex-1 gap-2 rounded-full font-semibold border-primary text-primary hover:bg-primary hover:text-white">
                <Link href={`/vendor/edit-item/${item.id}`}>
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete?.(item)}
                className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground px-3"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={() => onAddToCart?.(item)} className="w-full gap-2 rounded-full font-semibold">
              <Plus className="h-4 w-4" />
              Pre-order Now
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
