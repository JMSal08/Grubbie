"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserRole } from '@/lib/types';
import { ShieldAlert, Users, Store, Flag, ShieldCheck } from 'lucide-react';
import { MOCK_USERS } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

export default function AdminPortal() {
  const [users, setUsers] = useState(MOCK_USERS);
  const { toast } = useToast();

  const handleBlockUser = (id: string, currentlyBlocked: boolean) => {
    setUsers(users.map(u => u.id === id ? { ...u, isBlocked: !currentlyBlocked } : u));
    toast({
      title: currentlyBlocked ? "User Unblocked" : "User Blocked",
      description: `Action applied successfully.`,
      variant: currentlyBlocked ? "default" : "destructive"
    });
  };

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
                <h3 className="text-3xl font-bold">1,240</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <Store className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Active Vendors</p>
                <h3 className="text-3xl font-bold">24</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-red-50">
            <CardContent className="p-6 flex items-center gap-4">
              <Flag className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600 uppercase tracking-wider font-bold">Pending Reports</p>
                <h3 className="text-3xl font-bold text-red-600">8</h3>
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-full">All Roles</Button>
                <Button variant="outline" size="sm" className="rounded-full">Blocked Only</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
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
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-bold">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize px-3">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isBlocked ? (
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
                      <Button 
                        variant={user.isBlocked ? "outline" : "destructive"} 
                        size="sm" 
                        className="rounded-full"
                        onClick={() => handleBlockUser(user.id, user.isBlocked)}
                      >
                        {user.isBlocked ? "Unblock Account" : "Block Account"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}