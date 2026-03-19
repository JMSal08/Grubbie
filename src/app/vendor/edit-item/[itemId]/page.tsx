
"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Upload, Utensils, Clock } from 'lucide-react';
import Link from 'next/link';
import { FoodCard } from '@/components/food/FoodCard';
import { FoodItem } from '@/lib/types';

export default function EditItemPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = use(params);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const itemRef = useMemoFirebase(() => {
    if (!db || !itemId) return null;
    return doc(db, 'menuItems', itemId);
  }, [db, itemId]);

  const { data: itemData, isLoading: isItemLoading } = useDoc(itemRef);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    preparationTime: '15',
    preparationTimeUnit: 'mins',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (itemData) {
      // Security check: only owner can edit
      if (user && itemData.vendorId !== user.uid) {
        router.push('/menu');
        return;
      }

      setFormData({
        name: itemData.name || '',
        description: itemData.description || '',
        price: itemData.price?.toString() || '',
        imageUrl: itemData.imageUrl || '',
        preparationTime: itemData.preparationTime?.toString() || '15',
        preparationTimeUnit: itemData.preparationTimeUnit || 'mins',
      });
    }
  }, [itemData, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Limit price to 2 decimal places
    if (name === 'price') {
      const regex = /^\d*\.?\d{0,2}$/;
      if (value !== '' && !regex.test(value)) return;
    }

    // Limit prep time to positive numbers
    if (name === 'preparationTime') {
      if (value !== '' && parseInt(value) < 0) return;
    }
    
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
    if (!user || !itemRef) return;

    if (!formData.name || !formData.price) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide at least a name and price for your item.",
      });
      return;
    }

    setIsSubmitting(true);
    
    updateDocumentNonBlocking(itemRef, {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      imageUrl: formData.imageUrl || 'https://picsum.photos/seed/food/600/400',
      preparationTime: parseInt(formData.preparationTime) || 15,
      preparationTimeUnit: formData.preparationTimeUnit,
      updatedAt: serverTimestamp(),
    });

    toast({
      title: "Item Updated",
      description: `${formData.name} changes have been saved.`,
    });

    router.push(`/menu?vendor=${user.uid}`);
  };

  if (isUserLoading || isItemLoading) {
    return (
      <div className="min-h-screen bg-secondary/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !itemData) return null;

  // Preview object
  const previewItem: FoodItem = {
    ...itemData,
    id: 'preview',
    name: formData.name || itemData.name,
    description: formData.description || itemData.description,
    price: parseFloat(formData.price) || itemData.price,
    imageUrl: formData.imageUrl || itemData.imageUrl,
    preparationTime: parseInt(formData.preparationTime) || itemData.preparationTime,
    preparationTimeUnit: formData.preparationTimeUnit as any
  };

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href={`/menu?vendor=${user.uid}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold text-accent">Edit Menu Item</h1>
            <p className="text-muted-foreground">Updating {itemData.name}</p>
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
              <CardDescription>Adjust your dish details</CardDescription>
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
                      className="rounded-xl h-12" 
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
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
                          className="rounded-xl h-12 pl-10" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Cooking Time
                      </Label>
                      <div className="flex gap-2">
                        <Input 
                          name="preparationTime"
                          type="number"
                          required
                          value={formData.preparationTime} 
                          onChange={handleInputChange} 
                          className="rounded-xl h-12 flex-1" 
                        />
                        <Select 
                          value={formData.preparationTimeUnit} 
                          onValueChange={(val) => setFormData(prev => ({ ...prev, preparationTimeUnit: val }))}
                        >
                          <SelectTrigger className="rounded-xl h-12 w-28 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mins">Mins</SelectItem>
                            <SelectItem value="hours">Hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea 
                      id="description" 
                      name="description"
                      value={formData.description} 
                      onChange={handleInputChange} 
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
                        <span className="font-bold text-sm">Update Image</span>
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
                </div>
              </CardContent>
              <CardFooter className="bg-secondary/10 p-6 flex justify-end">
                <Button 
                  type="submit" 
                  className="rounded-full gap-2 px-10 h-14 font-bold text-lg shadow-lg" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Save Changes
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
              <FoodCard item={previewItem} hideAction={true} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
