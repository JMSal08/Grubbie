"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, User as UserIcon, Menu, Search, LogOut, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Navbar({ cartCount: propCartCount = 0 }: { cartCount?: number }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const { totalCount } = useCart();

  const logo = PlaceHolderImages.find(img => img.id === 'grubbie-logo');

  // Fetch base user data to get userType
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const adminDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);
  const { data: adminData } = useDoc(adminDocRef);

  // Fetch specific profile data to get the display name
  const profileRef = useMemoFirebase(() => {
    if (!db || !user || !userData) return null;
    const collectionName = userData.userType === 'vendor' ? 'vendorProfile' : 'customerProfile';
    return doc(db, 'users', user.uid, collectionName, 'profile');
  }, [db, user, userData]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const handleLogout = () => {
    signOut(auth).then(() => {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out of your account.",
      });
    });
  };

  const isVendor = userData?.userType === 'vendor';
  const isAdmin = userData?.userType === 'admin' || !!adminData;
  const displayCartCount = totalCount > 0 ? totalCount : propCartCount;

  // Determine display name
  const displayName = userData?.userType === 'vendor' 
    ? profileData?.vendorName 
    : (profileData?.firstName || user?.displayName);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-24 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            {logo ? (
              <Image 
                src={logo.imageUrl} 
                alt="Grubbie Logo" 
                width={260} 
                height={100} 
                className="object-contain h-20 w-auto"
                data-ai-hint={logo.imageHint}
              />
            ) : (
              <span className="text-2xl font-headline font-bold text-accent">Grubbie</span>
            )}
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {!isVendor && !isAdmin && (
              <Link href="/menu" className="text-sm font-medium hover:text-primary transition-colors">Menu</Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="text-sm font-bold text-primary hover:opacity-80 transition-colors flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                Admin Portal
              </Link>
            )}
            <Link 
              href={user ? "/orders" : "/auth/login"} 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              My Orders
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block mr-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search food..."
              className="h-9 w-64 rounded-full bg-secondary pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          {user && !isVendor && !isAdmin && (
            <Button variant="ghost" size="icon" asChild className="relative mr-2">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {displayCartCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]" variant="default">
                    {displayCartCount}
                  </Badge>
                )}
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full gap-2 px-2 hover:bg-secondary/50">
                <div className="bg-primary/10 p-1.5 rounded-full text-primary">
                  <UserIcon className="h-4 w-4" />
                </div>
                {user && !isUserLoading && (
                  <span className="hidden md:inline-block text-sm font-bold text-accent pr-1">
                    {isProfileLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (displayName || 'Account')}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {user ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-bold truncate">{displayName || 'User'}</span>
                    <span className="text-xs text-muted-foreground font-normal truncate">{user.email}</span>
                  </div>
                ) : 'My Account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user ? (
                <>
                  <DropdownMenuItem asChild><Link href="/profile">Profile Settings</Link></DropdownMenuItem>
                  
                  {isVendor && (
                    <DropdownMenuItem asChild><Link href="/vendor/dashboard">Vendor Dashboard</Link></DropdownMenuItem>
                  )}
                  
                  {isAdmin && (
                    <DropdownMenuItem asChild className="text-primary font-bold">
                      <Link href="/admin">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild><Link href="/auth/login">Log In</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/auth/signup">Sign Up</Link></DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-left font-headline font-bold text-accent">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4">
                {!isVendor && !isAdmin && (
                  <Button variant="ghost" className="justify-start font-bold h-12 rounded-xl text-lg" asChild>
                    <Link href="/menu">Browse Menu</Link>
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="ghost" className="justify-start font-bold h-12 rounded-xl text-lg text-primary" asChild>
                    <Link href="/admin" className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      Admin Portal
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" className="justify-start font-bold h-12 rounded-xl text-lg" asChild>
                  <Link href={user ? "/orders" : "/auth/login"}>My Orders</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
