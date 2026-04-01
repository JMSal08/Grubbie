
"use client";

import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Edit,
  ChefHat,
  X,
  History,
  LayoutList
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, query, collection, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { Order } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VendorDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [cancelNote, setCancelNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'vendorProfile', 'profile');
  }, [db, user]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // This query is inherently vendor-specific as it filters by user.uid
    return query(
      collection(db, 'orders'), 
      where('vendorId', '==', user.uid)
    );
  }, [db, user]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

  const { activeOrders, historyOrders, stats } = useMemo(() => {
    if (!orders) return { activeOrders: [], historyOrders: [], stats: { new: 0, preparing: 0, revenue: 0 } };

    const sorted = [...orders].sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });

    const active = sorted.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
    const history = sorted.filter(o => ['picked-up', 'cancelled'].includes(o.status));
    
    const todayRevenue = orders
      .filter(o => o.status === 'picked-up')
      .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    return {
      activeOrders: active,
      historyOrders: history,
      stats: {
        new: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        revenue: todayRevenue
      }
    };
  }, [orders]);

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

  const updateOrderStatus = (orderId: string, status: string, note?: string) => {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: any = {
      status: status,
      updatedAt: serverTimestamp()
    };
    
    if (note) {
      updateData.cancellationNote = note;
    }

    updateDocumentNonBlocking(orderRef, updateData);

    toast({
      title: "Status Updated",
      description: `Order marked as ${status}.`,
    });
    
    if (status === 'cancelled') {
      setCancellingOrder(null);
      setCancelNote("");
    }
  };

  const displayedOrders = showHistory ? historyOrders : activeOrders;

  if (isUserLoading || isProfileLoading || isOrdersLoading) {
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
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${profileData.isOnline ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
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
              <Button className="rounded-full gap-2 flex-1 sm:flex-none" asChild>
                <Link href="/vendor/add-item">
                  <Plus className="h-4 w-4" /> Add Item
                </Link>
              </Button>
              <Button variant="outline" className="rounded-full gap-2 border-primary text-primary flex-1 sm:flex-none" asChild>
                <Link href="/vendor/edit-page">
                  <Edit className="h-4 w-4" /> Edit Page
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
                <h3 className="text-2xl font-bold">{stats.new}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <ChefHat className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold">Preparing</p>
                <h3 className="text-2xl font-bold">{stats.preparing}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-2xl">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold">Total Revenue</p>
                <h3 className="text-2xl font-bold">₱{stats.revenue}</h3>
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
                <h3 className="text-2xl font-bold">0</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Orders Section */}
          <Card className="lg:col-span-2 border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-white gap-4">
              <div>
                <CardTitle className="font-headline font-bold">{showHistory ? 'Store History' : 'Live Orders'}</CardTitle>
                <CardDescription>
                  {showHistory ? 'Viewing completed and cancelled orders' : 'Update order status to notify customers'}
                </CardDescription>
              </div>
              <div className="flex bg-secondary/30 rounded-full p-1 border">
                <Button 
                  variant={!showHistory ? "default" : "ghost"} 
                  size="sm" 
                  className="rounded-full gap-2 px-4 h-8 text-xs"
                  onClick={() => setShowHistory(false)}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  Live
                </Button>
                <Button 
                  variant={showHistory ? "default" : "ghost"} 
                  size="sm" 
                  className="rounded-full gap-2 px-4 h-8 text-xs"
                  onClick={() => setShowHistory(true)}
                >
                  <History className="h-3.5 w-3.5" />
                  History
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {displayedOrders.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-muted-foreground">No {showHistory ? 'past' : 'active'} orders at the moment.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      {!showHistory && <TableHead className="text-right">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedOrders.map((order) => (
                      <TableRow key={order.id} className="group">
                        <TableCell>
                          <div className="font-bold text-sm">{order.customerName}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, hh:mm a') : 'Recently'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {order.items?.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')}
                          </div>
                          <div className="text-[10px] font-bold text-accent mt-1 uppercase tracking-tighter">
                            {order.paymentMethod} • ₱{order.totalAmount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={order.status === 'ready' || order.status === 'picked-up' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'} 
                            className="capitalize px-3 py-0.5 text-[10px] rounded-full"
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        {!showHistory && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {order.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  className="h-8 rounded-full text-[10px] bg-primary text-primary-foreground font-bold"
                                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                                >
                                  Accept
                                </Button>
                              )}
                              {order.status === 'preparing' && (
                                <Button 
                                  size="sm" 
                                  className="h-8 rounded-full text-[10px] bg-green-600 hover:bg-green-700 font-bold"
                                  onClick={() => updateOrderStatus(order.id, 'ready')}
                                >
                                  Ready
                                </Button>
                              )}
                              {order.status === 'ready' && (
                                <Button 
                                  size="sm" 
                                  className="h-8 rounded-full text-[10px] bg-blue-600 hover:bg-blue-700 font-bold"
                                  onClick={() => updateOrderStatus(order.id, 'picked-up')}
                                >
                                  Complete
                                </Button>
                              )}
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50"
                                onClick={() => setCancellingOrder(order.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <div className="space-y-6">
            <Card className="border-none shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-accent text-accent-foreground">
                <CardTitle className="font-headline font-bold text-lg">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Button className="w-full rounded-full border-accent text-accent h-12 font-bold justify-between" variant="outline" asChild>
                  <Link href={`/menu?vendor=${user.uid}`}>
                    My Storefront <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button className="w-full rounded-full border-accent text-accent h-12 font-bold justify-between" variant="outline" asChild>
                  <Link href="/profile">
                    Account Settings <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Cancellation Dialog */}
      <Dialog open={!!cancellingOrder} onOpenChange={(open) => !open && setCancellingOrder(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-red-600">Decline Order?</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this order. The customer will see this note.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="cancelNote">Reason (Optional)</Label>
            <Input 
              id="cancelNote" 
              placeholder="e.g. Out of stock, Kitchen too busy..." 
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              className="rounded-xl h-12"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setCancellingOrder(null)} className="rounded-full">Keep Order</Button>
            <Button 
              variant="destructive" 
              onClick={() => cancellingOrder && updateOrderStatus(cancellingOrder, 'cancelled', cancelNote)}
              className="rounded-full px-8 font-bold"
            >
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
