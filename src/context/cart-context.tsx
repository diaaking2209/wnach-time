
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/components/product-card';

export interface CartItem {
  id: string; // This will be the product_id from the database perspective
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
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();
  const { toast } = useToast();

  const fetchCart = useCallback(async () => {
    if (!session || !user) {
        setCart([]);
        setLoading(false);
        return;
    };
    
    setLoading(true);
    try {
        const { data: cartData, error } = await supabase
            .from('cart_items')
            .select(`
                quantity,
                products (
                    id,
                    name,
                    price,
                    image_url
                )
            `)
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        const fetchedCart: CartItem[] = cartData
            .filter(item => item.products) // Ensure product data exists
            .map(item => ({
                id: (item.products as Product).id!,
                name: (item.products as Product).name,
                price: (item.products as Product).price,
                imageUrl: (item.products as Product).imageUrl,
                quantity: item.quantity,
            }));

        setCart(fetchedCart);

    } catch (error: any) {
        console.error("Error fetching cart:", error.message);
        toast({ variant: "destructive", title: "Error", description: "Could not load your cart." });
    } finally {
        setLoading(false);
    }
  }, [user, session, toast]);

  useEffect(() => {
    fetchCart();
    // Load coupon from local storage on initial render (coupon can remain local)
    try {
      const localCoupon = localStorage.getItem('wnash-coupon');
      if (localCoupon) {
        setAppliedCoupon(JSON.parse(localCoupon));
      }
    } catch (error) {
      console.error("Failed to parse coupon from localStorage", error);
    }
  }, [fetchCart]);

  useEffect(() => {
    // Save coupon to local storage whenever it changes
    if (appliedCoupon) {
      localStorage.setItem('wnash-coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('wnash-coupon');
    }
  }, [appliedCoupon]);


  const addToCart = async (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Please sign in', description: 'You must be signed in to add items to your cart.' });
        return;
    }
    const addQuantity = item.quantity || 1;
    
    // Optimistic UI update
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if(existingItem) {
        // Just update quantity locally, DB function handles logic
        setCart(prev => prev.map(cartItem => cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + addQuantity } : cartItem));
    } else {
        setCart(prev => [...prev, {...item, quantity: addQuantity}]);
    }

    const { error } = await supabase.rpc('add_to_cart', {
        p_user_id: user.id,
        p_product_id: item.id,
        p_quantity: addQuantity
    });

    if (error) {
        console.error('Error adding to cart:', error.message);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add item to cart.' });
        // Revert UI change on error by refetching from DB
        fetchCart();
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    // Optimistic UI update
    const prevCart = cart;
    setCart(currentCart => currentCart.filter(item => item.id !== productId));

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .match({ user_id: user.id, product_id: productId });

    if (error) {
      console.error('Error removing from cart:', error.message);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not remove item from cart.' });
      setCart(prevCart); // Revert
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Optimistic UI Update
    const prevCart = cart;
    setCart(currentCart => currentCart.map(item => item.id === productId ? { ...item, quantity } : item));

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: quantity })
      .match({ user_id: user.id, product_id: productId });

    if (error) {
      console.error('Error updating quantity:', error.message);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update item quantity.' });
      setCart(prevCart); // Revert
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    // Optimistic UI update
    const prevCart = cart;
    setCart([]);

    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error('Error clearing cart:', error.message);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not clear your cart.' });
        setCart(prevCart); // Revert
    }

    removeCoupon();
  };

  const applyCoupon = (coupon: AppliedCoupon) => {
    setAppliedCoupon(coupon);
  }

  const removeCoupon = () => {
    setAppliedCoupon(null);
  }


  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, appliedCoupon, applyCoupon, removeCoupon, loading }}>
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
