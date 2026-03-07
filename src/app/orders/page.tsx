
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, Package, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export default function OrdersPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const statusStep = (status: string) => {
    switch(status) {
      case 'pending': return 25;
      case 'preparing': return 50;
      case 'ready': return 75;
      case 'picked-up': return 100;
      default: return 0;
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-secondary/20">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center">
          <p>Loading your orders...</p>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-headline font-bold text-accent mb-8">My Orders</h1>
        
        <div className="space-y-6">
          {MOCK_ORDERS.map((order) => (
            <Card key={order.id} className="border-none shadow-md overflow-hidden bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">#{order.id.toUpperCase()}</p>
                  <CardTitle className="text-lg font-headline font-bold">Ordered from Campus Kitchen</CardTitle>
                </div>
                <Badge variant={order.status === 'ready' ? 'default' : 'secondary'} className="rounded-full px-4 py-1">
                  {order.status.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-8">
                  <div className="flex justify-between mb-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", statusStep(order.status) >= 25 ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
                        <Clock className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase">Placed</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", statusStep(order.status) >= 50 ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
                        <ChefHat className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase">Kitchen</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", statusStep(order.status) >= 75 ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
                        <Package className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase">Ready</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", statusStep(order.status) >= 100 ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase">Done</span>
                    </div>
                  </div>
                  <Progress value={statusStep(order.status)} className="h-1.5" />
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-accent uppercase tracking-wider">Order Items</h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-2 border-b border-dashed last:border-0">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-medium">₱{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-4 font-bold text-lg">
                    <span>Total Paid</span>
                    <span>₱{order.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
