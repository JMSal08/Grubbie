
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Trash2, Minus, Plus, CreditCard, Banknote, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { format, isSameDay, isBefore, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, collectionGroup, query, serverTimestamp } from 'firebase/firestore';
import { useCart } from '@/hooks/use-cart';

export default function CartPage() {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>('');
  const [payment, setPayment] = useState('cash');
  const [now, setNow] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const isVendor = userData?.userType === 'vendor';

  // Get unique vendor IDs from the cart to check payment support
  const vendorIdsInCart = useMemo(() => 
    Array.from(new Set(items.map(item => item.vendorId))), 
    [items]
  );

  // Fetch all vendor profiles to check for QR codes
  const vendorProfilesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collectionGroup(db, 'vendorProfile'));
  }, [db]);

  const { data: allVendorProfiles, isLoading: isProfilesLoading } = useCollection(vendorProfilesQuery);

  // Determine if GCash/Maya are supported by ALL vendors in the current cart
  const paymentSupport = useMemo(() => {
    if (!allVendorProfiles || vendorIdsInCart.length === 0) return { gcash: false, maya: false };

    const relevantProfiles = allVendorProfiles.filter(p => vendorIdsInCart.includes(p.userId));
    
    // We need to have found all profiles to be sure
    if (relevantProfiles.length < vendorIdsInCart.length && !isProfilesLoading) {
      // Some vendors might not have profiles yet or are missing
      return { gcash: false, maya: false };
    }

    const gcashSupported = relevantProfiles.length > 0 && relevantProfiles.every(p => !!p.gcashQrUrl);
    const mayaSupported = relevantProfiles.length > 0 && relevantProfiles.every(p => !!p.mayaQrUrl);

    return { gcash: gcashSupported, maya: mayaSupported };
  }, [allVendorProfiles, vendorIdsInCart, isProfilesLoading]);

  // Reset payment method if it becomes unsupported
  useEffect(() => {
    if (payment === 'gcash' && !paymentSupport.gcash) setPayment('cash');
    if (payment === 'paymaya' && !paymentSupport.maya) setPayment('cash');
  }, [paymentSupport, payment]);

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const isTimeInPast = useMemo(() => {
    if (!now || !date || !time) return false;
    if (!isSameDay(date, now)) return false;
    
    const [hours, minutes] = time.split(':').map(Number);
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    return isBefore(selectedDateTime, now);
  }, [date, time, now]);

  const handleCheckout = async () => {
    if (items.length === 0 || !date || !time || isTimeInPast || !user || !db) return;
    
    setIsSubmitting(true);
    
    try {
      // Group items by vendor
      const vendorsInCart = Array.from(new Set(items.map(i => i.vendorId)));
      
      const scheduledDateTime = new Date(date);
      const [h, m] = time.split(':').map(Number);
      scheduledDateTime.setHours(h, m, 0, 0);

      vendorsInCart.forEach(vId => {
        const vendorItems = items.filter(i => i.vendorId === vId);
        const vendorTotal = vendorItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        
        const orderId = doc(collection(db, 'orders')).id;
        const orderRef = doc(db, 'orders', orderId);

        const orderData = {
          id: orderId,
          customerId: user.uid,
          customerName: userData?.firstName ? `${userData.firstName} ${userData.lastName}` : (user.displayName || user.email),
          vendorId: vId,
          vendorName: vendorItems[0].vendorName,
          orderDateTime: serverTimestamp(),
          scheduledPickupDateTime: scheduledDateTime.toISOString(),
          totalAmount: vendorTotal,
          paymentMethod: payment,
          paymentStatus: 'Pending',
          status: 'pending',
          items: vendorItems.map(vi => ({
            foodItemId: vi.id,
            name: vi.name,
            quantity: vi.quantity,
            price: vi.price
          })),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        setDocumentNonBlocking(orderRef, orderData, { merge: true });

        // Add items to subcollection per backend.json schema
        const itemsCol = collection(db, 'orders', orderId, 'orderItems');
        vendorItems.forEach(item => {
          const itemDocId = doc(itemsCol).id;
          const itemDocRef = doc(itemsCol, itemDocId);
          setDocumentNonBlocking(itemDocRef, {
            id: itemDocId,
            orderId: orderId,
            menuItemId: item.id,
            quantity: item.quantity,
            priceAtOrder: item.price,
            notes: ''
          }, { merge: true });
        });
      });

      toast({
        title: "Order Placed!",
        description: `Your pre-order for ${format(date, "PPP")} at ${time} has been sent.`,
      });
      
      clearCart();
      router.push('/orders');
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "There was an error processing your order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen bg-secondary/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-3xl font-headline font-bold text-accent mb-8">Your Cart</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <h3 className="font-headline font-bold text-lg">{item.name}</h3>
                      <p className="font-bold text-accent">₱{item.price * item.quantity}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.vendorName}</p>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center border rounded-full px-2 py-1 bg-secondary/30">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-3 text-sm font-bold">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive h-8 w-8"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {items.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
                <p className="text-muted-foreground mb-4">Your cart is empty.</p>
                {!isVendor && (
                  <Button variant="default" asChild className="rounded-full px-8">
                    <Link href="/menu">Browse Menu</Link>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Checkout Details */}
          <div className="space-y-6">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-accent text-accent-foreground">
                <CardTitle className="text-xl font-headline">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₱{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Fee</span>
                    <span className="font-medium">₱0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-accent">
                    <span>Total</span>
                    <span>₱{subtotal}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold">Schedule Pickup</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12 rounded-xl px-3",
                            !date && "text-muted-foreground",
                            date && now && isBefore(date, startOfToday()) && "border-destructive"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">{date ? format(date, "MMM d, yyyy") : "Date"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={{ before: now || new Date() }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className={cn(
                          "h-12 rounded-xl pl-10 bg-white cursor-pointer input-picker-full",
                          isTimeInPast && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                    </div>
                  </div>
                  {isTimeInPast && (
                    <p className="text-[10px] text-destructive font-bold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Pickup time must be in the future.
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold">Payment Method</Label>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/50 border-none">
                      Vendor Options
                    </Badge>
                  </div>
                  <RadioGroup value={payment} onValueChange={setPayment} className="grid grid-cols-1 gap-3">
                    {/* GCash Option */}
                    <div className={cn(
                      "flex items-center space-x-3 rounded-xl border p-4 transition-colors",
                      !paymentSupport.gcash ? "opacity-50 cursor-not-allowed bg-muted/10" : "cursor-pointer hover:bg-secondary/20 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    )}>
                      <RadioGroupItem value="gcash" id="gcash" disabled={!paymentSupport.gcash} />
                      <Label htmlFor="gcash" className={cn("flex-1 flex items-center justify-between", !paymentSupport.gcash ? "cursor-not-allowed" : "cursor-pointer")}>
                        <div className="flex items-center gap-3">
                          <CreditCard className={cn("h-5 w-5", paymentSupport.gcash ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("font-bold", !paymentSupport.gcash && "text-muted-foreground")}>GCash</span>
                        </div>
                        {!paymentSupport.gcash && <span className="text-[10px] font-bold text-red-500 uppercase">Unavailable</span>}
                      </Label>
                    </div>

                    {/* PayMaya Option */}
                    <div className={cn(
                      "flex items-center space-x-3 rounded-xl border p-4 transition-colors",
                      !paymentSupport.maya ? "opacity-50 cursor-not-allowed bg-muted/10" : "cursor-pointer hover:bg-secondary/20 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    )}>
                      <RadioGroupItem value="paymaya" id="paymaya" disabled={!paymentSupport.maya} />
                      <Label htmlFor="paymaya" className={cn("flex-1 flex items-center justify-between", !paymentSupport.maya ? "cursor-not-allowed" : "cursor-pointer")}>
                        <div className="flex items-center gap-3">
                          <CreditCard className={cn("h-5 w-5", paymentSupport.maya ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("font-bold", !paymentSupport.maya && "text-muted-foreground")}>PayMaya</span>
                        </div>
                        {!paymentSupport.maya && <span className="text-[10px] font-bold text-red-500 uppercase">Unavailable</span>}
                      </Label>
                    </div>

                    {/* Cash Option */}
                    <div className="flex items-center space-x-3 rounded-xl border p-4 cursor-pointer hover:bg-secondary/20 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex-1 flex items-center gap-3 cursor-pointer">
                        <Banknote className="h-5 w-5 text-primary" />
                        <span className="font-bold">Cash on Pickup</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button 
                  onClick={handleCheckout} 
                  className="w-full h-14 rounded-full text-lg font-bold shadow-lg" 
                  disabled={items.length === 0 || !date || !time || isTimeInPast || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Confirm Order
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
