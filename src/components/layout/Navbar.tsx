
"use client";

import Link from 'next/link';
import { ShoppingCart, User as UserIcon, Menu, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export function Navbar({ cartCount = 0 }: { cartCount?: number }) {
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();

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

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-headline font-bold text-accent">Grubbie</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/menu" className="text-sm font-medium hover:text-primary transition-colors">Menu</Link>
            {user && (
              <Link href="/orders" className="text-sm font-medium hover:text-primary transition-colors">My Orders</Link>
            )}
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
          
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]" variant="default">
                  {cartCount}
                </Badge>
              )}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user ? (
                <>
                  <DropdownMenuItem asChild><Link href="/profile">Profile Settings</Link></DropdownMenuItem>
                  
                  {userData?.userType === 'vendor' && (
                    <DropdownMenuItem asChild><Link href="/vendor/dashboard">Vendor Dashboard</Link></DropdownMenuItem>
                  )}
                  
                  {adminData && (
                    <DropdownMenuItem asChild><Link href="/admin">Admin Portal</Link></DropdownMenuItem>
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

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
