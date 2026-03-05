"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { FoodCard } from '@/components/food/FoodCard';
import { MOCK_FOOD } from '@/lib/mock-data';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function MenuPage() {
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState('');

  const filteredFood = MOCK_FOOD.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={cartCount} />
      
      <header className="bg-white border-b py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-headline font-bold text-accent">Menu</h1>
              <p className="text-muted-foreground mt-1">Explore delicious meals from all around campus</p>
            </div>
            <div className="flex w-full md:w-auto gap-4">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="What are you craving?" 
                  className="pl-10 h-12 rounded-full border-muted bg-secondary/50 focus:bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="h-14 p-1 rounded-full bg-secondary/50 border border-muted">
              <TabsTrigger value="all" className="rounded-full px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Food</TabsTrigger>
              <TabsTrigger value="Cafeteria" className="rounded-full px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Cafeteria</TabsTrigger>
              <TabsTrigger value="SouthPoint" className="rounded-full px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">SouthPoint</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredFood.map((item) => (
                <FoodCard key={item.id} item={item} onAddToCart={() => setCartCount(c => c + 1)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="Cafeteria" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredFood.filter(i => i.category === 'Cafeteria').map((item) => (
                <FoodCard key={item.id} item={item} onAddToCart={() => setCartCount(c => c + 1)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="SouthPoint" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredFood.filter(i => i.category === 'SouthPoint').map((item) => (
                <FoodCard key={item.id} item={item} onAddToCart={() => setCartCount(c => c + 1)} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}