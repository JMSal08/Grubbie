
export type UserRole = 'customer' | 'vendor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  avatar?: string;
  userType?: string;
}

export type FoodCategory = 'Cafeteria' | 'SouthPoint' | 'Other';

export interface Vendor {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: FoodCategory;
  rating: number;
  reviewsCount: number;
  location: string;
  isOnline: boolean;
}

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
  preparationTime?: number;
  preparationTimeUnit?: 'mins' | 'hours';
  menuTypeId?: string;
}

export interface CartItem extends FoodItem {
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'picked-up' | 'cancelled';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  vendorName: string;
  items: Array<{
    foodItemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: OrderStatus;
  scheduledPickupDateTime: string;
  orderDateTime: any;
  paymentMethod: string;
  paymentStatus: string;
  cancellationNote?: string;
  receiptUrl?: string;
  createdAt: any;
  updatedAt: any;
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
