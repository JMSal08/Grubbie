
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Trash2, Loader2, ArrowLeft, ShieldAlert, Lock } from 'lucide-react';
import Link from 'next/link';

export default function DeleteConfirmPage() {
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const handleFinalDelete = async () => {
    if (password && user && user.email) {
      setIsDeleting(true);
      try {
        // 1. Re-authenticate user before deletion for security
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        
        // 2. Firestore Cleanup (Awaited)
        // We MUST complete Firestore cleanup BEFORE deleting the Auth user
        // so that the operations are authorized by the user's current token.
        const userRef = doc(db, 'users', user.uid);
        const customerProfileRef = doc(db, 'users', user.uid, 'customerProfile', 'profile');
        const vendorProfileRef = doc(db, 'users', user.uid, 'vendorProfile', 'profile');

        // Hard delete the profile subcollection documents first to ensure they are removed from collectionGroup queries
        await deleteDoc(customerProfileRef);
        await deleteDoc(vendorProfileRef);
        
        // Finally, hard delete the main user entry
        await deleteDoc(userRef);
        
        // 3. Auth Account Deletion
        // Finally, remove the authentication record
        await deleteUser(user);
        
        toast({
          title: "Account Permanently Deleted",
          description: "We're sorry to see you go. Your account and profile have been removed.",
        });
        router.push('/');
      } catch (error: any) {
        setIsDeleting(false);
        console.error("Deletion error:", error);
        
        let message = "Could not delete account. Please check your password and try again.";
        if (error.code === 'auth/wrong-password') {
          message = "Incorrect password. Please try again.";
        } else if (error.code === 'auth/too-many-requests') {
          message = "Too many failed attempts. Please try again later.";
        } else if (error.code === 'auth/requires-recent-login') {
          message = "Security timeout. Please log out and log back in before deleting your account.";
        }
        
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: message,
        });
      }
    }
  };

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-secondary/10"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      <main className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md border-2 border-red-100 shadow-2xl overflow-hidden">
          <div className="bg-red-600 h-2 w-full" />
          <CardHeader className="text-center space-y-4 pt-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <div>
              <CardTitle className="text-3xl font-headline font-bold text-red-600">Security Verification</CardTitle>
              <CardDescription className="text-foreground/70 font-medium">
                Please enter your password to confirm you want to permanently delete your Grubbie account.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 leading-relaxed">
                This action is final. Deleting your account will immediately remove your profile from the dining spots list and erase your data.
              </p>
            </div>
            <div className="space-y-3">
              <Label className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" /> Account Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="rounded-xl h-14 border-red-200 focus:ring-red-500 text-lg text-center font-bold"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-10">
            <Button 
              onClick={handleFinalDelete} 
              className="w-full h-14 rounded-full bg-red-600 hover:bg-red-700 font-bold text-lg shadow-lg gap-3"
              disabled={!password || isDeleting}
            >
              {isDeleting ? <Loader2 className="animate-spin h-5 w-5" /> : <><Trash2 className="h-5 w-5" /> Delete My Account Forever</>}
            </Button>
            <Button variant="ghost" asChild className="rounded-full h-12 font-medium" disabled={isDeleting}>
              <Link href="/profile">
                <ArrowLeft className="h-4 w-4 mr-2" /> No, keep my account
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
