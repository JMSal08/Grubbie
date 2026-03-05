import { FoodItem, User, Order } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'customer', isBlocked: false },
  { id: '2', name: 'Campus Kitchen', email: 'vendor@kitchen.com', role: 'vendor', isBlocked: false },
  { id: '3', name: 'Super Admin', email: 'admin@grubbie.com', role: 'admin', isBlocked: false },
];

export const MOCK_FOOD: FoodItem[] = [
  {
    id: 'f1',
    name: 'Classic Cheeseburger',
    description: 'Quarter pounder with real cheddar and fresh lettuce.',
    price: 120,
    category: 'Cafeteria',
    vendorId: '2',
    vendorName: 'Campus Kitchen',
    imageUrl: 'https://picsum.photos/seed/burger/600/400',
    rating: 4.5,
    reviewsCount: 12
  },
  {
    id: 'f2',
    name: 'Pasta Carbonara',
    description: 'Authentic creamy sauce with parmesan and bacon bits.',
    price: 150,
    category: 'Cafeteria',
    vendorId: '2',
    vendorName: 'Campus Kitchen',
    imageUrl: 'https://picsum.photos/seed/pasta/600/400',
    rating: 4.2,
    reviewsCount: 8
  },
  {
    id: 'f3',
    name: 'Pepperoni Feast',
    description: 'Double cheese, double pepperoni, thin crust pizza.',
    price: 280,
    category: 'SouthPoint',
    vendorId: 'v2',
    vendorName: 'Outside Pizza Hub',
    imageUrl: 'https://picsum.photos/seed/pizza/600/400',
    rating: 4.8,
    reviewsCount: 45
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord1',
    customerId: '1',
    customerName: 'John Doe',
    items: [{ foodItemId: 'f1', name: 'Classic Cheeseburger', quantity: 2, price: 120 }],
    total: 240,
    status: 'preparing',
    paymentMethod: 'gcash',
    createdAt: new Date().toISOString()
  }
];