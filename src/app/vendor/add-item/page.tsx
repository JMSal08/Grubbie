"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Loader2, Image as ImageIcon, Upload, Utensils } from 'lucide-react';
import Link from 'next/link';
import { FoodCard } from '@/components/food/FoodCard';
import { FoodItem } from '@/lib/types';

export default function AddItemPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'vendorProfile', 'profile');
  }, [db, user]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 700 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 700KB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profileData) return;

    if (!formData.name || !formData.price) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide at least a name and price for your item.",
      });
      return;
    }

    setIsSubmitting(true);
    
    const menuItemsCol = collection(db, 'menuItems');
    const vendorCategory = (profileData.location === 'Cafeteria' || profileData.location === 'SouthPoint') 
      ? profileData.location.toLowerCase() 
      : 'other';

    addDocumentNonBlocking(menuItemsCol, {
      vendorId: user.uid,
      vendorName: profileData.vendorName,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      menuTypeId: vendorCategory,
      imageUrl: formData.imageUrl || 'https://picsum.photos/seed/food/600/400',
      isAvailable: formData.isAvailable,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    toast({
      title: "Item Added",
      description: `${formData.name} is now part of your storefront.`,
    });

    router.push('/vendor/dashboard');
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-secondary/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profileData) return null;

  // Preview object
  const previewItem: FoodItem = {
    id: 'preview',
    name: formData.name || 'Delicious Meal',
    description: formData.description || 'Describe your amazing dish here...',
    price: parseFloat(formData.price) || 0,
    category: (profileData.location === 'Cafeteria' || profileData.location === 'SouthPoint' ? profileData.location : 'Other') as any,
    vendorId: user.uid,
    vendorName: profileData.vendorName,
    imageUrl: formData.imageUrl || 'https://picsum.photos/seed/food/600/400',
    rating: 0,
    reviewsCount: 0
  };

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/vendor/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold text-accent">Add Menu Item</h1>
            <p className="text-muted-foreground">Introduce a new dish to your customers</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Form Section */}
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Utensils className="h-5 w-5 text-primary" />
                Item Details
              </CardTitle>
              <CardDescription>Fill out the basics for your new offering</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Dish Name</Label>
                    <Input 
                      id="name" 
                      name="name"
                      required
                      value={formData.name} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Special Adobo Rice"
                      className="rounded-xl h-12" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₱)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₱</span>
                      <Input 
                        id="price" 
                        name="price"
                        type="number"
                        step="0.01"
                        required
                        value={formData.price} 
                        onChange={handleInputChange} 
                        placeholder="0.00"
                        className="rounded-xl h-12 pl-10" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea 
                      id="description" 
                      name="description"
                      value={formData.description} 
                      onChange={handleInputChange} 
                      placeholder="Mention ingredients, spice levels, or portions..."
                      className="rounded-xl min-h-[100px]" 
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Dish Photo
                    </Label>
                    <div className="flex flex-col gap-4">
                      <Input 
                        name="imageUrl"
                        value={formData.imageUrl} 
                        onChange={handleInputChange} 
                        placeholder="Image URL (optional)"
                        className="rounded-xl h-12" 
                      />
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                          <span className="bg-card px-2 text-muted-foreground font-bold tracking-widest">OR UPLOAD</span>
                        </div>
                      </div>
                      <Label 
                        htmlFor="file-upload" 
                        className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-secondary/20 transition-all gap-2"
                      >
                        <Upload className="h-6 w-6 text-primary" />
                        <span className="font-bold text-sm">Upload Image</span>
                      </Label>
                      <Input 
                        id="file-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Immediate Availability</Label>
                      <p className="text-xs text-muted-foreground">Show this item on your menu right away</p>
                    </div>
                    <Switch 
                      checked={formData.isAvailable} 
                      onCheckedChange={(val) => setFormData(prev => ({ ...prev, isAvailable: val }))}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-secondary/10 p-6 flex justify-end">
                <Button 
                  type="submit" 
                  className="rounded-full gap-2 px-10 h-14 font-bold text-lg shadow-lg" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                  Add to Storefront
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Preview Section */}
          <div className="space-y-6 sticky top-24">
            <div className="flex items-center gap-2 px-2">
              <Utensils className="h-5 w-5 text-primary" />
              <h3 className="font-headline font-bold text-lg">Menu Preview</h3>
            </div>
            
            <div className="max-w-xs mx-auto">
              <p className="text-xs text-muted-foreground mb-4 text-center italic">This is how customers will see your dish.</p>
              <FoodCard item={previewItem} onAddToCart={() => {}} />
            </div>

            <Card className="border-none shadow-sm bg-accent text-accent-foreground p-6 rounded-3xl">
              <h4 className="font-bold mb-2">Ready to sell?</h4>
              <p className="text-sm opacity-80 leading-relaxed">
                Make sure your descriptions are clear and your prices are accurate. A good photo can increase orders by up to 40%!
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
