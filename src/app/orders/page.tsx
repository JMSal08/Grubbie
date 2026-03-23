"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Package, ChefHat, History, LayoutList, Loader2, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Order } from '@/lib/types';
import { format } from 'date-fns';

export default function OrdersPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'orders'), 
      where('customerId', '==', user.uid)
    );
  }, [db, user]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

  const { liveOrders, historyOrders } = useMemo(() => {
    if (!orders) return { liveOrders: [], historyOrders: [] };
    
    // Sort manually since we aren't using a composite index for createdAt/customerId yet
    const sorted = [...orders].sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });

    return {
      liveOrders: sorted.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)),
      historyOrders: sorted.filter(o => ['picked-up', 'cancelled'].includes(o.status))
    };
  }, [orders]);

  const statusStep = (status: string) => {
    switch(status) {
      case 'pending': return 25;
      case 'preparing': return 50;
      case 'ready': return 75;
      case 'picked-up': return 100;
      default: return 0;
    }
  };

  const displayedOrders = showHistory ? historyOrders : liveOrders;

  if (isUserLoading || isOrdersLoading) {
    return (
      <div className="min-h-screen bg-secondary/20">
        <Navbar />
        <main className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Syncing your orders...</p>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-accent">My Orders</h1>
            <p className="text-muted-foreground">Track your campus meals in real-time</p>
          </div>
          <div className="flex bg-white rounded-full p-1 shadow-sm border">
            <Button 
              variant={!showHistory ? "default" : "ghost"} 
              size="sm" 
              className="rounded-full gap-2 px-6"
              onClick={() => setShowHistory(false)}
            >
              <LayoutList className="h-4 w-4" />
              Live Orders
            </Button>
            <Button 
              variant={showHistory ? "default" : "ghost"} 
              size="sm" 
              className="rounded-full gap-2 px-6"
              onClick={() => setShowHistory(true)}
            >
              <History className="h-4 w-4" />
              History
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
          {displayedOrders.length === 0 ? (
            <Card className="border-none shadow-sm bg-white p-12 text-center">
              <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <Info className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground font-medium">No {showHistory ? 'past' : 'live'} orders found.</p>
              {!showHistory && (
                <Button variant="link" asChild className="mt-2 text-primary">
                  <a href="/menu">Discover Dining Spots</a>
                </Button>
              )}
            </Card>
          ) : (
            displayedOrders.map((order) => (
              <Card key={order.id} className="border-none shadow-md overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Order ID: {order.id.substring(0, 8)}</p>
                    <CardTitle className="text-lg font-headline font-bold text-accent">
                      {order.vendorName || 'Campus Kitchen'}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      Scheduled: {order.scheduledPickupDateTime ? format(new Date(order.scheduledPickupDateTime), 'MMM d, h:mm a') : 'Not scheduled'}
                    </div>
                  </div>
                  <Badge 
                    variant={order.status === 'ready' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'} 
                    className="rounded-full px-4 py-1 capitalize"
                  >
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-6">
                  {order.status === 'cancelled' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-bold text-red-900 mb-1">Reason for Cancellation</h5>
                        <p className="text-sm text-red-800 leading-relaxed">
                          {order.cancellationNote || "The vendor has cancelled this order without providing a specific reason."}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.status !== 'cancelled' && order.status !== 'picked-up' && (
                    <div className="mb-8">
                      <div className="flex justify-between mb-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", statusStep(order.status) >= 25 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                            <Clock className="h-5 w-5" />
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-tighter">Placed</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", statusStep(order.status) >= 50 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                            <ChefHat className="h-5 w-5" />
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-tighter">Kitchen</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", statusStep(order.status) >= 75 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                            <Package className="h-5 w-5" />
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-tighter">Ready</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", statusStep(order.status) >= 100 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-tighter">Picked Up</span>
                        </div>
                      </div>
                      <Progress value={statusStep(order.status)} className="h-1.5" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-bold text-[10px] text-accent uppercase tracking-widest border-b pb-1">Order Summary</h4>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1 border-b border-dashed last:border-0">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">₱{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-4 font-bold text-lg text-accent">
                      <span>Total</span>
                      <span>₱{order.totalAmount}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex justify-between uppercase font-bold mt-2">
                      <span>Method: {order.paymentMethod}</span>
                      <span>Ordered: {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Recently'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
