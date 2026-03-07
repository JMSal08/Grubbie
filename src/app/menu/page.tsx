
"use client";

import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { VendorCard } from '@/components/vendor/VendorCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, collection, where } from 'firebase/firestore';
import { Vendor } from '@/lib/types';

export default function MenuPage() {
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Cafeteria');
  const db = useFirestore();

  // Fetch all vendor profiles using a Collection Group query
  const vendorsProfilesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collectionGroup(db, 'vendorProfile'));
  }, [db]);

  // Fetch user accounts that are vendors to verify their current status
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('userType', '==', 'vendor'));
  }, [db]);

  const { data: profilesData, isLoading: profilesLoading } = useCollection(vendorsProfilesQuery);
  const { data: usersData, isLoading: usersLoading } = useCollection(usersQuery);

  // Map and filter vendors based on profile existence and user account status
  const vendors = useMemo(() => {
    if (!profilesData || !usersData) return [];
    
    return profilesData
      .filter(profile => {
        // Find the corresponding user account by the userId stored in the profile
        const userAccount = usersData.find(u => u.id === profile.userId);
        
        // CRITICAL FILTERING LOGIC:
        // A vendor profile is ONLY active if:
        // 1. A matching user account exists in the top-level users collection
        // 2. The user account is NOT blocked
        // 3. The user account does NOT have a deletedAt timestamp
        // 4. The vendor name is not "New Vendor" (this indicates incomplete setup or stale data)
        
        if (!userAccount) return false;
        if (userAccount.isBlocked === true) return false;
        if (userAccount.deletedAt) return false;
        if (!profile.vendorName || profile.vendorName === 'New Vendor') return false;
        
        return true;
      })
      .map(doc => {
        // Determine category for UI grouping
        // Any location that isn't explicitly 'Cafeteria' or 'SouthPoint' falls under 'Other'
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

  const isLoading = profilesLoading || usersLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={cartCount} />
      
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
