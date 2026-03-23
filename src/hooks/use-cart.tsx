'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { FoodItem, CartItem } from '@/lib/types';
import { useUser } from '@/firebase';

interface CartContextType {
  items: CartItem[];
  addItem: (item: FoodItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Storage key depends on user status to ensure isolation between users
  const cartKey = useMemo(() => {
    return user ? `grubbie_cart_${user.uid}` : 'grubbie_cart_guest';
  }, [user]);

  // Load cart from localStorage whenever the key changes (user logs in/out)
  useEffect(() => {
    setIsLoaded(false);
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
        setItems([]);
      }
    } else {
      setItems([]);
    }
    setIsLoaded(true);
  }, [cartKey]);

  // Save cart to localStorage on change, but only after initial load for that key
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(cartKey, JSON.stringify(items));
    }
  }, [items, cartKey, isLoaded]);

  const addItem = (foodItem: FoodItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === foodItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === foodItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...foodItem, quantity: 1 }];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalCount,
      subtotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
