
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { 
  BarChart3, 
  Package, 
  Settings, 
  Plus, 
  Check, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Loader2,
  Power,
  Edit
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';

export default function VendorDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'vendorProfile', 'profile');
  }, [db, user]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const toggleStatus = (online: boolean) => {
    if (!profileRef) return;
    
    updateDocumentNonBlocking(profileRef, {
      isOnline: online,
      updatedAt: serverTimestamp()
    });

    toast({
      title: online ? "Kitchen is Online" : "Kitchen is Offline",
      description: online ? "Your store is now visible to customers." : "Customers can no longer see your store on the menu.",
    });
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-secondary/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profileData) return null;

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white p-6 rounded-3xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${profileData.isOnline ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <Power className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold text-accent">{profileData.vendorName || 'Campus Kitchen'}</h1>
              <p className="text-muted-foreground">Managing your food hub operations</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-secondary/30 px-6 py-3 rounded-full border">
              <Label htmlFor="online-status" className="font-bold text-sm uppercase tracking-wider cursor-pointer">
                {profileData.isOnline ? 'Online' : 'Offline'}
              </Label>
              <Switch 
                id="online-status" 
                checked={!!profileData.isOnline} 
                onCheckedChange={toggleStatus}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button className="rounded-full gap-2 flex-1 sm:flex-none">
                <Plus className="h-4 w-4" /> Add Item
              </Button>
              <Button variant="outline" className="rounded-full gap-2 border-primary text-primary flex-1 sm:flex-none" asChild>
                <Link href="/vendor/edit-page">
                  <Edit className="h-4 w-4" /> Edit Page
                </Link>
              </Button>
              <Button variant="outline" className="rounded-full gap-2 border-accent text-accent flex-1 sm:flex-none" asChild>
                <Link href="/profile">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold">New Orders</p>
                <h3 className="text-2xl font-bold">12</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold">Preparing</p>
                <h3 className="text-2xl font-bold">5</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-2xl">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold">Today's Revenue</p>
                <h3 className="text-2xl font-bold">₱4,520</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-2xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold">Reports</p>
                <h3 className="text-2xl font-bold">1</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Orders */}
          <Card className="lg:col-span-2 border-none shadow-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-white">
              <div>
                <CardTitle className="font-headline font-bold">Live Orders</CardTitle>
                <CardDescription>Updates status in real-time</CardDescription>
              </div>
              <Button variant="ghost" className="text-primary font-bold">View History</Button>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_ORDERS.map((order) => (
                    <TableRow key={order.id} className="group">
                      <TableCell>
                        <div className="font-bold">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'hh:mm a')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                        </div>
                        <div className="text-xs font-bold text-accent mt-1 uppercase">{order.paymentMethod}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize px-3">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white">
                          <Check className="h-4 w-4 mr-1" /> Ready
                        </Button>
                        <Button size="icon" variant="ghost" className="rounded-full text-red-500">
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Menu Overview */}
          <div className="space-y-6">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-accent text-accent-foreground">
                <CardTitle className="font-headline font-bold">Menu Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {[
                  { name: 'Cheeseburger', sales: 45, price: 120 },
                  { name: 'Pasta Carbonara', sales: 32, price: 150 },
                  { name: 'Garden Salad', sales: 18, price: 90 },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center group">
                    <div className="space-y-1">
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.sales} orders today</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-accent">₱{item.price}</div>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">Edit</Button>
                    </div>
                  </div>
                ))}
                <Button className="w-full rounded-full variant-outline border-accent text-accent mt-4" variant="outline">
                  View Full Analytics <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
