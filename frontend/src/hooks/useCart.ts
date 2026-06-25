'use client';

import { useState, useEffect } from 'react';
import localforage from 'localforage';

export interface ProductInfo {
  _id: string;
  sku: string;
  name: string;
  wholesalePrice: number;
  stockQuantity: number;
  unit: string;
  category: string;
}

export interface CartItem {
  product: ProductInfo;
  quantity: number;
}

const CART_STORAGE_KEY = 'kirana-wholesale-active-cart';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart from localforage on mount
  useEffect(() => {
    async function loadCart() {
      try {
        const savedCart = await localforage.getItem<CartItem[]>(CART_STORAGE_KEY);
        if (savedCart) {
          setCartItems(savedCart);
        }
      } catch (err) {
        console.error('Error loading cart from localforage:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, []);

  // Save cart to localforage whenever it changes
  const saveCart = async (newCart: CartItem[]) => {
    setCartItems(newCart);
    try {
      await localforage.setItem(CART_STORAGE_KEY, newCart);
    } catch (err) {
      console.error('Error saving cart to localforage:', err);
    }
  };

  const addToCart = (product: ProductInfo, quantity: number = 1) => {
    const existingIndex = cartItems.findIndex((item) => item.product._id === product._id);
    let newCart = [...cartItems];

    if (existingIndex > -1) {
      const newQuantity = newCart[existingIndex].quantity + quantity;
      // Cap at stock quantity if available
      newCart[existingIndex].quantity = Math.min(newQuantity, product.stockQuantity);
    } else {
      newCart.push({ product, quantity: Math.min(quantity, product.stockQuantity) });
    }

    saveCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = cartItems.filter((item) => item.product._id !== productId);
    saveCart(newCart);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const newCart = cartItems.map((item) => {
      if (item.product._id === productId) {
        return {
          ...item,
          quantity: Math.min(quantity, item.product.stockQuantity),
        };
      }
      return item;
    });

    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.product.wholesalePrice * item.quantity,
    0
  );

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    loading,
  };
}
