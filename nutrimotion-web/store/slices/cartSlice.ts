/**
 * Cart Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Cart, CartItem } from '@/types/commerce';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    fetchCartRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchCartSuccess: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchCartFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addToCartRequest: (
      state,
      action: PayloadAction<{
        itemType: CartItem['itemType'];
        itemId: string;
        name: string;
        price: number;
        quantity: number;
        imageUrl?: string;
        packageDetails?: CartItem['packageDetails'];
      }>
    ) => {
      state.isLoading = true;
      state.error = null;
    },
    addToCartSuccess: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addToCartFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    removeFromCartRequest: (state, action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
    },
    removeFromCartSuccess: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    removeFromCartFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateCartItemRequest: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      state.isLoading = true;
      state.error = null;
    },
    updateCartItemSuccess: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    updateCartItemFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    applyDiscountRequest: (state, action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
    },
    applyDiscountSuccess: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    applyDiscountFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearCart: (state) => {
      state.cart = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  fetchCartRequest,
  fetchCartSuccess,
  fetchCartFailure,
  addToCartRequest,
  addToCartSuccess,
  addToCartFailure,
  removeFromCartRequest,
  removeFromCartSuccess,
  removeFromCartFailure,
  updateCartItemRequest,
  updateCartItemSuccess,
  updateCartItemFailure,
  applyDiscountRequest,
  applyDiscountSuccess,
  applyDiscountFailure,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
