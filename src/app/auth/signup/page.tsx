"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { initiateEmailSignUp, initiateEmailVerification } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user && isLoading && !verificationSent) {
      // Create User document in Firestore immediately to store the selected role (userType)
      // This document acts as a "pending" account until verification.
      const userRef = doc(db, 'users', user.uid);
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        email: user.email || email,
        userType: userType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isBlocked: false,
      }, { merge: true });

      // Send verification email
      initiateEmailVerification(user).then(() => {
        setVerificationSent(true);
        setIsLoading(false);
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox to verify your account.",
        });
      }).catch((err) => {
        console.error("Verification error:", err);
        setIsLoading(false);
      });
      
      // We do NOT create profiles here. They are created on first login AFTER verification.
    }
  }, [user, isLoading, db, userType, email, verificationSent, toast]);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    initiateEmailSignUp(auth, email, password).catch((error: any) => {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "Could not create account.",
      });
    });
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-secondary/20 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-none shadow-xl text-center p-8 space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Mail className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-headline font-bold">Check Your Email</CardTitle>
              <CardDescription className="text-lg">
                We've sent a verification link to <span className="font-bold text-foreground">{email}</span>
              </CardDescription>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Please click the link in the email to verify your identity. Once verified, you can log in and enjoy your food favorites.
            </p>
            <div className="pt-4 space-y-3">
              <Button className="w-full h-12 rounded-full font-bold text-lg shadow-lg" asChild>
                <Link href="/auth/login">Go to Login</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or try logging in to resend.
              </p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <main className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold text-center">Create an Account</CardTitle>
            <CardDescription className="text-center">
              Join Grubbie to skip the lines
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
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
              </div>
              <div className="space-y-3 pt-2">
                <Label>I am a...</Label>
                <RadioGroup value={userType} onValueChange={setUserType} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="customer" />
                    <Label htmlFor="customer" className="font-medium cursor-pointer">Student/Staff</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vendor" id="vendor" />
                    <Label htmlFor="vendor" className="font-medium cursor-pointer">Food Vendor</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-12 rounded-full font-bold text-lg" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary font-bold hover:underline">
                  Log In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}