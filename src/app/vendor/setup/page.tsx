"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Store, UtensilsCrossed, ArrowRight, Loader2, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NewMenuItem {
  name: string;
  description: string;
  price: string;
  category: string;
}

export default function VendorSetupPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [vendorDetails, setVendorDetails] = useState({
    vendorName: '',
    description: '',
    location: '',
    contactNumber: '',
    openingTime: '08:00',
    closingTime: '20:00',
  });

  const [menuItems, setMenuItems] = useState<NewMenuItem[]>([
    { name: '', description: '', price: '', category: 'Cafeteria' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const handleVendorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVendorDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleMenuItemChange = (index: number, field: keyof NewMenuItem, value: string) => {
    const updatedItems = [...menuItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setMenuItems(updatedItems);
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: '', description: '', price: '', category: 'Cafeteria' }]);
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      // 1. Update Vendor Profile
      const vendorRef = doc(db, 'users', user.uid, 'vendorProfile', 'profile');
      setDocumentNonBlocking(vendorRef, {
        ...vendorDetails,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 2. Add Menu Items
      const menuItemsCol = collection(db, 'menuItems');
      menuItems.forEach((item) => {
        if (item.name && item.price) {
          addDocumentNonBlocking(menuItemsCol, {
            vendorId: user.uid,
            vendorName: vendorDetails.vendorName,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            menuTypeId: item.category === 'Cafeteria' ? 'cafeteria' : 'southpoint',
            imageUrl: 'https://picsum.photos/seed/' + Math.floor(Math.random() * 1000) + '/600/400',
            isAvailable: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });

      toast({
        title: "Store Configured!",
        description: "Your kitchen is now live on Grubbie.",
      });

      router.push('/vendor/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error.message || "An error occurred during setup.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-headline font-bold text-accent mb-2">Set Up Your Kitchen</h1>
          <p className="text-muted-foreground text-lg">Tell us about your store and add your first few items.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Store Details */}
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-primary/10 border-b">
              <div className="flex items-center gap-3">
                <Store className="text-primary h-6 w-6" />
                <div>
                  <CardTitle className="font-headline text-xl">Establishment Details</CardTitle>
                  <CardDescription>Basic information about your food stall</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorName">Store Name</Label>
                  <Input 
                    id="vendorName" 
                    name="vendorName"
                    required 
                    value={vendorDetails.vendorName} 
                    onChange={handleVendorChange} 
                    placeholder="e.g. Campus Kitchen" 
                    className="rounded-xl h-12" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    name="location"
                    required 
                    value={vendorDetails.location} 
                    onChange={handleVendorChange} 
                    placeholder="e.g. Main Cafeteria, Stall 4" 
                    className="rounded-xl h-12" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  required 
                  value={vendorDetails.description} 
                  onChange={handleVendorChange} 
                  placeholder="Tell customers what makes your food special..." 
                  className="rounded-xl min-h-[100px]" 
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input 
                    id="contactNumber" 
                    name="contactNumber"
                    required 
                    value={vendorDetails.contactNumber} 
                    onChange={handleVendorChange} 
                    placeholder="09XX-XXX-XXXX" 
                    className="rounded-xl h-12" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openingTime" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Opening Time
                  </Label>
                  <Input 
                    id="openingTime" 
                    name="openingTime"
                    type="time" 
                    required 
                    value={vendorDetails.openingTime} 
                    onChange={handleVendorChange} 
                    className="rounded-xl h-12 bg-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closingTime" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Closing Time
                  </Label>
                  <Input 
                    id="closingTime" 
                    name="closingTime"
                    type="time" 
                    required 
                    value={vendorDetails.closingTime} 
                    onChange={handleVendorChange} 
                    className="rounded-xl h-12 bg-white" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Menu Items */}
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-accent text-accent-foreground border-b">
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="text-primary h-6 w-6" />
                <div>
                  <CardTitle className="font-headline text-xl">Initial Menu</CardTitle>
                  <CardDescription className="text-accent-foreground/70">Add at least one item to get started</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {menuItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-2xl bg-secondary/5 relative group">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input value={item.name} onChange={(e) => handleMenuItemChange(index, 'name', e.target.value)} required placeholder="e.g. Classic Cheeseburger" className="rounded-xl bg-white h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (₱)</Label>
                      <Input type="number" value={item.price} onChange={(e) => handleMenuItemChange(index, 'price', e.target.value)} required placeholder="0.00" className="rounded-xl bg-white h-12" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={item.description} onChange={(e) => handleMenuItemChange(index, 'description', e.target.value)} placeholder="Ingredients, spice level, etc." className="rounded-xl bg-white h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Campus Area</Label>
                      <Select value={item.category} onValueChange={(val) => handleMenuItemChange(index, 'category', val)}>
                        <SelectTrigger className="rounded-xl bg-white h-12">
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cafeteria">Cafeteria</SelectItem>
                          <SelectItem value="SouthPoint">SouthPoint</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {menuItems.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white border shadow-sm text-destructive" onClick={() => removeMenuItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full border-dashed rounded-xl h-12 gap-2" onClick={addMenuItem}>
                <Plus className="h-4 w-4" /> Add Another Item
              </Button>
            </CardContent>
            <CardFooter className="p-6 bg-secondary/5 border-t">
              <Button type="submit" className="w-full h-14 rounded-full text-lg font-bold gap-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <><ArrowRight className="h-5 w-5" /> Finish Setup & Launch</>}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  );
}
