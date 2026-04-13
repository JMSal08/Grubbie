"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebaseApp } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store, ArrowLeft, ShieldCheck, Mail, Lock, MapPin, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreateVendorPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [location, setLocation] = useState('Cafeteria');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Security check: must be admin
  const adminDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminDocRef);

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading) {
      if (!user || !adminData) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Only administrators can access this page.",
        });
        router.push('/');
      }
    }
  }, [user, isUserLoading, adminData, isAdminLoading, router, toast]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !vendorName || !db) return;

    setIsSubmitting(true);

    try {
      // Use a secondary Firebase app instance so the admin doesn't get logged out
      const secondaryAppName = 'VendorCreator';
      let secondaryApp;
      if (getApps().some(app => app.name === secondaryAppName)) {
        secondaryApp = getApp(secondaryAppName);
      } else {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      }
      
      const secondaryAuth = getAuth(secondaryApp);
      
      // 1. Create Auth Account
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newVendorUid = userCredential.user.uid;

      // 2. Create Base User Doc in Firestore
      const userRef = doc(db, 'users', newVendorUid);
      await setDoc(userRef, {
        id: newVendorUid,
        email: email,
        userType: 'vendor',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isBlocked: false,
      });

      // 3. Create Vendor Profile Doc
      const profileRef = doc(db, 'users', newVendorUid, 'vendorProfile', 'profile');
      await setDoc(profileRef, {
        id: 'profile',
        userId: newVendorUid,
        vendorName: vendorName,
        location: location,
        description: '',
        contactNumber: '',
        openingTime: '08:00',
        closingTime: '20:00',
        lastLoginAt: serverTimestamp(),
        isOnline: false,
        updatedAt: serverTimestamp(),
      });

      // 4. Clean up secondary auth (log out the newly created user from secondary instance)
      await signOut(secondaryAuth);

      toast({
        title: "Vendor Account Created",
        description: `${vendorName} has been registered and is ready for login.`,
      });

      router.push('/admin');
    } catch (error: any) {
      console.error("Creation error:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message || "An error occurred while creating the account.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  if (!user || !adminData) return null;

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 flex justify-center">
        <div className="w-full max-w-xl space-y-6">
          <Button variant="ghost" asChild className="rounded-full gap-2 text-muted-foreground hover:text-accent">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Portal
            </Link>
          </Button>

          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground p-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-headline font-bold">New Food Partner</CardTitle>
                  <CardDescription className="text-primary-foreground/80 font-medium">
                    Register an official vendor account for the platform.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleCreateVendor}>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" /> Email Address
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vendor@example.com"
                      className="rounded-xl h-12 border-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass" className="font-bold flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" /> Initial Password
                    </Label>
                    <Input 
                      id="pass" 
                      type="password" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="rounded-xl h-12 border-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" /> Establishment Name
                  </Label>
                  <Input 
                    id="name" 
                    required 
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Grandma's Specialty"
                    className="rounded-xl h-12 border-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loc" className="font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Primary Location
                  </Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="rounded-xl h-12 border-muted bg-white">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cafeteria">Cafeteria</SelectItem>
                      <SelectItem value="SouthPoint">SouthPoint</SelectItem>
                      <SelectItem value="Other">Other Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-secondary/20 p-4 rounded-2xl flex gap-3 items-start border border-secondary/30">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Admin Privilege:</strong> This account will be created with a verified status. The vendor can log in immediately using the credentials provided above.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="bg-secondary/10 p-8 flex justify-end">
                <Button 
                  type="submit" 
                  className="rounded-full gap-2 px-10 h-14 font-bold text-lg shadow-lg bg-primary text-primary-foreground hover:bg-primary/90" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                  Register Vendor
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}