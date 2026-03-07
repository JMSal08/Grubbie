"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useUser, useAuth } from '@/firebase';
import { deleteUser, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Trash2, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function DeleteConfirmPage() {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const handleFinalDelete = async () => {
    if (confirmText.toLowerCase() === "delete" && user) {
      setIsDeleting(true);
      try {
        await deleteUser(user);
        toast({
          title: "Account Permanently Deleted",
          description: "We're sorry to see you go. Your account has been removed.",
        });
        router.push('/');
      } catch (error: any) {
        setIsDeleting(false);
        if (error.code === 'auth/requires-recent-login') {
          toast({
            variant: "destructive",
            title: "Security Verification Required",
            description: "For your protection, please log out and log back in before deleting your account.",
          });
          signOut(auth);
          router.push('/auth/login');
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not delete account. Please try again later.",
          });
        }
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
              <CardTitle className="text-3xl font-headline font-bold text-red-600">Final Verification</CardTitle>
              <CardDescription className="text-foreground/70 font-medium">
                Please confirm one last time. This is the final step to permanently remove your account from Grubbie.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 leading-relaxed">
                Deleting your account will immediately remove all your data, including order history, profile information, and vendor settings. This cannot be undone.
              </p>
            </div>
            <div className="space-y-3">
              <Label className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Type "delete" to confirm</Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type delete to confirm"
                className="rounded-xl h-14 border-red-200 focus:ring-red-500 text-lg text-center font-bold"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-10">
            <Button 
              onClick={handleFinalDelete} 
              className="w-full h-14 rounded-full bg-red-600 hover:bg-red-700 font-bold text-lg shadow-lg gap-3"
              disabled={confirmText.toLowerCase() !== "delete" || isDeleting}
            >
              {isDeleting ? <Loader2 className="animate-spin h-5 w-5" /> : <><Trash2 className="h-5 w-5" /> Delete My Account Forever</>}
            </Button>
            <Button variant="ghost" asChild className="rounded-full h-12 font-medium">
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
