
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Store, Save, Loader2, ArrowLeft, Image as ImageIcon, Layout, Upload } from 'lucide-react';
import { VendorCard } from '@/components/vendor/VendorCard';
import { Vendor } from '@/lib/types';
import Link from 'next/link';

export default function VendorEditPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'vendorProfile', 'profile');
  }, [db, user]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profileData) {
      setFormData(profileData);
    }
  }, [profileData]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Firestore has a 1MB limit per document. 
    // Base64 encoding increases file size by ~33%.
    // Setting a limit of 700KB ensures the document stays within Firestore's limits.
    if (file.size > 700 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 700KB to ensure it can be saved.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev: any) => ({ ...prev, logoUrl: dataUrl }));
      toast({
        title: "Image Processed",
        description: "Preview updated with your uploaded file.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileRef || !user) return;

    setIsSaving(true);
    updateDocumentNonBlocking(profileRef, {
      ...formData,
      userId: user.uid, // Explicitly include for consistency
      updatedAt: serverTimestamp(),
    });

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Storefront Updated",
        description: "Your public profile has been updated successfully.",
      });
    }, 500);
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-secondary/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profileData) return null;

  // Mock vendor object for preview
  const previewVendor: Vendor = {
    id: user.uid,
    name: formData.vendorName || profileData.vendorName || 'New Vendor',
    description: formData.description || profileData.description || '',
    imageUrl: formData.logoUrl || profileData.logoUrl || `https://picsum.photos/seed/${user.uid}/600/400`,
    category: (profileData.location === 'Cafeteria' || profileData.location === 'SouthPoint' ? profileData.location : 'Other') as any,
    rating: 0,
    reviewsCount: 0,
    location: profileData.location || 'Unknown',
    isOnline: !!profileData.isOnline,
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
            <h1 className="text-3xl font-headline font-bold text-accent">Storefront Customizer</h1>
            <p className="text-muted-foreground">Customize how customers see your kitchen</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Edit Form */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Visual Identity
              </CardTitle>
              <CardDescription>Update your public details and shop banner</CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="vendorName">Display Name</Label>
                  <Input 
                    id="vendorName" 
                    name="vendorName"
                    value={formData.vendorName || ''} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Campus Kitchen"
                    className="rounded-xl h-12" 
                  />
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="logoUrl" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Shop Banner
                  </Label>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl" className="text-xs text-muted-foreground">Image URL</Label>
                      <Input 
                        id="logoUrl" 
                        name="logoUrl"
                        value={formData.logoUrl || ''} 
                        onChange={handleInputChange} 
                        placeholder="https://images.unsplash.com/..."
                        className="rounded-xl h-12" 
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-card px-2 text-muted-foreground font-bold tracking-widest">OR UPLOAD FILE</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label 
                        htmlFor="bannerUpload" 
                        className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-secondary/20 transition-all gap-2 group"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <span className="font-bold text-sm">Choose an image file</span>
                        <span className="text-[10px] text-muted-foreground">JPG, PNG or WEBP (Max 700KB)</span>
                      </Label>
                      <Input 
                        id="bannerUpload" 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Provide a high-quality image URL or upload a file for your store's banner.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Store Tagline</Label>
                  <Textarea 
                    id="description" 
                    name="description"
                    value={formData.description || ''} 
                    onChange={handleInputChange} 
                    placeholder="Describe your kitchen in a few words..."
                    className="rounded-xl min-h-[100px]" 
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-secondary/20 p-6 flex justify-end">
                <Button type="submit" className="rounded-full gap-2 px-8 h-12 font-bold shadow-md" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Storefront
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Preview Section */}
          <div className="space-y-6 sticky top-24">
            <div className="flex items-center gap-2 px-2">
              <Layout className="h-5 w-5 text-primary" />
              <h3 className="font-headline font-bold text-lg">Live Preview</h3>
            </div>
            
            <div className="max-w-md mx-auto">
              <p className="text-xs text-muted-foreground mb-4 text-center">This is how your kitchen card will appear in the "Dining Spots" menu.</p>
              <VendorCard vendor={previewVendor} />
            </div>

            <Card className="border-none shadow-sm bg-primary/5">
              <CardContent className="p-6">
                <h4 className="font-bold text-sm mb-2">Pro Tip!</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Use bright, appetizing photos for your banner to attract more customers. High-contrast images with your best-selling dish work best for mobile users!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
