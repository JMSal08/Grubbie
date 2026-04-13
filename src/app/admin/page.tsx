"use client";

import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldAlert, Users, Store, Flag, ShieldCheck, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminPortal() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // 1. Check if current user is in roles_admin (Source of truth for security)
  const adminDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminDocRef);

  // 2. Fetch all users for management and stats
  const allUsersQuery = useMemoFirebase(() => {
    if (!db || !adminData) return null;
    return query(collection(db, 'users'));
  }, [db, adminData]);

  const { data: usersData, isLoading: isUsersListLoading } = useCollection(allUsersQuery);

  // 3. Derive stats from real data
  const stats = useMemo(() => {
    if (!usersData) return { customers: 0, vendors: 0 };
    return {
      customers: usersData.filter(u => u.userType === 'customer').length,
      vendors: usersData.filter(u => u.userType === 'vendor').length
    };
  }, [usersData]);

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      if (!adminData) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: `UID: ${user.uid} is not registered in the root 'roles_admin' collection.`,
        });
        router.push('/');
      }
    }
  }, [user, isUserLoading, adminData, isAdminLoading, router, toast]);

  const handleBlockUser = (userId: string, currentlyBlocked: boolean) => {
    if (!db) return;
    const userRef = doc(db, 'users', userId);
    
    updateDocumentNonBlocking(userRef, {
      isBlocked: !currentlyBlocked,
      updatedAt: serverTimestamp()
    });

    toast({
      title: currentlyBlocked ? "User Unblocked" : "User Blocked",
      description: `Action applied successfully.`,
      variant: currentlyBlocked ? "default" : "destructive"
    });
  };

  const handleDeleteUser = () => {
    if (!db || !userToDelete) return;
    
    // We try to delete the Firestore documents. 
    // Subcollections should ideally be cleaned up as well.
    const userRef = doc(db, 'users', userToDelete);
    const customerProfileRef = doc(db, 'users', userToDelete, 'customerProfile', 'profile');
    const vendorProfileRef = doc(db, 'users', userToDelete, 'vendorProfile', 'profile');

    deleteDocumentNonBlocking(userRef);
    deleteDocumentNonBlocking(customerProfileRef);
    deleteDocumentNonBlocking(vendorProfileRef);

    toast({
      title: "Account Entry Removed",
      description: "Firestore records deleted. Note: For full removal, please delete the Auth record in Firebase Console.",
      variant: "destructive"
    });
    
    setUserToDelete(null);
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
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-headline font-bold text-accent mb-8">Admin Oversight Portal</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Total Customers</p>
                <h3 className="text-3xl font-bold">{isUsersListLoading ? '...' : stats.customers.toLocaleString()}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <Store className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Active Vendors</p>
                <h3 className="text-3xl font-bold">{isUsersListLoading ? '...' : stats.vendors.toLocaleString()}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-red-50">
            <CardContent className="p-6 flex items-center gap-4">
              <Flag className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600 uppercase tracking-wider font-bold">Pending Reports</p>
                <h3 className="text-3xl font-bold text-red-600">0</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-white border-b py-6">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="font-headline font-bold">User Management</CardTitle>
                <p className="text-sm text-muted-foreground">Manage roles, block accounts, and resolve disputes</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isUsersListLoading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-secondary/30">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-bold">{u.email}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{u.id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize px-3">
                          {u.userType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.isBlocked ? (
                          <Badge variant="destructive" className="gap-1 px-3">
                            <ShieldAlert className="h-3 w-3" /> Blocked
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 px-3 bg-green-100 text-green-700 border-none">
                            <ShieldCheck className="h-3 w-3" /> Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button 
                            variant={u.isBlocked ? "outline" : "destructive"} 
                            size="sm" 
                            className="rounded-full h-8"
                            onClick={() => handleBlockUser(u.id, !!u.isBlocked)}
                            disabled={u.id === user.uid} // Don't allow blocking self
                          >
                            {u.isBlocked ? "Unblock" : "Block"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-destructive hover:bg-red-50 hover:text-red-600"
                            onClick={() => setUserToDelete(u.id)}
                            disabled={u.id === user.uid}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!usersData || usersData.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent className="rounded-[2rem]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-headline font-bold text-destructive">Delete Account Record?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>This will permanently remove the user entry and their associated profiles from the database.</p>
                <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/10 text-destructive font-medium text-xs">
                  <strong>Important:</strong> Client-side deletion cannot remove the Auth record. To fully delete the account, you must also delete UID: <strong>{userToDelete}</strong> from the Firebase Authentication console.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser} 
                className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 px-8 font-bold"
              >
                Delete Firestore Entry
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
