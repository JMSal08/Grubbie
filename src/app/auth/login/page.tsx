
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { initiateEmailSignIn, initiateEmailVerification } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // System check for email verification, profile creation, and account status
    const checkVerificationAndProfile = async () => {
      if (user && !isLoading) {
        const userRef = doc(db, 'users', user.uid);
        
        try {
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const isVendor = userData.userType === 'vendor';
            
            // 1. Check if account is suspended
            if (userData.isBlocked === true) {
              toast({
                variant: "destructive",
                title: "Access Denied",
                description: "This account is suspended. Please contact support if you believe this is an error.",
              });
              await signOut(auth);
              return;
            }

            // 2. Enforce verification for customers
            if (!user.emailVerified && !isVendor) {
              toast({
                variant: "destructive",
                title: "Email Not Verified",
                description: "Please verify your email before logging in. We've sent you a link.",
                action: (
                  <Button variant="outline" size="sm" onClick={() => initiateEmailVerification(user)}>
                    Resend
                  </Button>
                ),
              });
              await signOut(auth);
              return;
            }
            
            // 3. Redirect admin users immediately
            if (userData.userType === 'admin') {
              router.push('/admin');
              return;
            }

            // 4. Initialize profile if missing
            if (userData.userType === 'customer') {
              const customerRef = doc(db, 'users', user.uid, 'customerProfile', 'profile');
              const customerSnap = await getDoc(customerRef);
              if (!customerSnap.exists()) {
                setDocumentNonBlocking(customerRef, {
                  id: 'profile',
                  userId: user.uid,
                  firstName: '',
                  lastName: '',
                  phoneNumber: '',
                  lastLoginAt: serverTimestamp(),
                }, { merge: true });
              }
            } else if (userData.userType === 'vendor') {
              const vendorRef = doc(db, 'users', user.uid, 'vendorProfile', 'profile');
              const vendorSnap = await getDoc(vendorRef);
              if (!vendorSnap.exists()) {
                setDocumentNonBlocking(vendorRef, {
                  id: 'profile',
                  userId: user.uid,
                  vendorName: 'New Vendor',
                  description: '',
                  location: 'Cafeteria',
                  contactNumber: '',
                  openingTime: '08:00',
                  closingTime: '20:00',
                  lastLoginAt: serverTimestamp(),
                  isOnline: false,
                }, { merge: true });
              }
            }
            
            router.push('/');
          }
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: userRef.path,
              operation: 'get',
            }));
          } else {
            console.error("Profile check error:", error);
          }
        }
      }
    };

    checkVerificationAndProfile();
  }, [user, isLoading, auth, db, router, toast]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    initiateEmailSignIn(auth, email, password)
      .then(() => {
        setIsLoading(false);
      })
      .catch((error: any) => {
        setIsLoading(false);

        let message = "Invalid credentials provided.";
        // Sanitize common auth errors to a simple "Invalid Credentials" message
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          message = "Invalid Credentials";
        } else if (error.code === 'auth/too-many-requests') {
          message = "Too many failed attempts. Please try again later.";
        }

        toast({
          variant: "destructive",
          title: "Login Failed",
          description: message,
        });
      });
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Log in to your Grubbie account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-12"
                />
                <div className="flex justify-end">
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-12 rounded-full font-bold text-lg" disabled={isLoading}>
                {isLoading ? "Logging In..." : "Log In"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-primary font-bold hover:underline">
                  Sign Up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
