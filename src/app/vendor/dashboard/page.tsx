"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { 
  BarChart3, 
  Package, 
  Settings, 
  Plus, 
  Check, 
  Clock, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-accent">Campus Kitchen</h1>
            <p className="text-muted-foreground">Managing your food hub operations</p>
          </div>
          <div className="flex gap-3">
            <Button className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> Add Item
            </Button>
            <Button variant="outline" className="rounded-full gap-2 border-accent text-accent">
              <Settings className="h-4 w-4" /> Settings
            </Button>
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
                <p className="text-sm text-muted-foreground">New Orders</p>
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
                <p className="text-sm text-muted-foreground">Preparing</p>
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
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
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
                <p className="text-sm text-muted-foreground">Reports</p>
                <h3 className="text-2xl font-bold">1</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Orders */}
          <Card className="lg:col-span-2 border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle className="font-headline font-bold">Live Orders</CardTitle>
                <CardDescription>Updates status in real-time</CardDescription>
              </div>
              <Button variant="ghost" className="text-primary font-bold">View History</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
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
                        <Badge variant="secondary" className="capitalize">
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
                <Button className="w-full rounded-full variant-outline border-accent text-accent mt-4">
                  View Full Analytics <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-red-800 text-lg font-bold">Flagged Customer</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <p className="text-sm text-red-700">Vendor reported unruly behavior for user <b>@johndoe123</b> regarding order #ORD-X2.</p>
                <Button variant="destructive" size="sm" className="rounded-full">Review Report</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

import { format } from 'date-fns';