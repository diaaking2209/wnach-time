
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface AppliedCoupon {
    code: string;
    discount: number; // Percentage
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  useEffect(() => {
    // Load cart from local storage on initial render
    try {
      const localCart = localStorage.getItem('wnash-cart');
      if (localCart) {
        setCart(JSON.parse(localCart));
      }
      const localCoupon = localStorage.getItem('wnash-coupon');
      if (localCoupon) {
        setAppliedCoupon(JSON.parse(localCoupon));
      }
    } catch (error) {
      console.error("Failed to parse cart/coupon from localStorage", error);
    }
  }, []);

  useEffect(() => {
    // Save cart to local storage whenever it changes
    localStorage.setItem('wnash-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('wnash-coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('wnash-coupon');
    }
  }, [appliedCoupon]);


  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      const addQuantity = item.quantity || 1;

      if (existingItem) {
        // If item exists, update its quantity
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + addQuantity }
            : cartItem
        );
      } else {
        // If item doesn't exist, add it to the cart
        return [...prevCart, { ...item, quantity: addQuantity }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    removeCoupon();
  };

  const applyCoupon = (coupon: AppliedCoupon) => {
    setAppliedCoupon(coupon);
  }

  const removeCoupon = () => {
    setAppliedCoupon(null);
  }


  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, appliedCoupon, applyCoupon, removeCoupon }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
