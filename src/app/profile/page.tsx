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
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { User, UserCircle, Store, Save, Loader2, Clock, Phone, Mail, AlertTriangle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Deletion state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get base user data to know the userType
  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  // Get specific profile data
  const profileRef = useMemoFirebase(() => {
    if (!db || !user || !userData) return null;
    const collectionName = userData.userType === 'vendor' ? 'vendorProfile' : 'customerProfile';
    return doc(db, 'users', user.uid, collectionName, 'profile');
  }, [db, user, userData]);
  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [locationType, setLocationType] = useState<string>('Other');

  // Initialize form data when profile data is loaded
  useEffect(() => {
    if (profileData) {
      setFormData(profileData);
      const type = ['Cafeteria', 'SouthPoint'].includes(profileData.location) ? profileData.location : 'Other';
      setLocationType(type);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || !profileRef) return;

    setIsSaving(true);
    
    // We use the memoized ref to save
    setDocumentNonBlocking(profileRef, {
      ...formData,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Simulate a brief delay for UX if it's too fast
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
    }, 500);
  };

  const handleDeleteInitiated = () => {
    if (deleteConfirmText.toLowerCase() === "delete") {
      setIsDeleteDialogOpen(false);
      
      // Redirect to the final confirmation page
      router.push('/auth/delete-confirm');
      
      setDeleteConfirmText("");
    }
  };

  if (isUserLoading || isUserDataLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-secondary/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userData) return null;

  const isVendor = userData.userType === 'vendor';

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Info */}
          <div className="w-full md:w-1/3 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden text-center">
              <CardContent className="pt-8 space-y-4">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  {isVendor ? <Store className="h-12 w-12" /> : <UserCircle className="h-12 w-12" />}
                </div>
                <div>
                  <h2 className="text-xl font-headline font-bold">
                    {isVendor ? (profileData?.vendorName || 'Vendor Account') : `${profileData?.firstName || 'User'} ${profileData?.lastName || ''}`}
                  </h2>
                  <p className="text-sm text-muted-foreground capitalize">{userData.userType}</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{userData.email}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Account Status</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">Verified</span>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Member Since</span>
                <span className="text-sm font-medium">
                  {userData.createdAt?.seconds ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                </span>
              </div>
            </div>

            {/* Danger Zone */}
            <Card className="border-2 border-red-200 shadow-sm bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-600 text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-red-700 font-medium">
                  Permanently remove your account. This action is irreversible.
                </p>
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full rounded-full bg-red-600 hover:bg-red-700 font-bold shadow-md h-12 gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="font-headline text-red-600">Start Deletion Process?</DialogTitle>
                      <DialogDescription>
                        Please type <span className="font-bold text-foreground">delete</span> in the field below to proceed to the final step.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type delete to confirm"
                        className="rounded-xl h-12 border-red-200 focus:ring-red-500"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-full">Cancel</Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteInitiated}
                        disabled={deleteConfirmText.toLowerCase() !== "delete"}
                        className="rounded-full px-8 bg-red-600 font-bold h-12"
                      >
                        Continue to Final Step
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Settings Form */}
          <div className="flex-1">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Profile Settings</CardTitle>
                <CardDescription>Update your personal information and preferences.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSave}>
                <CardContent className="space-y-6">
                  {isVendor ? (
                    /* Vendor Specific Fields */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="vendorName">Establishment Name</Label>
                        <Input 
                          id="vendorName" 
                          name="vendorName"
                          value={formData.vendorName || ''} 
                          onChange={handleInputChange} 
                          className="rounded-xl h-12" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Store Description</Label>
                        <Textarea 
                          id="description" 
                          name="description"
                          value={formData.description || ''} 
                          onChange={handleInputChange} 
                          className="rounded-xl min-h-[100px]" 
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="location-select">Location Area</Label>
                            <Select 
                              value={locationType} 
                              onValueChange={(val) => {
                                setLocationType(val);
                                if (val !== 'Other') {
                                  setFormData((prev: any) => ({ ...prev, location: val }));
                                }
                              }}
                            >
                              <SelectTrigger id="location-select" className="rounded-xl h-12 bg-white">
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cafeteria">Cafeteria</SelectItem>
                                <SelectItem value="SouthPoint">SouthPoint</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {locationType === 'Other' && (
                            <div className="space-y-2">
                              <Label htmlFor="location">Specific Location</Label>
                              <Input 
                                id="location" 
                                name="location"
                                value={formData.location || ''} 
                                onChange={handleInputChange} 
                                placeholder="Specify your location..."
                                className="rounded-xl h-12" 
                              />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactNumber">Contact Number</Label>
                          <Input 
                            id="contactNumber" 
                            name="contactNumber"
                            value={formData.contactNumber || ''} 
                            onChange={handleInputChange} 
                            className="rounded-xl h-12" 
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="openingTime" className="flex items-center gap-2"><Clock className="h-4 w-4" /> Opening Time</Label>
                          <Input 
                            id="openingTime" 
                            name="openingTime"
                            type="time"
                            value={formData.openingTime || ''} 
                            onChange={handleInputChange} 
                            className="rounded-xl h-12 bg-white cursor-pointer input-picker-full" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="closingTime" className="flex items-center gap-2"><Clock className="h-4 w-4" /> Closing Time</Label>
                          <Input 
                            id="closingTime" 
                            name="closingTime"
                            type="time"
                            value={formData.closingTime || ''} 
                            onChange={handleInputChange} 
                            className="rounded-xl h-12 bg-white cursor-pointer input-picker-full" 
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Customer Specific Fields */
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            name="firstName"
                            value={formData.firstName || ''} 
                            onChange={handleInputChange} 
                            className="rounded-xl h-12" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            name="lastName"
                            value={formData.lastName || ''} 
                            onChange={handleInputChange} 
                            className="rounded-xl h-12" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="phoneNumber" 
                            name="phoneNumber"
                            value={formData.phoneNumber || ''} 
                            onChange={handleInputChange} 
                            className="rounded-xl h-12 pl-10" 
                            placeholder="09XX-XXX-XXXX"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-secondary/20 p-6 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => router.back()} className="rounded-full">
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-full gap-2 px-8 h-12 font-bold" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
