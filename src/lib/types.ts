export type UserRole = 'customer' | 'vendor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  avatar?: string;
}

export type FoodCategory = 'Cafeteria' | 'SouthPoint';

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: FoodCategory;
  vendorId: string;
  vendorName: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'picked-up' | 'cancelled';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: Array<{
    foodItemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: OrderStatus;
  scheduledFor?: string;
  paymentMethod: 'gcash' | 'paymaya' | 'cash';
  createdAt: string;
}

export interface Review {
  id: string;
  foodItemId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}