
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
import { AlertCircle, Trash2, Loader2, ArrowLeft } from 'lucide-react';
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
            title: "Verification Required",
            description: "For your security, please log in again to verify your identity before deleting your account.",
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
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      <main className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-3xl font-headline font-bold text-red-600">Final Verification</CardTitle>
              <CardDescription>
                This is your final chance to cancel. Deleting your account will permanently erase your orders, reviews, and profile.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="font-bold">Confirmation Required</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Type <span className="font-bold text-foreground">delete</span> below to confirm permanent account removal.
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type delete to confirm"
                className="rounded-xl h-12 border-red-200 focus:ring-red-500"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              onClick={handleFinalDelete} 
              className="w-full h-14 rounded-full bg-red-600 hover:bg-red-700 font-bold text-lg shadow-lg gap-2"
              disabled={confirmText.toLowerCase() !== "delete" || isDeleting}
            >
              {isDeleting ? <Loader2 className="animate-spin h-5 w-5" /> : <><Trash2 className="h-5 w-5" /> Delete Account Permanently</>}
            </Button>
            <Button variant="ghost" asChild className="rounded-full">
              <Link href="/profile">
                <ArrowLeft className="h-4 w-4 mr-2" /> Keep My Account
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
