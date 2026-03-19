
"use client";

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { VendorCard } from '@/components/vendor/VendorCard';
import { FoodCard } from '@/components/food/FoodCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Loader2, ArrowLeft, Store, MapPin, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collectionGroup, query, collection, where, doc } from 'firebase/firestore';
import { Vendor, FoodItem } from '@/lib/types';

function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vendorId = searchParams.get('vendor');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Cafeteria');
  const db = useFirestore();
  const { user } = useUser();

  // Current logged in user info to check if they are a vendor
  const loggedInUserRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: loggedInUserData } = useDoc(loggedInUserRef);
  const isVendorLoggedIn = loggedInUserData?.userType === 'vendor';

  // --- Vendor Discovery State (When no vendorId is present) ---
  const vendorsProfilesQuery = useMemoFirebase(() => {
    if (!db || vendorId) return null;
    return query(collectionGroup(db, 'vendorProfile'));
  }, [db, vendorId]);

  const usersQuery = useMemoFirebase(() => {
    if (!db || vendorId) return null;
    return query(collection(db, 'users'), where('userType', '==', 'vendor'));
  }, [db, vendorId]);

  const { data: profilesData, isLoading: profilesLoading } = useCollection(vendorsProfilesQuery);
  const { data: usersData, isLoading: usersLoading } = useCollection(usersQuery);

  // --- Storefront State (When vendorId IS present) ---
  const specificVendorRef = useMemoFirebase(() => {
    if (!db || !vendorId) return null;
    return doc(db, 'users', vendorId, 'vendorProfile', 'profile');
  }, [db, vendorId]);

  const menuItemsQuery = useMemoFirebase(() => {
    if (!db || !vendorId) return null;
    return query(
      collection(db, 'menuItems'), 
      where('vendorId', '==', vendorId),
      where('isAvailable', '==', true)
    );
  }, [db, vendorId]);

  const { data: vendorProfile, isLoading: isVendorLoading } = useDoc(specificVendorRef);
  const { data: menuItems, isLoading: isMenuLoading } = useCollection(menuItemsQuery);

  const vendors = useMemo(() => {
    if (!profilesData || !usersData) return [];
    
    return profilesData
      .filter(profile => {
        const userAccount = usersData.find(u => u.id === profile.userId);
        if (!userAccount || userAccount.isBlocked || userAccount.deletedAt) return false;
        if (!profile.vendorName || profile.vendorName === 'New Vendor') return false;
        return true;
      })
      .map(doc => {
        const loc = doc.location || '';
        const category = (loc === 'Cafeteria' || loc === 'SouthPoint') ? loc : 'Other';
        return {
          id: doc.userId,
          name: doc.vendorName,
          description: doc.description || '',
          imageUrl: doc.logoUrl || `https://picsum.photos/seed/${doc.userId}/600/400`,
          category: category as any,
          rating: 0,
          reviewsCount: 0,
          location: loc || 'Unknown',
          isOnline: !!doc.isOnline,
        } as Vendor;
      });
  }, [profilesData, usersData]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => 
      vendor.name.toLowerCase().includes(search.toLowerCase()) || 
      vendor.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [vendors, search]);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [menuItems, search]);

  const handleBack = () => {
    router.push('/menu');
  };

  const isLoading = profilesLoading || usersLoading || isVendorLoading || isMenuLoading;

  // Render Storefront View
  if (vendorId) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Opening storefront...</p>
        </div>
      );
    }

    if (!vendorProfile) {
      return (
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-accent mb-4">Vendor Not Found</h2>
          <Button onClick={handleBack} className="rounded-full">Return to Discovery</Button>
        </div>
      );
    }

    return (
      <div className="bg-background min-h-screen">
        {/* Vendor Header */}
        <header className="relative bg-white border-b overflow-hidden">
          <div className="h-48 md:h-64 relative bg-accent/10">
            <img 
              src={vendorProfile.logoUrl || `https://picsum.photos/seed/${vendorId}/1200/400`} 
              alt={vendorProfile.vendorName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-0 w-full">
              <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="text-white space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-5xl font-headline font-bold">{vendorProfile.vendorName}</h1>
                    <Badge className={vendorProfile.isOnline ? "bg-green-500" : "bg-red-500"}>
                      {vendorProfile.isOnline ? "OPEN" : "CLOSED"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium opacity-90">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {vendorProfile.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      {vendorProfile.contactNumber}
                    </div>
                  </div>
                </div>
                <Button variant="secondary" onClick={handleBack} className="rounded-full gap-2 font-bold shadow-lg">
                  <ArrowLeft className="h-4 w-4" />
                  All Spots
                </Button>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-6">
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              {vendorProfile.description}
            </p>
          </div>
        </header>

        {/* Menu Items */}
        <main className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <h2 className="text-3xl font-headline font-bold text-accent flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              Menu
            </h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search food items..." 
                className="pl-10 h-12 rounded-full border-muted bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map((item) => (
              <FoodCard 
                key={item.id} 
                item={{
                  ...item,
                  category: item.menuTypeId === 'cafeteria' ? 'Cafeteria' : item.menuTypeId === 'southpoint' ? 'SouthPoint' : 'Other',
                  rating: 0,
                  reviewsCount: 0
                } as FoodItem} 
                onAddToCart={() => {}} 
                hideAction={isVendorLoggedIn}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed">
                <p className="text-muted-foreground">No menu items found matching your search.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Render Discovery View
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-headline font-bold text-accent">Dining Spots</h1>
              <p className="text-muted-foreground mt-1">
                Find your favorite campus restaurants and skip the queue.
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-4">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search restaurants..." 
                  className="pl-10 h-12 rounded-full border-muted bg-secondary/50 focus:bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Finding active kitchens...</p>
          </div>
        ) : (
          <Tabs defaultValue="Cafeteria" className="w-full" onValueChange={setActiveTab}>
            <div className="flex justify-center mb-12">
              <TabsList className="h-14 p-1 rounded-full bg-secondary/50 border border-muted">
                <TabsTrigger value="Cafeteria" className="rounded-full px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Cafeteria</TabsTrigger>
                <TabsTrigger value="SouthPoint" className="rounded-full px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">SouthPoint</TabsTrigger>
                <TabsTrigger value="Other" className="rounded-full px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Others</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="Cafeteria" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVendors.filter(v => v.category === 'Cafeteria').map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
                {filteredVendors.filter(v => v.category === 'Cafeteria').length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-muted-foreground">No active restaurants found in Cafeteria.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="SouthPoint" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVendors.filter(v => v.category === 'SouthPoint').map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
                {filteredVendors.filter(v => v.category === 'SouthPoint').length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-muted-foreground">No active restaurants found in SouthPoint.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="Other" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVendors.filter(v => v.category === 'Other').map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
                {filteredVendors.filter(v => v.category === 'Other').length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-muted-foreground">No active restaurants found in other locations.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      }>
        <MenuContent />
      </Suspense>
    </div>
  );
}
